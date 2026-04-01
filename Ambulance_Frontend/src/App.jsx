import { Routes, Route } from "react-router-dom";
import AuthCard from "@/components/auth/AuthCard";
import AuthenticationPage from "./pages/AuthenticationPage.jsx";
import DriverRegisterPage from "./pages/DriverRegisterPage.jsx";
import UserBookingPage from "./pages/UserBookingPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthenticationPage />} />
      <Route path="/booking" element={<UserBookingPage />} />
      <Route path="/driver/register" element={<DriverRegisterPage />} />
      <Route path="/driver" element={<div>Driver dashboard coming soon</div>} />
      <Route path="/admin" element={<div>Admin panel coming soon</div>} />
    </Routes>
  );
}
