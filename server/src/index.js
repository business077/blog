import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Post } from './models/Post.js';

const app = express();
const port = process.env.PORT || 5000;
const jwtSecret = process.env.JWT_SECRET || 'development-only-jwt-secret';
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);
const isAllowedOrigin = (origin) => {
  const normalizedOrigin = origin.replace(/\/$/, '');
  return allowedOrigins.includes(normalizedOrigin)
    || /^https:\/\/[a-z0-9-]+-business077\.vercel\.app$/i.test(normalizedOrigin);
};
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production.');
}
const memoryPosts = [
  {
    _id: 'welcome-to-inkwell',
    title: 'The quiet power of paying attention',
    excerpt: 'A small case for slowing down, looking closer, and making room for the thoughts that arrive between the lines.',
    content: 'The best ideas rarely announce themselves. They arrive while the kettle warms, in the walk home, or at the edge of a page you almost turned.\n\nInkwell is a place for those ideas: essays, field notes, and honest observations about the work of being curious. We believe good writing does not need to shout to stay with you.\n\nTake your time here. Read one thing. Let it follow you into the rest of the day.',
    category: 'Editor\'s Letter',
    author: 'Mara Voss',
    createdAt: '2026-09-12T09:30:00.000Z',
    updatedAt: '2026-09-12T09:30:00.000Z'
  },
  {
    _id: 'making-space',
    title: 'Making space for unfinished work',
    excerpt: 'Why the first draft deserves a room of its own, free from the pressure to already be brilliant.',
    content: 'There is a particular kind of courage in leaving a thought unfinished. It means trusting that clarity is something we can return to, not something we must perform on the first attempt.\n\nThe studio, the notebook, the half-built thing: these are not signs of failure. They are evidence that the work is alive.',
    category: 'Practice',
    author: 'Jon Bell',
    createdAt: '2026-09-08T14:15:00.000Z',
    updatedAt: '2026-09-08T14:15:00.000Z'
  }
];
let useDatabase = false;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || isAllowedOrigin(origin)) return callback(null, true);
    callback(new Error(`CORS blocked origin: ${origin}`));
  }
}));
app.use(express.json());

const sortNewest = (posts) => [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
const postPayload = ({ title, excerpt, content, category, author }) => ({
  title: title?.trim(),
  excerpt: excerpt?.trim(),
  content: content?.trim(),
  category: category?.trim() || 'Field Notes',
  author: author?.trim() || 'The Inkwell Team'
});
const validatePost = (payload) => payload.title && payload.excerpt && payload.content;
const requireAuth = (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required.' });
  try {
    req.admin = jwt.verify(token, jwtSecret);
    next();
  } catch {
    res.status(401).json({ message: 'Your admin session has expired. Please sign in again.' });
  }
};

app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: useDatabase ? 'mongodb' : 'memory' }));

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== (process.env.ADMIN_PASSWORD || 'journalist')) {
    return res.status(401).json({ message: 'That admin password is not correct.' });
  }
  const token = jwt.sign({ role: 'admin' }, jwtSecret, { expiresIn: '8h' });
  res.json({ token, expiresIn: '8h' });
});

app.get('/api/posts', async (_req, res) => {
  try {
    const posts = useDatabase ? await Post.find().sort({ createdAt: -1 }).lean() : sortNewest(memoryPosts);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = useDatabase ? await Post.findById(req.params.id).lean() : memoryPosts.find((item) => item._id === req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(404).json({ message: 'Post not found' });
  }
});

app.post('/api/posts', requireAuth, async (req, res) => {
  const payload = postPayload(req.body);
  if (!validatePost(payload)) {
    return res.status(400).json({ message: 'Title, excerpt, and content are required.' });
  }
  try {
    const post = useDatabase ? await Post.create(payload) : { ...payload, _id: `memory-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    if (!useDatabase) memoryPosts.push(post);
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/posts/:id', requireAuth, async (req, res) => {
  const payload = postPayload(req.body);
  if (!validatePost(payload)) return res.status(400).json({ message: 'Title, excerpt, and content are required.' });
  try {
    if (useDatabase) {
      const post = await Post.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).lean();
      if (!post) return res.status(404).json({ message: 'Post not found.' });
      return res.json(post);
    }
    const postIndex = memoryPosts.findIndex((post) => post._id === req.params.id);
    if (postIndex === -1) return res.status(404).json({ message: 'Post not found.' });
    memoryPosts[postIndex] = { ...memoryPosts[postIndex], ...payload, updatedAt: new Date().toISOString() };
    res.json(memoryPosts[postIndex]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/posts/:id', requireAuth, async (req, res) => {
  try {
    if (useDatabase) {
      const post = await Post.findByIdAndDelete(req.params.id).lean();
      if (!post) return res.status(404).json({ message: 'Post not found.' });
      return res.json({ message: 'Post deleted.' });
    }
    const postIndex = memoryPosts.findIndex((post) => post._id === req.params.id);
    if (postIndex === -1) return res.status(404).json({ message: 'Post not found.' });
    memoryPosts.splice(postIndex, 1);
    res.json({ message: 'Post deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inkwell', { serverSelectionTimeoutMS: 1500 })
  .then(async () => {
    useDatabase = true;
    if (await Post.countDocuments() === 0) {
      await Post.insertMany(memoryPosts.map(({ _id, createdAt, updatedAt, ...post }) => ({ ...post, createdAt, updatedAt })));
    }
    console.log('MongoDB connected');
  })
  .catch(() => console.log('MongoDB unavailable, using in-memory posts for this session'))
  .finally(() => app.listen(port, () => console.log(`API running at http://localhost:${port}`)));
