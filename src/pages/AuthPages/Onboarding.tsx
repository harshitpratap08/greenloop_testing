import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/context/AuthContext";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { onboardingMedia } from "@/config/appMedia";
import { cn } from "@/utils";

const BOTH_ROLES: Role[] = ["provider", "receiver"];

const ROLE_CARDS = [
  {
    roles: ["provider"] as Role[],
    title: "I HAVE MATERIAL",
    body: "Survey material, build passports, match receivers and book capacity.",
    media: onboardingMedia.provider.image,
  },
  {
    roles: ["receiver"] as Role[],
    title: "I NEED MATERIAL",
    body: "Publish demand, review offers, manage receiving capacity and verify loads.",
    media: onboardingMedia.receiver.image,
  },
  {
    roles: BOTH_ROLES,
    title: "BOTH",
    body: "Run provider and receiver workspaces for this organization.",
    media: onboardingMedia.both.image,
  },
] as const;

const FIRST_ACTIONS = [
  { id: "provider:material", role: "provider" as const, title: "Add material", description: "Create a Material Passport for a project.", path: "/app/materials/new" },
  { id: "provider:receiver", role: "provider" as const, title: "Find a receiver", description: "Match material with a receiving facility.", path: "/app/receivers" },
  { id: "provider:deliveries", role: "provider" as const, title: "Track deliveries", description: "Open provider delivery tracking.", path: "/app/deliveries" },
  { id: "receiver:demand", role: "receiver" as const, title: "Request material", description: "Publish receiver demand.", path: "/app/receiver/demand" },
  { id: "receiver:offers", role: "receiver" as const, title: "Review offers", description: "Review material offers in your demand workspace.", path: "/app/receiver/demand" },
  { id: "receiver:capacity", role: "receiver" as const, title: "Manage capacity", description: "Add and plan receiving capacity.", path: "/app/receiver/capacity" },
];

export default function Onboarding() {
  const { user, ready, addWorkspaces, setActiveWorkspace, updateUser } = useAuth();
  const { dataset } = useGreenLoopStore();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState(user?.organization || "");
  const [location, setLocation] = useState(user?.location || "");
  const [vat, setVat] = useState(user?.vat || "");
  const [roles, setRoles] = useState<Role[]>([]);
  const [firstAction, setFirstAction] = useState<string | null>(null);

  if (!ready) {
    return <div role="status" className="flex min-h-screen items-center justify-center bg-white text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">Restoring your local demo session…</div>;
  }
  if (!user) return <Navigate to="/sign-in" replace />;

  const selectRoles = (selected: Role[]) => {
    setRoles(selected);
    setFirstAction((current) => current && selected.includes(current.split(":")[0] as Role)
      ? current
      : selected[0] === "receiver" ? "receiver:demand" : selected[0] ? "provider:material" : null);
  };

  const finishOnboarding = () => {
    const destination = FIRST_ACTIONS.find((action) => action.id === firstAction);
    if (!user || !destination || !roles.includes(destination.role)) return;
    const matchedReceiver = dataset.receivers.find((receiver) => receiver.name.trim().toLowerCase() === orgName.trim().toLowerCase());
    updateUser({ organization: orgName.trim() || user.organization, location: location.trim(), vat: vat.trim(), receiverId: matchedReceiver?.id ?? user.receiverId ?? "R-001" });
    addWorkspaces(roles);
    setActiveWorkspace(destination.role);
    navigate(destination.path);
  };

  const stepClass = (active: boolean) =>
    cn(
      "group relative w-full overflow-hidden border text-start transition-colors",
      active
        ? "border-ink-900 ring-1 ring-ink-900 dark:border-white dark:ring-white"
        : "border-steel-200 hover:border-ink-900 dark:border-steel-800 dark:hover:border-white",
    );

  return (
    <>
      <PageMeta title="Set up your workspace | GreenLoop" description="Choose how you will use GreenLoop." />
      <AuthLayout tone="receiving">
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-10 md:px-0">
          <AnimatePresence mode="wait">
            {/* Step 1 — WHAT ARE YOU HERE TO DO? (visual role cards) */}
            {step === 1 && (
              <motion.div
                key="s1"
                initial={reduce ? false : { opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: -32 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-8">
                  <p className="eyebrow-label text-steel-500 dark:text-steel-400">Set up · 1 of 3</p>
                  <h1 className="mt-2 font-archivo text-3xl font-bold tracking-tight text-ink-900 dark:text-white">What are you here to do?</h1>
                </div>
                <div className="flex flex-col gap-4">
                  {ROLE_CARDS.map((card) => {
                    const active = card.roles.length === roles.length && card.roles.every((r) => roles.includes(r));
                    return (
                      <button key={card.title} type="button" aria-pressed={active} onClick={() => selectRoles([...card.roles])} className={stepClass(active)}>
                        <span className="relative block h-28 w-full overflow-hidden">
                          <img src={card.media.src} alt={card.media.alt} loading="lazy" className={cn("size-full object-cover transition-transform duration-700", active ? "scale-[1.03]" : "group-hover:scale-[1.05]")} />
                          <span className="absolute inset-0 bg-ink-950/40" aria-hidden="true" />
                          <span className="absolute bottom-3 left-4 font-archivo text-lg font-bold uppercase tracking-wide text-white">{card.title}</span>
                          {active && (
                            <span className="absolute right-3 top-3 bg-loop-500 px-2 py-0.5 text-theme-xs font-bold uppercase text-white">Selected</span>
                          )}
                        </span>
                        <span className="block px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{card.body}</span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" onClick={() => setStep(2)} disabled={roles.length === 0} className="mt-6 flex w-full items-center justify-center border-2 border-ink-900 bg-ink-900 px-4 py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-loop-600 hover:border-loop-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500 dark:hover:border-loop-500 dark:hover:text-white">
                  Continue
                </button>
              </motion.div>
            )}

            {/* Step 2 — sample data or own data (visual, with video panel) */}
            {step === 2 && (
              <motion.div
                key="s2"
                initial={reduce ? false : { opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: -32 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-8">
                  <p className="eyebrow-label text-steel-500 dark:text-steel-400">Set up · 2 of 3</p>
                  <h1 className="mt-2 font-archivo text-3xl font-bold tracking-tight text-ink-900 dark:text-white">Start with</h1>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="relative overflow-hidden border border-loop-500 dark:border-loop-500">
                    <video
                      className="h-36 w-full object-cover"
                      src={onboardingMedia.sampleData.src}
                      poster={onboardingMedia.sampleData.poster}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      tabIndex={-1}
                    />
                    <div className="absolute inset-0 bg-ink-950/45" aria-hidden="true" />
                    <div className="absolute inset-0 flex flex-col justify-end p-4">
                      <p className="font-archivo text-lg font-bold uppercase tracking-wide text-white">Use sample data</p>
                      <p className="mt-1 text-sm text-white/75">The connected 15 t scenario — projects, passports, capacity, bookings and verification, all wired together.</p>
                    </div>
                  </div>
                  <div className="border border-steel-200 p-4 dark:border-steel-800">
                    <div className="relative mb-3 h-24 w-full overflow-hidden">
                      <img src={onboardingMedia.ownData.src} alt={onboardingMedia.ownData.alt} loading="lazy" className="size-full object-cover" />
                      <div className="absolute inset-0 bg-ink-950/45" aria-hidden="true" />
                      <p className="absolute bottom-3 left-4 font-archivo text-lg font-bold uppercase tracking-wide text-white">Start with my own data</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">An empty workspace — add your projects, survey material and publish capacity.</p>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex items-center justify-center border-2 border-steel-300 bg-white px-6 py-4 text-sm font-bold uppercase tracking-wider text-ink-900 transition-colors hover:border-ink-900 dark:border-steel-700 dark:bg-black dark:text-white dark:hover:border-white">Back</button>
                  <button type="button" onClick={() => setStep(3)} className="flex flex-1 items-center justify-center border-2 border-ink-900 bg-ink-900 px-4 py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-loop-600 hover:border-loop-600 dark:border-white dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500 dark:hover:border-loop-500 dark:hover:text-white">
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3 — organization details (optional) + first action */}
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
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Optional — prefills your profile. Then choose your first action.</p>
                </div>
                <div className="mb-6 space-y-4">
                  <div><Label>Organization Name</Label><Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. Riverstone Aggregates" /></div>
                  <div><Label>Location / Region</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. London, UK" /></div>
                  <div><Label>VAT / Company Number</Label><Input value={vat} onChange={(e) => setVat(e.target.value)} placeholder="Optional" /></div>
                </div>
                <div className="mb-6 flex flex-col gap-3">
                  {FIRST_ACTIONS.filter((action) => roles.includes(action.role)).map((action) => (
                    <button key={action.id} type="button" aria-pressed={firstAction === action.id} onClick={() => setFirstAction(action.id)} className={cn(stepClass(firstAction === action.id), "px-4 py-3")}>
                      <span className="block font-semibold text-ink-900 dark:text-white">{action.title}</span>
                      <span className="mt-0.5 block text-sm text-gray-500 dark:text-gray-400">{action.description}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="flex items-center justify-center border-2 border-steel-300 bg-white px-6 py-4 text-sm font-bold uppercase tracking-wider text-ink-900 transition-colors hover:border-ink-900 dark:border-steel-700 dark:bg-black dark:text-white dark:hover:border-white">Back</button>
                  <button type="button" onClick={finishOnboarding} disabled={!firstAction} className="flex flex-1 items-center justify-center border-2 border-ink-900 bg-ink-900 px-4 py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-loop-600 hover:border-loop-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500 dark:hover:border-loop-500 dark:hover:text-white">
                    Finish setup
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AuthLayout>
    </>
  );
}
