import Booking, { IBooking } from "@/database/bookingModel";
import { HydratedDocument, PipelineStage } from "mongoose";
import User from "@/database/userModel";
import "@/database/ProviderModel";
import "@/database/serviceModel";

export const getAllBookings = async (
  page: number,
  limit: number,
  searchQuery?: string | null,
  statusFilter?: string | null,
  startDate?: string | null,
  endDate?: string | null
): Promise<{
  bookings: HydratedDocument<IBooking>[];
  totalBookings: number;
}> => {
  const skip = (page - 1) * limit;
  
  const matchConditions: any = {};

  if (statusFilter) {
    matchConditions.bookingStatus = statusFilter;
  }

  if (startDate && endDate) {
    matchConditions.scheduledAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (startDate) {
      const date = new Date(startDate);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      matchConditions.scheduledAt = {
        $gte: date,
        $lt: nextDate
      };
  }

  const pipeline: PipelineStage[] = [
    { $match: matchConditions },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userId'
      }
    },
    { $unwind: '$userId' },
    {
        $lookup: {
            from: 'services',
            localField: 'serviceId',
            foreignField: '_id',
            as: 'serviceId'
        }
    },
    { $unwind: '$serviceId' },
    {
        $lookup: {
            from: 'providers',
            localField: 'providerId',
            foreignField: '_id',
            as: 'providerId'
        }
    },
    { $unwind: { path: '$providerId', preserveNullAndEmptyArrays: true } },
    {
        $lookup: {
            from: 'users',
            localField: 'providerId.userId',
            foreignField: '_id',
            as: 'providerId.userId'
        }
    },
    { $unwind: { path: '$providerId.userId', preserveNullAndEmptyArrays: true } },
  ];

  if (searchQuery) {
    const searchRegex = new RegExp(searchQuery, 'i');
    pipeline.push({
      $match: {
        $or: [
          { 'userId.userName': searchRegex },
          { 'providerId.userId.userName': searchRegex },
          { 'serviceId.serviceName': searchRegex },
        ],
      }
    });
  }

  const countPipeline = [...pipeline, { $count: 'total' }];

  pipeline.push(
    { $sort: { scheduledAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  )

  const [bookingsResult, countResult] = await Promise.all([
    Booking.aggregate(pipeline),
    Booking.aggregate(countPipeline)
  ]);
  
  const bookings = bookingsResult as HydratedDocument<IBooking>[];
  const totalBookings = countResult.length > 0 ? countResult[0].total : 0;

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
        bookingStatus: 1, // ✅ instead of status
        scheduledAt: 1, // ✅ instead of scheduledDateTime
        pricing: 1,
      },
    },
  ]);
};

// ✅ Booking stats (fixed field name)
export const getBookingStats = async () => {
  const total = await Booking.countDocuments();
  const completed = await Booking.countDocuments({ bookingStatus: "completed" });
  const cancelled = await Booking.countDocuments({
    bookingStatus: { $in: ["cancelled_by_user", "cancelled_by_provider","cancelled"] },
  });

  return { total, completed, cancelled };
};