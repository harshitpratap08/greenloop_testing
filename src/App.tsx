import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { GreenLoopStoreProvider } from "./store/GreenLoopStore";
import { AuthProvider } from "./context/AuthContext";
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

import WorkspaceSelector from "./pages/app/WorkspaceSelector";

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
