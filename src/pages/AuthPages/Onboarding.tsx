import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/context/AuthContext";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

export default function Onboarding() {
  const { user, addWorkspaces } = useAuth();
  const { initializeStore } = useGreenLoopStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  
  // Step 1: Org details
  const [orgName, setOrgName] = useState("");
  const [location, setLocation] = useState("");
  const [vat, setVat] = useState("");

  // Step 2: Roles
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
    }
  }, [user, navigate]);

  const toggleRole = (r: Role) => {
    setRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const finishOnboarding = (useDemoData: boolean) => {
    initializeStore(useDemoData);
    addWorkspaces(roles);
    navigate('/app');
  };

  return (
    <>
      <PageMeta title="Setup your organization | GreenLoop" description="Setup your GreenLoop workspace." />
      <AuthLayout>
        <div className="flex flex-1 flex-col justify-center max-w-md w-full mx-auto pt-10 px-4 md:px-0">
          
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h1 className="mb-2 font-archivo text-title-sm font-semibold tracking-tight text-ink-900 sm:text-title-md dark:text-white">
                  Organization details
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Step 1 of 3. Enter your company information.
                </p>
              </div>
              
              <div className="space-y-5">
                <div>
                  <Label>Organization Name</Label>
                  <Input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="e.g. Riverstone Aggregates" />
                </div>
                <div>
                  <Label>Location / Region</Label>
                  <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. London, UK" />
                </div>
                <div>
                  <Label>VAT / Company Number</Label>
                  <Input value={vat} onChange={e => setVat(e.target.value)} placeholder="Optional" />
                </div>
                
                <button
                  onClick={() => setStep(2)}
                  disabled={!orgName}
                  className="w-full mt-4 rounded-lg bg-ink-900 py-3 text-sm font-medium text-white hover:bg-loop-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h1 className="mb-2 font-archivo text-title-sm font-semibold tracking-tight text-ink-900 sm:text-title-md dark:text-white">
                  How will you use GreenLoop?
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Step 2 of 3. Select your operational roles. You can select both.
                </p>
              </div>

              <div className="flex flex-col gap-4 mb-6">
                <button
                  onClick={() => toggleRole('provider')}
                  className={`text-left p-5 border rounded-lg transition-colors ${roles.includes('provider') ? 'border-loop-500 bg-loop-50 dark:bg-loop-900/20' : 'border-steel-200 hover:border-steel-400 hover:bg-gray-25 dark:border-steel-800 dark:hover:border-steel-600 dark:hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <input type="checkbox" checked={roles.includes('provider')} readOnly className="size-4 rounded border-gray-300 text-loop-600 focus:ring-loop-600" />
                    <h3 className="font-semibold text-ink-900 dark:text-white">Material Provider</h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 pl-7">
                    I have materials to recover from a construction or demolition project.
                  </p>
                </button>

                <button
                  onClick={() => toggleRole('receiver')}
                  className={`text-left p-5 border rounded-lg transition-colors ${roles.includes('receiver') ? 'border-loop-500 bg-loop-50 dark:bg-loop-900/20' : 'border-steel-200 hover:border-steel-400 hover:bg-gray-25 dark:border-steel-800 dark:hover:border-steel-600 dark:hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <input type="checkbox" checked={roles.includes('receiver')} readOnly className="size-4 rounded border-gray-300 text-loop-600 focus:ring-loop-600" />
                    <h3 className="font-semibold text-ink-900 dark:text-white">Material Receiver</h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 pl-7">
                    I receive, process, or use recovered construction materials.
                  </p>
                </button>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-lg border border-steel-200 px-4 py-3 text-sm font-medium text-ink-900 hover:bg-gray-50 dark:border-steel-700 dark:text-white dark:hover:bg-white/5"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={roles.length === 0}
                  className="flex-1 rounded-lg bg-ink-900 py-3 text-sm font-medium text-white hover:bg-loop-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h1 className="mb-2 font-archivo text-title-sm font-semibold tracking-tight text-ink-900 sm:text-title-md dark:text-white">
                  Initial workspace data
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Step 3 of 3. How would you like to start?
                </p>
              </div>

              <div className="flex flex-col gap-4 mb-6">
                <button
                  onClick={() => finishOnboarding(false)}
                  className="text-left p-5 border border-steel-200 rounded-lg transition-colors hover:border-steel-400 hover:bg-gray-25 dark:border-steel-800 dark:hover:border-steel-600 dark:hover:bg-white/5"
                >
                  <h3 className="font-semibold text-ink-900 dark:text-white">Start with an empty workspace</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    I want to add my own projects and materials from scratch.
                  </p>
                </button>

                <button
                  onClick={() => finishOnboarding(true)}
                  className="text-left p-5 border border-steel-200 rounded-lg transition-colors hover:border-steel-400 hover:bg-gray-25 dark:border-steel-800 dark:hover:border-steel-600 dark:hover:bg-white/5"
                >
                  <h3 className="font-semibold text-ink-900 dark:text-white flex items-center gap-2">
                    Use simulated demo data
                    <span className="text-[10px] uppercase tracking-wider bg-loop-100 text-loop-800 px-2 py-0.5 rounded-full dark:bg-loop-900/30 dark:text-loop-300">Recommended</span>
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Pre-populate with sample passports, projects, and receivers to explore the platform.
                  </p>
                </button>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="rounded-lg border border-steel-200 px-4 py-3 text-sm font-medium text-ink-900 hover:bg-gray-50 dark:border-steel-700 dark:text-white dark:hover:bg-white/5"
                >
                  Back
                </button>
              </div>
            </div>
          )}

        </div>
      </AuthLayout>
    </>
  );
}
