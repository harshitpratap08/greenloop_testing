import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import StatusBadge from "@/components/greenloop/StatusBadge";
import {
  ProjectSiteMedia,
  materialMedia,
} from "@/components/greenloop/AppExploration";
import Badge from "@/components/ui/badge/Badge";
import { computeMatch } from "@/domain/capacity";

import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { Link } from "react-router";
import { motion } from "motion/react";

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

  const totalT = dataset.materials.reduce((total, material) => total + material.quantityT, 0);

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta
        title="Materials & Passports | GreenLoop"
        description="Traceable material passports from GreenLoop demolition surveys."
      />
      <PageBreadCrumb pageTitle="Materials & Passports" />

      {/* Cinematic Header Block */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="group relative mb-12 overflow-hidden border border-steel-200 bg-ink-950 p-8 shadow-lg sm:p-12 dark:border-steel-800 dark:bg-black"
      >
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <img
            src="/images/site/auth-concrete.jpg"
            alt="Material Stockpile"
            className="h-full w-full animate-slow-mo object-cover opacity-40 dark:opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/80 to-transparent dark:from-black/95 dark:via-black/70" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow-label text-loop-400">Material Traceability Register</p>
            <h1 className="mt-4 font-archivo text-4xl font-bold tracking-tight text-white drop-shadow-md sm:text-5xl">
              Physical material.<br />Digital record.
            </h1>
            <p className="mt-4 text-lg text-white/80 drop-shadow-sm">
              Each passport connects surveyed tonnes and evidence to a project origin, a suitable receiver, and its recovery status.
            </p>
            <Link to="/app/materials/new" className="mt-6 inline-flex bg-loop-600 px-6 py-3 font-archivo font-bold text-white uppercase tracking-wide hover:bg-loop-700">
              New Survey
            </Link>
          </div>
          <div className="flex flex-col items-start gap-1 border-l-2 border-loop-500 pl-6 md:items-end md:border-l-0 md:border-r-2 md:pl-0 md:pr-6 md:text-right">
            <span className="ledger-numeral text-4xl font-bold text-white">{dataset.materials.length}</span>
            <span className="eyebrow-label text-white/60">Active Passports</span>
            <span className="ledger-numeral mt-2 text-2xl font-semibold text-loop-400">{totalT.toFixed(1)} t</span>
            <span className="eyebrow-label text-white/60">Total Volume</span>
          </div>
        </div>
      </motion.div>

      {dataset.materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-steel-300 py-24 text-center dark:border-steel-700">
          <h3 className="font-archivo text-2xl font-bold text-ink-900 dark:text-white">No material passports yet.</h3>
          <p className="mt-2 text-steel-600 dark:text-gray-400">Start a survey to create your first material passport.</p>
          <Link to="/app/materials/new" className="mt-6 inline-flex bg-ink-900 px-8 py-4 font-archivo font-bold text-white uppercase tracking-wide hover:bg-loop-600 dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500">
            New Survey
          </Link>
        </div>
      ) : (
        <section className="space-y-8" aria-label="Material passports">
        {dataset.materials.map((material, i) => {
          const media = materialMedia(material);
          const existingAllocation = dataset.allocations.find(
            (allocation) => allocation.materialId === material.id && allocation.status !== "cancelled",
          );
          const candidate = computeMatch(dataset, material.id)[0];
          const receiverId = existingAllocation?.receiverId ?? candidate?.receiverId;
          const receiver = receiverId
            ? dataset.receivers.find((item) => item.id === receiverId)
            : undefined;
          const capacityFits = candidate ? candidate.availableT >= material.quantityT : false;

          return (
            <motion.article 
              key={material.id} 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3), ease: "easeOut" }}
              className="flex flex-col gap-5 rounded-sm border border-steel-200 bg-white p-4 shadow-sm transition-colors hover:border-steel-300 sm:flex-row sm:p-5 dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-steel-700"
            >
              {/* Compact Evidence Thumbnail */}
              <div className="relative size-24 shrink-0 overflow-hidden rounded bg-steel-100 sm:size-28 dark:bg-steel-900">
                {media[0] ? (
                  <img
                    src={media[0].src}
                    alt={media[0].caption}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-xs text-steel-400">No media</div>
                )}
                {media.length > 1 && (
                  <div className="absolute bottom-1 right-1 rounded bg-ink-900/80 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                    +{media.length - 1}
                  </div>
                )}
              </div>

              {/* Data Section */}
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="font-archivo text-xl font-bold uppercase tracking-tight text-ink-900 dark:text-white">
                        {TYPE_LABEL[material.type] ?? material.type}
                      </h2>
                      <StatusBadge status={material.status} />
                    </div>
                    <p className="mt-1 text-sm text-steel-600 dark:text-gray-400">
                      <Link to="/app/explore" state={{ projectId: material.projectId }} className="font-semibold text-ink-800 hover:text-loop-600 dark:text-gray-200 dark:hover:text-loop-400">
                        {projectName(material.projectId)}
                      </Link>
                      {" · "}
                      <span className="ledger-numeral text-xs">ID {material.id}</span>
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="flex items-baseline gap-1 sm:justify-end">
                      <p className="ledger-numeral text-2xl font-bold text-ink-900 dark:text-white">
                        {material.quantityT.toFixed(1)}
                      </p>
                      <span className="text-sm font-medium text-steel-500">t</span>
                    </div>
                    <p className="ledger-numeral mt-0.5 text-xs text-steel-500 dark:text-steel-400">
                      est. {material.quantityRangeT[0].toFixed(1)}–{material.quantityRangeT[1].toFixed(1)} t
                    </p>
                  </div>
                </div>

                {/* Horizontal Metadata Group */}
                <div className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-steel-600 dark:text-gray-400">
                  <span className="capitalize"><span className="font-medium text-ink-900 dark:text-gray-300">Cond:</span> {material.condition}</span>
                  <span><span className="font-medium text-ink-900 dark:text-gray-300">Grade:</span> {material.grade}</span>
                  <span><span className="font-medium text-ink-900 dark:text-gray-300">Conf:</span> {Math.round(material.confidence * 100)}%</span>
                  <span><span className="font-medium text-ink-900 dark:text-gray-300">Evidence:</span> {material.evidence.length}</span>
                </div>

                {/* Receiver Action / Context */}
                {receiver && (
                  <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-steel-100 pt-3 dark:border-steel-800/50">
                    <span className="text-xs font-semibold uppercase tracking-wider text-steel-500">
                      {existingAllocation ? "Allocated" : "Match"}
                    </span>
                    <span className="text-sm font-semibold text-ink-900 dark:text-gray-200">{receiver.name}</span>
                    
                    {!existingAllocation && candidate && (
                      <Badge color={capacityFits ? "success" : "warning"} size="sm">
                        {capacityFits ? `${candidate.availableT.toFixed(1)}t free` : `Capacity short`}
                      </Badge>
                    )}
                    {existingAllocation && <StatusBadge status={existingAllocation.status} />}
                  </div>
                )}
              </div>
            </motion.article>
          );
        })}
        </section>
      )}

      {/* Media Gallery Section */}
      <section className="mt-16 border-t border-steel-300 pt-10 dark:border-steel-700">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="eyebrow-label text-steel-500 dark:text-steel-400">Source Evidence</p>
            <h2 className="mt-2 font-archivo text-3xl font-bold tracking-tight text-ink-900 dark:text-white">Site media by project</h2>
          </div>
          <Link to="/app/projects" className="group flex items-center gap-2 text-sm font-semibold text-ink-800 transition-colors hover:text-loop-600 dark:text-gray-200 dark:hover:text-loop-400">
            All projects
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-2">
          {dataset.projects
            .filter((project) => dataset.materials.some((material) => material.projectId === project.id && materialMedia(material).length > 0))
            .slice(0, 2)
            .map((project, i) => (
              <motion.div 
                key={project.id} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.6 }}
                className="group relative overflow-hidden border border-steel-200 bg-white shadow-sm dark:border-steel-800 dark:bg-white/[0.02]"
              >
                <div className="border-b border-steel-200 bg-gray-50 px-6 py-4 dark:border-steel-800 dark:bg-white/[0.02]">
                  <h3 className="font-archivo text-lg font-bold text-ink-900 dark:text-white">{project.name}</h3>
                </div>
                <div className="p-6 transition-transform duration-700 group-hover:scale-[1.02]">
                  <ProjectSiteMedia projectId={project.id} />
                </div>
              </motion.div>
            ))}
        </div>
      </section>
    </div>
  );
}

