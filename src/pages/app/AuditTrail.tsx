import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { formatStamp } from "@/utils";

export default function AuditTrail() {
  const { dataset } = useGreenLoopStore();
  const events = [...dataset.events].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta title="Activity history | GreenLoop" description="Review the GreenLoop shared transaction event history." />
      <PageBreadCrumb pageTitle="Activity history" />
      <section className="mx-auto max-w-4xl rounded-sm border border-steel-200 bg-white p-6 shadow-sm dark:border-steel-800 dark:bg-white/[0.02]">
        <h1 className="font-archivo text-2xl font-bold text-ink-900 dark:text-white">Shared activity history</h1>
        <p className="mt-2 text-sm text-steel-600 dark:text-gray-400">Provider and Receiver actions appear here from the same GreenLoop state.</p>
        {events.length === 0 ? <p className="mt-6 text-sm text-steel-500">No activity has been recorded yet.</p> : (
          <ol className="mt-6 divide-y divide-steel-100 dark:divide-steel-800">
            {events.map((event) => (
              <li key={event.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-ink-900 dark:text-white">{event.summary}</p>
                  <time className="text-xs text-steel-500" dateTime={event.at}>{formatStamp(event.at)}</time>
                </div>
                <p className="mt-1 text-sm text-steel-600 dark:text-gray-400">{event.actor.name} · {event.kind}</p>
                {event.detail && <p className="mt-1 text-sm text-steel-500 dark:text-gray-500">{event.detail}</p>}
                <p className="mt-1 text-xs text-steel-400">{event.subjectIds.join(" · ")}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
