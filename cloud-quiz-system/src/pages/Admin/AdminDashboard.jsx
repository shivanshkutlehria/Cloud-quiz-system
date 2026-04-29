import { useEffect, useState, useContext } from "react";
import { collection, getDocs, updateDoc, deleteDoc, doc, setDoc, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase/firebase";
import { ToastContext } from "../../context/ToastContext";
import { getAllQuizzes, getQuizAttempts, deleteQuiz } from "../../services/quizService";
import Navbar from "../../components/Navbar";

const NAV = [
  { key: 'overview',      icon: '🏠', label: 'Overview' },
  { key: 'users',         icon: '👥', label: 'Users' },
  { key: 'quizzes',       icon: '📝', label: 'Quizzes' },
  { key: 'flagged',       icon: '🚩', label: 'Flagged' },
  { key: 'announcements', icon: '📢', label: 'Announcements' },
  { key: 'create',        icon: '➕', label: 'Create Teacher' },
  { key: 'analytics',     icon: '📊', label: 'Analytics' },
];

/* ── small reusable stat card ── */
function StatCard({ icon, label, value, color, onClick, alert }) {
  return (
    <div onClick={onClick}
      style={{ background: 'white', borderRadius: '16px', padding: '20px', border: `1px solid ${alert ? '#fca5a5' : '#e2e8f0'}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', cursor: onClick ? 'pointer' : 'default', transition: 'all 0.15s', position: 'relative', overflow: 'hidden' }}
      onMouseEnter={e => onClick && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.transform = 'none', e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)')}
    >
      {alert && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg,#ef4444,#f97316)' }} />}
      <div style={{ fontSize: '26px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '28px', fontWeight: '800', color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeNav, setActiveNav]   = useState('overview');
  const [users, setUsers]           = useState([]);
  const [quizzes, setQuizzes]       = useState([]);
  const [attempts, setAttempts]     = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]       = useState(true);

  // User management filters
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy]         = useState('newest');
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  // Quiz management
  const [quizSearch, setQuizSearch] = useState('');

  // Create teacher
  const [teacherEmail, setTeacherEmail]       = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherName, setTeacherName]         = useState('');
  const [creating, setCreating]               = useState(false);

  // Announcement
  const [annTitle, setAnnTitle]     = useState('');
  const [annBody, setAnnBody]       = useState('');
  const [annType, setAnnType]       = useState('info');
  const [posting, setPosting]       = useState(false);

  const { success, error, warning } = useContext(ToastContext);

  useEffect(() => { loadAll(); }, []);

  // Live announcements
  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [snap, quizzesData, attemptsData] = await Promise.all([
      getDocs(collection(db, 'users')),
      getAllQuizzes().catch(() => []),
      getQuizAttempts().catch(() => []),
    ]);
    setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setQuizzes(quizzesData);
    setAttempts(attemptsData);
    setLoading(false);
  };

  /* ── User actions ── */
  const updateUser = async (userId, data, msg) => {
    await updateDoc(doc(db, 'users', userId), data);
    success(msg, 2000);
    loadAll();
  };

  const deleteUser = async (userId, email) => {
    if (!window.confirm(`Delete "${email}"? Cannot be undone.`)) return;
    await deleteDoc(doc(db, 'users', userId));
    success('User deleted.', 2000);
    loadAll();
  };

  const bulkApprove = async () => {
    if (!selectedUsers.size) return;
    await Promise.all([...selectedUsers].map(id => updateDoc(doc(db, 'users', id), { approved: true })));
    success(`Approved ${selectedUsers.size} users.`, 2000);
    setSelectedUsers(new Set());
    loadAll();
  };

  const bulkDelete = async () => {
    if (!selectedUsers.size) return;
    if (!window.confirm(`Delete ${selectedUsers.size} users?`)) return;
    await Promise.all([...selectedUsers].map(id => deleteDoc(doc(db, 'users', id))));
    success(`Deleted ${selectedUsers.size} users.`, 2000);
    setSelectedUsers(new Set());
    loadAll();
  };

  const toggleSelect = (id) => {
    setSelectedUsers(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const selectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  /* ── Quiz actions ── */
  const handleDeleteQuiz = async (quizId, title) => {
    if (!window.confirm(`Delete quiz "${title}"?`)) return;
    try {
      await deleteQuiz(quizId);
      success('Quiz deleted.', 2000);
      loadAll();
    } catch (err) { error(err.message, 4000); }
  };

  /* ── Create teacher ── */
  const createTeacher = async (e) => {
    e.preventDefault();
    if (!teacherEmail || !teacherPassword) { warning('Fill all fields', 3000); return; }
    setCreating(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, teacherEmail, teacherPassword);
      await setDoc(doc(db, 'users', cred.user.uid), {
        email: teacherEmail, name: teacherName || '', role: 'teacher', approved: true, createdAt: Date.now(),
      });
      success('Teacher created!', 3000);
      setTeacherEmail(''); setTeacherPassword(''); setTeacherName('');
      loadAll();
    } catch (err) { error(err.message, 4000); }
    finally { setCreating(false); }
  };

  /* ── Announcements ── */
  const postAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annBody.trim()) { warning('Fill title and message', 3000); return; }
    setPosting(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        title: annTitle, body: annBody, type: annType,
        createdAt: serverTimestamp(), createdBy: auth.currentUser?.uid,
      });
      success('Announcement posted!', 2000);
      setAnnTitle(''); setAnnBody('');
    } catch (err) { error(err.message, 4000); }
    finally { setPosting(false); }
  };

  const deleteAnnouncement = async (id) => {
    await deleteDoc(doc(db, 'announcements', id));
    success('Deleted.', 1500);
  };

  /* ── Derived ── */
  const students = users.filter(u => u.role === 'student');
  const teachers = users.filter(u => u.role === 'teacher');
  const admins   = users.filter(u => u.role === 'admin');
  const pending  = users.filter(u => !u.approved && u.role !== 'admin'); // both students AND teachers
  const pendingStudents = students.filter(u => !u.approved);
  const pendingTeachers = teachers.filter(u => !u.approved);
  const flagged  = attempts.filter(a => a.suspiciousActivity);
  const avgScore = attempts.length
    ? (attempts.reduce((s, a) => s + (a.score / a.total) * 100, 0) / attempts.length).toFixed(1)
    : '—';
  const passRate = attempts.length
    ? ((attempts.filter(a => (a.score / a.total) >= 0.5).length / attempts.length) * 100).toFixed(1)
    : '—';

  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === 'newest') return (b.createdAt || 0) - (a.createdAt || 0);
    if (sortBy === 'oldest') return (a.createdAt || 0) - (b.createdAt || 0);
    if (sortBy === 'email')  return (a.email || '').localeCompare(b.email || '');
    return 0;
  });

  const filteredUsers = sortedUsers.filter(u => {
    const matchSearch = !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.name?.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || (statusFilter === 'approved' ? u.approved : !u.approved);
    return matchSearch && matchRole && matchStatus;
  });

  const filteredQuizzes = quizzes.filter(q =>
    !quizSearch || q.title?.toLowerCase().includes(quizSearch.toLowerCase()) || q.topic?.toLowerCase().includes(quizSearch.toLowerCase())
  );

  const roleBadge = (role) => {
    const map = { admin: ['#7c3aed','#ede9fe'], teacher: ['#0369a1','#dbeafe'], student: ['#15803d','#dcfce7'] };
    const [color, bg] = map[role] || ['#64748b','#f1f5f9'];
    return <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', color, background: bg }}>{role.toUpperCase()}</span>;
  };

  const annColors = { info: ['#3b82f6','#dbeafe'], warning: ['#f59e0b','#fef9c3'], success: ['#10b981','#dcfce7'], danger: ['#ef4444','#fee2e2'] };

  return (
    <>
      <Navbar />
      <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ width: '220px', flexShrink: 0, background: '#0f172a', display: 'flex', flexDirection: 'column', padding: '16px 10px', gap: '2px', overflowY: 'auto' }}>
          <div style={{ padding: '14px 10px 18px', borderBottom: '1px solid #1e293b', marginBottom: '8px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '10px' }}>🛡️</div>
            <div style={{ color: 'white', fontWeight: '800', fontSize: '14px' }}>Admin Panel</div>
            <div style={{ color: '#475569', fontSize: '11px', marginTop: '2px' }}>{users.length} users · {quizzes.length} quizzes</div>
          </div>

          {NAV.map(item => (
            <button key={item.key} onClick={() => setActiveNav(item.key)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: activeNav === item.key ? '#1e293b' : 'transparent', border: activeNav === item.key ? '1px solid #334155' : '1px solid transparent', color: activeNav === item.key ? 'white' : '#64748b', fontSize: '13px', fontWeight: activeNav === item.key ? '700' : '500', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s' }}
              onMouseEnter={e => { if (activeNav !== item.key) e.currentTarget.style.background = '#1e293b40'; }}
              onMouseLeave={e => { if (activeNav !== item.key) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: '15px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.key === 'users'    && pending.length > 0  && <span style={{ background: '#f59e0b', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: '700' }}>{pending.length}</span>}
              {item.key === 'flagged'  && flagged.length > 0  && <span style={{ background: '#ef4444', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: '700' }}>{flagged.length}</span>}
              {item.key === 'announcements' && announcements.length > 0 && <span style={{ background: '#3b82f6', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: '700' }}>{announcements.length}</span>}
            </button>
          ))}

          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #1e293b' }}>
            <button onClick={loadAll} style={{ width: '100%', background: '#1e293b', color: '#94a3b8', borderRadius: '10px', padding: '9px', fontSize: '12px', fontWeight: '600', border: '1px solid #334155' }}>
              🔄 Refresh Data
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main style={{ flex: 1, overflowY: 'auto', background: '#f1f5f9' }}>

          {/* ══ OVERVIEW ══ */}
          {activeNav === 'overview' && (
            <div style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>System Overview</h2>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Last updated: {new Date().toLocaleTimeString()}</p>
                </div>
                <button onClick={loadAll} style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: '10px', padding: '10px 20px', fontWeight: '700', fontSize: '13px' }}>🔄 Refresh</button>
              </div>

              {/* Alerts */}
              {pending.length > 0 && (
                <div style={{ background: 'linear-gradient(135deg,#fff7ed,#fef3c7)', border: '1px solid #fed7aa', borderRadius: '16px', padding: '18px 22px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px' }}>⏳</span>
                    <div>
                      <p style={{ fontWeight: '700', color: '#c2410c', margin: '0 0 4px', fontSize: '15px' }}>
                        {pending.length} account{pending.length > 1 ? 's' : ''} awaiting approval
                      </p>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {pendingStudents.length > 0 && (
                          <span style={{ fontSize: '12px', background: '#dcfce7', color: '#15803d', padding: '2px 10px', borderRadius: '20px', fontWeight: '600' }}>
                            🎓 {pendingStudents.length} student{pendingStudents.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {pendingTeachers.length > 0 && (
                          <span style={{ fontSize: '12px', background: '#dbeafe', color: '#1d4ed8', padding: '2px 10px', borderRadius: '20px', fontWeight: '600' }}>
                            👨‍🏫 {pendingTeachers.length} teacher{pendingTeachers.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setActiveNav('users')} style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: '10px', padding: '10px 20px', fontWeight: '700', fontSize: '13px' }}>Review Now →</button>
                </div>
              )}
              {flagged.length > 0 && (
                <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: '16px', padding: '18px 22px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px' }}>🚩</span>
                    <div>
                      <p style={{ fontWeight: '700', color: '#dc2626', margin: '0 0 2px', fontSize: '15px' }}>{flagged.length} flagged quiz attempt{flagged.length > 1 ? 's' : ''}</p>
                      <p style={{ color: '#9f1239', fontSize: '12px', margin: 0 }}>Suspicious activity detected during exams</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveNav('flagged')} style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', borderRadius: '10px', padding: '10px 20px', fontWeight: '700', fontSize: '13px' }}>View Flagged →</button>
                </div>
              )}

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '14px', marginBottom: '28px' }}>
                <StatCard icon="👥" label="Total Users"    value={users.length}    color="#667eea" onClick={() => setActiveNav('users')} />
                <StatCard icon="🎓" label="Students"       value={students.length} color="#10b981" />
                <StatCard icon="👨‍🏫" label="Teachers"      value={teachers.length} color="#3b82f6" />
                <StatCard icon="⏳" label="Pending"        value={pending.length}  color={pending.length > 0 ? '#f59e0b' : '#94a3b8'} alert={pending.length > 0} onClick={() => setActiveNav('users')} />
                <StatCard icon="📝" label="Quizzes"        value={quizzes.length}  color="#764ba2" onClick={() => setActiveNav('quizzes')} />
                <StatCard icon="📊" label="Attempts"       value={attempts.length} color="#ec4899" />
                <StatCard icon="✅" label="Pass Rate"      value={`${passRate}%`}  color="#0891b2" />
                <StatCard icon="🚩" label="Flagged"        value={flagged.length}  color={flagged.length > 0 ? '#ef4444' : '#94a3b8'} alert={flagged.length > 0} onClick={() => setActiveNav('flagged')} />
              </div>

              {/* Two-column layout */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '20px' }}>
                {/* Recent registrations */}
                <div style={{ background: 'white', borderRadius: '20px', padding: '22px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>🆕 Recent Registrations</h3>
                    <button onClick={() => setActiveNav('users')} style={{ background: 'transparent', color: '#667eea', fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', padding: 0 }}>View all →</button>
                  </div>
                  {[...users].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 6).map(u => (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{u.email}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {roleBadge(u.role)}
                        {!u.approved && u.role === 'student' && (
                          <button onClick={() => updateUser(u.id, { approved: true }, 'Approved!')} style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', fontSize: '11px', borderRadius: '8px', fontWeight: '700', border: 'none', cursor: 'pointer' }}>✓</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick actions */}
                <div style={{ background: 'white', borderRadius: '20px', padding: '22px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>⚡ Quick Actions</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { label: 'Approve all pending students', icon: '✅', color: 'linear-gradient(135deg,#10b981,#059669)', action: async () => { await Promise.all(pending.map(u => updateDoc(doc(db, 'users', u.id), { approved: true }))); success(`Approved ${pending.length} students!`, 2000); loadAll(); }, disabled: pending.length === 0 },
                      { label: 'Create new teacher account', icon: '👨‍🏫', color: 'linear-gradient(135deg,#3b82f6,#2563eb)', action: () => setActiveNav('create') },
                      { label: 'Post announcement', icon: '📢', color: 'linear-gradient(135deg,#f59e0b,#d97706)', action: () => setActiveNav('announcements') },
                      { label: 'View flagged attempts', icon: '🚩', color: 'linear-gradient(135deg,#ef4444,#dc2626)', action: () => setActiveNav('flagged'), disabled: flagged.length === 0 },
                    ].map((a, i) => (
                      <button key={i} onClick={a.action} disabled={a.disabled}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', background: a.disabled ? '#f8fafc' : a.color, color: a.disabled ? '#94a3b8' : 'white', fontWeight: '600', fontSize: '13px', border: 'none', cursor: a.disabled ? 'not-allowed' : 'pointer', textAlign: 'left', transition: 'opacity 0.15s', opacity: a.disabled ? 0.6 : 1 }}>
                        <span style={{ fontSize: '18px' }}>{a.icon}</span>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Latest announcements */}
                <div style={{ background: 'white', borderRadius: '20px', padding: '22px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>📢 Announcements</h3>
                    <button onClick={() => setActiveNav('announcements')} style={{ background: 'transparent', color: '#667eea', fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', padding: 0 }}>Manage →</button>
                  </div>
                  {announcements.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No announcements yet</p>
                  ) : announcements.slice(0, 3).map(a => {
                    const [color, bg] = annColors[a.type] || annColors.info;
                    return (
                      <div key={a.id} style={{ padding: '10px 14px', borderRadius: '10px', background: bg, borderLeft: `3px solid ${color}`, marginBottom: '8px' }}>
                        <div style={{ fontWeight: '700', fontSize: '13px', color, marginBottom: '2px' }}>{a.title}</div>
                        <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>{a.body?.slice(0, 80)}{a.body?.length > 80 ? '…' : ''}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Teacher leaderboard */}
                <div style={{ background: 'white', borderRadius: '20px', padding: '22px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>🏆 Top Teachers</h3>
                  {teachers.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No teachers yet</p>
                  ) : [...teachers].sort((a, b) => quizzes.filter(q => q.createdBy === b.id).length - quizzes.filter(q => q.createdBy === a.id).length).slice(0, 5).map((t, i) => {
                    const tq = quizzes.filter(q => q.createdBy === t.id).length;
                    const ta = attempts.filter(a => quizzes.find(q => q.id === a.quizId && q.createdBy === t.id)).length;
                    return (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: i === 0 ? 'linear-gradient(135deg,#f59e0b,#d97706)' : i === 1 ? 'linear-gradient(135deg,#94a3b8,#64748b)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', color: i < 2 ? 'white' : '#64748b', flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.email}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{tq} quizzes · {ta} attempts</div>
                        </div>
                        <span style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', flexShrink: 0 }}>{tq}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══ USER MANAGEMENT ══ */}
          {activeNav === 'users' && (
            <div style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0 }}>User Management</h2>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedUsers.size > 0 && (
                    <>
                      <button onClick={bulkApprove} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: '700' }}>✓ Approve ({selectedUsers.size})</button>
                      <button onClick={bulkDelete}  style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: '700' }}>🗑 Delete ({selectedUsers.size})</button>
                    </>
                  )}
                </div>
              </div>

              {/* Filters bar */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '16px 20px', border: '1px solid #e2e8f0', marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input placeholder="🔍 Search email or name…" value={search} onChange={e => setSearch(e.target.value)}
                  style={{ flex: 1, minWidth: '180px', padding: '9px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px' }} />
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ padding: '9px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: 'white' }}>
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers</option>
                  <option value="admin">Admins</option>
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '9px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: 'white' }}>
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '9px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: 'white' }}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="email">By Email</option>
                </select>
                <span style={{ fontSize: '13px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{filteredUsers.length} of {users.length}</span>
              </div>

              {/* Bulk select bar */}
              {filteredUsers.length > 0 && (
                <div style={{ background: 'white', borderRadius: '12px', padding: '10px 16px', border: '1px solid #e2e8f0', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input type="checkbox" checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0} onChange={selectAll} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    {selectedUsers.size > 0 ? `${selectedUsers.size} selected` : 'Select all'}
                  </span>
                </div>
              )}

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading…</div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px', border: '2px dashed #e2e8f0', color: '#94a3b8' }}>No users match your filters</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {filteredUsers.map(u => {
                    const uAttempts = attempts.filter(a => a.studentId === u.id);
                    const uQuizzes  = quizzes.filter(q => q.createdBy === u.id);
                    const isSelected = selectedUsers.has(u.id);
                    return (
                      <div key={u.id} style={{ background: isSelected ? '#ede9fe' : 'white', borderRadius: '14px', padding: '14px 18px', border: `1.5px solid ${isSelected ? '#667eea' : !u.approved && u.role === 'student' ? '#fed7aa' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', transition: 'all 0.15s' }}>
                        {u.role !== 'admin' && (
                          <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(u.id)} style={{ width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, minWidth: '180px' }}>
                          <div style={{ fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>{u.email}</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                            {roleBadge(u.role)}
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: '600', background: u.approved ? '#dcfce7' : '#fee2e2', color: u.approved ? '#15803d' : '#dc2626' }}>
                              {u.approved ? '✓ Active' : '⏳ Pending'}
                            </span>
                            {u.role === 'student' && uAttempts.length > 0 && <span style={{ fontSize: '11px', color: '#94a3b8' }}>{uAttempts.length} attempts</span>}
                            {u.role === 'teacher' && <span style={{ fontSize: '11px', color: '#94a3b8' }}>{uQuizzes.length} quizzes</span>}
                            {u.createdAt && <span style={{ fontSize: '11px', color: '#94a3b8' }}>Joined {new Date(u.createdAt).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        {u.role !== 'admin' && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {u.role === 'student' && !u.approved && (
                              <button onClick={() => updateUser(u.id, { approved: true }, 'Approved!')} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', padding: '6px 14px', fontSize: '12px', borderRadius: '8px', fontWeight: '700', border: 'none', cursor: 'pointer', color: 'white' }}>✓ Approve</button>
                            )}
                            {u.role === 'student' && u.approved && (
                              <button onClick={() => updateUser(u.id, { role: 'teacher', approved: true }, 'Promoted!')} style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', padding: '6px 14px', fontSize: '12px', borderRadius: '8px', fontWeight: '700', border: 'none', cursor: 'pointer', color: 'white' }}>⬆ Teacher</button>
                            )}
                            {u.role === 'teacher' && (
                              <button onClick={() => updateUser(u.id, { role: 'student', approved: false }, 'Demoted.')} style={{ background: '#f1f5f9', color: '#374151', padding: '6px 12px', fontSize: '12px', borderRadius: '8px', fontWeight: '600', border: '1px solid #e2e8f0', cursor: 'pointer' }}>⬇ Demote</button>
                            )}
                            <button onClick={() => updateUser(u.id, { approved: !u.approved }, u.approved ? 'Access revoked.' : 'Access granted!')}
                              style={{ background: u.approved ? '#fff7ed' : '#f0fdf4', color: u.approved ? '#c2410c' : '#15803d', padding: '6px 12px', fontSize: '12px', borderRadius: '8px', fontWeight: '600', border: `1px solid ${u.approved ? '#fed7aa' : '#bbf7d0'}`, cursor: 'pointer' }}>
                              {u.approved ? 'Revoke' : 'Grant'}
                            </button>
                            <button onClick={() => deleteUser(u.id, u.email)} style={{ background: '#fee2e2', color: '#dc2626', padding: '6px 10px', fontSize: '12px', borderRadius: '8px', fontWeight: '700', border: 'none', cursor: 'pointer' }}>🗑</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ QUIZZES ══ */}
          {activeNav === 'quizzes' && (
            <div style={{ padding: '28px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>Quiz Management</h2>
              <div style={{ background: 'white', borderRadius: '14px', padding: '14px 18px', border: '1px solid #e2e8f0', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input placeholder="🔍 Search quizzes…" value={quizSearch} onChange={e => setQuizSearch(e.target.value)}
                  style={{ flex: 1, minWidth: '200px', padding: '9px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px' }} />
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>{filteredQuizzes.length} quizzes</span>
              </div>
              {filteredQuizzes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '20px', border: '2px dashed #e2e8f0', color: '#94a3b8' }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>📝</div>
                  <p>No quizzes found</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredQuizzes.map(quiz => {
                    const creator  = users.find(u => u.id === quiz.createdBy);
                    const qAttempts = attempts.filter(a => a.quizId === quiz.id);
                    const qAvg = qAttempts.length ? (qAttempts.reduce((s, a) => s + (a.score / a.total) * 100, 0) / qAttempts.length).toFixed(0) : null;
                    const isExpired = quiz.deadline && Date.now() > quiz.deadline;
                    return (
                      <div key={quiz.id} style={{ background: 'white', borderRadius: '14px', padding: '16px 20px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{quiz.title}</span>
                            {quiz.aiGenerated && <span style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '6px' }}>AI</span>}
                            {isExpired && <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '6px' }}>EXPIRED</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <span>📚 {quiz.topic}</span>
                            <span>⏱️ {quiz.duration}min</span>
                            <span>👨‍🏫 {creator?.email || 'Unknown'}</span>
                            <span>📊 {qAttempts.length} attempts{qAvg ? ` · avg ${qAvg}%` : ''}</span>
                            {quiz.deadline && <span>📅 {isExpired ? 'Expired' : 'Due'} {new Date(quiz.deadline).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        <button onClick={() => handleDeleteQuiz(quiz.id, quiz.title)} style={{ background: '#fee2e2', color: '#dc2626', padding: '7px 14px', fontSize: '12px', borderRadius: '8px', fontWeight: '700', border: 'none', cursor: 'pointer' }}>🗑 Delete</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ FLAGGED ══ */}
          {activeNav === 'flagged' && (
            <div style={{ padding: '28px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>🚩 Flagged Attempts</h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Students with suspicious activity detected during quizzes</p>
              {flagged.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                  <h3 style={{ color: '#374151' }}>No flagged attempts</h3>
                  <p style={{ color: '#94a3b8', fontSize: '14px' }}>All quiz attempts look clean</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {flagged.sort((a, b) => b.activityCount - a.activityCount).map(a => {
                    const pct   = ((a.score / a.total) * 100).toFixed(1);
                    const quiz  = quizzes.find(q => q.id === a.quizId);
                    const student = users.find(u => u.id === a.studentId);
                    return (
                      <div key={a.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1.5px solid #fca5a5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a', marginBottom: '4px' }}>{student?.email || a.studentId?.slice(0, 16) + '…'}</div>
                            <div style={{ fontSize: '13px', color: '#667eea', marginBottom: '2px' }}>{quiz?.title || 'Unknown Quiz'}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(a.submittedAt).toLocaleString()}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>🚩 {a.activityCount} incidents</span>
                            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', background: pct >= 50 ? '#dcfce7' : '#fee2e2', color: pct >= 50 ? '#15803d' : '#dc2626' }}>{a.score}/{a.total} ({pct}%)</span>
                          </div>
                        </div>

                        {/* Incident breakdown */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '8px', marginBottom: a.aiDetections?.length || a.reportedQuestions?.length ? '14px' : '0' }}>
                          {[
                            { label: 'Tab switches', value: a.activityCount, icon: '🔄' },
                            { label: 'AI detections', value: a.aiDetections?.length || 0, icon: '🤖' },
                            { label: 'Reported Qs', value: a.reportedQuestions?.length || 0, icon: '🚩' },
                          ].map((item, i) => (
                            <div key={i} style={{ background: '#fff5f5', borderRadius: '10px', padding: '10px 14px', textAlign: 'center' }}>
                              <div style={{ fontSize: '18px', marginBottom: '4px' }}>{item.icon}</div>
                              <div style={{ fontSize: '18px', fontWeight: '800', color: '#dc2626' }}>{item.value}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{item.label}</div>
                            </div>
                          ))}
                        </div>

                        {/* AI detections list */}
                        {a.aiDetections?.length > 0 && (
                          <div style={{ background: '#fafafa', borderRadius: '10px', padding: '12px 14px', marginBottom: '8px' }}>
                            <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', margin: '0 0 8px' }}>🤖 AI Detection Events:</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {a.aiDetections.slice(0, 5).map((d, i) => (
                                <div key={i} style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '8px' }}>
                                  <span style={{ color: '#94a3b8', flexShrink: 0 }}>{new Date(d.timestamp).toLocaleTimeString()}</span>
                                  <span>{d.reasons?.join(', ')}</span>
                                </div>
                              ))}
                              {a.aiDetections.length > 5 && <span style={{ fontSize: '11px', color: '#94a3b8' }}>+{a.aiDetections.length - 5} more events</span>}
                            </div>
                          </div>
                        )}

                        {/* Reported questions */}
                        {a.reportedQuestions?.length > 0 && (
                          <div style={{ background: '#fafafa', borderRadius: '10px', padding: '12px 14px' }}>
                            <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', margin: '0 0 8px' }}>🚩 Reported Questions:</p>
                            {a.reportedQuestions.map((r, i) => (
                              <div key={i} style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                                <span style={{ fontWeight: '600', color: '#374151' }}>{r.questionText?.slice(0, 60)}…</span>
                                <span style={{ marginLeft: '8px', background: '#fee2e2', color: '#dc2626', padding: '1px 6px', borderRadius: '6px', fontSize: '11px' }}>{r.reason}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ ANNOUNCEMENTS ══ */}
          {activeNav === 'announcements' && (
            <div style={{ padding: '28px', maxWidth: '800px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '24px' }}>📢 Announcements</h2>

              {/* Post form */}
              <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 18px', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Post New Announcement</h3>
                <form onSubmit={postAnnouncement}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '12px' }}>
                    <input placeholder="Announcement title…" value={annTitle} onChange={e => setAnnTitle(e.target.value)} required
                      style={{ padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px' }} />
                    <select value={annType} onChange={e => setAnnType(e.target.value)}
                      style={{ padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px', background: 'white' }}>
                      <option value="info">ℹ️ Info</option>
                      <option value="warning">⚠️ Warning</option>
                      <option value="success">✅ Success</option>
                      <option value="danger">🚨 Urgent</option>
                    </select>
                  </div>
                  <textarea placeholder="Write your message here…" value={annBody} onChange={e => setAnnBody(e.target.value)} required rows={4}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', marginBottom: '14px' }} />
                  <button type="submit" disabled={posting}
                    style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: '12px', padding: '12px 28px', fontWeight: '700', fontSize: '14px', opacity: posting ? 0.7 : 1 }}>
                    {posting ? '⏳ Posting…' : '📢 Post Announcement'}
                  </button>
                </form>
              </div>

              {/* Existing announcements */}
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#374151', marginBottom: '14px' }}>Posted Announcements ({announcements.length})</h3>
              {announcements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px', border: '2px dashed #e2e8f0', color: '#94a3b8' }}>No announcements yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {announcements.map(a => {
                    const [color, bg] = annColors[a.type] || annColors.info;
                    return (
                      <div key={a.id} style={{ background: 'white', borderRadius: '14px', padding: '18px 20px', border: `1px solid ${color}30`, borderLeft: `4px solid ${color}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{a.title}</span>
                              <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', color, background: bg }}>{a.type?.toUpperCase()}</span>
                            </div>
                            <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 6px', lineHeight: '1.6' }}>{a.body}</p>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{a.createdAt?.toDate ? a.createdAt.toDate().toLocaleString() : 'Just now'}</span>
                          </div>
                          <button onClick={() => deleteAnnouncement(a.id)} style={{ background: '#fee2e2', color: '#dc2626', padding: '6px 10px', fontSize: '12px', borderRadius: '8px', fontWeight: '700', border: 'none', cursor: 'pointer', flexShrink: 0 }}>🗑</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ CREATE TEACHER ══ */}
          {activeNav === 'create' && (
            <div style={{ padding: '28px', maxWidth: '520px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Create Teacher Account</h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Teacher accounts are pre-approved and can create quizzes immediately.</p>
              <div style={{ background: 'white', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0' }}>
                <form onSubmit={createTeacher}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Full Name (optional)</label>
                    <input placeholder="e.g., Dr. Smith" value={teacherName} onChange={e => setTeacherName(e.target.value)}
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Email Address *</label>
                    <input type="email" placeholder="teacher@school.com" value={teacherEmail} onChange={e => setTeacherEmail(e.target.value)} required
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Temporary Password *</label>
                    <input type="password" placeholder="Min 6 characters" value={teacherPassword} onChange={e => setTeacherPassword(e.target.value)} required
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' }} />
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>Share this password with the teacher. They can change it after logging in.</p>
                  </div>
                  <button type="submit" disabled={creating}
                    style={{ width: '100%', background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: '12px', padding: '14px', fontWeight: '700', fontSize: '15px', opacity: creating ? 0.7 : 1 }}>
                    {creating ? '⏳ Creating…' : '✨ Create Teacher Account'}
                  </button>
                </form>
              </div>

              {/* Teachers list */}
              {teachers.length > 0 && (
                <div style={{ marginTop: '24px', background: 'white', borderRadius: '20px', padding: '22px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Existing Teachers ({teachers.length})</h3>
                  {teachers.map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{t.email}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{quizzes.filter(q => q.createdBy === t.id).length} quizzes created</div>
                      </div>
                      <button onClick={() => updateUser(t.id, { role: 'student', approved: false }, 'Demoted.')} style={{ background: '#f1f5f9', color: '#374151', padding: '5px 12px', fontSize: '12px', borderRadius: '8px', fontWeight: '600', border: '1px solid #e2e8f0', cursor: 'pointer' }}>⬇ Demote</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ ANALYTICS ══ */}
          {activeNav === 'analytics' && (
            <div style={{ padding: '28px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '24px' }}>System Analytics</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '20px', marginBottom: '24px' }}>

                {/* User breakdown */}
                <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 18px', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>👥 User Breakdown</h3>
                  {[
                    { label: 'Active Students',   value: students.filter(u => u.approved).length, color: '#10b981', total: users.length },
                    { label: 'Pending Students',  value: pending.length,                          color: '#f59e0b', total: users.length },
                    { label: 'Teachers',          value: teachers.length,                         color: '#3b82f6', total: users.length },
                    { label: 'Admins',            value: admins.length,                           color: '#7c3aed', total: users.length },
                  ].map((row, i) => (
                    <div key={i} style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', color: '#374151', fontWeight: '600' }}>{row.label}</span>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: row.color }}>{row.value} <span style={{ color: '#94a3b8', fontWeight: '400', fontSize: '12px' }}>({row.total ? ((row.value / row.total) * 100).toFixed(0) : 0}%)</span></span>
                      </div>
                      <div style={{ background: '#f1f5f9', borderRadius: '99px', height: '8px' }}>
                        <div style={{ width: `${row.total ? (row.value / row.total) * 100 : 0}%`, height: '100%', borderRadius: '99px', background: row.color, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quiz stats */}
                <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 18px', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>📝 Quiz Statistics</h3>
                  {[
                    { label: 'Total Quizzes',    value: quizzes.length,                                  color: '#667eea' },
                    { label: 'AI Generated',     value: quizzes.filter(q => q.aiGenerated).length,       color: '#764ba2' },
                    { label: 'Manual Quizzes',   value: quizzes.filter(q => !q.aiGenerated).length,      color: '#3b82f6' },
                    { label: 'With Deadlines',   value: quizzes.filter(q => q.deadline).length,          color: '#f59e0b' },
                    { label: 'Total Attempts',   value: attempts.length,                                 color: '#10b981' },
                    { label: 'Avg Score',        value: `${avgScore}%`,                                  color: '#0891b2' },
                    { label: 'Pass Rate',        value: `${passRate}%`,                                  color: '#10b981' },
                    { label: 'Flagged Attempts', value: flagged.length,                                  color: flagged.length > 0 ? '#ef4444' : '#94a3b8' },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < 7 ? '1px solid #f8fafc' : 'none' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>{row.label}</span>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: row.color }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Score distribution */}
                <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 18px', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>📊 Score Distribution</h3>
                  {[
                    { label: '90–100% (A+)', min: 90, color: '#10b981' },
                    { label: '70–89%  (B)',  min: 70, max: 90, color: '#3b82f6' },
                    { label: '50–69%  (C)',  min: 50, max: 70, color: '#f59e0b' },
                    { label: '0–49%   (F)',  max: 50, color: '#ef4444' },
                  ].map((band, i) => {
                    const count = attempts.filter(a => {
                      const pct = (a.score / a.total) * 100;
                      return pct >= (band.min || 0) && pct < (band.max || 101);
                    }).length;
                    const pct = attempts.length ? ((count / attempts.length) * 100).toFixed(0) : 0;
                    return (
                      <div key={i} style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ fontSize: '13px', color: '#374151', fontWeight: '600' }}>{band.label}</span>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: band.color }}>{count} <span style={{ color: '#94a3b8', fontWeight: '400' }}>({pct}%)</span></span>
                        </div>
                        <div style={{ background: '#f1f5f9', borderRadius: '99px', height: '8px' }}>
                          <div style={{ width: `${pct}%`, height: '100%', borderRadius: '99px', background: band.color, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Teacher performance */}
                <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 18px', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>👨‍🏫 Teacher Performance</h3>
                  {teachers.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '13px' }}>No teachers yet</p>
                  ) : [...teachers].sort((a, b) => {
                    const aAttempts = attempts.filter(att => quizzes.find(q => q.id === att.quizId && q.createdBy === a.id));
                    const bAttempts = attempts.filter(att => quizzes.find(q => q.id === att.quizId && q.createdBy === b.id));
                    return bAttempts.length - aAttempts.length;
                  }).map(t => {
                    const tq = quizzes.filter(q => q.createdBy === t.id);
                    const ta = attempts.filter(a => tq.find(q => q.id === a.quizId));
                    const tAvg = ta.length ? (ta.reduce((s, a) => s + (a.score / a.total) * 100, 0) / ta.length).toFixed(0) : '—';
                    return (
                      <div key={t.id} style={{ padding: '12px 0', borderBottom: '1px solid #f8fafc' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{t.email}</span>
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>{tq.length} quizzes · {ta.length} attempts</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span style={{ fontSize: '11px', background: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>Avg: {tAvg}%</span>
                          {tq.filter(q => q.aiGenerated).length > 0 && <span style={{ fontSize: '11px', background: '#f0fdf4', color: '#15803d', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>🤖 {tq.filter(q => q.aiGenerated).length} AI</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  );
}
