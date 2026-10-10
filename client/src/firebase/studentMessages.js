import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { notify } from './notifications';

export const STUDENT_MESSAGES_COLLECTION = 'studentMessages';

export async function sendStudentMessage({ student, subject, body, facultyId = '', facultyName = '' }) {
  const user = auth.currentUser;
  const payload = {
    studentId: student.id || '',
    studentName: student.name || '',
    idNumber: student.idNumber || '',
    email: student.email || '',
    subject: (subject || '').trim(),
    body: (body || '').trim(),
    facultyId: facultyId || '',
    facultyName: facultyName || user?.displayName || '',
    actorUid: user?.uid || '',
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, STUDENT_MESSAGES_COLLECTION), payload);
  notify({
    type: 'info',
    entity: 'message',
    title: `Message sent to ${payload.studentName}`,
    message: payload.subject,
    meta: { messageId: ref.id, studentId: payload.studentId },
    audience: 'admin',
  });
  return ref.id;
}

export function buildMailto({ email, subject, body }) {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  return `mailto:${encodeURIComponent(email)}?${params.toString()}`;
}
