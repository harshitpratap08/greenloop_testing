import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { GreenLoopStoreProvider } from "./store/GreenLoopStore";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppLayout from "./layout/AppLayout";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import Onboarding from "./pages/AuthPages/Onboarding";
import Allocations from "./pages/app/Allocations";
import Dashboard from "./pages/app/Dashboard/Dashboard";
import Materials from "./pages/app/Materials";
import NewSurvey from "./pages/app/NewSurvey";
import Projects from "./pages/app/Projects";
import ProjectDetails from "./pages/app/ProjectDetails";
import Verification from "./pages/app/Verification";
import Explore from "./pages/app/Explore.tsx";
import MarketDemand from "./pages/app/MarketDemand";
import Profile from "./pages/app/Profile";
import Support from "./pages/app/Support";
import Settings from "./pages/app/Settings";
import MaterialPassport from "./pages/app/MaterialPassport";
import AuditTrail from "./pages/app/AuditTrail";
import BookingsDeliveries from "./pages/app/BookingsDeliveries";
import Landing from "./pages/site/Landing";
import NotFound from "./pages/OtherPage/NotFound";

// Receiver pages
import ReceiverOverview from "./pages/app/receiver/Overview";
import ReceiverDemand from "./pages/app/receiver/Demand";
import ReceiverIncomingRequests from "./pages/app/receiver/IncomingRequests";
import ReceiverVerificationPage from "./pages/app/receiver/ReceiverVerification";
import ReceiverProviders from "./pages/app/receiver/Providers";
import ProviderMaterialDetails from "./pages/app/receiver/ProviderMaterialDetails";
import ReceiverInventory from "./pages/app/receiver/Inventory";

import { useState } from "react";
import PageMeta from "./components/common/PageMeta";
import { FolderIcon, ArrowRightIcon, BoxCubeIcon } from "@/icons";

function WorkspaceSelector() {
  const { user, setActiveWorkspace } = useAuth();
  const [loading, setLoading] = useState<"receiver" | "provider" | null>(null);

  const handleSelect = async (role: "receiver" | "provider") => {
    setLoading(role);
    await setActiveWorkspace(role);
    window.location.href = role === "receiver" ? "/app/receiver/overview" : "/app/explore";
  };

  if (!user) return <Navigate to="/sign-in" replace />;

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
      <PageMeta title="Select Workspace | GreenLoop" description="Choose your workspace" />
      <div className="w-full max-w-3xl">
        <div className="mb-10 text-center">
          <h1 className="font-archivo text-3xl font-bold tracking-tight text-ink-900 dark:text-white">Choose your workspace</h1>
          <p className="mt-3 text-steel-600 dark:text-gray-400">Select how you want to interact with the GreenLoop platform today.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <button type="button" disabled={loading !== null} onClick={() => handleSelect("provider")} className="group relative flex flex-col items-start overflow-hidden rounded-2xl border border-steel-200 bg-white p-8 text-left shadow-sm transition hover:border-loop-600 hover:shadow-md dark:border-steel-800 dark:bg-[#17251d] dark:hover:border-loop-500">
            <span className="flex size-14 items-center justify-center rounded-xl bg-loop-100 text-loop-800 dark:bg-loop-900/50 dark:text-loop-300"><BoxCubeIcon className="size-7" /></span>
            <h2 className="mt-6 font-archivo text-xl font-bold text-ink-900 dark:text-white">Provider Workspace</h2>
            <p className="mt-2 text-sm leading-6 text-steel-600 dark:text-gray-400">Offer recovered materials, manage material passports, and track outbound deliveries from your projects.</p>
            <div className="mt-8 flex w-full items-center justify-between text-sm font-semibold text-loop-700 dark:text-loop-400">
              {loading === "provider" ? "Entering..." : "Enter Provider Workspace"}
              <ArrowRightIcon className="size-5 opacity-0 transition-all group-hover:-translate-x-1 group-hover:opacity-100" />
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-loop-600 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
          
          <button type="button" disabled={loading !== null} onClick={() => handleSelect("receiver")} className="group relative flex flex-col items-start overflow-hidden rounded-2xl border border-steel-200 bg-white p-8 text-left shadow-sm transition hover:border-[#17291e] hover:shadow-md dark:border-steel-800 dark:bg-[#17251d] dark:hover:border-[#315f3d]">
            <span className="flex size-14 items-center justify-center rounded-xl bg-[#eef3ef] text-[#17291e] dark:bg-[#17291e] dark:text-[#a0bba8]"><FolderIcon className="size-7" /></span>
            <h2 className="mt-6 font-archivo text-xl font-bold text-ink-900 dark:text-white">Receiver Workspace</h2>
            <p className="mt-2 text-sm leading-6 text-steel-600 dark:text-gray-400">Request materials, manage receiving capacity, and verify incoming loads at your facility.</p>
            <div className="mt-8 flex w-full items-center justify-between text-sm font-semibold text-[#17291e] dark:text-[#a0bba8]">
              {loading === "receiver" ? "Entering..." : "Enter Receiver Workspace"}
              <ArrowRightIcon className="size-5 opacity-0 transition-all group-hover:-translate-x-1 group-hover:opacity-100" />
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-[#17291e] opacity-0 transition-opacity group-hover:opacity-100 dark:bg-[#315f3d]" />
          </button>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GreenLoopStoreProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Experience 1 — public editorial website */}
            <Route index path="/" element={<Landing />} />
            <Route path="/platform" element={<Navigate to="/app" replace />} />

            {/* Experience 2 — GreenLoop platform under AppLayout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/app" element={<WorkspaceSelector />} />
                
                {/* Provider Routes */}
                <Route path="/app/explore" element={<Explore />} />
                <Route path="/app/dashboard" element={<Dashboard />} />
                <Route path="/app/operations" element={<Navigate to="/app/dashboard" replace />} />
                <Route path="/app/projects/:id" element={<ProjectDetails />} />
                <Route path="/app/projects" element={<Projects />} />
                <Route path="/app/materials/new" element={<NewSurvey />} />
                <Route path="/app/materials/:id" element={<MaterialPassport />} />
                <Route path="/app/materials" element={<Materials />} />
                <Route path="/app/receivers" element={<Navigate to="/app/market-demand?view=receivers" replace />} />
                <Route path="/app/allocations" element={<Allocations />} />
                <Route path="/app/bookings-deliveries" element={<BookingsDeliveries />} />
                <Route path="/app/bookings" element={<Navigate to="/app/bookings-deliveries" replace />} />
                <Route path="/app/deliveries" element={<Navigate to="/app/bookings-deliveries" replace />} />
                <Route path="/app/verification" element={<Verification />} />
                <Route path="/app/reports" element={<Navigate to="/app/dashboard" replace />} />
                <Route path="/app/market-demand" element={<MarketDemand />} />
                <Route path="/app/profile" element={<Profile />} />
                <Route path="/app/support" element={<Support />} />
                <Route path="/app/settings" element={<Settings />} />
                <Route path="/app/audit-trail" element={<AuditTrail />} />
                <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
                <Route path="/profile" element={<Navigate to="/app/profile" replace />} />

                {/* Receiver Routes */}
                <Route path="/app/receiver/overview" element={<ReceiverOverview />} />
                <Route path="/app/receiver/demand" element={<ReceiverDemand />} />
                <Route path="/app/receiver/providers/:materialId" element={<ProviderMaterialDetails />} />
                <Route path="/app/receiver/providers" element={<ReceiverProviders />} />
                <Route path="/app/receiver/inventory" element={<ReceiverInventory />} />
                <Route path="/app/receiver/capacity" element={<Navigate to="/app/receiver/demand?capacity=1" replace />} />
                <Route path="/app/receiver/incoming-requests" element={<ReceiverIncomingRequests />} />
                <Route path="/app/receiver/incoming" element={<Navigate to="/app/receiver/incoming-requests" replace />} />
                <Route path="/app/receiver/deliveries" element={<Navigate to="/app/bookings-deliveries" replace />} />
                <Route path="/app/receiver/verification" element={<ReceiverVerificationPage />} />
              </Route>
            </Route>

            {/* Auth */}
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<Navigate to="/forgot-password" replace />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </GreenLoopStoreProvider>
    </AuthProvider>
  );
}
