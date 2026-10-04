import PageMeta from "@/components/common/PageMeta";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import type { Role } from "@/context/AuthContext.helpers";
import { useAuth } from "@/context/AuthContext.helpers";
import { ChevronLeftIcon } from "@/icons";
import { cn } from "@/utils";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate } from "react-router";
import AuthLayout from "./AuthPageLayout";

const BOTH_ROLES: Role[] = ["provider", "receiver"];

const ROLE_OPTIONS: { roles: Role[]; title: string; description: string }[] = [
  { roles: ["provider"], title: "Material provider", description: "I have materials to recover." },
  { roles: ["receiver"], title: "Material receiver", description: "I need materials for my facility." },
  { roles: BOTH_ROLES, title: "Both", description: "I supply and receive materials." },
];

export default function Onboarding() {
  const { t } = useTranslation();
  const { user, ready, updateUser } = useAuth();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState(user?.organization || "");
  const [location, setLocation] = useState(user?.location || "");
  const [vat, setVat] = useState(user?.vat || "");
  const [roles, setRoles] = useState<Role[]>([]);

  if (!ready) {
    return <div role="status" className="flex min-h-screen items-center justify-center bg-white text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">Restoring your session…</div>;
  }
  if (!user) return <Navigate to="/sign-in" replace />;

  const selectRoles = (selected: Role[]) => setRoles(selected);

  const finishOnboarding = async () => {
    if (!user || roles.length === 0) return;
    const homeRole = user.activeWorkspace && roles.includes(user.activeWorkspace) ? user.activeWorkspace : roles[0];
    if (!await updateUser({ organization: orgName.trim() || user.organization, location: location.trim(), vat: vat.trim(), workspaces: roles, activeWorkspace: homeRole })) return;
    navigate("/app");
  };

  const stepClass = (active: boolean) =>
    cn(
      "w-full border px-4 py-4 text-start transition-colors",
      active
        ? "border-loop-600 bg-loop-50 ring-1 ring-loop-500/20 dark:border-loop-500 dark:bg-loop-500/10"
        : "border-steel-200 bg-white hover:border-loop-600 dark:border-steel-800 dark:bg-black dark:hover:border-loop-500",
    );

  return (
    <>
      <PageMeta title="Set up your workspace | GreenLoop" description="Choose how you will use GreenLoop." />
      <AuthLayout>
        <div className="flex flex-1 flex-col">
          <div className="mx-auto w-full max-w-md px-6 pt-10 sm:px-8 lg:px-0">
            <Link to="/" className="inline-flex items-center text-sm text-steel-600 transition-colors hover:text-ink-900 dark:text-steel-400 dark:hover:text-white">
              <ChevronLeftIcon className="size-5 rtl:rotate-180" />
              Back to GreenLoop
            </Link>
          </div>
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-8 sm:px-8 lg:px-0">
            <AnimatePresence mode="wait">
            {/* Step 1 — choose workspace roles */}
            {step === 1 && (
              <motion.div
                key="s1"
                initial={reduce ? false : { opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: -32 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-8">
                  <h1 className="mb-2 font-archivo text-4xl font-bold uppercase tracking-tight text-ink-900 dark:text-white">Choose your role</h1>
                  <p className="text-steel-600 dark:text-gray-400">Tell GreenLoop how you will use the recovery network.</p>
                </div>
                <div className="flex flex-col gap-3">
                  {ROLE_OPTIONS.map((option) => {
                    const active = option.roles.length === roles.length && option.roles.every((role) => roles.includes(role));
                    return (
                      <button key={option.title} type="button" aria-pressed={active} onClick={() => selectRoles(option.roles)} className={stepClass(active)}>
                        <span className="flex items-start gap-3">
                          <span className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center border", active ? "border-loop-700 bg-loop-700" : "border-steel-400 dark:border-steel-600")} aria-hidden="true">
                            {active && <span className="size-1.5 bg-white" />}
                          </span>
                          <span>
                            <span className="block font-archivo text-sm font-bold uppercase tracking-wider text-ink-900 dark:text-white">{option.title}</span>
                            <span className="mt-1 block text-sm text-gray-600 dark:text-gray-400">{option.description}</span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" onClick={() => setStep(2)} disabled={roles.length === 0} className="mt-6 flex w-full items-center justify-center border-2 border-ink-900 bg-ink-900 px-4 py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-loop-600 hover:border-loop-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500 dark:hover:border-loop-500 dark:hover:text-white">
                  Continue
                </button>
              </motion.div>
            )}

            {/* Step 2 — select a workspace starting point */}
            {step === 2 && (
              <motion.div
                key="s2"
                initial={reduce ? false : { opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: -32 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-8">
                  <h1 className="mb-2 font-archivo text-4xl font-bold uppercase tracking-tight text-ink-900 dark:text-white">Set up your workspace</h1>
                  <p className="text-steel-600 dark:text-gray-400">Choose how you want to start using GreenLoop.</p>
                </div>
                <p className="text-sm text-steel-600 dark:text-steel-400">{t("backend.setupDescription")}</p>
                <div className="mt-6 flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex items-center justify-center border-2 border-steel-300 bg-white px-6 py-4 text-sm font-bold uppercase tracking-wider text-ink-900 transition-colors hover:border-ink-900 dark:border-steel-700 dark:bg-black dark:text-white dark:hover:border-white">Back</button>
                  <button type="button" onClick={() => setStep(3)} className="flex flex-1 items-center justify-center border-2 border-ink-900 bg-ink-900 px-4 py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-loop-600 hover:border-loop-600 dark:border-white dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500 dark:hover:border-loop-500 dark:hover:text-white">
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3 — organization details */}
            {step === 3 && (
              <motion.div
                key="s3"
                initial={reduce ? false : { opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: -32 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-8">
                  <p className="eyebrow-label text-steel-500 dark:text-steel-400">Set up · 3 of 3</p>
                  <h1 className="mt-2 font-archivo text-3xl font-bold tracking-tight text-ink-900 dark:text-white">Organization details</h1>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Optional — prefills your profile.</p>
                </div>
                <div className="mb-6 space-y-4">
                  <div><Label>Organization Name</Label><Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. Riverstone Aggregates" /></div>
                  <div><Label>Location / Region</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. London, UK" /></div>
                  <div><Label>VAT / Company Number</Label><Input value={vat} onChange={(e) => setVat(e.target.value)} placeholder="Optional" /></div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="flex items-center justify-center border-2 border-steel-300 bg-white px-6 py-4 text-sm font-bold uppercase tracking-wider text-ink-900 transition-colors hover:border-ink-900 dark:border-steel-700 dark:bg-black dark:text-white dark:hover:border-white">Back</button>
                  <button type="button" onClick={finishOnboarding} className="flex flex-1 items-center justify-center border-2 border-ink-900 bg-ink-900 px-4 py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-loop-600 hover:border-loop-600 dark:border-white dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500 dark:hover:border-loop-500 dark:hover:text-white">
                    Finish Setup
                  </button>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
