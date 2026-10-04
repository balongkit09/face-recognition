export const DEFAULT_PREFERENCES = {
  inAppNotifications: true,
  showUnreadBadge: true,
  compactTables: false,
  darkMode: false,
};

export function normalizePreferences(raw) {
  const merged = { ...DEFAULT_PREFERENCES, ...(raw && typeof raw === 'object' ? raw : {}) };
  if (!(raw && typeof raw === 'object' && 'darkMode' in raw)) {
    merged.darkMode = readStoredTheme();
  }
  return merged;
}

const THEME_KEY = 'ams-theme';

export function readStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark';
  } catch {
    return false;
  }
}

export function applyTheme(dark) {
  const root = document.documentElement;
  if (dark) root.classList.add('dark');
  else root.classList.remove('dark');
  try {
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  } catch {
    /* ignore */
  }
}
