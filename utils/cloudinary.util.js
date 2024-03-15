import { v2 as cloudinary } from "cloudinary";

export const uploadOnCloudinary = async (imagePath, option) => {
  try {
    return await cloudinary.uploader.upload(imagePath, option);
  } catch (error) {
    throw new Error("Something went wrong!");
  }
};

export const destroyImageOnCloudinary = async (public_id) => {
  try {
    return await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    throw new Error("Something went wrong!");
  }
};

export const deleteFolderWithContentsOnCloudinary = async (folder) => {
  // TODO
  try {
    return await cloudinary.api.delete_resources_by_prefix(folder);
    // await cloudinary.api.delete_folder(folder);
  } catch (error) {
    throw new Error("Something went wrong!");
  }
};
