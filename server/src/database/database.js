/**
 * MongoDB connection helper.
 *
 * Connects to MongoDB Atlas using the connection URI and database name
 * from environment variables.  On failure the process exits with code 1
 * so the container/process manager can restart the service.
 *
 * Required environment variables:
 *   MONGO_URI – MongoDB Atlas SRV connection string (without the database name)
 *   DB_NAME   – Target database name appended to the URI
 *
 * Usage:
 *   import connectDB from './database/database.js';
 *   await connectDB();
 */
import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${process.env.DB_NAME}`);

        console.log("MongoDB Connected Securely");
    } catch (error) {
        console.error("MongoDB Error:", error.message);
        // Exit the process so the host can restart with a clean state
        process.exit(1);
    }
};

export default connectDB;
