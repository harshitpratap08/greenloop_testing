import { cn } from "@/utils";
import { Link } from "react-router";

const ANCHORS = [
  { href: "/#workflow", label: "Workflow" },
  { href: "/#capacity", label: "Capacity" },
  { href: "/#platform", label: "Platform" },
];

export default function SiteNav() {
  return (
    <header className="sticky top-0 z-999 border-b border-steel-200 bg-gray-25/95 backdrop-blur-none dark:border-steel-800 dark:bg-gray-900/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5" aria-label="GreenLoop home">
          <img src="/images/logo/logo-icon.svg" alt="" width={28} height={28} />
          <span className="font-archivo text-sm font-bold tracking-[-0.01em] text-ink-900 dark:text-white">
            GREEN<span className="text-loop-600 dark:text-loop-400">LOOP</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Site sections">
          {ANCHORS.map((anchor) => (
            <a
              key={anchor.href}
              href={anchor.href}
              className={cn(
                "text-theme-sm font-medium text-ink-700 transition-colors hover:text-ink-900",
                "dark:text-gray-300 dark:hover:text-white",
              )}
            >
              {anchor.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/sign-in"
            className="text-theme-sm font-medium text-ink-900 transition-colors hover:text-ink-700 dark:text-white dark:hover:text-gray-300"
          >
            Sign in
          </Link>
          <Link
            to="/sign-up"
            className="rounded-sm bg-ink-900 px-4 py-2 text-theme-sm font-medium text-white transition-colors hover:bg-ink-800 dark:bg-white dark:text-ink-900 dark:hover:bg-gray-200"
          >
            Create account
          </Link>
        </div>
      </div>
    </header>
  );
}
