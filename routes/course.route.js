import { Router } from "express";
import { createCourse , getAllCourses } from "../controllers/course.controller.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const courseRouter = Router();

courseRouter.get("/",getAllCourses).post("/", isLoggedIn, upload.single("thumbnail"), createCourse);

export { courseRouter };
