import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/context/AuthContext";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

const BOTH_ROLES: Role[] = ["provider", "receiver"];

export default function Onboarding() {
  const { user, ready, addWorkspaces, setActiveWorkspace, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState(user?.organization || "");
  const [location, setLocation] = useState(user?.location || "");
  const [vat, setVat] = useState(user?.vat || "");
  const [roles, setRoles] = useState<Role[]>([]);
  const [firstAction, setFirstAction] = useState<Role | null>(null);


  if (!ready) {
    return <div role="status" className="flex min-h-screen items-center justify-center bg-white text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">Restoring your local demo session…</div>;
  }
  if (!user) return <Navigate to="/sign-in" replace />;

  const selectRoles = (selected: Role[]) => {
    setRoles(selected);
    setFirstAction((current) => current && selected.includes(current) ? current : selected[0] || null);
  };

  const finishOnboarding = () => {
    if (!user || !firstAction || !roles.includes(firstAction)) return;
    updateUser({ organization: orgName.trim(), location: location.trim(), vat: vat.trim() });
    addWorkspaces(roles);
    setActiveWorkspace(firstAction);
    navigate(firstAction === "receiver" ? "/app/receiver/overview" : "/app/projects");
  };

  const roleCardClass = (active: boolean) => `rounded-lg border p-5 text-start transition-colors ${active ? "border-loop-500 bg-loop-50 dark:bg-loop-900/20" : "border-steel-200 hover:border-steel-400 hover:bg-gray-25 dark:border-steel-800 dark:hover:border-steel-600 dark:hover:bg-white/5"}`;

  return (
    <>
      <PageMeta title="Set up your organization | GreenLoop" description="Set up your local GreenLoop demo workspace." />
      <AuthLayout>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pt-10 md:px-0">
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h1 className="mb-2 font-archivo text-title-sm font-semibold tracking-tight text-ink-900 sm:text-title-md dark:text-white">Organization details</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Step 1 of 3. Enter your company information.</p>
              </div>
              <div className="space-y-5">
                <div><Label>Organization Name</Label><Input required value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. Riverstone Aggregates" /></div>
                <div><Label>Location / Region</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. London, UK" /></div>
                <div><Label>VAT / Company Number</Label><Input value={vat} onChange={(e) => setVat(e.target.value)} placeholder="Optional" /></div>
                <button type="button" onClick={() => setStep(2)} disabled={!orgName.trim()} className="mt-4 w-full rounded-lg bg-ink-900 py-3 text-sm font-medium text-white hover:bg-loop-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500">Continue</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h1 className="mb-2 font-archivo text-title-sm font-semibold tracking-tight text-ink-900 sm:text-title-md dark:text-white">How will you use GreenLoop?</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Step 2 of 3. Choose provider, receiver, or both. Existing workspace data is kept when adding a role.</p>
              </div>
              <div className="mb-6 flex flex-col gap-4">
                <button type="button" aria-pressed={roles.length === 1 && roles[0] === "provider"} onClick={() => selectRoles(["provider"])} className={roleCardClass(roles.length === 1 && roles[0] === "provider")}>
                  <h3 className="mb-1 font-semibold text-ink-900 dark:text-white">Material Provider</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">I have materials to recover from a construction or demolition project.</p>
                </button>
                <button type="button" aria-pressed={roles.length === 1 && roles[0] === "receiver"} onClick={() => selectRoles(["receiver"])} className={roleCardClass(roles.length === 1 && roles[0] === "receiver")}>
                  <h3 className="mb-1 font-semibold text-ink-900 dark:text-white">Material Receiver</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">I receive, process, or use recovered construction materials.</p>
                </button>
                <button type="button" aria-pressed={roles.length === 2} onClick={() => selectRoles(BOTH_ROLES)} className={roleCardClass(roles.length === 2)}>
                  <h3 className="mb-1 font-semibold text-ink-900 dark:text-white">Both provider and receiver</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Set up both operational workspaces for this organization.</p>
                </button>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="rounded-lg border border-steel-200 px-4 py-3 text-sm font-medium text-ink-900 hover:bg-gray-50 dark:border-steel-700 dark:text-white dark:hover:bg-white/5">Back</button>
                <button type="button" onClick={() => setStep(3)} disabled={roles.length === 0} className="flex-1 rounded-lg bg-ink-900 py-3 text-sm font-medium text-white hover:bg-loop-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500">Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h1 className="mb-2 font-archivo text-title-sm font-semibold tracking-tight text-ink-900 sm:text-title-md dark:text-white">Choose your first action</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Step 3 of 3. Your selection chooses the active workspace and destination.</p>
              </div>
              <div className="mb-6 flex flex-col gap-4">
                {roles.includes("provider") && <button type="button" aria-pressed={firstAction === "provider"} onClick={() => setFirstAction("provider")} className={roleCardClass(firstAction === "provider")}><h3 className="font-semibold text-ink-900 dark:text-white">Create a project</h3><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Open the provider project workspace.</p></button>}
                {roles.includes("receiver") && <button type="button" aria-pressed={firstAction === "receiver"} onClick={() => setFirstAction("receiver")} className={roleCardClass(firstAction === "receiver")}><h3 className="font-semibold text-ink-900 dark:text-white">Review receiver operations</h3><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Open your receiver overview.</p></button>}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="rounded-lg border border-steel-200 px-4 py-3 text-sm font-medium text-ink-900 hover:bg-gray-50 dark:border-steel-700 dark:text-white dark:hover:bg-white/5">Back</button>
                <button type="button" onClick={finishOnboarding} disabled={!firstAction} className="flex-1 rounded-lg bg-ink-900 py-3 text-sm font-medium text-white hover:bg-loop-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500">Finish setup</button>
              </div>
            </div>
          )}
        </div>
      </AuthLayout>
    </>
  );
}
