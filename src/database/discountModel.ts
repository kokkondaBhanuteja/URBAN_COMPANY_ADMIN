import mongoose, { Document, Schema, Types } from "mongoose";

// Import the real service and service category models
import { IServiceCategory } from "./serviceCategoryModel";
import { IService } from "./serviceModel";

export interface IDiscount extends Document {
  // A human-readable identifier for the discount
  promoCode: string;
  description?: string;
  // Type of discount (e.g., 'Category Specific', 'Service Specific', 'Global')
  discountType: "Category Specific" | "Service Specific" | "Global";
  // The value of the discount (e.g., 15 for 15% or 250 for ₹250)
  discountValue: number;
  // The type of the discount value ('percentage' or 'flat')
  discountValueType: "percentage" | "flat";
  // The category this discount applies to. Required for 'Category Specific' type.
  category?: Types.ObjectId | IServiceCategory;
  // The service this discount applies to. Required for 'Service Specific' type.
  service?: Types.ObjectId | IService;
  validFrom: Date;
  validUntil: Date;
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
    discountType: {
      type: String,
      enum: ["Category Specific", "Service Specific", "Global"],
      required: true,
      default: "Global",
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    discountValueType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
      default: "percentage",
    },
    // Reference to the ServiceCategory model
    category: {
      type: Schema.Types.ObjectId,
      ref: "ServiceCategory",
      required: false,
    },
    // Reference to the Service model
    service: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: false,
    },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Discount = mongoose.models.Discount || mongoose.model<IDiscount>("Discount", discountSchema);

export default Discount;
