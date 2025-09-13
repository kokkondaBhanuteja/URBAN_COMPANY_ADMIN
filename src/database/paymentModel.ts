import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPayment extends Document {
  orderId: string;
  bookingIds: Types.ObjectId[]; // <-- ADD THIS
  userId: Types.ObjectId;
  amount: number;
  paymentMethod: string;
  paymentStatus: "pending" | "successful" | "failed";
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    bookingIds: [{ // <-- ADD THIS
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    }],
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "successful", "failed"],
      default: "pending",
      index: true,
    },
    transactionId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

const Payment =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", paymentSchema);
  
export default Payment;