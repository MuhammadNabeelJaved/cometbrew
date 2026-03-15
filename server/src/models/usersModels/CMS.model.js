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
