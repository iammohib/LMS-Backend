import { Router } from "express";
import {
  createCourse,
  getAllCourses,
  addLectureToCourse,
  getLecturesByCourseId,
  updateCourse,
  deleteCourse
} from "../controllers/course.controller.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const courseRouter = Router();

courseRouter
  .route("/")
  .get(getAllCourses)
  .post(isLoggedIn, upload.single("thumbnail"), createCourse);

courseRouter
  .route("/:id")
  .get(getLecturesByCourseId)
  .post(isLoggedIn,upload.single("lecture"),addLectureToCourse)
  .put(updateCourse)
  .delete(deleteCourse);

export { courseRouter };
