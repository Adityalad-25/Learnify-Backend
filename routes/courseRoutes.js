import express from "express";
import {
  getAllCourses,
  createCourse,
  getCourseLectures,
  addLecture,
  deleteCourse,
  deleteLecture,
} from "../controllers/courseController.js";
import singleUpload from "../middlewares/multer.js";
import { authorizeAdmin, authorizeSubscribers, isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

// Get All Courses without lectures
router.route("/courses").get(getAllCourses);

// Create New Course only Admin
router
  .route("/createcourse")
  .post(isAuthenticated, authorizeAdmin, singleUpload, createCourse);

// Get Course Lectures //  Add Lecture  // Delete Course
router
  .route("/course/:id")
  .get(isAuthenticated,authorizeSubscribers ,getCourseLectures)
  .post(isAuthenticated, authorizeAdmin, singleUpload, addLecture)
  .delete(isAuthenticated, authorizeAdmin, deleteCourse);

// Delete Lecture
router
.route("/lecture")
.delete(isAuthenticated, authorizeAdmin, deleteLecture);
//Get Course Details(lectures)

export default router;
