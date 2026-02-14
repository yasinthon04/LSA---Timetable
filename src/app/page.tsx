'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Schedule, Teacher, Subject, YearGroup,
  ScheduleFormData, DAY_NAMES, SCHOOL_START, SCHOOL_END,
  LUNCH_BREAK_1_START, LUNCH_BREAK_1_END, LUNCH_BREAK_2_START, LUNCH_BREAK_2_END,
  SUBJECT_COLORS, TEACHER_COLORS, DAY_FULL_NAMES,
} from '@/lib/types';

// ===== HELPERS =====
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function calculateTeacherHours(schedules: Schedule[], teacherId: string): string {
  const teacherSchedules = schedules.filter(s => s.teacherId === teacherId);
  let totalMinutes = 0;
  for (const s of teacherSchedules) {
    totalMinutes += timeToMinutes(s.endTime) - timeToMinutes(s.startTime);
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

const GRID_START = timeToMinutes(SCHOOL_START);
const GRID_END = timeToMinutes('16:30'); // extend grid for flexibility
const HOUR_HEIGHT = 60; // px per hour
const TIME_SLOTS: string[] = [];
for (let m = GRID_START; m <= GRID_END; m += 60) {
  TIME_SLOTS.push(minutesToTime(m));
}

function getBlockStyle(startTime: string, endTime: string) {
  const startMin = timeToMinutes(startTime) - GRID_START;
  const endMin = timeToMinutes(endTime) - GRID_START;
  const top = (startMin / 60) * HOUR_HEIGHT;
  const height = ((endMin - startMin) / 60) * HOUR_HEIGHT;
  return { top: `${top}px`, height: `${height}px` };
}

function getWeekDates(date: Date): Date[] {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatDateRange(dates: Date[]): string {
  if (dates.length === 0) return '';
  const first = dates[0];
  const last = dates[dates.length - 1];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} - ${last.getDate()} ${months[first.getMonth()]}`;
  }
  return `${first.getDate()} ${months[first.getMonth()].slice(0, 3)} - ${last.getDate()} ${months[last.getMonth()].slice(0, 3)}`;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

// ===== MAIN APP =====
type ActivePage = 'calendar' | 'teachers' | 'subjects';

export default function Home() {
  const [activePage, setActivePage] = useState<ActivePage>('calendar');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [yearGroups, setYearGroups] = useState<YearGroup[]>([]);
  const [selectedYearGroup, setSelectedYearGroup] = useState<string>('');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    schedule?: Schedule;
    prefill?: Partial<ScheduleFormData>;
  }>({ open: false, mode: 'create' });
  const [teacherModal, setTeacherModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    teacher?: Teacher;
  }>({ open: false, mode: 'create' });
  const [subjectModal, setSubjectModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    subject?: Subject;
  }>({ open: false, mode: 'create' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const weekDates = useMemo(() => getWeekDates(currentWeek), [currentWeek]);

  // Show toast
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const [teachersRes, subjectsRes, yearGroupsRes] = await Promise.all([
        fetch('/api/teachers'),
        fetch('/api/subjects'),
        fetch('/api/year-groups'),
      ]);
      const [t, s, y] = await Promise.all([
        teachersRes.json(),
        subjectsRes.json(),
        yearGroupsRes.json(),
      ]);
      setTeachers(t);
      setSubjects(s);
      setYearGroups(y);
      if (y.length > 0 && !selectedYearGroup) {
        setSelectedYearGroup(y[0].id);
      }
    } catch {
      showToast('Failed to load data', 'error');
    }
  }, [selectedYearGroup, showToast]);

  const fetchSchedules = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedYearGroup) params.set('yearGroupId', selectedYearGroup);
      const res = await fetch(`/api/schedules?${params}`);
      const data = await res.json();
      setSchedules(data);
    } catch {
      showToast('Failed to load schedules', 'error');
    }
  }, [selectedYearGroup, showToast]);

  useEffect(() => {
    fetchData().then(() => setLoading(false));
  }, [fetchData]);

  useEffect(() => {
    if (selectedYearGroup) fetchSchedules();
  }, [selectedYearGroup, fetchSchedules]);

  // Filter schedules by selected teachers
  const filteredSchedules = useMemo(() => {
    if (selectedTeacherIds.size === 0) return schedules;
    return schedules.filter(s => selectedTeacherIds.has(s.teacherId));
  }, [schedules, selectedTeacherIds]);

  // Schedule CRUD
  const handleSaveSchedule = async (data: ScheduleFormData, id?: string) => {
    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/schedules/${id}` : '/api/schedules';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      await fetchSchedules();
      setModalState({ open: false, mode: 'create' });
      showToast(id ? 'Schedule updated' : 'Schedule created');
    } catch {
      showToast('Failed to save schedule', 'error');
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await fetchSchedules();
      setModalState({ open: false, mode: 'create' });
      showToast('Schedule deleted');
    } catch {
      showToast('Failed to delete schedule', 'error');
    }
  };

  // Teacher CRUD  
  const handleSaveTeacher = async (data: { name: string; email: string; color: string }, id?: string) => {
    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/teachers/${id}` : '/api/teachers';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      await fetchData();
      await fetchSchedules();
      setTeacherModal({ open: false, mode: 'create' });
      showToast(id ? 'Teacher updated' : 'Teacher added');
    } catch {
      showToast('Failed to save teacher', 'error');
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      const res = await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await fetchData();
      await fetchSchedules();
      setTeacherModal({ open: false, mode: 'create' });
      showToast('Teacher deleted');
    } catch {
      showToast('Failed to delete teacher', 'error');
    }
  };

  // Subject CRUD
  const handleSaveSubject = async (data: { name: string; color: string; type: string }, id?: string) => {
    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/subjects/${id}` : '/api/subjects';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      await fetchData();
      setSubjectModal({ open: false, mode: 'create' });
      showToast(id ? 'Subject updated' : 'Subject added');
    } catch {
      showToast('Failed to save subject', 'error');
    }
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await fetchData();
      await fetchSchedules();
      setSubjectModal({ open: false, mode: 'create' });
      showToast('Subject deleted');
    } catch {
      showToast('Failed to delete subject', 'error');
    }
  };

  // Teacher toggle
  const toggleTeacher = (id: string) => {
    setSelectedTeacherIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Week navigation
  const prevWeek = () => {
    setCurrentWeek(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };
  const nextWeek = () => {
    setCurrentWeek(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  if (loading) {
    return (
      <div className="app-layout">
        <div className="loading-spinner" style={{ width: '100%', height: '100vh' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">ST</div>
          <span className="sidebar-title">Timetable</span>
        </div>

        {/* Subject Legend */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Subjects</div>
          {subjects.filter(s => s.type === 'MAIN').map(subject => (
            <div key={subject.id} className="sidebar-item">
              <div className="sidebar-dot" style={{ backgroundColor: subject.color }}></div>
              <span className="sidebar-item-text">{subject.name}</span>
            </div>
          ))}
          {subjects.filter(s => s.type !== 'MAIN').map(subject => (
            <div key={subject.id} className="sidebar-item">
              <div className="sidebar-dot" style={{ backgroundColor: subject.color, border: '2px dashed rgba(255,255,255,0.3)' }}></div>
              <span className="sidebar-item-text">{subject.name}</span>
            </div>
          ))}
        </div>

        {/* Teacher Filter */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Teachers</div>
          {teachers.map(teacher => (
            <div key={teacher.id} className="sidebar-item" onClick={() => toggleTeacher(teacher.id)}>
              <input
                type="checkbox"
                className="teacher-filter-checkbox"
                checked={selectedTeacherIds.size === 0 || selectedTeacherIds.has(teacher.id)}
                onChange={() => toggleTeacher(teacher.id)}
                style={{ borderColor: teacher.color }}
              />
              <span className="sidebar-item-text">{teacher.name}</span>
              <span className="sidebar-item-hours">{calculateTeacherHours(schedules, teacher.id)}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-content">
        {/* TOP NAV */}
        <nav className="topnav">
          <div className="topnav-links">
            <a className={`topnav-link ${activePage === 'calendar' ? 'active' : ''}`} onClick={() => setActivePage('calendar')}>Calendar</a>
            <a className={`topnav-link ${activePage === 'teachers' ? 'active' : ''}`} onClick={() => setActivePage('teachers')}>Teachers</a>
            <a className={`topnav-link ${activePage === 'subjects' ? 'active' : ''}`} onClick={() => setActivePage('subjects')}>Subjects</a>
          </div>
          <div className="topnav-right">
            <button className="topnav-icon">💬</button>
            <button className="topnav-icon">🔔</button>
            <div className="topnav-avatar">A</div>
          </div>
        </nav>

        {/* CONTENT */}
        {activePage === 'calendar' && (
          <div className="calendar-container">
            {/* Year Group Selector */}
            <div className="year-group-selector">
              {yearGroups.map(yg => (
                <button
                  key={yg.id}
                  className={`year-group-chip ${selectedYearGroup === yg.id ? 'active' : ''}`}
                  onClick={() => setSelectedYearGroup(yg.id)}
                >
                  {yg.name}
                </button>
              ))}
            </div>

            {/* Calendar Header */}
            <div className="calendar-header">
              <div className="calendar-nav">
                <button className="calendar-nav-btn" onClick={prevWeek}>‹</button>
                <span className="calendar-date-range">{formatDateRange(weekDates)}</span>
                <button className="calendar-nav-btn" onClick={nextWeek}>›</button>
              </div>
              <button className="calendar-view-toggle">Week ▾</button>
            </div>

            {/* Calendar Grid */}
            <div className="calendar-grid-wrapper">
              <div className="calendar-grid">
                {/* Header row */}
                <div className="calendar-day-header"></div>
                {weekDates.map((date, i) => (
                  <div key={i} className={`calendar-day-header ${isToday(date) ? 'calendar-day-today' : ''}`}>
                    <span className="calendar-day-number">{date.getDate()}</span>
                    <span className="calendar-day-name">{DAY_NAMES[i]}</span>
                  </div>
                ))}

                {/* Time column */}
                <div className="calendar-time-col">
                  {TIME_SLOTS.map(time => (
                    <div key={time} className="calendar-time-label">{time}</div>
                  ))}
                </div>

                {/* Day columns */}
                {[0, 1, 2, 3, 4].map(dayIndex => {
                  const daySchedules = filteredSchedules.filter(s => s.dayOfWeek === dayIndex);
                  const lunchStart1 = ((timeToMinutes(LUNCH_BREAK_1_START) - GRID_START) / 60) * HOUR_HEIGHT;
                  const lunchHeight1 = ((timeToMinutes(LUNCH_BREAK_1_END) - timeToMinutes(LUNCH_BREAK_1_START)) / 60) * HOUR_HEIGHT;
                  const lunchStart2 = ((timeToMinutes(LUNCH_BREAK_2_START) - GRID_START) / 60) * HOUR_HEIGHT;
                  const lunchHeight2 = ((timeToMinutes(LUNCH_BREAK_2_END) - timeToMinutes(LUNCH_BREAK_2_START)) / 60) * HOUR_HEIGHT;

                  return (
                    <div key={dayIndex} className="calendar-day-col">
                      {/* Hour lines */}
                      {TIME_SLOTS.map((time, i) => (
                        <div
                          key={time}
                          className="calendar-hour-line"
                          onClick={() => {
                            const startMinutes = GRID_START + i * 60;
                            setModalState({
                              open: true,
                              mode: 'create',
                              prefill: {
                                dayOfWeek: dayIndex,
                                startTime: minutesToTime(startMinutes),
                                endTime: minutesToTime(startMinutes + 60),
                                yearGroupId: selectedYearGroup,
                              },
                            });
                          }}
                        />
                      ))}

                      {/* Lunch zones */}
                      <div className="lunch-zone" style={{ top: `${lunchStart1}px`, height: `${lunchHeight1}px` }} />
                      <div className="lunch-zone" style={{ top: `${lunchStart2}px`, height: `${lunchHeight2}px` }} />

                      {/* Schedule blocks */}
                      {daySchedules.map(schedule => {
                        const style = getBlockStyle(schedule.startTime, schedule.endTime);
                        const bgColor = schedule.subject?.color || '#6366f1';
                        return (
                          <div
                            key={schedule.id}
                            className="schedule-block"
                            style={{
                              ...style,
                              backgroundColor: `${bgColor}22`,
                              borderLeftColor: bgColor,
                              color: bgColor,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalState({ open: true, mode: 'edit', schedule });
                            }}
                          >
                            <div className="schedule-block-time">{schedule.startTime}</div>
                            <div className="schedule-block-subject">{schedule.subject?.name}</div>
                            <div className="schedule-block-teacher">{schedule.teacher?.name}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activePage === 'teachers' && (
          <TeachersPage
            teachers={teachers}
            schedules={schedules}
            onEdit={(t) => setTeacherModal({ open: true, mode: 'edit', teacher: t })}
            onDelete={handleDeleteTeacher}
            onAdd={() => setTeacherModal({ open: true, mode: 'create' })}
          />
        )}

        {activePage === 'subjects' && (
          <SubjectsPage
            subjects={subjects}
            onEdit={(s) => setSubjectModal({ open: true, mode: 'edit', subject: s })}
            onDelete={handleDeleteSubject}
            onAdd={() => setSubjectModal({ open: true, mode: 'create' })}
          />
        )}
      </div>

      {/* SCHEDULE MODAL */}
      {modalState.open && (
        <ScheduleModal
          mode={modalState.mode}
          schedule={modalState.schedule}
          prefill={modalState.prefill}
          teachers={teachers}
          subjects={subjects}
          yearGroups={yearGroups}
          onSave={handleSaveSchedule}
          onDelete={handleDeleteSchedule}
          onClose={() => setModalState({ open: false, mode: 'create' })}
        />
      )}

      {/* TEACHER MODAL */}
      {teacherModal.open && (
        <TeacherModal
          mode={teacherModal.mode}
          teacher={teacherModal.teacher}
          onSave={handleSaveTeacher}
          onDelete={handleDeleteTeacher}
          onClose={() => setTeacherModal({ open: false, mode: 'create' })}
        />
      )}

      {/* SUBJECT MODAL */}
      {subjectModal.open && (
        <SubjectModal
          mode={subjectModal.mode}
          subject={subjectModal.subject}
          onSave={handleSaveSubject}
          onDelete={handleDeleteSubject}
          onClose={() => setSubjectModal({ open: false, mode: 'create' })}
        />
      )}

      {/* TOAST */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? '✓' : '✗'} {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== SCHEDULE MODAL =====
function ScheduleModal({
  mode, schedule, prefill, teachers, subjects, yearGroups, onSave, onDelete, onClose,
}: {
  mode: 'create' | 'edit';
  schedule?: Schedule;
  prefill?: Partial<ScheduleFormData>;
  teachers: Teacher[];
  subjects: Subject[];
  yearGroups: YearGroup[];
  onSave: (data: ScheduleFormData, id?: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<ScheduleFormData>({
    teacherId: schedule?.teacherId || prefill?.teacherId || teachers[0]?.id || '',
    subjectId: schedule?.subjectId || prefill?.subjectId || subjects[0]?.id || '',
    yearGroupId: schedule?.yearGroupId || prefill?.yearGroupId || yearGroups[0]?.id || '',
    dayOfWeek: schedule?.dayOfWeek ?? prefill?.dayOfWeek ?? 0,
    startTime: schedule?.startTime || prefill?.startTime || '07:30',
    endTime: schedule?.endTime || prefill?.endTime || '08:30',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, schedule?.id);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{mode === 'create' ? 'New Schedule' : 'Edit Schedule'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Teacher</label>
            <select
              className="form-select"
              value={formData.teacherId}
              onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
            >
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Subject</label>
            <select
              className="form-select"
              value={formData.subjectId}
              onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} {s.type !== 'MAIN' ? `(${s.type})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Year Group</label>
            <select
              className="form-select"
              value={formData.yearGroupId}
              onChange={e => setFormData({ ...formData, yearGroupId: e.target.value })}
            >
              {yearGroups.map(yg => (
                <option key={yg.id} value={yg.id}>{yg.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Day</label>
            <select
              className="form-select"
              value={formData.dayOfWeek}
              onChange={e => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
            >
              {DAY_FULL_NAMES.map((day, i) => (
                <option key={i} value={i}>{day}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input
                type="time"
                className="form-input"
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input
                type="time"
                className="form-input"
                value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="form-actions">
            {mode === 'edit' && schedule && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => onDelete(schedule.id)}
              >
                Delete
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {mode === 'create' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== TEACHERS PAGE =====
function TeachersPage({
  teachers, schedules, onEdit, onDelete, onAdd,
}: {
  teachers: Teacher[];
  schedules: Schedule[];
  onEdit: (t: Teacher) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Teachers</h1>
        <button className="btn btn-primary" onClick={onAdd}>+ Add Teacher</button>
      </div>
      <div className="card-grid">
        {teachers.map(teacher => (
          <div key={teacher.id} className="card">
            <div className="card-header">
              <div className="card-name">
                <div className="sidebar-dot" style={{ backgroundColor: teacher.color, width: 14, height: 14 }}></div>
                {teacher.name}
              </div>
              <div className="card-actions">
                <button className="card-action-btn" onClick={() => onEdit(teacher)}>✎</button>
                <button className="card-action-btn delete" onClick={() => { if (confirm('Delete this teacher?')) onDelete(teacher.id); }}>🗑</button>
              </div>
            </div>
            <div className="card-meta">{teacher.email}</div>
            <div className="card-meta" style={{ marginTop: 8, color: '#818cf8', fontWeight: 500 }}>
              📅 Total: {calculateTeacherHours(schedules, teacher.id)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== TEACHER MODAL =====
function TeacherModal({
  mode, teacher, onSave, onDelete, onClose,
}: {
  mode: 'create' | 'edit';
  teacher?: Teacher;
  onSave: (data: { name: string; email: string; color: string }, id?: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(teacher?.name || '');
  const [email, setEmail] = useState(teacher?.email || '');
  const [color, setColor] = useState(teacher?.color || TEACHER_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, email, color }, teacher?.id);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{mode === 'create' ? 'Add Teacher' : 'Edit Teacher'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Teacher name"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="teacher@school.edu"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-picker-row">
              {TEACHER_COLORS.map(c => (
                <div
                  key={c}
                  className={`color-swatch ${color === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="form-actions">
            {mode === 'edit' && teacher && (
              <button type="button" className="btn btn-danger" onClick={() => { if (confirm('Delete this teacher?')) onDelete(teacher.id); }}>
                Delete
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {mode === 'create' ? 'Add' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== SUBJECTS PAGE =====
function SubjectsPage({
  subjects, onEdit, onDelete, onAdd,
}: {
  subjects: Subject[];
  onEdit: (s: Subject) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  const groupedSubjects = {
    MAIN: subjects.filter(s => s.type === 'MAIN'),
    INTERVENTION: subjects.filter(s => s.type === 'INTERVENTION'),
    BOOSTER: subjects.filter(s => s.type === 'BOOSTER'),
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Subjects</h1>
        <button className="btn btn-primary" onClick={onAdd}>+ Add Subject</button>
      </div>

      {(['MAIN', 'INTERVENTION', 'BOOSTER'] as const).map(type => (
        <div key={type} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`badge badge-${type.toLowerCase()}`}>{type}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              ({groupedSubjects[type].length} subjects)
            </span>
          </h2>
          <div className="card-grid">
            {groupedSubjects[type].map(subject => (
              <div key={subject.id} className="card">
                <div className="card-header">
                  <div className="card-name">
                    <div className="sidebar-dot" style={{ backgroundColor: subject.color, width: 14, height: 14 }}></div>
                    {subject.name}
                  </div>
                  <div className="card-actions">
                    <button className="card-action-btn" onClick={() => onEdit(subject)}>✎</button>
                    <button className="card-action-btn delete" onClick={() => { if (confirm('Delete this subject?')) onDelete(subject.id); }}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== SUBJECT MODAL =====
function SubjectModal({
  mode, subject, onSave, onDelete, onClose,
}: {
  mode: 'create' | 'edit';
  subject?: Subject;
  onSave: (data: { name: string; color: string; type: string }, id?: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(subject?.name || '');
  const [color, setColor] = useState(subject?.color || SUBJECT_COLORS[0]);
  const [type, setType] = useState(subject?.type || 'MAIN');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, color, type }, subject?.id);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{mode === 'create' ? 'Add Subject' : 'Edit Subject'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Subject name"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={type} onChange={e => setType(e.target.value as 'MAIN' | 'INTERVENTION' | 'BOOSTER')}>
              <option value="MAIN">Main</option>
              <option value="INTERVENTION">Intervention</option>
              <option value="BOOSTER">Booster</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-picker-row">
              {SUBJECT_COLORS.map(c => (
                <div
                  key={c}
                  className={`color-swatch ${color === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="form-actions">
            {mode === 'edit' && subject && (
              <button type="button" className="btn btn-danger" onClick={() => { if (confirm('Delete this subject?')) onDelete(subject.id); }}>
                Delete
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {mode === 'create' ? 'Add' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
