import mongoose, { Document, Schema, Types } from "mongoose";

export interface IProviderPayout extends Document {
  providerId: Types.ObjectId;     
  bookingId: Types.ObjectId;      
  totalAmount: number;            
  commissionAmount: number;       
  netPayout: number;              
  status: "pending" | "processed" | "failed";
  paymentMethod: "net-banking" | "upi" | "credit-card" | "debit-card";
  processedAt?: Date;
  requestedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const providerPayoutSchema = new Schema<IProviderPayout>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: "Provider", required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    totalAmount: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    netPayout: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["net-banking", "upi", "credit-card", "debit-card"],
      default: "upi",
    },
    processedAt: { type: Date },
    requestedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes for faster queries
providerPayoutSchema.index({ providerId: 1 });
providerPayoutSchema.index({ bookingId: 1 });
providerPayoutSchema.index({ status: 1 });

const ProviderPayout =
  mongoose.models.ProviderPayout ||
  mongoose.model<IProviderPayout>("ProviderPayout", providerPayoutSchema);

export default ProviderPayout;
