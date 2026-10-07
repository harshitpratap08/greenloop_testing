import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { MoonIcon, SunIcon } from "@/icons";

const anchors = [
  { href: "/#product", label: "Product" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#providers", label: "For Providers" },
  { href: "/#receivers", label: "For Receivers" },
  { href: "/#network", label: "Network" },
  { href: "/#about", label: "About" },
];

export default function SiteNav({ theme, onToggleTheme }: { theme: "light" | "dark"; onToggleTheme: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 border-b border-steel-200 bg-gray-50/95 text-ink-900 backdrop-blur-md site-dark:border-white/10 site-dark:bg-ink-950/95 site-dark:text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="GreenLoop home">
          <img src="/images/logo/logo-icon.svg" alt="" width={28} height={28} />
          <span className="font-archivo text-sm font-bold tracking-[-0.01em] text-ink-900 site-dark:text-white">
            GREEN<span className="text-loop-400">LOOP</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-4 xl:flex" aria-label="Site sections">
          {anchors.map(({ href, label }) => (
            <a key={href} href={href} className="whitespace-nowrap text-xs font-medium text-steel-600 transition-colors hover:text-ink-900 site-dark:text-white/65 site-dark:hover:text-white">
              {label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button type="button" onClick={onToggleTheme} aria-label={t(theme === "dark" ? "site.theme.switchToLight" : "site.theme.switchToDark")} className="inline-flex size-11 items-center justify-center border border-steel-200 text-ink-700 transition-colors hover:bg-steel-100 site-dark:border-white/20 site-dark:text-white site-dark:hover:bg-white/10">
            {theme === "dark" ? <SunIcon className="size-5" aria-hidden="true" /> : <MoonIcon className="size-5" aria-hidden="true" />}
          </button>
          <Link to="/sign-in" className="hidden min-h-11 items-center text-sm font-medium text-steel-700 transition-colors hover:text-ink-900 site-dark:text-white/75 site-dark:hover:text-white sm:inline-flex">Sign In</Link>
          <Link to="/sign-up" className="inline-flex min-h-11 items-center whitespace-nowrap bg-loop-500 px-2 text-xs font-bold text-ink-950 transition-colors hover:bg-loop-400 sm:px-4 sm:text-sm">Create Account</Link>
          <button type="button" aria-expanded={menuOpen} aria-controls="site-mobile-nav" aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen((open) => !open)} className="inline-flex size-11 items-center justify-center border border-steel-200 text-ink-700 site-dark:border-white/20 site-dark:text-white xl:hidden">
            <span className="text-xl leading-none" aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
          </button>
        </div>
      </div>

      <nav id="site-mobile-nav" className={`${menuOpen ? "grid" : "hidden"} gap-1 border-t border-steel-200 bg-gray-50 px-5 py-3 site-dark:border-white/10 site-dark:bg-ink-950 xl:hidden`} aria-label="Mobile site sections">
        {anchors.map(({ href, label }) => (
          <a key={href} href={href} onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center border-b border-steel-200 text-sm text-steel-700 hover:text-ink-900 site-dark:border-white/[0.06] site-dark:text-white/75 site-dark:hover:text-white">
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}
