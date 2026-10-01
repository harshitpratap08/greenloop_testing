import type { GreenLoopDataset } from "@/domain/types";
import { cn } from "@/utils";

/**
 * Recovery flow rail — the product workflow as live counts from the dataset:
 * how many material passports sit at each stage right now.
 */
export default function RecoveryFlow({ dataset }: { dataset: GreenLoopDataset }) {
  const surveyed = dataset.materials.filter((m) => m.status === "surveyed").length;
  const passportReady = dataset.materials.filter((m) => m.status === "passport-ready").length;
  const reserved = dataset.materials.filter((m) => m.status === "reserved").length;
  const dispatched = dataset.materials.filter((m) => m.status === "dispatched").length;
  const verified = dataset.materials.filter((m) => m.status === "verified").length;

  const stages = [
    { key: "survey", label: "Survey", count: surveyed, active: surveyed > 0 },
    { key: "match", label: "Match", count: passportReady, active: passportReady > 0 },
    { key: "reserve", label: "Reserve", count: reserved, active: reserved > 0 },
    { key: "dispatch", label: "Dispatch", count: dispatched, active: dispatched > 0 },
    { key: "verify", label: "Verify", count: verified, active: verified > 0 },
  ];

  return (
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {stages.map((stage, index) => (
        <li
          key={stage.key}
          className={cn(
            "min-w-0 rounded-sm border p-4",
            stage.active
              ? "border-ink-900 bg-gray-25 dark:border-white/25 dark:bg-white/5"
              : "border-steel-200 bg-steel-50 dark:border-steel-800 dark:bg-transparent",
          )}
        >
          <span
            className={cn(
              "font-mono text-xs font-bold tracking-[0.12em]",
              stage.active
                ? "text-ink-900 dark:text-white/90"
                : "text-steel-500 dark:text-steel-500",
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <h4
            className={cn(
              "mt-1 whitespace-nowrap font-archivo text-base font-bold uppercase tracking-wide",
              stage.active
                ? "text-ink-900 dark:text-white/90"
                : "text-steel-500 dark:text-steel-500",
            )}
          >
            {stage.label}
          </h4>
          <p
            className={cn(
              "ledger-numeral mt-3 flex items-baseline gap-1.5 whitespace-nowrap text-title-sm font-bold",
              stage.active
                ? "text-ink-900 dark:text-white/90"
                : "text-gray-300 dark:text-steel-700",
            )}
          >
            {stage.count}
            <span className="font-sans text-theme-xs font-normal text-gray-500 dark:text-gray-400">
              {stage.count === 1 ? "passport" : "passports"}
            </span>
          </p>
        </li>
      ))}
    </ol>
  );
}
