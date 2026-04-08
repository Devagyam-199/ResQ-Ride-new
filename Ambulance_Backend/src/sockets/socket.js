import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Driver from "../Models/Driver.models.js";
import Booking from "../Models/Booking.models.js";

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_DEPLOYMENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token provided"));
    try {
      socket.user = jwt.verify(token, process.env.Access_Token_Secret);
      next();
    } catch (error) {
      next(new Error("Invalid Token"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, role } = socket.user;
    socket.join(String(userId));
    console.log(`[socket] ${role} ${userId} connected`);

    // FIX: was destructuring { lat, long } — frontend emits { lat, lng }
    socket.on("driver_online", async ({ lat, lng }) => {
      try {
        await Driver.findByIdAndUpdate(userId, {
          isAvailable: true,
          isOnline: true,
          location: {
            type: "Point",
            coordinates: [lng, lat], // MongoDB: [longitude, latitude]
          },
        });
        socket.join("driver_pool");
        console.log(`[socket] driver ${userId} went online at [${lat},${lng}]`);
      } catch (error) {
        console.error(`[socket] driver_online error: ${error.message}`);
      }
    });

    socket.on("driver_offline", async () => {
      try {
        await Driver.findByIdAndUpdate(userId, {
          isAvailable: false,
          isOnline: false,
        });
        socket.leave("driver_pool");
      } catch (err) {
        console.error(`[socket] driver_offline error: ${err.message}`);
      }
    });

    // FIX: was destructuring { lat, long, bookingId } — frontend emits { lat, lng, bookingId }
    socket.on("location_update", async ({ lat, lng, bookingId }) => {
      try {
        await Driver.findByIdAndUpdate(userId, {
          location: {
            type: "Point",
            coordinates: [lng, lat],
          },
        });
        if (bookingId) {
          const booking = await Booking.findById(bookingId).select("user");
          if (booking) {
            // FIX: was emitting { lat, long } — frontend reads { lat, lng }
            io.to(String(booking.user)).emit("driver_location", {
              lat,
              lng,
              bookingId,
            });
          }
        }
      } catch (err) {
        console.error(`[socket] location_update error: ${err.message}`);
      }
    });

    socket.on("accept_booking", async ({ bookingId }) => {
      try {
        const booking = await Booking.findById(bookingId);
        if (!booking || booking.status !== "Pending") return;

        booking.driver = userId;
        booking.status = "Confirmed";
        await booking.save();

        await Driver.findByIdAndUpdate(userId, {
          isAvailable: false,
          currentBooking: bookingId,
        });

        const driver = await Driver.findById(userId).select(
          "name phoneNumber vehicleNumber vehicleType driverPhoto location",
        );

        // FIX: was emitting { lat, long } — frontend reads { lat, lng }
        io.to(String(booking.user)).emit("booking_confirmed", {
          bookingId,
          driver: {
            id: String(userId),
            name: driver.name,
            phoneNumber: driver.phoneNumber,
            vehicleNumber: driver.vehicleNumber,
            vehicleType: driver.vehicleType,
            photo: driver.driverPhoto?.secure_url ?? null,
            lat: driver.location.coordinates[1],
            lng: driver.location.coordinates[0], // FIX: was "long"
          },
        });

        socket.broadcast.emit("booking_taken", { bookingId });
        console.log(`[socket] driver ${userId} accepted booking ${bookingId}`);
      } catch (err) {
        console.error("[socket] accept_booking:", err.message);
      }
    });

    socket.on("reject_booking", ({ bookingId }) => {
      console.log(`[socket] driver rejected booking: ${bookingId}`);
    });

    socket.on("booking_status_update", async ({ bookingId, status }) => {
      const allowed = ["En-Route", "Arrived", "Completed"];
      if (!allowed.includes(status)) return;

      try {
        const booking = await Booking.findByIdAndUpdate(
          bookingId,
          { status },
          { new: true },
        ).select("user driver");

        if (!booking) return;

        if (status === "Completed") {
          await Driver.findByIdAndUpdate(userId, {
            isAvailable: true,
            currentBooking: null,
          });
        }

        io.to(String(booking.user)).emit("booking_status_update", {
          bookingId,
          status,
        });
        console.log(`[socket] booking ${bookingId} -> ${status}`);
      } catch (error) {
        console.error("[socket] booking_status_update:", error.message);
      }
    });

    socket.on("booking_cancellation", async ({ bookingId }) => {
      try {
        const booking = await Booking.findById(bookingId);
        if (!booking || ["Completed", "Cancelled"].includes(booking.status)) return;

        booking.status = "Cancelled";
        booking.cancelledBy = "User";
        await booking.save();

        if (booking.driver) {
          await Driver.findByIdAndUpdate(booking.driver, {
            isAvailable: true,
            currentBooking: null,
          });
          io.to(String(booking.driver)).emit("booking_cancelled", { bookingId });
        }
        console.log(`[socket] user cancelled booking ${bookingId}`);
      } catch (err) {
        console.error("[socket] booking_cancellation:", err.message);
      }
    });

    socket.on("disconnect", async () => {
      if (role === "Driver") {
        try {
          const driver = await Driver.findById(userId).select("currentBooking");
          if (driver?.currentBooking) {
            const booking = await Booking.findById(driver.currentBooking);
            if (booking && !["Completed", "Cancelled"].includes(booking.status)) {
              booking.status = "Cancelled";
              booking.cancelledBy = "Driver";
              booking.cancelReason = "Driver disconnected unexpectedly";
              await booking.save();

              io.to(String(booking.user)).emit("booking_cancelled", {
                bookingId: String(booking._id),
                reason: "Driver disconnected. Please rebook.",
              });
              console.log(`[socket] auto-cancelled booking ${booking._id} on driver disconnect`);
            }
          }

          await Driver.findByIdAndUpdate(userId, {
            isOnline: false,
            isAvailable: true,
            currentBooking: null,
          });
        } catch (err) {
          console.error(`[socket] disconnect cleanup error: ${err.message}`);
        }
      }
      console.log(`[socket] ${role} ${userId} disconnected`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialised — call initSocket first");
  return io;
};

export { initSocket, getIO };