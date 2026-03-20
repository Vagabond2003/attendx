import { useState, useEffect, useRef, useCallback } from 'react';
import './Study.css';

const PRESETS = [
  { label: '25 min', seconds: 25 * 60 },
  { label: '45 min', seconds: 45 * 60 },
  { label: '60 min', seconds: 60 * 60 },
];

const allClasses = [
  { id: 1, name: 'Data Structures', color: '#4648d4' },
  { id: 2, name: 'Physics',         color: '#904900' },
  { id: 3, name: 'Mathematics',     color: '#0f766e' },
];

const studyLog = [
  { id: 1, subject: 'Data Structures', color: '#4648d4', topic: 'Binary Trees', date: 'Today', duration: 45 },
  { id: 2, subject: 'Physics', color: '#904900', topic: 'Wave Motion', date: 'Today', duration: 25 },
  { id: 3, subject: 'Mathematics', color: '#0f766e', topic: 'Integration', date: 'Yesterday', duration: 60 },
  { id: 4, subject: 'Data Structures', color: '#4648d4', topic: 'Sorting Algorithms', date: 'Yesterday', duration: 45 },
  { id: 5, subject: 'Physics', color: '#904900', topic: 'Thermodynamics', date: '2 days ago', duration: 30 },
];

export default function Study() {
  const [totalSeconds, setTotalSeconds]     = useState(25 * 60);
  const [secondsLeft, setSecondsLeft]       = useState(25 * 60);
  const [isRunning, setIsRunning]           = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [selectedClass, setSelectedClass]   = useState(null);
  const [topic, setTopic]                   = useState('');
  const [showComplete, setShowComplete]     = useState(false);
  const [filterClass, setFilterClass]       = useState('all');
  const [log, setLog]                       = useState(studyLog);

  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const selectedClassRef = useRef(null);
  const topicRef = useRef('');

  useEffect(() => {
    selectedClassRef.current = selectedClass;
  }, [selectedClass]);

  useEffect(() => {
    topicRef.current = topic;
  }, [topic]);

  const startTimer = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    startTimeRef.current = Date.now() - (totalSeconds - secondsLeft) * 1000;
    
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = totalSeconds - elapsed;
      
      if (remaining <= 0) {
        setSecondsLeft(0);
        setIsRunning(false);
        clearInterval(intervalRef.current);
        setShowComplete(true);
        
        if (selectedClassRef.current || topicRef.current) {
          const cls = allClasses.find(c => c.id === selectedClassRef.current);
          setLog(prev => [{
            id: Date.now(),
            subject: cls ? cls.name : 'General Study',
            color: cls ? cls.color : '#4648d4',
            topic: topicRef.current || 'Study Session',
            date: 'Today',
            duration: Math.round(totalSeconds / 60)
          }, ...prev]);
        }
      } else {
        setSecondsLeft(remaining);
      }
    }, 500);
  }, [isRunning, secondsLeft, totalSeconds]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setSecondsLeft(totalSeconds);
    setShowComplete(false);
  }, [totalSeconds]);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const handlePresetSelect = (index) => {
    setSelectedPreset(index);
    setTotalSeconds(PRESETS[index].seconds);
    setSecondsLeft(PRESETS[index].seconds);
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setShowComplete(false);
  };

  const forceComplete = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setSecondsLeft(0);
    setShowComplete(true);
    
    if (selectedClass || topic) {
      const cls = allClasses.find(c => c.id === selectedClass);
      setLog(prev => [{
        id: Date.now(),
        subject: cls ? cls.name : 'General Study',
        color: cls ? cls.color : '#4648d4',
        topic: topic || 'Study Session',
        date: 'Today',
        duration: Math.round(totalSeconds / 60)
      }, ...prev]);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progress = 1 - (secondsLeft / totalSeconds);
  const CIRCUMFERENCE = 2 * Math.PI * 95;

  const filteredLog = filterClass === 'all'
    ? log
    : log.filter(s => s.subject === allClasses.find(c => c.id === Number(filterClass))?.name);

  return (
    <div className="study-wrapper">
      
      {/* SECTION 1 — PAGE HEADER CARD */}
      <div className="card-in card-delay-05 study-header">
        <div className="header-blob"></div>
        <div className="session-badge">
          <div className="pulse-dot"></div>
          Focus Mode
        </div>
        <h1 className="header-title">Study Timer</h1>
        <p className="header-subtitle">Track your study sessions</p>
      </div>

      {/* SECTION 2 — TIMER CARD */}
      <div className="card-in card-delay-15 timer-card">
        <div 
          id="timerGlowBg" 
          className="timer-glow-bg"
          style={{
            background: showComplete 
              ? 'radial-gradient(circle, rgba(20,163,60,0.12) 0%, transparent 70%)'
              : isRunning 
                ? 'radial-gradient(circle, rgba(70,72,212,0.12) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(70,72,212,0.08) 0%, transparent 70%)'
          }}
        ></div>

        <div className="preset-row">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              className={`preset-pill ${selectedPreset === idx ? 'active' : ''}`}
              onClick={() => handlePresetSelect(idx)}
              disabled={isRunning}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="timer-svg-container">
          <svg className="timer-svg" width="220" height="220">
            <defs>
              <linearGradient id="timerGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={isRunning ? "#4648d4" : showComplete ? "#14a33c" : "#6063ee"} />
                <stop offset="100%" stopColor={isRunning ? "#6063ee" : showComplete ? "#22c55e" : "#818cf8"} />
              </linearGradient>
            </defs>
            <circle
              className="timer-track"
              cx="110" cy="110" r="95"
            />
            <circle
              className="timer-progress"
              cx="110" cy="110" r="95"
              stroke="url(#timerGrad)"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            />
          </svg>
          <div className="timer-overlay">
            <div 
              className="timer-time"
              style={{
                color: showComplete ? '#14a33c' : isRunning ? 'var(--primary)' : 'var(--on-surface)'
              }}
            >
              {formatTime(secondsLeft)}
            </div>
            <div 
              className="timer-status"
              style={{
                color: showComplete ? '#14a33c' : isRunning ? 'var(--primary)' : 'var(--on-surface)'
              }}
            >
              {showComplete ? 'Complete!' : isRunning ? 'Focusing' : secondsLeft < totalSeconds ? 'Paused' : 'Ready'}
            </div>
          </div>
        </div>

        <div className="timer-controls">
          <button className="control-btn small" onClick={resetTimer}>
            <span className="material-symbols-outlined">refresh</span>
          </button>
          
          <button 
            className={`control-btn large ${showComplete ? 'complete' : ''} ${isRunning ? 'running' : ''}`}
            onClick={() => isRunning ? pauseTimer() : startTimer()}
          >
            <div className="btn-shimmer"></div>
            <span className="material-symbols-outlined">
              {isRunning ? 'pause' : 'play_arrow'}
            </span>
          </button>
          
          <button className="control-btn small" onClick={forceComplete}>
            <span className="material-symbols-outlined">skip_next</span>
          </button>
        </div>

        <div className="session-info">
          <label className="field-label">SUBJECT</label>
          <select 
            className="styled-select"
            value={selectedClass || ''}
            onChange={(e) => setSelectedClass(Number(e.target.value) || null)}
          >
            <option value="">Select a subject...</option>
            {allClasses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <label className="field-label" style={{ marginTop: 14 }}>WHAT ARE YOU STUDYING?</label>
          <input 
            type="text" 
            className="styled-input"
            placeholder="e.g. Binary Trees, Wave Motion..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isRunning}
            style={{ opacity: isRunning ? 0.6 : 1 }}
          />
        </div>
      </div>

      {/* SECTION 4 — STUDY LOG */}
      <div className="card-in card-delay-25 log-card">
        <div className="log-header">
          <h2 className="log-title">Study Log</h2>
          <span className="log-weekly-total">
            {log.filter(s => s.date === 'Today' || s.date === 'Yesterday' || s.date === '2 days ago')
               .reduce((a, s) => a + s.duration, 0)} min this week
          </span>
        </div>

        <div className="filter-pills-row">
          <button 
            className={`filter-pill ${filterClass === 'all' ? 'active' : ''}`}
            onClick={() => setFilterClass('all')}
          >
            ALL
          </button>
          {allClasses.map(c => (
            <button 
              key={c.id}
              className={`filter-pill ${filterClass === String(c.id) ? 'active' : ''}`}
              onClick={() => setFilterClass(String(c.id))}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="log-list">
          {filteredLog.length === 0 ? (
            <div className="log-empty">
              <span className="material-symbols-outlined empty-icon">timer_off</span>
              <h3 className="empty-title">No sessions logged</h3>
              <p className="empty-subtitle">Start a timer to track your study time</p>
            </div>
          ) : (
            filteredLog.map((item, index) => (
              <div 
                key={item.id} 
                className="log-item card-in" 
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="log-dot" style={{ background: item.color }}></div>
                <div className="log-content">
                  <div className="log-topic">{item.topic}</div>
                  <div className="log-date">{item.subject} &middot; {item.date}</div>
                </div>
                <div className="log-actions">
                  <div className="log-duration">{item.duration} min</div>
                  <button 
                    className="log-delete"
                    onClick={() => setLog(prev => prev.filter(s => s.id !== item.id))}
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECTION 3 — COMPLETION MODAL */}
      {showComplete && (
        <div className="completion-overlay">
          <div className="completion-modal">
            <div className="completion-icon-circle">
              <span className="material-symbols-outlined complete-icon">check_circle</span>
            </div>
            <h2 className="completion-title">Session Complete! 🎉</h2>
            <div className="completion-duration-chip">
              {Math.round(totalSeconds / 60)} minutes logged
            </div>
            <div className="completion-actions">
              <button 
                className="btn-primary"
                onClick={() => {
                  resetTimer();
                  setShowComplete(false);
                  setTopic('');
                  setSelectedClass(null);
                }}
              >
                Start Another Session
              </button>
              <button 
                className="btn-cancel"
                onClick={() => setShowComplete(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
