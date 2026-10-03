const TYPE_STYLES = {
  Lec: 'bg-info-bg text-info-text',
  Lab: 'bg-[#eef2ff] text-[#4338ca]',
};

export default function TypeBadge({ type }) {
  const styles = TYPE_STYLES[type] || TYPE_STYLES.Lec;
  return (
    <span className={`inline-flex items-center rounded-btn px-2 py-0.5 text-label font-semibold ${styles}`}>
      {type}
    </span>
  );
}
