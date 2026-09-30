import { useState } from "react";
import { Link } from "react-router";

const anchors = [
  { href: "/#product", label: "Product" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#providers", label: "For Providers" },
  { href: "/#receivers", label: "For Receivers" },
  { href: "/#network", label: "Network" },
  { href: "/#about", label: "About" },
];

export default function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink-950/95 text-white backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="GreenLoop home">
          <img src="/images/logo/logo-icon.svg" alt="" width={28} height={28} />
          <span className="font-archivo text-sm font-bold tracking-[-0.01em] text-white">
            GREEN<span className="text-loop-400">LOOP</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-4 xl:flex" aria-label="Site sections">
          {anchors.map(({ href, label }) => (
            <a key={href} href={href} className="whitespace-nowrap text-xs font-medium text-white/65 transition-colors hover:text-white">
              {label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <Link to="/sign-in" className="inline-flex min-h-11 items-center text-sm font-medium text-white/75 transition-colors hover:text-white">Sign In</Link>
          <Link to="/sign-up" className="inline-flex min-h-11 items-center bg-loop-500 px-4 text-sm font-bold text-ink-950 transition-colors hover:bg-loop-400">Create Account</Link>
          <button type="button" aria-expanded={menuOpen} aria-controls="site-mobile-nav" aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen((open) => !open)} className="inline-flex size-11 items-center justify-center border border-white/20 text-white xl:hidden">
            <span className="text-xl leading-none" aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
          </button>
        </div>
      </div>

      <nav id="site-mobile-nav" className={`${menuOpen ? "grid" : "hidden"} gap-1 border-t border-white/10 bg-ink-950 px-5 py-3 xl:hidden`} aria-label="Mobile site sections">
        {anchors.map(({ href, label }) => (
          <a key={href} href={href} onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center border-b border-white/[0.06] text-sm text-white/75 hover:text-white">
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}
