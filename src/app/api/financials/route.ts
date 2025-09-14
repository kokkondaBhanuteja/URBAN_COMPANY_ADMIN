import { type NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { connectDb } from "@/lib/dbConnect";
import Payment from "@/database/paymentModel";
import ProviderPayout from "@/database/providerPayoutModel";
import LedgerTransaction from "@/database/ledgerTransactionModel";
import Wallet from "@/database/walletModel";
import User from "@/database/userModel";

export async function GET(req: NextRequest) {
  await connectDb();
  const adminAuthResponse = await adminMiddleware(req);
  if (adminAuthResponse.status !== 200) return adminAuthResponse;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // --- 1. Get High-Level Stats ---
    const totalRevenueResult = await Payment.aggregate([
      { $match: { paymentStatus: "successful" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalPayoutsResult = await ProviderPayout.aggregate([
      { $match: { status: "processed" } },
      { $group: { _id: null, total: { $sum: "$netPayout" } } },
    ]);

    const totalRevenue = totalRevenueResult[0]?.total || 0;
    const totalPayouts = totalPayoutsResult[0]?.total || 0;
    const grossProfit = totalRevenue - totalPayouts;

    // --- 2. Get Admin Wallet Balance ---
    const adminUser = await User.findOne({ userType: 'admin' });
    let adminWalletBalance = 0;
    if (adminUser) {
        const adminWallet = await Wallet.findOne({ userId: adminUser._id });
        adminWalletBalance = adminWallet?.balance || 0;
    }

    // --- 3. Get Ledger Transactions (Paginated) ---
    const skip = (page - 1) * limit;
    const transactions = await LedgerTransaction.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const totalTransactions = await LedgerTransaction.countDocuments();

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalPayouts,
        grossProfit,
        adminWalletBalance,
      },
      ledger: {
        transactions,
        totalPages: Math.ceil(totalTransactions / limit),
        currentPage: page,
      },
    });
  } catch (error: any) {
    console.error("Financials fetch error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching financial data" },
      { status: 500 }
    );
  }
}