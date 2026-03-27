import { Routes, Route } from "react-router-dom";
import AuthCard from "@/components/auth/AuthCard";
import AuthenticationPage from "./pages/AuthenticationPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthenticationPage />} />
      <Route path="/booking" element={<div>Booking page coming soon</div>} />
      <Route path="/driver" element={<div>Driver dashboard coming soon</div>} />
      <Route path="/admin" element={<div>Admin panel coming soon</div>} />
    </Routes>
  );
}
