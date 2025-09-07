import Discount, { IDiscount } from "@/database/discountModel";
import { HydratedDocument } from "mongoose";

export const getAllDiscounts = async (): Promise<HydratedDocument<IDiscount>[]> => {
  return await Discount.find({}).lean();
};

export const addDiscount = async (discountData: Partial<IDiscount>): Promise<HydratedDocument<IDiscount>> => {
  const newDiscount = new Discount(discountData);
  await newDiscount.save();
  return newDiscount;
};

export const updateDiscount = async (id: string, discountData: Partial<IDiscount>): Promise<HydratedDocument<IDiscount> | null> => {
  return await Discount.findByIdAndUpdate(id, discountData, { new: true });
};

export const deleteDiscount = async (id: string): Promise<void> => {
  await Discount.findByIdAndDelete(id);
};