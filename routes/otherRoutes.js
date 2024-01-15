import express from "express";
import { authorizeAdmin, isAuthenticated } from "../middlewares/auth.js";
import { contact, courseRequest, getDashboardStats } from "../controllers/otherController.js";

const router = express.Router();

// contact form
router.route("/contact").post(contact);

// Request Form
router.route("/courserequest").post(courseRequest);

// Get Admin Dashboard Stats
router.route("/admin/stats").get(isAuthenticated,authorizeAdmin, getDashboardStats);

export default router;
