import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useState, useEffect } from "react";

const makeIcon = (color, label = "") =>
  L.divIcon({
    className: "",
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color};border:3px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,.4);
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:700;color:#fff;
    ">${label}</div>`,
    iconSize:   [28, 28],
    iconAnchor: [14, 14],
  });

const USER_ICON   = makeIcon("#0077B6", "U");
const DRIVER_ICON = makeIcon("#e63946",  "D");
const PICKUP_ICON = makeIcon("#2dc653",  "P");
const DROP_ICON   = makeIcon("#f4a261",  "X");

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, map.getZoom(), { duration: 1 }); }, [center]);
  return null;
}

const Map = ({
  userLocation,
  driverLocation = null,
  pickupLocation = null,
  dropLocation   = null,
}) => {
  const [localUser, setLocalUser] = useState(userLocation ?? null);

  useEffect(() => {
    if (userLocation) { setLocalUser(userLocation); return; }
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setLocalUser([p.coords.latitude, p.coords.longitude]),
      (e) => console.warn("Geolocation error:", e),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }, [userLocation]);

  if (!localUser) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900 text-slate-400 text-sm">
        Fetching location…
      </div>
    );
  }

  /* Prefer centering on pickup once set, else user */
  const center = pickupLocation
    ? [pickupLocation.lat, pickupLocation.lng]
    : localUser;

  return (
    <MapContainer
      center={localUser}
      zoom={14}
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <Recenter center={center} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      {localUser && (
        <Marker position={localUser} icon={USER_ICON}>
          <Popup>Your location</Popup>
        </Marker>
      )}

      {pickupLocation && (
        <Marker position={[pickupLocation.lat, pickupLocation.lng]} icon={PICKUP_ICON}>
          <Popup>Pickup</Popup>
        </Marker>
      )}

      {dropLocation && (
        <Marker position={[dropLocation.lat, dropLocation.lng]} icon={DROP_ICON}>
          <Popup>Drop-off</Popup>
        </Marker>
      )}

      {driverLocation && (
        <Marker position={[driverLocation.lat, driverLocation.lng]} icon={DRIVER_ICON}>
          <Popup>Driver</Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default Map;