import Booking from "../Models/Booking.models.js";
import Driver from "../Models/Driver.models.js";
import User from "../Models/Users.models.js";
import {
  haverSineCalculator,
  fareCalculator
} from "../Utils/fareCalculator.utils.js";
import { reverseGeocode } from "../services/geocoding.services.js";
import { getIO } from "../socket/socket.js";

const createBooking = async (req, res) => {
  try {
    const {
      pickupLat,
      pickupLng,
      dropLat,
      dropLng,
      bookingType = "Basic",
    } = req.body;

    if (!pickupLat || !pickupLng || !dropLat || !dropLng) {
      return res
        .status(400)
        .json({ success: false, error: "All four coordinates are required" });
    }

    const pLat = parseFloat(pickupLat),
      pLng = parseFloat(pickupLng);
    const dLat = parseFloat(dropLat),
      dLng = parseFloat(dropLng);

    const [pickupAddress, dropAddress] = await Promise.all([
      reverseGeocode(pLat, pLng),
      reverseGeocode(dLat, dLng),
    ]);

    const distanceKm = haverSineCalculator(pLat, pLng, dLat, dLng);
    const fare = fareCalculator(distanceKm, bookingType);

    const booking = await Booking.create({
      user: req.user.userId,
      pickupLocation: {
        type: "Point",
        coordinates: [pLng, pLat],
        address: pickupAddress,
      },
      dropLocation: {
        type: "Point",
        coordinates: [dLng, dLat],
        address: dropAddress,
      },
      bookingType,
      fare,
      status: "Pending",
    });

    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { bookingCount: 1 },
    });

    const nearbyDrivers = await Driver.find({
      isOnline: true,
      isAvailable: true,
      accStatus: "Approved",
      location: {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [pLng, pLat] },
          $maxDistance: 10_000,
        },
      },
    })
      .select("_id")
      .limit(10);

    const io = getIO();
    for (const driver of nearbyDrivers) {
      io.to(String(driver._id)).emit("new_booking_request", {
        bookingId: String(booking._id),
        pickup: { lat: pLat, lng: pLng, address: pickupAddress },
        drop: { lat: dLat, lng: dLng, address: dropAddress },
        bookingType,
        fare,
        distanceKm: Math.round(distanceKm * 10) / 10,
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        bookingId: String(booking._id),
        fare,
        distanceKm: Math.round(distanceKm * 10) / 10,
        status: booking.status,
        nearbyDriversCount: nearbyDrivers.length,
        pickupAddress,
        dropAddress,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate(
        "driver",
        "name phoneNumber vehicleNumber vehicleType driverPhoto location",
      )
      .populate("user", "userName phoneNumber");

    if (!booking)
      return res
        .status(404)
        .json({ success: false, error: "Booking not found" });

    const isOwner = String(booking.user._id) === req.user.userId;
    const isDriver =
      booking.driver && String(booking.driver._id) === req.user.userId;
    const isAdmin = req.user.role === "Admin";

    if (!isOwner && !isDriver && !isAdmin) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    return res.status(200).json({ success: true, data: booking });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking)
      return res
        .status(404)
        .json({ success: false, error: "Booking not found" });

    if (["Completed", "Cancelled"].includes(booking.status)) {
      return res
        .status(400)
        .json({
          success: false,
          error: `Cannot cancel a ${booking.status} booking`,
        });
    }

    booking.status = "Cancelled";
    booking.cancelledBy = req.user.role === "Driver" ? "Driver" : "User";
    booking.cancelReason = req.body.reason ?? "";
    await booking.save();

    if (booking.driver) {
      await Driver.findByIdAndUpdate(booking.driver, {
        isAvailable: true,
        currentBooking: null,
      });
      getIO()
        .to(String(booking.driver))
        .emit("booking_cancelled", { bookingId: String(booking._id) });
    }

    return res
      .status(200)
      .json({ success: true, data: { status: booking.status } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const getBookingHistory = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.userId })
      .populate("driver", "name vehicleNumber vehicleType")
      .sort({ createdAt: -1 })
      .limit(20);
    return res.status(200).json({ success: true, data: bookings });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export { createBooking, getBooking, cancelBooking, getBookingHistory };
