import { v2 as cloudinary } from "cloudinary";

export const uploadOnCloudinary = async (imagePath, option) => {
  try {
    return await cloudinary.uploader.upload(imagePath, option);
  } catch (error) {
    throw new Error(`Something went wrong!, error: ${error.message}`);
  }
};

export const destroyImageOnCloudinary = async (public_id, resource_type) => {
  try {
    return await cloudinary.uploader.destroy(public_id, resource_type);
  } catch (error) {
    throw new Error(`Something went wrong!, error: ${error.message}`);
  }
};

export const deleteFolderWithContentsOnCloudinary = async (folder) => {
  try {
    // Fetch all resources (videos and other files) in the specified folder
    const { resources } = await cloudinary.search
      .expression(`folder:${folder}`)
      .execute();

    // Delete all resources (files) in the folder
    for (const resource of resources) {
      await cloudinary.api.delete_resources([resource.public_id], {
        type: resource.type,
        resource_type: resource.resource_type,
      });
    }

    // Finally deleting the folder
    await cloudinary.api.delete_folder(folder);
  } catch (error) {
    throw new Error("Error deleting files:", error.message);
  }
};
