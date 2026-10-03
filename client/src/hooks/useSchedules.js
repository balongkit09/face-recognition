import { useCallback, useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { notify } from '../firebase/notifications';

const COLLECTION = 'schedule';

// Every class is capped at 50 students.
export const SCHEDULE_CAPACITY = 50;
export const SCHEDULE_TYPES = ['Lec', 'Lab'];
export const SCHEDULE_STATUSES = ['Open', 'Full', 'Dissolved'];
export const SCHEDULE_DAYS = ['M-W-F', 'T-TH', 'M-W', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Daily'];

function normalizeType(value) {
  const v = String(value || '').trim().toLowerCase();
  if (v.startsWith('lab')) return 'Lab';
  return 'Lec';
}

function normalizeStatus(value, enrolled) {
  const v = String(value || '').trim().toLowerCase();
  if (v.startsWith('dis')) return 'Dissolved';
  if (v === 'full' || enrolled >= SCHEDULE_CAPACITY) return 'Full';
  return 'Open';
}

function clampEnrolled(value) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.min(n, SCHEDULE_CAPACITY);
}

/** Format "08:00" -> "08:00 AM" for display. */
export function formatTime(value) {
  if (!value) return '';
  const [h, m] = String(value).split(':').map((p) => Number.parseInt(p, 10));
  if (Number.isNaN(h)) return value;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, '0')}:${String(m || 0).padStart(2, '0')} ${suffix}`;
}

export function formatScheduleTime(schedule) {
  if (!schedule.startTime && !schedule.endTime) return '—';
  return `${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`;
}

function toPayload(data) {
  const enrolled = clampEnrolled(data.enrolled);
  return {
    code: (data.code || '').trim().toUpperCase(),
    edpCode: (data.edpCode || '').trim(),
    subject: (data.subject || '').trim(),
    type: normalizeType(data.type),
    startTime: (data.startTime || '').trim(),
    endTime: (data.endTime || '').trim(),
    days: (data.days || '').trim(),
    room: (data.room || '').trim(),
    section: (data.section || '').trim().toUpperCase(),
    teacherId: (data.teacherId || '').trim(),
    teacher: (data.teacher || '').trim(),
    term: (data.term || '').trim(),
    enrolled,
    capacity: SCHEDULE_CAPACITY,
    status: normalizeStatus(data.status, enrolled),
  };
}

export function useSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, COLLECTION),
      (snapshot) => {
        const rows = snapshot.docs.map((d) => {
          const data = d.data();
          const enrolled = clampEnrolled(data.enrolled);
          return {
            id: d.id,
            ...data,
            type: normalizeType(data.type),
            enrolled,
            capacity: SCHEDULE_CAPACITY,
            status: normalizeStatus(data.status, enrolled),
          };
        });
        rows.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
        setSchedules(rows);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  const addSchedule = useCallback(async (data, { silent = false } = {}) => {
    const payload = toPayload(data);
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    if (!silent) {
      notify({
        type: 'add',
        entity: 'schedule',
        title: `Schedule added: ${payload.code}${payload.section ? ` (${payload.section})` : ''}`,
        message: `${payload.subject}${payload.teacher ? ` · ${payload.teacher}` : ''}${payload.room ? ` · ${payload.room}` : ''}`,
        meta: { scheduleId: docRef.id },
      });
    }
    return docRef.id;
  }, []);

  const updateSchedule = useCallback(async (id, data, { silent = false } = {}) => {
    const payload = toPayload(data);
    await updateDoc(doc(db, COLLECTION, id), {
      ...payload,
      updatedAt: serverTimestamp(),
    });
    if (!silent) {
      notify({
        type: 'update',
        entity: 'schedule',
        title: `Schedule updated: ${payload.code}${payload.section ? ` (${payload.section})` : ''}`,
        message: `${payload.subject} · ${payload.enrolled}/${SCHEDULE_CAPACITY} · ${payload.status}`,
        meta: { scheduleId: id },
      });
    }
  }, []);

  const deleteSchedule = useCallback(
    async (id, { silent = false } = {}) => {
      const schedule = schedules.find((s) => s.id === id);
      await deleteDoc(doc(db, COLLECTION, id));
      if (!silent) {
        notify({
          type: 'delete',
          entity: 'schedule',
          title: `Schedule removed: ${schedule?.code || id}${schedule?.section ? ` (${schedule.section})` : ''}`,
          message: schedule?.subject || '',
          meta: { scheduleId: id },
        });
      }
    },
    [schedules],
  );

  return { schedules, loading, error, addSchedule, updateSchedule, deleteSchedule };
}
