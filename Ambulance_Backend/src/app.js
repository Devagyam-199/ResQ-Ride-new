import globalError from "./Utils/globalErrorHandler.utils.js";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";

const app = express();
const corsOptions = {
  origin: process.env.FRONTEND_DEPLOYMENT_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

import authRoute from "./Routes/userAuth.routes.js";
app.use("/api/v1/auth", authRoute);

import driverAuthRoute from "./Routes/driverAuth.routes.js";
app.use("/api/v1/driver", driverAuthRoute);

import bookingRoute from "./Routes/booking.routes.js";
app.use("/api/v1/booking", bookingRoute);
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

import placesRouter from "./Routes/places.routes.js";
app.use("/api/v1/places", placesRouter);

/************************** last line of code **************************/

app.use(globalError);
export { app };