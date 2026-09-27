import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import {
  materialMedia,
  projectNextAction,
  projectSteps,
  ProjectStatusChip,
  STEP_LABELS,
  currentStepIndex,
  WorkflowRail,
} from "@/components/greenloop/AppExploration";
import type { Project } from "@/domain/types";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { Link } from "react-router";

export default function Projects() {
  const { dataset } = useGreenLoopStore();

  const rows = dataset.projects.map((project: Project) => {
    const materials = dataset.materials.filter((material) => material.projectId === project.id);
    const materialIds = new Set(materials.map((material) => material.id));
    const surveyedT = materials.reduce((total, material) => total + material.quantityT, 0);
    const verifiedT = dataset.verifications
      .filter((verification) => materialIds.has(verification.materialId))
      .reduce((total, verification) => total + verification.acceptedT, 0);
    const steps = projectSteps(dataset, project.id);
    const stageIndex = currentStepIndex(steps);
    const complete = project.status === "complete";
    const next = complete
      ? { label: "View project report", to: "/app/reports", reason: "Project marked complete." }
      : projectNextAction(dataset, project.id);
    const materialTypes = [...new Set(materials.map((material) => material.type))];
    const materialMix = [...materials.reduce((totals, material) => {
      totals.set(material.type, (totals.get(material.type) ?? 0) + material.quantityT);
      return totals;
    }, new Map<string, number>())];

    return {
      project,
      materials,
      surveyedT,
      verifiedT,
      recoveryRate: surveyedT > 0 ? Math.round((verifiedT / surveyedT) * 100) : 0,
      reservations: dataset.bookings.filter(
        (booking) => materialIds.has(booking.materialId) && booking.status === "confirmed",
      ).length,
      stageIndex,
      stageLabel: complete ? "Complete" : STEP_LABELS[stageIndex] ?? "Complete",
      complete,
      next,
      materialTypes,
      materialMix,
      media: materials.flatMap(materialMedia),
    };
  });

  const featured = rows.find((row) => row.project.status !== "complete") ?? rows[0];
  const remaining = rows.filter((row) => row.project.id !== featured?.project.id);

  return (
    <>
      <PageMeta
        title="Projects | GreenLoop"
        description="Demolition and construction projects on the GreenLoop recovery platform."
      />
      <PageBreadCrumb pageTitle="Projects" />

      <div className="space-y-10">
        {featured && (
          <section className="overflow-hidden border border-steel-200 bg-gray-25 dark:border-steel-800 dark:bg-gray-dark">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
              <div className="bg-ink-900 p-6 text-white sm:p-8 lg:p-10 dark:bg-black">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="eyebrow-label text-white/50">{featured.complete ? "Completed project record" : "Active recovery project"}</p>
                  <ProjectStatusChip status={featured.project.status} />
                </div>
                <div className="mt-7">
                  <p className="ledger-numeral text-theme-xs text-white/45">{featured.project.id} · {featured.project.location}</p>
                  <h2 className="mt-3 max-w-2xl font-archivo text-title-sm font-semibold leading-tight tracking-tight sm:text-title-md">
                    {featured.project.name}
                  </h2>
                </div>

                <div className="mt-8 border-y border-white/15 py-5">
                  <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                    <p className="eyebrow-label text-white/50">{featured.complete ? "Project status · Complete" : `Current workflow · ${featured.stageLabel}`}</p>
                    <p className="ledger-numeral text-theme-xs text-white/45">
                      {featured.surveyedT.toFixed(1)} t surveyed · {featured.verifiedT.toFixed(1)} t verified
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
                    {featured.materialMix.map(([type, tonnes]) => (
                      <p key={type} className="text-theme-xs capitalize text-white/60">
                        <span className="ledger-numeral font-semibold text-white/85">{tonnes.toFixed(1)} t</span> {type}
                      </p>
                    ))}
                  </div>
                  {featured.complete ? (
                    <p className="text-theme-sm text-white/70">Recovery work is marked complete.</p>
                  ) : (
                    <WorkflowRail projectId={featured.project.id} compact inverse />
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="eyebrow-label text-white/45">Next action</p>
                    <p className="mt-1 font-archivo text-xl font-semibold">{featured.next.label}</p>
                    <p className="mt-1 max-w-md text-theme-sm text-white/60">{featured.next.reason}</p>
                  </div>
                  <Link
                    to={featured.next.to}
                    className="inline-flex shrink-0 items-center justify-center gap-3 bg-white px-5 py-3 text-theme-sm font-semibold text-ink-900 transition-colors hover:bg-gray-200"
                  >
                    Open next action <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>

              <div className="flex flex-col">
                {featured.media[0] ? (
                  <img
                    src={featured.media[0].src}
                    alt={featured.media[0].caption}
                    className="h-56 w-full object-cover sm:h-72 lg:h-full lg:min-h-96"
                  />
                ) : (
                  <div className="flex h-56 items-end bg-steel-200 p-6 sm:h-72 lg:h-full lg:min-h-96 dark:bg-steel-900">
                    <p className="eyebrow-label text-steel-700 dark:text-steel-300">Site record · {featured.project.id}</p>
                  </div>
                )}
                <div className="grid grid-cols-3 divide-x divide-steel-200 border-t border-steel-200 dark:divide-steel-800 dark:border-steel-800">
                  <Metric label="Materials" value={featured.materials.length.toString()} />
                  <Metric label="Reserved slots" value={featured.reservations.toString()} />
                  <Metric label="Recovered" value={`${featured.recoveryRate}%`} accent={featured.recoveryRate > 0} />
                </div>
              </div>
            </div>
          </section>
        )}

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-steel-300 pb-4 dark:border-steel-700">
            <div>
              <p className="eyebrow-label text-steel-600 dark:text-steel-400">Project portfolio</p>
              <h2 className="mt-1 font-archivo text-title-sm font-semibold tracking-tight text-ink-900 dark:text-white">Recovery work in motion</h2>
            </div>
            <p className="ledger-numeral text-theme-xs text-gray-500 dark:text-gray-400">
              {rows.length} projects · {rows.reduce((sum, row) => sum + row.surveyedT, 0).toFixed(1)} t surveyed
            </p>
          </div>

          <div className="divide-y divide-steel-200 dark:divide-steel-800">
            {remaining.map((row) => (
              <Link
                key={row.project.id}
                to="/app/explore"
                state={{ projectId: row.project.id }}
                className="group grid gap-5 py-6 transition-colors hover:bg-white/60 sm:grid-cols-[minmax(0,1fr)_minmax(15rem,0.9fr)] sm:items-center sm:px-4 dark:hover:bg-white/5"
              >
                <div className="flex min-w-0 items-start gap-4">
                  {row.media[0] ? (
                    <img src={row.media[0].src} alt={row.media[0].caption} loading="lazy" className="size-20 shrink-0 border border-steel-200 object-cover dark:border-steel-700 sm:size-24" />
                  ) : (
                    <div className="size-20 shrink-0 border border-steel-200 bg-steel-100 sm:size-24 dark:border-steel-700 dark:bg-steel-900" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-archivo text-lg font-semibold tracking-tight text-ink-900 group-hover:text-loop-700 dark:text-white dark:group-hover:text-loop-300">
                        {row.project.name}
                      </h3>
                      <ProjectStatusChip status={row.project.status} />
                    </div>
                    <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                      {row.project.id} · {row.project.location} · active stage: {row.stageLabel}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {row.materialTypes.map((type) => (
                        <span key={type} className="border border-steel-200 px-2 py-0.5 text-theme-xs capitalize text-steel-700 dark:border-steel-700 dark:text-steel-300">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="min-w-0 sm:border-s sm:border-steel-200 sm:ps-5 dark:sm:border-steel-800">
                  {row.complete ? (
                    <p className="eyebrow-label text-loop-700 dark:text-loop-300">Project complete · workflow closed</p>
                  ) : (
                    <WorkflowRail projectId={row.project.id} compact />
                  )}
                  <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="eyebrow-label text-steel-600 dark:text-steel-400">Next · {row.next.label}</p>
                      <p className="ledger-numeral mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                        {row.surveyedT.toFixed(1)} t surveyed · {row.verifiedT.toFixed(1)} t recovered
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="ledger-numeral text-theme-sm font-semibold text-ink-900 dark:text-white">{row.recoveryRate}%</p>
                      <p className="eyebrow-label text-steel-500">recovered</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1 w-full bg-steel-100 dark:bg-steel-900">
                    <div className="h-full bg-loop-500 transition-[width] duration-500" style={{ width: `${row.recoveryRate}%` }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <p className="border-t border-steel-200 pt-4 text-theme-xs text-gray-500 dark:border-steel-800 dark:text-gray-400">
          Figures computed from the demo dataset — survey quantities, confirmed bookings and verified loads per project.
        </p>
      </div>
    </>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="min-w-0 px-3 py-4 first:ps-5 sm:px-5">
      <p className="eyebrow-label truncate text-steel-600 dark:text-steel-400">{label}</p>
      <p className={`ledger-numeral mt-1.5 text-lg font-semibold ${accent ? "text-loop-700 dark:text-loop-300" : "text-ink-900 dark:text-white"}`}>
        {value}
      </p>
    </div>
  );
}
