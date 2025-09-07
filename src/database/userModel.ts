import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  userName: string;
  email: string;
  mobileNumber: string;
  password?: string; // Make password optional for Google OAuth users
  userType: "consumer" | "provider" | "admin";
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    userName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobileNumber: { type: String, required: true, unique: true },
    password: { type: String },
    userType: {
      type: String,
      enum: ["consumer", "provider", "admin"],
      default: "consumer", // Set a default user type
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error:any) {
    next(error);
  }
});

userSchema.methods.comparePassword = function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
