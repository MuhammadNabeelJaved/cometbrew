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
    max: 1000, // limit each IP to 1000 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for authenticated API requests (dashboard usage)
        return !!req.headers.authorization || !!req.cookies?.accessToken;
    },
});
app.use(limiter);

// ─── Request Parsing ────────────────────────────────────────────────────────

app.use(cookieParser())
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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

// ⚠️ TEMP DEV-ONLY — REMOVE BEFORE PROD
// Seed endpoint — populates CMS, Hero, and Services with default data
// Only runs if each collection is currently empty (safe to call multiple times)
app.post("/api/v1/devseed", async (req, res) => {
    try {
        const CMS = (await import("./models/usersModels/CMS.model.js")).default;
        const HomePage = (await import("./models/usersModels/HomePageHero.js")).default;
        const Service = (await import("./models/usersModels/Services.model.js")).default;

        const results = [];
        const force = req.body.force === true;

        // ── Hero ──
        const heroCount = await HomePage.countDocuments();
        if (heroCount === 0 || force) {
            if (force) await HomePage.deleteMany({});
            await HomePage.create({
                statusBadge: "Accepting New Projects for 2026",
                titleLine1: "We Build",
                titleLine2: "Digital Excellence",
                subtitle: "The agency for forward-thinking brands. We combine AI-driven development with award-winning design to build products that scale.",
                ctaButtons: [
                    { text: "Start a Project", link: "/contact", isPrimary: true },
                    { text: "View Our Work", link: "/portfolio", isPrimary: false },
                ],
                isActive: true,
            });
            results.push("Hero: seeded");
        } else {
            results.push("Hero: already exists, skipped");
        }

        // ── CMS ──
        const cmsCount = await CMS.countDocuments();
        if (cmsCount === 0 || force) {
            if (force) await CMS.deleteMany({});
            await CMS.create({
                logoUrl: "https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/216147d0-06c1-4dee-8a5a-f933c6ef8556/1766429553723-26c2f3fe/N_Logo-01.png",
                techStack: [
                    {
                        categoryName: "Frontend & Experience",
                        items: [
                            { name: "React", iconKey: "ReactIcon", description: "UI Architecture", colorClass: "text-[#61DAFB]", order: 1 },
                            { name: "Next.js", iconKey: "NextJsIcon", description: "SSR Framework", colorClass: "text-foreground", order: 2 },
                            { name: "TypeScript", iconKey: "TypeScriptIcon", description: "Type Safety", colorClass: "text-[#3178C6]", order: 3 },
                            { name: "Tailwind CSS", iconKey: "TailwindIcon", description: "Styling Engine", colorClass: "text-[#06B6D4]", order: 4 },
                            { name: "Framer Motion", iconKey: "FramerIcon", description: "Motion & Animation", colorClass: "text-foreground", order: 5 },
                        ],
                    },
                    {
                        categoryName: "Backend & Data",
                        items: [
                            { name: "Node.js", iconKey: "NodeJsIcon", description: "Runtime", colorClass: "text-[#339933]", order: 1 },
                            { name: "Express", iconKey: "ExpressIcon", description: "Web Framework", colorClass: "text-foreground", order: 2 },
                            { name: "MongoDB", iconKey: "MongoDBIcon", description: "NoSQL Database", colorClass: "text-[#47A248]", order: 3 },
                            { name: "PostgreSQL", iconKey: "PostgresIcon", description: "Relational DB", colorClass: "text-[#4169E1]", order: 4 },
                            { name: "Redis", iconKey: "RedisIcon", description: "Caching", colorClass: "text-[#DC382D]", order: 5 },
                        ],
                    },
                    {
                        categoryName: "AI & Infrastructure",
                        items: [
                            { name: "OpenAI", iconKey: "OpenAIIcon", description: "LLM Engine", colorClass: "text-foreground", order: 1 },
                            { name: "AWS", iconKey: "AwsIcon", description: "Cloud Infrastructure", colorClass: "text-[#FF9900]", order: 2 },
                            { name: "Docker", iconKey: "DockerIcon", description: "Containers", colorClass: "text-[#2496ED]", order: 3 },
                            { name: "Vercel", iconKey: "VercelIcon", description: "Edge Deployment", colorClass: "text-foreground", order: 4 },
                            { name: "Cloudinary", iconKey: "CloudinaryIcon", description: "Media CDN", colorClass: "text-[#3448C5]", order: 5 },
                        ],
                    },
                ],
                conceptToReality: {
                    sectionBadge: "Our Process",
                    sectionTitle: "From Concept to Reality",
                    steps: [
                        { stepTitle: "Discovery & Strategy", description: "We dive deep into your business goals, target audience, and competitive landscape to craft a winning strategy.", iconName: "Search", gradientColor: "from-blue-500 to-cyan-400", bulletPoints: ["Market Analysis", "User Personas", "Technical Feasibility", "Project Roadmap"], order: 1 },
                        { stepTitle: "UX/UI Design", description: "Crafting intuitive interfaces that look stunning, feel natural, and convert visitors into customers.", iconName: "PenTool", gradientColor: "from-purple-500 to-pink-500", bulletPoints: ["Wireframing", "High-Fidelity Mockups", "Interactive Prototypes", "Design System"], order: 2 },
                        { stepTitle: "Development", description: "Building robust, scalable applications with clean code and modern engineering practices.", iconName: "Code2", gradientColor: "from-green-500 to-emerald-400", bulletPoints: ["Clean Code Architecture", "API Integration", "Performance Optimization", "Responsive Design"], order: 3 },
                        { stepTitle: "Quality Assurance", description: "Rigorous testing across devices and browsers to ensure a flawless, bug-free experience.", iconName: "LayoutTemplate", gradientColor: "from-orange-500 to-red-500", bulletPoints: ["Automated Testing", "Cross-Browser Checks", "Security Audits", "Load Testing"], order: 4 },
                        { stepTitle: "Launch & Scale", description: "Deploying your product and monitoring its growth with real-time analytics and post-launch support.", iconName: "Rocket", gradientColor: "from-indigo-500 to-violet-500", bulletPoints: ["CI/CD Pipelines", "Analytics Setup", "Post-Launch Support", "Performance Monitoring"], order: 5 },
                    ],
                },
                whyChooseUs: {
                    titleLine1: "Why forward-thinking companies",
                    titleLine2Highlighted: "choose us",
                    description: "We're not just a dev shop. We're your strategic partner in building digital products that stand out and deliver measurable business results.",
                    keyPoints: ["AI-First Development Approach", "Rapid Prototyping & Iteration", "Enterprise-Grade Security", "24/7 Support & Maintenance"],
                    scrollingCards: [
                        { title: "24/7 Support", description: "Round-the-clock support so you're never left stranded.", iconName: "Clock", order: 1 },
                        { title: "Top Security", description: "Enterprise-grade protection with SSL, audits & compliance.", iconName: "Shield", order: 2 },
                        { title: "Expert Team", description: "Top 1% of global talent handpicked for your project.", iconName: "Users", order: 3 },
                        { title: "Fast Delivery", description: "2x faster than industry average — without cutting corners.", iconName: "Zap", order: 4 },
                        { title: "Scalable Architecture", description: "Built to grow from MVP to millions of users seamlessly.", iconName: "Rocket", order: 5 },
                        { title: "Modern Tech Stack", description: "Always using the latest, battle-tested technologies.", iconName: "Code", order: 6 },
                        { title: "Transparent Process", description: "Real-time updates, weekly calls, and full visibility.", iconName: "Eye", order: 7 },
                        { title: "Results-Driven", description: "We measure success by your growth metrics, not just delivery.", iconName: "TrendingUp", order: 8 },
                    ],
                },
                contactInfo: {
                    address: "123 Tech Boulevard\nSan Francisco, CA 94107\nUnited States",
                    email: "hello@nabeel.agency",
                    phone: "+1 (555) 123-4567",
                    businessHours: "Monday – Friday\n9:00 AM – 6:00 PM PST",
                },
                socialLinks: {
                    twitter: "https://twitter.com/nabeelAgency",
                    linkedin: "https://linkedin.com/company/nabeel-agency",
                    instagram: "https://instagram.com/nabeelAgency",
                    github: "https://github.com/nabeelAgency",
                },
                testimonials: [
                    { content: "Working with Nabeel Agency was an absolute game-changer. They delivered our e-commerce platform in record time with exceptional quality. Our conversion rate jumped 40% after launch.", author: "Sarah Johnson", role: "CEO, TechVentures Inc.", rating: 5, order: 1 },
                    { content: "The team's expertise in AI integration is unmatched. They built a custom recommendation engine that increased our user engagement by 60%. Highly professional and results-driven.", author: "Michael Chen", role: "CTO, DataFlow Systems", rating: 5, order: 2 },
                    { content: "From design to deployment, the process was seamless. They understood our vision immediately and translated it into a stunning, high-performing website. Truly world-class work.", author: "Emma Williams", role: "Founder, StyleHouse", rating: 5, order: 3 },
                    { content: "Their mobile app development skills are exceptional. The app they built has over 50,000 active users and a 4.9 star rating on the App Store. Couldn't be happier.", author: "James Rodriguez", role: "Product Manager, FinTech Solutions", rating: 5, order: 4 },
                    { content: "We've worked with many agencies, but Nabeel Agency stands out for their communication, quality, and ability to solve complex problems. They're our go-to tech partner.", author: "Aisha Patel", role: "Director of Engineering, ScaleUp Labs", rating: 5, order: 5 },
                    { content: "The redesign of our SaaS dashboard reduced customer support tickets by 35%. The team truly understood UX and delivered beyond expectations on every front.", author: "David Kim", role: "Head of Product, CloudBase", rating: 5, order: 6 },
                ],
            });
            results.push("CMS: seeded (techStack, process, whyChooseUs, contactInfo, socialLinks, testimonials)");
        } else {
            results.push("CMS: already exists, skipped");
        }

        // ── Services ──
        const serviceCount = await Service.countDocuments();
        if (serviceCount === 0 || force) {
            if (force) await Service.deleteMany({});
            await Service.insertMany([
                {
                    title: "Web Development", slug: "web-development", subtitle: "Custom websites and web applications built to perform",
                    description: "We build high-performance, scalable web applications using the latest technologies. From simple landing pages to complex enterprise platforms, we deliver solutions that drive real business results.",
                    category: "web-development", isActive: true, isFeatured: true, order: 1, deliveryTime: "4–8 weeks",
                    heroSection: { badge: "Web Development", heading: "Web Applications That Scale", subheading: "From idea to production — fast, clean, and built to last.", ctaButton: { text: "Start Your Project", link: "/contact" }, secondaryButton: { text: "View Portfolio", link: "/portfolio" } },
                    metrics: [{ value: "150+", label: "Web Projects", icon: "Globe" }, { value: "99%", label: "Uptime SLA", icon: "Shield" }, { value: "2x", label: "Faster Delivery", icon: "Zap" }, { value: "40%", label: "Avg. Conversion Lift", icon: "TrendingUp" }],
                    features: [
                        { icon: "Code2", title: "Custom Web Apps", description: "Bespoke applications built exactly to your requirements, not templated solutions." },
                        { icon: "Zap", title: "Performance Optimized", description: "Sub-second load times with Lighthouse scores above 95 — for real." },
                        { icon: "Smartphone", title: "Fully Responsive", description: "Pixel-perfect experiences across every device, screen, and browser." },
                        { icon: "Lock", title: "Secure by Default", description: "OWASP best practices, SSL, CSRF protection, and security headers out of the box." },
                        { icon: "Database", title: "Scalable Architecture", description: "Architected to handle traffic spikes and grow alongside your business." },
                        { icon: "BarChart", title: "Analytics Ready", description: "GA4, Hotjar, and custom event tracking integrated from day one." },
                    ],
                    technologies: [{ name: "React" }, { name: "Next.js" }, { name: "Node.js" }, { name: "MongoDB" }, { name: "TypeScript" }, { name: "Tailwind CSS" }],
                    pricingPlans: [
                        { name: "Starter", price: { amount: 2500, currency: "USD", period: "one-time" }, description: "Perfect for small businesses and startups.", features: ["Up to 5 pages", "Responsive design", "Contact form", "Basic SEO setup", "1 month free support"], isPopular: false, ctaButton: { text: "Get Started", link: "/contact" } },
                        { name: "Business", price: { amount: 7500, currency: "USD", period: "one-time" }, description: "Ideal for growing businesses that need more power.", features: ["Up to 15 pages", "Custom CMS", "Advanced animations", "Full SEO optimization", "E-commerce ready", "3 months free support"], isPopular: true, ctaButton: { text: "Start Project", link: "/contact" } },
                        { name: "Enterprise", price: { amount: 0, currency: "USD", period: "custom" }, description: "For large-scale, complex web applications.", features: ["Unlimited pages", "Custom architecture", "AI/ML integrations", "Dedicated team", "SLA guarantee", "12 months support"], isPopular: false, ctaButton: { text: "Talk to Us", link: "/contact" } },
                    ],
                    faqs: [{ question: "How long does a typical web project take?", answer: "Most projects take 4–8 weeks depending on complexity. We'll give you an exact timeline after the discovery call.", order: 1 }, { question: "Do you provide hosting and maintenance?", answer: "Yes, we can set up hosting on AWS, Vercel, or any platform you prefer, and offer ongoing maintenance packages.", order: 2 }, { question: "Can you work with our existing codebase?", answer: "Absolutely. We regularly take over legacy codebases, audit them, and modernize or extend them.", order: 3 }],
                    ctaSection: { heading: "Ready to build something great?", subheading: "Let's talk about your project.", description: "Book a free 30-minute discovery call and we'll map out exactly how to bring your vision to life.", button: { text: "Book a Free Call", link: "/contact" }, contactEmail: "hello@nabeel.agency" },
                },
                {
                    title: "Mobile App Development", slug: "mobile-app", subtitle: "Native and cross-platform apps that users love",
                    description: "We craft beautiful, high-performance mobile applications for iOS and Android. Using React Native and modern tooling, we ship apps that feel native, scale effortlessly, and keep users coming back.",
                    category: "mobile-app", isActive: true, isFeatured: true, order: 2, deliveryTime: "8–16 weeks",
                    heroSection: { badge: "Mobile Development", heading: "Apps That Users Love", subheading: "iOS, Android, and everything in between — shipped fast.", ctaButton: { text: "Start Your App", link: "/contact" }, secondaryButton: { text: "See Our Apps", link: "/portfolio" } },
                    metrics: [{ value: "80+", label: "Apps Launched", icon: "Smartphone" }, { value: "4.8★", label: "Avg. App Store Rating", icon: "Star" }, { value: "2M+", label: "Total Downloads", icon: "Download" }, { value: "60%", label: "Avg. Retention Lift", icon: "TrendingUp" }],
                    features: [
                        { icon: "Smartphone", title: "Cross-Platform", description: "One codebase for iOS and Android using React Native — 95% code sharing, 100% native feel." },
                        { icon: "Zap", title: "Smooth Performance", description: "60fps animations and instant interactions — no compromise on performance." },
                        { icon: "Bell", title: "Push Notifications", description: "Smart, targeted push notifications to re-engage users at the right moment." },
                        { icon: "WifiOff", title: "Offline Support", description: "Full offline-first architecture so your app works even without connectivity." },
                        { icon: "Lock", title: "Secure Auth", description: "Biometric login, OAuth, and secure token storage built into every app." },
                        { icon: "BarChart", title: "In-App Analytics", description: "Track every user action to understand behavior and optimize your product." },
                    ],
                    technologies: [{ name: "React Native" }, { name: "TypeScript" }, { name: "Expo" }, { name: "Node.js" }, { name: "Firebase" }],
                    pricingPlans: [
                        { name: "MVP", price: { amount: 8000, currency: "USD", period: "one-time" }, description: "Launch fast and validate your idea.", features: ["Core features only", "iOS + Android", "Basic authentication", "API integration", "App Store submission", "1 month support"], isPopular: false, ctaButton: { text: "Build My MVP", link: "/contact" } },
                        { name: "Full App", price: { amount: 20000, currency: "USD", period: "one-time" }, description: "A full-featured production-ready app.", features: ["Unlimited features", "iOS + Android", "Push notifications", "Offline support", "Admin dashboard", "Analytics", "3 months support"], isPopular: true, ctaButton: { text: "Start Building", link: "/contact" } },
                        { name: "Enterprise", price: { amount: 0, currency: "USD", period: "custom" }, description: "Complex apps at scale with dedicated teams.", features: ["Custom architecture", "Dedicated dev team", "White-label options", "Security compliance", "SLA guarantee", "12 months support"], isPopular: false, ctaButton: { text: "Contact Sales", link: "/contact" } },
                    ],
                    faqs: [{ question: "Do you build for both iOS and Android?", answer: "Yes, we build cross-platform apps using React Native that run natively on both platforms from a single codebase.", order: 1 }, { question: "How do you handle App Store submission?", answer: "We handle the entire submission process for both the Apple App Store and Google Play Store as part of every project.", order: 2 }],
                    ctaSection: { heading: "Have an app idea?", subheading: "Let's turn it into reality.", description: "From concept to the App Store — we'll guide you every step of the way.", button: { text: "Book a Free Call", link: "/contact" }, contactEmail: "hello@nabeel.agency" },
                },
                {
                    title: "E-Commerce Solutions", slug: "ecommerce", subtitle: "Online stores built to sell — beautifully and efficiently",
                    description: "We build high-converting online stores that are fast, secure, and easy to manage. Whether you need a Shopify customization, a headless commerce build, or a fully custom platform, we deliver results.",
                    category: "ecommerce", isActive: true, isFeatured: false, order: 3, deliveryTime: "6–12 weeks",
                    heroSection: { badge: "E-Commerce", heading: "Online Stores That Convert", subheading: "Beautiful storefronts backed by powerful commerce engines.", ctaButton: { text: "Launch My Store", link: "/contact" }, secondaryButton: { text: "See Examples", link: "/portfolio" } },
                    metrics: [{ value: "40+", label: "Stores Launched", icon: "ShoppingCart" }, { value: "40%", label: "Avg. Conversion Lift", icon: "TrendingUp" }, { value: "$2M+", label: "Revenue Generated", icon: "DollarSign" }, { value: "99.9%", label: "Uptime", icon: "Shield" }],
                    features: [
                        { icon: "ShoppingCart", title: "Seamless Checkout", description: "Streamlined, one-click checkout flows that reduce cart abandonment significantly." },
                        { icon: "CreditCard", title: "Payment Integration", description: "Stripe, PayPal, Apple Pay, and 50+ payment gateways integrated out of the box." },
                        { icon: "Package", title: "Inventory Management", description: "Real-time stock tracking with low-stock alerts and automated reorder points." },
                        { icon: "Search", title: "SEO Optimized", description: "Product schema, sitemaps, and speed optimizations for maximum organic visibility." },
                        { icon: "Globe", title: "Multi-Currency", description: "Sell globally with automatic currency conversion and localized pricing." },
                        { icon: "BarChart", title: "Sales Analytics", description: "Detailed dashboards showing revenue, AOV, customer LTV, and more." },
                    ],
                    technologies: [{ name: "Next.js" }, { name: "Shopify" }, { name: "Stripe" }, { name: "MongoDB" }, { name: "Algolia" }],
                    pricingPlans: [
                        { name: "Starter Store", price: { amount: 3500, currency: "USD", period: "one-time" }, description: "For small businesses launching their first store.", features: ["Up to 100 products", "Shopify setup", "Custom theme", "Payment gateway", "Mobile responsive", "1 month support"], isPopular: false, ctaButton: { text: "Launch My Store", link: "/contact" } },
                        { name: "Growth Store", price: { amount: 12000, currency: "USD", period: "one-time" }, description: "For brands ready to scale their online sales.", features: ["Unlimited products", "Headless commerce", "Custom checkout", "Advanced SEO", "Loyalty program", "Multi-currency", "3 months support"], isPopular: true, ctaButton: { text: "Start Building", link: "/contact" } },
                        { name: "Enterprise", price: { amount: 0, currency: "USD", period: "custom" }, description: "High-volume stores with custom requirements.", features: ["Custom platform", "ERP integration", "Dedicated infra", "SLA guarantee", "Custom analytics", "12 months support"], isPopular: false, ctaButton: { text: "Talk to Sales", link: "/contact" } },
                    ],
                    faqs: [{ question: "Shopify vs custom build — which is right for me?", answer: "Shopify is great for standard stores launching quickly. Custom builds are better for unique requirements or when you need full control.", order: 1 }, { question: "Can you migrate my existing store?", answer: "Yes, we handle full migrations including products, customers, orders, and SEO redirects — with zero downtime.", order: 2 }],
                    ctaSection: { heading: "Ready to sell online?", subheading: "Let's build your store.", description: "Book a free consultation and we'll recommend the best approach for your business.", button: { text: "Book Free Consultation", link: "/contact" }, contactEmail: "hello@nabeel.agency" },
                },
                {
                    title: "UI/UX Design", slug: "design", subtitle: "Interfaces that are beautiful, intuitive, and conversion-focused",
                    description: "Our designers craft interfaces that don't just look stunning — they guide users effortlessly towards their goals. From brand identity to interactive prototypes, we bridge the gap between aesthetics and performance.",
                    category: "design", isActive: true, isFeatured: false, order: 4, deliveryTime: "2–6 weeks",
                    heroSection: { badge: "UI/UX Design", heading: "Design That Converts", subheading: "Beautiful interfaces built on data, empathy, and pixel-perfect craft.", ctaButton: { text: "Start Design Project", link: "/contact" }, secondaryButton: { text: "View Design Work", link: "/portfolio" } },
                    metrics: [{ value: "200+", label: "Screens Designed", icon: "Layout" }, { value: "95", label: "Avg. Satisfaction Score", icon: "Star" }, { value: "35%", label: "Avg. Engagement Lift", icon: "TrendingUp" }, { value: "2x", label: "Faster User Onboarding", icon: "Zap" }],
                    features: [
                        { icon: "Layout", title: "UX Research", description: "User interviews, competitive analysis, and journey mapping to guide every design decision." },
                        { icon: "PenTool", title: "UI Design", description: "High-fidelity mockups in Figma with pixel-perfect attention to every detail." },
                        { icon: "Layers", title: "Design Systems", description: "Scalable component libraries and style guides your dev team will love." },
                        { icon: "Play", title: "Interactive Prototypes", description: "Clickable prototypes for user testing before a single line of code is written." },
                        { icon: "Palette", title: "Brand Identity", description: "Logo, color palette, typography, and full brand guidelines that communicate your values." },
                        { icon: "Monitor", title: "Responsive Design", description: "Every design is built to look perfect across desktop, tablet, and mobile." },
                    ],
                    technologies: [{ name: "Figma" }, { name: "Adobe XD" }, { name: "Framer" }, { name: "Lottie" }],
                    pricingPlans: [
                        { name: "Brand Kit", price: { amount: 1500, currency: "USD", period: "one-time" }, description: "Get a professional brand identity.", features: ["Logo design (3 concepts)", "Color palette", "Typography system", "Brand guidelines PDF", "Source files included"], isPopular: false, ctaButton: { text: "Get My Brand Kit", link: "/contact" } },
                        { name: "Full UI/UX", price: { amount: 5000, currency: "USD", period: "one-time" }, description: "Complete design for your product.", features: ["UX research", "Wireframes", "High-fidelity UI", "Interactive prototype", "Design system", "Handoff to dev"], isPopular: true, ctaButton: { text: "Start Design", link: "/contact" } },
                        { name: "Design Partner", price: { amount: 3000, currency: "USD", period: "monthly" }, description: "Ongoing design support for your team.", features: ["Unlimited design requests", "48h turnaround", "Dedicated designer", "Figma access", "Weekly sync calls"], isPopular: false, ctaButton: { text: "Become a Partner", link: "/contact" } },
                    ],
                    faqs: [{ question: "What deliverables do I get?", answer: "You receive Figma source files, exported assets, design system documentation, and a developer handoff package.", order: 1 }, { question: "How many revision rounds are included?", answer: "All packages include unlimited revisions until you're 100% satisfied.", order: 2 }],
                    ctaSection: { heading: "Let's design something beautiful.", subheading: "Great design is a competitive advantage.", description: "Schedule a design consultation and we'll show you what's possible.", button: { text: "Book Design Consultation", link: "/contact" }, contactEmail: "hello@nabeel.agency" },
                },
                {
                    title: "Digital Strategy & Consulting", slug: "consulting", subtitle: "Strategic guidance to accelerate your digital growth",
                    description: "We help businesses navigate the complex digital landscape with expert consulting in technology strategy, digital transformation, and AI adoption. Our battle-tested frameworks help you move faster, spend smarter, and build better.",
                    category: "consulting", isActive: true, isFeatured: false, order: 5, deliveryTime: "1–4 weeks",
                    heroSection: { badge: "Consulting", heading: "Strategy That Drives Growth", subheading: "Expert guidance to help you build, scale, and dominate digitally.", ctaButton: { text: "Book a Strategy Call", link: "/contact" }, secondaryButton: { text: "Learn More", link: "/about" } },
                    metrics: [{ value: "50+", label: "Companies Advised", icon: "Building" }, { value: "3x", label: "Avg. ROI Improvement", icon: "TrendingUp" }, { value: "30%", label: "Avg. Cost Reduction", icon: "DollarSign" }, { value: "100%", label: "Client Satisfaction", icon: "Star" }],
                    features: [
                        { icon: "Map", title: "Technology Roadmap", description: "A clear 12–24 month plan for your technology investments with prioritized initiatives." },
                        { icon: "Cpu", title: "AI Integration Strategy", description: "Identify where AI can reduce costs, increase revenue, or create competitive moats." },
                        { icon: "RefreshCw", title: "Digital Transformation", description: "End-to-end transformation planning from legacy systems to modern cloud architecture." },
                        { icon: "DollarSign", title: "Tech Audit & Cost Optimization", description: "Deep dive into your existing tech stack to eliminate waste and improve efficiency." },
                        { icon: "Users", title: "Team Structure Advisory", description: "Build the right engineering team structure for your stage and growth trajectory." },
                        { icon: "BarChart", title: "KPI & Analytics Framework", description: "Define the metrics that matter and build dashboards to track them in real time." },
                    ],
                    technologies: [{ name: "Notion" }, { name: "Miro" }, { name: "Datadog" }],
                    pricingPlans: [
                        { name: "Strategy Sprint", price: { amount: 2000, currency: "USD", period: "one-time" }, description: "A focused 2-week engagement for specific problems.", features: ["2-week engagement", "Discovery workshops", "Problem diagnosis", "Actionable roadmap", "1 follow-up call"], isPopular: false, ctaButton: { text: "Book Sprint", link: "/contact" } },
                        { name: "Growth Advisory", price: { amount: 5000, currency: "USD", period: "monthly" }, description: "Ongoing strategic support for scaling companies.", features: ["Weekly strategy calls", "Tech stack review", "Hiring advisory", "Vendor selection", "KPI dashboard setup", "Slack access"], isPopular: true, ctaButton: { text: "Start Advisory", link: "/contact" } },
                        { name: "Fractional CTO", price: { amount: 10000, currency: "USD", period: "monthly" }, description: "Senior tech leadership without the full-time cost.", features: ["20 hrs/week availability", "Board presentations", "Team leadership", "Architecture decisions", "Investor due diligence", "Full access"], isPopular: false, ctaButton: { text: "Hire Fractional CTO", link: "/contact" } },
                    ],
                    faqs: [{ question: "What makes your consulting different?", answer: "We're builders first, consultants second. Every recommendation comes from hands-on experience shipping products — not just theoretical frameworks.", order: 1 }, { question: "Do you only work with tech startups?", answer: "No. We work with startups, SMEs, and enterprises across all industries that are serious about digital transformation.", order: 2 }],
                    ctaSection: { heading: "Ready to accelerate your growth?", subheading: "Let's talk strategy.", description: "Book a free 30-minute discovery call and walk away with at least 3 actionable insights.", button: { text: "Book Free Strategy Call", link: "/contact" }, contactEmail: "hello@nabeel.agency" },
                },
            ]);
            results.push("Services: 5 services seeded (Web Dev, Mobile, E-Commerce, Design, Consulting)");
        } else {
            results.push(`Services: ${serviceCount} already exist, skipped`);
        }

        // ── AdminProjects ──
        const adminProject = (await import("./models/usersModels/AdminProject.model.js")).default;
        const User = (await import("./models/usersModels/User.model.js")).default;

        const projectCount = await adminProject.countDocuments();
        if (projectCount === 0 || force) {
            if (force) await adminProject.deleteMany({});
            const adminUser = await User.findOne({ role: 'admin' });
            if (!adminUser) {
                results.push("AdminProjects: skipped (no admin user found — create an admin account first)");
            } else {
                const uid = adminUser._id;
                await adminProject.insertMany([
                    {
                        projectTitle: "FinTech Dashboard",
                        clientName: "FinTech Innovations Ltd",
                        category: "Web App",
                        status: "Completed",
                        isPublic: true,
                        yourRole: "Full Stack Developer",
                        projectLead: uid,
                        teamMembers: [{ memberId: uid, role: "Lead", isLead: true }],
                        createdBy: uid,
                        projectDescription: "A comprehensive financial analytics dashboard providing real-time portfolio tracking, advanced charting with D3.js, and AI-powered investment insights. Reduced manual reporting time by 70% for a mid-size investment firm.",
                        techStack: ["React", "TypeScript", "D3.js", "Node.js"],
                        tags: ["fintech", "dashboard", "analytics", "data-visualization", "real-time"],
                        priority: "High",
                        startDate: new Date("2024-01-10"),
                        endDate: new Date("2024-05-15"),
                        completionPercentage: 100,
                        budget: { amount: 18000, currency: "USD" },
                        projectGallery: [{ url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop", filename: "fintech-dashboard.jpg", caption: "Main dashboard view" }],
                    },
                    {
                        projectTitle: "E-Commerce Platform",
                        clientName: "StyleHouse Fashion",
                        category: "Web App",
                        status: "Completed",
                        isPublic: true,
                        yourRole: "Full Stack Developer",
                        projectLead: uid,
                        teamMembers: [{ memberId: uid, role: "Lead", isLead: true }],
                        createdBy: uid,
                        projectDescription: "A full-featured headless e-commerce platform built with Next.js and Stripe, featuring advanced product filtering, wishlist management, and a seamless multi-step checkout. Increased the client's conversion rate by 38% post-launch.",
                        techStack: ["Next.js", "Stripe", "MongoDB", "Tailwind CSS"],
                        tags: ["ecommerce", "nextjs", "stripe", "headless", "fashion"],
                        priority: "High",
                        startDate: new Date("2024-02-01"),
                        endDate: new Date("2024-06-30"),
                        completionPercentage: 100,
                        budget: { amount: 14000, currency: "USD" },
                        projectGallery: [{ url: "https://images.unsplash.com/photo-1661956602116-aa6865609028?q=80&w=2064&auto=format&fit=crop", filename: "ecommerce-platform.jpg", caption: "Product listing page" }],
                    },
                    {
                        projectTitle: "Health Tracker App",
                        clientName: "VitaLife Health",
                        category: "Mobile App",
                        status: "Completed",
                        isPublic: true,
                        yourRole: "Mobile Developer",
                        projectLead: uid,
                        teamMembers: [{ memberId: uid, role: "Lead", isLead: true }],
                        createdBy: uid,
                        projectDescription: "A cross-platform health and fitness tracking app with wearable device integrations, personalized AI workout recommendations, and a social challenges feature. Achieved 4.8 stars on the App Store within the first month of launch.",
                        techStack: ["React Native", "TypeScript", "Firebase"],
                        tags: ["mobile", "health", "fitness", "react-native", "AI"],
                        priority: "High",
                        startDate: new Date("2024-01-20"),
                        endDate: new Date("2024-07-10"),
                        completionPercentage: 100,
                        budget: { amount: 22000, currency: "USD" },
                        projectGallery: [{ url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop", filename: "health-tracker.jpg", caption: "App dashboard screen" }],
                    },
                    {
                        projectTitle: "Luxury Hotel Website",
                        clientName: "Grand Meridian Hotels",
                        category: "Web App",
                        status: "Completed",
                        isPublic: true,
                        yourRole: "Frontend Developer",
                        projectLead: uid,
                        teamMembers: [{ memberId: uid, role: "Lead", isLead: true }],
                        createdBy: uid,
                        projectDescription: "An immersive luxury hotel website with cinematic animations powered by Framer Motion, a Sanity CMS-driven content backend, and a fully custom room booking flow. Directly boosted direct bookings by 52%, reducing reliance on third-party OTA platforms.",
                        techStack: ["Next.js", "Framer Motion", "Sanity CMS"],
                        tags: ["hospitality", "luxury", "animations", "cms", "booking"],
                        priority: "High",
                        startDate: new Date("2024-03-01"),
                        endDate: new Date("2024-06-15"),
                        completionPercentage: 100,
                        budget: { amount: 11000, currency: "USD" },
                        projectGallery: [{ url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop", filename: "hotel-website.jpg", caption: "Homepage hero section" }],
                    },
                    {
                        projectTitle: "SaaS Analytics Platform",
                        clientName: "DataFlow Systems",
                        category: "Web App",
                        status: "Completed",
                        isPublic: true,
                        yourRole: "Full Stack Developer",
                        projectLead: uid,
                        teamMembers: [{ memberId: uid, role: "Lead", isLead: true }],
                        createdBy: uid,
                        projectDescription: "A multi-tenant SaaS analytics platform with customizable dashboards, event ingestion pipeline, and automated reporting. Built on a Vue.js frontend with a Python/FastAPI backend, deployed in Dockerised microservices on AWS ECS.",
                        techStack: ["Vue.js", "Python", "PostgreSQL", "Docker"],
                        tags: ["saas", "analytics", "multi-tenant", "python", "docker"],
                        priority: "High",
                        startDate: new Date("2023-10-01"),
                        endDate: new Date("2024-04-30"),
                        completionPercentage: 100,
                        budget: { amount: 35000, currency: "USD" },
                        projectGallery: [{ url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop", filename: "saas-analytics.jpg", caption: "Analytics overview dashboard" }],
                    },
                    {
                        projectTitle: "Food Delivery App",
                        clientName: "QuickBite Technologies",
                        category: "Mobile App",
                        status: "Completed",
                        isPublic: true,
                        yourRole: "Mobile Developer",
                        projectLead: uid,
                        teamMembers: [{ memberId: uid, role: "Lead", isLead: true }],
                        createdBy: uid,
                        projectDescription: "A feature-rich food delivery app built with Flutter, offering real-time GPS order tracking via Google Maps, push notification updates, and a restaurant management panel. Scaled to over 10,000 active users within the first quarter.",
                        techStack: ["Flutter", "Firebase", "Node.js", "Google Maps API"],
                        tags: ["mobile", "flutter", "food-delivery", "maps", "real-time"],
                        priority: "High",
                        startDate: new Date("2023-11-01"),
                        endDate: new Date("2024-05-01"),
                        completionPercentage: 100,
                        budget: { amount: 28000, currency: "USD" },
                        projectGallery: [{ url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1981&auto=format&fit=crop", filename: "food-delivery.jpg", caption: "Food browsing screen" }],
                    },
                    {
                        projectTitle: "AI Writing Assistant",
                        clientName: "ContentFlow Inc",
                        category: "Web App",
                        status: "Completed",
                        isPublic: true,
                        yourRole: "Full Stack Developer",
                        projectLead: uid,
                        teamMembers: [{ memberId: uid, role: "Lead", isLead: true }],
                        createdBy: uid,
                        projectDescription: "A browser-based AI writing assistant powered by the OpenAI API, featuring real-time suggestions, tone analysis, SEO scoring, and a collaborative editing mode. Reduced average content creation time by 60% for marketing teams at scale.",
                        techStack: ["React", "OpenAI API", "Python", "FastAPI"],
                        tags: ["AI", "writing", "openai", "productivity", "saas"],
                        priority: "High",
                        startDate: new Date("2024-04-01"),
                        endDate: new Date("2024-08-15"),
                        completionPercentage: 100,
                        budget: { amount: 20000, currency: "USD" },
                        projectGallery: [{ url: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?q=80&w=2032&auto=format&fit=crop", filename: "ai-writing.jpg", caption: "AI writing interface" }],
                    },
                    {
                        projectTitle: "Real Estate Platform",
                        clientName: "Prime Properties Group",
                        category: "Web App",
                        status: "In Progress",
                        isPublic: true,
                        yourRole: "Full Stack Developer",
                        projectLead: uid,
                        teamMembers: [{ memberId: uid, role: "Lead", isLead: true }],
                        createdBy: uid,
                        projectDescription: "A modern real estate marketplace with interactive Mapbox-powered property maps, advanced search filters, virtual tour integrations, and a Stripe-powered application fee system. Currently in active development with a phased launch planned.",
                        techStack: ["Next.js", "Mapbox", "PostgreSQL", "Stripe"],
                        tags: ["real-estate", "maps", "marketplace", "property", "stripe"],
                        priority: "High",
                        startDate: new Date("2024-06-01"),
                        completionPercentage: 65,
                        budget: { amount: 40000, currency: "USD" },
                        projectGallery: [{ url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop", filename: "real-estate.jpg", caption: "Property map view" }],
                    },
                ]);
                results.push("AdminProjects: 8 portfolio projects seeded");
            }
        } else {
            results.push(`AdminProjects: ${projectCount} already exist, skipped`);
        }

        // ── Team Members ──
        const teamCount = await User.countDocuments({ role: { $in: ['team'] } });
        if (teamCount === 0 || force) {
            if (force) await User.deleteMany({ role: 'team' });
            const teamSeedData = [
                {
                    name: "Ali Hassan",
                    email: "ali@nabeel.agency",
                    password: "TeamMember@123",
                    role: "team",
                    isVerified: true,
                    isActive: true,
                    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
                    teamProfile: {
                        position: "Lead Frontend Developer",
                        department: "Development",
                        bio: "Passionate React and TypeScript developer with 6 years of experience building high-performance web applications. Loves clean code and pixel-perfect UIs.",
                        phone: "+92 300 1234567",
                        skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "GraphQL"],
                        experience: "6 years",
                        status: "Active",
                        memberRole: "Team Lead",
                        featured: true,
                        displayOrder: 1,
                        socialLinks: { github: "https://github.com/alihassan", linkedin: "https://linkedin.com/in/alihassan" },
                    },
                },
                {
                    name: "Sara Ahmed",
                    email: "sara@nabeel.agency",
                    password: "TeamMember@123",
                    role: "team",
                    isVerified: true,
                    isActive: true,
                    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
                    teamProfile: {
                        position: "Senior UI/UX Designer",
                        department: "Design",
                        bio: "Creative designer specializing in product design and design systems. 5 years of crafting beautiful, intuitive interfaces that delight users and drive business results.",
                        phone: "+92 301 2345678",
                        skills: ["Figma", "Adobe XD", "Prototyping", "Design Systems", "User Research"],
                        experience: "5 years",
                        status: "Active",
                        memberRole: "Member",
                        featured: true,
                        displayOrder: 2,
                        socialLinks: { linkedin: "https://linkedin.com/in/saraahmed", twitter: "https://twitter.com/saraahmed_ux" },
                    },
                },
                {
                    name: "Umar Farooq",
                    email: "umar@nabeel.agency",
                    password: "TeamMember@123",
                    role: "team",
                    isVerified: true,
                    isActive: true,
                    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
                    teamProfile: {
                        position: "Backend Developer",
                        department: "Development",
                        bio: "Node.js and MongoDB specialist with a passion for building scalable APIs and microservices. 4 years experience in backend architecture and cloud deployments.",
                        phone: "+92 302 3456789",
                        skills: ["Node.js", "Express", "MongoDB", "PostgreSQL", "AWS", "Docker"],
                        experience: "4 years",
                        status: "Active",
                        memberRole: "Member",
                        featured: false,
                        displayOrder: 3,
                        socialLinks: { github: "https://github.com/umarfarooq" },
                    },
                },
                {
                    name: "Ayesha Khan",
                    email: "ayesha@nabeel.agency",
                    password: "TeamMember@123",
                    role: "team",
                    isVerified: true,
                    isActive: true,
                    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
                    teamProfile: {
                        position: "Digital Marketing Manager",
                        department: "Marketing",
                        bio: "Data-driven marketing strategist with expertise in SEO, content marketing, and paid advertising. Helped clients achieve 3x ROI on digital campaigns.",
                        phone: "+92 303 4567890",
                        skills: ["SEO", "Google Ads", "Content Strategy", "Analytics", "Social Media"],
                        experience: "4 years",
                        status: "Active",
                        memberRole: "Manager",
                        featured: false,
                        displayOrder: 4,
                        socialLinks: { linkedin: "https://linkedin.com/in/ayeshakhan", twitter: "https://twitter.com/ayeshakhan_mktg" },
                    },
                },
                {
                    name: "Bilal Raza",
                    email: "bilal@nabeel.agency",
                    password: "TeamMember@123",
                    role: "team",
                    isVerified: true,
                    isActive: true,
                    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
                    teamProfile: {
                        position: "Mobile App Developer",
                        department: "Development",
                        bio: "React Native specialist who has shipped 20+ apps to the App Store and Google Play. Expert in performance optimization and offline-first architecture.",
                        phone: "+92 304 5678901",
                        skills: ["React Native", "Expo", "TypeScript", "Firebase", "Redux"],
                        experience: "3 years",
                        status: "On Leave",
                        memberRole: "Member",
                        featured: false,
                        displayOrder: 5,
                        socialLinks: { github: "https://github.com/bilalraza" },
                    },
                },
            ];
            await User.create(teamSeedData);
            results.push("TeamMembers: 5 team members seeded");
        } else {
            results.push(`TeamMembers: ${teamCount} already exist, skipped`);
        }

        // ── Clients ──
        const Client = (await import("./models/usersModels/Client.model.js")).default;
        const clientCount = await Client.countDocuments({ isArchived: false });
        if (clientCount === 0 || force) {
            if (force) await Client.deleteMany({});
            const adminUser = await User.findOne({ role: "admin" });
            if (!adminUser) {
                results.push("Clients: skipped (no admin user found — create an admin account first)");
            } else {
                const uid = adminUser._id;
                const teamMembers = await User.find({ role: "team" }).limit(3);
                const mgr1 = teamMembers[0]?._id || uid;
                const mgr2 = teamMembers[1]?._id || uid;
                const mgr3 = teamMembers[2]?._id || uid;

                await Client.insertMany([
                    { companyName: "FinTech Innovations Ltd", contactName: "James Carter", email: "james.carter@fintech-innovations.io", phone: "+1 (415) 234-5678", industry: "Financial Technology", status: "Active", website: "https://fintech-innovations.io", notes: "Long-term partner. Phase 2 of the analytics dashboard underway. Very satisfied with delivery speed.", totalRevenue: 85000, accountManager: mgr1, createdBy: uid },
                    { companyName: "StyleHouse Fashion", contactName: "Olivia Bennett", email: "olivia@stylehouse.co", phone: "+44 20 7946 0123", industry: "E-Commerce / Fashion", status: "Active", website: "https://stylehouse.co", notes: "Recurring client. E-commerce redesign completed Q1. Planning mobile app expansion.", totalRevenue: 62000, accountManager: mgr2, createdBy: uid },
                    { companyName: "MedCore Health Systems", contactName: "Dr. Aaron Patel", email: "aaron.patel@medcore.health", phone: "+1 (312) 789-0123", industry: "Healthcare", status: "Onboarding", website: "https://medcore.health", notes: "New client. HIPAA-compliant patient portal. Kickoff call scheduled next week.", totalRevenue: 0, accountManager: mgr3, createdBy: uid },
                    { companyName: "EduSpark Learning", contactName: "Maria Gonzalez", email: "mgonzalez@eduspark.edu", phone: "+1 (213) 456-7890", industry: "Education Technology", status: "Active", website: "https://eduspark.edu", notes: "LMS integration completed. Exploring AI-powered tutoring features for phase 2.", totalRevenue: 48000, accountManager: mgr1, createdBy: uid },
                    { companyName: "GreenEarth Logistics", contactName: "Tom Weir", email: "tom.weir@greenearth-logistics.com", phone: "+49 30 12345678", industry: "Logistics & Supply Chain", status: "Active", website: "https://greenearth-logistics.com", notes: "Fleet tracking dashboard delivered. Discussing IoT integration for real-time cargo monitoring.", totalRevenue: 37500, accountManager: mgr2, createdBy: uid },
                    { companyName: "Nexus Real Estate Group", contactName: "Patricia Wong", email: "pwong@nexusrealestate.com", phone: "+1 (646) 555-0987", industry: "Real Estate", status: "Active", website: "https://nexusrealestate.com", notes: "Phase 1 (property listings) live. Phase 2 (offers & virtual tours) in progress.", totalRevenue: 54000, accountManager: mgr3, createdBy: uid },
                    { companyName: "ContentFlow Inc", contactName: "Derek Hall", email: "derek@contentflow.io", phone: "+1 (512) 678-4321", industry: "SaaS / Content Marketing", status: "Inactive", website: "https://contentflow.io", notes: "Project delivered Q2. Client went in-house. May re-engage for v2 later this year.", totalRevenue: 20000, accountManager: mgr1, createdBy: uid },
                    { companyName: "SpeedDine Food Tech", contactName: "Amara Johnson", email: "amara@speeddine.app", phone: "+1 (305) 789-2345", industry: "Food & Delivery Tech", status: "Onboarding", website: "https://speeddine.app", notes: "Rebuilding driver app from React Native to Flutter. Discovery phase ongoing.", totalRevenue: 0, accountManager: mgr2, createdBy: uid },
                    { companyName: "Prime Properties Group", contactName: "Lucas Braun", email: "lucas@primeprop.de", phone: "+49 89 45678901", industry: "Real Estate", status: "Active", website: "https://primeprop.de", notes: "German real estate client. Virtual tour integration live. Strong long-term partnership potential.", totalRevenue: 31000, accountManager: mgr3, createdBy: uid },
                    { companyName: "DataSphere Analytics", contactName: "Nina Ross", email: "nina.ross@datasphere.ai", phone: "+1 (628) 901-2345", industry: "Artificial Intelligence / Data", status: "Churned", website: "https://datasphere.ai", notes: "Churned after budget cuts in Q3. Completed MVP data dashboard. Keep warm for future re-engagement.", totalRevenue: 15500, accountManager: mgr1, createdBy: uid },
                ]);
                results.push("Clients: 10 dummy clients seeded");
            }
        } else {
            results.push(`Clients: ${clientCount} already exist, skipped`);
        }

        // ── Resources ──
        const Resource = (await import("./models/usersModels/Resource.model.js")).default;
        const resourceCount = await Resource.countDocuments();
        if (resourceCount === 0 || force) {
            if (force) await Resource.deleteMany({});
            const adminForRes = await User.findOne({ role: "admin" }).lean();
            if (!adminForRes) {
                results.push("Resources: skipped (no admin user found)");
            } else {
                await Resource.insertMany([
                    { name: "Brand Guidelines.pdf",       originalName: "Brand_Guidelines.pdf",       url: "https://res.cloudinary.com/demo/raw/upload/sample",                        publicId: "team-resources/brand-guidelines",    mimeType: "application/pdf",                                                                          size: 2621440, resourceType: "raw",   uploadedBy: adminForRes._id },
                    { name: "Design System V2.fig",       originalName: "Design_System_V2.fig",       url: "https://res.cloudinary.com/demo/raw/upload/sample",                        publicId: "team-resources/design-system-v2",    mimeType: "application/octet-stream",                                                                 size: 5242880, resourceType: "raw",   uploadedBy: adminForRes._id },
                    { name: "Hero Banner.png",            originalName: "Hero_Banner.png",            url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",      publicId: "team-resources/hero-banner",         mimeType: "image/png",                                                                                size: 4300800, resourceType: "image", uploadedBy: adminForRes._id },
                    { name: "Q3 Report 2025.pdf",         originalName: "Q3_Report_2025.pdf",         url: "https://res.cloudinary.com/demo/raw/upload/sample",                        publicId: "team-resources/q3-report",           mimeType: "application/pdf",                                                                          size: 2516582, resourceType: "raw",   uploadedBy: adminForRes._id },
                    { name: "Legal Documents.zip",        originalName: "Legal_Documents.zip",        url: "https://res.cloudinary.com/demo/raw/upload/sample",                        publicId: "team-resources/legal-documents",     mimeType: "application/zip",                                                                          size: 8912896, resourceType: "raw",   uploadedBy: adminForRes._id },
                    { name: "Project Assets.zip",         originalName: "Project_Assets_v3.zip",      url: "https://res.cloudinary.com/demo/raw/upload/sample",                        publicId: "team-resources/project-assets",      mimeType: "application/zip",                                                                          size: 47185920,resourceType: "raw",   uploadedBy: adminForRes._id },
                    { name: "Team Photo 2025.jpg",        originalName: "Team_Photo_2025.jpg",        url: "https://res.cloudinary.com/demo/image/upload/couple.jpg",                  publicId: "team-resources/team-photo",          mimeType: "image/jpeg",                                                                               size: 1887437, resourceType: "image", uploadedBy: adminForRes._id },
                    { name: "Onboarding Checklist.docx",  originalName: "Onboarding_Checklist.docx", url: "https://res.cloudinary.com/demo/raw/upload/sample",                        publicId: "team-resources/onboarding-checklist",mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",              size: 409600,  resourceType: "raw",   uploadedBy: adminForRes._id },
                ]);
                results.push("Resources: 8 dummy files seeded");
            }
        } else {
            results.push(`Resources: ${resourceCount} already exist, skipped`);
        }

        res.json({ success: true, message: "Seed complete", results });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/v1/devpromote", async (req, res) => {
    const { email, role = "admin" } = req.body;
    const user = await User.findOneAndUpdate({ email }, { role, isVerified: true }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: `${email} -> ${role}`, role: user.role });
});

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

// ─── Error Handling ─────────────────────────────────────────────────────────

// Catch unmatched routes and forward a 404 AppError to errorHandler
app.use(notFound);

// Global error handler – normalises all errors into a consistent JSON response
app.use(errorHandler);

export default app
