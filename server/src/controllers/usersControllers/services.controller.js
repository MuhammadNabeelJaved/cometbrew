import asyncHandler from "../../middlewares/asyncHandler.js"
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import validator from "validator";
import Service from "../../models/usersModels/Services.model.js";
import { autoSyncSection } from "../../utils/chatbotAutoSync.js";
import { invalidateCache } from "../../middlewares/redisCache.js";

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
            category
        } = req.body;

        if (!title || !slug || !description) {
            throw new AppError("Title, Slug, and Description are required", 400);
        }

        if (!validator.isSlug(slug)) {
            throw new AppError("Slug must be URL friendly", 400);
        }

        if (!subtitle && !heroSection && !relatedProjects && !pricingPlans && !faqs && !features && !technologies && !metrics && !ctaSection && !category) {
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
            category
        });

        if (!service) {
            throw new AppError("Failed to create service", 500);
        }

        const io = req.app.get("io");
        if (io) io.of("/public").emit("cms:updated", { section: "services" });
        autoSyncSection('services').catch(() => {});
        invalidateCache('/services').catch(() => {});
        successResponse(res, "Service created successfully", service, 201);
    } catch (error) {
        console.error("Error creating service:", error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Failed to create service: ${error.message}`, 500);

    }
});


// =========================
// GET ALL SERVICES
// =========================
export const getAllServices = asyncHandler(async (req, res) => {
    try {
        const services = await Service.find({}).sort({ createdAt: -1 });

        successResponse(res, "Services retrieved successfully", services);
    } catch (error) {
        console.error("Error in getAllServices:", error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
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
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Failed to retrieve service: ${error.message}`, 500);
    }
});


// =========================
// GET SERVICE BY ID
// =========================
export const getServiceById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            throw new AppError("Service ID is required", 400);
        }

        const service = await Service.findById(id);

        if (!service) {
            throw new AppError("Service not found", 404);
        }

        successResponse(res, "Service retrieved successfully", service);
    } catch (error) {
        console.error("Error in getServiceById:", error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
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

        const io = req.app.get("io");
        if (io) io.of("/public").emit("cms:updated", { section: "services" });
        autoSyncSection('services').catch(() => {});
        invalidateCache('/services').catch(() => {});
        successResponse(res, "Service deleted successfully", null);
    } catch (error) {
        console.error("Error in deleteService:", error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
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
        const io = req.app.get("io");
        if (io) io.of("/public").emit("cms:updated", { section: "services" });
        autoSyncSection('services').catch(() => {});
        invalidateCache('/services').catch(() => {});
        successResponse(res, "Service updated successfully", updatedService);
    } catch (error) {
        console.error("Error in updateService:", error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Failed to update service: ${error.message}`, 500);
    }
});

// =========================
// BULK DELETE SERVICES
// =========================
export const bulkDeleteServices = asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) throw new AppError("ids array is required", 400);
    const result = await Service.deleteMany({ _id: { $in: ids } });
    const io = req.app.get("io");
    if (io) io.of("/public").emit("cms:updated", { section: "services" });
    invalidateCache('/services').catch(() => {});
    successResponse(res, `${result.deletedCount} service(s) deleted`, { deletedCount: result.deletedCount });
});