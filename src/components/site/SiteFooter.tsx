import { Link } from "react-router";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-ink-950 text-white">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <img src="/images/logo/logo-icon.svg" alt="" width={32} height={32} />
              <span className="font-archivo text-base font-bold tracking-[-0.01em]">
                GREEN<span className="text-loop-400">LOOP</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">
              The circular material recovery platform for construction and
              demolition. Survey, match, reserve, verify.
            </p>
          </div>

          <nav aria-label="Platform">
            <p className="eyebrow-label text-white/40">Platform</p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li><Link className="hover:text-white" to="/app/dashboard">Operations</Link></li>
              <li><Link className="hover:text-white" to="/app/materials">Materials &amp; passports</Link></li>
              <li><Link className="hover:text-white" to="/app/receivers">Receiver capacity</Link></li>
              <li><Link className="hover:text-white" to="/app/verification">Verification</Link></li>
            </ul>
          </nav>

          <nav aria-label="Site">
            <p className="eyebrow-label text-white/40">Site</p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li><a className="hover:text-white" href="/#workflow">Workflow</a></li>
              <li><a className="hover:text-white" href="/#capacity">Capacity ledger</a></li>
              <li><Link className="hover:text-white" to="/signin">Sign in</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
          <p className="ledger-numeral text-xs text-white/40">
            © 2026 GreenLoop — hackathon demonstration build
          </p>
          <p className="text-xs text-white/40">
            All figures on this site come from the seeded demo scenario.
          </p>
        </div>
      </div>
    </footer>
  );
}
