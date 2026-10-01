import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import {
  materialMedia,
  projectNextAction,
  projectSteps,
  ProjectStatusChip,
  STEP_LABELS,
  currentStepIndex,
  EmptyState,
} from "@/components/greenloop/AppExploration";
import type { Project } from "@/domain/types";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { Link } from "react-router";
import { projectMediaFor } from "@/config/appMedia";

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

    return {
      project,
      materials,
      surveyedT,
      verifiedT,
      recoveryRate: surveyedT > 0 ? Math.round((verifiedT / surveyedT) * 100) : 0,
      stageLabel: complete ? "Complete" : STEP_LABELS[stageIndex] ?? "Complete",
      complete,
      next,
      materialTypes,
      media: materials.flatMap(materialMedia),
    };
  });

  return (
    <div className="mx-auto max-w-[1200px] pb-24">
      <PageMeta
        title="Projects | GreenLoop"
        description="Demolition and construction projects on the GreenLoop recovery platform."
      />
      <PageBreadCrumb pageTitle="Projects" />

      {/* Hero Header */}
      <header className="mb-12">
        <p className="eyebrow-label text-steel-500 dark:text-steel-400">GreenLoop Operations</p>
        <h1 className="mt-2 font-archivo text-4xl font-bold tracking-tight text-ink-900 dark:text-white uppercase">
          Recovery Projects
        </h1>
        <p className="mt-3 text-lg text-steel-600 dark:text-gray-400">
          Monitor active demolition and construction projects, track material recovery progress, and coordinate logistics.
        </p>
      </header>

      <div className="space-y-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-steel-200 pb-4 dark:border-steel-800">
          <div>
            <h2 className="font-archivo text-2xl font-bold tracking-tight text-ink-900 dark:text-white uppercase">Active Projects</h2>
          </div>
          <p className="ledger-numeral text-sm font-medium text-steel-500 dark:text-gray-400">
            {rows.length} projects · {rows.reduce((sum, row) => sum + row.surveyedT, 0).toFixed(1)} t surveyed
          </p>
        </div>

        <div className="grid gap-6">
          {rows.map((row) => (
            <Link
              key={row.project.id}
              to="/app/explore"
              state={{ projectId: row.project.id }}
              className="group flex flex-col lg:flex-row overflow-hidden border border-steel-200 bg-white shadow-sm transition-all hover:border-ink-900 dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-white"
            >
              <div className="flex flex-1 flex-col sm:flex-row p-6 lg:p-8 gap-6 lg:gap-8">
                {/* Media — project photography with per-project fallback */}
                <div className="w-full sm:w-48 shrink-0 overflow-hidden border border-steel-200 dark:border-steel-800">
                  <img
                    src={row.media[0]?.src ?? projectMediaFor(row.project).src}
                    alt={row.media[0]?.caption ?? projectMediaFor(row.project).alt}
                    loading="lazy"
                    className="h-32 sm:h-full w-full object-cover opacity-90 transition-all duration-500 group-hover:scale-[1.04] group-hover:opacity-100"
                  />
                </div>
                
                {/* Info */}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="font-archivo text-2xl font-bold uppercase tracking-tight text-ink-900 dark:text-white">
                      {row.project.name}
                    </h3>
                    <ProjectStatusChip status={row.project.status} />
                  </div>
                  <p className="text-theme-sm text-steel-600 dark:text-gray-400 mb-4">
                    {row.project.location} · {row.project.id}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-6 mt-auto">
                    <div>
                      <p className="eyebrow-label text-steel-500 mb-1">Volume</p>
                      <p className="ledger-numeral text-lg font-bold text-ink-900 dark:text-white">{row.surveyedT.toFixed(1)} t</p>
                    </div>
                    <div>
                      <p className="eyebrow-label text-steel-500 mb-1">Current Stage</p>
                      <p className="font-archivo text-lg font-bold text-ink-900 dark:text-gray-200 uppercase">{row.stageLabel}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Area */}
              <div className="flex lg:w-72 shrink-0 flex-col justify-center border-t border-steel-200 bg-gray-50 p-6 lg:border-l lg:border-t-0 dark:border-steel-800 dark:bg-black/20">
                <p className="eyebrow-label text-steel-500 dark:text-steel-400 mb-2">Next Action</p>
                <p className="font-archivo text-xl font-bold text-ink-900 dark:text-white uppercase mb-2">{row.next.label}</p>
                <span className="mt-auto inline-flex items-center text-sm font-bold text-ink-900 dark:text-white uppercase tracking-wider group-hover:underline underline-offset-4">
                  Open Project →
                </span>
              </div>
            </Link>
          ))}
        </div>

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
