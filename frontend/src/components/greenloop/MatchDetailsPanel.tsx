import type { AllocationCandidate } from "@shared/domain/types";

export default function MatchDetailsPanel({ match }: { match: AllocationCandidate }) {
  const formatScore = (score: number) => `${Math.round(score * 100)}%`;
  const getImpactColor = (impact: "positive" | "neutral" | "negative" | "unknown") => {
    switch (impact) {
      case "positive": return "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800";
      case "neutral": return "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800";
      case "negative": return "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800";
      default: return "text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
    }
  };

  return (
    <div className="mt-4 border border-steel-200 bg-white shadow-sm dark:border-steel-800 dark:bg-[#1a2b21] overflow-hidden rounded-surface">
      <div className="bg-steel-50/50 px-4 py-3 border-b border-steel-100 dark:bg-[#17251d] dark:border-steel-800 flex justify-between items-center">
        <div>
          <h4 className="text-sm font-bold text-ink-900 dark:text-white">Match Analysis</h4>
          <p className="text-xs text-steel-500 dark:text-steel-400">{match.summary || "No summary available."}</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-archivo font-black text-[#26362c] dark:text-white">{formatScore(match.score)}</span>
          <span className="block text-xs uppercase font-semibold text-steel-500 tracking-wider">Overall Match</span>
        </div>
      </div>

      <div className="p-4 grid gap-card sm:grid-cols-2">
        <div className="space-y-3">
          <h5 className="text-xs uppercase tracking-wider font-semibold text-steel-500">Key Factors</h5>
          {Object.entries(match.factors || {}).map(([key, factor]) => (
            <div key={key} className={`p-2.5 rounded-lg border ${getImpactColor(factor.impact)}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold capitalize">{key}</span>
                <span className="text-xs font-medium bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded">
                  {typeof factor.value === 'number' && key !== 'budget' ? factor.value.toFixed(2) : factor.value}
                </span>
              </div>
              <p className="text-xs leading-snug opacity-90">{factor.reason}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {match.advantages && match.advantages.length > 0 && (
            <div>
              <h5 className="text-xs uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 mb-2">Advantages</h5>
              <ul className="space-y-1.5">
                {match.advantages.map((adv, i) => (
                  <li key={i} className="flex gap-2 text-xs text-steel-700 dark:text-steel-300">
                    <span className="text-emerald-500 mt-0.5">✓</span> {adv}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {match.drawbacks && match.drawbacks.length > 0 && (
            <div>
              <h5 className="text-xs uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400 mb-2">Considerations</h5>
              <ul className="space-y-1.5">
                {match.drawbacks.map((draw, i) => (
                  <li key={i} className="flex gap-2 text-xs text-steel-700 dark:text-steel-300">
                    <span className="text-amber-500 mt-0.5">!</span> {draw}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(!match.isEligible && match.nonMatchReasons && match.nonMatchReasons.length > 0) && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-surface">
              <h5 className="text-xs uppercase tracking-wider font-semibold text-red-600 dark:text-red-400 mb-1">Ineligible</h5>
              <ul className="list-disc pl-4 text-xs text-red-700 dark:text-red-300 space-y-1">
                {match.nonMatchReasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
          
          {match.missingDataNotes && match.missingDataNotes.length > 0 && (
            <div className="mt-2 text-xs text-steel-500 dark:text-steel-500">
              <p className="font-semibold mb-0.5">Missing Data:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {match.missingDataNotes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
