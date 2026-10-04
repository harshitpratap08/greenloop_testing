import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  icon: ReactNode;
  detail?: string;
}

/** Operations KPI tile — value rendered in mono ledger numerals. */
export default function MetricCard({ label, value, unit, icon, detail }: MetricCardProps) {
  return (
    <div className="surface-card flex h-full min-w-0 flex-col gl-card-pad">
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-steel-100 dark:bg-steel-900">
        {icon}
      </div>
      <p className="eyebrow-label mt-4 text-steel-600 dark:text-steel-400">{label}</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
        <span className="ledger-numeral text-title-sm font-bold text-ink-900 dark:text-white/90">
          {value}
        </span>
        {unit && (
          <span className="text-theme-sm font-medium text-gray-500 dark:text-gray-400">{unit}</span>
        )}
      </div>
      {detail && (
        <p className="mt-auto pt-detail text-theme-xs text-gray-500 dark:text-gray-400">{detail}</p>
      )}
    </div>
  );
}
