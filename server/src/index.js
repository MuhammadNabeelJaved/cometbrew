/**
 * Application entry point.
 *
 * Responsibilities:
 *  1. Override the system DNS resolver to use Google Public DNS (8.8.8.8 / 8.8.4.4).
 *     This is required because many ISP/router DNS servers do not support the SRV
 *     record lookups that MongoDB Atlas uses for connection string resolution.
 *  2. Load environment variables from `.env`.
 *  3. Connect to MongoDB via `connectDB()`.
 *  4. Start the Express HTTP server on the configured port.
 */
import dns from "dns"
import dotenv from "dotenv"
import connectDB from "./database/database.js"
import app from "./app.js"

// Override DNS before any network call — must be the very first action
// so that the subsequent mongoose.connect() SRV lookup succeeds.
dns.setServers(["8.8.8.8", "8.8.4.4"])

dotenv.config()
const PORT = process.env.PORT || 8000

// Connect to the database, then start the HTTP server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
}).catch((error) => {
    console.log("Error connecting to database")
    console.log(error.message)
    process.exit(1)
})
