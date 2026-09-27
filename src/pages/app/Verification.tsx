import EventLog from "@/components/greenloop/EventLog";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import StatusBadge from "@/components/greenloop/StatusBadge";
import { eventsForSubjects } from "@/domain/events";
import { useGreenLoopStore } from "@/store/GreenLoopStore";

export default function Verification() {
  const { dataset } = useGreenLoopStore();

  const materialLabel = (id: string) => dataset.materials.find((m) => m.id === id)?.type ?? id;
  const receiverName = (id: string) => dataset.receivers.find((r) => r.id === id)?.name ?? id;

  return (
    <>
      <PageMeta
        title="Verification | GreenLoop"
        description="Planned versus actual load reconciliation on the GreenLoop platform."
      />
      <PageBreadCrumb pageTitle="Verification" />

      <div className="space-y-6">
        {dataset.verifications.map((verification) => {
          const variance = verification.actualT - verification.plannedT;
          const acceptedPct =
            verification.actualT > 0
              ? Math.round((verification.acceptedT / verification.actualT) * 100)
              : 0;

          return (
            <section key={verification.id} className="surface-card p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-ink-900 dark:text-white/90">
                    <span className="ledger-numeral">{verification.loadRef}</span> ·{" "}
                    {materialLabel(verification.materialId)} → {receiverName(verification.receiverId)}
                  </h3>
                  <p className="ledger-numeral mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
                    {verification.id} · verified {verification.verifiedAt?.slice(0, 16).replace("T", " ")}
                  </p>
                </div>
                <StatusBadge status={verification.status} />
              </div>

              {/* Reconciliation */}
              <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <ReconStat label="Planned" value={`${verification.plannedT.toFixed(1)} t`} />
                <ReconStat label="Actual" value={`${verification.actualT.toFixed(1)} t`} />
                <ReconStat
                  label="Accepted"
                  value={`${verification.acceptedT.toFixed(1)} t`}
                  accent="text-loop-600 dark:text-loop-400"
                />
                <ReconStat
                  label="Rejected"
                  value={`${verification.rejectedT.toFixed(1)} t`}
                  accent="text-error-600 dark:text-error-400"
                />
              </div>

              {/* Accepted proportion bar */}
              <div className="mt-4">
                <div className="flex h-2.5 w-full overflow-hidden rounded-sm bg-gray-200 dark:bg-white/10">
                  <div className="bg-loop-500" style={{ width: `${acceptedPct}%` }} />
                  <div className="bg-error-400" style={{ width: `${100 - acceptedPct}%` }} />
                </div>
                <p className="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
                  <span className="ledger-numeral">{acceptedPct}%</span> of delivered tonnage
                  accepted
                  {variance !== 0 && (
                    <>
                      {" "}· weighbridge variance{" "}
                      <span className="ledger-numeral">
                        {variance > 0 ? "+" : ""}
                        {variance.toFixed(1)} t
                      </span>{" "}
                      vs plan
                    </>
                  )}
                </p>
              </div>

              {verification.rejectReason && (
                <p className="mt-3 text-theme-sm text-ink-800 dark:text-gray-200">
                  <span className="font-semibold">Rejection:</span> {verification.rejectReason}
                </p>
              )}

              {/* Evidence */}
              <div className="mt-4">
                <p className="eyebrow-label text-steel-600 dark:text-steel-400">Evidence</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {verification.evidence.map((evidence) => (
                    <span
                      key={evidence.ref ?? evidence.label}
                      className="rounded-md border border-steel-200 bg-steel-50 px-2 py-1 text-theme-xs text-ink-800 dark:border-steel-800 dark:bg-white/5 dark:text-gray-300"
                    >
                      {evidence.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="hairline-t mt-5 pt-4">
                <p className="eyebrow-label mb-3 text-steel-600 dark:text-steel-400">
                  Load trail
                </p>
                <EventLog
                  events={eventsForSubjects(dataset, [verification.bookingId])}
                  limit={6}
                />
              </div>
            </section>
          );
        })}

        {dataset.verifications.length === 0 && (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            No verified loads yet — dispatch and verify from the scenario controls.
          </p>
        )}
      </div>
    </>
  );
}

function ReconStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-steel-200 bg-steel-50 p-3 dark:border-steel-800 dark:bg-white/5">
      <p className="eyebrow-label text-steel-600 dark:text-steel-400">{label}</p>
      <p className={`ledger-numeral mt-1.5 text-theme-lg font-bold ${accent ?? "text-ink-900 dark:text-white/90"}`}>
        {value}
      </p>
    </div>
  );
}
