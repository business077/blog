import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, BookOpen, ChevronLeft, Clock3, Feather, LockKeyhole, Menu, PenLine, Search, X } from 'lucide-react';
import './styles.css';

const formatDate = (date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
const formatTime = (date) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(date));
const readingTime = (content = '') => `${Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 220))} min read`;
const newestFirst = (items) => [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
const apiUrl = (path) => `${import.meta.env.VITE_API_URL || ''}${path}`;

function App() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/posts'));
      setPosts(newestFirst(await response.json()));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, []);

  const featured = posts[0];
  const latest = useMemo(() => posts.slice(1), [posts]);

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" onClick={() => setSelectedPost(null)}><span className="brand-mark"><Feather size={17} /></span><span>inkwell<span className="brand-dot">.</span></span></a>
        <nav className="main-nav"><a href="#journal">Journal</a><a href="#about">About</a><a href="#newsletter">Stay awhile</a></nav>
        <div className="header-actions"><button className="icon-button" aria-label="Search"><Search size={18} /></button><button className="admin-button" onClick={() => setShowAdmin(true)}><PenLine size={15} /> Write a post</button><button className="menu-button" aria-label="Open menu"><Menu size={20} /></button></div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy"><p className="eyebrow">A journal for the curious</p><h1>Good thoughts,<br /><em>well kept.</em></h1><p className="hero-intro">Inkwell is a quiet corner of the internet for ideas about making, noticing, and living with intention.</p><a className="text-link" href="#journal">Explore the journal <ArrowUpRight size={16} /></a></div>
          <div className="hero-art"><div className="art-sun"></div><div className="art-line line-one"></div><div className="art-line line-two"></div><div className="art-label">vol. 01 <span>·</span> 2026</div><div className="art-caption">Notes from<br />the margins</div></div>
        </section>

        <section className="journal-section" id="journal">
          <div className="section-heading"><div><p className="eyebrow">The latest</p><h2>From the journal</h2></div><span className="issue-count">{String(posts.length).padStart(2, '0')} entries</span></div>
          {loading ? <div className="loading-state">Gathering the latest notes...</div> : featured ? <>
            <article className="featured-post" onClick={() => setSelectedPost(featured)}><div className="featured-image"><div className="image-number">01</div><div className="image-shape"></div><span>Editor's pick</span></div><div className="featured-body"><div className="post-meta"><span>{featured.category}</span><span>{formatDate(featured.createdAt)} · {formatTime(featured.createdAt)}</span></div><h3>{featured.title}</h3><p>{featured.excerpt}</p><div className="post-footer"><span>By {featured.author}</span><span className="read-more">Read story <ArrowUpRight size={15} /></span></div></div></article>
            <div className="post-grid">{latest.map((post, index) => <PostCard key={post._id} post={post} index={index + 2} onClick={() => setSelectedPost(post)} />)}</div>
          </> : <div className="loading-state">No entries yet. Open the writing desk to publish one.</div>}
        </section>

        <section className="manifesto" id="about"><div className="manifesto-mark"><BookOpen size={27} strokeWidth={1.5} /></div><div><p className="eyebrow">A note from the desk</p><h2>There is still room<br /><em>for a slower internet.</em></h2></div><p className="manifesto-copy">We make space for writing that rewards attention. No hot takes, no hurry, no noise for noise's sake. Just a collection of things worth sitting with.</p></section>
        <section className="newsletter" id="newsletter"><div><p className="eyebrow">The Sunday letter</p><h2>A little something<br /><em>for your inbox.</em></h2></div><form onSubmit={(event) => event.preventDefault()}><label htmlFor="email">Your email address</label><div className="email-row"><input id="email" type="email" placeholder="you@example.com" required /><button type="submit">Subscribe <ArrowUpRight size={16} /></button></div><small>One thoughtful note, occasionally. Unsubscribe anytime.</small></form></section>
      </main>

      <footer className="site-footer"><div className="brand footer-brand"><span className="brand-mark"><Feather size={17} /></span><span>inkwell<span className="brand-dot">.</span></span></div><span>Made for the in-between moments.</span><span>© 2026 Inkwell Journal</span></footer>
      {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
      {showAdmin && <AdminModal onClose={() => setShowAdmin(false)} onPublished={(post) => { setPosts((current) => [post, ...current]); setShowAdmin(false); }} />}
    </div>
  );
}

function PostCard({ post, index, onClick }) {
  return <article className="post-card" onClick={onClick}><div className={`card-art art-${index % 3}`}><span>{String(index).padStart(2, '0')}</span><div></div></div><div className="card-info"><div className="post-meta"><span>{post.category}</span><span>{formatDate(post.createdAt)}</span></div><h3>{post.title}</h3><p>{post.excerpt}</p><div className="card-bottom"><span>{readingTime(post.content)}</span><ArrowUpRight size={16} /></div></div></article>;
}

function PostModal({ post, onClose }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><article className="post-modal" onMouseDown={(event) => event.stopPropagation()}><button className="close-button" onClick={onClose} aria-label="Close"><X size={19} /></button><div className="modal-kicker">{post.category} <span>·</span> {formatDate(post.createdAt)} at {formatTime(post.createdAt)}</div><h2>{post.title}</h2><p className="modal-excerpt">{post.excerpt}</p><div className="modal-byline">By {post.author} <span>·</span> {readingTime(post.content)}</div><div className="modal-content">{post.content.split('\n').map((paragraph, index) => paragraph && <p key={index}>{paragraph}</p>)}</div><button className="back-link" onClick={onClose}><ChevronLeft size={16} /> Back to journal</button></article></div>;
}

function AdminModal({ onClose, onPublished }) {
  const [form, setForm] = useState({ password: '', title: '', excerpt: '', content: '', category: 'Field Notes', author: 'The Inkwell Team' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  const publish = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      let token = localStorage.getItem('inkwell_admin_token');
      if (!token) {
        const loginResponse = await fetch(apiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: form.password })
        });
        const loginData = await loginResponse.json();
        if (!loginResponse.ok) throw new Error(loginData.message);
        token = loginData.token;
        localStorage.setItem('inkwell_admin_token', token);
      }

      const { password, ...postData } = form;
      const response = await fetch(apiUrl('/api/posts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(postData)
      });
      const data = await response.json();
      if (response.status === 401) {
        localStorage.removeItem('inkwell_admin_token');
        throw new Error('Your admin session expired. Please submit again to sign in.');
      }
      if (!response.ok) throw new Error(data.message);
      onPublished(data);
    } catch (publishError) {
      setError(publishError.message);
    } finally {
      setSaving(false);
    }
  };
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="admin-modal" onMouseDown={(event) => event.stopPropagation()}><div className="admin-header"><div><p className="eyebrow">The writing desk</p><h2>Publish a new post</h2></div><button className="close-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div><form onSubmit={publish}><label>Admin password<div className="input-with-icon"><LockKeyhole size={15} /><input type="password" value={form.password} onChange={update('password')} placeholder="Enter password" required /></div></label><div className="form-split"><label>Category<input value={form.category} onChange={update('category')} /></label><label>Author<input value={form.author} onChange={update('author')} /></label></div><label>Title<input value={form.title} onChange={update('title')} placeholder="A title worth keeping" required /></label><label>Short excerpt<textarea value={form.excerpt} onChange={update('excerpt')} rows="2" placeholder="A sentence to draw readers in" required /></label><label>Post content<textarea className="content-input" value={form.content} onChange={update('content')} rows="8" placeholder="Write your story here..." required /></label>{error && <p className="form-error">{error}</p>}<button className="publish-button" disabled={saving}>{saving ? 'Publishing...' : 'Publish to Inkwell'} <ArrowUpRight size={16} /></button></form></section></div>;
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
