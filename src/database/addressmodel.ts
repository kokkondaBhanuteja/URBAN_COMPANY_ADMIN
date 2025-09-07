import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAddress extends Document {
  userId: Types.ObjectId; // Ref to User
  addressLine1: string;
  addressLine2?: string;
  city: string;
  pincode: string;
  state: string;
  country: string;
  addressType: "home" | "work" | "other";
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    addressType: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home",
    },
  },
  { timestamps: true }
);

// Index to quickly find all addresses of a user
addressSchema.index({ userId: 1 });

const Address = mongoose.models.Address || mongoose.model<IAddress>("Address", addressSchema);

export default Address;
