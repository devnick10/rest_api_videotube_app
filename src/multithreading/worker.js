/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
const { parentPort, workerData } = require("node:worker_threads");
const { v2: cloudinary } = require("cloudinary");
const fs = require("fs/promises");
const process = require("node:process");
const { console } = require("node:inspector");

async function cloudinaryUploader(images) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    if (!images || images.length === 0) return [];

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

    await Promise.all(images.map((file) => fs.unlink(file)));
    console.log("Local files deleted after upload");

    return uploadResults.map((result, index) => ({
      ...result,
      localFilePath: images[index],
    }));
  } catch (error) {
    console.error("File uploading failed.", {
      message: error.message,
      stack: error.stack,
    });

    await Promise.all(images.map((file) => fs.unlink(file)));
    return null;
  }
}

async function uploadImages() {
  const data = workerData;

  try {
    const result = await cloudinaryUploader(data);
    parentPort.postMessage(result);
  } catch (error) {
    parentPort.postMessage(null);
  }
}

uploadImages();
