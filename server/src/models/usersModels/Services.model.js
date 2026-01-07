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

        // Hero Section
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

        // Statistics/Metrics
        metrics: [{
            value: String,
            label: String,
            icon: String,
        }],

        // Features/Services Offered
        features: [{
            icon: String,
            title: String,
            description: String,
            category: String, // e.g., 'custom-web-app', 'api-integration', etc.
        }],

        // Technologies/Tools Used
        technologies: [{
            name: String,
            icon: String,
            category: String,
        }],

        // Related Projects/Portfolio
        relatedProjects: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
        }],

        // Pricing Plans
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
                default: false,
            },
            ctaButton: {
                text: String,
                link: String,
            },
        }],

        // FAQs
        faqs: [{
            question: String,
            answer: String,
            order: Number,
        }],

        // Call to Action Section
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
            default: true,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        order: {
            type: Number,
            default: 0,
        },

        // Additional Fields
        category: {
            type: String,
            enum: ['web-development', 'mobile-app', 'ecommerce', 'design', 'consulting', 'other'],
            required: true,
        },
        deliveryTime: String,
        thumbnail: String,
        images: [String],
    },
    {
        timestamps: true,
    }
);

// Indexes
ServiceSchema.index({ slug: 1 });
ServiceSchema.index({ category: 1, isActive: 1 });
ServiceSchema.index({ isFeatured: 1, order: 1 });

// Virtual for URL
ServiceSchema.virtual('url').get(function () {
    return `/services/${this.slug}`;
});

const Service = mongoose.models.Service || mongoose.model('Service', ServiceSchema);

export default Service;