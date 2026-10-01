import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/context/AuthContext";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

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

  const toggleRole = (role: Role) => {
    setSelected(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleContinue = () => {
    if (selected.length === 0) return;
    addWorkspaces(selected);
    navigate('/app');
  };

  return (
    <>
      <PageMeta title="Choose Role | GreenLoop" description="Select your GreenLoop role." />
      <AuthLayout>
        <div className="flex flex-1 flex-col justify-center max-w-md w-full mx-auto pt-10 px-4 md:px-0">
          <div className="mb-8">
            <h1 className="mb-2 font-archivo text-4xl font-bold uppercase tracking-tight text-ink-900 dark:text-white">
              Choose Role
            </h1>
            <p className="text-steel-600 dark:text-gray-400">
              Select your operational roles to customize your workspace. You can select both.
            </p>
          </div>

          <div className="flex flex-col gap-4 mb-6">
            <button
              onClick={() => toggleRole('provider')}
              className={`text-left p-6 border transition-colors ${selected.includes('provider') ? 'border-ink-900 ring-1 ring-ink-900 dark:border-white dark:ring-white bg-gray-50 dark:bg-white/[0.02]' : 'border-steel-200 hover:border-ink-900 hover:bg-gray-50 dark:border-steel-800 dark:hover:border-white dark:hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-3 mb-1">
                <input type="checkbox" checked={selected.includes('provider')} readOnly className="size-4 rounded border-gray-300 text-loop-600 focus:ring-loop-600" />
                <h3 className="font-semibold text-ink-900 dark:text-white">Material Provider</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 pl-7">
                I have materials to recover from a construction or demolition project.
              </p>
            </button>

            <button
              onClick={() => toggleRole('receiver')}
              className={`text-left p-6 border transition-colors ${selected.includes('receiver') ? 'border-ink-900 ring-1 ring-ink-900 dark:border-white dark:ring-white bg-gray-50 dark:bg-white/[0.02]' : 'border-steel-200 hover:border-ink-900 hover:bg-gray-50 dark:border-steel-800 dark:hover:border-white dark:hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-3 mb-1">
                <input type="checkbox" checked={selected.includes('receiver')} readOnly className="size-4 rounded border-gray-300 text-loop-600 focus:ring-loop-600" />
                <h3 className="font-semibold text-ink-900 dark:text-white">Material Receiver</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 pl-7">
                I receive, process, or use recovered construction materials.
              </p>
            </button>
          </div>
          
          <button
            onClick={handleContinue}
            disabled={selected.length === 0}
            className="mt-4 flex w-full items-center justify-center border-2 border-ink-900 bg-ink-900 px-4 py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-loop-600 hover:border-loop-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500 dark:hover:border-loop-500 dark:hover:text-white"
          >
            Continue
          </button>
        </div>
      </AuthLayout>
    </>
  );
}
