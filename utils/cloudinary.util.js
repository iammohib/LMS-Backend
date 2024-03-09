import { v2 as cloudinary } from "cloudinary";

const uploadOnCloudinary = async (imagePath, option) => {
  return await cloudinary.uploader.upload(imagePath, option);
};

export default uploadOnCloudinary;
