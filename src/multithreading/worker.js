import { parentPort, workerData } from "node:worker_threads";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import { console } from "node:inspector";
import process from "node:process";

const cloudinaryUploader = async (images) => {
  cloudinary.config({
    cloud_name: `${process.env.CLOUDINARY_CLOUD_NAME}`,
    api_key: `${process.env.CLOUDINARY_API_KEY}`,
    api_secret: `${process.env.CLOUDINARY_API_SECRET}`,
  });

  try {
    if (!images || images.length === 0) return [];
    // Upload all images in parallel
    const uploadResults = await Promise.all(
      images.map((localFilePath) =>
        cloudinary.uploader.upload(localFilePath, {
          folder: "videotube_project",
          resource_type: "auto",
          transformation: [
            { width: 1000, crop: "scale" },
            { quality: "auto" },
            { fetch_format: "auto" },
          ],
        })
      )
    );
    // Delete local files after all uploads complete
    await Promise.all(images.map((file) => fs.unlink(file)));
    console.log("local files deleted after aupload");
    return uploadResults.map((result, index) => ({
      ...result,
      localFilePath: images[index],
    }));
  } catch (error) {
    console.error("File uploading failed.", {
      message: error.message,
      stack: error.stack,
    });
    // remove the locally saved temp file.
    await Promise.all(images.map((file) => fs.unlink(file)));
    return null;
  }
};

function uploadImages() {
  const data = workerData;
  cloudinaryUploader(data).then((result) => {
    parentPort?.postMessage(result);
  });
  // Send data back to main thread using parentPort.postMessage
}
uploadImages();
