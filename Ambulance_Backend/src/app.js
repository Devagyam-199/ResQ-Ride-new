import globalError from "./Utils/globalErrorHandler.utils.js";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";

const app = express();
const corsOptions = {
  origin: process.env.FRONTEND_DEPLOYEMENT_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

import authRoute from "./Routes/userAuth.routes.js";
app.use("/api/v1/auth", authRoute);

import driverAuthRoute from "./Routes/driverAuth.routes.js";
app.use("/api/v1/driver", driverAuthRoute);

/************************** last line of code **************************/

app.use(globalError);
export { app };
