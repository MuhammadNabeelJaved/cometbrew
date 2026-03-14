import mongoose from "mongoose";

const homePageSchema = new mongoose.Schema(
    {
        // Status Badge
        statusBadge: {
            type: String,
            required: [true, "Status badge is required"],
            trim: true,
            maxlength: [100, "Status badge cannot exceed 100 characters"],
            default: "Accepting New Projects for 2024",
        },

        // Hero Section - Title Line 1
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

        // Subtitle/Description
        subtitle: {
            type: String,
            required: [true, "Subtitle is required"],
            trim: true,
            minlength: [20, "Subtitle must be at least 20 characters"],
            maxlength: [500, "Subtitle cannot exceed 500 characters"],
            default: "The agency for forward-thinking brands. We combine AI-driven development with award-winning design to build products that scale.",
        },


        // CTA Buttons (Optional - for future use)
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
                    default: true,
                },
            },
        ],


        isActive: {
            type: Boolean,
            default: true,
        },

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

// Static method to get active home page content
homePageSchema.statics.getActiveContent = async function () {
    const content = await this.findOne({ isActive: true });
    if (!content) {
        // Return default content if none exists
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