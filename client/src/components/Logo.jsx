// Nexved brand mark: an "N" whose rising diagonal is a single marigold stroke —
// the path from where a student is to where they want to be.
export function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#1F2A44" />
      <path d="M12 28V12" stroke="#F2ECDD" strokeWidth="4" strokeLinecap="round" />
      <path d="M28 12v16" stroke="#F2ECDD" strokeWidth="4" strokeLinecap="round" />
      <path d="M12 12l16 16" stroke="#E8A33D" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function Logo({ light = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className={`font-display text-[1.45rem] font-bold tracking-tight ${light ? 'text-sandstone' : 'text-ink'}`}>
          nexved<span className="text-marigold">.</span>
        </span>
        <span className={`mt-1 font-body text-[0.6rem] font-semibold uppercase tracking-[0.2em] ${light ? 'text-sandstone/50' : 'text-ink/45'}`}>
          Kota Tuition Hub
        </span>
      </span>
    </span>
  );
}

export default Logo;
