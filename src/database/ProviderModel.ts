import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPayment extends Document {
  bookingId: Types.ObjectId;
  amount: number;
  paymentStatus: "pending" | "completed" | "failed";
  paymentMethod: "net-banking" | "upi" | "credit-card" | "debit-card";
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    amount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["net-banking", "upi", "credit-card", "debit-card"],
      required: true,
    },
    transactionId: { type: String },
  },
  { timestamps: true }
);

const Payment =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", paymentSchema);

export default Payment;