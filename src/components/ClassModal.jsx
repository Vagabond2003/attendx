import { useState, useEffect } from 'react';
import './ClassModal.css';

const COLORS = [
  '#4648d4', '#6063ee', '#904900', '#0f766e',
  '#be185d', '#0369a1', '#7c3aed', '#dc2626'
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_MAP = {
  'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday', 
  'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday'
};

export default function ClassModal({ isOpen, onClose, onSave, editingClass }) {
  const [formData, setFormData] = useState({
    name: '', code: '', teacher: '',
    minimum: 75, color: '#4648d4', schedule: []
  });
  
  const [shake, setShake] = useState(false);

  // Reset form when modal opens/closes or editingClass changes
  useEffect(() => {
    if (editingClass) {
      setFormData({ ...editingClass });
    } else {
      setFormData({
        name: '', code: '', teacher: '',
        minimum: 75, color: '#4648d4', schedule: []
      });
    }
  }, [editingClass, isOpen]);

  // Don't render anything if not open
  if (!isOpen) return null;

  const handleSave = () => {
    if (!formData.name.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 500); // Remove shake class after animation
      return;
    }
    
    // Pass a snapshot of current state
    onSave({ ...formData });
  };

  const toggleDay = (dayAbbr) => {
    const fullDay = DAY_MAP[dayAbbr];
    const isEditing = formData.schedule.some(s => s.day === fullDay);
    
    if (isEditing) {
      setFormData(prev => ({
        ...prev,
        schedule: prev.schedule.filter(s => s.day !== fullDay)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        schedule: [...prev.schedule, { day: fullDay, time: '09:00' }]
      }));
    }
  };

  const updateTime = (dayAbbr, newTime) => {
    const fullDay = DAY_MAP[dayAbbr];
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.map(s => 
        s.day === fullDay ? { ...s, time: newTime } : s
      )
    }));
  };

  const isDayActive = (dayAbbr) => {
    return formData.schedule.some(s => s.day === DAY_MAP[dayAbbr]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        
        <div className="sheet-handle"></div>
        <h2 className="modal-title">
          {editingClass ? "Edit Class" : "Add New Class"}
        </h2>

        {/* 1. Subject Name */}
        <div className="field-group">
          <label className="field-label">Subject Name</label>
          <input 
            type="text" 
            className={`field-input ${shake ? 'input-shake' : ''}`}
            placeholder="e.g. Data Structures"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
        </div>

        {/* 2. Course Code & 3. Teacher */}
        <div className="field-row">
          <div className="field-group flex-1">
            <label className="field-label">Course Code</label>
            <input 
              type="text" 
              className="field-input"
              placeholder="e.g. CSE2103"
              value={formData.code}
              onChange={e => setFormData({...formData, code: e.target.value})}
            />
          </div>
          <div className="field-group flex-1">
            <label className="field-label">Teacher Name</label>
            <input 
              type="text" 
              className="field-input"
              placeholder="e.g. Dr. Rahman"
              value={formData.teacher}
              onChange={e => setFormData({...formData, teacher: e.target.value})}
            />
          </div>
        </div>

        {/* 4. Minimum Attendance */}
        <div className="field-group">
          <label className="field-label">Minimum Attendance %</label>
          <input 
            type="number" 
            className="field-input"
            min="0" max="100"
            value={formData.minimum}
            onChange={e => setFormData({...formData, minimum: Number(e.target.value)})}
          />
        </div>

        {/* 5. Color Picker */}
        <div className="field-group">
          <label className="field-label">Class Color</label>
          <div className="color-picker-row">
            {COLORS.map(color => {
              const rgb = Number('0x'+color.slice(1,3)) + ',' + 
                          Number('0x'+color.slice(3,5)) + ',' + 
                          Number('0x'+color.slice(5,7));
              const isSelected = formData.color === color;
              
              return (
                <button
                  key={color}
                  className={`color-swatch ${isSelected ? 'selected' : ''}`}
                  style={{ 
                    background: color,
                    '--rgba-color': rgb
                  }}
                  onClick={() => setFormData({...formData, color})}
                  type="button"
                />
              );
            })}
          </div>
        </div>

        {/* 6. Schedule Builder */}
        <div className="field-group">
          <label className="field-label">Weekly Schedule</label>
          <div className="day-pills-row">
            {DAYS.map(day => (
              <button
                key={day}
                type="button"
                className={`day-pill ${isDayActive(day) ? 'active' : ''}`}
                onClick={() => toggleDay(day)}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="schedule-times-col">
            {DAYS.filter(isDayActive).map(day => {
              const fullDay = DAY_MAP[day];
              const scheduleItem = formData.schedule.find(s => s.day === fullDay);
              
              return (
                <div key={day} className="active-day-row">
                  <span className="active-day-label">{fullDay}</span>
                  <input
                    type="time"
                    className="field-input time-input"
                    value={scheduleItem.time}
                    onChange={(e) => updateTime(day, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="modal-actions">
          <button className="save-btn" onClick={handleSave}>
            {editingClass ? "Save Changes" : "Add Class"}
            <span className="material-symbols-outlined save-icon">check</span>
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
