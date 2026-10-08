import PageMeta from "@/components/common/PageMeta";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import type { Role } from "@/context/AuthContext.helpers";
import { useAuth } from "@/context/AuthContext.helpers";
import { ChevronLeftIcon } from "@/icons";
import { cn } from "@/utils";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import AuthLayout from "./AuthPageLayout";

const BOTH_ROLES: Role[] = ["provider", "receiver"];
const ROLE_OPTIONS: { roles: Role[]; title: string; description: string; symbol: string }[] = [
  { roles: ["provider"], title: "Material provider", description: "I have materials to recover.", symbol: "↗" },
  { roles: ["receiver"], title: "Material receiver", description: "I need materials for my facility.", symbol: "⌂" },
  { roles: BOTH_ROLES, title: "Both", description: "I supply and receive materials.", symbol: "↔" },
];

export default function Onboarding() {
  const { user, ready, updateUser } = useAuth();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState(user?.organization || "");
  const [location, setLocation] = useState(user?.location || "");
  const [vat, setVat] = useState(user?.vat || "");
  const [roles, setRoles] = useState<Role[]>([]);

  if (!ready) {
    return <div role="status" className="flex min-h-screen items-center justify-center bg-white text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">Restoring your session…</div>;
  }
  if (!user) return <Navigate to="/sign-in" replace />;

  const finishOnboarding = async () => {
    if (!user || roles.length === 0) return;
    const homeRole = user.activeWorkspace && roles.includes(user.activeWorkspace) ? user.activeWorkspace : roles[0];
    if (!await updateUser({ organization: orgName.trim() || user.organization, location: location.trim(), vat: vat.trim(), workspaces: roles, activeWorkspace: homeRole })) return;
    navigate("/app");
  };

  return (
    <>
      <PageMeta title="Set up your workspace | GreenLoop" description="Choose your role and add your organization details." />
      <AuthLayout>
        <div className="mx-auto w-full max-w-2xl px-6 pt-8 sm:px-8 lg:px-10">
          <Link to="/" className="inline-flex items-center text-sm text-steel-600 transition-colors hover:text-ink-900 dark:text-steel-400 dark:hover:text-white">
            <ChevronLeftIcon className="size-5 rtl:rotate-180" /> Back to GreenLoop
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-6 sm:px-8 lg:px-10">
          <p className="eyebrow-label text-steel-500 dark:text-steel-400">Set up · 3 of 3</p>
          <h1 className="mt-2 font-archivo text-3xl font-bold tracking-tight text-ink-900 dark:text-white">Choose your role</h1>
          <p className="mt-1 text-sm text-steel-600 dark:text-gray-400">Tell GreenLoop how you will use the recovery network.</p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {ROLE_OPTIONS.map((option) => {
              const active = option.roles.length === roles.length && option.roles.every((role) => roles.includes(role));
              return (
                <button
                  key={option.title}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setRoles(option.roles)}
                  className={cn(
                    "relative flex min-h-32 flex-col items-center border px-3 py-3 text-center transition-colors",
                    active
                      ? "border-loop-700 bg-loop-50 ring-1 ring-loop-500/20 dark:border-loop-500 dark:bg-loop-500/10"
                      : "border-steel-200 bg-white hover:border-loop-600 dark:border-steel-800 dark:bg-black dark:hover:border-loop-500",
                  )}
                >
                  <span className={cn("absolute left-3 top-3 flex size-4 items-center justify-center border", active ? "border-loop-700 bg-loop-700" : "border-steel-400 dark:border-steel-600")} aria-hidden="true">
                    {active && <span className="size-1.5 bg-white" />}
                  </span>
                  <span className="my-1 font-archivo text-2xl text-loop-800 dark:text-loop-300" aria-hidden="true">{option.symbol}</span>
                  <span className="font-archivo text-xs font-bold uppercase tracking-wide text-ink-900 dark:text-white">{option.title}</span>
                  <span className="mt-1 text-xs leading-4 text-gray-600 dark:text-gray-400">{option.description}</span>
                </button>
              );
            })}
          </div>

          <div className="my-5 border-t border-steel-200 dark:border-steel-800" />
          <h2 className="font-archivo text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Organization details</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Optional — prefills your profile.</p>
          <div className="mt-4 space-y-3">
            <div><Label>Organization Name</Label><Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. Riverstone Aggregates" /></div>
            <div><Label>Location / Region</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. London, UK" /></div>
            <div><Label>VAT / Company Number</Label><Input value={vat} onChange={(e) => setVat(e.target.value)} placeholder="Optional" /></div>
          </div>
          <div className="mt-5 flex gap-3">
            <Link to="/" className="flex items-center justify-center border border-steel-300 bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-ink-900 transition-colors hover:border-ink-900 dark:border-steel-700 dark:bg-black dark:text-white dark:hover:border-white">Back</Link>
            <button type="button" onClick={finishOnboarding} disabled={roles.length === 0} className="flex flex-1 items-center justify-center border-2 border-loop-900 bg-loop-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-loop-700 hover:border-loop-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-loop-600 dark:bg-loop-600 dark:hover:bg-loop-500">
              Finish Setup
            </button>
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
