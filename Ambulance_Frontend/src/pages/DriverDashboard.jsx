import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "@/context/AuthContext";
import useSocket from "@/hooks/usewebSocketIO.js";
import Map from "@/components/ui/Map.jsx";
import ambulanceimage from "@/assets/ambulance_authpage.png";

// ── Constants ──────────────────────────────────────────────────────────────
const STATUS_FLOW = ["Confirmed", "En-Route", "Arrived", "Completed"];

const STATUS_ACTIONS = {
  Confirmed: {
    next: "En-Route",
    label: "Start Driving",
    color: "bg-[#0077B6] hover:bg-[#00B4D8]",
  },
  "En-Route": {
    next: "Arrived",
    label: "Mark as Arrived",
    color: "bg-amber-600 hover:bg-amber-500",
  },
  Arrived: {
    next: "Completed",
    label: "Complete Ride",
    color: "bg-emerald-700 hover:bg-emerald-600",
  },
};

const BOOKING_TYPE_LABELS = {
  Basic: {
    color: "bg-[#0077B6]/20 text-[#00B4D8] border-[#0077B6]/40",
    tag: "BLS",
  },
  Advanced: {
    color: "bg-amber-900/30 text-amber-400 border-amber-700/40",
    tag: "ALS",
  },
  Mortuary: {
    color: "bg-slate-700/50 text-slate-300 border-slate-600/40",
    tag: "MRT",
  },
};

// ── Persistence helpers ────────────────────────────────────────────────────
// We use sessionStorage (tab-scoped) so the driver is restored as online
// after a refresh/bad-connection reload, but not if they open a new tab
// after a deliberate logout.
const ONLINE_KEY = "driver_was_online";

const markOnline  = () => sessionStorage.setItem(ONLINE_KEY, "1");
const markOffline = () => sessionStorage.removeItem(ONLINE_KEY);
const wasOnline   = () => sessionStorage.getItem(ONLINE_KEY) === "1";

// ── Sub-components ─────────────────────────────────────────────────────────

const OnlineToggle = ({ isOnline, onToggle, loading }) => (
  <button
    onClick={onToggle}
    disabled={loading}
    className={`relative flex items-center gap-3 px-4 py-2 rounded-full border font-medium text-sm
      transition-all duration-300 select-none
      ${
        isOnline
          ? "bg-emerald-900/40 border-emerald-600/50 text-emerald-400"
          : "bg-slate-800/60 border-slate-600/50 text-slate-400"
      } disabled:opacity-50`}
  >
    <span
      className={`w-2.5 h-2.5 rounded-full transition-colors
      ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`}
    />
    {loading ? "Updating..." : isOnline ? "Online" : "Go Online"}
  </button>
);

const StatCard = ({ label, value, sub }) => (
  <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 flex flex-col gap-1">
    <span className="text-slate-500 text-xs">{label}</span>
    <span className="text-slate-100 text-lg font-medium">{value}</span>
    {sub && <span className="text-slate-500 text-xs">{sub}</span>}
  </div>
);

const StatusBar = ({ status }) => {
  const idx = STATUS_FLOW.indexOf(status);
  return (
    <div className="flex items-center gap-1">
      {STATUS_FLOW.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={s} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full h-1.5 rounded-full transition-all duration-500
              ${done ? "bg-[#00B4D8]" : active ? "bg-[#0077B6]" : "bg-slate-700"}`}
            />
            <span
              className={`text-[9px] font-medium hidden sm:block
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

// Incoming booking request overlay (times out in 30s)
const BookingRequestModal = ({ request, onAccept, onReject }) => {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (timeLeft <= 0) {
      onReject();
      return;
    }
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, onReject]);

  const pct = (timeLeft / 30) * 100;
  const typeStyle =
    BOOKING_TYPE_LABELS[request.bookingType] ?? BOOKING_TYPE_LABELS.Basic;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "flex-end",
        padding: "1rem",
      }}
    >
      <div
        className="w-full max-w-lg mx-auto bg-slate-900 border border-slate-700 rounded-2xl
                      shadow-2xl overflow-hidden animate-slide-up"
      >
        {/* Timer bar */}
        <div className="h-1.5 bg-slate-700">
          <div
            className="h-full bg-[#0077B6] transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-slate-100 font-semibold text-base">
                New Booking Request
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${typeStyle.color}`}
              >
                {typeStyle.tag}
              </span>
            </div>
            <span className="text-slate-400 text-sm font-mono">
              {timeLeft}s
            </span>
          </div>

          {/* Location rows */}
          <div className="space-y-2.5">
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Pickup</p>
                <p className="text-slate-200 text-sm leading-snug">
                  {request.pickup?.address ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 shrink-0" />
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Drop</p>
                <p className="text-slate-200 text-sm leading-snug">
                  {request.drop?.address ?? "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/60 rounded-lg p-2 text-center">
              <p className="text-slate-500 text-xs">Distance</p>
              <p className="text-slate-200 text-sm font-semibold">
                {request.distanceKm ?? "—"} km
              </p>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-2 text-center">
              <p className="text-slate-500 text-xs">Type</p>
              <p className="text-slate-200 text-sm font-semibold">
                {request.bookingType}
              </p>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-2 text-center">
              <p className="text-slate-500 text-xs">Fare</p>
              <p className="text-[#00B4D8] text-sm font-bold">
                ₹{request.fare}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onReject}
              className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-400
                         hover:text-red-400 hover:border-red-700/50 transition-all text-sm font-medium"
            >
              Decline
            </button>
            <button
              onClick={onAccept}
              className="flex-1 py-3 rounded-xl bg-[#0077B6] hover:bg-[#00B4D8]
                         text-white transition-all text-sm font-semibold"
            >
              Accept Ride
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Active booking panel shown at bottom when a ride is in progress
const ActiveBookingPanel = ({ booking, status, onStatusUpdate, onCancel }) => {
  const action = STATUS_ACTIONS[status];
  const typeStyle =
    BOOKING_TYPE_LABELS[booking?.bookingType] ?? BOOKING_TYPE_LABELS.Basic;

  return (
    <div className="space-y-3">
      {/* Status bar */}
      <StatusBar status={status} />

      {/* User info row */}
      <div
        className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50
                      rounded-xl p-3"
      >
        <div
          className="w-10 h-10 rounded-full bg-[#0077B6]/20 border border-[#0077B6]/30
                        flex items-center justify-center text-lg text-[#00B4D8] font-bold shrink-0"
        >
          U
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-slate-100 text-sm font-medium">Passenger</p>
          <p className="text-slate-400 text-xs truncate">
            Booking #{String(booking?.bookingId ?? "").slice(-8)}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full border font-semibold shrink-0 ${typeStyle.color}`}
        >
          {typeStyle.tag}
        </span>
      </div>

      {/* Address rows */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 space-y-2.5">
        <div className="flex items-start gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
          <div>
            <p className="text-slate-500 text-xs">Pickup</p>
            <p className="text-slate-200 text-xs leading-snug">
              {booking?.pickup?.address ?? "—"}
            </p>
          </div>
        </div>
        <div className="w-full border-t border-slate-700/60" />
        <div className="flex items-start gap-2.5">
          <span className="w-2 h-2 rounded-full bg-orange-400 mt-1 shrink-0" />
          <div>
            <p className="text-slate-500 text-xs">Drop</p>
            <p className="text-slate-200 text-xs leading-snug">
              {booking?.drop?.address ?? "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Fare */}
      <div className="flex items-center justify-between px-1">
        <span className="text-slate-500 text-xs">Estimated fare</span>
        <span className="text-[#00B4D8] text-base font-bold">
          ₹{booking?.fare ?? "—"}
        </span>
      </div>

      {/* Action button */}
      {action && (
        <button
          onClick={() => onStatusUpdate(action.next)}
          className={`w-full py-3 rounded-xl text-white font-semibold text-sm
                      transition-all ${action.color}`}
        >
          {action.label}
        </button>
      )}

      {/* Cancel — only before En-Route starts */}
      {status === "Confirmed" && (
        <button
          onClick={onCancel}
          className="w-full py-2 rounded-xl border border-slate-700 text-slate-400
                     hover:text-red-400 hover:border-red-800/50 transition-all text-sm"
        >
          Cancel booking
        </button>
      )}
    </div>
  );
};

// ── Main Dashboard ─────────────────────────────────────────────────────────
const DriverDashboard = () => {
  const { user, token, logout } = useAuth();
  const { socket, connected, emit, on } = useSocket(token);
  const navigate = useNavigate();

  // Initialise isOnline from sessionStorage so a refresh doesn't drop offline
  const [isOnline, setIsOnline] = useState(() => wasOnline());
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [driverCoords, setDriverCoords] = useState(null);

  // Incoming request
  const [incomingRequest, setIncomingRequest] = useState(null);

  // Active booking
  const [activeBooking, setActiveBooking] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);

  // Session stats (in-memory, resets on refresh intentionally)
  const [stats, setStats] = useState({ trips: 0, earned: 0 });

  // Location watch ref
  const watchRef = useRef(null);
  const locationIntervalRef = useRef(null);

  // ── GPS helpers ──────────────────────────────────────────────────────────
  const startLocationWatch = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setDriverCoords({ lat, lng });
        emit("driver_online", { lat, lng });
      },
      (err) => console.warn("GPS error:", err),
      { enableHighAccuracy: true, timeout: 10_000 },
    );

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setDriverCoords({ lat, lng });
      },
      (err) => console.warn("GPS watch error:", err),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
  }, [emit]);

  const stopLocationWatch = useCallback(() => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    clearInterval(locationIntervalRef.current);
  }, []);

  // ── Restore online state after a page refresh ────────────────────────────
  // When the socket reconnects and the driver was previously online,
  // re-emit driver_online with current GPS position.
  useEffect(() => {
    if (!connected || !isOnline) return;
    // Socket just (re)connected while we're supposed to be online — start GPS
    startLocationWatch();
  }, [connected]); // intentionally only on connected changes

  // ── Send location updates to socket while on active booking ─────────────
  useEffect(() => {
    clearInterval(locationIntervalRef.current);
    if (!activeBooking || !driverCoords) return;
    locationIntervalRef.current = setInterval(() => {
      emit("location_update", {
        lat: driverCoords.lat,
        lng: driverCoords.lng,
        bookingId: activeBooking.bookingId,
      });
    }, 5000);
    return () => clearInterval(locationIntervalRef.current);
  }, [activeBooking, driverCoords, emit]);

  // ── Online toggle ────────────────────────────────────────────────────────
  const handleToggleOnline = useCallback(async () => {
    if (onlineLoading) return;
    setOnlineLoading(true);
    try {
      if (isOnline) {
        stopLocationWatch();
        emit("driver_offline");
        markOffline();
        setIsOnline(false);
        setDriverCoords(null);
      } else {
        startLocationWatch();
        markOnline();
        setIsOnline(true);
      }
    } finally {
      setTimeout(() => setOnlineLoading(false), 800);
    }
  }, [isOnline, onlineLoading, emit, startLocationWatch, stopLocationWatch]);

  // ── Socket event listeners ───────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const offNewBooking = on("new_booking_request", (data) => {
      setIncomingRequest((prev) => (prev ? prev : data));
    });

    const offBookingTaken = on("booking_taken", ({ bookingId }) => {
      setIncomingRequest((prev) =>
        prev?.bookingId === bookingId ? null : prev,
      );
    });

    const offBookingCancelled = on("booking_cancelled", ({ bookingId }) => {
      setActiveBooking((prev) => {
        if (prev?.bookingId === bookingId) {
          setBookingStatus(null);
          return null;
        }
        return prev;
      });
      setIncomingRequest((prev) =>
        prev?.bookingId === bookingId ? null : prev,
      );
    });

    return () => {
      offNewBooking();
      offBookingTaken();
      offBookingCancelled();
    };
  }, [socket, on]);

  // Cleanup GPS on unmount
  useEffect(
    () => () => {
      stopLocationWatch();
    },
    [stopLocationWatch],
  );

  // ── Accept / Reject booking ──────────────────────────────────────────────
  const handleAccept = useCallback(() => {
    if (!incomingRequest) return;
    emit("accept_booking", { bookingId: incomingRequest.bookingId });
    setActiveBooking(incomingRequest);
    setBookingStatus("Confirmed");
    setIncomingRequest(null);
  }, [incomingRequest, emit]);

  const handleReject = useCallback(() => {
    if (!incomingRequest) return;
    emit("reject_booking", { bookingId: incomingRequest.bookingId });
    setIncomingRequest(null);
  }, [incomingRequest, emit]);

  // ── Status update ────────────────────────────────────────────────────────
  const handleStatusUpdate = useCallback(
    (nextStatus) => {
      if (!activeBooking) return;
      emit("booking_status_update", {
        bookingId: activeBooking.bookingId,
        status: nextStatus,
      });
      setBookingStatus(nextStatus);

      if (nextStatus === "Completed") {
        setStats((s) => ({
          trips: s.trips + 1,
          earned: s.earned + (activeBooking.fare ?? 0),
        }));
        setTimeout(() => {
          setActiveBooking(null);
          setBookingStatus(null);
        }, 3000);
      }
    },
    [activeBooking, emit],
  );

  // ── Cancel active booking (driver side) ─────────────────────────────────
  const handleCancelBooking = useCallback(() => {
    if (!activeBooking) return;
    emit("booking_cancellation", { bookingId: activeBooking.bookingId });
    setActiveBooking(null);
    setBookingStatus(null);
  }, [activeBooking, emit]);

  // ── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = () => {
    stopLocationWatch();
    if (isOnline) emit("driver_offline");
    markOffline(); // clear persistence on intentional logout
    logout();
    navigate("/");
  };

  // ── Derived map props ────────────────────────────────────────────────────
  const mapPickup = activeBooking?.pickup
    ? { lat: activeBooking.pickup.lat, lng: activeBooking.pickup.lng }
    : incomingRequest?.pickup
      ? { lat: incomingRequest.pickup.lat, lng: incomingRequest.pickup.lng }
      : null;

  const mapDrop = activeBooking?.drop
    ? { lat: activeBooking.drop.lat, lng: activeBooking.drop.lng }
    : incomingRequest?.drop
      ? { lat: incomingRequest.drop.lat, lng: incomingRequest.drop.lng }
      : null;

  const mapUserLocation = driverCoords
    ? [driverCoords.lat, driverCoords.lng]
    : null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-slate-950">
      {/* ── Map layer ── */}
      <div className="absolute inset-0 z-0">
        <Map
          userLocation={mapUserLocation}
          pickupLocation={mapPickup}
          dropLocation={mapDrop}
        />
      </div>

      {/* ── Top Nav ── */}
      <div
        className="relative z-10 w-full bg-slate-950/80 backdrop-blur-md
                      flex items-center justify-between px-4 py-3 shadow-lg"
      >
        <div className="flex items-center gap-3">
          <img
            src={ambulanceimage}
            className="w-8 h-8 rounded-full object-cover"
            alt="ResQRide"
          />
          <div className="hidden sm:block">
            <p className="text-slate-100 text-sm font-medium leading-tight">
              {user?.name ?? user?.userName ?? "Driver"}
            </p>
            <p className="text-slate-500 text-xs">
              {user?.vehicleNumber ?? ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium
            ${
              connected
                ? "bg-emerald-900/50 text-emerald-400"
                : "bg-slate-800 text-slate-500"
            }`}
          >
            {connected ? "Connected" : "Reconnecting…"}
          </span>
          <OnlineToggle
            isOnline={isOnline}
            onToggle={handleToggleOnline}
            loading={onlineLoading}
          />
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-slate-300 text-xs px-2 py-1
                       border border-slate-700 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* ── Bottom Panel ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 max-w-lg mx-auto w-full
                      bg-slate-950/85 backdrop-blur-md rounded-t-2xl shadow-2xl px-5 pb-6 pt-4"
      >
        {/* Idle — no active booking */}
        {!activeBooking && !incomingRequest && (
          <div className="space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              <StatCard
                label="Today's trips"
                value={stats.trips}
                sub="completed"
              />
              <StatCard
                label="Earnings"
                value={`₹${stats.earned}`}
                sub="this session"
              />
              <StatCard
                label="Status"
                value={isOnline ? "Online" : "Offline"}
                sub={isOnline ? "Waiting for ride" : "Go online to start"}
              />
            </div>

            {isOnline ? (
              <div className="flex flex-col items-center gap-2 py-3">
                <span
                  className="w-8 h-8 border-4 border-[#0077B6] border-t-transparent
                                 rounded-full animate-spin"
                />
                <p className="text-slate-400 text-sm">
                  Waiting for booking requests…
                </p>
                {driverCoords && (
                  <p className="text-slate-600 text-xs">
                    GPS active · {driverCoords.lat.toFixed(4)},{" "}
                    {driverCoords.lng.toFixed(4)}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <p className="text-slate-400 text-sm">
                  Tap{" "}
                  <span className="text-[#00B4D8] font-medium">Go Online</span>{" "}
                  to start receiving bookings
                </p>
                <p className="text-slate-600 text-xs">
                  Your location will be shared with nearby users
                </p>
              </div>
            )}
          </div>
        )}

        {/* Active booking panel */}
        {activeBooking && bookingStatus && (
          <div>
            {bookingStatus === "Completed" ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div
                  className="w-14 h-14 rounded-full bg-emerald-900/40 border-2 border-emerald-500
                                flex items-center justify-center text-2xl"
                >
                  ✓
                </div>
                <p className="text-slate-100 font-semibold">Ride Completed!</p>
                <p className="text-slate-400 text-sm">
                  Fare collected:{" "}
                  <span className="text-[#00B4D8] font-bold">
                    ₹{activeBooking.fare}
                  </span>
                </p>
                <p className="text-slate-500 text-xs">
                  Returning to waiting state…
                </p>
              </div>
            ) : (
              <ActiveBookingPanel
                booking={activeBooking}
                status={bookingStatus}
                onStatusUpdate={handleStatusUpdate}
                onCancel={handleCancelBooking}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Incoming booking modal (overlaid on top) ── */}
      {incomingRequest && !activeBooking && (
        <BookingRequestModal
          request={incomingRequest}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

export default DriverDashboard;