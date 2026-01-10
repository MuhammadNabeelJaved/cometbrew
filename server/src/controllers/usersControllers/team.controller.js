import asyncHandler from "../../middlewares/asyncHandler.js"
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import validator from "validator";
import Team from "../../models/usersModels/Team.model.js"

// Get all active team members
export const getActiveTeamMembers = asyncHandler(async (req, res, next) => {
    try {
        const teamMembers = await Team.getActiveMembers();

        if (!teamMembers || teamMembers.length === 0) {
            throw new AppError("No active team members found", 404);
        }

        return successResponse(res, 200, "Active team members retrieved successfully", teamMembers);
    } catch (error) {
        console.error("Error in getActiveTeamMembers:", error);
        throw new AppError(`Failed to retrieve active team members: ${error.message}`, 500);
    }
});

// Get team members by department
export const getTeamMembersByDepartment = asyncHandler(async (req, res, next) => {
    try {
        const { department } = req.params;

        if (!department || !validator.isAlpha(department.replace(/\s+/g, ''))) {
            throw new AppError("Invalid department parameter", 400);
        }

        const teamMembers = await Team.findOne({ department: department, isActive: true });

        if (!teamMembers || teamMembers.length === 0) {
            throw new AppError(`No team members found in department: ${department}`, 404);
        }

        return successResponse(res, 200, `Team members in department: ${department} retrieved successfully`, teamMembers);
    } catch (error) {
        console.error("Error in getTeamMembersByDepartment:", error);
        throw new AppError(`Failed to retrieve team members in department: ${error.message}`, 500);
    }
});


// Get team member by ID
export const getTeamMemberById = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params || req.query || req.body || {};

        if (!id) {
            throw new AppError("Team member ID is required", 400);
        }

        const teamMember = await Team.findById(id);

        if (!teamMember) {
            throw new AppError(`No team member found with ID: ${id}`, 404);
        }

        return successResponse(res, 200, `Team member with ID: ${id} retrieved successfully`, teamMember);
    } catch (error) {
        console.error("Error in getTeamMemberById:", error);
        throw new AppError(`Failed to retrieve team member: ${error.message}`, 500);
    }
});


// Get team members by role

export const getTeamMembersByRole = asyncHandler(async (req, res, next) => {
    try {
        const { role } = req.params;

        if (!role || !validator.isAlpha(role.replace(/\s+/g, ''))) {
            throw new AppError("Invalid role parameter", 400);
        }

        const teamMembers = await Team.find({ role: role, isActive: true });

        if (!teamMembers || teamMembers.length === 0) {
            throw new AppError(`No team members found with role: ${role}`, 404);
        }

        return successResponse(res, 200, `Team members with role: ${role} retrieved successfully`, teamMembers);
    } catch (error) {
        console.error("Error in getTeamMembersByRole:", error);
        throw new AppError(`Failed to retrieve team members with role: ${error.message}`, 500);
    }
});