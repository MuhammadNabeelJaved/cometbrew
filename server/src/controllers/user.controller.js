import asyncHandler from "../middlewares/asyncHandler.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";
import User from "../models/User.model.js";

// @desc    Register a new user
export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    console.log(name, email, password);

    if (!name || !email || !password) {
        throw new AppError("Name, email and password are required", 400);
    }

    const userExists = await User.findOne({
        $or: [{ email }, { name }],
    });
if (userExists) {
    throw new AppError("User already exists", 409);
}

const user = await User.create({ name, email, password });

successResponse(res, "User registered successfully", user, 201);
});