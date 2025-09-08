import Provider, { IProvider } from "@/database/ProviderModel";
import User from "@/database/userModel";
import { HydratedDocument } from "mongoose";
import Service from "@/database/serviceModel";

export const getAllProviders = async (
  page: number,
  limit: number,
  categoryId?: string,
  searchQuery?: string
): Promise<{
  providers: HydratedDocument<IProvider>[];
  totalProviders: number;
}> => {
  const skip = (page - 1) * limit;

  let matchQuery = {};

  if (searchQuery) {
    const searchRegex = new RegExp(searchQuery, "i");
    matchQuery = {
      $or: [
        { "userDetails.userName": { $regex: searchRegex } },
        { "userDetails.email": { $regex: searchRegex } },
      ],
    };
  }

  const pipeline = [
    {
      $lookup: {
        from: User.collection.name,
        localField: "userId",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    { $unwind: "$userDetails" },
    {
      $lookup: {
        from: Service.collection.name,
        localField: "servicesOffered",
        foreignField: "_id",
        as: "serviceDetails",
      },
    },
    { $match: matchQuery },
    {
      $addFields: {
        firstService: { $arrayElemAt: ["$serviceDetails", 0] }
      }
    },
    {
      $lookup: {
        from: "servicecategories",
        localField: "firstService.category",
        foreignField: "_id",
        as: "categoryDetails"
      }
    },
    {
      $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true }
    },
    {
      $match: categoryId ? { "categoryDetails._id": new Object(categoryId) } : {}
    },
    {
      $facet: {
        providers: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              userId: "$userDetails",
              servicesOffered: "$serviceDetails",
              isVerified: 1,
              averageRating: 1,
            },
          },
        ],
        totalCount: [
          { $count: "count" }
        ]
      }
    }
  ];

  const result = await Provider.aggregate(pipeline);
  const providers = result[0].providers;
  const totalProviders = result[0].totalCount.length > 0 ? result[0].totalCount[0].count : 0;
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