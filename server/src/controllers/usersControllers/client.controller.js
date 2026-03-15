/**
 * Client controller – CRM management for the agency's business clients.
 *
 * All routes are admin-only (enforced by the router).
 * `deleteClient` archives (soft-deletes) rather than permanently removing.
 * `getAllClients` and `getClientById` augment each client with an
 * `activeProjects` count computed from the Project collection.
 *
 * Exported functions:
 *  - createClient   POST   /api/v1/clients
 *  - getAllClients   GET    /api/v1/clients      (paginated, filterable, searchable)
 *  - getClientById  GET    /api/v1/clients/:id
 *  - updateClient   PUT    /api/v1/clients/:id
 *  - deleteClient   DELETE /api/v1/clients/:id  (archives, does not delete)
 *  - getClientStats GET    /api/v1/clients/stats
 */
import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import Client from "../../models/usersModels/Client.model.js";
import Project from "../../models/usersModels/Project.model.js";

// =========================
// CREATE CLIENT
// =========================
export const createClient = asyncHandler(async (req, res) => {
    const {
        companyName,
        contactName,
        email,
        phone,
        industry,
        status,
        accountManager,
        website,
        notes,
        logoUrl,
    } = req.body;

    if (!companyName || !email) {
        throw new AppError("companyName and email are required", 400);
    }

    const client = await Client.create({
        companyName,
        contactName,
        email,
        phone,
        industry,
        status,
        accountManager,
        website,
        notes,
        logoUrl,
        createdBy: req.user._id,
    });

    successResponse(res, "Client created successfully", client, 201);
});

// =========================
// GET ALL CLIENTS
// =========================
export const getAllClients = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, search, accountManager } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { isArchived: false };
    if (status) filter.status = status;
    if (accountManager) filter.accountManager = accountManager;
    if (search) {
        filter.$or = [
            { companyName: { $regex: search, $options: "i" } },
            { contactName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
        ];
    }

    const [clients, total] = await Promise.all([
        Client.find(filter)
            .populate("accountManager", "name email photo")
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Client.countDocuments(filter),
    ]);

    // Attach active project count for each client
    const clientsWithProjects = await Promise.all(
        clients.map(async (client) => {
            const activeProjects = await Project.countDocuments({
                requestedBy: client._id,
                status: { $in: ["pending", "in_review", "approved"] },
            });
            return { ...client.toObject(), activeProjects };
        })
    );

    successResponse(res, "Clients fetched successfully", {
        clients: clientsWithProjects,
        pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            limit: Number(limit),
        },
    });
});

// =========================
// GET CLIENT BY ID
// =========================
export const getClientById = asyncHandler(async (req, res) => {
    const client = await Client.findById(req.params.id)
        .populate("accountManager", "name email photo")
        .populate("createdBy", "name email");

    if (!client || client.isArchived) throw new AppError("Client not found", 404);

    const activeProjects = await Project.countDocuments({
        requestedBy: client._id,
        status: { $in: ["pending", "in_review", "approved"] },
    });

    successResponse(res, "Client fetched", { ...client.toObject(), activeProjects });
});

// =========================
// UPDATE CLIENT
// =========================
export const updateClient = asyncHandler(async (req, res) => {
    const allowed = [
        "companyName", "contactName", "email", "phone", "industry",
        "status", "accountManager", "website", "notes", "logoUrl", "totalRevenue",
    ];
    const updates = {};
    allowed.forEach((key) => {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const client = await Client.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
    }).populate("accountManager", "name email photo");

    if (!client) throw new AppError("Client not found", 404);
    successResponse(res, "Client updated successfully", client);
});

// =========================
// DELETE CLIENT (archive)
// =========================
export const deleteClient = asyncHandler(async (req, res) => {
    const client = await Client.findByIdAndUpdate(
        req.params.id,
        { isArchived: true },
        { new: true }
    );
    if (!client) throw new AppError("Client not found", 404);
    successResponse(res, "Client archived successfully", {});
});

// =========================
// GET CLIENT STATS
// =========================
export const getClientStats = asyncHandler(async (req, res) => {
    const [total, byStatus, newThisMonth] = await Promise.all([
        Client.countDocuments({ isArchived: false }),
        Client.aggregate([
            { $match: { isArchived: false } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Client.countDocuments({
            isArchived: false,
            createdAt: { $gte: new Date(new Date().setDate(1)) },
        }),
    ]);

    const totalRevenue = await Client.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: null, total: { $sum: "$totalRevenue" } } },
    ]);

    successResponse(res, "Client stats fetched", {
        total,
        byStatus,
        newThisMonth,
        totalRevenue: totalRevenue[0]?.total || 0,
    });
});
