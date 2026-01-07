import asyncHandler from "../../middlewares/asyncHandler.js"
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import validator from "validator";
import Service from "../../models/usersModels/Services.model.js";

// =========================
// CREATE SERVICE
// =========================

export const createService = asyncHandler(async (req, res) => {
    try {
        const {
            title,
            slug,
            subtitle,
            description,
            heroSection,
            relatedProjects,
            pricingPlans,
            faqs,
            features,
            technologies,
            metrics,
            ctaSection,
        } = req.body;

        if (!title || !slug || !description) {
            throw new AppError("Title, Slug, and Description are required", 400);
        }

        if (!validator.isSlug(slug)) {
            throw new AppError("Slug must be URL friendly", 400);
        }

        if (!subtitle && !heroSection && !relatedProjects && !pricingPlans && !faqs && !features && !technologies && !metrics && !ctaSection) {
            throw new AppError("At least one optional field must be provided", 400);
        }

        const service = await Service.create({
            title,
            slug,
            subtitle,
            description,
            heroSection,
            relatedProjects,
            pricingPlans,
            faqs,
            features,
            technologies,
            metrics,
            ctaSection,
        });

        if (!service) {
            throw new AppError("Failed to create service", 500);
        }

        successResponse(res, 201, "Service created successfully", service);
    } catch (error) {
        console.error("Error creating service:", error);
        throw new AppError(`Failed to create service: ${error.message}`, 500);

    }
});


// =========================
// GET ALL SERVICES
// =========================
export const getAllServices = asyncHandler(async (req, res) => {
    try {
        const services = await Service.find({}).sort({ createdAt: -1 });

        if (!services || services.length === 0) {
            throw new AppError("No services found", 404);
        }

        successResponse(res, "Services retrieved successfully", services);
    } catch (error) {
        console.error("Error in getAllServices:", error);
        throw new AppError(`Failed to retrieve services: ${error.message}`, 500);
    }
});


// =========================
// GET SERVICE BY SLUG
// =========================
export const getServiceBySlug = asyncHandler(async (req, res) => {
    try {
        const { slug } = req.params;

        if (!slug) {
            throw new AppError("Slug is required", 400);
        }

        const service = await Service.findOne({ slug });

        if (!service) {
            throw new AppError("Service not found", 404);
        }

        successResponse(res, "Service retrieved successfully", service);
    } catch (error) {
        console.error("Error in getServiceBySlug:", error);
        throw new AppError(`Failed to retrieve service: ${error.message}`, 500);
    }
});

// =========================
// DELETE SERVICE
// =========================
export const deleteService = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            throw new AppError("Service ID is required", 400);
        }

        const service = await Service.findById(id);

        if (!service) {
            throw new AppError("Service not found", 404);
        }

        await service.deleteOne();

        successResponse(res, "Service deleted successfully", null);
    } catch (error) {
        console.error("Error in deleteService:", error);
        throw new AppError(`Failed to delete service: ${error.message}`, 500);
    }
});

// =========================
// UPDATE SERVICE
// =========================
export const updateService = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!id) {
            throw new AppError("Service ID is required", 400);
        }

        const service = await Service.findById(id);

        if (!service) {
            throw new AppError("Service not found", 404);
        }

        const updatedService = await Service.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedService) {
            throw new AppError("Failed to update service", 500);
        }
        successResponse(res, "Service updated successfully", updatedService);
    } catch (error) {
        console.error("Error in updateService:", error);
        throw new AppError(`Failed to update service: ${error.message}`, 500);
    }
});