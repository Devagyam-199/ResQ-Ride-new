import React from "react";
import Map from "@/components/ui/Map.jsx";
import { Button } from "@/components/ui/button";
import ambulanceimage from "@/assets/ambulance_authpage.png";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAuth from "@/context/AuthContext";
import blsambulance from "@/assets/BLS_ambulance.png";
import alsambulance from "@/assets/ALS_ambulance.png";
import mortambulance from "@/assets/MORT_ambulance.png";
import { useState } from "react";

const UserBookingPage = () => {
  const { user, loading } = useAuth();
  const [userLoc, setUserLoc] = useState(null);
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropAddress, setDropAddress] = useState("");

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
    <div className="flex flex-col justify-center items-center h-screen overflow-hidden">
      <div className="relative flex-1 w-full">
        <Map />
      </div>

      {/* Top Navbar */}
      <div className="absolute top-0 mx-auto w-full sm:text-sm md:text-base lg:text-lg bg-slate-950/70 backdrop-blur-md flex justify-between items-center z-1000 px-10 py-3 shadow-lg transition-transform duration-300">
        <div className="flex justify-start space-x-4 items-center w-5/6">
          <img
            src={ambulanceimage}
            className="rounded-full w-10 h-10 bg-white"
            alt="Ambulance"
          />
          <p className="text-white font-medium md:flex hidden">
            Hello, {user?.displayName || user?.userName}
          </p>
        </div>

        <div>
          <Button variant="default" className="lg:h-12 h-10 px-5">
            Emergency SOS
          </Button>
        </div>
      </div>

      {/* Bottom Dashboard Panel */}
      <div className="absolute bottom-0 mx-auto w-full sm:w-5/11 bg-slate-950/70 backdrop-blur-md z-1000 p-6 justify-center rounded-t-2xl shadow-lg transition-transform duration-300 flex flex-col items-center space-y-10">
        {/* Address Fields */}
        <div className="space-y-2 w-8/9 flex flex-col">
          <label className="text-slate-200 lg:text-base md:text-sm text-xs">
            Pickup Address:
          </label>
          <input
            type="text"
            value={pickupAddress}
            onChange={(e) => {
              setPickupAddress(e.target.value);
            }}
            className="flex-1 bg-slate-800 outline-none pt-3 text-slate-100 placeholder-slate-500 tracking-widest caret-blue-400 w-full text-xs sm:text-sm md:text-base rounded-xl border-2 px-3 py-2 md:px-4 md:py-2 lg:px-5 lg:py-2 border-slate-500"
            placeholder="Enter Pickup Address"
          />
          <label className="text-slate-200 lg:text-base md:text-sm text-xs">
            Hospital Address:
          </label>
          <input
            type="text"
            value={dropAddress}
            onChange={(e) => {
              setDropAddress(e.target.value);
            }}
            className="flex-1 bg-slate-800 outline-none pt-3 text-slate-100 placeholder-slate-500 tracking-widest caret-blue-400 w-full text-xs sm:text-sm md:text-base rounded-xl border-2 px-3 py-2 md:px-4 md:py-2 lg:px-5 lg:py-2 border-slate-500"
            placeholder="Search for hospitals?"
          />
        </div>

        <div className="w-8/9 ">
          <Tabs defaultValue="basic ambulance" className="w-full ">
            <label className="text-slate-200 lg:text-base md:text-sm text-xs mb-3 lg:mb-5">
              Quick Ambulance:
            </label>
            <TabsList
              variant="line"
              className="flex justify-between items-center w-full gap-6 px-2"
            >
              {/* Basic */}

              <TabsTrigger
                value="basic ambulance"
                className="flex flex-col items-center h-auto mb-2.5 justify-center w-full"
              >
                <img src={blsambulance} alt="Basic" className="w-9 lg:w-14" />
                <p className="text-xs md:text-sm font-medium text-center">
                  Basic
                </p>
              </TabsTrigger>

              {/* Advanced */}
              <TabsTrigger
                value="advanced ambulance"
                className="flex flex-col items-center h-auto mb-3 justify-center w-full"
              >
                <img
                  src={alsambulance}
                  alt="Advanced"
                  className="w-8.5 lg:w-14 "
                />
                <p className="text-xs md:text-sm font-medium text-center">
                  Advanced
                </p>
              </TabsTrigger>

              {/* Mortuary */}
              <TabsTrigger
                value="mortuary ambulance"
                className="flex flex-col items-center h-auto -ml-2 sm:ml-0 mb-2.5 justify-center w-full"
              >
                <img
                  src={mortambulance}
                  alt="Mortuary"
                  className="w-9 lg:w-14 "
                />
                <p className="text-xs  md:text-sm font-medium text-center">
                  Mortuary
                </p>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="w-8/9 flex justify-center items-center">
          <Button
            variant="default"
            className={`flex justify-center items-center w-3/4 lg:h-12 h-10 lg:w-1/2`}
          >
            Confirm Booking
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserBookingPage;
