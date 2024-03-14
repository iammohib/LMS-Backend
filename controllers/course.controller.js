import Course from "../models/course.model.js";
import { AppError } from "../utils/error.util.js";
import {
  destroyImageOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.util.js";
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
    return next(new AppError(400, "Thumbnail is required"));
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
    const result = await uploadOnCloudinary(thumbnail.path, option);
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
      await destroyImageOnCloudinary(result.public_id);
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
export const getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({}).select("-lectures");
    if (!courses) {
      return next(new AppError("Something went wrong, Course not found!"));
    }
    res.status(200).json({
      success: true,
      message: "All Courses fetched",
      courses,
    });
  } catch (error) {
    return next(new AppError(400, error.message));
  }
};

/**
 * @ADD_LECTURES_TO_COURSE
 * @ROUTE @POST {{URL}}/api/v1/course/:id
 * @ACCESS PRIVATE(ADMIN ONLY)
 */
export const addLectureToCourse = async (req, res, next) => {
  const lecture = req.file;
  if (!lecture) {
    return new AppError(400, "Provide lecture video");
  }
  try {
    // Destructring the neccessary data
    const { title, description } = req.body;
    const { id } = req.params;

    if (!title || !description) {
      throw new Error("Title and description are required");
    }

    // Checking course detail in DB
    const course = await Course.findById(id);
    if (!course) {
      throw new Error("Something went wrong, Course not found!");
    }

    const option = {
      folder: `lms/courses/${course.title}`,
      resource_type: 'video'
    }
    // Upload file on cloudinary
    const result = await uploadOnCloudinary(lecture.path,option);
    // console.log(result)
    if (!result) {
      throw new Error("Server Error!");
    }

    // Saving lecture detail in DB
    const lectureData = {
      public_id: result.public_id,
      secure_url: result.secure_url
    }
    course.lectures.push({
      title,
      description,
      lecture: lectureData
    })

    course.numberOfLectures = course.lectures.length;

    await course.save();
    fs.rm(lecture.path);

    res.status(200).json({
      success: true,
      message: "Course fetched",
      course,
    });
  } catch (error) {
    fs.rm(lecture.path);
    return next(new AppError(400, error.message));
  }
};

/**
 * @GET_LECTURES_BY_COURSEID
 */
export const getLecturesByCourseId = async (req, res, next) => {
  try {
  } catch (error) {
    return next(new AppError(400, error.message));
  }
};

/**
 * @updateCourse
 */
export const updateCourse = async (req, res, next) => {
  try {
  } catch (error) {
    return next(new AppError(400, error.message));
  }
};

/**
 * @deleteCourse
 */
export const deleteCourse = async (req, res, next) => {
  try {
  } catch (error) {
    return next(new AppError(400, error.message));
  }
};
