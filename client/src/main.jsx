import { StrictMode, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, BookOpen, ChevronLeft, Clock3, Feather, LockKeyhole, PenLine, Pencil, Trash2, X } from 'lucide-react';
import './styles.css';

const formatDate = (date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
const formatTime = (date) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(date));
const readingTime = (content = '') => `${Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 220))} min read`;
const newestFirst = (items) => [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
const apiUrl = (path) => `${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}${path}`;

function App() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const heroArtRef = useRef(null);

  const moveHeroArt = (event) => {
    const element = heroArtRef.current;
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    element.style.setProperty('--pointer-x', `${x.toFixed(3)}`);
    element.style.setProperty('--pointer-y', `${y.toFixed(3)}`);
  };

  const resetHeroArt = () => {
    heroArtRef.current?.style.setProperty('--pointer-x', '0');
    heroArtRef.current?.style.setProperty('--pointer-y', '0');
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/posts'));
      if (!response.ok) throw new Error(`The blog API returned ${response.status}. Check VITE_API_URL.`);
      setPosts(newestFirst(await response.json()));
    } catch (loadError) {
      setErrorMessage(loadError.message);
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
        <a className="brand" href="#top" onClick={() => setSelectedPost(null)}><span className="brand-mark"><Feather size={17} /></span><span>RJ Flex<span className="brand-dot">.</span></span></a>
        <nav className="main-nav"><a href="#journal">Journal</a><a href="#about">About</a></nav>
        <div className="header-actions"><button className="admin-button" onClick={() => setShowAdmin(true)}><PenLine size={15} /> Write a post</button></div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy"><p className="eyebrow">Rohit's personal journal</p><h1>Thoughts,<br /><em>without filters.</em></h1><p className="hero-intro">Hi, I am Rohit. This is where I share my thoughts, opinions, and everyday observations with as few filters as possible.</p><a className="text-link" href="#journal">Read my latest thoughts <ArrowUpRight size={16} /></a></div>
          <div className="hero-art" ref={heroArtRef} onPointerMove={moveHeroArt} onPointerLeave={resetHeroArt} onPointerCancel={resetHeroArt}><div className="art-sun"></div><div className="art-line line-one"></div><div className="art-line line-two"></div><div className="art-label">vol. 01 <span>·</span> 2026</div><div className="art-caption">Move through<br />the margins</div></div>
        </section>

        <section className="journal-section" id="journal">
          <div className="section-heading"><div><p className="eyebrow">The latest</p><h2>From the journal</h2></div><span className="issue-count">{String(posts.length).padStart(2, '0')} entries</span></div>
          {loading ? <div className="loading-state">Gathering the latest notes...</div> : errorMessage ? <div className="loading-state">{errorMessage}</div> : featured ? <>
            <article className="featured-post" onClick={() => setSelectedPost(featured)}><div className="featured-body"><div className="featured-label">Editor's pick <span>01</span></div><div className="post-meta"><span>{featured.category}</span><span>{formatDate(featured.createdAt)} · {formatTime(featured.createdAt)}</span></div><h3>{featured.title}</h3><p>{featured.excerpt}</p><div className="post-footer"><span>By {featured.author}</span><span className="read-more">Read story <ArrowUpRight size={15} /></span></div></div></article>
            <div className="post-grid">{latest.map((post, index) => <PostCard key={post._id} post={post} index={index + 2} onClick={() => setSelectedPost(post)} />)}</div>
          </> : <div className="loading-state">No entries yet. Open the writing desk to publish one.</div>}
        </section>

        <section className="manifesto" id="about"><div className="manifesto-mark"><BookOpen size={27} strokeWidth={1.5} /></div><div><p className="eyebrow">A note from Rohit</p><h2>Honest thoughts,<br /><em>shared respectfully.</em></h2></div><p className="manifesto-copy">I am here to share my point of view, my experiences, and the thoughts that stay with me. My writing may be direct and personal, but the purpose is never to hurt anyone. Please read it as my perspective, not a personal attack, and do not take it personally.</p></section>
      </main>

      <footer className="site-footer"><div className="brand footer-brand"><span className="brand-mark"><Feather size={17} /></span><span>RJ Flex<span className="brand-dot">.</span></span></div><span>Thoughts, honestly shared.</span><span>© 2026 Rohit</span></footer>
      {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
      {showAdmin && <AdminModal posts={posts} onClose={() => setShowAdmin(false)} onSaved={(post, editing) => { setPosts((current) => newestFirst(editing ? current.map((item) => item._id === post._id ? post : item) : [post, ...current])); }} onDeleted={(postId) => { setPosts((current) => current.filter((post) => post._id !== postId)); }} />}
    </div>
  );
}

function PostCard({ post, index, onClick }) {
  return <article className="post-card" onClick={onClick}><div className="card-info"><div className="post-index">{String(index).padStart(2, '0')}</div><div className="post-meta"><span>{post.category}</span><span>{formatDate(post.createdAt)} · {formatTime(post.createdAt)}</span></div><h3>{post.title}</h3><p>{post.excerpt}</p><div className="card-bottom"><span>By {post.author} · {readingTime(post.content)}</span><span className="read-more">Read story <ArrowUpRight size={15} /></span></div></div></article>;
}

function PostModal({ post, onClose }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><article className="post-modal" onMouseDown={(event) => event.stopPropagation()}><button className="close-button" onClick={onClose} aria-label="Close"><X size={19} /></button><div className="modal-kicker">{post.category} <span>·</span> {formatDate(post.createdAt)} at {formatTime(post.createdAt)}</div><h2>{post.title}</h2><p className="modal-excerpt">{post.excerpt}</p><div className="modal-byline">By {post.author} <span>·</span> {readingTime(post.content)}</div><div className="modal-content">{post.content.split('\n').map((paragraph, index) => paragraph && <p key={index}>{paragraph}</p>)}</div><button className="back-link" onClick={onClose}><ChevronLeft size={16} /> Back to journal</button></article></div>;
}

function AdminModal({ posts, onClose, onSaved, onDeleted }) {
  const emptyForm = { password: '', title: '', excerpt: '', content: '', category: 'Field Notes', author: 'Rohit' };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  const getToken = async () => {
    let token = localStorage.getItem('inkwell_admin_token');
    if (token) return token;
    const loginResponse = await fetch(apiUrl('/api/auth/login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: form.password }) });
    const loginData = await loginResponse.json();
    if (!loginResponse.ok) throw new Error(loginData.message);
    localStorage.setItem('inkwell_admin_token', loginData.token);
    return loginData.token;
  };
  const resetForm = () => { setForm(emptyForm); setEditingId(null); setError(''); };
  const editPost = (post) => { setEditingId(post._id); setForm({ password: '', title: post.title, excerpt: post.excerpt, content: post.content, category: post.category, author: post.author }); setError(''); };
  const savePost = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const token = await getToken();
      const response = await fetch(apiUrl(editingId ? `/api/posts/${editingId}` : '/api/posts'), { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      const data = await response.json();
      if (response.status === 401) { localStorage.removeItem('inkwell_admin_token'); throw new Error('Your admin session expired. Enter the password again.'); }
      if (!response.ok) throw new Error(data.message);
      onSaved(data, Boolean(editingId));
      resetForm();
    } catch (saveError) {
      setError(saveError instanceof TypeError ? `Cannot reach the blog API at ${apiUrl('/api/posts')}. Check VITE_API_URL.` : saveError.message);
    } finally { setSaving(false); }
  };
  const deletePost = async (post) => {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    setSaving(true);
    setError('');
    try {
      const token = await getToken();
      const response = await fetch(apiUrl(`/api/posts/${post._id}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (response.status === 401) { localStorage.removeItem('inkwell_admin_token'); throw new Error('Your admin session expired. Enter the password again.'); }
      if (!response.ok) throw new Error(data.message);
      onDeleted(post._id);
      if (editingId === post._id) resetForm();
    } catch (deleteError) { setError(deleteError.message); } finally { setSaving(false); }
  };
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="admin-modal" onMouseDown={(event) => event.stopPropagation()}><div className="admin-header"><div><p className="eyebrow">The writing desk</p><h2>{editingId ? 'Edit post' : 'Publish a new post'}</h2></div><button className="close-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div><form onSubmit={savePost}><label>Admin password<div className="input-with-icon"><LockKeyhole size={15} /><input type="password" value={form.password} onChange={update('password')} placeholder={editingId ? 'Saved session or enter password' : 'Enter password'} /></div></label><div className="form-split"><label>Category<input value={form.category} onChange={update('category')} /></label><label>Author<input value={form.author} onChange={update('author')} /></label></div><label>Title<input value={form.title} onChange={update('title')} placeholder="A title worth keeping" required /></label><label>Short excerpt<textarea value={form.excerpt} onChange={update('excerpt')} rows="2" placeholder="A sentence to draw readers in" required /></label><label>Post content<textarea className="content-input" value={form.content} onChange={update('content')} rows="8" placeholder="Write your story here..." required /></label>{error && <p className="form-error">{error}</p>}<div className="admin-form-actions"><button className="publish-button" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Publish to RJ Flex'} <ArrowUpRight size={16} /></button>{editingId && <button type="button" className="cancel-button" onClick={resetForm}>Cancel edit</button>}</div></form><div className="manage-posts"><div className="manage-heading"><p className="eyebrow">Manage posts</p><span>{posts.length} total</span></div>{posts.map((post) => <div className="manage-row" key={post._id}><div><strong>{post.title}</strong><small>{formatDate(post.createdAt)}</small></div><div className="manage-actions"><button type="button" onClick={() => editPost(post)} aria-label={`Edit ${post.title}`} title="Edit post"><Pencil size={15} /></button><button type="button" className="delete-button" onClick={() => deletePost(post)} aria-label={`Delete ${post.title}`} title="Delete post"><Trash2 size={15} /></button></div></div>)}</div></section></div>;
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
