import { useState } from 'react';
import { Eye, EyeOff, KeyRound, Pencil, Trash2 } from 'lucide-react';
import InitialAvatar from '../dashboard/InitialAvatar';

export function LoginCell({ member, onCreateLogin, compact = false }) {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const password = member.password || '';

  const handleCreate = async () => {
    if (!onCreateLogin) return;
    setBusy(true);
    try {
      await onCreateLogin(member);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`flex flex-col ${compact ? 'gap-0.5' : 'gap-0.5'}`}>
      <span className="font-mono text-secondary text-slate-700">{member.username || member.idNumber}</span>
      <span className="flex items-center gap-1 font-mono text-secondary text-slate-700">
        {show ? password : '•'.repeat(Math.min(password.length || 8, 12))}
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="rounded p-0.5 text-slate-400 hover:bg-[#f1f5f9] hover:text-slate-700"
          aria-label={show ? 'Hide password' : 'Show password'}
          title={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </span>
      {member.authUid ? (
        <span className="text-label font-semibold uppercase tracking-wide text-success-text">Login active</span>
      ) : (
        <button
          type="button"
          onClick={handleCreate}
          disabled={busy}
          className="inline-flex items-center gap-1 self-start text-label font-semibold uppercase tracking-wide text-[#b45309] hover:underline disabled:opacity-60"
        >
          <KeyRound className="h-3 w-3" />
          {busy ? 'Creating…' : 'Create login'}
        </button>
      )}
    </div>
  );
}

export default function FacultyRow({
  member,
  index,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
  onCreateLogin,
}) {
  return (
    <tr className="border-t border-border-light">
      <td className="px-4 py-3 align-middle">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(member.id)}
          className="h-4 w-4 rounded border-input-border text-primary focus:ring-primary"
          aria-label={`Select ${member.name}`}
        />
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-2.5">
          <InitialAvatar name={member.name} tone={index} />
          <span className="text-body font-semibold text-slate-900">{member.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 align-middle text-secondary text-slate-600">
        {member.idNumber}
      </td>
      <td className="px-4 py-3 align-middle text-secondary text-slate-700">
        {member.program}
      </td>
      <td className="px-4 py-3 align-middle text-secondary text-slate-600">
        {member.email}
      </td>
      <td className="px-4 py-3 align-middle">
        <LoginCell member={member} onCreateLogin={onCreateLogin} />
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(member)}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-[#f8fafc]"
            aria-label={`Edit ${member.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(member)}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-[#f8fafc]"
            aria-label={`Delete ${member.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
