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
  EmptyState,
} from "@/components/greenloop/AppExploration";
import type { Project } from "@/domain/types";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { Link } from "react-router";
import { motion } from "motion/react";
import { cn } from "@/utils";

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
    <div className="relative min-h-screen pb-24">
      <PageMeta
        title="Projects | GreenLoop"
        description="Demolition and construction projects on the GreenLoop recovery platform."
      />
      <PageBreadCrumb pageTitle="Projects" />

      {/* Hero Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-10 border-b border-steel-300 pb-8 dark:border-steel-800"
      >
        <p className="eyebrow-label text-loop-600 dark:text-loop-400">GreenLoop Operations</p>
        <h1 className="mt-4 font-archivo text-4xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-5xl">
          Recovery Projects
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-steel-600 dark:text-gray-400">
          Monitor active demolition and construction projects, track material recovery progress, and coordinate logistics.
        </p>
      </motion.header>

      <div className="space-y-12">
        {featured && (
          <motion.section 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group relative overflow-hidden rounded-sm border border-steel-200 bg-white shadow-xl dark:border-steel-800 dark:bg-black"
          >
            <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
              <div className="flex flex-col bg-ink-950 p-8 text-white sm:p-12 dark:bg-[#0f141a]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="eyebrow-label text-loop-500">{featured.complete ? "Completed Project Record" : "Active Recovery Project"}</p>
                  <ProjectStatusChip status={featured.project.status} />
                </div>
                
                <div className="mt-8">
                  <p className="ledger-numeral text-sm font-medium text-white/50">{featured.project.id} · {featured.project.location}</p>
                  <h2 className="mt-2 font-archivo text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                    {featured.project.name}
                  </h2>
                </div>

                <div className="mt-10 border-t border-white/10 pt-6">
                  <div className="mb-4 flex flex-wrap items-baseline justify-between gap-4">
                    <p className="eyebrow-label text-white/60">{featured.complete ? "Project Status · Complete" : `Current Workflow · ${featured.stageLabel}`}</p>
                    <p className="ledger-numeral text-sm font-medium text-loop-400">
                      {featured.surveyedT.toFixed(1)} t surveyed · {featured.verifiedT.toFixed(1)} t verified
                    </p>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                    {featured.materialMix.map(([type, tonnes]) => (
                      <p key={type} className="text-sm font-semibold capitalize text-white/70">
                        <span className="ledger-numeral text-lg font-bold text-white">{tonnes.toFixed(1)} t</span> {type}
                      </p>
                    ))}
                  </div>
                  
                  <div className="mt-8 rounded-sm bg-black/40 p-6">
                    {featured.complete ? (
                      <p className="text-sm font-medium text-white/80">Recovery work is marked complete.</p>
                    ) : (
                      <WorkflowRail projectId={featured.project.id} compact inverse />
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-8">
                  <div className="flex flex-col gap-6 rounded-sm border border-white/10 bg-white/5 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="eyebrow-label text-white/50">Next Action</p>
                      <p className="mt-1 font-archivo text-xl font-bold">{featured.next.label}</p>
                      <p className="mt-1 max-w-sm text-sm text-white/70">{featured.next.reason}</p>
                    </div>
                    <Link
                      to={featured.next.to}
                      className="group/btn inline-flex shrink-0 items-center justify-center gap-3 overflow-hidden bg-white px-6 py-4 font-archivo text-sm font-bold uppercase tracking-wider text-ink-900 transition-transform hover:scale-105"
                    >
                      <span className="relative z-10">Open Action</span>
                      <span className="relative z-10 transition-transform group-hover/btn:translate-x-1" aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="relative h-64 overflow-hidden lg:h-full lg:min-h-[500px]">
                  {featured.media[0] ? (
                    <img
                      src={featured.media[0].src}
                      alt={featured.media[0].caption}
                      className="absolute inset-0 size-full animate-slow-mo object-cover opacity-90 transition-opacity hover:opacity-100 dark:opacity-80"
                    />
                  ) : (
                    <div className="flex h-full items-end bg-steel-200 p-8 dark:bg-steel-900">
                      <p className="eyebrow-label text-steel-700 dark:text-steel-300">Site Record · {featured.project.id}</p>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/80 to-transparent p-6 text-white lg:hidden">
                     <p className="text-sm font-medium">{featured.media[0]?.caption ?? "Site Photo"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 divide-x divide-steel-200 border-t border-steel-200 bg-gray-50 dark:divide-steel-800 dark:border-steel-800 dark:bg-white/[0.02]">
                  <Metric label="Materials" value={featured.materials.length.toString()} />
                  <Metric label="Reserved Slots" value={featured.reservations.toString()} />
                  <Metric label="Recovered" value={`${featured.recoveryRate}%`} accent={featured.recoveryRate > 0} />
                </div>
              </div>
            </div>
          </motion.section>
        )}

        <section>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-steel-300 pb-4 dark:border-steel-700">
            <div>
              <p className="eyebrow-label text-steel-600 dark:text-steel-400">Project Portfolio</p>
              <h2 className="mt-2 font-archivo text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Recovery Work In Motion</h2>
            </div>
            <p className="ledger-numeral text-sm font-medium text-steel-500 dark:text-gray-400">
              {rows.length} projects · {rows.reduce((sum, row) => sum + row.surveyedT, 0).toFixed(1)} t surveyed
            </p>
          </div>

          <div className="grid gap-6">
            {remaining.map((row, index) => (
              <motion.div
                key={row.project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Link
                  to="/app/explore"
                  state={{ projectId: row.project.id }}
                  className="group grid overflow-hidden rounded-sm border border-steel-200 bg-white shadow-sm transition-all hover:border-loop-400 hover:shadow-md sm:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)] dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-loop-500"
                >
                  <div className="flex min-w-0 flex-col p-6 sm:flex-row sm:items-center sm:gap-6">
                    <div className="mb-4 shrink-0 overflow-hidden rounded-sm sm:mb-0 sm:h-24 sm:w-32">
                      {row.media[0] ? (
                        <img src={row.media[0].src} alt={row.media[0].caption} loading="lazy" className="h-32 w-full animate-slow-mo object-cover transition-transform duration-700 group-hover:scale-110 sm:h-full sm:w-full" />
                      ) : (
                        <div className="h-32 w-full bg-steel-100 sm:h-full sm:w-full dark:bg-steel-900" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-archivo text-xl font-bold tracking-tight text-ink-900 group-hover:text-loop-600 dark:text-white dark:group-hover:text-loop-400">
                          {row.project.name}
                        </h3>
                        <ProjectStatusChip status={row.project.status} />
                      </div>
                      <p className="mt-1 text-sm font-medium text-steel-600 dark:text-gray-400">
                        {row.project.id} · {row.project.location} · Active Stage: <span className="text-ink-900 dark:text-gray-200">{row.stageLabel}</span>
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {row.materialTypes.map((type) => (
                          <span key={type} className="rounded-sm border border-steel-200 bg-gray-50 px-2 py-1 text-xs font-bold uppercase tracking-wider text-steel-700 dark:border-steel-700 dark:bg-white/5 dark:text-steel-300">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col justify-center border-t border-steel-200 bg-gray-50 p-6 sm:border-l sm:border-t-0 dark:border-steel-800 dark:bg-black/20">
                    {row.complete ? (
                      <p className="eyebrow-label text-loop-600 dark:text-loop-400">Project Complete · Workflow Closed</p>
                    ) : (
                      <WorkflowRail projectId={row.project.id} compact />
                    )}
                    
                    <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <p className="eyebrow-label text-steel-500 dark:text-steel-400">Next Action</p>
                        <p className="mt-1 font-archivo text-sm font-bold text-ink-900 dark:text-white">{row.next.label}</p>
                        <p className="ledger-numeral mt-1 text-xs text-steel-600 dark:text-gray-400">
                          {row.surveyedT.toFixed(1)} t surveyed · {row.verifiedT.toFixed(1)} t recovered
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="ledger-numeral text-2xl font-bold text-loop-600 dark:text-loop-400">{row.recoveryRate}%</p>
                        <p className="eyebrow-label text-steel-500">Recovered</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-steel-200 dark:bg-steel-800">
                      <div className="h-full bg-loop-500 transition-[width] duration-1000 ease-out" style={{ width: `${row.recoveryRate}%` }} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {rows.length === 0 && (
          <EmptyState 
            title="No active projects"
            body="You haven't added any recovery projects yet. Start by adding material from a project."
            action={{ label: "Add Material", to: "/app/materials/new" }}
          />
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="min-w-0 p-4 sm:p-6 text-center">
      <p className="eyebrow-label truncate text-steel-500 dark:text-steel-400">{label}</p>
      <p className={cn(
        "ledger-numeral mt-2 text-2xl font-bold tracking-tight",
        accent ? "text-loop-600 dark:text-loop-400" : "text-ink-900 dark:text-white"
      )}>
        {value}
      </p>
    </div>
  );
}
