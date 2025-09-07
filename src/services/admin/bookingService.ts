// src/services/admin/bookingService.ts
import Booking, { IBooking } from "@/database/bookingModel";
import { HydratedDocument } from "mongoose";
import User from "@/database/userModel";
import "@/database/ProviderModel";
import "@/database/serviceModel";

export const getAllBookings = async (page: number, limit: number): Promise<{ bookings: HydratedDocument<IBooking>[], totalBookings: number }> => {
  const skip = (page - 1) * limit;
  const totalBookings = await Booking.countDocuments();
  const bookings = await Booking.find({})
    .populate({
      path: 'consumerId',
      model: User,
      select: 'userName'
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

  return { bookings, totalBookings };
};

export const getBookingById = async (id: string): Promise<HydratedDocument<IBooking> | null> => {
  return await Booking.findById(id).populate("consumerId providerId serviceId");
};

export const updateBooking = async (id: string, bookingData: Partial<IBooking>): Promise<HydratedDocument<IBooking> | null> => {
  return await Booking.findByIdAndUpdate(id, bookingData, { new: true });
};

export const searchBookings = async (query: string): Promise<any[]> => {
  const searchQuery = new RegExp(query, 'i');
  return await Booking.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'consumerId',
        foreignField: '_id',
        as: 'consumerDetails'
      }
    },
    { $unwind: { path: '$consumerDetails', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'providers',
        localField: 'providerId',
        foreignField: '_id',
        as: 'providerDetails'
      }
    },
    { $unwind: { path: '$providerDetails', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'providerDetails.userId',
        foreignField: '_id',
        as: 'providerUserDetails'
      }
    },
    { $unwind: { path: '$providerUserDetails', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'services',
        localField: 'serviceId',
        foreignField: '_id',
        as: 'serviceDetails'
      }
    },
    { $unwind: { path: '$serviceDetails', preserveNullAndEmptyArrays: true } },
    {
      $match: {
        $or: [
          { 'consumerDetails.userName': { $regex: searchQuery } },
          { 'providerUserDetails.userName': { $regex: searchQuery } },
          { 'serviceDetails.serviceName': { $regex: searchQuery } }
        ]
      }
    },
    {
      $project: {
        _id: 1,
        consumerId: '$consumerDetails',
        providerId: {
          userId: '$providerUserDetails'
        },
        serviceId: '$serviceDetails',
        bookingStatus: 1,
        scheduledAt: 1,
        pricing: 1
      }
    }
  ]);
};

export const getBookingStats = async () => {
    const total = await Booking.countDocuments();
    const completed = await Booking.countDocuments({ bookingStatus: 'completed' });
    const cancelled = await Booking.countDocuments({
        bookingStatus: { $in: ['cancelled_by_user', 'cancelled_by_provider'] }
    });

    return { total, completed, cancelled };
};