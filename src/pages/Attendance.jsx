import { useState } from 'react';
import { 
  format, startOfWeek, addDays, addWeeks, subWeeks, 
  isSameDay, getDaysInMonth, startOfMonth, getDay, addMonths 
} from 'date-fns';
import { useAttendance } from '../hooks/useAttendance';
import './Attendance.css';

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [activeNoteKey, setActiveNoteKey] = useState(null);

  const {
     classes: allClasses,
     statuses, notes, loading, syncing,
     setStatuses, setNotes,
     handleMarkAttendance, handleMarkAll,
     getScheduleDays
  } = useAttendance();

  // --- Computed Week Values ---
  const today = new Date();
  const weekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const selectedDayName = format(selectedDate, 'EEEE');
  
  const todaysClasses = allClasses.filter(cls =>
     getScheduleDays(cls).includes(selectedDayName)
  );

  // --- Computed Month Values ---
  const calendarDate = addMonths(startOfMonth(today), monthOffset);
  const daysInMonth = getDaysInMonth(calendarDate);
  const firstDayOfWeek = (getDay(startOfMonth(calendarDate)) + 6) % 7; // Monday = 0
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyCells = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  // --- Helpers & Handlers ---
  const makeKey = (date, classId) => `${format(date, 'yyyy-MM-dd')}-${classId}`;

  const handleDaySelect = (dayObj) => {
    setSelectedDate(dayObj);
  };

  const handleCalendarDateClick = (dateObj) => {
    setSelectedDate(dateObj);
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
    const startOfTargetWeek = startOfWeek(dateObj, { weekStartsOn: 1 });
    const diffMs = startOfTargetWeek - startOfCurrentWeek;
    const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
    setWeekOffset(diffWeeks);
  };

  const toggleStatus = (key, btn, cls) => {
     handleMarkAttendance(selectedDate, cls.id, btn, notes[key] || '');
  };

  return (
    <div className="attendance-wrapper">
      
      {/* SECTION 1 - PAGE HEADER CARD */}
      <div className="card-in card-delay-05 attendance-header">
        <div className="header-blob"></div>
        <div className="session-badge">
          <div className="pulse-dot"></div>
          {format(selectedDate, 'EEEE')}
        </div>
        <h1 className="header-title">Attendance</h1>
        <p className="header-subtitle">{format(selectedDate, 'MMMM d, yyyy')}</p>
      </div>

      {/* SECTION 2 - WEEK STRIP + NAVIGATION */}
      <div className="card-in card-delay-15 week-strip-card">
        <div className="week-nav-row">
          <button className="nav-arrow" onClick={() => setWeekOffset(prev => prev - 1)}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          
          <div className="week-range">
            {format(weekDays[0], 'MMM d')} – {format(weekDays[6], 'MMM d')}
            {weekOffset !== 0 && (
              <button 
                className="today-btn"
                onClick={() => { setWeekOffset(0); setSelectedDate(new Date()); }}
              >
                Today
              </button>
            )}
          </div>

          <button className="nav-arrow" onClick={() => setWeekOffset(prev => prev + 1)}>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <div className="day-pills-row">
          {weekDays.map(day => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);
            const hasTodayClasses = allClasses.some(c => getScheduleDays(c).includes(format(day, 'EEEE')));
            
            let pillClass = 'day-pill-btn';
            if (isSelected) pillClass += ' selected';
            else if (isToday) pillClass += ' today';

            return (
              <button key={day.toISOString()} className={pillClass} onClick={() => handleDaySelect(day)}>
                <span className="day-letter">{format(day, 'E').charAt(0)}</span>
                <span className="day-number">{format(day, 'd')}</span>
                {hasTodayClasses && <div className="day-dot"></div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3 - CLASS LIST FOR SELECTED DATE */}
      <div className="card-in card-delay-25 list-card" style={{ position: 'relative' }}>
        <div className="list-header">
          <h2 className="list-title">Classes — {format(selectedDate, 'E')}</h2>
          {todaysClasses.length > 0 && !loading && (
            <button className="mark-all-btn" onClick={() => handleMarkAll(selectedDate, todaysClasses)}>
              Mark All Present
            </button>
          )}
        </div>

        {loading ? (
           <div className="class-rows-container">
             {[1, 2, 3].map(i => (
               <div key={i} style={{
                 height: '110px', borderRadius: '20px',
                 background: 'linear-gradient(90deg, #e8eeff 25%, #f0f4ff 50%, #e8eeff 75%)',
                 backgroundSize: '200% 100%',
                 animation: 'shimmer 1.5s infinite',
                 marginBottom: '12px'
               }}></div>
             ))}
           </div>
        ) : todaysClasses.length === 0 ? (
          <div className="empty-day-state">
            <span className="material-symbols-outlined emoji-icon">celebration</span>
            <h3 className="empty-title">No classes today! 🎉</h3>
            <p className="empty-subtitle">Enjoy your free day</p>
          </div>
        ) : (
          <div className="class-rows-container">
            {todaysClasses.map(cls => {
              const key = makeKey(selectedDate, cls.id);
              const currentStatus = statuses[key];
              const noteVal = notes[key] || '';
              const isNoteOpen = activeNoteKey === key;

              return (
                <div key={cls.id} className="class-row">
                  {/* Top Part */}
                  <div className="row-top-part">
                    <div className="row-info">
                      <div className="row-accent-bar" style={{ background: cls.color || '#6366f1' }}></div>
                      <div className="row-text-stack">
                        <span className="row-class-name">{cls.name}</span>
                        <span className="row-class-code">{cls.code || ''}</span>
                      </div>
                    </div>
                    <div className="row-status-area">
                      <div className={`status-badge stat-${currentStatus || 'null'}`}>
                        {currentStatus === 'P' && 'PRESENT'}
                        {currentStatus === 'A' && 'ABSENT'}
                        {currentStatus === 'L' && 'LATE'}
                        {!currentStatus && 'NOT MARKED'}
                      </div>
                      <button 
                        className={`note-btn ${noteVal ? 'has-note' : ''}`}
                        onClick={() => setActiveNoteKey(prev => prev === key ? null : key)}
                      >
                        <span className="material-symbols-outlined">edit_note</span>
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="action-buttons-row">
                    {['P', 'A', 'L'].map(st => {
                      const isSelected = currentStatus === st;
                      const iconMap = { P: 'check_circle', A: 'cancel', L: 'schedule' };
                      const labelMap = { P: 'Present', A: 'Absent', L: 'Late' };
                      return (
                        <button
                          key={st}
                          className={`action-btn btn-${st.toLowerCase()} ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleStatus(key, st, cls)}
                        >
                          {isSelected && <div className="btn-shimmer"></div>}
                          <span className="material-symbols-outlined btn-icon">{iconMap[st]}</span>
                          {labelMap[st]}
                        </button>
                      );
                    })}
                  </div>

                  {/* Note Input */}
                  {isNoteOpen && (
                    <input
                      key={`note-${key}`}
                      type="text"
                      className="note-input"
                      placeholder="Add a note (optional)..."
                      value={noteVal}
                      onChange={(e) => setNotes(prev => ({ ...prev, [key]: e.target.value }))}
                      autoFocus
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {syncing && (
          <div style={{
            position: 'absolute', bottom: '12px', right: '16px',
            padding: '4px 10px', borderRadius: '99px',
            background: 'rgba(70,72,212,0.08)',
            color: 'var(--primary)', fontSize: '9px',
            fontWeight: 700, letterSpacing: '0.08em',
            animation: 'pulse 1s ease-in-out infinite'
          }}>Syncing...</div>
        )}
      </div>

      {/* SECTION 4 - MONTHLY MINI CALENDAR */}
      <div className="card-in card-delay-35 calendar-card">
        <div className="calendar-header">
          <h2 className="calendar-title">{format(calendarDate, 'MMMM yyyy')}</h2>
          <div className="calendar-nav">
            <button className="cal-arrow" onClick={() => setMonthOffset(prev => prev - 1)}>
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="cal-arrow" onClick={() => setMonthOffset(prev => prev + 1)}>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>

        <div className="calendar-dow-row">
          <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
        </div>

        <div className="calendar-grid">
          {emptyCells.map(i => <div key={`empty-${i}`} className="cal-cell empty"></div>)}
          
          {calendarDays.map(dayNum => {
            const dateObj = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), dayNum);
            const isSelected = isSameDay(dateObj, selectedDate);
            const isToday = isSameDay(dateObj, today);
            
            // Calculate dot logic
            const dayName = format(dateObj, 'EEEE');
            const classesOnDay = allClasses.filter(c => getScheduleDays(c).includes(dayName));
            let dotColor = null;
            
            if (classesOnDay.length > 0) {
              let hasP = false, hasA = false, hasL = false, hasAny = false;
              classesOnDay.forEach(c => {
                const s = statuses[makeKey(dateObj, c.id)];
                if (s) hasAny = true;
                if (s === 'P') hasP = true;
                if (s === 'A') hasA = true;
                if (s === 'L') hasL = true;
              });

              if (hasAny) {
                if (hasA) dotColor = 'var(--error)';
                else if (hasL) dotColor = 'var(--tertiary)';
                else dotColor = '#14a33c'; // All present (or at least no late/absent among marked)
              }
            }

            let cellClass = 'cal-cell';
            if (isSelected) cellClass += ' selected';
            else if (isToday) cellClass += ' today';

            return (
              <button 
                key={dateObj.toISOString()} 
                className={cellClass}
                onClick={() => handleCalendarDateClick(dateObj)}
              >
                {dayNum}
                {dotColor && <div className="cal-dot" style={{ background: dotColor }}></div>}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
