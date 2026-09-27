import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { GreenLoopStoreProvider } from "./store/GreenLoopStore";
import AppLayout from "./layout/AppLayout";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import Allocations from "./pages/app/Allocations";
import Bookings from "./pages/app/Bookings";
import Operations from "./pages/app/Dashboard/Operations";
import Materials from "./pages/app/Materials";
import Projects from "./pages/app/Projects";
import Receivers from "./pages/app/Receivers";
import Verification from "./pages/app/Verification";
import Explore from "./pages/app/Explore.tsx";
import Reports from "./pages/app/Reports.tsx";
import Deliveries from "./pages/app/Deliveries.tsx";
import Landing from "./pages/site/Landing";
import NotFound from "./pages/OtherPage/NotFound";

export default function App() {
  return (
    <GreenLoopStoreProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Experience 1 — public editorial website */}
          <Route index path="/" element={<Landing />} />
          <Route path="/platform" element={<Navigate to="/app/explore" replace />} />

          {/* Experience 2 — GreenLoop platform under AppLayout */}
          <Route element={<AppLayout />}>
            <Route path="/app" element={<Explore />} />
            <Route path="/app/explore" element={<Explore />} />
            <Route path="/app/dashboard" element={<Operations />} />
            <Route path="/app/projects" element={<Projects />} />
            <Route path="/app/materials" element={<Materials />} />
            <Route path="/app/receivers" element={<Receivers />} />
            <Route path="/app/allocations" element={<Allocations />} />
            <Route path="/app/bookings" element={<Bookings />} />
            <Route path="/app/deliveries" element={<Deliveries />} />
            <Route path="/app/verification" element={<Verification />} />
            <Route path="/app/reports" element={<Reports />} />
          </Route>

          {/* Auth */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </GreenLoopStoreProvider>
  );
}
