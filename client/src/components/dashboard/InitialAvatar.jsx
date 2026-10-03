const TONES = [
  'bg-info-bg text-primary',
  'bg-slate-800 text-white',
  'bg-emerald-50 text-emerald-700',
  'bg-violet-100 text-violet-700',
];

export default function InitialAvatar({ name, tone = 0 }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-label font-bold ${TONES[tone % TONES.length]}`}
    >
      {initial}
    </span>
  );
}
