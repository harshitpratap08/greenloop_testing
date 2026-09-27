import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import StatusBadge from "@/components/greenloop/StatusBadge";
import {
  ProjectSiteMedia,
  materialMedia,
  type MaterialMediaItem,
} from "@/components/greenloop/AppExploration";
import Badge from "@/components/ui/badge/Badge";
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

  const projectName = (id: string) => dataset.projects.find((p) => p.id === id)?.name ?? id;
  const allocationFor = (materialId: string) =>
    dataset.allocations.find((a) => a.materialId === materialId);
  const receiverName = (id: string) => dataset.receivers.find((r) => r.id === id)?.name ?? id;

  return (
    <>
      <PageMeta
        title="Materials & Passports | GreenLoop"
        description="Traceable material passports from GreenLoop demolition surveys."
      />
      <PageBreadCrumb pageTitle="Materials & Passports" />

      {/* Site media — timestamped photo/video evidence per project (§9). */}
      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        {dataset.projects
          .filter((p) =>
            dataset.materials.some((m) => m.projectId === p.id && materialMedia(m).length > 0),
          )
          .slice(0, 2)
          .map((p) => (
            <div key={p.id} className="surface-card p-5 md:p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-archivo text-base font-bold text-ink-900 dark:text-white/90">
                  Site progress — {p.name}
                </h2>
                <Link
                  to="/app/projects"
                  className="text-theme-xs font-medium text-brand-500 hover:text-brand-600"
                >
                  All projects
                </Link>
              </div>
              <div className="mt-4">
                <ProjectSiteMedia projectId={p.id} />
              </div>
            </div>
          ))}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-6">
        {dataset.materials.map((material) => {
          const rangeWidth =
            ((material.quantityRangeT[1] - material.quantityRangeT[0]) /
              Math.max(material.quantityRangeT[1], 0.0001)) *
            100;
          const allocation = allocationFor(material.id);

          return (
            <article key={material.id} className="surface-card p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-ink-900 dark:text-white/90">
                    {TYPE_LABEL[material.type] ?? material.type}
                  </h3>
                  <p className="ledger-numeral mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
                    {material.id} · {projectName(material.projectId)}
                  </p>
                </div>
                <StatusBadge status={material.status} />
              </div>

              {/* Quantity + uncertainty range */}
              <div className="mt-4">
                <div className="flex items-baseline justify-between">
                  <span className="eyebrow-label text-steel-600 dark:text-steel-400">
                    Survey quantity
                  </span>
                  <span className="ledger-numeral text-theme-sm font-semibold text-ink-900 dark:text-white/90">
                    {material.quantityT.toFixed(1)} t
                  </span>
                </div>
                <div className="relative mt-2 h-2 w-full rounded-sm bg-gray-200 dark:bg-white/10">
                  <div
                    className="absolute top-0 h-2 rounded-sm bg-ink-900/70 dark:bg-white/60"
                    style={{
                      insetInlineStart: `${((material.quantityRangeT[0]) / material.quantityRangeT[1]) * (100 - rangeWidth) * 0 + (material.quantityRangeT[0] / Math.max(material.quantityRangeT[1], 0.0001)) * 100}%`,
                      width: `${rangeWidth}%`,
                    }}
                  />
                </div>
                <p className="ledger-numeral mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
                  range {material.quantityRangeT[0].toFixed(1)}–{material.quantityRangeT[1].toFixed(1)} t
                </p>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <dt className="eyebrow-label text-steel-600 dark:text-steel-400">Condition</dt>
                  <dd className="mt-1 text-theme-sm capitalize text-gray-700 dark:text-gray-300">
                    {material.condition}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow-label text-steel-600 dark:text-steel-400">Grade</dt>
                  <dd className="mt-1">
                    <Badge color="primary" size="sm">
                      Grade {material.grade}
                    </Badge>
                  </dd>
                </div>
              </dl>

              {/* Material media — receivers inspect the physical material (§10). */}
              {materialMedia(material).length > 0 && (
                <div className="mt-4">
                  <p className="eyebrow-label text-steel-600 dark:text-steel-400">Media</p>
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                    {materialMedia(material).map((item: MaterialMediaItem) => (
                      <figure key={item.id} className="w-36 shrink-0">
                        <img
                          src={item.src}
                          alt={item.caption}
                          className="aspect-[4/3] w-full rounded-md border border-gray-200 object-cover dark:border-gray-800"
                          loading="lazy"
                        />
                        <figcaption className="mt-1 truncate text-theme-xs text-gray-500 dark:text-gray-400">
                          {item.caption}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence chips */}
              <div className="mt-4">
                <p className="eyebrow-label text-steel-600 dark:text-steel-400">Evidence</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {material.evidence.map((evidence) => (
                    <span
                      key={evidence.ref ?? evidence.label}
                      className={cn(
                        "rounded-md border border-steel-200 bg-steel-50 px-2 py-1",
                        "text-theme-xs text-ink-800 dark:border-steel-800 dark:bg-white/5 dark:text-gray-300",
                      )}
                    >
                      {evidence.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="hairline-t mt-4 flex items-center justify-between pt-3">
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                  Confidence{" "}
                  <span className="ledger-numeral font-medium text-ink-900 dark:text-white/90">
                    {Math.round(material.confidence * 100)}%
                  </span>
                </p>
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                  {allocation
                    ? `Allocation ${allocation.id} at ${receiverName(allocation.receiverId)}`
                    : "Not yet allocated"}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
