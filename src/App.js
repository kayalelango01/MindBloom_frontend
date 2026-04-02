/* =========================================
   MindBloom – script.js
   Full React app (no build step needed)
   Uses: React 18 + Babel standalone
========================================= */
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";


// ─────────────────────────────────────────────
//  DATA CONSTANTS
// ─────────────────────────────────────────────

const MOOD_DATA = {
  Happy:   { emoji: "😊", color: "#F59E0B", bg: "#FEF3C7", dbg: "rgba(245,158,11,0.13)",   suggestion: "Keep riding this wave! Why not write a journal entry to capture this beautiful feeling?",                    icon: "✨" },
  Calm:    { emoji: "😌", color: "#10B981", bg: "#D1FAE5", dbg: "rgba(16,185,129,0.13)",   suggestion: "Peaceful and grounded — a beautiful state. Take a slow breath and appreciate this stillness.",               icon: "🌿" },
  Neutral: { emoji: "😐", color: "#6B7280", bg: "#F3F4F6", dbg: "rgba(107,114,128,0.13)", suggestion: "Neither up nor down — that's totally valid. A short walk or a warm cup of tea might spark something nice.",   icon: "☁️" },
  Sad:     { emoji: "😔", color: "#3B82F6", bg: "#DBEAFE", dbg: "rgba(59,130,246,0.13)",   suggestion: "It's okay to feel sad. Reach out to someone you trust, or just give yourself some extra care today.",        icon: "💙" },
  Stressed:{ emoji: "😣", color: "#EF4444", bg: "#FEE2E2", dbg: "rgba(239,68,68,0.13)",    suggestion: "Stress is very real. Try the 4-7-8 breathing exercise below, or step away from screens for 10 minutes.",    icon: "🌬️" },
  Anxious: { emoji: "😰", color: "#8B5CF6", bg: "#EDE9FE", dbg: "rgba(139,92,246,0.13)",   suggestion: "Grounding yourself helps with anxiety. Name 5 things you can see around you right now.",                   icon: "🫶" },
};

const SPIN_QUOTES = [
  "You are stronger than you think 💪",
  "Take a deep breath. This too shall pass 🌿",
  "You deserve kindness, especially from yourself 🌻",
  "Progress, not perfection — you're doing great ✨",
  "One small step today is still a step forward 🌱",
  "It's okay to rest. Rest is productive too 💤",
  "Your feelings are valid 💜",
  "You've survived every hard day so far 🔥",
  "Sunsets prove that endings can be beautiful too 🌅",
  "Be gentle with yourself today 🕊️",
  "You matter more than you know 🌟",
  "Today is a fresh page — write something kind ✍️",
];

const HELPLINES = [
  { name: "iCall (India)",          num: "9152987821" },
  { name: "Vandrevala Foundation",  num: "18602662345" },
  { name: "NIMHANS Helpline",       num: "08046110007" },
  { name: "Snehi Helpline",         num: "04424640050" },
  { name: "Aasra (24×7)",           num: "9820466627" },
];

// ─────────────────────────────────────────────
//  UTILITY HELPERS
// ─────────────────────────────────────────────

/** Returns today as YYYY-MM-DD */
function todayStr() {
  return new Date().toISOString().split("T")[0];
}

/** Formats a YYYY-MM-DD to readable text */
function fmtDate(d) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", month: "short", day: "numeric", year: "numeric"
  });
}

/** Escapes HTML special chars */
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** localStorage get with default */
function ls(key, def = null) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : def;
  } catch { return def; }
}

/** localStorage set */
function lss(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

/** Calculate check-in streak (consecutive days) */
function calcStreak() {
  const moods = ls("mb_moods", []);
  const days = [...new Set(moods.map(m => m.date))].sort().reverse();
  let streak = 0;
  let cursor = new Date();
  for (const d of days) {
    const cStr = cursor.toISOString().split("T")[0];
    if (d === cStr) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return streak;
}

// ─────────────────────────────────────────────
//  SHARED UI COMPONENTS
// ─────────────────────────────────────────────

/** Toast notification */
function Toast({ msg, show }) {
  return (
    <div className={`toast ${show ? "show" : ""}`}>{msg}</div>
  );
}

/** Reusable button */
function Btn({ children, onClick, variant = "primary", full = false, disabled = false, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}${full ? " btn-full" : ""}`}
      style={style}
    >
      {children}
    </button>
  );
}

/** Reusable card wrapper */
function Card({ children, className = "", style = {}, onClick }) {
  return (
    <div className={`card ${className}`} style={style} onClick={onClick}>
      {children}
    </div>
  );
}

/** Input field */
function InputField({ type = "text", placeholder, value, onChange, style = {} }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="input-field"
      style={style}
    />
  );
}

// ─────────────────────────────────────────────
//  NAVIGATION
// ─────────────────────────────────────────────

function Nav({ page, setPage, dark, setDark }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const NAV_LINKS = [
    { id: "home",      label: "Home" },
    { id: "checkin",   label: "Check-in" },
    { id: "journal",   label: "Journal" },
    { id: "insights",  label: "Insights" },
    { id: "emergency", label: "Emergency", cls: "emergency" },
    { id: "profile",   label: "Profile" },
  ];

  const go = (id) => {
    setPage(id);
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <span className="nav-brand">MindBloom 🌻</span>

      {/* Desktop links */}
      <div className="nav-links">
        {NAV_LINKS.map(l => (
          <button
            key={l.id}
            className={`nav-btn ${l.cls || ""} ${page === l.id ? "active" : ""}`}
            onClick={() => go(l.id)}
          >
            {l.label}
          </button>
        ))}
        <button className="dark-toggle" onClick={() => setDark(!dark)}>
          {dark ? "☀️" : "🌙"}
        </button>
      </div>

      {/* Mobile hamburger */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <button className="dark-toggle" style={{ display: "none" }} id="dt-mobile"
          onClick={() => setDark(!dark)}>{dark ? "☀️" : "🌙"}</button>
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        {NAV_LINKS.map(l => (
          <button
            key={l.id}
            className={`nav-btn ${l.cls || ""} ${page === l.id ? "active" : ""}`}
            onClick={() => go(l.id)}
          >
            {l.label}
          </button>
        ))}
        <button className="dark-toggle" style={{ width: "fit-content" }}
          onClick={() => { setDark(!dark); setMenuOpen(false); }}>
          {dark ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────
//  HOME PAGE
// ─────────────────────────────────────────────

function Home({ setPage }) {
  const moods   = ls("mb_moods", []);
  const journals = ls("mb_journal", []);
  const user    = ls("mb_user");
  const streak  = calcStreak();
  const lastMood = moods.length ? moods[moods.length - 1] : null;

  const hr = new Date().getHours();
  const greet =
    hr < 12 ? "Good morning ☀️" :
    hr < 17 ? "Good afternoon 🌤️" :
    hr < 21 ? "Good evening 🌇" : "Good night 🌙";

  const cards = [
    { icon: lastMood ? (MOOD_DATA[lastMood.mood]?.emoji || "—") : "—", label: "Last Mood",       val: lastMood ? lastMood.mood : "None yet", page: "checkin" },
    { icon: "📓",  label: "Journal Entries", val: journals.length,                           page: "journal" },
    { icon: "🎡",  label: "Spin Wheel",       val: "Positivity",                              page: "checkin" },
    { icon: "📊",  label: "Insights",         val: "View trends",                             page: "insights" },
  ];

  return (
    <div className="page">
      <div className="home-hero">
        <p className="home-greeting">{greet}{user ? `, ${user.name}` : ""}</p>
        <h1 className="home-title">MindBloom <span>🌻</span></h1>
        <p className="home-tagline">Small check-ins, big mental growth</p>
        <p className="home-subtagline">Your feelings deserve to be heard 💜</p>
        <div className="streak-badge">🔥 {streak} day streak</div>
        <div className="home-cta">
          <Btn onClick={() => setPage("checkin")}>Start Daily Check-in</Btn>
          <Btn variant="secondary" onClick={() => setPage("journal")}>Write in Journal ✍️</Btn>
        </div>
        <div className="home-cards">
          {cards.map((c, i) => (
            <Card key={i} className="home-card" onClick={() => setPage(c.page)}>
              <div className="home-card-icon">{c.icon}</div>
              <div className="home-card-label">{c.label}</div>
              <div className="home-card-val">{c.val}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  CHECK-IN PAGE
// ─────────────────────────────────────────────

function CheckIn({ toast }) {
  const [selected, setSelected] = useState(null);
  const [spinRot,  setSpinRot]  = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);

  const moods = ls("mb_moods", []);
  const alreadyToday = moods.some(m => m.date === todayStr());
  const lastSpin = ls("mb_lastSpin");

  // Check consecutive tough moods (excluding today)
  const toughMoods = ["Stressed", "Anxious"];
  const recent = moods.filter(m => m.date !== todayStr()).slice(-3).map(m => m.mood);
  const showAlert = (
    recent.length >= 2 &&
    recent.every(m => toughMoods.includes(m)) &&
    selected &&
    toughMoods.includes(selected)
  );

  // Restore spin result if already spun today
  useEffect(() => {
    if (lastSpin === todayStr()) {
      setSpinResult("You've already received your positivity boost today! Come back tomorrow 🌻");
    }
  }, []);

  const saveMood = () => {
    if (!selected) { toast("Please select a mood first 😊"); return; }
    if (alreadyToday) { toast("Already checked in today! Come back tomorrow 🌻"); return; }
    const updated = [...moods, { mood: selected, date: todayStr(), ts: Date.now() }];
    lss("mb_moods", updated);
    toast("Mood saved! Keep taking care of yourself 🌻");
    setSelected(null);
  };

  const doSpin = () => {
    if (lastSpin === todayStr()) { toast("Already spun today! Come back tomorrow 🎡"); return; }
    if (spinning) return;
    setSpinning(true);
    const newRot = spinRot + 720 + Math.floor(Math.random() * 360);
    setSpinRot(newRot);
    setTimeout(() => {
      const q = SPIN_QUOTES[Math.floor(Math.random() * SPIN_QUOTES.length)];
      setSpinResult(q);
      lss("mb_lastSpin", todayStr());
      setSpinning(false);
      toast("Here's your positivity boost! 🌻");
    }, 1300);
  };

  const moodEntry = selected ? MOOD_DATA[selected] : null;

  return (
    <div className="page">
      <h2 className="heading">Daily Check-in</h2>
      <p className="subheading">Take a moment — how are you feeling today?</p>

      {/* Already checked in */}
      {alreadyToday && (
        <Card className="already-card" style={{ background: "var(--lav-l)", border: "1.5px solid var(--lav)", marginBottom: "1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>✅</div>
          <p>You've already checked in today. See you tomorrow!</p>
        </Card>
      )}

      {/* Consecutive stress alert */}
      {showAlert && (
        <div className="alert-card">
          🌧️ <strong>You've been feeling {selected.toLowerCase()} lately.</strong> Consider reaching out to someone you trust or trying the breathing exercise in the Emergency section.
        </div>
      )}

      {/* Mood grid */}
      <div className="mood-grid">
        {Object.entries(MOOD_DATA).map(([name, d]) => (
          <button
            key={name}
            className="mood-btn"
            onClick={() => setSelected(name)}
            style={{
              background: selected === name ? d.bg : d.dbg,
              borderColor: selected === name ? d.color : "var(--border)",
              transform: selected === name ? "translateY(-4px)" : "none",
              boxShadow: selected === name ? `0 6px 20px ${d.color}40` : "var(--shadow)",
            }}
          >
            <span className="mood-emoji-lg">{d.emoji}</span>
            <span className="mood-name" style={{ color: selected === name ? d.color : "var(--text2)" }}>
              {name}
            </span>
          </button>
        ))}
      </div>

      {/* Suggestion card */}
      {selected && moodEntry && (
        <Card className="suggestion-card" style={{
          background: moodEntry.dbg,
          border: `1.5px solid ${moodEntry.color}40`,
          textAlign: "center", marginBottom: "1.5rem"
        }}>
          <div className="suggestion-icon">{moodEntry.icon}</div>
          <p className="suggestion-text">{moodEntry.suggestion}</p>
          {!alreadyToday && (
            <Btn onClick={saveMood}>Save Today's Mood ✅</Btn>
          )}
        </Card>
      )}

      {/* Spin wheel */}
      <Card className="spin-section">
        <h3>Need a boost? 🎡</h3>
        <p>One spin per day — make it count</p>
        <div className="spin-wheel-wrap">
          <div
            className="spin-wheel"
            onClick={doSpin}
            style={{ transform: `rotate(${spinRot}deg)`, transition: spinning ? "transform 1.2s cubic-bezier(.17,.67,.27,1.2)" : "transform 0.3s ease" }}
          >
            🌻
          </div>
        </div>
        <Btn variant="secondary" onClick={doSpin} disabled={spinning}>
          {spinning ? "Spinning…" : "Spin for Positivity 🎡"}
        </Btn>
        {spinResult && <div className="spin-result">{spinResult}</div>}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
//  JOURNAL PAGE
// ─────────────────────────────────────────────

function Journal({ toast }) {
  const [title,   setTitle]   = useState("");
  const [text,    setText]    = useState("");
  const [entries, setEntries] = useState(() => ls("mb_journal", []));

  const save = () => {
    if (!text.trim()) { toast("Please write something before saving 📝"); return; }
    const entry = {
      id:    Date.now(),
      title: title.trim() || "Untitled",
      text:  text.trim(),
      date:  todayStr(),
      ts:    Date.now(),
    };
    const updated = [entry, ...entries];
    lss("mb_journal", updated);
    setEntries(updated);
    setTitle(""); setText("");
    toast("Entry saved! 💾");
  };

  const del = (id) => {
    const updated = entries.filter(e => e.id !== id);
    lss("mb_journal", updated);
    setEntries(updated);
    toast("Entry deleted");
  };

  return (
    <div className="page">
      <h2 className="heading">My Journal</h2>
      <p className="subheading">A safe space for your thoughts ✍️</p>

      {/* Editor */}
      <Card className="journal-editor">
        <input
          type="text"
          className="journal-title-input"
          placeholder="Give this entry a title…"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          className="textarea-field"
          placeholder="How was your day? What's on your mind?"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <div className="journal-actions">
          <span className="journal-date">{fmtDate(todayStr())}</span>
          <Btn onClick={save}>Save Entry 💾</Btn>
        </div>
      </Card>

      {/* Entries list */}
      <h3 className="entries-heading">Previous Entries</h3>
      {entries.length === 0 ? (
        <p className="empty-state">No entries yet. Start writing! 🌱</p>
      ) : (
        <div className="entries-list">
          {entries.map(e => (
            <Card key={e.id} className="card-sm entry-card">
              <div className="entry-title">{e.title}</div>
              <div className="entry-date">{fmtDate(e.date)}</div>
              <div className="entry-preview">
                {e.text.length > 160 ? e.text.slice(0, 160) + "…" : e.text}
              </div>
              <div className="entry-actions">
                <button className="btn-delete" onClick={() => del(e.id)}>🗑 Delete</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  INSIGHTS PAGE
// ─────────────────────────────────────────────

function Insights() {
  const moods    = ls("mb_moods", []);
  const journals = ls("mb_journal", []);
  const streak   = calcStreak();

  if (!moods.length) {
    return (
      <div className="page">
        <h2 className="heading">Your Insights</h2>
        <p className="empty-state" style={{ marginTop: "3rem" }}>
          Complete some check-ins to see your insights 📊
        </p>
      </div>
    );
  }

  const total = moods.length;

  // Mood counts
  const counts = {};
  Object.keys(MOOD_DATA).forEach(m => (counts[m] = 0));
  moods.forEach(m => { if (counts[m.mood] !== undefined) counts[m.mood]++; });
  const maxCount = Math.max(...Object.values(counts), 1);
  const topMood  = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  // Weekday vs weekend
  const wdS = { tough: 0, pos: 0, total: 0 };
  const weS = { tough: 0, pos: 0, total: 0 };
  moods.forEach(m => {
    const day = new Date(m.date + "T00:00:00").getDay();
    const s   = (day === 0 || day === 6) ? weS : wdS;
    s.total++;
    if (["Stressed", "Anxious"].includes(m.mood)) s.tough++;
    if (["Happy", "Calm"].includes(m.mood))        s.pos++;
  });

  // Last 7 unique days
  const last7 = [...new Set(moods.map(m => m.date))].sort().slice(-7);
  const timeline = last7.map(d => {
    const entry = moods.filter(m => m.date === d).pop();
    return { date: d, mood: entry?.mood };
  });

  // Pattern insights
  const patterns = [];
  if (wdS.total > 0 && weS.total > 0) {
    const wdR = wdS.tough / wdS.total;
    const weR = weS.tough / weS.total;
    if (wdR > weR + 0.1) patterns.push("📈 You tend to feel more stressed on weekdays. Try adding a small relaxation ritual each evening.");
    if (weR > wdR + 0.1) patterns.push("📈 Weekends seem harder for you. It might be worth exploring what causes this.");
    if ((weS.pos / weS.total) > (wdS.pos / wdS.total) + 0.1)
      patterns.push("☀️ You're generally happier on weekends — something to look forward to each week!");
  }
  const posRatio = ((counts.Happy || 0) + (counts.Calm || 0)) / total;
  if (posRatio >= 0.6)  patterns.push(`🌟 ${Math.round(posRatio * 100)}% of your check-ins are positive moods. You're doing wonderfully!`);
  if (posRatio < 0.3 && total >= 5) patterns.push("💙 You've had more difficult days lately. Reaching out to someone can make a big difference.");
  if (streak >= 3)       patterns.push(`🔥 You're on a ${streak}-day streak! Consistency is the first step to self-awareness.`);
  if (!journals.length && total >= 3) patterns.push("✍️ Try journaling alongside check-ins — it deepens self-reflection a lot.");
  if (!patterns.length)  patterns.push("🌱 Keep checking in daily! More data will reveal meaningful patterns about your wellbeing.");

  const pct = (n, d) => d > 0 ? Math.round((n / d) * 100) : 0;

  return (
    <div className="page">
      <h2 className="heading">Your Insights</h2>
      <p className="subheading">Understanding your emotional patterns 📊</p>

      {/* Summary stats */}
      <div className="insights-stat-grid">
        {[
          { e: "📅", v: total,              l: "Total Check-ins" },
          { e: MOOD_DATA[topMood[0]]?.emoji, v: topMood[0],       l: "Most Common Mood" },
          { e: "🔥", v: streak,             l: "Day Streak" },
          { e: "📓", v: journals.length,    l: "Journal Entries" },
        ].map((s, i) => (
          <Card key={i} className="stat-card">
            <div className="stat-emoji">{s.e}</div>
            <div className="stat-val">{s.v}</div>
            <div className="stat-label">{s.l}</div>
          </Card>
        ))}
      </div>

      {/* Mood frequency bar chart */}
      <Card className="chart-card">
        <h3 className="chart-title">Mood Frequency</h3>
        {Object.entries(counts).map(([m, c]) => (
          <div key={m} className="bar-row">
            <div className="bar-label">{MOOD_DATA[m]?.emoji} {m}</div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${Math.round((c / maxCount) * 100)}%` }} />
            </div>
            <div className="bar-count">{c}</div>
          </div>
        ))}
      </Card>

      {/* Weekday vs Weekend */}
      <Card className="chart-card">
        <h3 className="chart-title">Weekday vs Weekend</h3>
        <div className="wb-wrap">
          {[
            { label: "Weekdays", s: wdS },
            { label: "Weekends", s: weS },
          ].map(({ label, s }) => (
            <div key={label}>
              <div className="wb-label">{label}</div>
              <div className="wb-bars">
                <div className="wb-bar-item">
                  <div className="wb-bar" style={{
                    height: `${pct(s.tough, s.total) * 0.7}px`,
                    background: "linear-gradient(to top, var(--pink), #FFB6C8)"
                  }}/>
                  <div className="wb-pct">{pct(s.tough, s.total)}%</div>
                  <div className="wb-sublabel">stressed</div>
                </div>
                <div className="wb-bar-item">
                  <div className="wb-bar" style={{
                    height: `${pct(s.pos, s.total) * 0.7}px`,
                    background: "linear-gradient(to top, var(--lav), #C4B5FD)"
                  }}/>
                  <div className="wb-pct">{pct(s.pos, s.total)}%</div>
                  <div className="wb-sublabel">positive</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Last 7 days timeline */}
      <Card className="chart-card">
        <h3 className="chart-title">Last 7 Days</h3>
        <div className="timeline-wrap">
          {timeline.map(({ date, mood }, i) => {
            const d = MOOD_DATA[mood];
            return (
              <div key={i} className="timeline-day">
                <div className="timeline-circle" style={{
                  background: mood ? d?.dbg : "var(--bg)",
                  borderColor: mood ? d?.color + "60" : "var(--border)",
                }}>
                  {mood ? d?.emoji : "·"}
                </div>
                <div className="timeline-dayl">
                  {new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short" })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Patterns */}
      <Card>
        <h3 className="chart-title">Patterns & Insights</h3>
        <div className="pattern-list">
          {patterns.map((p, i) => (
            <div key={i} className="pattern-item">{p}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
//  EMERGENCY PAGE
// ─────────────────────────────────────────────

function Emergency({ toast }) {
  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("");
  const [contact, setContact] = useState(() => ls("mb_contact"));
  const [breathStep, setBreathStep] = useState(null); // null | "inhale" | "hold" | "exhale"
  const breathTimer = useRef(null);

  const saveContact = () => {
    if (!name.trim() || !phone.trim()) { toast("Enter both name and phone number"); return; }
    const c = { name: name.trim(), phone: phone.trim() };
    lss("mb_contact", c);
    setContact(c);
    setName(""); setPhone("");
    toast("Trusted contact saved 💚");
  };

  const removeContact = () => {
    localStorage.removeItem("mb_contact");
    setContact(null);
    toast("Contact removed");
  };

  // 4-7-8 Breathing exercise
  const startBreath = () => {
    if (breathStep !== null) {
      clearTimeout(breathTimer.current);
      setBreathStep(null);
      return;
    }
    const run = (step) => {
      setBreathStep(step);
      const dur = step === "inhale" ? 4000 : step === "hold" ? 7000 : 8000;
      const next = step === "inhale" ? "hold" : step === "hold" ? "exhale" : "inhale";
      breathTimer.current = setTimeout(() => run(next), dur);
    };
    run("inhale");
  };

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(breathTimer.current), []);

  const bColor = breathStep === "inhale" ? "var(--lav)" : breathStep === "hold" ? "var(--pink)" : "var(--text3)";
  const bScale = breathStep === "inhale" || breathStep === "hold" ? 1.32 : 1;
  const bLabel = breathStep === "inhale" ? "Inhale… (4s)" : breathStep === "hold" ? "Hold… (7s)" : breathStep === "exhale" ? "Exhale… (8s)" : "Tap to start";

  return (
    <div className="page">
      <div className="emergency-hero">
        <span className="emergency-icon">🫂</span>
        <h2>Need help? You're not alone.</h2>
        <p>It's okay to reach out. Here are some ways we can support you right now.</p>
      </div>

      <div className="emergency-cards">

        {/* Trusted Contact */}
        <Card>
          <h3 className="e-card-title">📞 Your Trusted Contact</h3>
          {contact ? (
            <>
              <div className="trusted-display">
                <div>
                  <div className="trusted-name">{contact.name}</div>
                  <div className="trusted-phone">{contact.phone}</div>
                </div>
                <div className="trusted-actions">
                  <Btn onClick={() => window.open(`tel:${contact.phone}`)}>📞 Call Now</Btn>
                  <Btn variant="ghost" onClick={removeContact}>Remove</Btn>
                </div>
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: "0.85rem", color: "var(--text3)", marginBottom: "0.75rem" }}>
                No trusted contact saved yet. Add one below.
              </p>
              <div className="trusted-form">
                <InputField placeholder="Contact name"  value={name}  onChange={e => setName(e.target.value)} />
                <InputField placeholder="Phone number"  value={phone} onChange={e => setPhone(e.target.value)} type="tel" />
                <Btn onClick={saveContact}>Save Contact</Btn>
              </div>
            </>
          )}
        </Card>

        {/* Helplines */}
        <Card>
          <h3 className="e-card-title">🆘 Helpline Numbers</h3>
          <ul className="helpline-list">
            {HELPLINES.map((h, i) => (
              <li key={i} className="helpline-item">
                <span className="helpline-name">{h.name}</span>
                <a href={`tel:${h.num}`} className="helpline-num">{h.num}</a>
              </li>
            ))}
          </ul>
        </Card>

        {/* Breathing exercise */}
        <Card className="breathing-card">
          <h3 className="e-card-title">🌬️ 4-7-8 Breathing Exercise</h3>
          <p>Inhale 4s → Hold 7s → Exhale 8s. Repeat to calm anxiety instantly.</p>
          <div
            className="breathing-circle"
            onClick={startBreath}
            style={{
              transform: `scale(${bScale})`,
              border: `3px solid ${bColor}`,
              color: bColor,
              cursor: "pointer",
            }}
          >
            {bLabel}
          </div>
          <Btn variant="secondary" onClick={startBreath}>
            {breathStep !== null ? "Stop Exercise" : "Begin Exercise"}
          </Btn>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  PROFILE / AUTH PAGE
// ─────────────────────────────────────────────

function Profile({ toast }) {
  const [user,    setUser]    = useState(() => ls("mb_user"));
  const [tab,     setTab]     = useState("login");
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [pw,      setPw]      = useState("");

  const login = () => {
    if (!email || !pw) { toast("Please fill in all fields"); return; }
    const users = ls("mb_users", []);
    const found = users.find(u => u.email === email && u.password === pw);
    if (!found) { toast("Invalid email or password ❌"); return; }
    lss("mb_user", found);
    setUser(found);
    window.location.reload();
    toast(`Welcome back, ${found.name}! 🌻`);
  };

  const signup = () => {
    if (!name || !email || !pw) { toast("Please fill in all fields"); return; }
    if (pw.length < 6) { toast("Password must be at least 6 characters"); return; }
    const users = ls("mb_users", []);
    if (users.find(u => u.email === email)) { toast("This email is already registered"); return; }
    const nu = { name: name.trim(), email: email.trim(), password: pw, joined: todayStr() };
    lss("mb_users", [...users, nu]);
    lss("mb_user", nu);
    setUser(nu);
    window.location.reload();
    toast(`Welcome to MindBloom, ${nu.name}! 🌻`);
  };

  const logout = () => {
    localStorage.removeItem("mb_user");
    setUser(null);
    setName(""); setEmail(""); setPw("");
    toast("Logged out. Take care! 🌿");
  };

  const streak   = calcStreak();
  const moods    = ls("mb_moods", []);
  const journals = ls("mb_journal", []);

  if (user) {
    return (
      <div className="page page-narrow">
        {/* Profile header */}
        <div className="profile-header">
          <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <div className="profile-name">{user.name}</div>
            <div className="profile-email">{user.email}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats" style={{ marginBottom: "1.2rem" }}>
          {[
            { val: streak,          label: "Day Streak 🔥" },
            { val: moods.length,    label: "Check-ins"     },
            { val: journals.length, label: "Journal Entries" },
          ].map((s, i) => (
            <Card key={i} className="profile-stat" style={{ padding: "1.1rem" }}>
              <div className="profile-stat-val">{s.val}</div>
              <div className="profile-stat-label">{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Member since */}
        <Card style={{ marginBottom: "1.2rem" }}>
          <div style={{ fontSize: "0.78rem", color: "var(--text3)", marginBottom: "0.2rem" }}>Member since</div>
          <div style={{ fontWeight: 500, color: "var(--text)" }}>{fmtDate(user.joined)}</div>
        </Card>

        <Btn variant="ghost" full onClick={logout}>Logout</Btn>
      </div>
    );
  }

  return (
    <div className="page page-narrow">
      {/* Auth tabs */}
      <div className="auth-tabs">
        {["login", "signup"].map(t => (
          <button
            key={t}
            className={`auth-tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "login" ? "Login" : "Sign Up"}
          </button>
        ))}
      </div>

      {tab === "login" ? (
        <>
          <h2 className="heading">Welcome back 🌻</h2>
          <div className="form-group">
            <label className="form-label">Email</label>
            <InputField type="email" placeholder="hello@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <InputField type="password" placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)} />
          </div>
          <Btn full onClick={login}>Login</Btn>
          <p className="auth-switch">
            Don't have an account?{" "}
            <span onClick={() => setTab("signup")}>Sign up</span>
          </p>
        </>
      ) : (
        <>
          <h2 className="heading">Join MindBloom 🌻</h2>
          <div className="form-group">
            <label className="form-label">Your Name</label>
            <InputField placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <InputField type="email" placeholder="hello@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <InputField type="password" placeholder="Min 6 characters" value={pw} onChange={e => setPw(e.target.value)} />
          </div>
          <Btn full onClick={signup}>Create Account</Btn>
          <p className="auth-switch">
            Already have an account?{" "}
            <span onClick={() => setTab("login")}>Login</span>
          </p>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  ROOT APP COMPONENT
// ─────────────────────────────────────────────

function App() {
  const [page, setPage] = useState(() => {
  const user = JSON.parse(localStorage.getItem("mb_user"));
  return user ? "home" : "profile";
});
  const [dark,      setDark]      = useState(() => ls("mb_dark", false));
  const [toastMsg,  setToastMsg]  = useState("");
  const [toastShow, setToastShow] = useState(false);
  const toastTimer = useRef(null);

  // Apply dark mode class on body
  useEffect(() => {
    document.body.classList.toggle("dark", dark);
    lss("mb_dark", dark);
  }, [dark]);

  // Toast helper
  const toast = useCallback((msg) => {
    clearTimeout(toastTimer.current);
    setToastMsg(msg);
    setToastShow(true);
    toastTimer.current = setTimeout(() => setToastShow(false), 3000);
  }, []);

  // Page map
  const pageMap = {
    home:      <Home      setPage={setPage} />,
    checkin:   <CheckIn   toast={toast} />,
    journal:   <Journal   toast={toast} />,
    insights:  <Insights  />,
    emergency: <Emergency toast={toast} />,
    profile:   <Profile   toast={toast} />,
  };
  const user = JSON.parse(localStorage.getItem("mb_user"));

if (!user && page !== "profile") {
  return <Profile toast={toast} />;
}
  return (
    <>
      {user && <Nav page={page} setPage={setPage} dark={dark} setDark={setDark} />}
      <main style={{ minHeight: "calc(100vh - 62px)" }}>
        {pageMap[page] || pageMap.home}
      </main>
      <Toast msg={toastMsg} show={toastShow} />
    </>
  );
}

// ─────────────────────────────────────────────
//  MOUNT
// ─────────────────────────────────────────────


export default App;
