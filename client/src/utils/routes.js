export const FACULTY_BASE = '/faculty-portal';

/** Landing route for a given role. */
export function homeForRole(role) {
  return role === 'faculty' ? FACULTY_BASE : '/';
}
