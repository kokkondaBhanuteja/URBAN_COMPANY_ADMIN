import mongoose, { Document, Schema } from "mongoose";

export interface ILocation extends Document {
  cityName: string;
  state: string;
  country: string;
  isServiceable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<ILocation>(
  {
    cityName: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    isServiceable: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Prevent duplicate city+state+country combinations
locationSchema.index({ cityName: 1, state: 1, country: 1 }, { unique: true });

const Location = mongoose.models.Location || mongoose.model<ILocation>("Location", locationSchema);

export default Location;
