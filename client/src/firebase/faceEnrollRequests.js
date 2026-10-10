import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { notify } from './notifications';

function persistCaptures(captures = {}) {
  return {
    front: captures.front || '',
    right: captures.right || '',
    left: captures.left || '',
  };
}

export const FACE_ENROLL_COLLECTION = 'faceEnrollRequests';

export async function requestFaceEnroll({ student, note = '', facultyId = '', facultyName = '' }) {
  const user = auth.currentUser;
  const payload = {
    type: 'faceEnroll',
    status: 'pending',
    studentId: student.id || '',
    studentName: student.name || '',
    idNumber: student.idNumber || '',
    email: student.email || '',
    edpCode: student.edpCode || '',
    program: student.program || '',
    note: (note || '').trim(),
    facultyId: facultyId || '',
    facultyName: facultyName || user?.displayName || '',
    actorUid: user?.uid || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, FACE_ENROLL_COLLECTION), payload);
  notify({
    type: 'request',
    entity: 'faceEnroll',
    title: `Face enroll requested: ${payload.studentName}`,
    message: `ID ${payload.idNumber}${payload.edpCode ? ` · EDP ${payload.edpCode}` : ''}${
      payload.note ? ` · ${payload.note}` : ''
    }`,
    meta: { requestId: ref.id, studentId: payload.studentId },
    audience: 'admin',
  });
  return ref.id;
}

export async function approveFaceEnroll(request) {
  await updateDoc(doc(db, FACE_ENROLL_COLLECTION, request.id), {
    status: 'approved',
    resolvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  if (request.studentId) {
    await updateDoc(doc(db, 'student', request.studentId), {
      faceEnrolled: true,
      updatedAt: serverTimestamp(),
    }).catch(() => {});
  }
  notify({
    type: 'account',
    entity: 'faceEnroll',
    title: `Face enroll approved: ${request.studentName}`,
    message: `ID ${request.idNumber} can now be enrolled for face recognition`,
    meta: { requestId: request.id, studentId: request.studentId },
    audience: 'admin',
  });
  if (request.actorUid) {
    notify({
      type: 'account',
      entity: 'faceEnroll',
      title: `Face enroll approved for ${request.studentName}`,
      message: 'The administrator accepted your request to enroll this student’s face.',
      meta: { requestId: request.id, studentId: request.studentId },
      audience: 'faculty',
      targetUid: request.actorUid,
    });
  }
}

export async function enrollStudentFace({ student, captures = {} }) {
  if (!student?.id) {
    throw new Error('Select a student to enroll their face.');
  }
  const faceCaptures = persistCaptures(captures);
  await updateDoc(doc(db, 'student', student.id), {
    faceEnrolled: true,
    faceCaptures,
    updatedAt: serverTimestamp(),
  });
  notify({
    type: 'add',
    entity: 'faceEnroll',
    title: `Face enrolled: ${student.name}`,
    message: `ID ${student.idNumber || ''} · front, right, and left captured`,
    meta: { studentId: student.id },
    audience: 'admin',
  });
}

export async function enrollScholarFace({ scholar, captures = {} }) {
  if (!scholar?.id) {
    throw new Error('Select a working scholar to enroll their face.');
  }
  const faceCaptures = persistCaptures(captures);
  await updateDoc(doc(db, 'workingScholar', scholar.id), {
    faceEnrolled: true,
    faceCaptures,
    updatedAt: serverTimestamp(),
  });
  notify({
    type: 'add',
    entity: 'faceEnroll',
    title: `Face enrolled: ${scholar.name}`,
    message: `Working scholar · ID ${scholar.idNumber || ''} · ${scholar.designation || ''}`,
    meta: { scholarId: scholar.id },
    audience: 'admin',
  });
}

export async function rejectFaceEnroll(request) {
  await updateDoc(doc(db, FACE_ENROLL_COLLECTION, request.id), {
    status: 'rejected',
    resolvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  notify({
    type: 'account',
    entity: 'faceEnroll',
    title: `Face enroll rejected: ${request.studentName}`,
    message: `ID ${request.idNumber}`,
    meta: { requestId: request.id, studentId: request.studentId },
    audience: 'admin',
  });
  if (request.actorUid) {
    notify({
      type: 'account',
      entity: 'faceEnroll',
      title: `Face enroll rejected for ${request.studentName}`,
      message: 'The administrator declined your request to enroll this student’s face.',
      meta: { requestId: request.id, studentId: request.studentId },
      audience: 'faculty',
      targetUid: request.actorUid,
    });
  }
}
