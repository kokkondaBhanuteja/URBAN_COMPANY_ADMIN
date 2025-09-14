import mongoose, { Document, Schema, Types } from "mongoose";

export interface ILedgerTransaction extends Document {
  transactionDate: Date;
  type: "commission" | "payout" | "refund" | "revenue" | "withdrawal";
  description: string;
  debit: number; // Money going out of the platform
  credit: number; // Money coming into the platform
  platformBalance: number; // Running balance after this transaction
  relatedBookingId?: Types.ObjectId;
  relatedUserId?: Types.ObjectId; // Can be provider or consumer
  createdAt: Date;
  updatedAt: Date;
}

const ledgerTransactionSchema = new Schema<ILedgerTransaction>(
  {
    transactionDate: { type: Date, default: Date.now, required: true },
    type: {
      type: String,
      enum: ["commission", "payout", "refund", "revenue", "withdrawal"],
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    platformBalance: { type: Number, required: true },
    relatedBookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    relatedUserId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const LedgerTransaction =
  mongoose.models.LedgerTransaction ||
  mongoose.model<ILedgerTransaction>("LedgerTransaction", ledgerTransactionSchema);

export default LedgerTransaction;