import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import StatusBadge from "@/components/greenloop/StatusBadge";
import {
  ProjectSiteMedia,
  materialMedia,
  type MaterialMediaItem,
} from "@/components/greenloop/AppExploration";
import Badge from "@/components/ui/badge/Badge";
import { computeMatch } from "@/domain/capacity";
import { cn } from "@/utils";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { Link } from "react-router";

const TYPE_LABEL: Record<string, string> = {
  concrete: "Concrete",
  brick: "Brick",
  steel: "Steel",
  timber: "Timber",
  plasterboard: "Plasterboard",
  glass: "Glass",
};

export default function Materials() {
  const { dataset } = useGreenLoopStore();
  const projectName = (id: string) => dataset.projects.find((project) => project.id === id)?.name ?? id;
  const projectById = (id: string) => dataset.projects.find((project) => project.id === id);
  const maxSurveyRange = Math.max(...dataset.materials.map((material) => material.quantityRangeT[1]), 1);
  const totalT = dataset.materials.reduce((total, material) => total + material.quantityT, 0);

  return (
    <>
      <PageMeta
        title="Materials & Passports | GreenLoop"
        description="Traceable material passports from GreenLoop demolition surveys."
      />
      <PageBreadCrumb pageTitle="Materials & Passports" />

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-steel-300 pb-5 dark:border-steel-700">
        <div>
          <p className="eyebrow-label text-steel-600 dark:text-steel-400">Material traceability register</p>
          <h1 className="mt-2 font-archivo text-title-sm font-semibold tracking-tight text-ink-900 dark:text-white">
            Physical material. Digital record.
          </h1>
          <p className="mt-2 max-w-2xl text-theme-sm leading-6 text-gray-600 dark:text-gray-400">
            Each passport connects surveyed tonnes and evidence to a project origin, a suitable receiver and its recovery status.
          </p>
        </div>
        <p className="ledger-numeral text-theme-sm text-ink-700 dark:text-gray-300">
          {dataset.materials.length} passports <span className="text-gray-400">/</span> {totalT.toFixed(1)} t surveyed
        </p>
      </div>

      <section className="space-y-6" aria-label="Material passports">
        {dataset.materials.map((material) => {
          const media = materialMedia(material);
          const project = projectById(material.projectId);
          const existingAllocation = dataset.allocations.find(
            (allocation) => allocation.materialId === material.id && allocation.status !== "cancelled",
          );
          const candidate = computeMatch(dataset, material.id)[0];
          const receiverId = existingAllocation?.receiverId ?? candidate?.receiverId;
          const receiver = receiverId
            ? dataset.receivers.find((item) => item.id === receiverId)
            : undefined;
          const activeSlot = existingAllocation
            ? dataset.slots.find((slot) => slot.id === existingAllocation.slotId)
            : undefined;
          const rangeStart = (material.quantityRangeT[0] / maxSurveyRange) * 100;
          const rangeWidth = ((material.quantityRangeT[1] - material.quantityRangeT[0]) / maxSurveyRange) * 100;
          const capacityFits = candidate ? candidate.availableT >= material.quantityT : false;

          return (
            <article key={material.id} className="grid overflow-hidden border border-steel-200 bg-gray-25 dark:border-steel-800 dark:bg-gray-dark lg:grid-cols-[0.8fr_1.2fr]">
              <div className="relative min-h-64 bg-steel-100 dark:bg-steel-900 lg:min-h-full">
                {media[0] ? (
                  <img
                    src={media[0].src}
                    alt={media[0].caption}
                    className="absolute inset-0 size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-steel-200 dark:bg-steel-900" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/90 via-ink-950/40 to-transparent p-5 pt-16 text-white sm:p-6 sm:pt-20">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="eyebrow-label text-white/65">Physical material</p>
                      <h2 className="mt-1 font-archivo text-3xl font-semibold capitalize tracking-tight sm:text-title-sm">
                        {TYPE_LABEL[material.type] ?? material.type}
                      </h2>
                    </div>
                    <p className="ledger-numeral text-theme-xs text-white/70">{media[0]?.recordedAt.slice(0, 10) ?? material.surveyedAt.slice(0, 10)}</p>
                  </div>
                  {media[0] && <p className="mt-2 text-theme-xs text-white/65">{media[0].caption}</p>}
                </div>
                {media.length > 1 && (
                  <div className="absolute end-4 top-4 flex gap-2">
                    {media.slice(1).map((item: MaterialMediaItem) => (
                      <img key={item.id} src={item.src} alt={item.caption} loading="lazy" className="size-14 border border-white/70 object-cover shadow-theme-sm" />
                    ))}
                  </div>
                )}
              </div>

              <div className="min-w-0 p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-steel-200 pb-4 dark:border-steel-800">
                  <div>
                    <p className="eyebrow-label text-steel-600 dark:text-steel-400">Digital material passport</p>
                    <p className="ledger-numeral mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{material.id} · surveyed {material.surveyedAt.slice(0, 10)}</p>
                  </div>
                  <StatusBadge status={material.status} />
                </div>

                <div className="grid gap-6 py-5 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <p className="eyebrow-label text-steel-600 dark:text-steel-400">Surveyed quantity</p>
                    <p className="ledger-numeral mt-1 text-4xl font-semibold tracking-tight text-ink-900 dark:text-white sm:text-title-sm">
                      {material.quantityT.toFixed(1)} <span className="text-theme-lg font-medium">t</span>
                    </p>
                  </div>
                  <div className="sm:text-end">
                    <p className="eyebrow-label text-steel-600 dark:text-steel-400">Estimate range</p>
                    <p className="ledger-numeral mt-1 text-theme-sm font-medium text-ink-800 dark:text-gray-200">
                      {material.quantityRangeT[0].toFixed(1)}–{material.quantityRangeT[1].toFixed(1)} t
                    </p>
                  </div>
                </div>

                <div className="relative h-2 bg-steel-100 dark:bg-steel-900" role="img" aria-label={`Estimated quantity range from ${material.quantityRangeT[0]} to ${material.quantityRangeT[1]} tonnes`}>
                  <div
                    className="absolute inset-y-0 bg-steel-600 dark:bg-steel-400"
                    style={{ insetInlineStart: `${rangeStart}%`, width: `${rangeWidth}%` }}
                  />
                  <div
                    className="absolute -top-1 size-4 border-2 border-gray-25 bg-ink-900 dark:border-gray-dark dark:bg-white"
                    style={{ insetInlineStart: `calc(${(material.quantityT / maxSurveyRange) * 100}% - 0.5rem)` }}
                  />
                </div>
                <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">Range reflects survey uncertainty · marker shows the current estimate</p>

                <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-steel-200 py-5 dark:border-steel-800 sm:grid-cols-4">
                  <PassportField label="Condition" value={material.condition} />
                  <PassportField label="Grade" value={`Grade ${material.grade}`} />
                  <PassportField label="Confidence" value={`${Math.round(material.confidence * 100)}%`} />
                  <PassportField label="Evidence" value={`${material.evidence.length} records`} />
                </dl>

                <div className="mt-5 grid gap-6 md:grid-cols-[1fr_0.9fr]">
                  <div>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="eyebrow-label text-steel-600 dark:text-steel-400">Survey evidence</p>
                      <span className="text-theme-xs text-gray-500 dark:text-gray-400">{material.evidence.length} linked records</span>
                    </div>
                    <ul className="mt-2 space-y-2">
                      {material.evidence.map((evidence) => (
                        <li key={evidence.ref ?? evidence.label} className="flex items-start justify-between gap-3 border-s-2 border-steel-300 ps-3 dark:border-steel-700">
                          <span className="text-theme-xs leading-5 text-ink-800 dark:text-gray-200">{evidence.label}</span>
                          <span className="ledger-numeral shrink-0 text-theme-xs text-gray-500 dark:text-gray-400">{evidence.recordedAt.slice(0, 10)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-steel-200 pt-4 md:border-s md:border-t-0 md:ps-5 md:pt-0 dark:border-steel-800">
                    <p className="eyebrow-label text-steel-600 dark:text-steel-400">Origin & receiver fit</p>
                    <Link
                      to="/app/explore"
                      state={{ projectId: material.projectId }}
                      className="mt-2 inline-block font-archivo text-theme-sm font-semibold text-ink-900 underline decoration-steel-300 underline-offset-4 hover:text-loop-700 dark:text-white dark:hover:text-loop-300"
                    >
                      {projectName(material.projectId)}
                    </Link>
                    {project && <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{project.location}</p>}
                    {receiver && (
                      <div className="mt-4 border-t border-steel-200 pt-3 dark:border-steel-800">
                        <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                          {existingAllocation ? "Allocated receiver" : "Best suitable receiver"}
                        </p>
                        <p className="mt-1 font-medium text-ink-900 dark:text-white">{receiver.name}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                          {candidate && <Badge color="info" size="sm">{Math.round(candidate.suitability * 100)}% suitable</Badge>}
                          {activeSlot && <span className="ledger-numeral text-theme-xs text-gray-500 dark:text-gray-400">{activeSlot.date}</span>}
                          {!existingAllocation && candidate && (
                            <span className={cn("text-theme-xs font-medium", capacityFits ? "text-loop-700 dark:text-loop-300" : "text-signal-700 dark:text-signal-300")}>
                              {capacityFits ? `${candidate.availableT.toFixed(1)} t available` : `${candidate.availableT.toFixed(1)} t available · capacity short`}
                            </span>
                          )}
                          {existingAllocation && <StatusBadge status={existingAllocation.status} />}
                        </div>
                      </div>
                    )}
                    {!receiver && <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">No suitable receiver match yet.</p>}
                  </div>
                </div>

                {media.length > 1 && (
                  <div className="mt-5 flex gap-2 overflow-x-auto border-t border-steel-200 pt-4 dark:border-steel-800">
                    {media.slice(1).map((item: MaterialMediaItem) => (
                      <figure key={item.id} className="flex w-36 shrink-0 items-center gap-2">
                        <img src={item.src} alt={item.caption} loading="lazy" className="size-12 border border-steel-200 object-cover dark:border-steel-700" />
                        <figcaption className="text-theme-xs text-gray-500 dark:text-gray-400">{item.caption}</figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-12 border-t border-steel-300 pt-6 dark:border-steel-700">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="eyebrow-label text-steel-600 dark:text-steel-400">Source evidence</p>
            <h2 className="mt-1 font-archivo text-xl font-semibold tracking-tight text-ink-900 dark:text-white">Site media by project</h2>
          </div>
          <Link to="/app/projects" className="text-theme-xs font-semibold text-ink-800 underline decoration-steel-300 underline-offset-4 dark:text-gray-200">
            All projects →
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {dataset.projects
            .filter((project) => dataset.materials.some((material) => material.projectId === project.id && materialMedia(material).length > 0))
            .slice(0, 2)
            .map((project) => (
              <div key={project.id} className="border-t border-steel-300 pt-4 dark:border-steel-700">
                <h3 className="font-archivo text-base font-semibold text-ink-900 dark:text-white">{project.name}</h3>
                <div className="mt-4">
                  <ProjectSiteMedia projectId={project.id} />
                </div>
              </div>
            ))}
        </div>
      </section>
    </>
  );
}

function PassportField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow-label text-steel-600 dark:text-steel-400">{label}</dt>
      <dd className="ledger-numeral mt-1 text-theme-sm font-medium capitalize text-ink-900 dark:text-white">{value}</dd>
    </div>
  );
}
