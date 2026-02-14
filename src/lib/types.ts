export interface Teacher {
    id: string;
    name: string;
    email: string;
    color: string;
    createdAt: string;
    _count?: { schedules: number };
}

export interface Subject {
    id: string;
    name: string;
    color: string;
    type: 'MAIN' | 'INTERVENTION' | 'BOOSTER';
    createdAt: string;
    yearSubjects?: YearSubject[];
}

export interface YearGroup {
    id: string;
    name: string;
    createdAt: string;
    yearSubjects?: YearSubject[];
    _count?: { schedules: number };
}

export interface YearSubject {
    id: string;
    yearGroupId: string;
    subjectId: string;
    yearGroup?: YearGroup;
    subject?: Subject;
}

export interface Schedule {
    id: string;
    teacherId: string;
    subjectId: string;
    yearGroupId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    createdAt: string;
    teacher?: Teacher;
    subject?: Subject;
    yearGroup?: YearGroup;
}

export interface ScheduleFormData {
    teacherId: string;
    subjectId: string;
    yearGroupId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;
export const DAY_FULL_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

export const SCHOOL_START = '07:30';
export const SCHOOL_END = '14:15';
export const LUNCH_BREAK_1_START = '11:20';
export const LUNCH_BREAK_1_END = '12:15';
export const LUNCH_BREAK_2_START = '12:15';
export const LUNCH_BREAK_2_END = '13:15';

export const SUBJECT_COLORS = [
    '#a78bfa', '#f87171', '#fbbf24', '#fb923c', '#67e8f9',
    '#c4b5fd', '#6ee7b7', '#fdba74', '#bef264', '#94a3b8',
    '#f0abfc', '#86efac', '#fca5a5', '#93c5fd',
];

export const TEACHER_COLORS = [
    '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#3b82f6',
    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
];
