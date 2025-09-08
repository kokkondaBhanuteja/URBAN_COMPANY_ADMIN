import ProviderPayout, {
  IProviderPayout,
} from "@/database/providerPayoutModel";
import Provider from "@/database/ProviderModel";
import Payment, { IPayment } from "@/database/paymentModel";
import User from "@/database/userModel";

import { HydratedDocument } from "mongoose";

export const getAllPayments = async (): Promise<{
  payments: HydratedDocument<IPayment>[];
  totalRevenue: number;
}> => {
  const payments = await Payment.find({}).populate("bookingId").lean();
  console.log(payments)
  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
  return { payments, totalRevenue };
};
export const getProviderPayments = async () => {
  const providers = await Provider.find().populate("userId").lean();
  const providerPayments = [];
  let totalRevenue = 0;

  for (const provider of providers) {
    const payouts = await ProviderPayout.find({
      providerId: provider._id,
    }).lean();
    const totalEarnings = payouts.reduce((acc, p) => acc + p.netPayout, 0);
    totalRevenue += totalEarnings;
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
      paymentMethods: [], // This would require a separate collection or be part of the provider model
      totalEarnings,
      pendingPayouts,
      lastPayoutDate: lastPayout?.processedAt,
      payoutSchedule: "weekly", // This would need to be stored in the provider model
    });
  }

  return providerPayments;
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

  // In a real app, you would integrate with a payment gateway here.
  // For now, we will just mark them as processed.
  for (const payout of payoutsToProcess) {
    payout.status = "processed";
    payout.processedAt = new Date();
    await payout.save();
  }

  return { message: `${payoutsToProcess.length} payouts processed successfully.` };
};