import { Routes, Route } from "react-router-dom"
import AuthCard from "@/components/auth/AuthCard"

export default function App() {
  return (
    <Routes>
      <Route path="/"       element={<AuthCard />} />
      <Route path="/book"   element={<div>Booking page coming soon</div>} />
      <Route path="/driver" element={<div>Driver dashboard coming soon</div>} />
      <Route path="/admin"  element={<div>Admin panel coming soon</div>} />
    </Routes>
  )
}