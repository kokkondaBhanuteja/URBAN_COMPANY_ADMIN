import mongoose, { Document, Schema, Types } from "mongoose";

// Booking interface
export interface IBooking extends Document {
  consumerId: Types.ObjectId;
  providerId?: Types.ObjectId | null;
  serviceId: Types.ObjectId;
  paymentId?: Types.ObjectId; // Added field to link to the payment

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

  totalPrice: number;
  specialInstructions?: string;

  discountId?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    consumerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    providerId: { type: Schema.Types.ObjectId, ref: "Provider" }, // Nullable
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" }, // Added ref

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

    totalPrice: { type: Number, required: true },
    specialInstructions: { type: String },

    discountId: { type: Schema.Types.ObjectId, ref: "Discount" },
  },
  { timestamps: true }
);

// Indexes for efficient queries
bookingSchema.index({ consumerId: 1 });
bookingSchema.index({ providerId: 1 });

const Booking =mongoose.models.Booking || mongoose.model<IBooking>("Booking", bookingSchema);

export default Booking;
