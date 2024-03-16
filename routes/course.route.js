import { Router } from "express";
import {
  createCourse,
  getAllCourses,
  addLectureToCourse,
  getLecturesByCourseId,
  updateCourse,
  deleteCourse,
  removeLectureFromCourse,
} from "../controllers/course.controller.js";
import { isLoggedIn , authorizeRoles} from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const courseRouter = Router();

courseRouter
  .route("/")
  .get(getAllCourses)
  .post(
    isLoggedIn,
    authorizeRoles("ADMIN"),
    upload.single("thumbnail"),
    createCourse
  )
  .delete(isLoggedIn, authorizeRoles("ADMIN"), removeLectureFromCourse);

courseRouter
  .route("/:id")
  .get(isLoggedIn, getLecturesByCourseId)
  .post(
    isLoggedIn,
    authorizeRoles("ADMIN"),
    upload.single("lecture"),
    addLectureToCourse
  )
  .put(
    isLoggedIn,
    authorizeRoles("ADMIN"),
    upload.single("thumbnail"),
    updateCourse
  )
  .delete(isLoggedIn, authorizeRoles("ADMIN"), deleteCourse);

export { courseRouter };
