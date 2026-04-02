import React from "react";
import Map from "@/components/ui/Map.jsx";
import { Button } from "@/components/ui/button";
import ambulanceimage from "@/assets/ambulance_authpage.png";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAuth from "@/context/AuthContext";
import blsambulance from "@/assets/BLS_ambulance.png";
import alsambulance from "@/assets/ALS_ambulance.png";
import mortambulance from "@/assets/MORT_ambulance.png";

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
        className="absolute bottom-0 mx-auto w-full sm:w-1/2
bg-slate-950/70 backdrop-blur-md z-1000 p-4 rounded-t-2xl shadow-lg 
transition-transform duration-300 flex flex-col items-center space-y-7"
      >
        <div className="space-y-2 p-3 w-3/4 flex flex-col">
          <label className="text-slate-200 font-medium ">Pickup Address:</label>
          <input
            type="text"
            className="flex-1 bg-slate-800 outline-none pt-3 text-slate-100
                        placeholder-slate-500 font-medium tracking-widest caret-blue-400 w-full rounded-xl border-2 px-5 py-2 border-slate-500"
            placeholder="Enter Your Current Address"
          />
          <label className="text-slate-200 font-medium ">
            Hospital Address:
          </label>
          <input
            type="text"
            name=""
            id=""
            className="flex-1 bg-slate-800 outline-none pt-3 text-slate-100
                        placeholder-slate-500 font-medium tracking-widest caret-blue-400 w-full rounded-xl border-2 px-5 py-2 border-slate-500"
            placeholder="Search for hospitals?"
          />
        </div>
        <div className="flex justify-center w-full items-center">
          <Tabs
            defaultValue="overview"
            className={`flex justify-between items-center w-full`}
          >
            <TabsList
              variant="line"
              className={`flex justify-between items-center w-full`}
            >
              <TabsTrigger value="basic ambulance">
                <img src={blsambulance} alt="" srcset="" className="w-20" />
              </TabsTrigger>
              <TabsTrigger value="adavanced ambulance">
                <img src={alsambulance} alt="" srcset="" className="w-20" />
              </TabsTrigger>
              <TabsTrigger value="mortuary ambulance">
                <img src={mortambulance} alt="" srcset="" className="w-20" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserBookingPage;
