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
  const projectById = (id: string) => dataset.projects.find((project) => project.id === id);
  const maxSurveyRange = Math.max(...dataset.materials.map((material) => material.quantityRangeT[1]), 1);
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
          </div>
          <div className="flex flex-col items-start gap-1 border-l-2 border-loop-500 pl-6 md:items-end md:border-l-0 md:border-r-2 md:pl-0 md:pr-6 md:text-right">
            <span className="ledger-numeral text-4xl font-bold text-white">{dataset.materials.length}</span>
            <span className="eyebrow-label text-white/60">Active Passports</span>
            <span className="ledger-numeral mt-2 text-2xl font-semibold text-loop-400">{totalT.toFixed(1)} t</span>
            <span className="eyebrow-label text-white/60">Total Volume</span>
          </div>
        </div>
      </motion.div>

      <section className="space-y-8" aria-label="Material passports">
        {dataset.materials.map((material, i) => {
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
            <motion.article 
              key={material.id} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="group grid overflow-hidden border border-steel-200 bg-white shadow-md transition-all hover:border-loop-400 hover:shadow-xl dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-loop-500/50 dark:hover:bg-white/[0.04] lg:grid-cols-[1fr_1.5fr]"
            >
              {/* Media Section with 3D Depth Hover */}
              <div className="relative min-h-64 overflow-hidden bg-steel-100 dark:bg-black lg:min-h-full">
                {media[0] ? (
                  <img
                    src={media[0].src}
                    alt={media[0].caption}
                    className="absolute inset-0 size-full animate-slow-mo object-cover opacity-90 transition-opacity duration-700 group-hover:opacity-100"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-steel-200 dark:bg-steel-900" />
                )}
                
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-transparent p-6 pt-24 text-white">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="eyebrow-label text-white/70 tracking-widest">Physical Material</p>
                      <h2 className="mt-2 font-archivo text-4xl font-bold uppercase tracking-tight text-white drop-shadow-md">
                        {TYPE_LABEL[material.type] ?? material.type}
                      </h2>
                    </div>
                    <p className="ledger-numeral rounded border border-white/20 bg-black/40 px-3 py-1.5 text-sm backdrop-blur-md">
                      {media[0]?.recordedAt.slice(0, 10) ?? material.surveyedAt.slice(0, 10)}
                    </p>
                  </div>
                  {media[0] && <p className="mt-3 border-l-2 border-loop-500 pl-3 text-sm text-white/80">{media[0].caption}</p>}
                </div>

                {media.length > 1 && (
                  <div className="absolute end-4 top-4 flex flex-col gap-2">
                    {media.slice(1).map((item: MaterialMediaItem, index) => (
                      <motion.img 
                        whileHover={{ scale: 1.1, x: -5 }}
                        key={item.id} 
                        src={item.src} 
                        alt={item.caption} 
                        loading="lazy" 
                        className="size-16 rounded-sm border-2 border-white/80 object-cover shadow-lg transition-all hover:border-loop-400" 
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Data Section */}
              <div className="flex min-w-0 flex-col p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-steel-200 pb-5 dark:border-steel-800">
                  <div>
                    <p className="eyebrow-label text-steel-500 dark:text-steel-400">Digital Material Passport</p>
                    <p className="ledger-numeral mt-1 text-sm text-ink-600 dark:text-gray-400">
                      ID: <span className="font-semibold text-ink-900 dark:text-white">{material.id}</span> · Surveyed {material.surveyedAt.slice(0, 10)}
                    </p>
                  </div>
                  <div className="transition-transform group-hover:scale-105">
                    <StatusBadge status={material.status} />
                  </div>
                </div>

                <div className="grid gap-6 py-8 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <p className="eyebrow-label text-steel-500 dark:text-steel-400">Surveyed Quantity</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <p className="ledger-numeral text-5xl font-bold tracking-tight text-ink-900 dark:text-white">
                        {material.quantityT.toFixed(1)}
                      </p>
                      <span className="text-2xl font-medium text-steel-400">t</span>
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <p className="eyebrow-label text-steel-500 dark:text-steel-400">Estimate Range</p>
                    <p className="ledger-numeral mt-2 text-xl font-medium text-ink-800 dark:text-gray-200">
                      {material.quantityRangeT[0].toFixed(1)}–{material.quantityRangeT[1].toFixed(1)} t
                    </p>
                  </div>
                </div>

                {/* Animated Range Slider */}
                <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-steel-100 shadow-inner dark:bg-black" role="img" aria-label="Quantity Range">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${rangeWidth}%` }}
                    transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                    viewport={{ once: true }}
                    className="absolute inset-y-0 rounded-full bg-steel-400/50 dark:bg-steel-600/50"
                    style={{ left: `${rangeStart}%` }}
                  />
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 1 }}
                    viewport={{ once: true }}
                    className="absolute top-0 bottom-0 w-1.5 bg-ink-900 shadow-[0_0_10px_rgba(0,0,0,0.5)] dark:bg-white dark:shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                    style={{ left: `calc(${(material.quantityT / maxSurveyRange) * 100}%)` }}
                  />
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-wider text-steel-500 dark:text-gray-500">
                  Range reflects survey uncertainty · Marker shows current estimate
                </p>

                <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 border-y border-steel-200 py-6 sm:grid-cols-4 dark:border-steel-800">
                  <PassportField label="Condition" value={material.condition} />
                  <PassportField label="Grade" value={`Grade ${material.grade}`} />
                  <PassportField label="Confidence" value={`${Math.round(material.confidence * 100)}%`} highlight={material.confidence > 0.8} />
                  <PassportField label="Evidence" value={`${material.evidence.length} records`} />
                </dl>

                <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <p className="eyebrow-label text-steel-500 dark:text-steel-400">Survey Evidence</p>
                    <ul className="mt-4 space-y-3">
                      {material.evidence.map((evidence, idx) => (
                        <motion.li 
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + (idx * 0.1) }}
                          viewport={{ once: true }}
                          key={evidence.ref ?? evidence.label} 
                          className="flex items-center justify-between gap-4 border-l-2 border-steel-300 pl-4 transition-colors hover:border-loop-500 dark:border-steel-700 dark:hover:border-loop-400"
                        >
                          <span className="text-sm font-medium text-ink-800 dark:text-gray-200">{evidence.label}</span>
                          <span className="ledger-numeral rounded bg-steel-100 px-2 py-1 text-xs text-steel-600 dark:bg-white/10 dark:text-gray-400">
                            {evidence.recordedAt.slice(0, 10)}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex-1 rounded-sm border border-steel-200 bg-gray-50 p-5 dark:border-steel-800 dark:bg-white/[0.02]">
                    <p className="eyebrow-label text-steel-500 dark:text-steel-400">Origin & Receiver Fit</p>
                    
                    <div className="mt-3">
                      <Link
                        to="/app/explore"
                        state={{ projectId: material.projectId }}
                        className="group inline-flex items-center gap-2 font-archivo text-lg font-bold text-ink-900 transition-colors hover:text-loop-600 dark:text-white dark:hover:text-loop-400"
                      >
                        {projectName(material.projectId)}
                        <span className="text-loop-500 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100">→</span>
                      </Link>
                      {project && <p className="mt-1 text-sm text-steel-600 dark:text-gray-400">{project.location}</p>}
                    </div>

                    {receiver && (
                      <div className="mt-5 border-t border-steel-200 pt-4 dark:border-steel-800">
                        <p className="text-xs font-semibold uppercase tracking-wider text-steel-500 dark:text-gray-500">
                          {existingAllocation ? "Allocated Receiver" : "Best Suitable Receiver"}
                        </p>
                        <p className="mt-1 font-archivo text-lg font-semibold text-ink-900 dark:text-white">{receiver.name}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {candidate && <Badge color="info" size="sm">{Math.round(candidate.suitability * 100)}% Match</Badge>}
                          {!existingAllocation && candidate && (
                            <Badge color={capacityFits ? "success" : "warning"} size="sm">
                              {capacityFits ? `${candidate.availableT.toFixed(1)}t free` : `Capacity short`}
                            </Badge>
                          )}
                          {existingAllocation && <StatusBadge status={existingAllocation.status} />}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </section>

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

function PassportField({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="eyebrow-label text-steel-500 dark:text-steel-400">{label}</dt>
      <dd className={cn(
        "ledger-numeral mt-1 text-lg font-semibold capitalize",
        highlight ? "text-loop-600 dark:text-loop-400" : "text-ink-900 dark:text-white"
      )}>
        {value}
      </dd>
    </div>
  );
}
