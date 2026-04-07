import { Routes, Route } from "react-router-dom";
import AuthenticationPage from "./pages/AuthenticationPage.jsx";
import DriverRegisterPage from "./pages/DriverRegisterPage.jsx";
import UserBookingPage from "./pages/UserBookingPage.jsx";
import ProtectedRoute from "@/components/auth/ProtectedRoute.jsx";
import DriverDashboard from "./pages/DriverDashboard.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthenticationPage />} />
      <Route path="/driver/register" element={<DriverRegisterPage />} />

      <Route
        path="/booking"
        element={
          <ProtectedRoute>
            <UserBookingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/driver"
        element={
          <ProtectedRoute role="Driver">
            <DriverDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="Admin">
            <div>Admin panel coming soon</div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}