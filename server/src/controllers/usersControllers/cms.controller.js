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

// =========================
// GET CMS (public)
// =========================
export const getCMS = asyncHandler(async (req, res) => {
    const cms = await CMS.getOrCreate();
    successResponse(res, "CMS content fetched successfully", cms);
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

    successResponse(res, "Scrolling card deleted", { scrollingCards: cms.whyChooseUs.scrollingCards });
});
