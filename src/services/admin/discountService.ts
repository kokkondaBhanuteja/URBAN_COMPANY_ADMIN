import Discount, { IDiscount } from "@/database/discountModel";
import { HydratedDocument } from "mongoose";

export const getAllDiscounts = async (
  page: number,
  limit: number
): Promise<{
  discounts: HydratedDocument<IDiscount>[];
  totalDiscounts: number;
}> => {
  const skip = (page - 1) * limit;
  const discounts = await Discount.find({})
    .populate("category", "categoryName")
    .populate("service", "serviceName")
    .skip(skip)
    .limit(limit)
    .lean();
  const totalDiscounts = await Discount.countDocuments();
  return { discounts, totalDiscounts };
};

export const addDiscount = async (
  discountData: Partial<IDiscount>
): Promise<HydratedDocument<IDiscount>> => {
  const newDiscount = new Discount(discountData);
  await newDiscount.save();
  return newDiscount;
};

export const updateDiscount = async (
  id: string,
  discountData: Partial<IDiscount>
): Promise<HydratedDocument<IDiscount> | null> => {
  return await Discount.findByIdAndUpdate(id, discountData, { new: true });
};

export const deleteDiscount = async (id: string): Promise<void> => {
  await Discount.findByIdAndDelete(id);
};

export const searchDiscounts = async (
  query: string,
): Promise<HydratedDocument<IDiscount>[]> => {
  const searchQuery = new RegExp(query, "i");
  return await Discount.find({ promoCode: { $regex: searchQuery } })
    .populate("category", "categoryName")
    .populate("service", "serviceName")
    .lean();
};