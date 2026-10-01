/**
 * Materials & Passports — manage surveyed material.
 *
 * Media-first cards (distinct imagery per material type), each showing
 * quantity, project, condition/grade, status, evidence count and the
 * passport action. The project site-media gallery stays below.
 */

import PageMeta from "@/components/common/PageMeta";
import { ProjectSiteMedia } from "@/components/greenloop/AppExploration";
import { computeMatch } from "@/domain/capacity";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { Link } from "react-router";
import { PageMotion, RevealItem, MediaPanel, StatusChip, EmptyState } from "@/components/greenloop/kit";
import { materialMediaFor, ambientMedia } from "@/config/appMedia";

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
    <PageMotion className="materials-typography mx-auto max-w-[1200px] pb-24 font-inter antialiased">
      <PageMeta title="Material Passports | GreenLoop" description="Traceable material passports from GreenLoop demolition surveys." />

      <RevealItem>
        <header className="mb-10 grid border border-steel-200 bg-white shadow-sm dark:border-steel-800 dark:bg-white/[0.02] lg:grid-cols-[0.9fr_1.1fr]">
          <MediaPanel
            media={ambientMedia.brickPallets}
            aspect="h-full min-h-[200px]"
            scrim="bg-gradient-to-t from-ink-950/55 to-transparent"
            className="border-0 border-b border-steel-200 lg:border-b-0 lg:border-e dark:border-steel-800"
            caption="Recovered material, recorded and ready to place"
          />
          <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
            <div>
              <p className="eyebrow-label text-steel-500 dark:text-steel-400">GreenLoop operations</p>
              <h1 className="mt-2 font-archivo text-3xl font-medium tracking-tight text-ink-900 dark:text-white sm:text-4xl">Materials &amp; Passports</h1>
              <p className="mt-2 max-w-xl text-base text-gray-500 dark:text-gray-400">Digital records connecting physical material to projects and recovery status.</p>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="ledger-numeral text-2xl font-medium text-ink-900 dark:text-white">{dataset.materials.length}</span>
                <p className="eyebrow-label text-steel-500 dark:text-steel-400">Active passports</p>
              </div>
              <div>
                <span className="ledger-numeral text-2xl font-medium text-loop-600 dark:text-loop-400">{totalT.toFixed(1)} t</span>
                <p className="eyebrow-label text-steel-500 dark:text-steel-400">Total volume</p>
              </div>
              <Link to="/app/materials/new" className="inline-flex min-h-11 items-center bg-ink-900 px-5 font-archivo text-sm font-medium uppercase tracking-wider text-white hover:bg-loop-600 dark:bg-white dark:text-ink-900">
                Add material
              </Link>
            </div>
          </div>
        </header>
      </RevealItem>

      {dataset.materials.length === 0 ? (
        <RevealItem>
          <EmptyState
            title="No material passports yet"
            body="Add your material, quantity, location, and photos to create its digital record."
            action={
              <Link to="/app/materials/new" className="inline-flex min-h-11 items-center bg-ink-900 px-6 font-archivo text-sm font-medium uppercase tracking-wide text-white hover:bg-loop-600 dark:bg-white dark:text-ink-900">
                Add Material
              </Link>
            }
          />
        </RevealItem>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Material passports">
          {dataset.materials.map((material) => {
            const allocation = dataset.allocations.find((a) => a.materialId === material.id && a.status !== "cancelled");
            const candidate = computeMatch(dataset, material.id)[0];
            const receiverId = allocation?.receiverId ?? candidate?.receiverId;
            const matchedReceiver = receiverId ? dataset.receivers.find((item) => item.id === receiverId) : undefined;
            const photoCount = material.evidence.filter((e) => e.kind === "site-photo").length;
            const chip =
              material.status === "verified" ? "verified" as const
              : material.status === "dispatched" ? "active" as const
              : material.status === "reserved" || material.status === "allocated" ? "confirmed" as const
              : "attention" as const;
            return (
              <li key={material.id}>
                <article className="group flex h-full flex-col border border-steel-200 bg-white transition-colors hover:border-ink-900 dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-white">
                  <MediaPanel
                    media={materialMediaFor(material.type)}
                    aspect="aspect-[16/9]"
                    className="border-0 border-b border-steel-200 dark:border-steel-800"
                    caption={TYPE_LABEL[material.type] ?? material.type}
                  />
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="font-inter text-xl font-medium tracking-tight text-ink-900 dark:text-white">
                        {TYPE_LABEL[material.type] ?? material.type}
                      </h2>
                      <StatusChip status={chip} label={material.status} className="text-xs font-normal normal-case tracking-normal" />
                    </div>
                    <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                      <Link to="/app/explore" state={{ projectId: material.projectId }} className="font-medium text-ink-900 hover:text-loop-600 dark:text-gray-200 dark:hover:text-loop-400">
                        {projectName(material.projectId)}
                      </Link>
                      {" · "}
                      <span className="ledger-numeral">ID {material.id}</span>
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                      <div>
                        <p className="eyebrow-label text-steel-500 dark:text-steel-400">Volume</p>
                        <p className="ledger-numeral text-xl font-medium text-ink-900 dark:text-white">
                          {material.quantityT.toFixed(1)} <span className="text-xs font-medium text-steel-500">t</span>
                        </p>
                      </div>
                      <div>
                        <p className="eyebrow-label text-steel-500 dark:text-steel-400">Condition</p>
                        <p className="text-sm font-normal capitalize text-ink-900 dark:text-gray-300">{material.condition} · Grade {material.grade}</p>
                      </div>
                      <div>
                        <p className="eyebrow-label text-steel-500 dark:text-steel-400">Evidence</p>
                        <p className="ledger-numeral text-sm font-normal text-ink-900 dark:text-gray-300">{photoCount} photos · {material.evidence.length} records</p>
                      </div>
                    </div>

                    {matchedReceiver && (
                      <p className="mt-3 border-s-2 border-loop-500 ps-2 text-theme-xs text-gray-600 dark:text-gray-400">
                        {allocation ? "Matched with" : "Suggested"}: <span className="font-medium text-ink-900 dark:text-gray-200">{matchedReceiver.name}</span>
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4 dark:border-white/5 lg:mt-auto">
                      <Link to={`/app/materials/${material.id}`} className="inline-flex min-h-11 flex-1 items-center justify-center border-2 border-ink-900 px-4 text-sm font-medium text-ink-900 transition-colors hover:bg-ink-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-ink-900">
                        View passport
                      </Link>
                      {!allocation && (
                        <Link to="/app/receivers" state={{ materialId: material.id }} className="inline-flex min-h-11 items-center border border-steel-300 px-4 text-sm font-medium text-ink-900 hover:bg-steel-50 dark:border-steel-700 dark:text-white dark:hover:bg-white/5">
                          Find receiver
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {/* Project site-media gallery (preserved) */}
      <section className="mt-16 border-t border-steel-300 pt-10 dark:border-steel-700" aria-label="Site media by project">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="eyebrow-label text-steel-500 dark:text-steel-400">Source evidence</p>
            <h2 className="mt-2 font-archivo text-3xl font-medium tracking-tight text-ink-900 dark:text-white">Site media by project</h2>
          </div>
          <Link to="/app/projects" className="group flex items-center gap-2 text-sm font-medium text-ink-800 transition-colors hover:text-loop-600 dark:text-gray-200 dark:hover:text-loop-400">
            All projects
            <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          {dataset.projects
            .filter((project) => dataset.materials.some((material) => material.projectId === project.id))
            .slice(0, 2)
            .map((project) => (
              <div key={project.id} className="overflow-hidden border border-steel-200 bg-white dark:border-steel-800 dark:bg-white/[0.02]">
                <div className="border-b border-steel-200 px-6 py-4 dark:border-steel-800">
                  <h3 className="font-archivo text-lg font-medium text-ink-900 dark:text-white">{project.name}</h3>
                </div>
                <div className="p-6">
                  <ProjectSiteMedia projectId={project.id} />
                </div>
              </div>
            ))}
        </div>
      </section>
    </PageMotion>
  );
}
