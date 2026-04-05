import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Driver from "../Models/Driver.models.js";
import Booking from "../Models/Booking.models.js";

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_DEPLOYEMENT_URL || "http://localhost:5173",
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

    socket.on("driver_online", async ({ lat, long }) => {
      try {
        await Driver.findByIdAndUpdate(userId, {
          isAvailable: true,
          isOnline: true,
          location: {
            type: "Point",
            coordinates: [long, lat],
          },
        });
        socket.join("driver_pool");
        console.log(
          `[socket] driver ${userId} went online at [${lat},${long}]`,
        );
      } catch (error) {
        console.error(`[socker] driver offline:${error.message}`);
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
        console.error(`[socket] driver online: ${err.message}`);
      }
    });

    socket.on("location_update", async ({ lat, long, bookingId }) => {
      try {
        await Driver.findByIdAndUpdate(userId, {
          location: {
            type: "Point",
            coordinates: [long, lat],
          },
        });
        if (bookingId) {
          const booking = await Booking.findById(bookingId).select("user");
          if (booking) {
            io.to(String(booking.user)).emit("driver_location", {
              lat,
              long,
              bookingId,
            });
          }
        }
      } catch (err) {
        console.error(`driver location couldn't be updated:${err.message}`);
      }
    });

    socket.on("accept_booking", async ({ bookingId }) => {
      try {
        const booking = await Booking.findById(bookingId);
        if (!booking || booking.status === "Pending") return;
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
            long: driver.location.coordinates[0],
          },
        });

        socket.broadcast.emit("booking_taken", { bookingId });
        console.log(`[socket] driver ${userId} accepted booking ${bookingId}`);
      } catch (err) {
        console.error("[socket] accept_booking:", err.message);
      }
    });

    socket.on("reject_booking", ({ bookingId }) => {
      console.log(`[socket] driver reject booking : ${bookingId}`);
    });

    socket.on("booking_status_update", async ({ bookingId, status }) => {
      const allowed = ["En-Route", "Arrived", "Completed"];
      if (!allowed.includes(status)) return;

      try {
        const booking = await Booking.findByIdAndUpdate(
          bookingId,
          {
            status,
          },
          {
            new: true,
          },
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
        console.log(`[socket] booking ${bookingId} → ${status}`);
      } catch (error) {
        console.error("[socket] update_booking_status:", err.message);
      }
    });

    socket.on("booking_cancellation", async ({ bookingId }) => {
      try {
        const booking = await Booking.findById(bookingId);

        if ((!booking, ["Completed", "Cancelled"].includes(booking.status)))
          return;

        ((booking.status = "Cancelled"),
          (booking.cancelledBy = "User"),
          await booking.save());

        if (booking.driver) {
          await Driver.findByIdAndUpdate(booking.driver, {
            isAvailable: true,
            currentBooking: null,
          });
          io.to(String(booking.driver)).emit("booking_cancelled", {
            bookingId,
          });
        }
        console.log(`[socket] user cancelled booking ${bookingId}`);
      } catch (err) {
        console.error("[socket] cancel_booking:", err.message);
      }
    });

    socket.on("disconnect", async () => {
      if (role === "Driver") {
        await Driver.findByIdAndUpdate(userId, { isOnline: false }).catch(
          () => {},
        );
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
