import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TrainerApplication from "./pages/TrainerApplication";
import SubmitEvent from "./pages/SubmitEvent";
import Admin from "./pages/Admin";
import TrainerDashboard from "./pages/TrainerDashboard";

const SECTION = process.env.REACT_APP_SECTION || "main";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* MAIN DOMAIN — event + trainer application */}
        {SECTION === "main" && (
          <>
            <Route path="/" element={<Navigate to="/trainer-application" replace />} />
            <Route path="/trainer-application" element={<TrainerApplication />} />
            <Route path="/submit-event" element={<SubmitEvent />} />
            <Route path="*" element={<Navigate to="/trainer-application" replace />} />
          </>
        )}

        {/* TRAINER DOMAIN — dashboard only */}
        {SECTION === "trainer" && (
          <>
            <Route path="/" element={<TrainerDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

        {/* ADMIN DOMAIN */}
        {SECTION === "admin" && (
          <>
            <Route path="/" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

      </Routes>
    </BrowserRouter>
  );
}