import Booking from "@/database/bookingModel";
import Payment from "@/database/paymentModel";
import User from "@/database/userModel";
import Provider from "@/database/ProviderModel";
import Service from "@/database/serviceModel";

export const getReports = async () => {
  const totalUsers = await User.countDocuments();
  const totalBookings = await Booking.countDocuments();
  const totalProviders = await Provider.countDocuments(); // Add this line
  const totalPayments = await Payment.aggregate([
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  const bookingsByService = await Booking.aggregate([
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
      $group: {
        _id: "$serviceDetails.serviceName",
        bookings: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        service: "$_id",
        bookings: 1,
      },
    },
  ]); // Add these lines

  return {
    totalUsers,
    totalBookings,
    totalProviders, // Add this line
    totalRevenue: totalPayments.length > 0 ? totalPayments[0].totalAmount : 0,
    bookingsByService, // Add this line
  };
};
