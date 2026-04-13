import express from "express";
import {
    getCMS,
    getNavLinks,
    updateNavLinks,
    getFooterSections,
    updateFooterSections,
    getFooterBottom,
    updateFooterBottom,
    updateGlobalTheme,
    updateLogo,
    updateTechStack,
    addTechCategory,
    updateTechCategory,
    deleteTechCategory,
    updateConceptToReality,
    addProcessStep,
    updateProcessStep,
    deleteProcessStep,
    updateWhyChooseUs,
    addScrollingCard,
    updateScrollingCard,
    deleteScrollingCard,
    updateContactInfo,
    updateSocialLinks,
    updateTestimonials,
    addTestimonial,
    updateTestimonial,
    deleteTestimonial,
} from "../../controllers/usersControllers/cms.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";
import { setCacheHeaders } from "../../middlewares/cacheHeaders.js";
import { cacheMiddleware } from "../../middlewares/redisCache.js";

const router = express.Router();

// Public – frontend reads all CMS content
router.get("/", setCacheHeaders(600), cacheMiddleware(600), getCMS);
router.get("/nav-links", setCacheHeaders(600), cacheMiddleware(600), getNavLinks);
router.get("/footer-sections", setCacheHeaders(600), cacheMiddleware(600), getFooterSections);
router.get("/footer-bottom", setCacheHeaders(600), cacheMiddleware(600), getFooterBottom);

// Admin-only writes
router.use(userAuthenticated, authorizeRoles("admin"));

// Global Theme
router.patch("/global-theme", updateGlobalTheme);

// Nav & Footer links
router.put("/nav-links", updateNavLinks);
router.put("/footer-sections", updateFooterSections);
router.put("/footer-bottom", updateFooterBottom);

// Global Logo
router.patch("/logo", updateLogo);

// Tech Stack
router.put("/tech-stack", updateTechStack);
router.post("/tech-stack/category", addTechCategory);
router.put("/tech-stack/category/:categoryId", updateTechCategory);
router.delete("/tech-stack/category/:categoryId", deleteTechCategory);

// Concept to Reality
router.put("/concept-to-reality", updateConceptToReality);
router.post("/concept-to-reality/step", addProcessStep);
router.put("/concept-to-reality/step/:stepId", updateProcessStep);
router.delete("/concept-to-reality/step/:stepId", deleteProcessStep);

// Why Choose Us
router.put("/why-choose-us", updateWhyChooseUs);
router.post("/why-choose-us/card", addScrollingCard);
router.put("/why-choose-us/card/:cardId", updateScrollingCard);
router.delete("/why-choose-us/card/:cardId", deleteScrollingCard);

// Contact Info
router.put("/contact-info", updateContactInfo);

// Social Links
router.put("/social-links", updateSocialLinks);

// Testimonials
router.put("/testimonials", updateTestimonials);
router.post("/testimonials", addTestimonial);
router.put("/testimonials/:testimonialId", updateTestimonial);
router.delete("/testimonials/:testimonialId", deleteTestimonial);

export default router;
