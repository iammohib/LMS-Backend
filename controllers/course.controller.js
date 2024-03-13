import Course from "../models/course.model.js";
import { AppError } from "../utils/error.util.js";
import { destroyImageOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.util.js";
import fs from "fs/promises";

/**
 * @CREATE_COURSE
 * @ROUTE @POST {{URL}}/api/v1/course/
 * @ACCESS PRIVATE(ADMIN ONLY)
 */
export const createCourse = async (req, res, next) => {
  //  Destructuring neccessary data
  const { title, description, category, instructor } = req.body;
  const thumbnail = req.file;

  // If thumbnail is not there then return with error
  if (!thumbnail) {
    return next(new AppError(400, "Thubnail is required"));
  }
  try {
    // If issue return an error
    if (!title || !description || !category || !instructor) {
      throw new Error("Fill all the feild!");
    }

    // Transformation option for cloudinary
    const option = {
      folder: `lms/courses/${title}`,
      width: 250,
      height: 250,
      crop: "fill",
    };

    // upload thumbnail on clodinary
    const result = await uploadOnCloudinary(thumbnail.path,option);
    if (!result) {
      throw new Error("Internal Server Error");
    }

    const course = await Course.create({
      title,
      description,
      category,
      instructor,
      thubmnail: {
        public_id: result.public_id,
        secure_url: result.secure_url,
      },
    });

    if (!course) {
      await destroyImageOnCloudinary(result.public_id)
      throw new Error("Internal Server Error");
    }
    await course.save();
    fs.rm(thumbnail.path);
    res.status(200).json({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    fs.rm(thumbnail.path);
    return next(new AppError(500, error.message));
  }
};

/**
 * @GET_ALL_COURSES
 * @ROUTE @GET {{URL}}/api/v1/course/
 * @ACCESS Public
 */
export const getAllCourses = async (req,res,next)=>{
  try {
    const course = await Course.find({});
    if (!course) {
      throw new Error("Something went wrong, Course not found!")
    }
    res.status(200).json({
      success: true,
      message: "All Courses fetched",
      course
    })
  } catch (error) {
    return next(new AppError(400,error.message))
  }
}