import HomePage from "../../models/usersModels/HomePageHero.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";



// =========================
// GET HOME PAGE CONTENT
export const getHomePage = asyncHandler(async (req, res) => {
    try {
        const homePageContent = await HomePage.getActiveContent();
        if (!homePageContent) {
            throw new AppError("Home page content not found", 404);
        }
        successResponse(res, "Home page content retrieved successfully", homePageContent);
    } catch (error) {
        console.error("Error retrieving home page content:", error.message);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to retrieve home page content: ${error.message}`, 500);
    }
});

// Create or Update Home Page Content

// =========================
// CREATE HOME PAGE CONTENT (First time only)
// =========================
export const createHomePage = asyncHandler(async (req, res) => {
    try {
        const { statusBadge, titleLine1, titleLine2, subtitle } = req.body;

        // Check if content already exists
        const existingHomePage = await HomePage.findOne({});
        if (existingHomePage) {
            throw new AppError(
                "Home page content already exists. Use update endpoint to modify it.",
                400
            );
        }

        // All fields are required for creation
        if (!statusBadge || !titleLine1 || !titleLine2 || !subtitle) {
            throw new AppError(
                "All fields are required: statusBadge, titleLine1, titleLine2, and subtitle",
                400
            );
        }

        const homePage = await HomePage.create({
            statusBadge,
            titleLine1,
            titleLine2,
            subtitle,
            lastUpdatedBy: req.user._id,
        });

        successResponse(
            res,
            "Home page content created successfully",
            homePage,
            201
        );
    } catch (error) {
        console.error("Error creating home page content:", error.message);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to create home page content: ${error.message}`, 500);
    }
});

// =========================
// UPDATE HOME PAGE CONTENT (Partial updates allowed)
// =========================
export const updateHomePage = asyncHandler(async (req, res) => {
    try {
        const { statusBadge, titleLine1, titleLine2, subtitle } = req.body;

        // Check if home page exists
        const homePage = await HomePage.findOne({});
        if (!homePage) {
            throw new AppError(
                "Home page content not found. Please create it first.",
                404
            );
        }

        // At least one field should be provided
        const hasUpdates = statusBadge || titleLine1 || titleLine2 || subtitle;
        if (!hasUpdates) {
            throw new AppError(
                "At least one field is required to update",
                400
            );
        }

        // Update only provided fields
        if (statusBadge !== undefined) homePage.statusBadge = statusBadge;
        if (titleLine1 !== undefined) homePage.titleLine1 = titleLine1;
        if (titleLine2 !== undefined) homePage.titleLine2 = titleLine2;
        if (subtitle !== undefined) homePage.subtitle = subtitle;
        homePage.lastUpdatedBy = req.user._id;

        await homePage.save();

        successResponse(
            res,
            "Home page content updated successfully",
            homePage,
            200
        );
    } catch (error) {
        console.error("Error updating home page content:", error.message);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to update home page content: ${error.message}`, 500);
    }
});


export const deleteHomePage = asyncHandler(async (req, res) => {
    try {
        const homePage = await HomePage.findOne({});
        if (!homePage) {
            throw new AppError("Home page content not found", 404);
        }
        await homePage.deleteOne();
        successResponse(res, "Home page content deleted successfully", null, 200);
    } catch (error) {
        console.error("Error deleting home page content:", error.message);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to delete home page content: ${error.message}`, 500);
    }
});

export const deleteSpecificField = asyncHandler(async (req, res) => {
    try {
        const { fieldName } = req.params;
        const homePage = await HomePage.findOne({});
        if (!homePage) {
            throw new AppError("Home page content not found", 404);
        }
        if (!['statusBadge', 'titleLine1', 'titleLine2', 'subtitle'].includes(fieldName)) {
            throw new AppError("Invalid field name", 400);
        }
        homePage[fieldName] = undefined;
        await homePage.save();
        successResponse(res, `Field ${fieldName} deleted successfully`, homePage, 200);
    } catch (error) {
        console.error("Error deleting specific field from home page content:", error.message);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to delete specific field: ${error.message}`, 500);
    }
});