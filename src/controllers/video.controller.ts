import mongoose from "mongoose";
import { Video } from "../models/video.model";
import { ApiError, ValidationError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { cloudinaryUploader } from "../utils/cloudinary";
import logger from "../utils/logger";
import { Request } from "express";
import {
  deleteVideoSchema,
  getAllVideosSchema,
  getVideoByIdSchema,
  publishVideoSchema,
  togglePublishStatusSchema,
  updateVideoParamsSchema,
  updateVideoSchema,
} from "../schema/videoSchema";

const getAllVideos = asyncHandler(async (req, res) => {
  const { success, error, data } = getAllVideosSchema.safeParse(req.query);
  if (!success) {
    throw new ValidationError(error);
  }

  // page=1 and limit=10 default values set in validation schema;
  const { page, limit, query, sortBy, sortType, userId } = data;
  const pageNo = Number(page);
  const pageLimit = Number(limit);

  const skip = (pageNo - 1) * pageLimit;

  const sortDirection = sortType === "desc" ? -1 : 1;

  const videos = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId as string),
        $text: { $search: query as string },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullname: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $sort: { [sortBy as string]: sortDirection },
    },
    {
      $skip: skip,
    },
    {
      $limit: pageLimit,
    },
    {
      $count: "totalVideos",
    },
  ]);

  if (!videos || videos.length === 0) {
    throw new ApiError(404, "No videos found matching the query.");
  }

  const totalVidoes = videos[0].totalVideos;
  const totalPages = Math.ceil(totalVidoes / pageLimit);

  const pagination = {
    totalVidoes,
    totalPages,
    currentPage: pageNo,
    nextPage: pageNo < totalPages,
    prevPage: pageNo > 1,
  };

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videos, pagination },
        "Videos fetched successfully."
      )
    );
  return;
});

const publishAVideo = asyncHandler<Request>(async (req, res) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const { success, error, data } = publishVideoSchema.safeParse(req.body);
  if (!success) {
    throw new ValidationError(error);
  }
  const { title, description } = data;

  const videolocalPath = files.videoFile?.[0]?.path || "";
  const thumbnailLocalPath = files.thumbnail?.[0]?.path || "";

  let video;

  try {
    video = await cloudinaryUploader(videolocalPath);
  } catch (error) {
    logger.debug("Something went wrong while uploading video", {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw new ApiError(409, "Something went wrong while published video");
  }

  let thumbnail;
  try {
    thumbnail = await cloudinaryUploader(thumbnailLocalPath);
  } catch (error) {
    logger.debug("Something went wrong while uploading thumbnail", {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw new ApiError(409, "Something went wrong while published video");
  }

  const publishedVideo = await Video.create({
    videoFile: video?.url,
    thumbnail: thumbnail?.url,
    title,
    description,
    duration: video?.duration,
    owner: req.userId,
  });

  if (!publishedVideo) {
    throw new ApiError(401, "Something went wrong while published video");
  }

  res
    .status(200)
    .json(new ApiResponse(200, publishAVideo, "Video published successfully."));
  return;
});

const getVideoById = asyncHandler(async (req, res) => {
  const { success, error, data } = getVideoByIdSchema.safeParse(req.body);
  if (!success) {
    throw new ValidationError(error);
  }

  const video = await Video.findById(data.videoId);

  if (!video) {
    throw new ApiError(409, "Video not found.");
  }

  res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully."));
  return;
});

const updateVideo = asyncHandler<Request>(async (req, res) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const { success, error, data } = updateVideoSchema.safeParse(req.body);
  if (!success) {
    throw new ValidationError(error);
  }

  const {
    success: isValidParams,
    error: paramsValidationError,
    data: paramsData,
  } = updateVideoParamsSchema.safeParse(req.params);
  if (!isValidParams) {
    throw new ValidationError(paramsValidationError);
  }

  const { videoId } = paramsData;

  const { title, description } = data;

  const thumbnailLocalPath = files.thumbnail?.[0]?.path || "";

  let thumbnail;
  try {
    thumbnail = await cloudinaryUploader(thumbnailLocalPath);
  } catch (error) {
    logger.debug("Error while uploading thubnail", {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw new ApiError(409, "Something went wrong while published video");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      title,
      description,
      thumbnail: thumbnail?.url,
    },
    {
      new: true,
    }
  );

  if (!video) {
    throw new ApiError(409, "Video not found.");
  }

  res
    .status(200)
    .json(new ApiResponse(200, video, "Video Updated Successfully"));
  return;
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { success, error, data } = deleteVideoSchema.safeParse(req.params);
  if (!success) {
    throw new ValidationError(error);
  }
  const { videoId } = data;

  await Video.findByIdAndDelete(videoId);

  res.status(200).json(new ApiResponse(200, "Video delete successfully."));
  return;
});

const togglePublishStatus = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = togglePublishStatusSchema.safeParse(
    req.params
  );
  if (!success) {
    throw new ValidationError(error);
  }
  const { videoId } = data;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(500, "Something went wrong while toggle published");
  }

  video.isPublished = !video.isPublished;

  await video.save();

  res
    .status(200)
    .json(new ApiResponse(200, video, "Toggle published successfully."));
  return;
});

export {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
};
