import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Map from "@/components/ui/Map.jsx";
import useAuth from "@/context/AuthContext";
import useSocket from "@/hooks/usewebSocketIO.js";
import useGeocoding from "@/hooks/useGeoCoding.js";
import ambulanceimage from "@/assets/ambulance_authpage.png";
import blsambulance from "@/assets/BLS_ambulance.png";
import alsambulance from "@/assets/ALS_ambulance.png";
import mortambulance from "@/assets/MORT_ambulance.png";

const AMBULANCE_TYPES = [
  { value: "Basic",    label: "Basic",    img: blsambulance  },
  { value: "Advanced", label: "Advanced", img: alsambulance  },
  { value: "Mortuary", label: "Mortuary", img: mortambulance },
];

const STATUS_STEPS = ["Confirmed", "En-Route", "Arrived", "Completed"];

const reverseGeocodeClient = async (lat, lng) => {
  try {
    const { data } = await axios.get(
      "https://nominatim.openstreetmap.org/reverse",
      {
        params: { lat, lon: lng, format: "json", addressdetails: 1 },
        headers: { "User-Agent": "ResQRide/1.0 (contact@resqride.in)" },
      },
    );
    if (!data || data.error) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    const a = data.address || {};
    const parts = [
      a.road || a.pedestrian || a.neighbourhood,
      a.suburb || a.village || a.town,
      a.city || a.county,
    ].filter(Boolean);
    return parts.length >= 2
      ? parts.slice(0, 3).join(", ")
      : data.display_name.split(",").slice(0, 3).join(", ");
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
};


const AddressField = ({
  label,
  value,
  onChange,
  onSelect,
  results,
  loading,
  placeholder,
  onDetectLocation,
  detectingLocation,
}) => {
  const [open, setOpen] = useState(false);

  const handleChange = (e) => {
    onChange(e.target.value);
    setOpen(true);
  };

  const handleSelect = (r) => {
    onSelect(r);
    setOpen(false);
  };

  return (
    <div className="relative">
      <label className="text-slate-300 text-xs font-medium mb-1 block">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={handleChange}
          onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5
                     text-slate-100 text-sm placeholder-slate-500 outline-none
                     focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/30 transition-all"
        />
        {onDetectLocation && (
          <button
            type="button"
            onClick={onDetectLocation}
            disabled={detectingLocation}
            title="Use my current location"
            className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
                       text-slate-400 hover:text-[#00B4D8] hover:border-[#0077B6]
                       transition-all disabled:opacity-50 text-sm shrink-0"
          >
            {detectingLocation ? "..." : "GPS"}
          </button>
        )}
      </div>
      {loading && (
        <span className="absolute right-14 top-8 text-xs text-slate-500">
          searching...
        </span>
      )}
      {open && results.length > 0 && (
        <ul
          className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700
                     rounded-lg shadow-xl overflow-hidden"
        >
          {results.map((r, i) => (
            <li
              key={i}
              onClick={() => handleSelect(r)}
              className="px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-800 cursor-pointer
                         border-b border-slate-800 last:border-0 truncate"
            >
              {r.short_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const DriverCard = ({ driver }) => (
  <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex gap-4 items-center">
    {driver.photo ? (
      <img
        src={driver.photo}
        className="w-14 h-14 rounded-full object-cover border-2 border-[#00B4D8]"
        alt="driver"
      />
    ) : (
      <div className="w-14 h-14 rounded-full bg-[#0077B6]/20 flex items-center justify-center text-2xl">
        A
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-slate-100 font-semibold truncate">{driver.name}</p>
      <p className="text-slate-400 text-sm">
        {driver.vehicleType} · {driver.vehicleNumber}
      </p>
      <p className="text-[#00B4D8] text-sm">{driver.phoneNumber}</p>
    </div>
  </div>
);

const StatusBar = ({ status }) => {
  const idx = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center justify-between gap-1">
      {STATUS_STEPS.map((s, i) => {
        const done   = i < idx;
        const active = i === idx;
        return (
          <div key={s} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full h-1.5 rounded-full transition-all duration-500
              ${done ? "bg-[#00B4D8]" : active ? "bg-[#0077B6]" : "bg-slate-700"}`}
            />
            <span
              className={`text-[10px] font-medium
              ${active ? "text-[#00B4D8]" : done ? "text-slate-400" : "text-slate-600"}`}
            >
              {s}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const UserBookingPage = () => {
  const { user, token, loading: authLoading } = useAuth();
  const { socket, connected, emit, on } = useSocket(token);
  const pickupGeo = useGeocoding();
  const dropGeo   = useGeocoding();

  const [pickupText,   setPickupText]   = useState("");
  const [dropText,     setDropText]     = useState("");
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords,   setDropCoords]   = useState(null);
  const [ambulanceType, setAmbulanceType] = useState("Basic");

  const [detectingLocation, setDetectingLocation] = useState(false);

  const [bookingState, setBookingState] = useState("idle");
  const [booking,      setBooking]      = useState(null);
  const [driver,       setDriver]       = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [fare,    setFare]    = useState(null);
  const [error,   setError]   = useState("");
  const [submitting, setSubmitting] = useState(false);

  const detectPickupLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingLocation(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const label = await reverseGeocodeClient(lat, lng);
        setPickupText(label);
        setPickupCoords({ lat, lng });
        pickupGeo.clear();
        setDetectingLocation(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError(
          err.code === 1
            ? "Location permission denied. Please allow access and try again."
            : "Could not determine your location. Please type it manually.",
        );
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [pickupGeo]);

  useEffect(() => {
    if (!socket) return;

    const offConfirmed = on("booking_confirmed", ({ bookingId, driver: d }) => {
      setDriver(d);
      setDriverLocation({ lat: d.lat, lng: d.lng });
      setBookingState("confirmed");
    });

    const offLocation = on("driver_location", ({ lat, lng }) => {
      setDriverLocation({ lat, lng });
    });

    const offStatus = on("booking_status_update", ({ status }) => {
      if (status === "En-Route")  setBookingState("en_route");
      if (status === "Arrived")   setBookingState("arrived");
      if (status === "Completed") setBookingState("completed");
    });

    const offCancelled = on("booking_cancelled", () => {
      setBookingState("cancelled");
      setError("Driver cancelled the booking. Please try again.");
    });

    return () => {
      offConfirmed();
      offLocation();
      offStatus();
      offCancelled();
    };
  }, [socket, on]);

  useEffect(() => {
    if (bookingState !== "pending") return;
    const t = setTimeout(() => {
      setBookingState("cancelled");
      setError("No driver accepted your booking. Please try again.");
    }, 120_000);
    return () => clearTimeout(t);
  }, [bookingState]);

  const handleConfirm = async () => {
    if (!pickupCoords || !dropCoords) {
      setError("Select pickup and drop locations from the suggestions.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/booking`,
        {
          pickupLat:   pickupCoords.lat,
          pickupLng:   pickupCoords.lng,
          dropLat:     dropCoords.lat,
          dropLng:     dropCoords.lng,
          bookingType: ambulanceType,
        },
      );

      setBooking(data.data);
      setFare(data.data.fare);
      setBookingState("pending");

      if (data.data.nearbyDriversCount === 0) {
        setBookingState("cancelled");
        setError(
          "No drivers available nearby right now. Please try again in a few minutes.",
        );
      }
    } catch (err) {
      setError(err.response?.data?.error ?? "Failed to create booking. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = useCallback(() => {
    if (booking?.bookingId) {
      // BUG FIX: was emitting "cancel_booking" — backend listens for "booking_cancellation"
      emit("booking_cancellation", { bookingId: booking.bookingId });
    }
    setBookingState("cancelled");
  }, [booking, emit]);

  const handleReset = () => {
    setBookingState("idle");
    setBooking(null);
    setDriver(null);
    setDriverLocation(null);
    setFare(null);
    setPickupText("");
    setDropText("");
    setPickupCoords(null);
    setDropCoords(null);
    setError("");
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
        Restoring session...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
        Session expired. Please log in again.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Map
          pickupLocation={pickupCoords}
          dropLocation={dropCoords}
          driverLocation={driverLocation}
        />
      </div>

      <div
        className="relative z-10 w-full bg-slate-950/75 backdrop-blur-md
                   flex justify-between items-center px-6 py-3 shadow-lg"
      >
        <div className="flex items-center gap-3">
          <img
            src={ambulanceimage}
            className="w-9 h-9 rounded-full object-cover"
            alt="ResQRide"
          />
          <p className="text-white font-medium hidden sm:block">
            {user?.displayName || user?.userName}
          </p>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium
            ${connected ? "bg-emerald-900/60 text-emerald-400" : "bg-slate-700 text-slate-400"}`}
          >
            {connected ? "live" : "connecting..."}
          </span>
        </div>
        <Button
          variant="default"
          className="lg:h-10 h-9 bg-red-600 hover:bg-red-700 px-5"
        >
          Emergency SOS
        </Button>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 z-10
                   max-w-lg mx-auto w-full bg-slate-950/80 backdrop-blur-md
                   rounded-t-2xl shadow-2xl px-5 pb-6 pt-4"
      >
        {bookingState === "idle" && (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm font-semibold">Book an Ambulance</p>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <AddressField
              label="Pickup location"
              value={pickupText}
              onChange={(v) => {
                setPickupText(v);
                setPickupCoords(null);
                pickupGeo.search(v);
              }}
              onSelect={(r) => {
                setPickupText(r.short_name);
                setPickupCoords({ lat: r.lat, lng: r.lng });
                pickupGeo.clear();
              }}
              results={pickupGeo.results}
              loading={pickupGeo.loading}
              placeholder="Search or use GPS..."
              onDetectLocation={detectPickupLocation}
              detectingLocation={detectingLocation}
            />

            <AddressField
              label="Drop / hospital"
              value={dropText}
              onChange={(v) => {
                setDropText(v);
                setDropCoords(null);
                dropGeo.search(v);
              }}
              onSelect={(r) => {
                setDropText(r.short_name);
                setDropCoords({ lat: r.lat, lng: r.lng });
                dropGeo.clear();
              }}
              results={dropGeo.results}
              loading={dropGeo.loading}
              placeholder="Search hospital or address..."
            />

            <Tabs value={ambulanceType} onValueChange={setAmbulanceType} className="w-full">
              <TabsList variant="line" className="flex justify-between w-full gap-4 px-1">
                {AMBULANCE_TYPES.map(({ value, label, img }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="flex flex-col items-center h-auto py-1 w-full"
                  >
                    <img src={img} alt={label} className="w-9 lg:w-12" />
                    <span className="text-xs font-medium mt-0.5">{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Button
              onClick={handleConfirm}
              disabled={submitting || !pickupCoords || !dropCoords}
              className="w-full h-11 bg-[#0077B6] hover:bg-[#00B4D8] text-slate-100"
            >
              {submitting ? "Requesting..." : "Confirm Booking"}
            </Button>
          </div>
        )}

        {bookingState === "pending" && (
          <div className="space-y-4 text-center py-2">
            <div className="flex justify-center">
              <span
                className="w-10 h-10 border-4 border-[#0077B6] border-t-transparent
                           rounded-full animate-spin"
              />
            </div>
            <p className="text-slate-200 font-semibold">Finding nearby drivers...</p>
            {fare && (
              <p className="text-slate-400 text-sm">
                Estimated fare:{" "}
                <span className="text-[#00B4D8] font-bold">Rs. {fare}</span>
                &nbsp;·&nbsp;{ambulanceType} ambulance
              </p>
            )}
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="w-full border border-slate-700 text-slate-400 hover:text-red-400"
            >
              Cancel
            </Button>
          </div>
        )}

        {["confirmed", "en_route", "arrived"].includes(bookingState) && driver && (
          <div className="space-y-4">
            <StatusBar
              status={
                bookingState === "confirmed"
                  ? "Confirmed"
                  : bookingState === "en_route"
                    ? "En-Route"
                    : "Arrived"
              }
            />

            <DriverCard driver={driver} />

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={bookingState === "arrived"}
                className="flex-1 border border-slate-700 text-slate-400 hover:text-red-400 text-sm h-9"
              >
                Cancel ride
              </Button>
              <a
                href={`tel:${driver.phoneNumber}`}
                className="flex-1 flex items-center justify-center gap-1.5
                           bg-emerald-800/40 hover:bg-emerald-700/40 border border-emerald-700
                           text-emerald-400 rounded-md text-sm h-9 transition-colors"
              >
                Call driver
              </a>
            </div>
          </div>
        )}

        {bookingState === "completed" && (
          <div className="space-y-4 text-center py-2">
            <div
              className="w-14 h-14 rounded-full bg-emerald-900/40 border-2 border-emerald-500
                         flex items-center justify-center text-2xl mx-auto"
            >
              OK
            </div>
            <p className="text-slate-100 font-semibold text-base">Ride completed</p>
            {fare && (
              <p className="text-slate-400 text-sm">
                Total fare:{" "}
                <span className="text-[#00B4D8] font-bold text-base">Rs. {fare}</span>
              </p>
            )}
            <Button
              onClick={handleReset}
              className="w-full h-11 bg-[#0077B6] hover:bg-[#00B4D8] text-slate-100"
            >
              Book another
            </Button>
          </div>
        )}

        {bookingState === "cancelled" && (
          <div className="space-y-4 text-center py-2">
            <p className="text-red-400 font-semibold">Booking cancelled</p>
            {error && <p className="text-slate-400 text-sm">{error}</p>}
            <Button
              onClick={handleReset}
              className="w-full h-11 bg-[#0077B6] hover:bg-[#00B4D8] text-slate-100"
            >
              Try again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserBookingPage;