import asyncHandler from "../../middlewares/asyncHandler.js"
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import adminProject from "../../models/usersModels/AdminProject.model.js";
import User from "../../models/usersModels/User.model.js";
import Project from "../../models/usersModels/Project.model.js"
import mongoose from "mongoose";


// Create a new project

export const createProject = asyncHandler(async (req, res, next) => {
    try {
        const { projectTitle, clientName, category, status, duration, yourRole, teamMembers, projectLead, projectDescription, projectGallery, clientFeedback, budget, startDate, endDate, deadline, priority, tags, isArchived, completionPercentage } = req.body;

        if (!projectTitle || !projectDescription || !projectLead || !teamMembers || !startDate || !endDate || !category || !status || !duration || !yourRole) {
            return next(new AppError('Please provide all required fields', 400));
        }

        const newProject = adminProject.create({
            projectTitle,
            category,
            status,
            duration,
            yourRole,
            teamMembers,
            projectLead,
            teamMembers,
            startDate,
            endDate,
            deadline,
            priority,
            tags,
            isArchived,
            completionPercentage
        });

        if (!newProject) {
            return next(new AppError('Project creation failed', 400));
        }

        return successResponse(res, 201, 'Project created successfully', newProject);



    } catch (error) {
        console.error(error);
        throw new AppError(`Server Error: ${error.message}`, 500);
    }

})

