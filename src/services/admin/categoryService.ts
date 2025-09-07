import ServiceCategory, { IServiceCategory } from "@/database/serviceCategoryModel";
import Service from "@/database/serviceModel";
import { HydratedDocument } from "mongoose";

export const getAllCategoriesWithServices = async (): Promise<HydratedDocument<IServiceCategory>[]> => {
    const categories = await ServiceCategory.find({}).lean();
    for (const category of categories) {
        const services = await Service.find({ category: category._id }).lean();
        (category as any).services = services;
    }
    return categories as HydratedDocument<IServiceCategory>[];
};