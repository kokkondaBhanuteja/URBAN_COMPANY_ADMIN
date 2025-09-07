// src/services/admin/userService.ts
import User, { IUser } from "@/database/userModel";
import { HydratedDocument } from "mongoose";

export const getAllUsers = async (): Promise<HydratedDocument<IUser>[]> => {
  return await User.find({}).lean();
};

export const getUserById = async (id: string): Promise<HydratedDocument<IUser> | null> => {
  return await User.findById(id).lean();
};

export const updateUser = async (id: string, userData: Partial<IUser>): Promise<HydratedDocument<IUser> | null> => {
  return await User.findByIdAndUpdate(id, userData, { new: true }).lean();
};

export const deleteUser = async (id: string): Promise<void> => {
  await User.findByIdAndDelete(id);
};

export const searchUsers = async (query: string): Promise<HydratedDocument<IUser>[]> => {
  const searchQuery = new RegExp(query, 'i');
  return await User.find({
    $or: [
      { userName: { $regex: searchQuery } },
      { email: { $regex: searchQuery } },
      { mobileNumber: { $regex: searchQuery } },
    ],
  }).lean();
};
