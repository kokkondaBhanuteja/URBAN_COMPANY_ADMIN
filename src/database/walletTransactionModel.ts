import mongoose, { Document, Schema, Types } from "mongoose";

export interface IWalletTransaction extends Document {
  // Core Fields
  walletId: Types.ObjectId; // The wallet this transaction belongs to.
  amount: number; // The value of the transaction.
  type: "credit" | "debit"; // Was money added or removed?

  // Auditing & History Fields
  balanceBefore: number; // The wallet balance *before* this transaction.
  balanceAfter: number; // The wallet balance *after* this transaction.
  
  // Descriptive Fields
  reason: 
    | "wallet_topup" 
    | "booking_payment" 
    | "booking_refund"
    | "booking_earning"
    | "payout_processed"
    | "commission_fee"
    | "platform_adjustment";
  description: string; // A human-readable summary, e.g., "Payment for Cleaning Service".

  // Relational Fields
  relatedBookingId?: Types.ObjectId; // Link to the booking, if applicable.
  relatedUserId?: Types.ObjectId; // Link to the other user in the transaction (e.g., the provider for a consumer's payment).
  externalTransactionId?: string; // For payment gateway IDs (e.g., Razorpay).
  ledgerTransactionId?: Types.ObjectId; // Link to the main platform ledger.

  createdAt: Date;
  updatedAt: Date;
}

const walletTransactionSchema = new Schema<IWalletTransaction>(
  {
    walletId: { type: Schema.Types.ObjectId, ref: "Wallet", required: true, index: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    reason: {
      type: String,
      enum: [
        "wallet_topup",
        "booking_payment",
        "booking_refund",
        "booking_earning",
        "payout_processed",
        "commission_fee",
        "platform_adjustment",
      ],
      required: true,
    },
    description: { type: String, required: true },
    relatedBookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    relatedUserId: { type: Schema.Types.ObjectId, ref: "User" },
    externalTransactionId: { type: String, index: true },
    ledgerTransactionId: { type: Schema.Types.ObjectId, ref: "LedgerTransaction" },
  },
  { timestamps: true }
);

const WalletTransaction =
  mongoose.models.WalletTransaction ||
  mongoose.model<IWalletTransaction>("WalletTransaction", walletTransactionSchema);

export default WalletTransaction;