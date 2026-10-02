import { useTranslation } from "react-i18next";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { GreenLoopDataset } from "@/domain/types";
import type { GreenLoopStoreValue } from "./contracts";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
const empty = (): GreenLoopDataset => ({ projects: [], materials: [], receivers: [], slots: [], allocations: [], bookings: [], verifications: [], events: [], demands: [], offers: [], supportRequests: [] });
const Context = createContext<GreenLoopStoreValue | null>(null);
export function GreenLoopStoreProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user, ready } = useAuth();
  const [dataset, setDataset] = useState<GreenLoopDataset>(empty);
  const [loadedFor, setLoadedFor] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [retry, setRetry] = useState(0);
  const busy = useRef(false);
  const generation = useRef(0);
  const revision = useRef(0);
  const identity = `${user?.id ?? ""}:${user?.receiverId ?? ""}:${user?.activeWorkspace ?? ""}`;
  useEffect(() => {
    generation.current++;
    if (!user) return;
    let active = true;
    let fetching = false;
    const refresh = async () => {
      if (busy.current || fetching) return;
      fetching = true;
      const refreshRevision = revision.current;
      try {
        const result = await api<{ dataset: GreenLoopDataset }>("/dataset");
        if (active && !busy.current && refreshRevision === revision.current) { setDataset(result.dataset); setLoadedFor(identity); setError(""); }
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : t("backend.workspaceFailed")); }
      finally { fetching = false; }
    };
    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 5000);
    window.addEventListener("focus", refresh);
    return () => { active = false; window.clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, [identity, user, retry, t]);
  const run = async <T,>(action: string, args: unknown[], fallback: T): Promise<T> => {
    if (busy.current) return fallback;
    const requestGeneration = generation.current;
    revision.current++;
    busy.current = true; setPending(true); setError("");
    try {
      const result = await api<{ dataset: GreenLoopDataset; result: T }>("/actions", "POST", { action, args });
      if (requestGeneration === generation.current) { revision.current++; setDataset(result.dataset); }
      return result.result;
    } catch (cause) { if (requestGeneration === generation.current) setError(cause instanceof Error ? cause.message : t("backend.saveFailed")); return fallback; }
    finally { busy.current = false; setPending(false); }
  };
  const value: GreenLoopStoreValue = {
    dataset: user ? dataset : empty(),
    requestCapacityAction: input => run("requestCapacityAction", [input], false),
    cancelBookingAction: input => run("cancelBookingAction", [input], false),
    dispatchAction: input => run("dispatchAction", [input], false),
    verifyAction: input => run("verifyAction", [input], false),
    addMaterialAction: input => run("addMaterialAction", [input], null),
    addDemandAction: input => run("addDemandAction", [input], null),
    addProjectAction: input => run("addProjectAction", [input], null),
    addCapacityAction: input => run("addCapacityAction", [input], null),
    updateCapacityAction: (slotId, capacityT) => run("updateCapacityAction", [slotId, capacityT], false),
    addSupportRequestAction: input => run("addSupportRequestAction", [input], null),
    addOfferAction: input => run("addOfferAction", [input], false),
    acceptOfferAction: id => run("acceptOfferAction", [id], false),
    declineOfferAction: id => run("declineOfferAction", [id], false),
    acceptRequestAction: (id, tonnes) => run("acceptRequestAction", [id, tonnes], false),
    rejectRequestAction: id => run("rejectRequestAction", [id], false),
    rescheduleRequestAction: (id, slot) => run("rescheduleRequestAction", [id, slot], false),
    receiveLoadAction: (id, tonnes, evidence) => run("receiveLoadAction", [id, tonnes, evidence], false),
    verifyLoadAction: (id, accepted, rejected, reason) => run("verifyLoadAction", [id, accepted, rejected, reason], false),
  };
  const loading = ready && user && loadedFor !== identity;
  return <Context.Provider value={value}>
    {error && <div role="alert" className="fixed inset-x-0 bottom-0 z-99999 flex items-center justify-center gap-3 bg-error-600 px-4 py-3 text-sm text-white">{error}<button type="button" className="underline" onClick={() => setRetry(value => value + 1)}>{t("backend.refresh")}</button></div>}
    {pending && <div role="status" className="fixed bottom-4 end-4 z-9999 bg-ink-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-ink-900">{t("backend.savingChanges")}</div>}
    {loading ? <div role="status" className="flex min-h-screen items-center justify-center text-steel-600 dark:text-steel-400">{t("backend.loadingWorkspace")}</div> : children}
  </Context.Provider>;
}
export function useGreenLoopStore(): GreenLoopStoreValue {
  const context = useContext(Context);
  if (!context) throw new Error("useGreenLoopStore must be used within GreenLoopStoreProvider");
  return context;
}
