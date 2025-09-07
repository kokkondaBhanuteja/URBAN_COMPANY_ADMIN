import mongoose, { Document, Schema } from "mongoose";

export interface IServiceCategory extends Document {
  categoryName: string;
  description?: string;
  iconUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceCategorySchema = new Schema<IServiceCategory>(
  {
    categoryName: { type: String, required: true, unique: true },
    description: { type: String },
    iconUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ServiceCategory = mongoose.models.ServiceCategory || mongoose.model<IServiceCategory>(
  "ServiceCategory",
  serviceCategorySchema
);

export default ServiceCategory;
