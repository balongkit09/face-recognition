import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function PreferencesSection() {
  const { role, preferences, updatePreferences } = useAuth();
  const [message, setMessage] = useState(null);
  const [savingKey, setSavingKey] = useState('');

  const toggle = async (key) => {
    setSavingKey(key);
    setMessage(null);
    try {
      await updatePreferences({ [key]: !preferences[key] });
      setMessage({ type: 'success', text: 'Preference saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not save preference.' });
    } finally {
      setSavingKey('');
    }
  };

  return (
    <section className="rounded-card border border-border-light bg-white p-5 shadow-card lg:col-span-2">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold text-slate-900">Preferences</h2>
      </div>
      <p className="mt-1 text-secondary text-slate-500">
        These apply only to your {role === 'faculty' ? 'faculty portal' : 'admin dashboard'} account.
      </p>
      {message && (
        <p
          className={`mt-3 rounded-btn px-3 py-2 text-body ${
            message.type === 'success' ? 'bg-success-bg text-success-text' : 'bg-red-50 text-danger'
          }`}
        >
          {message.text}
        </p>
      )}
      <ul className="mt-4 divide-y divide-border-light">
        <PrefToggle
          label="In-app notifications"
          hint={
            role === 'faculty'
              ? 'Show alerts for students you add, enroll, or remove. Admin activity is never shown here.'
              : 'Show faculty activity and system events in the bell and Notifications page.'
          }
          checked={preferences.inAppNotifications}
          disabled={savingKey === 'inAppNotifications'}
          onChange={() => toggle('inAppNotifications')}
        />
        <PrefToggle
          label="Unread badge"
          hint="Show the red count on the bell and in the sidebar."
          checked={preferences.showUnreadBadge}
          disabled={!preferences.inAppNotifications || savingKey === 'showUnreadBadge'}
          onChange={() => toggle('showUnreadBadge')}
        />
        <PrefToggle
          label="Compact tables"
          hint="Use tighter row spacing on directory and schedule tables."
          checked={preferences.compactTables}
          disabled={savingKey === 'compactTables'}
          onChange={() => toggle('compactTables')}
        />
        <PrefToggle
          label="Dark mode"
          hint="Use a dark theme across this dashboard. The choice is saved to your account."
          checked={preferences.darkMode}
          disabled={savingKey === 'darkMode'}
          onChange={() => toggle('darkMode')}
        />
      </ul>
    </section>
  );
}

function PrefToggle({ label, hint, checked, disabled, onChange }) {
  return (
    <li className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-body font-medium text-slate-900">{label}</p>
        <p className="mt-0.5 text-secondary text-slate-500">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onChange}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          checked ? 'bg-primary' : 'bg-slate-200'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </li>
  );
}
