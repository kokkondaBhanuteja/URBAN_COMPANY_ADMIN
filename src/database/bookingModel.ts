import mongoose, { Document, Schema, Types } from "mongoose";

// Booking interface
export interface IBooking extends Document {
  orderId: string; // Add this line
  userId: Types.ObjectId;
  providerId?: Types.ObjectId | null;
  serviceId: Types.ObjectId;
  bookingOtp?: string;
  serviceAddress: {
    addressLine1: string;
    city: string;
    pincode: string;
    state: string;
  };

  bookingStatus:
    | "requested"
    | "confirmed"
    | "assigned"
    | "in_progress"
    | "completed"
    | "cancelled_by_user"
    | "cancelled_by_provider";

  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;

  pricing: {
    basePrice: number;
    finalAmount: number;
  };
  specialInstructions?: string;

  discountId?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    orderId: { type: String, required: true, index: true }, // Add this field
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    providerId: { type: Schema.Types.ObjectId, ref: "Provider" }, // Nullable
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    bookingOtp: { type: String },

    serviceAddress: {
      addressLine1: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
      state: { type: String, required: true },
    },

    bookingStatus: {
      type: String,
      enum: [
        "requested",
        "confirmed",
        "assigned",
        "in_progress",
        "completed",
        "cancelled_by_user",
        "cancelled_by_provider",
      ],
      default: "requested",
      index: true,
    },

    scheduledAt: { type: Date, required: true },
    startedAt: { type: Date },
    completedAt: { type: Date },

    pricing: {
      basePrice: { type: Number, required: true },
      finalAmount: { type: Number, required: true },
    },
    specialInstructions: { type: String },

    discountId: { type: Schema.Types.ObjectId, ref: "Discount" },
  },
  { timestamps: true }
);

// Indexes for efficient queries
bookingSchema.index({ userId: 1 });
bookingSchema.index({ providerId: 1 });

const Booking =mongoose.models.Booking || mongoose.model<IBooking>("Booking", bookingSchema);

export default Booking;