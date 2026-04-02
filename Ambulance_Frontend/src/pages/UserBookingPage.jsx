import React from "react";
import Map from "@/components/ui/Map.jsx";
import { Button } from "@/components/ui/button";
import ambulanceimage from "@/assets/ambulance_authpage.png";

import useAuth from "@/context/AuthContext";

const UserBookingPage = () => {
  const { user, loading } = useAuth();

  // ← This prevents the crash during auto-restore
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-xl">Restoring your session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-xl">Session expired. Please log in again.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="relative">
        <Map />
      </div>

      {/* Top Navbar */}
      <div
        className="absolute top-0 mx-auto w-full bg-slate-950/70 backdrop-blur-md flex justify-between items-center z-1000 px-10 py-3 shadow-lg 
transition-transform duration-300"
      >
        <div className="flex justify-start space-x-4 items-center w-5/6">
          <img
            src={ambulanceimage}
            className="rounded-full w-10 h-10 bg-white"
            alt="Ambulance"
          />
          <p className="text-white font-medium">
            Hello, {user?.displayName || user?.userName}
          </p>
        </div>

        <div>
          <Button variant="default" className="h-12 px-5">
            Emergency SOS
          </Button>
        </div>
      </div>

      {/* Bottom Dashboard Panel */}
      <div
        className="absolute h-1/3 bottom-0 mx-auto w-full sm:w-1/2
bg-white z-1000 p-4 rounded-t-2xl shadow-lg 
transition-transform duration-300 flex flex-col items-center"
      >
        <div className="space-y-5 p-3 w-full flex flex-col items-center">
          <input
            type="text"
            className="w-5/6 bg-red-500"
            placeholder="Enter Your Current Address"
          />
          <input
            type="text"
            name=""
            id=""
            className="w-5/6 bg-green-500"
            placeholder="Search for hospitals?"
          />
        </div>
      </div>
    </div>
  );
};

export default UserBookingPage;
