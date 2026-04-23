/**
 * CMS model – singleton document for site-wide content management.
 *
 * Only ONE document of this model should ever exist. All controllers must
 * call `CMS.getOrCreate()` instead of `CMS.find()` or `CMS.findOne()` to
 * ensure the document is auto-created with defaults on first access.
 *
 * Sections managed:
 *  - `logoUrl`          – global site logo (Cloudinary URL)
 *  - `techStack[]`      – categorised tech stack items displayed on the site
 *  - `conceptToReality` – "Our Process" section with ordered steps
 *  - `whyChooseUs`      – value-proposition section with scrolling cards
 */
import mongoose from "mongoose";

// ─────────────────────────────────────────────
// Sub-schema: Tech Stack Item
// Each item represents one technology/tool within a category
// ─────────────────────────────────────────────
const techStackItemSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 50 },
        description: { type: String, trim: true, maxlength: 100 },
        iconKey: { type: String, trim: true, maxlength: 50 },       // e.g. "ReactIcon"
        colorClass: { type: String, trim: true, maxlength: 30 },    // e.g. "text-[#61DAFB]"
        order: { type: Number, default: 0 }, // Controls display order within the category
    },
    { _id: true }
);

// ─────────────────────────────────────────────
// Sub-schema: Tech Stack Category
// Groups related tech stack items (e.g. "Frontend", "Backend")
// ─────────────────────────────────────────────
const techStackCategorySchema = new mongoose.Schema(
    {
        categoryName: { type: String, required: true, trim: true, maxlength: 80 },
        categoryDescription: { type: String, trim: true, maxlength: 200 },
        items: [techStackItemSchema],
    },
    { _id: true }
);

// ─────────────────────────────────────────────
// Sub-schema: Process Step (Concept to Reality)
// Each step represents one stage in the agency's development process
// ─────────────────────────────────────────────
const processStepSchema = new mongoose.Schema(
    {
        stepTitle: { type: String, required: true, trim: true, maxlength: 80 },
        description: { type: String, trim: true, maxlength: 500 },
        iconName: { type: String, trim: true, maxlength: 50 },       // e.g. "Search"
        gradientColor: { type: String, trim: true, maxlength: 80 },  // e.g. "from-blue-500 to-cyan-400"
        bulletPoints: [{ type: String, trim: true, maxlength: 100 }],
        order: { type: Number, default: 0 }, // Controls step display order
    },
    { _id: true }
);

// ─────────────────────────────────────────────
// Sub-schema: Scrolling Card (Why Choose Us)
// Cards displayed in a horizontally scrolling row
// ─────────────────────────────────────────────
const scrollingCardSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 80 },
        description: { type: String, trim: true, maxlength: 300 },
        iconName: { type: String, trim: true, maxlength: 50 },
        order: { type: Number, default: 0 },
    },
    { _id: true }
);

// ─────────────────────────────────────────────
// Main CMS Schema
// ─────────────────────────────────────────────
const cmsSchema = new mongoose.Schema(
    {
        // Global Logo – Cloudinary URL for the site's logo image
        logoUrl: {
            type: String,
            trim: true,
            default: "",
        },

        // ── Tech Stack Section ──
        // Array of categories, each containing an array of tech items
        techStack: [techStackCategorySchema],

        // ── Concept to Reality Section ──
        conceptToReality: {
            sectionBadge: { type: String, trim: true, maxlength: 80, default: "Our Process" },
            sectionTitle: { type: String, trim: true, maxlength: 100, default: "From Concept to Reality" },
            steps: [processStepSchema],
        },

        // ── Why Choose Us Section ──
        whyChooseUs: {
            titleLine1: { type: String, trim: true, maxlength: 100, default: "Why forward-thinking companies" },
            titleLine2Highlighted: { type: String, trim: true, maxlength: 100, default: "choose us" },
            description: {
                type: String,
                trim: true,
                maxlength: 500,
                default: "We're not just a dev shop. We're your strategic partner in building digital products that stand out.",
            },
            keyPoints: [{ type: String, trim: true, maxlength: 150 }],
            scrollingCards: [scrollingCardSchema],
        },

        // ── Contact Information ──
        contactInfo: {
            address: { type: String, trim: true, default: "" },
            email: { type: String, trim: true, default: "" },
            phone: { type: String, trim: true, default: "" },
            businessHours: { type: String, trim: true, default: "" },
            // Google Maps iframe embed
            mapEmbedUrl: { type: String, trim: true, default: "" },
            // MapCN (MapLibre) provider fields
            mapProvider: { type: String, enum: ["google", "mapcn", "both"], default: "google" },
            mapLat: { type: Number, default: null },
            mapLng: { type: Number, default: null },
            mapZoom: { type: Number, default: 13 },
            mapMarkerLabel: { type: String, trim: true, default: "" },
        },

        // ── Social Links ──
        socialLinks: {
            twitter: { type: String, trim: true, default: "" },
            linkedin: { type: String, trim: true, default: "" },
            instagram: { type: String, trim: true, default: "" },
            github: { type: String, trim: true, default: "" },
            customSocialLinks: [{
                label: { type: String, trim: true, required: true },
                url: { type: String, trim: true, required: true },
                icon: { type: String, trim: true, default: "Globe" },
            }],
        },

        // ── Testimonials ──
        testimonials: [{
            content: { type: String, trim: true, required: true },
            author: { type: String, trim: true, required: true },
            role: { type: String, trim: true, default: "" },
            rating: { type: Number, min: 1, max: 5, default: 5 },
            order: { type: Number, default: 0 },
        }],

        // ── Navbar Links ──
        navLinks: [{
            label:       { type: String, required: true, trim: true, maxlength: 60 },
            href:        { type: String, required: true, trim: true, maxlength: 200 },
            order:       { type: Number, default: 0 },
            isActive:    { type: Boolean, default: true },
            openInNewTab:{ type: Boolean, default: false },
        }],

        // ── Footer Sections ──
        footerSections: [{
            title:  { type: String, required: true, trim: true, maxlength: 60 },
            order:  { type: Number, default: 0 },
            links:  [{
                label:        { type: String, required: true, trim: true, maxlength: 60 },
                href:         { type: String, required: true, trim: true, maxlength: 200 },
                isActive:     { type: Boolean, default: true },
                openInNewTab: { type: Boolean, default: false },
            }],
        }],

        // ── Footer Bottom Bar ──
        // Controls the copyright strip and privacy-policy links at the very
        // bottom of the footer.
        footerBottom: {
            copyrightText: {
                type: String, trim: true, maxlength: 200,
                default: 'Nabeel Agency. All rights reserved.',
            },
            links: [{
                label:        { type: String, required: true, trim: true, maxlength: 60 },
                href:         { type: String, required: true, trim: true, maxlength: 200 },
                order:        { type: Number, default: 0 },
                isActive:     { type: Boolean, default: true },
                openInNewTab: { type: Boolean, default: false },
            }],
            taglineText: {
                type: String, trim: true, maxlength: 200,
                default: 'Made with ♥ in California',
            },
            taglineVisible: { type: Boolean, default: true },
        },

        // ── About Page ──
        about: {
            // Hero sub-heading
            heroSubtitle: { type: String, trim: true, maxlength: 500, default: "" },

            // Stats bar (e.g. "50+ Projects Delivered")
            stats: [{
                value: { type: String, trim: true, maxlength: 20, required: true },  // "50+"
                label: { type: String, trim: true, maxlength: 80, required: true },  // "Projects Delivered"
                order: { type: Number, default: 0 },
            }],

            // Our Story section
            storyTitle: { type: String, trim: true, maxlength: 200, default: "" },
            storyParagraphs: [{ type: String, trim: true, maxlength: 800 }],
            storyPoints: [{ type: String, trim: true, maxlength: 200 }],  // bullet-list checkmarks

            // Company milestone timeline
            milestones: [{
                year:  { type: String, trim: true, maxlength: 10, required: true },
                title: { type: String, trim: true, maxlength: 100, required: true },
                desc:  { type: String, trim: true, maxlength: 400, required: true },
                order: { type: Number, default: 0 },
            }],

            // Core values grid
            values: [{
                title:       { type: String, trim: true, maxlength: 100, required: true },
                description: { type: String, trim: true, maxlength: 400, required: true },
                iconName:    { type: String, trim: true, maxlength: 50, default: "Star" },
                order:       { type: Number, default: 0 },
            }],
        },

        // ── Privacy Policy Page ──
        privacyPolicy: {
            lastUpdated:  { type: String, trim: true, default: '' },
            subtitle:     { type: String, trim: true, maxlength: 500, default: '' },
            contactEmail: { type: String, trim: true, default: '' },
            sections: [{
                title:   { type: String, trim: true, maxlength: 200, required: true },
                content: { type: String, trim: true, maxlength: 5000, default: '' },
                order:   { type: Number, default: 0 },
            }],
        },

        // ── Terms of Service Page ──
        termsOfService: {
            lastUpdated:  { type: String, trim: true, default: '' },
            subtitle:     { type: String, trim: true, maxlength: 500, default: '' },
            contactEmail: { type: String, trim: true, default: '' },
            sections: [{
                title:   { type: String, trim: true, maxlength: 200, required: true },
                content: { type: String, trim: true, maxlength: 5000, default: '' },
                order:   { type: Number, default: 0 },
            }],
        },

        // ── Cookies Policy Page ──
        cookiesPolicy: {
            subtitle: { type: String, trim: true, maxlength: 500, default: '' },
            categories: [{
                key:         { type: String, trim: true, maxlength: 50, required: true }, // essential/functional/analytics/marketing
                title:       { type: String, trim: true, maxlength: 200, required: true },
                description: { type: String, trim: true, maxlength: 1000, default: '' },
                order:       { type: Number, default: 0 },
            }],
        },

        // ── Global Site Theme ──
        // When set, overrides all visitor theme preferences site-wide
        globalTheme: {
            type: String,
            enum: ['dark', 'light', null],
            default: null,
        },

        // Tracks which admin last modified the CMS content
        lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// ─────────────────────────────────────────────
// Singleton pattern: get or auto-create the one CMS document
// ─────────────────────────────────────────────
/**
 * Returns the single CMS document, creating it with default values if it
 * does not yet exist. All CMS controllers must use this method.
 *
 * @returns {Promise<Document>} The CMS document
 */
cmsSchema.statics.getOrCreate = async function () {
    let doc = await this.findOne();
    if (!doc) {
        doc = await this.create({
            logoUrl: "",
            techStack: [],
            conceptToReality: { steps: [] },
            whyChooseUs: { keyPoints: [], scrollingCards: [] },
        });
    }
    return doc;
};

const CMS = mongoose.models.CMS || mongoose.model("CMS", cmsSchema);

export default CMS;
