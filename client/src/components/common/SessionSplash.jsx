import BrandLogo from './BrandLogo';

/** Shown while Firebase restores a session so refresh never flashes the login form. */
export default function SessionSplash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
      <div className="flex flex-col items-center gap-3">
        <BrandLogo className="h-14 w-14" alt="UCME logo" />
        <p className="text-body text-slate-500">Loading…</p>
      </div>
    </div>
  );
}
