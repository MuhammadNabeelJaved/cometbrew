import express from "express";
import { createReview, getAllReviews, getAllReviewsAdmin, getReviewById, getReviewsByProject, getMyReviews, updateReview, updateReviewStatus, deleteReview, getReviewsByRating, getReviewStatistics, bulkDeleteReviews } from "../../controllers/usersControllers/reviews.controller.js";

import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";

const router = express.Router();

router.route("/").post(userAuthenticated, authorizeRoles("user"), createReview);
router.route("/").get(userAuthenticated, authorizeRoles("admin"), getAllReviewsAdmin);
router.route("/all").get(userAuthenticated, authorizeRoles("admin"), getAllReviews);
router.route("/statistics").get(userAuthenticated, authorizeRoles("admin"), getReviewStatistics);
router.route("/rating/:rating").get(userAuthenticated, authorizeRoles("user", "admin"), getReviewsByRating);
router.route("/my-reviews").get(userAuthenticated, authorizeRoles("user"), getMyReviews);
router.route("/project/:projectId").get(userAuthenticated, authorizeRoles("user", "admin"), getReviewsByProject);
router.route("/bulk-delete").delete(userAuthenticated, authorizeRoles("admin"), bulkDeleteReviews);
router.route("/:id").get(userAuthenticated, authorizeRoles("user", "admin"), getReviewById);
router.route("/:id").put(userAuthenticated, authorizeRoles("user", "admin"), updateReview);
router.route("/:id/status").put(userAuthenticated, authorizeRoles("admin"), updateReviewStatus);
router.route("/:id").delete(userAuthenticated, authorizeRoles("user", "admin"), deleteReview);

export default router;