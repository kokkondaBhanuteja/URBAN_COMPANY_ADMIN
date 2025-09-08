import Booking, { IBooking } from "@/database/bookingModel";
import { HydratedDocument } from "mongoose";
import User from "@/database/userModel";
import "@/database/ProviderModel";
import "@/database/serviceModel";

export const getAllBookings = async (
  page: number,
  limit: number
): Promise<{
  bookings: HydratedDocument<IBooking>[];
  totalBookings: number;
}> => {
  const skip = (page - 1) * limit;
  const totalBookings = await Booking.countDocuments();

  const bookings = await Booking.find({})
    .populate({
      path: "userId", // Changed from consumerId
      model: "User",
      select: "userName",
    })
    .populate({
      path: "providerId",
      populate: {
        path: "userId",
        model: "User",
        select: "userName",
      },
    })
    .populate("serviceId")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  
  if (bookings.length > 0) {
    console.dir(bookings[0], { depth: null });
  }

  return { bookings, totalBookings };
};


// ✅ Get booking by ID with correct field names
export const getBookingById = async (
  id: string
): Promise<HydratedDocument<IBooking> | null> => {
  return await Booking.findById(id)
    .populate({ path: "userId", model: User, select: "userName" })
    .populate({
      path: "providerId",
      populate: {
        path: "userId",
        model: "User",
        select: "userName",
      },
    })
    .populate("serviceId");
};

// ✅ Update booking
export const updateBooking = async (
  id: string,
  bookingData: Partial<IBooking>
): Promise<HydratedDocument<IBooking> | null> => {
  return await Booking.findByIdAndUpdate(id, bookingData, { new: true });
};

// ✅ Search bookings (fixed consumerId → userId, bookingStatus → status, scheduledAt → scheduledDateTime)
export const searchBookings = async (query: string): Promise<any[]> => {
  const searchQuery = new RegExp(query, "i");

  return await Booking.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "consumerDetails",
      },
    },
    { $unwind: { path: "$consumerDetails", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "providers",
        localField: "providerId",
        foreignField: "_id",
        as: "providerDetails",
      },
    },
    { $unwind: { path: "$providerDetails", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "providerDetails.userId",
        foreignField: "_id",
        as: "providerUserDetails",
      },
    },
    {
      $unwind: {
        path: "$providerUserDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "services",
        localField: "serviceId",
        foreignField: "_id",
        as: "serviceDetails",
      },
    },
    { $unwind: { path: "$serviceDetails", preserveNullAndEmptyArrays: true } },
    {
      $match: {
        $or: [
          { "consumerDetails.userName": { $regex: searchQuery } },
          { "providerUserDetails.userName": { $regex: searchQuery } },
          { "serviceDetails.serviceName": { $regex: searchQuery } },
        ],
      },
    },
    {
      $project: {
        _id: 1,
        userId: "$consumerDetails", // ✅ instead of consumerId
        providerId: {
          userId: "$providerUserDetails",
        },
        serviceId: "$serviceDetails",
        status: 1, // ✅ instead of bookingStatus
        scheduledDateTime: 1, // ✅ instead of scheduledAt
        pricing: 1,
      },
    },
  ]);
};

// ✅ Booking stats (fixed field name)
export const getBookingStats = async () => {
  const total = await Booking.countDocuments();
  const completed = await Booking.countDocuments({ status: "completed" });
  const cancelled = await Booking.countDocuments({
    status: { $in: ["cancelled_by_user", "cancelled_by_provider","cancelled"] },
  });

  return { total, completed, cancelled };
};