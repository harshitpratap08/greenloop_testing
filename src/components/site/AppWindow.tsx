import { cn } from "@/utils";
import type { ReactNode } from "react";

/**
 * Flat browser-chrome frame presenting real GreenLoop product UI on the
 * public site. Squared corners, hairline rules, route label in the chrome —
 * the same components judges will see inside the platform.
 */
export default function AppWindow({
  route,
  title,
  children,
  className,
  bodyClassName,
}: {
  route?: string;
  title?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-sm border border-steel-200 bg-gray-25 dark:border-steel-700 dark:bg-gray-dark",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-steel-200 bg-steel-50 px-4 py-2.5 dark:border-steel-700 dark:bg-white/5">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-sm border border-steel-300 bg-white dark:border-steel-600 dark:bg-steel-800" />
          <span className="h-2.5 w-2.5 rounded-sm border border-steel-300 bg-white dark:border-steel-600 dark:bg-steel-800" />
          <span className="h-2.5 w-2.5 rounded-sm border border-steel-300 bg-white dark:border-steel-600 dark:bg-steel-800" />
        </div>
        {title && (
          <span className="text-theme-xs font-medium text-ink-800 dark:text-gray-200">{title}</span>
        )}
        {route && (
          <span className="ledger-numeral text-theme-xs text-steel-600 dark:text-steel-400">
            {route}
          </span>
        )}
      </div>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </div>
  );
}
