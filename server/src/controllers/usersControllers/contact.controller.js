import Contact from "../../models/usersModels/Contact.model.js";
import asyncHandler from "../../middlewares/asyncHandler.js"
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import validator from "validator";

// =========================
// CREATE CONTACT
// =========================
export const createContact = asyncHandler(async (req, res) => {
    try {
        const { firstName, lastName, email, subject, message } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !subject || !message) {
            throw new AppError("All fields are required", 400);
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            throw new AppError("Please provide a valid email", 400);
        }

        console.log("Creating contact with data:", { firstName, lastName, email, subject, message });

        // Create contact
        const contact = await Contact.create({
            firstName,
            lastName,
            email,
            subject,
            message,
        });

        if (!contact) {
            throw new AppError("Failed to create contact", 500);
        }

        successResponse(res, "Contact message sent successfully", contact, 201);
    } catch (error) {
        console.error("Error in createContact:", error);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to create contact: ${error.message}`, 500);
    }
});

// =========================
// GET ALL CONTACTS (Admin only)
// =========================
export const getAllContacts = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, search, sortBy = "createdAt", order = "desc" } = req.query;

        // Validate page and limit
        if (page < 1 || limit < 1) {
            throw new AppError("Invalid page or limit", 400);
        }

        // Validate sort order
        if (order !== "asc" && order !== "desc") {
            throw new AppError("Invalid sort order", 400);
        }

        // Validate sort by
        if (sortBy !== "firstName" && sortBy !== "lastName" && sortBy !== "email" && sortBy !== "subject" && sortBy !== "message" && sortBy !== "createdAt") {
            throw new AppError("Invalid sort by", 400);
        }

        // Build search query
        const query = {};
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: "i" } },
                { lastName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { subject: { $regex: search, $options: "i" } },
                { message: { $regex: search, $options: "i" } },
            ];
        }

        // Pagination
        const skip = (page - 1) * limit;
        const sortOrder = order === "asc" ? 1 : -1;

        // Get contacts with pagination
        const contacts = await Contact.find(query)
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        if (!contacts) {
            throw new AppError("Failed to retrieve contacts", 500);
        }

        // Get total count
        const totalContacts = await Contact.countDocuments(query);

        if (totalContacts === 0) {
            throw new AppError("No contacts found", 404);
        }

        successResponse(res, "Contacts retrieved successfully", {
            contacts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalContacts / limit),
                totalContacts,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("Error in getAllContacts:", error);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to retrieve contacts: ${error.message}`, 500);
    }
});

// =========================
// GET CONTACT BY ID (Admin only)
// =========================
export const getContactById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            throw new AppError("Contact ID is required", 400);
        }

        const contact = await Contact.findById(id);

        if (!contact) {
            throw new AppError("Contact not found", 404);
        }

        successResponse(res, "Contact retrieved successfully", contact);
    } catch (error) {
        console.error("Error in getContactById:", error);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to retrieve contact: ${error.message}`, 500);
    }
});

// =========================
// UPDATE CONTACT (Admin only)
// =========================
export const updateContact = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, subject, message } = req.body;

        if (!id) {
            throw new AppError("Contact ID is required", 400);
        }

        // Validate required fields
        if (!firstName && !lastName && !email && !subject && !message) {
            throw new AppError("All fields are required", 400);
        }

        const contact = await Contact.findById(id);

        if (!contact) {
            throw new AppError("Contact not found", 404);
        }

        // Update fields
        if (firstName) contact.firstName = firstName;
        if (lastName) contact.lastName = lastName;
        if (email) contact.email = email;
        if (subject) contact.subject = subject;
        if (message) contact.message = message;

        await contact.save();

        successResponse(res, "Contact updated successfully", contact);
    } catch (error) {
        console.error("Error in updateContact:", error);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to update contact: ${error.message}`, 500);
    }
});

// =========================
// DELETE CONTACT (Admin only)
// =========================
export const deleteContact = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            throw new AppError("Contact ID is required", 400);
        }

        const contact = await Contact.findById(id);

        if (!contact) {
            throw new AppError("Contact not found", 404);
        }

        await contact.deleteOne();

        successResponse(res, "Contact deleted successfully", null);
    } catch (error) {
        console.error("Error in deleteContact:", error);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to delete contact: ${error.message}`, 500);
    }
});

// =========================
// DELETE MULTIPLE CONTACTS (Admin only)
// =========================
export const deleteMultipleContacts = asyncHandler(async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw new AppError("Contact IDs array is required", 400);
        }

        const result = await Contact.deleteMany({ _id: { $in: ids } });

        if (result.deletedCount === 0 || !result) {
            throw new AppError("No contacts found to delete", 404);
        }

        successResponse(res, `${result.deletedCount} contact(s) deleted successfully`, {
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error("Error in deleteMultipleContacts:", error);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to delete multiple contacts: ${error.message}`, 500);
    }
});

// =========================
// GET CONTACT STATISTICS (Admin only)
// =========================
export const getContactStats = asyncHandler(async (req, res) => {
    try {
        const totalContacts = await Contact.countDocuments();

        if (totalContacts === 0) {
            throw new AppError("No contacts found", 404);
        }

        // Get contacts by month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const contactsByMonth = await Contact.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 },
            },
        ]);

        if (!contactsByMonth) {
            throw new AppError("Failed to retrieve contact statistics", 500);
        }

        // Get recent contacts (last 5)
        const recentContacts = await Contact.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("firstName lastName email subject createdAt");

        if (!recentContacts) {
            throw new AppError("Failed to retrieve recent contacts", 500);
        }

        successResponse(res, "Contact statistics retrieved successfully", {
            totalContacts,
            contactsByMonth,
            recentContacts,
        });
    } catch (error) {
        console.error("Error in getContactStats:", error);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to retrieve contact statistics: ${error.message}`, 500);
    }
});

// =========================
// SEARCH CONTACTS BY EMAIL (Admin only)
// =========================
export const searchContactByEmail = asyncHandler(async (req, res) => {
    try {
        const { email } = req.query || req.body;

        if (!email) {
            throw new AppError("Email is required", 400);
        }

        const contacts = await Contact.find({
            email: { $regex: email, $options: "i" },
        }).sort({ createdAt: -1 });

        if (!contacts || contacts.length === 0) {
            throw new AppError("No contacts found with the provided email", 404);
        }

        successResponse(res, "Contacts retrieved successfully", {
            count: contacts.length,
            contacts,
        });
    } catch (error) {
        console.error("Error in searchContactByEmail:", error);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to search contacts by email: ${error.message}`, 500);
    }
});