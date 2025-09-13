import mongoose, { Document, Schema, Types } from "mongoose";

export interface IRefund extends Document {
  bookingId: Types.ObjectId;
  paymentId_razorpay: string;
  userId: Types.ObjectId;
  refundAmount: number;
  status: "pending" | "processed" | "failed";
  refundId_razorpay: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const refundSchema = new Schema<IRefund>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    paymentId_razorpay: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    refundAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending",
    },
    refundId_razorpay: { type: String, required: true },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

refundSchema.index({ bookingId: 1 });
refundSchema.index({ userId: 1 });

const Refund = mongoose.models.Refund || mongoose.model<IRefund>("Refund", refundSchema);

export default Refund;

