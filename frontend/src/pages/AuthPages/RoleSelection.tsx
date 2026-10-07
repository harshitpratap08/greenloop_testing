import PageMeta from "@/components/common/PageMeta";
import type { Role } from "@/context/AuthContext.helpers";
import { useAuth } from "@/context/AuthContext.helpers";
import { ChevronLeftIcon } from "@/icons";
import { cn } from "@/utils";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import AuthLayout from "./AuthPageLayout";

export default function RoleSelection() {
  const { user, addWorkspaces } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Role[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/sign-in');
    } else if (user.workspaces && user.workspaces.length > 0) {
      navigate('/app');
    }
  }, [user, navigate]);

  const chooseRoles = (roles: Role[]) => setSelected(roles);

  const handleContinue = async () => {
    if (selected.length === 0) return;
    if (!await addWorkspaces(selected)) return;
    navigate('/app');
  };

  const optionClass = (active: boolean) => cn(
    "w-full border px-4 py-4 text-start transition-colors",
    active
      ? "border-loop-600 bg-loop-50 ring-1 ring-loop-500/20 dark:border-loop-500 dark:bg-loop-500/10"
      : "border-steel-200 bg-white hover:border-loop-600 dark:border-steel-800 dark:bg-black dark:hover:border-loop-500",
  );

  return (
    <>
      <PageMeta title="Choose Role | GreenLoop" description="Select your GreenLoop role." />
      <AuthLayout>
        <div className="flex flex-1 flex-col">
          <div className="mx-auto w-full max-w-md px-6 pt-10 sm:px-8 lg:px-0">
            <Link to="/" className="inline-flex items-center text-sm text-steel-600 transition-colors hover:text-ink-900 dark:text-steel-400 dark:hover:text-white">
              <ChevronLeftIcon className="size-5 rtl:rotate-180" />
              Back to GreenLoop
            </Link>
          </div>
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-8 sm:px-8 lg:px-0">
            <div className="mb-8">
              <h1 className="mb-2 font-archivo text-4xl font-bold uppercase tracking-tight text-ink-900 dark:text-white">Choose your role</h1>
              <p className="text-steel-600 dark:text-gray-400">Tell GreenLoop how you will use the recovery network.</p>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { roles: ["provider"] as Role[], title: "Material provider", description: "I have materials to recover." },
                { roles: ["receiver"] as Role[], title: "Material receiver", description: "I need materials for my facility." },
                { roles: ["provider", "receiver"] as Role[], title: "Both", description: "I supply and receive materials." },
              ].map((option) => {
                const active = option.roles.length === selected.length && option.roles.every((role) => selected.includes(role));
                return (
                  <button key={option.title} type="button" aria-pressed={active} onClick={() => chooseRoles(option.roles)} className={optionClass(active)}>
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
            <button
              onClick={handleContinue}
              disabled={selected.length === 0}
              className="mt-6 flex w-full items-center justify-center border-2 border-ink-900 bg-ink-900 px-4 py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:border-loop-600 hover:bg-loop-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white dark:bg-white dark:text-ink-900 dark:hover:border-loop-500 dark:hover:bg-loop-500 dark:hover:text-white"
            >
              Continue
            </button>
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
