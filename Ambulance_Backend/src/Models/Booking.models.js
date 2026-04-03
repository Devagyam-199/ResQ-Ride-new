import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true },
    address: { type: String },
  },
  { _id: false },
);

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    pickupLocation: {
      type: locationSchema,
      required: true,
    },
    dropLocation: {
      type: locationSchema,
      required: true,
    },
    bookingType: {
      type: String,
      enum: ["Basic", "Advanced", "Mortuary"],
      default: "Basic",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Cash", "UPI"],
      default: "Pending",
    },
    fare: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "En-Route",
        "Arrived",
        "Completed",
        "Cancelled",
      ],
      required: true,
      default: "Pending",
    },
    cancelledBy: {
      type: String,
      enum: ["Driver", "User", "System"],
      default: null,
    },
    cancelReason: { type: String },
  },
  { timestamps: true },
);
bookingSchema.index({ pickupLocation: "2dsphere" });
const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
