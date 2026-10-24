export const FACULTY_BASE = '/faculty-portal';
export const LOGIN_PATH = '/login';

/** Landing route for a given role. Guests always go to the login page. */
export function homeForRole(role) {
  if (role === 'faculty') return FACULTY_BASE;
  if (role === 'admin') return '/';
  return LOGIN_PATH;
}

/** After sign-in, return to the page they asked for only if it belongs to that role. */
export function destinationForRole(role, fromPath) {
  const home = homeForRole(role);
  if (!fromPath || fromPath === LOGIN_PATH) return home;
  if (role === 'faculty') {
    return fromPath === FACULTY_BASE || fromPath.startsWith(`${FACULTY_BASE}/`) ? fromPath : home;
  }
  if (role === 'admin') {
    return fromPath.startsWith(FACULTY_BASE) ? home : fromPath;
  }
  return LOGIN_PATH;
}
