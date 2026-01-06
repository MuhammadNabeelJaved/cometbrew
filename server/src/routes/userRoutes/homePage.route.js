import express from "express";
import { getHomePage, createHomePage, updateHomePage } from "../../controllers/usersControllers/homePage.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";

const router = express.Router();

router.route("/").get(userAuthenticated, authorizeRoles("admin"), getHomePage);
router.route("/add").post(userAuthenticated, authorizeRoles("admin"), createHomePage);
router.route("/update").put(userAuthenticated, authorizeRoles("admin"), updateHomePage);

export default router;