// src/services/admin/bookingService.ts
import Booking, { IBooking } from "@/database/bookingModel";
import { HydratedDocument } from "mongoose";
import "@/database/userModel";
import "@/database/ProviderModel";
import "@/database/serviceModel";

export const getAllBookings = async (): Promise<HydratedDocument<IBooking>[]> => {
  return await Booking.find({})
    .populate("consumerId")
    .populate("serviceId")
    .populate({
      path: "providerId",
      populate: {
        path: "userId",
        model: "User",
      },
    })
    .lean();
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
        totalPrice: 1
      }
    }
  ]);
};
