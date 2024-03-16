import Course from "../models/course.model.js";
import { AppError } from "../utils/error.util.js";
import {
  deleteFolderWithContentsOnCloudinary,
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

    // Check if course exists with the with provided title
    const courseExist = await Course.findOne({ title });
    if (courseExist) {
      throw new Error(
        "Course is already exist with this title, use unique one"
      );
    }

    // First create course then add thumbnail
    const course = await Course.create({
      title,
      description,
      category,
      instructor,
      thubmnail: {
        public_id: " ",
        secure_url: " ",
        folder: " ",
      },
    });

    if (!course) {
      throw new Error("Internal Server Error");
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

    // Saving thumbnail details in DB
    course.thubmnail.public_id = result.public_id;
    course.thubmnail.secure_url = result.secure_url;
    course.thubmnail.folder = result.folder;

    // Saving in DB
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
      resource_type: "video",
    };
    // Upload file on cloudinary
    const result = await uploadOnCloudinary(lecture.path, option);
    // console.log(result)
    if (!result) {
      throw new Error("Server Error!");
    }

    // Saving lecture detail in DB
    const lectureData = {
      public_id: result.public_id,
      secure_url: result.secure_url,
    };
    course.lectures.push({
      title,
      description,
      lecture: lectureData,
    });

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
 * @ROUTE @GET {{URL}}/api/v1/course/:id
 * @ACCESS PROTECTED(SUBSRIBERS ONLY)
 */
export const getLecturesByCourseId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      return next(new AppError(400, "Something went wrong, Course not found"));
    }
    const lecture = course.lectures;
    res.status(200).json({
      success: true,
      message: "Lecture fetched",
      lecture,
    });
  } catch (error) {
    return next(new AppError(400, error.message));
  }
};

/**
 * @updateCourse
 */
export const updateCourse = async (req, res, next) => {
  const thumbnail = req.file;
  const { title } = req.body;
  try {
    // If title throw error
    if (title) {
      throw new Error("Title can't modified");
    }

    // Take Id from URL
    const { id } = req.params;

    // Check course existance and update
    const course = await Course.findByIdAndUpdate(
      id,
      { $set: req.body },
      { runValidators: true }
    );
    if (!course) {
      throw new Error("Course Doesn't exist !");
    }
    console.log("for debug");

    // Updating thumbnail of the course, if thumbnail is there
    if (thumbnail) {
      // Transformation option for cloudinary
      const option = {
        folder: `lms/courses/${course.title}`,
        width: 250,
        height: 250,
        crop: "fill",
      };

      // upload thumbnail on cloudinary
      const result = await uploadOnCloudinary(thumbnail.path, option);
      if (!result) {
        throw new Error("Server Error!, thumbnail could'nt be updated");
      }
      // Deleting old thumbnail from cloudinary
      await destroyImageOnCloudinary(course.thubmnail.public_id);

      // Saving new thumbnail details
      course.thubmnail.public_id = result.public_id;
      course.thubmnail.secure_url = result.secure_url;

      // Deleting the local file
      fs.rm(thumbnail.path);
    }

    // Saving details in DB
    await course.save();

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
    });
  } catch (error) {
    if (thumbnail) {
      fs.rm(thumbnail.path);
    }
    return next(new AppError(400, error.message));
  }
};

/**
 * @deleteCourse
 */
export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Checking if course exist, if noe thorw error
    const course = await Course.findById(id);
    if (!course) {
      return next(
        new AppError(400, "Something went wrong!, Course not found.")
      );
    }

    // Deleting the course files,folder on cloudinary, if not, throw error
    await deleteFolderWithContentsOnCloudinary(course.thubmnail.folder);

    // Deleting course on the folder
    await Course.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    return next(new AppError(400, error.message));
  }
};

/**
 * @removeLectureFromCourse
 */
export const removeLectureFromCourse = async (req, res, next) => {
  try {
    // Destructuring details from req.query
    const { courseId, lectureId } = req.query;

    if (!courseId || !lectureId) {
      return next(new AppError(400, "Internal server error"));
    }

    // Checking if course exist or not
    const course = await Course.findById(courseId);
    if (!course) {
      return next(new AppError(400, "Course not found"));
    }

    // Find the index of the lecture using the lectureId
    const lectureIndex = course.lectures.findIndex(
      (lecture) => lecture._id.toString() === lectureId.toString()
    );

    // If `lectureIndex = -1` then send error
    if (lectureIndex === -1) {
      return next(new AppError(400, "Lecture doesn't exist"));
    }

    // Delete the  lecture from the cloudinary first
    await destroyImageOnCloudinary(
      course.lectures[lectureIndex].lecture.public_id,
      {
        resource_type: "video",
      }
    );

    // Remove the lecture from array of lectures in DB
    course.lectures.splice(lectureIndex, 1);

    // Update the number of lectures
    course.numberOfLectures = course.lectures.length;

    // Saving the course object
    await course.save();

    res.status(200).json({
      lectureIndex,
      success: true,
      message: "Lecture removed successfully",
      courseId,
      lectureId,
      course,
    });
  } catch (error) {
    return next(new AppError(400, error.message));
  }
};
