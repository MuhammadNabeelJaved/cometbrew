/**
 * Express application setup.
 *
 * Configures and exports the Express app with:
 *  - CORS (origin controlled via CORS_ORIGIN env var, credentials allowed)
 *  - Helmet security headers
 *  - Rate limiting (100 req / 1 min per IP global; tighter limits per endpoint type)
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
import compression from "compression";
import errorHandler from "./middlewares/errorHandler.js";
import notFound from "./middlewares/notFound.js";
import { globalLimiter } from "./middlewares/rateLimiter.js";
import { sanitizeMongo, trimBody, preventHPP } from "./middlewares/sanitize.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { requestTracker } from "./middlewares/requestTracker.js";
import { configurePassport } from "./config/passport.js";


dotenv.config();
const app = express()

// Trust the first proxy hop (needed for accurate IP in rate-limiter behind Nginx/LB)
app.set("trust proxy", 1);


// ─── Security Headers (Helmet) ───────────────────────────────────────────────
// Helmet sets a suite of protective HTTP headers in one call.
// We customise Content-Security-Policy instead of using the aggressive default
// so that our own CDN assets and Socket.IO still work.
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc:     ["'self'"],
            scriptSrc:      ["'self'", "'unsafe-inline'"],   // vite dev needs unsafe-inline
            styleSrc:       ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc:        ["'self'", "https://fonts.gstatic.com"],
            imgSrc:         ["'self'", "data:", "https:", "blob:"],
            connectSrc:     ["'self'", "wss:", "https:"],    // websocket + API calls
            frameSrc:       ["https://www.google.com", "https://maps.google.com"],
            objectSrc:      ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false,  // required for Cloudinary images
    hsts: {
        maxAge:            31536000,   // 1 year
        includeSubDomains: true,
        preload:           true,
    },
}));

// ─── Compression ─────────────────────────────────────────────────────────────
// Gzip-compress all responses above 1KB — reduces JSON payload by 60-80%.
app.use(compression({ threshold: 1024 }));

// ─── CORS ───────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, cb) => {
        // Allow server-to-server requests (no origin) in non-production
        if (!origin && process.env.NODE_ENV !== "production") return cb(null, true);
        if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"],
}));

// ─── Global Rate Limiter ─────────────────────────────────────────────────────
// Applied to ALL routes — authenticated users are NOT exempt.
// Specific, tighter limiters are added at the route level (see rateLimiter.js).
app.use(globalLimiter);

// ─── Request Logging ─────────────────────────────────────────────────────────
app.use(requestLogger);

// ─── Performance Tracking ────────────────────────────────────────────────────
app.use(requestTracker);

// ─── Request Parsing ────────────────────────────────────────────────────────
app.use(cookieParser())
configurePassport(app);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// ─── Input Sanitization ──────────────────────────────────────────────────────
// Strip MongoDB operators ($, .) from body/query/params → NoSQL injection guard
app.use(sanitizeMongo);
// Trim leading/trailing whitespace from all top-level string body fields
app.use(trimBody);
// Collapse duplicate query params → HTTP Parameter Pollution guard
app.use(preventHPP);

// Serve files from the local upload directory (temp files before Cloudinary push)
app.use("/uploads", express.static(path.join(process.cwd(), "src/public/uploads")));


// ─── Route Groups ───────────────────────────────────────────────────────────
import User from "./models/usersModels/User.model.js";
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
import taskRoutes from "./routes/userRoutes/task.route.js";
import resourceRoutes from "./routes/userRoutes/resource.route.js";
import pageStatusRoutes from "./routes/userRoutes/pageStatus.route.js";
import announcementRoutes from "./routes/userRoutes/announcement.route.js";
import chatRoutes from "./routes/userRoutes/chat.route.js";
import notificationRoutes from "./routes/userRoutes/notification.route.js";
import databaseRoutes from "./routes/userRoutes/database.route.js";
import cookieConsentRoutes from "./routes/userRoutes/cookieConsent.route.js";
import supportTicketRoutes from "./routes/userRoutes/supportTicket.route.js";
import chatbotRoutes from "./routes/userRoutes/chatbot.route.js";
import liveChatRoutes from "./routes/userRoutes/liveChat.route.js";
import standupRoutes from "./routes/userRoutes/standup.route.js";
import healthRoutes from "./routes/userRoutes/health.route.js";

// ─── Dev-only Utilities ──────────────────────────────────────────────────────
// These endpoints are BLOCKED in production. They are only registered when
// NODE_ENV === "development" so they can never be called in a live environment.
if (process.env.NODE_ENV === "development") {

app.post("/api/v1/devpromote", async (req, res) => {
    const { email, role = "admin" } = req.body;
    const user = await User.findOneAndUpdate({ email }, { role, isVerified: true }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: `${email} -> ${role}`, role: user.role });
});

} // end NODE_ENV === "development" block

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
app.use("/api/v1/tasks", taskRoutes);                  // Team Kanban tasks
app.use("/api/v1/resources", resourceRoutes);          // Team shared resources (Cloudinary)
app.use("/api/v1/page-status", pageStatusRoutes);      // Public page status (maintenance / coming-soon)
app.use("/api/v1/announcements", announcementRoutes);  // Announcement bar (public GET, admin CRUD)
app.use("/api/v1/chat", chatRoutes);                  // Real-time chat (conversations, messages, uploads)
app.use("/api/v1/notifications", notificationRoutes); // Notification list, mark-read, clear
app.use("/api/v1/database", databaseRoutes);           // Admin database manager
app.use("/api/v1/consent", cookieConsentRoutes);       // GDPR cookie consent audit log
app.use("/api/v1/support-tickets", supportTicketRoutes); // User support tickets
app.use("/api/v1/chatbot",         chatbotRoutes);         // AI chatbot (public chat + admin management)
app.use("/api/v1/live-chat",       liveChatRoutes);        // Live chat handoff system
app.use("/api/v1/standup",         standupRoutes);          // Daily standup notes + availability status
app.use("/api/v1/health",          healthRoutes);           // Liveness probe + Web Vitals receiver

// ─── Error Handling ─────────────────────────────────────────────────────────

// Catch unmatched routes and forward a 404 AppError to errorHandler
app.use(notFound);

// Global error handler – normalises all errors into a consistent JSON response
app.use(errorHandler);

export default app
