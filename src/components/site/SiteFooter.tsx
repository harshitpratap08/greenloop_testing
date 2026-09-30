import { Link } from "react-router";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-ink-950 text-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-2.5" aria-label="GreenLoop home">
              <img src="/images/logo/logo-icon.svg" alt="" width={32} height={32} />
              <span className="font-archivo text-base font-bold tracking-[-0.01em]">GREEN<span className="text-loop-400">LOOP</span></span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">The operating layer for construction material recovery. Connecting providers, receivers, capacity and verified delivery.</p>
          </div>

          <nav aria-label="GreenLoop">
            <p className="eyebrow-label text-white/40">GreenLoop</p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li><a className="hover:text-white" href="/#product">Product</a></li>
              <li><a className="hover:text-white" href="/#how-it-works">How It Works</a></li>
              <li><a className="hover:text-white" href="/#providers">For Providers</a></li>
              <li><a className="hover:text-white" href="/#receivers">For Receivers</a></li>
              <li><a className="hover:text-white" href="/#network">Network</a></li>
              <li><a className="hover:text-white" href="/#about">About</a></li>
            </ul>
          </nav>

          <nav aria-label="Account">
            <p className="eyebrow-label text-white/40">Account</p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li><Link className="hover:text-white" to="/sign-in">Sign In</Link></li>
              <li><Link className="hover:text-white" to="/sign-up">Create Account</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
          <p className="ledger-numeral text-xs text-white/40">© 2026 GreenLoop — demonstration build</p>
          <p className="text-xs text-white/40">Operational figures shown are from the GreenLoop demo dataset.</p>
        </div>
      </div>
    </footer>
  );
}
