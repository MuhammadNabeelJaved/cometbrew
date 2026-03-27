/**
 * Application entry point.
 *
 * Responsibilities:
 *  1. Override the system DNS resolver to use Google Public DNS (8.8.8.8 / 8.8.4.4).
 *     This is required because many ISP/router DNS servers do not support the SRV
 *     record lookups that MongoDB Atlas uses for connection string resolution.
 *  2. Load environment variables from `.env`.
 *  3. Connect to MongoDB via `connectDB()`.
 *  4. Create an HTTP server (required for Socket.IO to share the same port).
 *  5. Attach Socket.IO to the HTTP server.
 *  6. Start the HTTP server on the configured port.
 */
import dns from "dns";
import http from "http";
import dotenv from "dotenv";
import connectDB from "./database/database.js";
import app from "./app.js";
import { initSocket } from "./socket/socketServer.js";

// Override DNS before any network call — must be the very first action
// so that the subsequent mongoose.connect() SRV lookup succeeds.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();
const PORT = process.env.PORT || 8000;

// Create an HTTP server that wraps the Express app.
// Socket.IO attaches to this server — both share port 8000.
const httpServer = http.createServer(app);

// Initialise Socket.IO with the same CORS config as Express.
const io = await initSocket(httpServer, {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
});

// Make the Socket.IO instance accessible in controllers via req.app.get('io')
app.set("io", io);

// Connect to the database, then start the HTTP server
connectDB()
    .then(() => {
        httpServer.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Socket.IO is active on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.log("Error connecting to database");
        console.log(error.message);
        process.exit(1);
    });
