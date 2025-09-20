import { type NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { connectDb } from "@/lib/dbConnect";
import Payment from "@/database/paymentModel";
import ProviderPayout from "@/database/providerPayoutModel";
import LedgerTransaction from "@/database/ledgerTransactionModel";
import Wallet from "@/database/walletModel";
import User from "@/database/userModel";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
    const connection = await connectDb();
    if (!connection) {
        return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
    }
    const { db, session } = connection;
  try {
    session.startTransaction();
    logger.info("GET /api/financials transaction started");
    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) {
        await session.abortTransaction();
        return adminAuthResponse;
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const transactionType = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");


    // --- 1. Get High-Level Stats ---
    const totalRevenueResult = await Payment.aggregate([
      { $match: { paymentStatus: "successful" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).session(session);
    const totalPayoutsResult = await ProviderPayout.aggregate([
      { $match: { status: "processed" } },
      { $group: { _id: null, total: { $sum: "$netPayout" } } },
    ]).session(session);

    const totalRevenue = totalRevenueResult[0]?.total || 0;
    const totalPayouts = totalPayoutsResult[0]?.total || 0;
    const grossProfit = totalRevenue - totalPayouts;

    // --- 2. Get Admin Wallet Balance ---
    const adminUser = await User.findOne({ userType: 'admin' }).session(session);
    let adminWalletBalance = 0;
    if (adminUser) {
        const adminWallet = await Wallet.findOne({ userId: adminUser._id }).session(session);
        adminWalletBalance = adminWallet?.balance || 0;
    }

    // --- 3. Get Ledger Transactions (Paginated) ---
    const skip = (page - 1) * limit;

    const matchQuery: any = {};
    if (transactionType && transactionType !== 'all') {
      matchQuery.type = transactionType;
    }
    if (startDate) {
        matchQuery.transactionDate = { ...matchQuery.transactionDate, $gte: new Date(startDate) };
    }
    if (endDate) {
        matchQuery.transactionDate = { ...matchQuery.transactionDate, $lte: new Date(endDate) };
    }


    const transactions = await LedgerTransaction.find(matchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .session(session);
    const totalTransactions = await LedgerTransaction.countDocuments(matchQuery).session(session);

    await session.commitTransaction();
    logger.info("GET /api/financials transaction committed");

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
    await session.abortTransaction();
    logger.error("Financials fetch error:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
    });
    return NextResponse.json(
      { message: "An error occurred while fetching financial data" },
      { status: 500 }
    );
  } finally {
    session.endSession();
    logger.info("GET /api/financials session ended");
  }
}