import ProviderPayout, {
  IProviderPayout,
} from "@/database/providerPayoutModel";
import Provider from "@/database/ProviderModel";
import Payment, { IPayment } from "@/database/paymentModel";
import User from "@/database/userModel";
import Booking from "@/database/bookingModel";

import { HydratedDocument } from "mongoose";

export const getAllPayments = async (
  page: number,
  limit: number,
  searchQuery?: string,
  statusFilter?: string,
  dateFilter?: string
): Promise<{
  payments: HydratedDocument<IPayment>[];
  totalPayments: number;
  totalRevenue: number;
}> => {
  const skip = (page - 1) * limit;
  let matchQuery: any = {};

  if (statusFilter) {
    matchQuery = { paymentStatus: statusFilter };
  }

  if (dateFilter) {
    const startDate = new Date(dateFilter);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    matchQuery = {
      ...matchQuery,
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    };
  }

  const pipeline = [
    {
      $unwind: "$bookingIds",
    },
    {
      $lookup: {
        from: Booking.collection.name,
        localField: "bookingIds",
        foreignField: "_id",
        as: "bookingDetails",
      },
    },
    { $unwind: "$bookingDetails" },
    {
      $lookup: {
        from: "providers",
        localField: "bookingDetails.providerId",
        foreignField: "_id",
        as: "providerDetails",
      },
    },
    { $unwind: { path: "$providerDetails", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: User.collection.name,
        localField: "providerDetails.userId",
        foreignField: "_id",
        as: "providerUserDetails",
      },
    },
    { $unwind: { path: "$providerUserDetails", preserveNullAndEmptyArrays: true } },
    {
      $match: {
        ...matchQuery,
        ...(searchQuery && {
          $or: [
            { "providerUserDetails.userName": { $regex: searchQuery, $options: "i" } },
            { "paymentMethod": { $regex: searchQuery, $options: "i" } },
          ],
        }),
      },
    },
    {
      $group: {
        _id: "$_id",
        amount: { $first: "$amount" },
        paymentStatus: { $first: "$paymentStatus" },
        paymentMethod: { $first: "$paymentMethod" },
        providerNames: { $push: "$providerUserDetails.userName" },
        createdAt: { $first: "$createdAt" },
        bookingId: { $first: "$bookingIds" }, // This is now a single booking ID per grouped payment
      },
    },
    {
      $facet: {
        payments: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              bookingId: 1,
              amount: 1,
              paymentStatus: 1,
              paymentMethod: 1,
              providerName: { $arrayElemAt: ["$providerNames", 0] }, // Get the first provider name
              createdAt: 1,
            },
          },
        ],
        totalCount: [
          { $group: { _id: null, count: { $sum: 1 } } }
        ],
        totalRevenue: [
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]
      }
    }
  ];

  const [result] = await Payment.aggregate(pipeline);
  const payments = result?.payments || [];
  const totalPayments = result?.totalCount[0]?.count || 0;
  const totalRevenue = result?.totalRevenue[0]?.total || 0;

  return { payments, totalPayments, totalRevenue };
};

export const getPaymentStats = async () => {
  const successful = await Payment.countDocuments({ paymentStatus: "successful" });
  const failed = await Payment.countDocuments({ paymentStatus: "failed" });
  const pending = await Payment.countDocuments({ paymentStatus: "pending" });
  const totalRevenue = await Payment.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);

  return {
    successful,
    failed,
    pending,
    totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
  };
};

export const getProviderPayments = async (page: number, limit: number, searchQuery: string): Promise<any> => {
  let matchQuery: any = {};
  if (searchQuery) {
    matchQuery = {
      $or: [
        { "provider.userName": { $regex: searchQuery, $options: "i" } },
        { "provider.email": { $regex: searchQuery, $options: "i" } },
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
        from: ProviderPayout.collection.name,
        localField: "_id",
        foreignField: "providerId",
        as: "payouts",
      },
    },
    {
      $project: {
        _id: "$_id",
        provider: {
          userName: "$userDetails.userName",
          email: "$userDetails.email",
        },
        totalEarnings: { $sum: "$payouts.netPayout" },
        pendingPayouts: {
          $sum: {
            $filter: {
              input: "$payouts",
              as: "payout",
              cond: { $eq: ["$$payout.status", "pending"] },
            },
          }.netPayout,
        },
        lastPayoutDate: {
          $arrayElemAt: [
            {
              $sortArray: {
                input: {
                  $filter: {
                    input: "$payouts",
                    as: "payout",
                    cond: { $eq: ["$$payout.status", "processed"] },
                  },
                },
                sortBy: { processedAt: -1 },
              },
            },
            0,
          ],
        },
        payoutSchedule: "weekly",
      },
    },
    { $match: matchQuery },
    {
      $facet: {
        providerPayments: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
        ],
        totalCount: [
          { $count: "count" },
        ],
      },
    },
  ];

  const result = await Provider.aggregate(pipeline);
  const providerPayments = result[0].providerPayments;
  const totalProviders = result[0].totalCount.length > 0 ? result[0].totalCount[0].count : 0;

  return { providerPayments, totalProviders };
};

export const searchProviderPayments = async (query: string) => {
  const users = await User.find({
    $or: [
      { userName: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
    ],
  }).lean();
  const userIds = users.map((user) => user._id);
  const providers = await Provider.find({ userId: { $in: userIds } })
    .populate("userId")
    .lean();
  // The rest of the logic is the same as getProviderPayments, just with the filtered providers
  const providerPayments = [];

  for (const provider of providers) {
    const payouts = await ProviderPayout.find({
      providerId: provider._id,
    }).lean();
    const totalEarnings = payouts.reduce((acc, p) => acc + p.netPayout, 0);
    const pendingPayouts = payouts
      .filter((p) => p.status === "pending")
      .reduce((acc, p) => acc + p.netPayout, 0);
    const lastPayout = await ProviderPayout.findOne({
      providerId: provider._id,
      status: "processed",
    }).sort({ processedAt: -1 });

    providerPayments.push({
      _id: provider._id,
      providerId: provider._id,
      provider: {
        userName: (provider.userId as any).userName,
        email: (provider.userId as any).email,
      },
      paymentMethods: [],
      totalEarnings,
      pendingPayouts,
      lastPayoutDate: lastPayout?.processedAt,
      payoutSchedule: "weekly",
    });
  }

  return providerPayments;
};

export const processPayoutsForProviders = async (providerIds: string[]) => {
  const payoutsToProcess = await ProviderPayout.find({
    providerId: { $in: providerIds },
    status: "pending",
  });

  for (const payout of payoutsToProcess) {
    payout.status = "processed";
    payout.processedAt = new Date();
    await payout.save();
  }

  return { message: `${payoutsToProcess.length} payouts processed successfully.` };
};