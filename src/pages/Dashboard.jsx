import { useState, useEffect } from 'react';
import './Dashboard.css';

// --- Helper Functions ---
function getWheelColor(pct) {
  if (pct <= 50) {
    const t = pct / 50;
    const r = Math.max(0, Math.min(255, Math.round(186 + (201 - 186) * t)));
    const g = Math.max(0, Math.min(255, Math.round(26 + (110 - 26) * t)));
    const b = Math.max(0, Math.min(255, Math.round(26 + (10 - 26) * t)));
    const r2 = Math.max(0, Math.min(255, r + 38));
    const g2 = Math.max(0, Math.min(255, g + 70));
    const b2 = Math.max(0, Math.min(255, b + 54));
    return { c1: `rgb(${r},${g},${b})`, c2: `rgb(${r2},${g2},${b2})` };
  } else {
    const t = (pct - 50) / 50;
    const r = Math.max(0, Math.min(255, Math.round(201 + (20 - 201) * t)));
    const g = Math.max(0, Math.min(255, Math.round(110 + (163 - 110) * t)));
    const b = Math.max(0, Math.min(255, Math.round(10 + (60 - 10) * t)));
    const r2 = Math.max(0, Math.min(255, r + 20));
    const g2 = Math.max(0, Math.min(255, g + 40));
    const b2 = Math.max(0, Math.min(255, b + 40));
    return { c1: `rgb(${r},${g},${b})`, c2: `rgb(${r2},${g2},${b2})` };
  }
}

function getStatus(pct) {
  if (pct < 40) return 'Critical';
  if (pct < 60) return 'Low';
  if (pct < 75) return 'Fair';
  if (pct < 85) return 'Good';
  if (pct < 95) return 'Great';
  return 'Perfect';
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// --- Main Component ---
export default function Dashboard() {
  const [classStatuses, setClassStatuses] = useState({});

  // Dynamic Greeting Badge
  const hour = new Date().getHours();
  let badgeText = "Good Evening";
  if (hour < 12) badgeText = "Good Morning";
  else if (hour < 17) badgeText = "Good Afternoon";

  // Today's Date String
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });
  const todayShortStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  });

  // Wheel Animation Effect
  useEffect(() => {
    const CIRCUMFERENCE = 2 * Math.PI * 95; // ≈ 596.9
    const TARGET = 83; // Hardcoded target
    const DURATION = 1900;
    
    let startTime = null;
    let animationFrameId;

    const arc = document.getElementById('wheelArc');
    const numEl = document.getElementById('pctNum');
    const statusEl = document.getElementById('pctStatus');
    const gs1 = document.getElementById('gs1');
    const gs2 = document.getElementById('gs2');
    const glowBg = document.getElementById('wheelGlowBg');

    function animate(ts) {
      if (!startTime) startTime = ts;
      const raw = Math.min((ts - startTime) / DURATION, 1);
      const eased = easeOutBack(raw);
      const val = Math.max(0, Math.min(eased * TARGET, 100)); // clamp 0-100
      
      // We know target <= 100, but easing can overshoot slightly
      const displayVal = Math.max(0, Math.min(Math.round(val), 100)); 
      
      const offset = CIRCUMFERENCE * (1 - Math.min(val, 100) / 100);
      
      if (arc) arc.style.strokeDashoffset = offset;
      
      const { c1, c2 } = getWheelColor(Math.min(val, 100));
      
      if (gs1) gs1.setAttribute('stopColor', c1);
      if (gs2) gs2.setAttribute('stopColor', c2);
      if (numEl) {
        numEl.style.color = c1;
        numEl.textContent = displayVal;
      }
      if (statusEl) {
        statusEl.style.color = c1;
        statusEl.textContent = getStatus(displayVal);
      }
      if (glowBg) {
        const rgbMatch = c1.match(/rgb\((\d+),(\d+),(\d+)\)/);
        if (rgbMatch) {
          glowBg.style.background = `radial-gradient(circle, rgba(${rgbMatch[1]},${rgbMatch[2]},${rgbMatch[3]},0.1) 0%, transparent 70%)`;
        }
      }

      if (raw < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        // Final frame setup
        if (arc) arc.style.strokeDashoffset = CIRCUMFERENCE * (1 - TARGET / 100);
        const final = getWheelColor(TARGET);
        if (gs1) gs1.setAttribute('stopColor', final.c1);
        if (gs2) gs2.setAttribute('stopColor', final.c2);
        if (numEl) {
          numEl.style.color = final.c1;
          numEl.textContent = TARGET;
        }
        if (statusEl) {
          statusEl.style.color = final.c1;
          statusEl.textContent = getStatus(TARGET);
        }
      }
    }

    const timer = setTimeout(() => {
      animationFrameId = requestAnimationFrame(animate);
    }, 500);

    return () => {
      clearTimeout(timer);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleStatusChange = (classIndex, status) => {
    setClassStatuses(prev => ({
      ...prev,
      [classIndex]: prev[classIndex] === status ? null : status // Toggle off if clicked again
    }));
  };

  const todayClasses = [
    { title: "Data Structures", time: "9:00 AM", color: "#4648d4" },
    { title: "Physics", time: "11:00 AM", color: "#904900" },
    { title: "Mathematics", time: "2:00 PM", color: "#0f766e" },
  ];

  const recentActivity = [
    { status: 'P', action: 'Marked Present', subject: 'Data Structures', meta: 'Today, 9:00 AM', time: '2h ago' },
    { status: 'A', action: 'Marked Absent',  subject: 'Physics', meta: 'Today, 11:00 AM', time: '4h ago' },
    { status: 'P', action: 'Marked Present', subject: 'Mathematics', meta: 'Yesterday', time: '1d ago' },
    { status: 'L', action: 'Marked Late',    subject: 'Data Structures', meta: 'Yesterday', time: '1d ago' },
    { status: 'P', action: 'Marked Present', subject: 'Physics', meta: '2 days ago', time: '2d ago' },
  ];

  return (
    <div className="dashboard-wrapper">
      {/* SECTION 1 - GREETING BANNER */}
      <div className="card card-1 greeting-card">
        <div className="greeting-blob"></div>
        <div className="session-badge">
          <div className="pulse-dot"></div>
          {badgeText}
        </div>
        <h1 className="greeting-title">Hey, Nafiz 👋</h1>
        <p className="greeting-date">{todayStr}</p>
      </div>

      {/* SECTION 2 - PERCENTAGE WHEEL CARD */}
      <div className="card card-2 wheel-card">
        <div id="wheelGlowBg" className="wheel-glow"></div>
        <h2 className="wheel-subject">Overall Attendance</h2>
        <p className="wheel-date">Fall Semester 2026</p>

        <div className="wheel-container">
          <svg viewBox="0 0 220 220" width="220" height="220" className="wheel-svg">
            <defs>
              <linearGradient id="wGrad" x1="0" y1="0" x2="1" y2="1">
                <stop id="gs1" offset="0%" stopColor="#ba1a1a" />
                <stop id="gs2" offset="100%" stopColor="#e05050" />
              </linearGradient>
            </defs>
            <circle cx="110" cy="110" r="95" fill="none" stroke="var(--surface-low)" strokeWidth="14" />
            <circle
              id="wheelArc" cx="110" cy="110" r="95" fill="none"
              stroke="url(#wGrad)" strokeWidth="14" strokeLinecap="round"
              strokeDasharray="597" strokeDashoffset="597" className="wheel-arc-active"
            />
          </svg>
          <div className="wheel-overlay">
            <div className="pct-group">
              <span id="pctNum" className="pct-num">0</span>
              <span className="pct-symbol">%</span>
            </div>
            <span id="pctStatus" className="pct-status">Calculating</span>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-pill"><span className="stat-value">18</span><span className="stat-label">TOTAL</span></div>
          <div className="stat-pill"><span className="stat-value text-primary">15</span><span className="stat-label">ATTENDED</span></div>
          <div className="stat-pill"><span className="stat-value text-error">3</span><span className="stat-label">MISSED</span></div>
        </div>
      </div>

      {/* SECTION 3 - AT-RISK ALERT CARD */}
      <div className="card card-3 risk-card">
        <div className="risk-header">
          <div className="risk-title-group">
            <span className="material-symbols-outlined risk-icon">warning</span>
            <span className="risk-title">At Risk</span>
          </div>
          <span className="risk-badge">2 subjects</span>
        </div>
        
        <div className="risk-row">
          <div className="risk-info">
            <div className="risk-bar"></div>
            <div className="risk-text-stack">
              <span className="risk-subject-name">Physics</span><span className="risk-percent">68%</span>
            </div>
          </div>
          <span className="risk-chip">need 4 more</span>
        </div>

        <div className="risk-row">
          <div className="risk-info">
            <div className="risk-bar"></div>
            <div className="risk-text-stack">
              <span className="risk-subject-name">Mathematics</span><span className="risk-percent">71%</span>
            </div>
          </div>
          <span className="risk-chip">need 2 more</span>
        </div>
      </div>

      {/* SECTION 4 - TODAY'S SCHEDULE CARD */}
      <div className="card card-4 schedule-card">
        <div className="schedule-header">
          <h2 className="section-title">Today's Classes</h2><span className="section-date">{todayShortStr}</span>
        </div>

        {todayClasses.map((cls, idx) => {
          const status = classStatuses[idx];
          return (
            <div className="schedule-row" key={idx}>
              <div className="schedule-info">
                <div className="schedule-bar" style={{ background: cls.color }}></div>
                <div className="schedule-text-stack">
                  <span className="schedule-subject-name">{cls.title}</span><span className="schedule-time">{cls.time}</span>
                </div>
              </div>
              <div className="quick-actions">
                {['P', 'A', 'L'].map(st => (
                  <button 
                    key={st}
                    className={`qa-btn qa-btn-${st.toLowerCase()} ${status === st ? 'selected' : ''}`}
                    onClick={() => handleStatusChange(idx, st)}
                  >
                    {status === st && <div className="btn-shimmer"></div>}
                    {st}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION 5 - RECENT ACTIVITY CARD */}
      <div className="card card-5 activity-card">
        <h2 className="section-title mb-activity">Recent Activity</h2>
        
        {recentActivity.map((item, idx) => (
          <div className={`activity-item ${idx > 0 ? 'bordered' : ''}`} key={idx}>
            <div className={`activity-dot dot-${item.status.toLowerCase()}`}></div>
            <div className="activity-text-stack">
              <span className="activity-action">{item.action}</span>
              <span className="activity-meta">{item.subject} · {item.meta}</span>
            </div>
            <span className="activity-time">{item.time}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
