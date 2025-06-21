import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";

const cloudinaryUploader = async (localFilePath: string) => {
  // Configuration
  cloudinary.config({
    cloud_name: `${process.env.CLOUDINARY_CLOUD_NAME}`,
    api_key: `${process.env.CLOUDINARY_API_KEY}`,
    api_secret: `${process.env.CLOUDINARY_API_SECRET}`,
  });

  try {
    if (!localFilePath) return null;

    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      folder: "videotube_project",
      resource_type: "auto",
      transformation: [
        { width: 1000, crop: "scale" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    await fs.unlink(localFilePath);

    console.log("local files deleted after aupload");

    return uploadResult;
  } catch (error) {
    console.log("File uploading failed.", error);

    fs.unlink(localFilePath); // remove the locally saved temp file.
    return null;
  }
};

const deleteFromCloudinary = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);

    console.log("Deleted from cloudinary. Public id", result);
  } catch (error) {
    console.log("Error deleting from cloudinary.", error);
    return null;
  }
};

export { cloudinaryUploader, deleteFromCloudinary };
