export default function DesignationBadge({ designation }) {
  const isLab = String(designation || '').toLowerCase().includes('lab');
  return (
    <span
      className={`inline-flex rounded-md px-1.5 py-0.5 text-label font-semibold ${
        isLab ? 'bg-info-bg text-info-text' : 'bg-success-bg text-success-text'
      }`}
    >
      {designation || '—'}
    </span>
  );
}
