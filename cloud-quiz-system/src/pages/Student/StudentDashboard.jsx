import { useEffect, useState, useContext } from "react";
import { getAllQuizzes, getQuizAttempts } from "../../services/quizService";
import { getAllSubjects } from "../../services/subjectService";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import { SkeletonQuizGrid, SkeletonDashboard } from "../../components/Loading";
import StudyGroups from "./StudyGroups";
import AskTeacher from "./AskTeacher";
import Goals from "./Goals";
import StudentHome from "./StudentHome";

const SUBJECT_GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#ef4444,#dc2626)',
  'linear-gradient(135deg,#3b82f6,#2563eb)',
  'linear-gradient(135deg,#ec4899,#db2777)',
];

function PendingQuizCard({ quiz, onStart }) {
  const isExpired = quiz.deadline && Date.now() > quiz.deadline;
  const dueSoon   = quiz.deadline && !isExpired && Date.now() > quiz.deadline - 86400000;
  return (
    <div className="quiz-card" style={{ borderTop: `3px solid ${isExpired ? '#94a3b8' : '#ef4444'}`, opacity: isExpired ? 0.7 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, flex: 1 }}>{quiz.title}</h3>
        {isExpired
          ? <span style={{ background: '#f1f5f9', color: '#64748b', borderRadius: '8px', padding: '2px 8px', fontSize: '11px', fontWeight: '700', flexShrink: 0, marginLeft: '8px' }}>EXPIRED</span>
          : <span style={{ background: '#fee2e2', color: '#ef4444', borderRadius: '8px', padding: '2px 8px', fontSize: '11px', fontWeight: '700', flexShrink: 0, marginLeft: '8px' }}>NEW</span>
        }
      </div>
      <div className="quiz-meta">
        <div className="quiz-meta-item">📚 {quiz.topic}</div>
        <div className="quiz-meta-item">⏱️ {quiz.duration} min</div>
        {quiz.aiGenerated && <div className="quiz-meta-item" style={{ color: '#667eea' }}>🤖 AI</div>}
      </div>
      {quiz.deadline && (
        <div style={{ fontSize: '12px', marginTop: '6px', padding: '4px 10px', borderRadius: '8px', fontWeight: '600',
          background: isExpired ? '#f1f5f9' : dueSoon ? '#fff7ed' : '#f0fdf4',
          color: isExpired ? '#94a3b8' : dueSoon ? '#c2410c' : '#15803d' }}>
          📅 {isExpired ? 'Expired' : 'Due'}: {new Date(quiz.deadline).toLocaleString()}
        </div>
      )}
      <button onClick={() => !isExpired && onStart(quiz.id)} disabled={isExpired}
        style={{ marginTop: '10px', opacity: isExpired ? 0.5 : 1, cursor: isExpired ? 'not-allowed' : 'pointer' }}>
        {isExpired ? 'Expired' : 'Start Test →'}
      </button>
    </div>
  );
}
export default function StudentDashboard() {
  const [quizzes, setQuizzes]       = useState([]);
  const [subjects, setSubjects]     = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [activeTab, setActiveTab]   = useState('home');
  const [loading, setLoading]       = useState(true);
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [quizzesData, subjectsData, allAttempts] = await Promise.all([
      getAllQuizzes(),
      getAllSubjects().catch(() => []),
      getQuizAttempts(),
    ]);
    setQuizzes(quizzesData);
    setSubjects(subjectsData);
    setMyAttempts(allAttempts.filter(a => a.studentId === currentUser.uid));
    setLoading(false);
  };

  const calculateStats = () => {
    if (myAttempts.length === 0) return null;
    const totalQuizzes  = myAttempts.length;
    const avgScore      = myAttempts.reduce((s, a) => s + (a.score / a.total) * 100, 0) / totalQuizzes;
    const bestScore     = Math.max(...myAttempts.map(a => (a.score / a.total) * 100));
    const passedQuizzes = myAttempts.filter(a => (a.score / a.total) * 100 >= 50).length;
    return {
      totalQuizzes,
      avgScore: avgScore.toFixed(1),
      bestScore: bestScore.toFixed(1),
      passedQuizzes,
      passRate: ((passedQuizzes / totalQuizzes) * 100).toFixed(1),
    };
  };

  const stats = calculateStats();
  const attemptedQuizIds = new Set(myAttempts.map(a => a.quizId));
  const pendingQuizzes   = quizzes.filter(q => !attemptedQuizIds.has(q.id));
  const doneQuizzes      = quizzes.filter(q => attemptedQuizIds.has(q.id));

  const TABS = [
    { key: 'home',      label: '🏠 Home' },
    { key: 'subjects',  label: '📚 Subjects' },
    { key: 'tests',     label: `📝 Tests${pendingQuizzes.length ? ` (${pendingQuizzes.length})` : ''}` },
    { key: 'analytics', label: '📊 Analytics' },
    { key: 'goals',     label: '🎯 Goals' },
    { key: 'groups',    label: '👥 Study Groups' },
    { key: 'messages',  label: '💬 Ask Teacher' },
  ];

  /* ── stat card helper ── */
  const StatCard = ({ icon, label, value, color, sub }) => (
    <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ fontSize: '26px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '28px', fontWeight: '800', color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      {sub && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{sub}</div>}
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <h2>👋 Student Dashboard</h2>

        <div className="tab-navigation">
          {TABS.map(tab => (
            <button key={tab.key} className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════ HOME ══════════════ */}
        {activeTab === 'home' && (
          <div className="tab-content">
            {loading ? <SkeletonDashboard /> : (
              <StudentHome
                stats={stats}
                myAttempts={myAttempts}
                quizzes={quizzes}
                subjects={subjects}
                pendingQuizzes={pendingQuizzes}
                currentUser={currentUser}
                setActiveTab={setActiveTab}
              />
            )}
          </div>
        )}

        {/* ══════════════ SUBJECTS ══════════════ */}
        {activeTab === 'subjects' && (
          <div className="tab-content">
            <h3>My Subjects</h3>
            {loading ? <SkeletonQuizGrid count={4} /> : subjects.length === 0 ? (
              <div className="empty-state"><h3>No subjects yet</h3><p>Your teacher hasn't added any subjects yet</p></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
                {subjects.map(subject => {
                  const gradient = SUBJECT_GRADIENTS[subject.colorIndex % SUBJECT_GRADIENTS.length];
                  return (
                    <div key={subject.id} onClick={() => navigate(`/subject/${subject.id}`)}
                      style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
                    >
                      <div style={{ background: gradient, height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>📚</div>
                      <div style={{ padding: '18px' }}>
                        <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{subject.name}</h3>
                        {subject.description && <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>{subject.description}</p>}
                        <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: '#f1f5f9', color: '#475569', fontWeight: '600' }}>View Syllabus →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TESTS ══════════════ */}
        {activeTab === 'tests' && (
          <div className="tab-content">
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>🔔 Pending Tests</h3>
                {pendingQuizzes.length > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: '700' }}>{pendingQuizzes.length}</span>}
              </div>
              {loading ? <SkeletonQuizGrid count={3} /> : pendingQuizzes.length === 0 ? (
                <div style={{ padding: '32px', background: '#f0fdf4', borderRadius: '16px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎉</div>
                  <p style={{ color: '#15803d', fontWeight: '600', margin: 0 }}>All caught up! No pending tests.</p>
                </div>
              ) : (
                <div className="quiz-grid">
                  {pendingQuizzes.map(quiz => (
                    <div key={quiz.id} className="quiz-card" style={{ borderTop: '3px solid #ef4444' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 style={{ margin: 0, flex: 1 }}>{quiz.title}</h3>
                        <span style={{ background: '#fee2e2', color: '#ef4444', borderRadius: '8px', padding: '2px 8px', fontSize: '11px', fontWeight: '700', flexShrink: 0, marginLeft: '8px' }}>NEW</span>
                      </div>
                      <div className="quiz-meta">
                        <div className="quiz-meta-item">📚 {quiz.topic}</div>
                        <div className="quiz-meta-item">⏱️ {quiz.duration} min</div>
                        {quiz.aiGenerated && <div className="quiz-meta-item" style={{ color: '#667eea' }}>🤖 AI</div>}
                      </div>
                      <button onClick={() => navigate(`/quiz/${quiz.id}`)}>Start Test →</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {doneQuizzes.length > 0 && (
              <div>
                <h3 style={{ marginBottom: '16px' }}>✅ Completed Tests</h3>
                <div className="quiz-grid">
                  {doneQuizzes.map(quiz => {
                    const attempt = myAttempts.find(a => a.quizId === quiz.id);
                    const pct = attempt ? Math.round((attempt.score / attempt.total) * 100) : null;
                    return (
                      <div key={quiz.id} className="quiz-card" style={{ borderTop: '3px solid #10b981', opacity: 0.85 }}>
                        <h3>{quiz.title}</h3>
                        <div className="quiz-meta">
                          <div className="quiz-meta-item">📚 {quiz.topic}</div>
                          <div className="quiz-meta-item">⏱️ {quiz.duration} min</div>
                        </div>
                        {pct !== null && (
                          <div style={{ margin: '8px 0', padding: '6px 12px', borderRadius: '8px', background: pct >= 50 ? '#f0fdf4' : '#fff5f5', color: pct >= 50 ? '#15803d' : '#dc2626', fontWeight: '700', fontSize: '14px' }}>
                            Score: {attempt.score}/{attempt.total} ({pct}%) {pct >= 50 ? '✅' : '❌'}
                          </div>
                        )}
                        <button onClick={() => navigate(`/quiz/${quiz.id}`)} style={{ background: '#f1f5f9', color: '#374151' }}>Retake →</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ ANALYTICS ══════════════ */}
        {activeTab === 'analytics' && (
          <div className="tab-content">
            <h3>My Performance Analytics</h3>
            {loading ? <SkeletonDashboard /> : stats ? (
              <>
                <div className="quiz-info">
                  <div className="info-card"><h4>Quizzes Taken</h4><p>{stats.totalQuizzes}</p></div>
                  <div className="info-card"><h4>Average Score</h4><p>{stats.avgScore}%</p></div>
                  <div className="info-card"><h4>Best Score</h4><p>{stats.bestScore}%</p></div>
                  <div className="info-card"><h4>Pass Rate</h4><p>{stats.passRate}%</p></div>
                  <div className="info-card"><h4>Passed</h4><p>{stats.passedQuizzes}/{stats.totalQuizzes}</p></div>
                </div>
                <div className="card">
                  <h3>Recent Attempts</h3>
                  <div className="attempts-table">
                    {myAttempts.sort((a, b) => b.submittedAt - a.submittedAt).slice(0, 10).map(attempt => {
                      const pct  = ((attempt.score / attempt.total) * 100).toFixed(1);
                      const quiz = quizzes.find(q => q.id === attempt.quizId);
                      return (
                        <div key={attempt.id} className="attempt-card">
                          <div className="attempt-header">
                            <div>
                              <h4>{quiz?.title || 'Quiz'}</h4>
                              <p className="attempt-date">{new Date(attempt.submittedAt).toLocaleString()}</p>
                            </div>
                            <span className={`score-badge ${pct >= 50 ? 'passed' : 'failed'}`}>{attempt.score}/{attempt.total} ({pct}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state"><h3>No attempts yet</h3><p>Take a quiz to see your analytics</p></div>
            )}
          </div>
        )}

        {activeTab === 'goals'    && <div className="tab-content"><Goals stats={stats} myAttempts={myAttempts} /></div>}
        {activeTab === 'groups'   && <div className="tab-content"><h3>Study Groups</h3><StudyGroups /></div>}
        {activeTab === 'messages' && <div className="tab-content"><h3>Ask Your Teacher</h3><AskTeacher /></div>}
      </div>
    </>
  );
}

