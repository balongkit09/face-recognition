import { useMemo } from 'react';
import { useAuth } from './useAuth';

/**
 * Derive the signed-in faculty member's classes (schedules where they are the
 * teacher) and the students enrolled in those classes (matched by EDP code).
 */
export function useMyClasses(schedules = [], students = []) {
  const { account, profile } = useAuth();
  const facultyId = account?.facultyId || profile?.id || null;
  const idNumber = String(profile?.idNumber || account?.idNumber || '').trim();

  return useMemo(() => {
    const myClasses = schedules.filter(
      (s) =>
        (facultyId && s.teacherId === facultyId) ||
        (idNumber && String(s.teacherIdNumber || '').trim() === idNumber),
    );
    // Students are linked to a class by EDP code; fall back to the schedule code
    // for schedules created without an EDP code.
    const edpCodes = new Set(
      myClasses.map((s) => String(s.edpCode || s.code || '').trim()).filter(Boolean),
    );
    const myStudents = students.filter((st) => edpCodes.has(String(st.edpCode || '').trim()));
    return { myClasses, myStudents, edpCodes, facultyId };
  }, [schedules, students, facultyId, idNumber]);
}
