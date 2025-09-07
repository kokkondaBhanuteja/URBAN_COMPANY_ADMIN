import Service, { IService } from "@/database/serviceModel";
import { HydratedDocument } from "mongoose";

/**
 * Retrieves all services from the database.
 */
export const getAllServices = async (): Promise<HydratedDocument<IService>[]> => {
  return await Service.find({}).populate('category');
};

/**
 * Adds a new service to the database.
 * @param serviceData The data for the new service.
 */
export const addService = async (serviceData: Partial<IService>): Promise<HydratedDocument<IService>> => {
  const newService = new Service(serviceData);
  await newService.save();
  return newService;
};

/**
 * Removes a service from the database.
 * @param id The ID of the service to remove.
 */
export const removeService = async (id: string): Promise<void> => {
  await Service.findByIdAndDelete(id);
};

/**
 * Updates an existing service.
 * @param id The ID of the service to update.
 * @param serviceData The new data for the service.
 */
export const updateService = async (id: string, serviceData: Partial<IService>): Promise<HydratedDocument<IService> | null> => {
  return await Service.findByIdAndUpdate(id, serviceData, { new: true });
};
