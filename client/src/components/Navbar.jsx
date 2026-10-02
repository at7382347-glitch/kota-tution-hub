import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Logo from './Logo';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/browse-teachers', label: 'Find a Tutor' },
  { to: '/fee-structure', label: 'Fees' },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const linkClass = ({ isActive }) =>
    `font-body text-sm font-medium transition-colors ${isActive ? 'text-ink' : 'text-ink/55 hover:text-ink'}`;

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled || open ? 'border-ink/10 bg-sandstone/90 backdrop-blur-md' : 'border-transparent bg-sandstone'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="Nexved — Kota Tuition Hub home">
          <Logo />
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
          <div className="flex items-center gap-3 border-l border-ink/10 pl-8">
            <Link to="/login" className="font-body text-sm font-medium text-ink/55 transition-colors hover:text-ink">
              Log in
            </Link>
            <Link
              to="/login"
              className="rounded-full bg-ink px-5 py-2.5 font-body text-sm font-semibold text-sandstone transition-colors hover:bg-ink/90"
            >
              Join as a Tutor
            </Link>
          </div>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-ink md:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div
          className="border-t border-ink/10 px-4 pb-6 pt-2 md:hidden"
          onClick={(e) => e.target.closest('a') && setOpen(false)}
        >
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `block border-b border-ink/5 py-3.5 font-body text-base ${isActive ? 'font-semibold text-ink' : 'text-ink/70'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link to="/login" className="rounded-full border border-ink/15 py-3 text-center font-body text-sm font-semibold text-ink">
              Log in
            </Link>
            <Link to="/login" className="rounded-full bg-ink py-3 text-center font-body text-sm font-semibold text-sandstone">
              Join as a Tutor
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
