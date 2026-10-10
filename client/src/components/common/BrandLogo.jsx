export default function BrandLogo({ className = 'h-8 w-8', alt = 'UCME' }) {
  return (
    <img
      src="/ucme-logo.png"
      alt={alt}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
