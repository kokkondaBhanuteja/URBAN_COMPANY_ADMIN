import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAvailability {
  startTime: Date;
  endTime: Date;
  isUnavailable: boolean;
}

export interface IProvider extends Document {
  userId: Types.ObjectId; // Ref to User
  bio?: string;
  averageRating?: number;
  isVerified: boolean;
  isActive: boolean;
  onboardingDate: Date;
  servicesOffered: Types.ObjectId[]; // Ref to Service
  serviceableLocations:  string[]; // e.g., city names or zip codes 
  availability: IAvailability[];
  createdAt: Date;
  updatedAt: Date;
}

const availabilitySchema = new Schema<IAvailability>(
  {
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    isUnavailable: { type: Boolean, default: false },
  },
  { _id: false }
);

const providerSchema = new Schema<IProvider>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    bio: { type: String },
    averageRating: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    onboardingDate: { type: Date, default: Date.now },

    servicesOffered: [{ type: Schema.Types.ObjectId, ref: "Service" }],
    serviceableLocations: [{ type: String }], // e.g., city names or zip codes

    availability: [availabilitySchema], // Array of availability slots
  },
  { timestamps: true }
);

const Provider = mongoose.models.Provider || mongoose.model<IProvider>("Provider", providerSchema);

export default Provider;
