import Provider, { IProvider } from "@/database/ProviderModel";
import User from "@/database/userModel";
import { HydratedDocument } from "mongoose";

export const getAllProviders = async (
  page: number,
  limit: number
): Promise<{
  providers: HydratedDocument<IProvider>[];
  totalProviders: number;
}> => {
  const skip = (page - 1) * limit;
  const providers = await Provider.find({})
    .populate({
      path: "userId",
      model: User,
    })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalProviders = await Provider.countDocuments();

  return { providers, totalProviders };
};

export const getProviderById = async (
  id: string
): Promise<HydratedDocument<IProvider> | null> => {
  return await Provider.findById(id).populate({
    path: "userId",
    model: User,
  });
};

export const updateProvider = async (
  id: string,
  providerData: Partial<IProvider>
): Promise<HydratedDocument<IProvider> | null> => {
  return await Provider.findByIdAndUpdate(id, providerData, { new: true });
};

export const deleteProvider = async (id: string): Promise<void> => {
  await Provider.findByIdAndDelete(id);
};

export const searchProviders = async (query: string): Promise<any[]> => {
  const searchQuery = new RegExp(query, "i");
  return await Provider.aggregate([
    {
      $lookup: {
        from: User.collection.name,
        localField: "userId",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $unwind: "$userDetails",
    },
    {
      $match: {
        $or: [
          { "userDetails.userName": { $regex: searchQuery } },
          { "userDetails.email": { $regex: searchQuery } },
        ],
      },
    },
    {
      $project: {
        _id: 1,
        userId: "$userDetails",
        isVerified: 1,
        averageRating: 1,
      },
    },
  ]);
};

export const updateProviderVerification = async (
  id: string,
  isVerified: boolean
): Promise<HydratedDocument<IProvider> | null> => {
  return Provider.findByIdAndUpdate(id, { isVerified: isVerified }, { new: true });
};

export const getProviderStats = async () => {
  const total = await Provider.countDocuments();
  const verified = await Provider.countDocuments({ isVerified: true });
  const rejected = await Provider.countDocuments({ isVerified: false });

  return { total, verified, rejected };
};