import mongoose, { type Document, Schema, type Types } from "mongoose"

export interface IConsumer extends Document {
  userId: Types.ObjectId // Ref to User
  address?: {
    addressLine1: string
    city: string
    pincode: string
    state: string
    country: string
    addressType: "home" | "work" | "other"
  }
  preferredCategories: Types.ObjectId[] // Ref to ServiceCategory
  totalBookings: number
  averageRating: number // Rating given by providers
  isActive: boolean
  joinedDate: Date
  lastActiveAt: Date
  createdAt: Date
  updatedAt: Date
}

const consumerSchema = new Schema<IConsumer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    address: {
      addressLine1: { type: String },
      city: { type: String },
      pincode: { type: String },
      state: { type: String },
      country: { type: String, default: "India" },
      addressType: {
        type: String,
        enum: ["home", "work", "other"],
        default: "home",
      },
    },
    preferredCategories: [{ type: Schema.Types.ObjectId, ref: "ServiceCategory" }],
    totalBookings: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    joinedDate: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

const Consumer = mongoose.models.Consumer || mongoose.model<IConsumer>("Consumer", consumerSchema)

export default Consumer
