/**
 * Service model – agency services displayed on the website.
 *
 * Each service has a unique `slug` used for SEO-friendly URLs
 * (e.g. `/services/web-development`).
 *
 * Rich content fields supported:
 *  - `heroSection`      – badge, heading, sub-heading, CTA buttons
 *  - `metrics[]`        – statistics/numbers to display (e.g. "500+ projects")
 *  - `features[]`       – list of features/deliverables
 *  - `technologies[]`   – tech stack used for this service
 *  - `relatedProjects[]`– references to AdminProject documents
 *  - `pricingPlans[]`   – tiered pricing with feature lists
 *  - `faqs[]`           – ordered FAQ entries
 *  - `ctaSection`       – bottom call-to-action block
 *
 * Virtual `url` returns the canonical service URL path.
 */
import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema(
    {
        // Basic Information
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: [3, "Title must be at least 3 characters"],
            maxlength: [50, "Title cannot exceed 100 characters"],
        },

        // URL-friendly identifier, must be unique across all services
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        subtitle: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            minlength: [10, "Description must be at least 10 characters"],
            maxlength: [5000, "Description cannot exceed 5000 characters"],
        },

        // Hero Section – top of the service detail page
        heroSection: {
            badge: String,
            heading: String,
            subheading: String,
            ctaButton: {
                text: String,
                link: String,
            },
            secondaryButton: {
                text: String,
                link: String,
            },
        },

        // Statistics/Metrics shown in the hero or overview section
        metrics: [{
            value: String,  // e.g. "500+"
            label: String,  // e.g. "Projects Delivered"
            icon: String,
        }],

        // Features/Services Offered – what the client gets
        features: [{
            icon: String,
            title: String,
            description: String,
            category: String, // e.g., 'custom-web-app', 'api-integration', etc.
        }],

        // Technologies/Tools Used for this service
        technologies: [{
            name: String,
            icon: String,
            category: String,
        }],

        // Related Portfolio Projects (references AdminProject documents)
        relatedProjects: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
        }],

        // Pricing Plans – can be monthly or one-time; isPopular highlights recommended plan
        pricingPlans: [{
            name: String,
            price: {
                amount: Number,
                currency: {
                    type: String,
                    default: 'USD',
                },
                period: String, // e.g., 'monthly', 'one-time'
            },
            description: String,
            features: [String],
            isPopular: {
                type: Boolean,
                default: false, // Marks the recommended plan (highlighted in UI)
            },
            ctaButton: {
                text: String,
                link: String,
            },
        }],

        // FAQs – ordered list of question/answer pairs
        faqs: [{
            question: String,
            answer: String,
            order: Number,
        }],

        // Call to Action Section – bottom of the service detail page
        ctaSection: {
            heading: String,
            subheading: String,
            description: String,
            button: {
                text: String,
                link: String,
            },
            contactEmail: String,
        },


        // Status and Visibility
        isActive: {
            type: Boolean,
            default: true,  // Inactive services are hidden from the public
        },
        isFeatured: {
            type: Boolean,
            default: false, // Featured services appear in highlighted sections
        },
        order: {
            type: Number,
            default: 0, // Controls display order on the services listing page
        },

        // Classification
        category: {
            type: String,
            enum: ['web-development', 'mobile-app', 'ecommerce', 'design', 'consulting', 'other'],
            required: true,
        },
        deliveryTime: String,  // e.g. "2-4 weeks"
        thumbnail: String,     // Cloudinary URL for the service card thumbnail
        images: [String],      // Additional Cloudinary image URLs
    },
    {
        timestamps: true,
    }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
ServiceSchema.index({ category: 1, isActive: 1 });
ServiceSchema.index({ isFeatured: 1, order: 1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────

/** Returns the canonical URL path for this service (e.g. "/services/web-development"). */
ServiceSchema.virtual('url').get(function () {
    return `/services/${this.slug}`;
});

const Service = mongoose.models.Service || mongoose.model('Service', ServiceSchema);

export default Service;
