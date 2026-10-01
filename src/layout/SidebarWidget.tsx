import CapacitySnapshot from "@/layout/CapacitySnapshot";
import { Link } from "react-router";
import { materialMediaFor } from "@/config/appMedia";

/**
 * Sidebar widget — live capacity snapshot (from the store) plus one
 * operational quick-link card with GreenLoop imagery. No marketing filler.
 */
export default function SidebarWidget() {
  return (
    <div className="pb-20">
      <CapacitySnapshot />
      <Link
        to="/app/market-demand"
        className="mt-4 block w-full overflow-hidden rounded-lg border border-steel-200 bg-white transition-colors hover:border-ink-900 dark:border-steel-800 dark:bg-white/[0.03] dark:hover:border-white"
      >
        <span className="relative block h-20 w-full">
          <img src={materialMediaFor("concrete").src} alt="" className="size-full object-cover" loading="lazy" />
          <span className="absolute inset-0 bg-ink-950/45" aria-hidden="true" />
          <span className="absolute bottom-2 left-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/85">Live demand</span>
        </span>
        <span className="block px-4 py-3">
          <span className="block text-theme-sm font-semibold text-ink-900 dark:text-white">Who needs material</span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">Open receiver requests waiting for offers.</span>
        </span>
      </Link>
    </div>
  );
}
