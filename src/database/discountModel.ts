import mongoose, { Document, Schema } from "mongoose";

export interface IDiscount extends Document {
  promoCode: string;
  description?: string;
  discountPercentage?: number;
  validFrom?: Date;
  validUntil?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const discountSchema = new Schema<IDiscount>(
  {
    promoCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    description: { type: String },
    discountPercentage: { type: Number, min: 0, max: 100 },
    validFrom: { type: Date },
    validUntil: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Discount = mongoose.models.Discount || mongoose.model<IDiscount>("Discount", discountSchema);

export default Discount;
