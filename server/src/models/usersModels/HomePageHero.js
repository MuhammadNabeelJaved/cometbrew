/**
 * HomePageHero model – singleton CMS document for the homepage hero section.
 *
 * Only one active document exists at a time (`isActive: true`).
 * All hero content is managed by admin users and rendered publicly via
 * `GET /api/v1/homepage`.
 *
 * Content controlled:
 *  - `statusBadge`  – short banner text (e.g. "Accepting New Projects for 2026")
 *  - `titleLine1`   – first line of the hero heading (plain text)
 *  - `titleLine2`   – second line of the hero heading (highlighted/coloured)
 *  - `subtitle`     – supporting paragraph under the heading
 *  - `ctaButtons[]` – call-to-action buttons (primary/secondary)
 *
 * Use `HomePageHero.getActiveContent()` to retrieve (or auto-create) the
 * active document.
 */
import mongoose from "mongoose";

const homePageSchema = new mongoose.Schema(
    {
        // Short badge displayed above the main heading (e.g. "Now Hiring", "Accepting Projects")
        statusBadge: {
            type: String,
            required: [true, "Status badge is required"],
            trim: true,
            maxlength: [100, "Status badge cannot exceed 100 characters"],
            default: "Accepting New Projects for 2024",
        },

        // Hero Section - Title Line 1 (plain text)
        titleLine1: {
            type: String,
            required: [true, "Title line 1 is required"],
            trim: true,
            maxlength: [50, "Title line 1 cannot exceed 50 characters"],
            default: "We Build",
        },

        // Hero Section - Title Line 2 (Colored/Highlighted)
        titleLine2: {
            type: String,
            required: [true, "Title line 2 is required"],
            trim: true,
            maxlength: [50, "Title line 2 cannot exceed 50 characters"],
            default: "Digital Excellence",
        },

        // Subtitle/Description – shown below the heading
        subtitle: {
            type: String,
            required: [true, "Subtitle is required"],
            trim: true,
            minlength: [20, "Subtitle must be at least 20 characters"],
            maxlength: [500, "Subtitle cannot exceed 500 characters"],
            default: "The agency for forward-thinking brands. We combine AI-driven development with award-winning design to build products that scale.",
        },


        // CTA Buttons – rendered as call-to-action buttons in the hero
        ctaButtons: [
            {
                text: {
                    type: String,
                    required: true,
                    maxlength: [30, "Button text cannot exceed 30 characters"],
                },
                link: {
                    type: String,
                    required: true,
                },
                isPrimary: {
                    type: Boolean,
                    default: true, // Controls button styling (primary vs secondary)
                },
            },
        ],

        // Only one document should be active at a time
        isActive: {
            type: Boolean,
            default: true,
        },

        // Tracks which admin last modified this content
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

// ─── Static Methods ───────────────────────────────────────────────────────────

/**
 * Returns the active homepage content. If no document exists, creates one
 * with sensible default values so the site never renders empty.
 *
 * @returns {Promise<Document>} The active HomePage document
 */
homePageSchema.statics.getActiveContent = async function () {
    const content = await this.findOne({ isActive: true });
    if (!content) {
        // Auto-create with defaults so the frontend always has content to display
        return this.create({
            statusBadge: "Accepting New Projects for 2026",
            titleLine1: "We Build",
            titleLine2: "Digital Excellence",
            subtitle: "The agency for forward-thinking brands. We combine AI-driven development with award-winning design to build products that scale.",
            isActive: true,
        });
    }
    return content;
};

const HomePage = mongoose.models.HomePage || mongoose.model("HomePage", homePageSchema);

export default HomePage;
