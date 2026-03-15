/**
 * Express application setup.
 *
 * Configures and exports the Express app with:
 *  - CORS (origin controlled via CORS_ORIGIN env var, credentials allowed)
 *  - Helmet security headers
 *  - Rate limiting (100 req / 15 min per IP)
 *  - Cookie parser
 *  - JSON + URL-encoded body parsing (10 MB limit)
 *  - Static file serving for locally uploaded files
 *  - All API route groups under `/api/v1/`
 *  - 404 catch-all middleware
 *  - Global error handler
 */
import dotenv from "dotenv";
import express from "express"
import path from "path";
import cors from "cors"
import cookieParser from "cookie-parser"
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import errorHandler from "./middlewares/errorHandler.js";
import notFound from "./middlewares/notFound.js";


dotenv.config();
const app = express()


// ─── Security & Cross-Origin ────────────────────────────────────────────────

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true   // Allow cookies to be sent with cross-origin requests
}))

// Set secure HTTP headers (X-Content-Type-Options, HSTS, etc.)
app.use(helmet());

// Rate limiter – 100 requests per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// ─── Request Parsing ────────────────────────────────────────────────────────

app.use(cookieParser())
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve files from the local upload directory (temp files before Cloudinary push)
app.use("/uploads", express.static(path.join(process.cwd(), "src/public/uploads")));


// ─── Route Groups ───────────────────────────────────────────────────────────
import userRoutes from "./routes/userRoutes/user.route.js"
import projectRoutes from "./routes/userRoutes/project.route.js";
import contactRoutes from "./routes/userRoutes/contact.route.js"
import reviewRoutes from "./routes/userRoutes/reviews.route.js";
import homePageRoutes from "./routes/userRoutes/homePage.route.js";
import servicesRoutes from "./routes/userRoutes/services.route.js";
import jobsRoutes from "./routes/userRoutes/jobs.route.js";
import adminProjectRoutes from "./routes/userRoutes/adminProject.route.js";
import cmsRoutes from "./routes/userRoutes/cms.route.js";
import jobApplicationRoutes from "./routes/userRoutes/jobApplication.route.js";
import clientRoutes from "./routes/userRoutes/client.route.js";
import notificationRoutes from "./routes/userRoutes/notification.route.js";

app.use("/api/v1/users", userRoutes);               // Auth, profile, team
app.use("/api/v1/projects", projectRoutes);         // Client project requests
app.use("/api/v1/contacts", contactRoutes);         // Contact form submissions
app.use("/api/v1/reviews", reviewRoutes);           // Client reviews/testimonials
app.use("/api/v1/homepage", homePageRoutes);        // Homepage hero CMS
app.use("/api/v1/services", servicesRoutes);        // Agency services
app.use("/api/v1/jobs", jobsRoutes);                // Job postings
app.use("/api/v1/admin/projects", adminProjectRoutes); // Admin portfolio projects
app.use("/api/v1/cms", cmsRoutes);                  // Global CMS (logo, tech stack, etc.)
app.use("/api/v1/job-applications", jobApplicationRoutes); // Job applications
app.use("/api/v1/clients", clientRoutes);           // Agency client CRM
app.use("/api/v1/notifications", notificationRoutes); // User notifications

// ─── Error Handling ─────────────────────────────────────────────────────────

// Catch unmatched routes and forward a 404 AppError to errorHandler
app.use(notFound);

// Global error handler – normalises all errors into a consistent JSON response
app.use(errorHandler);

export default app
