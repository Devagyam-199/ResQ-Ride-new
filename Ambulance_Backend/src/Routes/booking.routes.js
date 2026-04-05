import {Router} from "express"
import {createBooking, getBooking, cancelBooking, getBookingHistory} from "../Controllers/booking.controllers.js"
import jwtVerify   from "../Middlewares/jwtVerifier.middlewares.js";
import requireRole from "../Middlewares/roleGuard.middlewares.js";

const bookingRoute = Router();

bookingRoute.use(jwtVerify);

bookingRoute.post("/", requireRole("User"), createBooking);
bookingRoute.get("/history", requireRole("User"), getBookingHistory);
bookingRoute.get("/:id", getBooking);
bookingRoute.patch("/:id/cancel", cancelBooking);

export default bookingRoute;