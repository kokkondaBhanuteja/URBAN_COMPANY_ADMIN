import Booking from "@/database/bookingModel";
import Payment from "@/database/paymentModel";
import User from "@/database/userModel";
import Provider from "@/database/ProviderModel";
import Service from "@/database/serviceModel";
import ServiceCategory from "@/database/serviceCategoryModel";

export const getReports = async () => {
  const totalUsers = await User.countDocuments();
  const totalBookings = await Booking.countDocuments();
  const totalProviders = await Provider.countDocuments();
  const totalPayments = await Payment.aggregate([
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  const bookingsByCategory = await Booking.aggregate([
    {
      $lookup: {
        from: Service.collection.name,
        localField: "serviceId",
        foreignField: "_id",
        as: "serviceDetails",
      },
    },
    { $unwind: "$serviceDetails" },
    {
      $lookup: {
        from: ServiceCategory.collection.name,
        localField: "serviceDetails.category",
        foreignField: "_id",
        as: "categoryDetails",
      },
    },
    { $unwind: "$categoryDetails" },
    {
      $group: {
        _id: "$categoryDetails.categoryName",
        bookings: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        category: "$_id",
        bookings: 1,
      },
    },
  ]);

  const paymentMethods = await Payment.aggregate([
    {
      $group: {
        _id: "$paymentMethod",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        name: "$_id",
        value: "$count",
      },
    },
  ]);

  return {
    totalUsers,
    totalBookings,
    totalProviders,
    totalRevenue: totalPayments.length > 0 ? totalPayments[0].totalAmount : 0,
    bookingsByCategory,
    paymentMethods,
  };
};