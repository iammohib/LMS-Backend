import { v2 as cloudinary } from "cloudinary";

export const uploadOnCloudinary = async (imagePath, option) => {
  return await cloudinary.uploader.upload(imagePath, option);
};

export const destroyImageOnCloudinary = async (public_id) => {
  return await cloudinary.uploader.destroy(public_id);
};
