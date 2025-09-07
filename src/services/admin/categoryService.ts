// src/services/admin/categoryService.ts
import ServiceCategory, { IServiceCategory } from "@/database/serviceCategoryModel";
import { HydratedDocument } from "mongoose";

export const getAllCategoriesWithServices = async (): Promise<HydratedDocument<IServiceCategory>[]> => {
    return await ServiceCategory.aggregate([
        {
            $lookup: {
                from: "services",
                localField: "_id",
                foreignField: "category",
                as: "services",
            },
        },
    ]);
};