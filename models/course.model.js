import { Schema, model } from "mongoose";

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      maxlength: [50, "Title cannot be more than 50 characters"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [20, "Title must be atleast 20 characters"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    thubmnail: {
      public_id: {
        type: String,
      },
      secure_url: {
        type: String,
      },
    },
    instructor: {
      type: String,
      required: [true, "Instructor name is required"],
      trim: true,
    },
    lectures: [{
      title: String,
      description: String,
      lecture: {
        public_id: {
          type: String,
        },
        secure_url: {
          type: String,
        },
      },
    }],
    numberOfLectures: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Course = model("Course", courseSchema);
export default Course;
