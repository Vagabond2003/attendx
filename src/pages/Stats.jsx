import { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Cell, LabelList, ReferenceLine, 
  ResponsiveContainer, LineChart, Line, Area, Tooltip 
} from 'recharts';
import './Stats.css';

const statsData = [
  {
    id: 1, name: 'Data Structures', code: 'CSE2103',
    color: '#4648d4', total: 18, present: 15,
    absent: 2, late: 1, minimum: 75
  },
  {
    id: 2, name: 'Physics', code: 'PHY1101',
    color: '#904900', total: 20, present: 14,
    absent: 5, late: 1, minimum: 75
  },
  {
    id: 3, name: 'Mathematics', code: 'MTH1201',
    color: '#0f766e', total: 16, present: 13,
    absent: 2, late: 1, minimum: 75
  },
];

const calcPct = (s) => Math.round(((s.present + s.late * 0.5) / s.total) * 100);

const totalPresent = statsData.reduce((a, s) => a + s.present + s.late * 0.5, 0);
const totalClasses = statsData.reduce((a, s) => a + s.total, 0);
const overallPct = Math.round((totalPresent / totalClasses) * 100) || 0;

const classesNeeded = (s) => {
  const pct = calcPct(s);
  if (pct >= s.minimum) return null;
  if (s.minimum >= 100) return null;
  const needed = Math.ceil(
    (s.minimum * s.total - (s.present + s.late * 0.5) * 100) /
    (100 - s.minimum)
  );
  return Math.max(0, needed);
};

const canMiss = (s) => {
  const pct = calcPct(s);
  if (pct < s.minimum) return null;
  const maxAbsent = Math.floor(s.total * (1 - s.minimum / 100));
  return Math.max(0, maxAbsent - s.absent);
};

const barData = statsData.map(s => {
  const pct = calcPct(s);
  return {
    name: s.name.split(' ')[0],
    pct: pct,
    color: pct >= 75 ? '#14a33c' : pct >= 65 ? '#c96e0a' : '#ba1a1a',
    fullName: s.name
  };
});

const trendData = [
  { day: 'Mar 1',  pct: 90 },
  { day: 'Mar 5',  pct: 85 },
  { day: 'Mar 10', pct: 80 },
  { day: 'Mar 15', pct: 83 },
  { day: 'Mar 18', pct: 78 },
  { day: 'Mar 20', pct: 81 },
];

export default function Stats() {
  const [animated, setAnimated] = useState(false);
  const wheelRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let startTimestamp = null;
    const duration = 1500;
    const endPct = overallPct;

    const animateWheel = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const currentPct = Math.floor(easeOut * endPct);

      const path = document.getElementById('statsArc');
      if (path) {
        const circum = 2 * Math.PI * 95;
        path.style.strokeDashoffset = circum - (currentPct / 100) * circum;
      }

      const numElement = document.getElementById('statsPctNum');
      if (numElement) {
        numElement.textContent = `${currentPct}%`;
      }

      const statusElement = document.getElementById('statsPctStatus');
      const glowElement = document.getElementById('statsGlowBg');

      if (statusElement && glowElement) {
        if (currentPct >= 75) {
          statusElement.textContent = 'Safe';
          statusElement.style.color = '#14a33c';
          glowElement.style.background = 'radial-gradient(circle, rgba(20,163,60,0.15) 0%, transparent 60%)';
        } else if (currentPct >= 65) {
          statusElement.textContent = 'Warning';
          statusElement.style.color = '#c96e0a';
          glowElement.style.background = 'radial-gradient(circle, rgba(201,110,10,0.15) 0%, transparent 60%)';
        } else {
          statusElement.textContent = 'Danger';
          statusElement.style.color = '#ba1a1a';
          glowElement.style.background = 'radial-gradient(circle, rgba(186,26,26,0.15) 0%, transparent 60%)';
        }
      }

      if (progress < 1) {
        wheelRef.current = requestAnimationFrame(animateWheel);
      }
    };

    wheelRef.current = requestAnimationFrame(animateWheel);

    return () => {
      if (wheelRef.current) cancelAnimationFrame(wheelRef.current);
    };
  }, []); // Explicitly empty dependency array to prevent re-running

  return (
    <div className="stats-wrapper">
      
      {/* SECTION 1 - PAGE HEADER */}
      <div className="card-in card-delay-05 stats-header">
        <div className="header-blob"></div>
        <div className="session-badge">
          <div className="pulse-dot"></div>
          Fall 2026
        </div>
        <h1 className="header-title">Statistics</h1>
        <p className="header-subtitle">Your attendance analytics</p>
      </div>

      {/* SECTION 2 - OVERALL WHEEL + SUMMARY */}
      <div className="card-in card-delay-15 wheel-card">
        <div id="statsGlowBg" className="wheel-glow-bg"></div>
        <h2 className="wheel-label">Overall Attendance</h2>
        <p className="wheel-sublabel">All subjects combined</p>

        <div className="wheel-container">
          <svg className="progress-ring" width="220" height="220">
            <defs>
              <linearGradient id="statsWGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop id="statsGs1" offset="0%" stopColor="#4648d4" />
                <stop id="statsGs2" offset="100%" stopColor="#6063ee" />
              </linearGradient>
            </defs>
            <circle
              className="progress-ring-bg"
              strokeWidth="16"
              fill="transparent"
              r="95"
              cx="110"
              cy="110"
            />
            <circle
              id="statsArc"
              className="progress-ring-circle"
              strokeWidth="16"
              fill="transparent"
              r="95"
              cx="110"
              cy="110"
              strokeLinecap="round"
              stroke="url(#statsWGrad)"
            />
          </svg>
          <div className="wheel-inner">
            <span id="statsPctNum" className="wheel-pct">0%</span>
            <span id="statsPctStatus" className="wheel-status">Loading</span>
          </div>
        </div>

        <div className="summary-pills-row">
          <div className="summary-pill">
            <span className="pill-val">{totalClasses}</span>
            <span className="pill-lbl">TOTAL</span>
          </div>
          <div className="summary-pill stat-p">
            <span className="pill-val">{statsData.reduce((a,s)=>a+s.present,0)}</span>
            <span className="pill-lbl">PRESENT</span>
          </div>
          <div className="summary-pill stat-a">
            <span className="pill-val">{statsData.reduce((a,s)=>a+s.absent,0)}</span>
            <span className="pill-lbl">ABSENT</span>
          </div>
        </div>
      </div>

      {/* SECTION 3 - PER-SUBJECT BAR CHART */}
      <div className="card-in card-delay-25 chart-card">
        <div className="chart-header">
          <h2 className="chart-title">Subject Breakdown</h2>
          <div className="chart-legend">
            <div className="legend-item"><span className="legend-dot dot-p"></span>≥75%</div>
            <div className="legend-item"><span className="legend-dot dot-w"></span>65–74%</div>
            <div className="legend-item"><span className="legend-dot dot-d"></span>&lt;65%</div>
          </div>
        </div>

        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
              <XAxis 
                type="number" 
                domain={[0, 100]}
                tick={{ fontSize: 9, fill: 'var(--outline)', fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
                tickFormatter={(v) => v + '%'}
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={70}
                tick={{ fontSize: 11, fill: 'var(--on-surface)', fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}
                axisLine={false} 
                tickLine={false} 
              />
              <ReferenceLine 
                x={75} 
                stroke="#ba1a1a"
                strokeDasharray="4 4" 
                strokeWidth={1.5}
                label={{ value: 'Min', position: 'insideTopRight', dy: -8, fontSize: 9, fill: '#ba1a1a', fontFamily: "'Inter', sans-serif", fontWeight: 700 }} 
              />
              <Bar dataKey="pct" radius={[0, 8, 8, 0]} barSize={20}>
                {barData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
                <LabelList 
                  dataKey="pct"
                  position="right"
                  formatter={(v) => v + '%'}
                  style={{ fontSize: '11px', fontWeight: '800', fontFamily: "'Manrope', sans-serif", fill: 'var(--on-surface)' }} 
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 4 - MONTHLY TREND LINE CHART */}
      <div className="card-in card-delay-35 chart-card">
        <div className="chart-header">
          <h2 className="chart-title">Monthly Trend</h2>
          <span className="chart-subtitle">March 2026</span>
        </div>

        <div style={{ width: '100%', height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="statsLineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4648d4" stopOpacity={0.15}/>
                  <stop offset="100%" stopColor="#4648d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="day"
                tick={{ fontSize: 9, fill: 'var(--outline)', fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                domain={[60, 100]}
                tick={{ fontSize: 9, fill: 'var(--outline)', fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
                tickFormatter={(v) => v + '%'}
                axisLine={false} 
                tickLine={false} 
              />
              <ReferenceLine 
                y={75} 
                stroke="#ba1a1a"
                strokeDasharray="4 4" 
                strokeWidth={1.5} 
              />
              <Tooltip
                contentStyle={{
                  background: 'white', border: 'none', borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontFamily: "'Manrope', sans-serif",
                  fontSize: '12px', fontWeight: '700'
                }}
                formatter={(value) => [value + '%', 'Attendance']}
                labelStyle={{ color: 'var(--on-surface-var)', fontSize: '10px', fontWeight: '600' }}
                cursor={{ stroke: 'rgba(70,72,212,0.2)', strokeWidth: 1 }}
              />
              <Area 
                type="monotone" 
                dataKey="pct"
                stroke="#4648d4" 
                strokeWidth={0}
                fill="url(#statsLineGrad)" 
              />
              <Line 
                type="monotone" 
                dataKey="pct"
                stroke="#4648d4" 
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#4648d4', stroke: 'white', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#4648d4', stroke: 'white', strokeWidth: 2, style: { filter: 'drop-shadow(0 0 8px rgba(70,72,212,0.5))' } }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 5 - SUBJECT DETAIL CARDS */}
      <h3 className="section-label card-in card-delay-40">SUBJECT DETAILS</h3>
      
      {statsData.map((s, index) => {
        const pct = calcPct(s);
        const color = pct >= 75 ? '#14a33c' : pct >= 65 ? '#c96e0a' : 'var(--error)';
        const needed = classesNeeded(s);
        const miss = canMiss(s);

        return (
          <div 
            key={s.id} 
            className="subject-detail-card card-in" 
            style={{ animationDelay: `${0.45 + (index * 0.08)}s` }}
          >
            <div className="subject-accent-bar" style={{ background: s.color }}></div>
            
            <div className="subject-top-row">
              <div className="subject-titles">
                <span className="subject-name">{s.name}</span>
                <span className="subject-code">{s.code}</span>
              </div>
              <div className="subject-big-pct" style={{ color }}>
                {pct}%
              </div>
            </div>

            <div className="subject-progress-track">
              <div 
                className="subject-progress-fill" 
                style={{ 
                  width: animated ? `${pct}%` : '0%',
                  background: color
                }}
              ></div>
            </div>

            <div className="subject-stats-row">
              <div className="mini-counter">
                <span className="mini-dot stat-p"></span>
                <span className="mini-val">{s.present}</span>
                <span className="mini-lbl">present</span>
              </div>
              <div className="mini-counter">
                <span className="mini-dot stat-a"></span>
                <span className="mini-val">{s.absent}</span>
                <span className="mini-lbl">absent</span>
              </div>
              <div className="mini-counter">
                <span className="mini-dot stat-l"></span>
                <span className="mini-val">{s.late}</span>
                <span className="mini-lbl">late</span>
              </div>
            </div>

            {needed !== null && (
              <div className="safety-chip at-risk">
                <span className="material-symbols-outlined chip-icon">warning</span>
                <span className="chip-text">Attend {needed} more to reach {s.minimum}%</span>
              </div>
            )}
            
            {miss !== null && (
              <div className="safety-chip safe">
                <span className="material-symbols-outlined chip-icon">check_circle</span>
                <span className="chip-text">Safe! Can miss {miss} more classes</span>
              </div>
            )}
          </div>
        );
      })}

    </div>
  );
}
