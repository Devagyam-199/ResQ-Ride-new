import React from "react";
import Map from "@/components/ui/Map.jsx";
import { Button } from "@/components/ui/button";
import ambulanceimage from "@/assets/ambulance_authpage.png";

const UserBookingPage = () => {
  return (
    <div className="flex flex-col justify-center items-center">
      <div className="relative">
        <Map />
      </div>
      <div
        className="absolute top-0 mx-auto w-full bg-slate-950/70 backdrop-blur-md flex justify-between items-center z-1000 px-10 py-3 shadow-lg 
transition-transform duration-300"
      >
        <div className="flex justify-start space-x-4 items-center w-5/6">
          <img
            src={ambulanceimage}
            className="rounded-full w-10 h-10 bg-white"
            alt=""
          />
          <p>Hello username{"<"}- replace this username with actual one </p>
        </div>
        <div>
          <Button variant="default" className={"h-12 px-5"}>
            Emergency SOS
          </Button>
        </div>
      </div>
      <div
        className="absolute h-1/3 bottom-0 mx-auto w-full sm:w-4/5
bg-white z-1000 p-4 rounded-t-2xl shadow-lg 
transition-transform duration-300"
      >
        hello everyone this is the dashboard
      </div>
    </div>
  );
};

export default UserBookingPage;
