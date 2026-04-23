/**
 * CMS controller – manages the singleton CMS document.
 *
 * All write operations require admin authentication (enforced by the router).
 * The `getCMS` read endpoint is public.
 *
 * Every handler calls `CMS.getOrCreate()` to ensure the singleton document
 * is auto-created if it doesn't exist yet, rather than failing with a null error.
 *
 * Sections managed:
 *  - Logo         PATCH /api/v1/cms/logo
 *  - Tech Stack   PUT   /api/v1/cms/tech-stack  + category CRUD
 *  - Concept to Reality  PUT /api/v1/cms/concept-to-reality + step CRUD
 *  - Why Choose Us       PUT /api/v1/cms/why-choose-us     + card CRUD
 */
import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import CMS from "../../models/usersModels/CMS.model.js";

// Broadcast a CMS update event to all public subscribers
const emitCmsUpdate = (req, section) => {
    const io = req.app.get("io");
    if (io) io.of("/public").emit("cms:updated", { section });
};

// =========================
// GET CMS (public)
// =========================
export const getCMS = asyncHandler(async (req, res) => {
    const cms = await CMS.getOrCreate();
    successResponse(res, "CMS content fetched successfully", cms);
});

// =========================
// DEFAULT NAV + FOOTER SEEDS
// =========================
const DEFAULT_NAV_LINKS = [
    { label: 'Services',  href: '/services',  order: 0, isActive: true, openInNewTab: false },
    { label: 'Portfolio', href: '/portfolio', order: 1, isActive: true, openInNewTab: false },
    { label: 'Contact',   href: '/contact',   order: 2, isActive: true, openInNewTab: false },
];

const DEFAULT_FOOTER_SECTIONS = [
    {
        title: 'Explore', order: 0,
        links: [
            { label: 'Services',  href: '/services',  isActive: true },
            { label: 'Portfolio', href: '/portfolio', isActive: true },
            { label: 'Process',   href: '/#process',  isActive: true },
            { label: 'About',     href: '/about',     isActive: true },
        ],
    },
    {
        title: 'Company', order: 1,
        links: [
            { label: 'Our Team',          href: '/our-team',        isActive: true },
            { label: 'Careers',           href: '/careers',         isActive: true },
            { label: 'Contact',           href: '/contact',         isActive: true },
            { label: 'Privacy Policy',    href: '/privacy',         isActive: true },
            { label: 'Terms of Service',  href: '/terms',           isActive: true },
        ],
    },
];

// =========================
// GET NAV LINKS (public)
// =========================
export const getNavLinks = asyncHandler(async (req, res) => {
    const cms = await CMS.getOrCreate();
    let links = cms.navLinks || [];
    if (links.length === 0) {
        cms.navLinks = DEFAULT_NAV_LINKS;
        await cms.save();
        links = cms.navLinks;
    }
    successResponse(res, 'Nav links fetched', { navLinks: links });
});

// =========================
// UPDATE NAV LINKS (admin)
// =========================
export const updateNavLinks = asyncHandler(async (req, res) => {
    const { navLinks } = req.body;
    if (!Array.isArray(navLinks)) throw new AppError('navLinks must be an array', 400);

    const cms = await CMS.getOrCreate();
    cms.navLinks = navLinks.map((l, i) => ({
        label:        String(l.label || '').trim(),
        href:         String(l.href  || '').trim(),
        order:        typeof l.order === 'number' ? l.order : i,
        isActive:     l.isActive !== false,
        openInNewTab: Boolean(l.openInNewTab),
    })).filter(l => l.label && l.href);
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'navLinks');
    successResponse(res, 'Nav links updated', { navLinks: cms.navLinks });
});

// =========================
// GET FOOTER SECTIONS (public)
// =========================
export const getFooterSections = asyncHandler(async (req, res) => {
    const cms = await CMS.getOrCreate();
    let sections = cms.footerSections || [];
    if (sections.length === 0) {
        cms.footerSections = DEFAULT_FOOTER_SECTIONS;
        await cms.save();
        sections = cms.footerSections;
    }
    successResponse(res, 'Footer sections fetched', { footerSections: sections });
});

// =========================
// UPDATE FOOTER SECTIONS (admin)
// =========================
export const updateFooterSections = asyncHandler(async (req, res) => {
    const { footerSections } = req.body;
    if (!Array.isArray(footerSections)) throw new AppError('footerSections must be an array', 400);

    const cms = await CMS.getOrCreate();
    cms.footerSections = footerSections.map((s, i) => ({
        title: String(s.title || '').trim(),
        order: typeof s.order === 'number' ? s.order : i,
        links: Array.isArray(s.links)
            ? s.links.map(l => ({
                label:        String(l.label || '').trim(),
                href:         String(l.href  || '').trim(),
                isActive:     l.isActive !== false,
                openInNewTab: Boolean(l.openInNewTab),
              })).filter(l => l.label && l.href)
            : [],
    })).filter(s => s.title);
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'footerSections');
    successResponse(res, 'Footer sections updated', { footerSections: cms.footerSections });
});

// =========================
// GET FOOTER BOTTOM (public)
// =========================
const DEFAULT_FOOTER_BOTTOM = {
    copyrightText: 'Nabeel Agency. All rights reserved.',
    links: [
        { label: 'Privacy Policy', href: '/privacy', order: 0, isActive: true, openInNewTab: false },
        { label: 'Terms',          href: '/terms',   order: 1, isActive: true, openInNewTab: false },
        { label: 'Cookies',        href: '/cookies', order: 2, isActive: true, openInNewTab: false },
    ],
    taglineText: 'Made with ♥ in California',
    taglineVisible: true,
};

export const getFooterBottom = asyncHandler(async (req, res) => {
    const cms = await CMS.getOrCreate();
    // Seed defaults on first access if links are empty
    if (!cms.footerBottom?.links?.length) {
        cms.footerBottom = DEFAULT_FOOTER_BOTTOM;
        await cms.save();
    }
    successResponse(res, 'Footer bottom fetched', { footerBottom: cms.footerBottom });
});

// =========================
// UPDATE FOOTER BOTTOM (admin)
// =========================
export const updateFooterBottom = asyncHandler(async (req, res) => {
    const { copyrightText, links, taglineText, taglineVisible } = req.body;

    const cms = await CMS.getOrCreate();

    if (copyrightText !== undefined)
        cms.footerBottom.copyrightText = String(copyrightText).trim().slice(0, 200);

    if (Array.isArray(links)) {
        cms.footerBottom.links = links
            .map((l, i) => ({
                label:        String(l.label || '').trim(),
                href:         String(l.href  || '').trim(),
                order:        typeof l.order === 'number' ? l.order : i,
                isActive:     l.isActive !== false,
                openInNewTab: Boolean(l.openInNewTab),
            }))
            .filter(l => l.label && l.href);
    }

    if (taglineText !== undefined)
        cms.footerBottom.taglineText = String(taglineText).trim().slice(0, 200);

    if (taglineVisible !== undefined)
        cms.footerBottom.taglineVisible = Boolean(taglineVisible);

    cms.lastUpdatedBy = req.user._id;
    cms.markModified('footerBottom');
    await cms.save();
    emitCmsUpdate(req, 'footerBottom');
    successResponse(res, 'Footer bottom updated', { footerBottom: cms.footerBottom });
});

// =========================
// UPDATE GLOBAL THEME
// =========================
export const updateGlobalTheme = asyncHandler(async (req, res) => {
    const { globalTheme } = req.body;
    if (globalTheme !== 'dark' && globalTheme !== 'light' && globalTheme !== null) {
        throw new AppError("globalTheme must be 'dark', 'light', or null", 400);
    }

    const cms = await CMS.getOrCreate();
    cms.globalTheme = globalTheme ?? null;
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'globalTheme');
    successResponse(res, "Global theme updated successfully", { globalTheme: cms.globalTheme });
});

// =========================
// UPDATE GLOBAL LOGO
// =========================
export const updateLogo = asyncHandler(async (req, res) => {
    const { logoUrl } = req.body;
    if (!logoUrl) throw new AppError("logoUrl is required", 400);

    const cms = await CMS.getOrCreate();
    cms.logoUrl = logoUrl;
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'cms');
    successResponse(res, "Logo updated successfully", { logoUrl: cms.logoUrl });
});

// =========================
// UPDATE TECH STACK
// =========================
export const updateTechStack = asyncHandler(async (req, res) => {
    const { techStack } = req.body;
    if (!Array.isArray(techStack)) throw new AppError("techStack must be an array", 400);

    const cms = await CMS.getOrCreate();
    cms.techStack = techStack;
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'cms');
    successResponse(res, "Tech stack updated successfully", { techStack: cms.techStack });
});

// Add a tech stack category
export const addTechCategory = asyncHandler(async (req, res) => {
    const { categoryName, categoryDescription, items } = req.body;
    if (!categoryName) throw new AppError("categoryName is required", 400);

    const cms = await CMS.getOrCreate();
    cms.techStack.push({ categoryName, categoryDescription, items: items || [] });
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'cms');
    successResponse(res, "Tech stack category added", { techStack: cms.techStack }, 201);
});

// Update a tech stack category
export const updateTechCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { categoryName, categoryDescription, items } = req.body;

    const cms = await CMS.getOrCreate();
    const category = cms.techStack.id(categoryId);
    if (!category) throw new AppError("Category not found", 404);

    if (categoryName !== undefined) category.categoryName = categoryName;
    if (categoryDescription !== undefined) category.categoryDescription = categoryDescription;
    if (items !== undefined) category.items = items;
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'cms');
    successResponse(res, "Tech stack category updated", { techStack: cms.techStack });
});

// Delete a tech stack category
export const deleteTechCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    const cms = await CMS.getOrCreate();
    const category = cms.techStack.id(categoryId);
    if (!category) throw new AppError("Category not found", 404);

    category.deleteOne();
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'cms');
    successResponse(res, "Tech stack category deleted", { techStack: cms.techStack });
});

// =========================
// UPDATE CONCEPT TO REALITY
// =========================
export const updateConceptToReality = asyncHandler(async (req, res) => {
    const { sectionBadge, sectionTitle, steps } = req.body;

    const cms = await CMS.getOrCreate();
    if (sectionBadge !== undefined) cms.conceptToReality.sectionBadge = sectionBadge;
    if (sectionTitle !== undefined) cms.conceptToReality.sectionTitle = sectionTitle;
    if (steps !== undefined) cms.conceptToReality.steps = steps;
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'cms');
    successResponse(res, "Concept to Reality updated", { conceptToReality: cms.conceptToReality });
});

// Add a process step
export const addProcessStep = asyncHandler(async (req, res) => {
    const { stepTitle, description, iconName, gradientColor, bulletPoints } = req.body;
    if (!stepTitle) throw new AppError("stepTitle is required", 400);

    const cms = await CMS.getOrCreate();
    cms.conceptToReality.steps.push({ stepTitle, description, iconName, gradientColor, bulletPoints: bulletPoints || [] });
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'cms');
    successResponse(res, "Process step added", { steps: cms.conceptToReality.steps }, 201);
});

// Update a process step
export const updateProcessStep = asyncHandler(async (req, res) => {
    const { stepId } = req.params;
    const { stepTitle, description, iconName, gradientColor, bulletPoints, order } = req.body;

    const cms = await CMS.getOrCreate();
    const step = cms.conceptToReality.steps.id(stepId);
    if (!step) throw new AppError("Step not found", 404);

    if (stepTitle !== undefined) step.stepTitle = stepTitle;
    if (description !== undefined) step.description = description;
    if (iconName !== undefined) step.iconName = iconName;
    if (gradientColor !== undefined) step.gradientColor = gradientColor;
    if (bulletPoints !== undefined) step.bulletPoints = bulletPoints;
    if (order !== undefined) step.order = order;
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'cms');
    successResponse(res, "Process step updated", { steps: cms.conceptToReality.steps });
});

// Delete a process step
export const deleteProcessStep = asyncHandler(async (req, res) => {
    const { stepId } = req.params;

    const cms = await CMS.getOrCreate();
    const step = cms.conceptToReality.steps.id(stepId);
    if (!step) throw new AppError("Step not found", 404);

    step.deleteOne();
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'cms');
    successResponse(res, "Process step deleted", { steps: cms.conceptToReality.steps });
});

// =========================
// UPDATE WHY CHOOSE US
// =========================
export const updateWhyChooseUs = asyncHandler(async (req, res) => {
    const { titleLine1, titleLine2Highlighted, description, keyPoints, scrollingCards } = req.body;

    const cms = await CMS.getOrCreate();
    const wcu = cms.whyChooseUs;
    if (titleLine1 !== undefined) wcu.titleLine1 = titleLine1;
    if (titleLine2Highlighted !== undefined) wcu.titleLine2Highlighted = titleLine2Highlighted;
    if (description !== undefined) wcu.description = description;
    if (keyPoints !== undefined) wcu.keyPoints = keyPoints;
    if (scrollingCards !== undefined) wcu.scrollingCards = scrollingCards;
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'cms');
    successResponse(res, "Why Choose Us updated", { whyChooseUs: cms.whyChooseUs });
});

// Add a scrolling card
export const addScrollingCard = asyncHandler(async (req, res) => {
    const { title, description, iconName, order } = req.body;
    if (!title) throw new AppError("title is required", 400);

    const cms = await CMS.getOrCreate();
    cms.whyChooseUs.scrollingCards.push({ title, description, iconName, order });
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'cms');
    successResponse(res, "Scrolling card added", { scrollingCards: cms.whyChooseUs.scrollingCards }, 201);
});

// Update a scrolling card
export const updateScrollingCard = asyncHandler(async (req, res) => {
    const { cardId } = req.params;
    const { title, description, iconName, order } = req.body;

    const cms = await CMS.getOrCreate();
    const card = cms.whyChooseUs.scrollingCards.id(cardId);
    if (!card) throw new AppError("Card not found", 404);

    if (title !== undefined) card.title = title;
    if (description !== undefined) card.description = description;
    if (iconName !== undefined) card.iconName = iconName;
    if (order !== undefined) card.order = order;
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'cms');
    successResponse(res, "Scrolling card updated", { scrollingCards: cms.whyChooseUs.scrollingCards });
});

// Delete a scrolling card
export const deleteScrollingCard = asyncHandler(async (req, res) => {
    const { cardId } = req.params;

    const cms = await CMS.getOrCreate();
    const card = cms.whyChooseUs.scrollingCards.id(cardId);
    if (!card) throw new AppError("Card not found", 404);

    card.deleteOne();
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'cms');
    successResponse(res, "Scrolling card deleted", { scrollingCards: cms.whyChooseUs.scrollingCards });
});

// =========================
// UPDATE CONTACT INFO
// =========================
export const updateContactInfo = asyncHandler(async (req, res) => {
    const { address, email, phone, businessHours, mapEmbedUrl, mapProvider, mapLat, mapLng, mapZoom, mapMarkerLabel } = req.body;

    // Normalise Google Maps embed URL — strip <iframe> wrapper if pasted
    const $set = { lastUpdatedBy: req.user._id };

    if (address !== undefined)       $set['contactInfo.address']       = address;
    if (email !== undefined)         $set['contactInfo.email']         = email;
    if (phone !== undefined)         $set['contactInfo.phone']         = phone;
    if (businessHours !== undefined) $set['contactInfo.businessHours'] = businessHours;

    if (mapEmbedUrl !== undefined) {
        const srcMatch = mapEmbedUrl.match(/src=["']([^"']+)["']/);
        $set['contactInfo.mapEmbedUrl'] = srcMatch ? srcMatch[1] : mapEmbedUrl.trim();
    }

    if (mapProvider !== undefined)    $set['contactInfo.mapProvider']    = mapProvider;
    if (mapLat !== undefined)         $set['contactInfo.mapLat']         = (mapLat === '' || mapLat === null) ? null : Number(mapLat);
    if (mapLng !== undefined)         $set['contactInfo.mapLng']         = (mapLng === '' || mapLng === null) ? null : Number(mapLng);
    if (mapZoom !== undefined)        $set['contactInfo.mapZoom']        = Number(mapZoom) || 13;
    if (mapMarkerLabel !== undefined) $set['contactInfo.mapMarkerLabel'] = mapMarkerLabel;

    // Ensure singleton doc exists first, then update atomically
    const existing = await CMS.getOrCreate();
    const cms = await CMS.findOneAndUpdate(
        { _id: existing._id },
        { $set },
        { new: true }
    );

    emitCmsUpdate(req, 'cms');
    successResponse(res, "Contact info updated", { contactInfo: cms.contactInfo });
});

// =========================
// UPDATE SOCIAL LINKS
// =========================
export const updateSocialLinks = asyncHandler(async (req, res) => {
    const { twitter, linkedin, instagram, github, customSocialLinks } = req.body;

    const cms = await CMS.getOrCreate();
    if (twitter !== undefined) cms.socialLinks.twitter = twitter;
    if (linkedin !== undefined) cms.socialLinks.linkedin = linkedin;
    if (instagram !== undefined) cms.socialLinks.instagram = instagram;
    if (github !== undefined) cms.socialLinks.github = github;
    if (customSocialLinks !== undefined) {
        if (!Array.isArray(customSocialLinks)) throw new AppError("customSocialLinks must be an array", 400);
        cms.socialLinks.customSocialLinks = customSocialLinks;
    }
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'cms');
    successResponse(res, "Social links updated", { socialLinks: cms.socialLinks });
});

// =========================
// TESTIMONIALS CRUD
// =========================
export const updateTestimonials = asyncHandler(async (req, res) => {
    const { testimonials } = req.body;
    if (!Array.isArray(testimonials)) throw new AppError("testimonials must be an array", 400);

    const cms = await CMS.getOrCreate();
    cms.testimonials = testimonials;
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'cms');
    successResponse(res, "Testimonials updated", { testimonials: cms.testimonials });
});

export const addTestimonial = asyncHandler(async (req, res) => {
    const { content, author, role, rating } = req.body;
    if (!content || !author) throw new AppError("content and author are required", 400);

    const cms = await CMS.getOrCreate();
    cms.testimonials.push({ content, author, role, rating, order: cms.testimonials.length });
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'cms');
    successResponse(res, "Testimonial added", { testimonials: cms.testimonials }, 201);
});

export const updateTestimonial = asyncHandler(async (req, res) => {
    const { testimonialId } = req.params;
    const { content, author, role, rating, order } = req.body;

    const cms = await CMS.getOrCreate();
    const testimonial = cms.testimonials.id(testimonialId);
    if (!testimonial) throw new AppError("Testimonial not found", 404);

    if (content !== undefined) testimonial.content = content;
    if (author !== undefined) testimonial.author = author;
    if (role !== undefined) testimonial.role = role;
    if (rating !== undefined) testimonial.rating = rating;
    if (order !== undefined) testimonial.order = order;
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'cms');
    successResponse(res, "Testimonial updated", { testimonials: cms.testimonials });
});

export const deleteTestimonial = asyncHandler(async (req, res) => {
    const { testimonialId } = req.params;

    const cms = await CMS.getOrCreate();
    const testimonial = cms.testimonials.id(testimonialId);
    if (!testimonial) throw new AppError("Testimonial not found", 404);

    testimonial.deleteOne();
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'cms');
    successResponse(res, "Testimonial deleted", { testimonials: cms.testimonials });
});

// =========================
// ABOUT PAGE CMS
// =========================

/** Replace the entire about section (PUT /api/v1/cms/about) */
export const updateAbout = asyncHandler(async (req, res) => {
    const { heroSubtitle, stats, storyTitle, storyParagraphs, storyPoints, milestones, values } = req.body;

    const cms = await CMS.getOrCreate();
    if (!cms.about) cms.about = {};

    if (heroSubtitle !== undefined) cms.about.heroSubtitle = heroSubtitle;
    if (storyTitle !== undefined) cms.about.storyTitle = storyTitle;
    if (storyParagraphs !== undefined) {
        if (!Array.isArray(storyParagraphs)) throw new AppError("storyParagraphs must be an array", 400);
        cms.about.storyParagraphs = storyParagraphs;
    }
    if (storyPoints !== undefined) {
        if (!Array.isArray(storyPoints)) throw new AppError("storyPoints must be an array", 400);
        cms.about.storyPoints = storyPoints;
    }
    if (stats !== undefined) {
        if (!Array.isArray(stats)) throw new AppError("stats must be an array", 400);
        cms.about.stats = stats;
    }
    if (milestones !== undefined) {
        if (!Array.isArray(milestones)) throw new AppError("milestones must be an array", 400);
        cms.about.milestones = milestones;
    }
    if (values !== undefined) {
        if (!Array.isArray(values)) throw new AppError("values must be an array", 400);
        cms.about.values = values;
    }

    cms.markModified('about');
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'about');
    successResponse(res, "About page updated", { about: cms.about });
});

// =========================
// PRIVACY POLICY CMS
// =========================

/** Replace the entire privacyPolicy section (PUT /api/v1/cms/privacy-policy) */
export const updatePrivacyPolicy = asyncHandler(async (req, res) => {
    const { lastUpdated, subtitle, contactEmail, sections } = req.body;

    const cms = await CMS.getOrCreate();
    if (!cms.privacyPolicy) cms.privacyPolicy = {};

    if (lastUpdated  !== undefined) cms.privacyPolicy.lastUpdated  = lastUpdated;
    if (subtitle     !== undefined) cms.privacyPolicy.subtitle     = subtitle;
    if (contactEmail !== undefined) cms.privacyPolicy.contactEmail = contactEmail;
    if (sections !== undefined) {
        if (!Array.isArray(sections)) throw new AppError("sections must be an array", 400);
        cms.privacyPolicy.sections = sections;
    }

    cms.markModified('privacyPolicy');
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'cms');
    successResponse(res, "Privacy policy updated", { privacyPolicy: cms.privacyPolicy });
});

// =========================
// TERMS OF SERVICE CMS
// =========================

/** Replace the entire termsOfService section (PUT /api/v1/cms/terms-of-service) */
export const updateTermsOfService = asyncHandler(async (req, res) => {
    const { lastUpdated, subtitle, contactEmail, sections } = req.body;

    const cms = await CMS.getOrCreate();
    if (!cms.termsOfService) cms.termsOfService = {};

    if (lastUpdated  !== undefined) cms.termsOfService.lastUpdated  = lastUpdated;
    if (subtitle     !== undefined) cms.termsOfService.subtitle     = subtitle;
    if (contactEmail !== undefined) cms.termsOfService.contactEmail = contactEmail;
    if (sections !== undefined) {
        if (!Array.isArray(sections)) throw new AppError("sections must be an array", 400);
        cms.termsOfService.sections = sections;
    }

    cms.markModified('termsOfService');
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'cms');
    successResponse(res, "Terms of service updated", { termsOfService: cms.termsOfService });
});

// =========================
// COOKIES POLICY CMS
// =========================

/** Replace the entire cookiesPolicy section (PUT /api/v1/cms/cookies-policy) */
export const updateCookiesPolicy = asyncHandler(async (req, res) => {
    const { subtitle, categories } = req.body;

    const cms = await CMS.getOrCreate();
    if (!cms.cookiesPolicy) cms.cookiesPolicy = {};

    if (subtitle !== undefined) cms.cookiesPolicy.subtitle = subtitle;
    if (categories !== undefined) {
        if (!Array.isArray(categories)) throw new AppError("categories must be an array", 400);
        cms.cookiesPolicy.categories = categories;
    }

    cms.markModified('cookiesPolicy');
    cms.lastUpdatedBy = req.user._id;
    await cms.save();
    emitCmsUpdate(req, 'cms');
    successResponse(res, "Cookies policy updated", { cookiesPolicy: cms.cookiesPolicy });
});
