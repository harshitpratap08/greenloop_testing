/**
 * Material Passport — the digital record for one surveyed material.
 *
 * First viewport answers: what is this material, how much, where from,
 * what condition, what happens next. Detail (range, confidence, evidence,
 * matching, capacity, history) sits underneath. All figures from the store.
 */

import { useParams, Link } from "react-router";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import PageMeta from "@/components/common/PageMeta";
import { materialMedia } from "@/components/greenloop/AppExploration";
import { computeMatch, slotLedger } from "@/domain/capacity";
import { eventsForSubjects } from "@/domain/events";
import { formatDate } from "@/utils";
import { PageMotion, RevealItem, MediaPanel, CapacityMeter, StatusChip, WorkflowRail7, Counter, EvidenceGallery, type EvidenceItem } from "@/components/greenloop/kit";
import { materialMediaFor, receiverMediaFor } from "@/config/appMedia";

const TYPE_LABEL: Record<string, string> = {
  concrete: "Concrete",
  brick: "Brick",
  steel: "Steel",
  timber: "Timber",
  plasterboard: "Plasterboard",
  glass: "Glass",
};

export default function MaterialPassport() {
  const { id } = useParams<{ id: string }>();
  const { dataset } = useGreenLoopStore();

  const material = dataset.materials.find((m) => m.id === id);
  const project = dataset.projects.find((p) => p.id === material?.projectId);

  if (!material || !project) {
    return (
      <div className="mx-auto max-w-[1200px] pb-24">
        <PageMeta title="Passport not found | GreenLoop" description="The requested material passport could not be found." />
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <h3 className="font-archivo text-2xl font-bold uppercase text-ink-900 dark:text-white">Passport not found</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">The requested material passport could not be found.</p>
          <Link to="/app/materials" className="mt-6 inline-flex min-h-11 items-center bg-ink-900 px-6 font-archivo text-sm font-bold uppercase tracking-wide text-white hover:bg-loop-600 dark:bg-white dark:text-ink-900">
            Back to Materials
          </Link>
        </div>
      </div>
    );
  }

  const allocation = dataset.allocations.find((a) => a.materialId === material.id && a.status !== "cancelled");
  const receiver = allocation ? dataset.receivers.find((r) => r.id === allocation.receiverId) : null;
  const booking = dataset.bookings.find((b) => b.allocationId === allocation?.id && b.status !== "cancelled");
  const verification = dataset.verifications.find((v) => v.bookingId === booking?.id);
  const candidates = computeMatch(dataset, material.id).slice(0, 3);
  const ledger = allocation ? slotLedger(dataset, allocation.slotId) : undefined;
  const events = eventsForSubjects(dataset, [material.id, project.id]);
  const media = materialMedia(material);

  // Evidence items: evidence refs that are site photos, plus fallback type imagery.
  const evidenceItems: EvidenceItem[] = [
    ...media.map((m) => ({ id: m.id, src: m.src, label: m.caption, kind: "site-photo", recordedAt: formatDate(m.recordedAt) })),
    ...material.evidence
      .filter((e) => e.kind !== "site-photo")
      .map((e, index) => ({ id: `${material.id}-doc-${index}`, label: e.label, kind: e.kind, recordedAt: formatDate(e.recordedAt) })),
  ];

  // Next action drives the primary button.
  const statusChip =
    material.status === "verified" ? "verified" as const
    : material.status === "dispatched" ? "active" as const
    : material.status === "reserved" ? "confirmed" as const
    : material.status === "allocated" ? "confirmed" as const
    : "attention" as const;

  const primaryAction =
    verification ? (
      <Link to="/app/verification" className="inline-flex min-h-11 items-center bg-ink-900 px-5 text-sm font-bold text-white hover:bg-loop-700 dark:bg-white dark:text-ink-900">View proof of recovery</Link>
    ) : booking ? (
      <Link to="/app/deliveries" className="inline-flex min-h-11 items-center bg-ink-900 px-5 text-sm font-bold text-white hover:bg-loop-700 dark:bg-white dark:text-ink-900">View booking & delivery</Link>
    ) : (
      <Link to="/app/receivers" state={{ materialId: material.id }} className="inline-flex min-h-11 items-center bg-ink-900 px-5 text-sm font-bold text-white hover:bg-loop-700 dark:bg-white dark:text-ink-900">Find a receiver</Link>
    );

  // Workflow stage from the material's own lifecycle.
  const workflowStage = verification ? 7 : booking ? (booking.loadRef ? 6 : 5) : allocation ? 4 : candidates.length > 0 ? 3 : material.status === "surveyed" ? 2 : 1;

  return (
    <PageMotion className="mx-auto max-w-[1200px] pb-24">
      <PageMeta title={`Passport ${material.id} | GreenLoop`} description={`Material passport for ${TYPE_LABEL[material.type] ?? material.type} — ${material.quantityT.toFixed(1)} t from ${project.name}.`} />

      {/* Breadcrumb-style back link */}
      <RevealItem>
        <Link to="/app/materials" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-ink-900 dark:text-gray-400 dark:hover:text-white">
          ← Materials &amp; Passports
        </Link>
      </RevealItem>

      {/* HERO — what is this material, how much, where from, condition, next */}
      <RevealItem>
        <header className="grid border border-steel-200 bg-white shadow-sm dark:border-steel-800 dark:bg-white/[0.02] lg:grid-cols-[1.1fr_0.9fr]">
          <MediaPanel
            media={materialMediaFor(material.type)}
            aspect="min-h-[300px] lg:min-h-[380px]"
            scrim="bg-gradient-to-t from-ink-950/70 via-ink-950/20 to-transparent"
            className="border-0 border-b border-steel-200 lg:border-b-0 lg:border-e dark:border-steel-800"
            caption={`${material.id} · surveyed ${formatDate(material.surveyedAt)}`}
          >
            <figcaption className="absolute bottom-4 left-5 right-5">
              <p className="eyebrow-label text-white/70">Material Passport</p>
              <p className="mt-1 font-archivo text-3xl font-bold uppercase tracking-tight text-white">
                {TYPE_LABEL[material.type] ?? material.type}
              </p>
            </figcaption>
          </MediaPanel>
          <div className="flex flex-col gap-5 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <p className="mt-1">
                <Counter value={material.quantityT} className="text-4xl font-bold text-ink-900 dark:text-white" />
                <span className="ms-2 font-archivo text-lg font-semibold text-gray-600 dark:text-gray-400">tonnes</span>
              </p>
              <StatusChip status={statusChip} label={material.status} />
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="eyebrow-label text-steel-500 dark:text-steel-400">Project</dt>
                <dd className="mt-1"><Link to="/app/explore" state={{ projectId: project.id }} className="font-semibold text-ink-900 underline underline-offset-4 hover:text-loop-600 dark:text-white">{project.name}</Link></dd>
              </div>
              <div>
                <dt className="eyebrow-label text-steel-500 dark:text-steel-400">Location</dt>
                <dd className="mt-1 font-medium text-ink-900 dark:text-white">{project.location}</dd>
              </div>
              <div>
                <dt className="eyebrow-label text-steel-500 dark:text-steel-400">Condition</dt>
                <dd className="mt-1 font-medium capitalize text-ink-900 dark:text-white">{material.condition} · Grade {material.grade}</dd>
              </div>
              <div>
                <dt className="eyebrow-label text-steel-500 dark:text-steel-400">Confidence</dt>
                <dd className="ledger-numeral mt-1 font-medium text-ink-900 dark:text-white">{Math.round(material.confidence * 100)}%</dd>
              </div>
            </dl>
            <div className="mt-auto">
              <p className="eyebrow-label text-steel-500 dark:text-steel-400">Next</p>
              <div className="mt-2 flex flex-wrap gap-2">{primaryAction}</div>
            </div>
          </div>
        </header>
      </RevealItem>

      {/* WORKFLOW */}
      <RevealItem>
        <section className="mt-6 border border-steel-200 bg-white p-5 dark:border-steel-800 dark:bg-white/[0.02]" aria-label="Workflow position">
          <WorkflowRail7 current={workflowStage} />
        </section>
      </RevealItem>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quantities */}
          <RevealItem>
            <section className="border border-steel-200 bg-white p-6 dark:border-steel-800 dark:bg-white/[0.02]">
              <h2 className="font-archivo text-lg font-bold text-ink-900 dark:text-white">Quantities</h2>
              <div className="mt-4">
                <div className="relative h-2.5 w-full overflow-hidden rounded-sm bg-steel-100 dark:bg-white/10" aria-label={`Survey range ${material.quantityRangeT[0]} to ${material.quantityRangeT[1]} tonnes`}>
                  <div
                    className="absolute inset-y-0 bg-loop-500/35"
                    style={{
                      left: `${(material.quantityRangeT[0] / (material.quantityRangeT[1] * 1.15)) * 100}%`,
                      width: `${((material.quantityRangeT[1] - material.quantityRangeT[0]) / (material.quantityRangeT[1] * 1.15)) * 100}%`,
                    }}
                  />
                  <div
                    className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-ink-900 dark:border-gray-dark dark:bg-white"
                    style={{ left: `${(material.quantityT / (material.quantityRangeT[1] * 1.15)) * 100}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-theme-xs text-gray-500 dark:text-gray-400">
                  <span className="ledger-numeral">{material.quantityRangeT[0].toFixed(1)} t min</span>
                  <span className="ledger-numeral font-semibold text-ink-900 dark:text-white">survey {material.quantityT.toFixed(1)} t</span>
                  <span className="ledger-numeral">{material.quantityRangeT[1].toFixed(1)} t max</span>
                </div>
              </div>
              {material.surveyNotes && (
                <p className="mt-4 border-s-2 border-steel-200 ps-3 text-sm text-gray-600 dark:border-steel-700 dark:text-gray-400">{material.surveyNotes}</p>
              )}
            </section>
          </RevealItem>

          {/* Evidence */}
          <RevealItem>
            <section className="border border-steel-200 bg-white p-6 dark:border-steel-800 dark:bg-white/[0.02]">
              <h2 className="font-archivo text-lg font-bold text-ink-900 dark:text-white">Evidence</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Site photos and survey records attached to this passport.</p>
              <EvidenceGallery items={evidenceItems} className="mt-4" />
            </section>
          </RevealItem>

          {/* Matching */}
          <RevealItem>
            <section className="border border-steel-200 bg-white p-6 dark:border-steel-800 dark:bg-white/[0.02]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-archivo text-lg font-bold text-ink-900 dark:text-white">Matching</h2>
                <StatusChip status={receiver ? "confirmed" : candidates.length > 0 ? "available" : "draft"} label={receiver ? "Matched" : candidates.length > 0 ? "Candidates found" : "No candidates"} />
              </div>
              {receiver && allocation ? (
                <div className="mt-4 flex items-center gap-4">
                  <img src={receiverMediaFor(receiver.id).src} alt={receiverMediaFor(receiver.id).alt} loading="lazy" className="size-16 border border-steel-200 object-cover dark:border-steel-800" />
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-900 dark:text-white">{receiver.name}</p>
                    <p className="ledger-numeral text-theme-xs text-gray-500 dark:text-gray-400">{receiver.distanceKm} km · {receiver.location}</p>
                    <Link to="/app/allocations" className="mt-1 inline-block text-sm font-semibold text-ink-900 underline underline-offset-4 hover:text-loop-600 dark:text-white">View match details</Link>
                  </div>
                </div>
              ) : candidates.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {candidates.map((candidate, index) => {
                    const candidateReceiver = dataset.receivers.find((r) => r.id === candidate.receiverId);
                    return (
                      <li key={candidate.receiverId} className="flex items-center justify-between gap-3 border border-steel-200 p-3 dark:border-steel-800">
                        <span>
                          <span className="block text-theme-sm font-semibold text-ink-900 dark:text-white">{candidateReceiver?.name ?? candidate.receiverId}</span>
                          <span className="ledger-numeral block text-theme-xs text-gray-500 dark:text-gray-400">{candidate.distanceKm} km · {candidate.availableT.toFixed(1)} t free · {Math.round(candidate.suitability * 100)}% suitable</span>
                        </span>
                        {index === 0 && candidate.recommended && <StatusChip status="available" label="Best fit" />}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 text-theme-sm text-gray-500 dark:text-gray-400">No candidate receivers computed yet — open Find a Receiver to run matching.</p>
              )}
            </section>
          </RevealItem>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          {/* Capacity at the matched slot */}
          <RevealItem>
            <section className="border border-steel-200 bg-white p-6 dark:border-steel-800 dark:bg-white/[0.02]">
              <h2 className="font-archivo text-lg font-bold text-ink-900 dark:text-white">Capacity</h2>
              {ledger && allocation ? (
                <div className="mt-4">
                  <CapacityMeter total={ledger.slot.capacityT} reserved={ledger.reserved} held={ledger.heldT} />
                  <p className="ledger-numeral mt-3 text-theme-xs text-gray-500 dark:text-gray-400">
                    Slot {allocation.slotId} · {formatDate(ledger.slot.date)}
                  </p>
                  {allocation.requestedT > ledger.slot.capacityT - ledger.reserved && (
                    <p className="mt-2 border-s-2 border-signal-500 bg-signal-50 px-2 py-1 text-theme-xs text-signal-700 dark:bg-signal-500/10 dark:text-signal-300">
                      Shortfall: {(allocation.requestedT - (ledger.slot.capacityT - ledger.reserved)).toFixed(1)} t over free capacity.
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-theme-sm text-gray-500 dark:text-gray-400">No slot reserved — capacity is checked when you request it.</p>
              )}
            </section>
          </RevealItem>

          {/* Booking & verification summary */}
          <RevealItem>
            <section className="border border-steel-200 bg-white p-6 dark:border-steel-800 dark:bg-white/[0.02]">
              <h2 className="font-archivo text-lg font-bold text-ink-900 dark:text-white">Recovery</h2>
              {booking ? (
                <div className="mt-3 space-y-2 text-theme-sm">
                  <p className="flex justify-between gap-2"><span className="text-gray-500 dark:text-gray-400">Booking</span><span className="ledger-numeral font-semibold text-ink-900 dark:text-white">{booking.id}</span></p>
                  <p className="flex justify-between gap-2"><span className="text-gray-500 dark:text-gray-400">Tonnes</span><span className="ledger-numeral font-semibold text-ink-900 dark:text-white">{booking.tonnesT.toFixed(1)} t</span></p>
                  {verification && (
                    <>
                      <p className="flex justify-between gap-2"><span className="text-gray-500 dark:text-gray-400">Received</span><span className="ledger-numeral font-semibold text-ink-900 dark:text-white">{verification.actualT.toFixed(1)} t</span></p>
                      <p className="flex justify-between gap-2"><span className="text-gray-500 dark:text-gray-400">Accepted</span><span className="ledger-numeral font-semibold text-loop-600 dark:text-loop-400">{verification.acceptedT.toFixed(1)} t</span></p>
                      <StatusChip status="verified" label="Verified recovery" className="mt-1" />
                    </>
                  )}
                  <Link to="/app/bookings" className="mt-2 inline-block font-semibold text-ink-900 underline underline-offset-4 hover:text-loop-600 dark:text-white">Open bookings</Link>
                </div>
              ) : (
                <p className="mt-3 text-theme-sm text-gray-500 dark:text-gray-400">No booking yet — request capacity after matching.</p>
              )}
            </section>
          </RevealItem>

          {/* History */}
          <RevealItem>
            <section className="border border-steel-200 bg-white p-6 dark:border-steel-800 dark:bg-white/[0.02]">
              <h2 className="font-archivo text-lg font-bold text-ink-900 dark:text-white">History</h2>
              {events.length > 0 ? (
                <ol className="relative ms-2 mt-4 space-y-5 border-s-2 border-steel-200 dark:border-steel-700">
                  {events.slice(0, 6).map((event) => (
                    <li key={event.id} className="relative ps-5">
                      <span aria-hidden="true" className="absolute -start-[7px] top-1 size-3 rounded-full border-2 border-white bg-steel-400 dark:border-gray-dark dark:bg-steel-600" />
                      <p className="ledger-numeral text-theme-xs text-gray-500 dark:text-gray-400">{formatDate(event.at)}</p>
                      <p className="mt-0.5 text-theme-sm text-ink-900 dark:text-gray-200">{event.summary}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-theme-sm text-gray-500 dark:text-gray-400">No events recorded.</p>
              )}
            </section>
          </RevealItem>
        </div>
      </div>
    </PageMotion>
  );
}
