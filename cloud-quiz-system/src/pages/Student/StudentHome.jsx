import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import { useNavigate } from "react-router-dom";
import "../../styles/student-home.css";

/* ─── Daily motivational quotes ─── */
const QUOTES = [
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { text: "Little things make big days.", author: "Unknown" },
  { text: "It's going to be hard, but hard does not mean impossible.", author: "Unknown" },
  { text: "Learning is not attained by chance; it must be sought with ardor.", author: "Abigail Adams" },
  { text: "Education is the most powerful weapon you can use to change the world.", author: "Nelson Mandela" },
];

/* ─── Badge definitions ─── */
const BADGE_DEFS = [
  { id: "first_quiz",    icon: "🎯", label: "First Step",    desc: "Completed your first quiz",          check: (s) => s.totalQuizzes >= 1 },
  { id: "five_quizzes",  icon: "📚", label: "Bookworm",      desc: "Completed 5 quizzes",                check: (s) => s.totalQuizzes >= 5 },
  { id: "ten_quizzes",   icon: "🔟", label: "Dedicated",     desc: "Completed 10 quizzes",               check: (s) => s.totalQuizzes >= 10 },
  { id: "perfect_score", icon: "💯", label: "Perfectionist", desc: "Scored 100% on a quiz",              check: (s) => s.bestScore >= 100 },
  { id: "high_scorer",   icon: "🏆", label: "High Scorer",   desc: "Averaged above 80%",                 check: (s) => parseFloat(s.avgScore) >= 80 },
  { id: "pass_master",   icon: "✅", label: "Pass Master",   desc: "Passed 5 or more quizzes",           check: (s) => s.passedQuizzes >= 5 },
  { id: "streak_3",      icon: "🔥", label: "On Fire",       desc: "3-day quiz streak",                  check: (s) => s.streak >= 3 },
  { id: "streak_7",      icon: "⚡", label: "Lightning",     desc: "7-day quiz streak",                  check: (s) => s.streak >= 7 },
];

/* ─── Level system ─── */
const LEVELS = [
  { name: "Beginner",  min: 0,   max: 3,   color: "#94a3b8", gradient: "linear-gradient(135deg,#94a3b8,#64748b)", icon: "🌱" },
  { name: "Explorer",  min: 3,   max: 8,   color: "#10b981", gradient: "linear-gradient(135deg,#10b981,#059669)", icon: "🧭" },
  { name: "Scholar",   min: 8,   max: 15,  color: "#3b82f6", gradient: "linear-gradient(135deg,#3b82f6,#2563eb)", icon: "📖" },
  { name: "Master",    min: 15,  max: 25,  color: "#8b5cf6", gradient: "linear-gradient(135deg,#8b5cf6,#7c3aed)", icon: "🎓" },
  { name: "Legend",    min: 25,  max: 999, color: "#f59e0b", gradient: "linear-gradient(135deg,#f59e0b,#d97706)", icon: "👑" },
];

function getLevel(totalQuizzes) {
  return LEVELS.find(l => totalQuizzes >= l.min && totalQuizzes < l.max) || LEVELS[0];
}

function getLevelProgress(totalQuizzes) {
  const level = getLevel(totalQuizzes);
  if (level.max === 999) return 100;
  const range = level.max - level.min;
  const progress = totalQuizzes - level.min;
  return Math.round((progress / range) * 100);
}

/* ─── Animated circular progress ring ─── */
function ProgressRing({ percent, size = 120, stroke = 10, color = "#667eea", children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>{children}</div>
    </div>
  );
}

/* ─── Animated stat card ─── */
function StatCard({ icon, label, value, color, suffix = "", delay = 0, sub }) {
  const isNumber = typeof value === "number";
  return (
    <motion.div
      className="sh-stat-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(0,0,0,0.12)" }}
    >
      <div className="sh-stat-icon" style={{ background: `${color}18` }}>{icon}</div>
      <div className="sh-stat-value" style={{ color }}>
        {isNumber ? (
          <CountUp end={value} duration={1.5} delay={delay} suffix={suffix} decimals={suffix === "%" ? 1 : 0} />
        ) : value}
      </div>
      <div className="sh-stat-label">{label}</div>
      {sub && <div className="sh-stat-sub">{sub}</div>}
    </motion.div>
  );
}

/* ─── Badge card ─── */
function BadgeCard({ badge, unlocked, delay = 0 }) {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <motion.div
      className={`sh-badge ${unlocked ? "sh-badge-unlocked" : "sh-badge-locked"}`}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.1 }}
      onHoverStart={() => setShowTooltip(true)}
      onHoverEnd={() => setShowTooltip(false)}
    >
      <div className="sh-badge-icon">{unlocked ? badge.icon : "🔒"}</div>
      <div className="sh-badge-name">{badge.label}</div>
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="sh-badge-tooltip"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
          >
            {badge.desc}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Floating particle ─── */
function Particle({ x, y, emoji, delay }) {
  return (
    <motion.div
      style={{ position: "absolute", left: `${x}%`, top: `${y}%`, fontSize: "20px", pointerEvents: "none", userSelect: "none" }}
      animate={{ y: [0, -18, 0], opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 3 + delay, repeat: Infinity, delay, ease: "easeInOut" }}
    >
      {emoji}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function StudentHome({ stats, myAttempts, quizzes, subjects, pendingQuizzes, currentUser, setActiveTab }) {
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [streak, setStreak] = useState(0);
  const [newBadge, setNewBadge] = useState(null);
  const prevBadgesRef = useRef([]);

  /* Pick today's quote deterministically */
  useEffect(() => {
    const dayIndex = Math.floor(Date.now() / 86400000) % QUOTES.length;
    setQuote(QUOTES[dayIndex]);
  }, []);

  /* Calculate streak from attempts */
  useEffect(() => {
    if (!myAttempts.length) return;
    const days = new Set(myAttempts.map(a => new Date(a.submittedAt).toDateString()));
    let s = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (days.has(d.toDateString())) s++;
      else if (i > 0) break;
    }
    setStreak(s);
  }, [myAttempts]);

  /* Check for newly unlocked badges */
  const enrichedStats = stats ? { ...stats, streak } : { totalQuizzes: 0, avgScore: 0, bestScore: 0, passedQuizzes: 0, passRate: 0, streak };
  const unlockedBadges = BADGE_DEFS.filter(b => b.check(enrichedStats));

  useEffect(() => {
    const prev = prevBadgesRef.current;
    const newlyUnlocked = unlockedBadges.filter(b => !prev.find(p => p.id === b.id));
    if (newlyUnlocked.length && prev.length > 0) {
      setNewBadge(newlyUnlocked[0]);
      setTimeout(() => setNewBadge(null), 4000);
    }
    prevBadgesRef.current = unlockedBadges;
  }, [unlockedBadges.length]);

  const level = getLevel(enrichedStats.totalQuizzes);
  const levelProgress = getLevelProgress(enrichedStats.totalQuizzes);
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];

  const PARTICLES = [
    { x: 5,  y: 15, emoji: "⭐", delay: 0 },
    { x: 88, y: 10, emoji: "🎯", delay: 1 },
    { x: 92, y: 60, emoji: "📚", delay: 0.5 },
    { x: 3,  y: 70, emoji: "🏆", delay: 1.5 },
    { x: 50, y: 5,  emoji: "✨", delay: 0.8 },
  ];

  return (
    <div className="sh-root">

      {/* ── New badge popup ── */}
      <AnimatePresence>
        {newBadge && (
          <motion.div
            className="sh-badge-popup"
            initial={{ opacity: 0, y: -60, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span style={{ fontSize: "28px" }}>{newBadge.icon}</span>
            <div>
              <div style={{ fontWeight: "800", fontSize: "14px" }}>Badge Unlocked!</div>
              <div style={{ fontSize: "12px", opacity: 0.85 }}>{newBadge.label}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════
          HERO BANNER
      ══════════════════════════════════════ */}
      <motion.div
        className="sh-hero"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Floating particles */}
        {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}

        <div className="sh-hero-left">
          {/* Level badge */}
          <motion.div
            className="sh-level-badge"
            style={{ background: level.gradient }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, delay: 0.2 }}
          >
            <span>{level.icon}</span>
            <span>{level.name}</span>
          </motion.div>

          <motion.h2
            className="sh-hero-title"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            Welcome back! 👋
          </motion.h2>
          <motion.p
            className="sh-hero-email"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            {currentUser?.email}
          </motion.p>

          {/* Streak */}
          <motion.div
            className="sh-streak"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, type: "spring" }}
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >🔥</motion.span>
            <span><strong>{streak}</strong> day streak</span>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            className="sh-hero-btns"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {pendingQuizzes.length > 0 && (
              <motion.button
                className="sh-btn-primary"
                onClick={() => setActiveTab("tests")}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                📝 {pendingQuizzes.length} Test{pendingQuizzes.length > 1 ? "s" : ""} Waiting
              </motion.button>
            )}
            <motion.button
              className="sh-btn-ghost"
              onClick={() => setActiveTab("subjects")}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              📚 My Subjects
            </motion.button>
          </motion.div>
        </div>

        {/* Level ring */}
        <motion.div
          className="sh-hero-ring"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 180 }}
        >
          <ProgressRing percent={levelProgress} size={140} stroke={12} color={level.color}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px" }}>{level.icon}</div>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "white" }}>{levelProgress}%</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>
                {nextLevel ? `to ${nextLevel.name}` : "MAX"}
              </div>
            </div>
          </ProgressRing>
        </motion.div>
      </motion.div>

      {/* ══════════════════════════════════════
          DAILY QUOTE
      ══════════════════════════════════════ */}
      {quote && (
        <motion.div
          className="sh-quote"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div className="sh-quote-mark">"</div>
          <div className="sh-quote-text">{quote.text}</div>
          <div className="sh-quote-author">— {quote.author}</div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════
          STATS GRID
      ══════════════════════════════════════ */}
      <div className="sh-stats-grid">
        <StatCard icon="📝" label="Quizzes Taken"  value={enrichedStats.totalQuizzes}           color="#667eea" delay={0.1} />
        <StatCard icon="📊" label="Avg Score"      value={parseFloat(enrichedStats.avgScore)}   color="#10b981" suffix="%" delay={0.2} />
        <StatCard icon="🏆" label="Best Score"     value={parseFloat(enrichedStats.bestScore)}  color="#f59e0b" suffix="%" delay={0.3} />
        <StatCard icon="✅" label="Pass Rate"      value={parseFloat(enrichedStats.passRate)}   color="#3b82f6" suffix="%" delay={0.4} />
        <StatCard icon="🔥" label="Day Streak"     value={streak}                               color="#ef4444" delay={0.5} sub={streak > 0 ? "Keep it up!" : "Start today!"} />
        <StatCard icon="📚" label="Subjects"       value={subjects.length}                      color="#8b5cf6" delay={0.6} />
      </div>

      {/* ══════════════════════════════════════
          BADGES
      ══════════════════════════════════════ */}
      <motion.div
        className="sh-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="sh-section-header">
          <h3 className="sh-section-title">🏅 Achievements</h3>
          <span className="sh-section-sub">{unlockedBadges.length}/{BADGE_DEFS.length} unlocked</span>
        </div>
        <div className="sh-badges-grid">
          {BADGE_DEFS.map((badge, i) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              unlocked={unlockedBadges.some(b => b.id === badge.id)}
              delay={0.65 + i * 0.06}
            />
          ))}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════
          PENDING TESTS ALERT
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {pendingQuizzes.length > 0 && (
          <motion.div
            className="sh-pending-alert"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="sh-pending-left">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
                style={{ fontSize: "28px" }}
              >🔔</motion.div>
              <div>
                <div className="sh-pending-title">{pendingQuizzes.length} test{pendingQuizzes.length > 1 ? "s" : ""} waiting for you</div>
                <div className="sh-pending-sub">
                  {pendingQuizzes.slice(0, 2).map(q => q.title).join(" · ")}
                  {pendingQuizzes.length > 2 ? ` +${pendingQuizzes.length - 2} more` : ""}
                </div>
              </div>
            </div>
            <motion.button
              className="sh-btn-danger"
              onClick={() => setActiveTab("tests")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
            >
              Start Now →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════
          SUBJECTS QUICK ACCESS
      ══════════════════════════════════════ */}
      {subjects.length > 0 && (
        <motion.div
          className="sh-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
        >
          <div className="sh-section-header">
            <h3 className="sh-section-title">📚 My Subjects</h3>
            <button className="sh-link-btn" onClick={() => setActiveTab("subjects")}>View all →</button>
          </div>
          <div className="sh-subjects-grid">
            {subjects.slice(0, 4).map((s, i) => {
              const GRADS = [
                "linear-gradient(135deg,#667eea,#764ba2)",
                "linear-gradient(135deg,#10b981,#059669)",
                "linear-gradient(135deg,#f59e0b,#d97706)",
                "linear-gradient(135deg,#ef4444,#dc2626)",
              ];
              return (
                <motion.div
                  key={s.id}
                  className="sh-subject-card"
                  style={{ background: GRADS[i % GRADS.length] }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.08 }}
                  whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
                  onClick={() => navigate(`/subject/${s.id}`)}
                >
                  <div className="sh-subject-icon">📖</div>
                  <div className="sh-subject-name">{s.name}</div>
                  {s.description && <div className="sh-subject-desc">{s.description}</div>}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════
          RECENT ACTIVITY
      ══════════════════════════════════════ */}
      {myAttempts.length > 0 && (
        <motion.div
          className="sh-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <div className="sh-section-header">
            <h3 className="sh-section-title">🕐 Recent Activity</h3>
            <button className="sh-link-btn" onClick={() => setActiveTab("analytics")}>Analytics →</button>
          </div>
          <div className="sh-activity-list">
            {myAttempts
              .sort((a, b) => b.submittedAt - a.submittedAt)
              .slice(0, 5)
              .map((attempt, i) => {
                const pct  = Math.round((attempt.score / attempt.total) * 100);
                const quiz = quizzes.find(q => q.id === attempt.quizId);
                const passed = pct >= 50;
                return (
                  <motion.div
                    key={attempt.id}
                    className="sh-activity-row"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.95 + i * 0.07 }}
                    whileHover={{ x: 4 }}
                  >
                    <div className={`sh-activity-dot ${passed ? "sh-dot-pass" : "sh-dot-fail"}`} />
                    <div className="sh-activity-info">
                      <div className="sh-activity-title">{quiz?.title || "Quiz"}</div>
                      <div className="sh-activity-date">{new Date(attempt.submittedAt).toLocaleDateString()}</div>
                    </div>
                    <div className={`sh-activity-score ${passed ? "sh-score-pass" : "sh-score-fail"}`}>
                      {attempt.score}/{attempt.total}
                      <span className="sh-activity-pct"> ({pct}%)</span>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════
          EMPTY STATE
      ══════════════════════════════════════ */}
      {myAttempts.length === 0 && (
        <motion.div
          className="sh-empty"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, type: "spring" }}
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ fontSize: "64px", marginBottom: "16px" }}
          >🚀</motion.div>
          <h3 className="sh-empty-title">Ready to launch?</h3>
          <p className="sh-empty-sub">Take your first quiz and start earning badges!</p>
          <div className="sh-empty-btns">
            <motion.button
              className="sh-btn-primary"
              onClick={() => setActiveTab("tests")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
            >📝 Take a Test</motion.button>
            <motion.button
              className="sh-btn-secondary"
              onClick={() => setActiveTab("subjects")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
            >📚 Browse Subjects</motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
