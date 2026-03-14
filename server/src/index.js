import dns from "dns"
import dotenv from "dotenv"
import connectDB from "./database/database.js"
import app from "./app.js"

// Use Google DNS to resolve MongoDB Atlas SRV records
// (local ISP/router DNS blocks SRV queries)
dns.setServers(["8.8.8.8", "8.8.4.4"])

dotenv.config()
const PORT = process.env.PORT || 8000

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
}).catch((error) => {
    console.log("Error connecting to database")
    console.log(error.message)
    process.exit(1)
})
