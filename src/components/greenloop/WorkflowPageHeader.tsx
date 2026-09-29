import { Link } from "react-router";

export default function WorkflowPageHeader({
  title,
  description,
  status,
  action,
}: {
  title: string;
  description: string;
  status: string;
  action?: { label: string; to?: string; onClick?: () => void };
}) {
  return (
    <header className="mb-8 border-b border-steel-200 pb-6 dark:border-steel-800">
      <p className="eyebrow-label text-loop-600 dark:text-loop-400">GreenLoop operations</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="font-archivo text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-base text-steel-600 dark:text-gray-400">{description}</p>
          <p className="mt-3 text-sm font-medium text-ink-700 dark:text-gray-300"><span className="text-steel-500">Status:</span> {status}</p>
        </div>
        {action && (action.to ? (
          <Link to={action.to} className="inline-flex shrink-0 items-center justify-center bg-ink-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-loop-700 dark:bg-white dark:text-ink-900 dark:hover:bg-loop-400">
            {action.label}
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className="inline-flex shrink-0 items-center justify-center bg-ink-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-loop-700 dark:bg-white dark:text-ink-900 dark:hover:bg-loop-400">
            {action.label}
          </button>
        ))}
      </div>
    </header>
  );
}
