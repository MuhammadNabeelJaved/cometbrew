import dotenv, { parse } from "dotenv";
import express from "express"
import path from "path";
import cors from "cors"
import cookieParser from "cookie-parser"
import bodyParser from "body-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import errorHandler from "./middlewares/errorHandler.js";


dotenv.config();
const app = express()



app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(helmet());

// Apply rate limiting to all requests
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded())
// parse application/json
app.use(bodyParser.json({ limit: '50mb' }))
app.use(cookieParser())
// Increase the payload size limit (e.g., to 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "src/public/uploads")));


// Routes
import userRoutes from "./routes/userRoutes/user.route.js"
import projectRoutes from "./routes/userRoutes/project.route.js";
import contactRoutes from "./routes/userRoutes/contact.route.js"
import reviewRoutes from "./routes/userRoutes/reviews.route.js";
import homePageRoutes from "./routes/userRoutes/homePage.route.js";
import servicesRoutes from "./routes/userRoutes/services.route.js";

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/contacts", contactRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/homepage", homePageRoutes);
app.use("/api/v1/services", servicesRoutes);
// app.use(ApiError)


// 404
// app.use(notFound);

// Global Error
app.use(errorHandler);

export default app