/**
 * Explore — the friendly project-first home for the app.
 *
 * Replaces the dense operational dashboard as the landing experience:
 *   WELCOME → "What would you like to do?" → YOUR PROJECTS → guided detail.
 * Advanced/operational pages (Operations, Allocations, ledger internals)
 * remain one click away for admins and returning users.
 */

import { useGreenLoopStore } from "@/store/GreenLoopStore";
import {
  BookingSummaryRow,
  EmptyState,
  FriendlyPageHeader,
  PrimaryActions,
  ProjectCard,
  SlotAvailability,
  STORY_PROJECT_ID,
  WorkflowRail,
  projectNextAction,
  useAppRole,
  useGreeting,
} from "@/components/greenloop/AppExploration";
import { Link, useLocation } from "react-router";
import { computeMatch } from "@/domain/capacity";
import { STORY } from "@/domain/demoData";
import { cn } from "@/utils";

export default function Explore() {
  const { dataset } = useGreenLoopStore();
  const [role] = useAppRole();
  const greeting = useGreeting();
  const location = useLocation();
  const selectedId =
    (location.state as { projectId?: string } | null)?.projectId ??
    dataset.projects.find((p) => p.id === STORY_PROJECT_ID)?.id ??
    dataset.projects[0]?.id;
  const project = dataset.projects.find((p) => p.id === selectedId);
  const next = project ? projectNextAction(dataset, project.id) : null;
  const activeBookings = dataset.bookings.filter(
    (b) => b.status === "confirmed" || b.status === "hold",
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Role-aware greeting */}
      <FriendlyPageHeader
        title={`${greeting} — what would you like to do?`}
        subtitle={
          role === "receiver"
            ? "Receiver view — available materials and capacity"
            : role === "admin"
              ? "Admin view — full operational system below"
              : "Your projects, next actions and bookings"
        }
      >
        <RoleSwitchNote role={role} />
      </FriendlyPageHeader>

      <PrimaryActions />

      {/* Your projects */}
      <section className="mt-10">
        <h2 className="font-archivo text-lg font-bold text-ink-900 dark:text-white">
          Your projects
        </h2>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          Pick a project to see where it is and what happens next.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {dataset.projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </section>

      {/* Selected project — guided detail */}
      {project && (
        <section className="mt-10">
          <div className="surface-dark p-6 sm:p-8">
            <p className="eyebrow-label text-white/60">Selected project</p>
            <h2 className="mt-2 font-archivo text-2xl font-bold">{project.name}</h2>
            <p className="mt-1 text-theme-sm text-white/60">{project.location}</p>
            <div className="mt-5">
              <WorkflowRail projectId={project.id} />
            </div>
            {next && (
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                  to={next.to}
                  className="inline-flex items-center rounded-lg bg-white px-4 py-2.5 text-theme-sm font-semibold text-ink-900 hover:bg-gray-100 dark:bg-ink-900 dark:text-white dark:hover:bg-ink-800"
                >
                  {next.label} →
                </Link>
                <p className="text-theme-sm text-white/70">{next.reason}</p>
              </div>
            )}
          </div>

          {/* Capacity snapshot for the story slot */}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="surface-card p-5">
              <p className="eyebrow-label text-steel-600 dark:text-steel-400">
                Riverstone Aggregates — concrete intake
              </p>
              <div className="mt-4">
                <SlotAvailability slotId={STORY.concreteSlotSept24} />
              </div>
              <p className="mt-4 text-theme-xs text-gray-500 dark:text-gray-400">
                Live from the capacity ledger — tonnes reserved here cannot be
                double-booked.
              </p>
            </div>

            <div className="surface-card p-5">
              <p className="eyebrow-label text-steel-600 dark:text-steel-400">
                Today&apos;s bookings
              </p>
              {activeBookings.length === 0 ? (
                <div className="mt-3">
                  <EmptyState
                    title="No active bookings"
                    body="Bookings appear here once a receiver slot is reserved."
                    action={{ label: "Find a receiver", to: "/app/receivers" }}
                  />
                </div>
              ) : (
                <ul className="mt-2">
                  {activeBookings.map((b) => (
                    <BookingSummaryRow key={b.id} booking={b} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Admin quick access */}
      {role === "admin" && (
        <section className="mt-10">
          <h2 className="font-archivo text-lg font-bold text-ink-900 dark:text-white">
            Operational system
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Operations console", to: "/app/operations" },
              { label: "Allocations & scoring", to: "/app/allocations" },
              { label: "Reports", to: "/app/reports" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-lg border border-gray-200 px-4 py-3 text-theme-sm font-semibold text-ink-900 hover:border-steel-300 dark:border-gray-800 dark:text-white dark:hover:border-steel-600"
              >
                {link.label} →
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function RoleSwitchNote({ role }: { role: string }) {
  return (
    <span
      className={cn(
        "rounded border px-2.5 py-1 text-theme-xs font-medium capitalize",
        "border-steel-300 bg-steel-50 text-steel-700 dark:border-steel-700 dark:bg-white/5 dark:text-steel-300",
      )}
    >
      viewing as {role === "site" ? "site manager" : role}
    </span>
  );
}

/** Receiver-facing material spotlight (used when role === "receiver"). */
export function ReceiverSpotlight() {
  const { dataset } = useGreenLoopStore();
  const candidates = computeMatch(dataset, STORY.materialBId);
  const best = candidates[0];
  if (!best) return null;
  const receiver = dataset.receivers.find((r) => r.id === best.receiverId);
  return (
    <p className="text-theme-sm text-gray-500 dark:text-gray-400">
      Top demand signal: {receiver?.name} ({Math.round(best.suitability * 100)}% suitability).
    </p>
  );
}
