import {
  MapContainer,
  TileLayer,
  useMapEvents,
  Marker,
  Popup,
} from "react-leaflet";
import React from "react";
import { useState, useEffect } from "react";

const Map = () => {
  const [userCords, setUserCords] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        console.log("Accuracy:", position.coords.accuracy);
        setUserCords([lat, lng]);
      },
      (err) => {
        console.log("Error getting location:", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, []);

  if (!userCords) {
    return (
      <div className="h-screen flex items-center justify-center">
        Fetching your location...
      </div>
    );
  }

  return (
    <div className="w-screen h-screen">
      <MapContainer
        center={userCords}
        touchZoom={true}
        zoom={14}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <Marker position={userCords}>
          <Popup>Your location</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default Map;
