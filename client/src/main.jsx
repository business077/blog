import { StrictMode, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, BookOpen, ChevronLeft, Clock3, Feather, LockKeyhole, MessageCircle, PenLine, Pencil, Trash2, X } from 'lucide-react';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

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
  const [visitCount, setVisitCount] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const pageRef = useRef(null);

  const trackPagePointer = (event) => {
    document.documentElement.style.setProperty('--cursor-x', `${(event.clientX / window.innerWidth).toFixed(3)}`);
    document.documentElement.style.setProperty('--cursor-y', `${(event.clientY / window.innerHeight).toFixed(3)}`);
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

  useEffect(() => {
    let frame;
    const updateScrollProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        setScrollProgress(maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0);
      });
    };
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', updateScrollProgress); };
  }, []);


  useEffect(() => {
    const sessionKey = 'rj-flex-visit-counted';
    const adminExempt = sessionStorage.getItem('rj-flex-admin-exempt') === 'true';
    const method = adminExempt || sessionStorage.getItem(sessionKey) ? 'GET' : 'POST';
    if (method === 'POST') sessionStorage.setItem(sessionKey, 'true');
    const fetchVisits = (requestMethod = 'GET') => fetch(apiUrl('/api/visits'), { method: requestMethod })
      .then((response) => response.json())
      .then((data) => setVisitCount(data.total));
    fetchVisits(method).catch(() => { if (method === 'POST') sessionStorage.removeItem(sessionKey); });
    const refreshTimer = window.setInterval(() => fetchVisits().catch(() => {}), 15000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  useEffect(() => {
    if (loading || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const context = gsap.context(() => {
      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
      intro.from('.site-header', { y: -28, opacity: 0, duration: .8 })
        .from('.hero-copy > *', { y: 28, opacity: 0, duration: .7, stagger: .1 }, '-=.35')
        .from('.visit-counter', { scale: 0, opacity: 0, duration: .45, ease: 'back.out(2)' }, '-=.45');

      gsap.to('.hero-copy', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 1 } });
      gsap.to('.background-orbits', { scale: 1.12, opacity: .82, ease: 'none', scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 1.5 } });

      gsap.utils.toArray('.journal-section, .manifesto, .newsletter, .site-footer').forEach((section) => {
        gsap.from(section, {
          opacity: 0,
          y: 55,
          duration: .9,
          ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 82%', once: true }
        });
      });

      gsap.utils.toArray('.post-card').forEach((card, index) => {
        gsap.from(card, {
          opacity: 0,
          x: index % 2 ? 35 : -35,
          duration: .7,
          delay: index * .06,
          ease: 'power2.out',
          scrollTrigger: { trigger: card, start: 'top 88%', once: true }
        });
      });

      gsap.to('.art-sun', {
        rotation: 360,
        duration: 18,
        ease: 'none',
        repeat: -1
      });

      gsap.to('.ambient-orb-a', { x: 120, y: 90, scale: 1.25, duration: 10, ease: 'sine.inOut', repeat: -1, yoyo: true });
      gsap.to('.ambient-orb-b', { x: -100, y: -70, scale: .8, duration: 13, ease: 'sine.inOut', repeat: -1, yoyo: true });
      gsap.to('.ambient-orb-c', { x: 80, y: -120, duration: 16, ease: 'sine.inOut', repeat: -1, yoyo: true });
      gsap.to('.ambient-ring', { rotation: 360, duration: 32, ease: 'none', repeat: -1 });
      gsap.to('.ambient-ring-inner', { rotation: -360, duration: 21, ease: 'none', repeat: -1 });
      gsap.to('.ambient-scan', { yPercent: 100, duration: 7, ease: 'none', repeat: -1 });

      gsap.utils.toArray('.main-nav a').forEach((link) => {
        link.addEventListener('mouseenter', () => gsap.to(link, { y: -3, duration: .2, overwrite: true }));
        link.addEventListener('mouseleave', () => gsap.to(link, { y: 0, duration: .2, overwrite: true }));
      });
    }, pageRef);
    return () => context.revert();
  }, [loading]);

  const featured = posts[0];
  const latest = useMemo(() => posts.slice(1), [posts]);

  return (
    <div className="app-shell" ref={pageRef} onPointerMove={trackPagePointer}>
      <div className="scroll-progress" aria-hidden="true"><span style={{ width: `${scrollProgress}%` }}></span></div>
      <div className="visual-atmosphere" aria-hidden="true"><div className="ambient-orb ambient-orb-a"></div><div className="ambient-orb ambient-orb-b"></div><div className="ambient-orb ambient-orb-c"></div><div className="ambient-ring"><div className="ambient-ring-inner"></div></div><div className="background-orbits"><div className="orbit-core"></div><div className="orbit-path orbit-path-one"><i></i></div><div className="orbit-path orbit-path-two"><i></i></div><div className="orbit-path orbit-path-three"><i></i></div></div><div className="energy-ribbons"><i></i><i></i><i></i></div><div className="space-traffic"><div className="rocket rocket-one"><span></span></div><div className="rocket rocket-two"><span></span></div><div className="satellite satellite-one"><span></span></div><div className="tiny-astronaut"><div className="astronaut-bubble">HELLO</div><div className="astronaut-helmet"></div><div className="astronaut-body"></div><div className="astronaut-pack"></div><div className="astronaut-boot boot-one"></div><div className="astronaut-boot boot-two"></div></div><div className="friendly-alien alien-one"><span className="alien-eye eye-one"></span><span className="alien-eye eye-two"></span><span className="alien-antenna antenna-one"></span><span className="alien-antenna antenna-two"></span></div><div className="friendly-alien alien-two"><span className="alien-eye eye-one"></span><span className="alien-eye eye-two"></span><span className="alien-antenna antenna-one"></span><span className="alien-antenna antenna-two"></span></div></div><div className="ambient-scan"></div><div className="ambient-stars">{Array.from({ length: 30 }, (_, index) => <i key={index}></i>)}</div></div>
      <header className="site-header">
        <a className="brand" href="#top" onClick={(event) => { event.preventDefault(); setSelectedPost(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><span className="brand-mark"><Feather size={17} /></span><span>RJ Flex<span className="brand-dot">.</span></span></a>
        <nav className="main-nav"><a href="#journal">Journal</a><a href="#about">About</a><a className="ask-nav-link" href="#ask">Ask Rohit</a></nav>
        <div className="header-actions"><div className="visit-counter" title="Total site visits"><span></span><strong>{visitCount === null ? '—' : visitCount.toLocaleString()}</strong><small>visits</small></div><button className="admin-button" onClick={() => setShowAdmin(true)}><LockKeyhole size={15} /> Admin login</button></div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy"><p className="eyebrow">Rohit's personal journal</p><h1>Thoughts,<br /><em>without filters.</em></h1><p className="hero-intro">Hi, I am Rohit. This is where I share my thoughts, opinions, and everyday observations with as few filters as possible.</p><a className="text-link" href="#journal">Read my latest thoughts <ArrowUpRight size={16} /></a><div className="hero-signal"><span className="signal-live"><i></i> LIVE JOURNAL</span><span>updated as thoughts arrive</span><span className="signal-arrow">↓</span></div></div>
        </section>

        <section className="journal-section" id="journal">
          <div className="section-heading"><div><p className="eyebrow">The latest</p><h2>From the journal</h2></div><span className="issue-count">{String(posts.length).padStart(2, '0')} entries</span></div>
          {loading ? <div className="loading-state">Gathering the latest notes...</div> : errorMessage ? <div className="loading-state">{errorMessage}</div> : featured ? <>
            <article className="featured-post" tabIndex="0" role="button" onClick={() => setSelectedPost(featured)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedPost(featured); }}><div className="featured-body"><div className="featured-label">Editor's pick <span>01</span></div><div className="post-meta"><span>{featured.category}</span><span>{formatDate(featured.createdAt)} · {formatTime(featured.createdAt)}</span></div><h3>{featured.title}</h3><p>{featured.excerpt}</p><div className="post-footer"><span>By {featured.author}</span><span className="read-more">Tap to read <ArrowUpRight size={15} /></span></div></div></article>
            <div className="post-grid">{latest.map((post, index) => <PostCard key={post._id} post={post} index={index + 2} onClick={() => setSelectedPost(post)} />)}</div>
          </> : <div className="loading-state">No entries yet. Open the writing desk to publish one.</div>}
        </section>

        <section className="manifesto" id="about"><div className="manifesto-mark"><BookOpen size={27} strokeWidth={1.5} /></div><div><p className="eyebrow">A note from Rohit</p><h2>Honest thoughts,<br /><em>shared respectfully.</em></h2></div><p className="manifesto-copy">I am here to share my point of view, my experiences, and the thoughts that stay with me. My writing may be direct and personal, but the purpose is never to hurt anyone. Please read it as my perspective, not a personal attack, and do not take it personally.</p></section>
        <AskQuestion />
      </main>

      <footer className="site-footer"><div className="brand footer-brand"><span className="brand-mark"><Feather size={17} /></span><span>RJ Flex<span className="brand-dot">.</span></span></div><span>Thoughts, honestly shared.</span><span>© 2026 Rohit</span></footer>
      {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
      {showAdmin && <AdminModal posts={posts} onClose={() => setShowAdmin(false)} onVisitCountChange={setVisitCount} onSaved={(post, editing) => { setPosts((current) => newestFirst(editing ? current.map((item) => item._id === post._id ? post : item) : [post, ...current])); }} onDeleted={(postId) => { setPosts((current) => current.filter((post) => post._id !== postId)); }} />}
    </div>
  );
}

function PostCard({ post, index, onClick }) {
  const tiltCard = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - .5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - .5) * 2;
    event.currentTarget.style.setProperty('--tilt-x', `${(y * -2).toFixed(2)}deg`);
    event.currentTarget.style.setProperty('--tilt-y', `${(x * 2).toFixed(2)}deg`);
  };
  const resetTilt = (event) => { event.currentTarget.style.setProperty('--tilt-x', '0deg'); event.currentTarget.style.setProperty('--tilt-y', '0deg'); };
  return <article className="post-card" tabIndex="0" role="button" onClick={onClick} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onClick(); }} onPointerMove={tiltCard} onPointerLeave={resetTilt} onPointerCancel={resetTilt}><div className="card-info"><div className="post-index">{String(index).padStart(2, '0')}</div><div className="post-meta"><span>{post.category}</span><span>{formatDate(post.createdAt)} · {formatTime(post.createdAt)}</span></div><h3>{post.title}</h3><p>{post.excerpt}</p><div className="card-bottom"><span>By {post.author} · {readingTime(post.content)}</span><span className="read-more">Tap to read <ArrowUpRight size={15} /></span></div></div></article>;
}

function PostModal({ post, onClose }) {
  const modalRef = useRef(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const element = modalRef.current;
    if (!element) return undefined;
    const updateProgress = () => {
      const available = element.scrollHeight - element.clientHeight;
      setProgress(available ? (element.scrollTop / available) * 100 : 100);
    };
    element.addEventListener('scroll', updateProgress, { passive: true });
    return () => element.removeEventListener('scroll', updateProgress);
  }, []);
  return <div className="modal-backdrop" onMouseDown={onClose}><article className="post-modal" ref={modalRef} onMouseDown={(event) => event.stopPropagation()}><div className="reading-progress"><span style={{ width: `${progress}%` }}></span></div><button className="close-button" onClick={onClose} aria-label="Close"><X size={19} /></button><div className="modal-kicker">{post.category} <span>·</span> {formatDate(post.createdAt)} at {formatTime(post.createdAt)}</div><h2>{post.title}</h2><p className="modal-excerpt">{post.excerpt}</p><div className="modal-byline">By {post.author} <span>·</span> {readingTime(post.content)}</div><div className="modal-content">{post.content.split('\n').map((paragraph, index) => paragraph && <p key={index}>{paragraph}</p>)}</div><button className="back-link" onClick={onClose}><ChevronLeft size={16} /> Back to journal</button></article></div>;
}

function AskQuestion() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setStatus('');
    try {
      const response = await fetch(apiUrl('/api/questions'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage('');
      setStatus(data.message);
    } catch (error) {
      setStatus(error instanceof TypeError ? 'The message could not reach the blog API.' : error.message);
    } finally { setSending(false); }
  };
  return <section className="question-section" id="ask"><div className="question-heading"><MessageCircle size={25} /><div><p className="eyebrow">A quiet channel</p><h2>Ask me anything.<br /><em>Stay anonymous.</em></h2></div></div><p className="question-copy">Leave a question, thought, or point of view. I will be the only one who can see it.</p><form className="question-form" onSubmit={submit}><textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength="2000" rows="4" placeholder="Write your message here..." required /><div className="question-actions"><span>{message.length}/2000 · No name or email required</span><button className="publish-button" disabled={sending}>{sending ? 'Sending...' : 'Send anonymously'} <ArrowUpRight size={16} /></button></div>{status && <p className="question-status">{status}</p>}</form></section>;
}

function AdminModal({ posts, onClose, onVisitCountChange, onSaved, onDeleted }) {
  const emptyForm = { password: '', title: '', excerpt: '', content: '', category: 'Field Notes', author: 'Rohit' };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [authenticated, setAuthenticated] = useState(() => Boolean(localStorage.getItem('inkwell_admin_token')));
  const [loginPassword, setLoginPassword] = useState('');
  const [questions, setQuestions] = useState([]);
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  const login = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch(apiUrl('/api/auth/login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: loginPassword }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      localStorage.setItem('inkwell_admin_token', data.token);
      if (sessionStorage.getItem('rj-flex-visit-counted')) {
        const exemptResponse = await fetch(apiUrl('/api/visits/admin-exempt'), { method: 'POST', headers: { Authorization: `Bearer ${data.token}` } });
        if (exemptResponse.ok) {
          const exemptData = await exemptResponse.json();
          onVisitCountChange(exemptData.total);
          sessionStorage.removeItem('rj-flex-visit-counted');
          sessionStorage.setItem('rj-flex-admin-exempt', 'true');
        }
      } else {
        sessionStorage.setItem('rj-flex-admin-exempt', 'true');
      }
      setAuthenticated(true);
      const questionResponse = await fetch(apiUrl('/api/questions'), { headers: { Authorization: `Bearer ${data.token}` } });
      if (questionResponse.ok) setQuestions(await questionResponse.json());
      setLoginPassword('');
    } catch (loginError) {
      setError(loginError instanceof TypeError ? `Cannot reach the blog API at ${apiUrl('/api/auth/login')}. Check VITE_API_URL.` : loginError.message);
    } finally { setSaving(false); }
  };
  const getToken = async () => {
    let token = localStorage.getItem('inkwell_admin_token');
    if (token) return token;
    const loginResponse = await fetch(apiUrl('/api/auth/login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: form.password }) });
    const loginData = await loginResponse.json();
    if (!loginResponse.ok) throw new Error(loginData.message);
    localStorage.setItem('inkwell_admin_token', loginData.token);
    return loginData.token;
  };
  useEffect(() => {
    if (!authenticated) return undefined;
    const token = localStorage.getItem('inkwell_admin_token');
    if (!token) {
      setAuthenticated(false);
      return undefined;
    }
    fetch(apiUrl('/api/questions'), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (response.status === 401) {
          localStorage.removeItem('inkwell_admin_token');
          setAuthenticated(false);
          return;
        }
        if (response.ok) setQuestions(await response.json());
      })
      .catch(() => {});
    return undefined;
  }, [authenticated]);
  const logout = () => {
    localStorage.removeItem('inkwell_admin_token');
    setAuthenticated(false);
    setQuestions([]);
    resetForm();
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
  if (!authenticated) return <div className="modal-backdrop" onMouseDown={onClose}><section className="admin-modal admin-login-modal" onMouseDown={(event) => event.stopPropagation()}><div className="admin-header"><div><p className="eyebrow">Private access</p><h2>Admin login</h2></div><button className="close-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div><p className="login-copy">Sign in to publish, edit, or delete posts.</p><form onSubmit={login}><label>Password<div className="input-with-icon"><LockKeyhole size={15} /><input autoFocus type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} placeholder="Enter admin password" required /></div></label>{error && <p className="form-error">{error}</p>}<button className="publish-button" disabled={saving}>{saving ? 'Signing in...' : 'Continue to writing desk'} <ArrowUpRight size={16} /></button></form></section></div>;
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="admin-modal" onMouseDown={(event) => event.stopPropagation()}><div className="admin-header"><div><p className="eyebrow">The writing desk</p><h2>{editingId ? 'Edit post' : 'Publish a new post'}</h2></div><div className="admin-header-actions"><button type="button" className="logout-button" onClick={logout}>Log out</button><button className="close-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div></div><form onSubmit={savePost}><div className="form-split"><label>Category<input value={form.category} onChange={update('category')} /></label><label>Author<input value={form.author} onChange={update('author')} /></label></div><label>Title<input value={form.title} onChange={update('title')} placeholder="A title worth keeping" required /></label><label>Short excerpt<textarea value={form.excerpt} onChange={update('excerpt')} rows="2" placeholder="A sentence to draw readers in" required /></label><label>Post content<textarea className="content-input" value={form.content} onChange={update('content')} rows="8" placeholder="Write your story here..." required /></label>{error && <p className="form-error">{error}</p>}<div className="admin-form-actions"><button className="publish-button" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Publish to RJ Flex'} <ArrowUpRight size={16} /></button>{editingId && <button type="button" className="cancel-button" onClick={resetForm}>Cancel edit</button>}</div></form><div className="manage-posts"><div className="manage-heading"><p className="eyebrow">Manage posts</p><span>{posts.length} total</span></div>{posts.map((post) => <div className="manage-row" key={post._id}><div><strong>{post.title}</strong><small>{formatDate(post.createdAt)}</small></div><div className="manage-actions"><button type="button" onClick={() => editPost(post)} aria-label={`Edit ${post.title}`} title="Edit post"><Pencil size={15} /></button><button type="button" className="delete-button" onClick={() => deletePost(post)} aria-label={`Delete ${post.title}`} title="Delete post"><Trash2 size={15} /></button></div></div>)}</div><div className="question-inbox"><div className="manage-heading"><p className="eyebrow">Anonymous inbox</p><span>{questions.length} messages</span></div>{questions.length ? questions.map((question) => <div className="question-row" key={question._id}><p>{question.message}</p><small>{formatDate(question.createdAt)} · {formatTime(question.createdAt)}</small></div>) : <p className="empty-inbox">No anonymous messages yet.</p>}</div></section></div>;
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
