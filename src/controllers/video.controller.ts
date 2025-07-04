import mongoose from "mongoose";
import { Video } from "../models/video.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { cloudinaryUploader } from "../utils/cloudinary";
import logger from "../utils/logger";
import { IRequest } from "./user.controller";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

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

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videos, pagination },
        "Videos fetched successfully."
      )
    );
});

const publishAVideo = asyncHandler(async (req: IRequest, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(409, "Title and description required");
  }

  const videolocalPath = req.files?.videoFile?.[0]?.path || "";
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path || "";

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

  try {
    const publishedVideo = await Video.create({
      videoFile: video?.url,
      thumbnail: thumbnail?.url,
      title,
      description,
      duration: video?.duration,
      owner: req.user._id,
    });
    if (!publishedVideo) {
      throw new ApiError(401, "Something went wrong while published video");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, publishAVideo, "Video published successfully.")
      );
  } catch (error) {
    logger.debug("Something went wrong while published video", {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    console.error(error);
    throw new ApiError(401, "Something went wrong while published video");
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(409, "Video id required.");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(409, "Video not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully."));
});

const updateVideo = asyncHandler(async (req: IRequest, res) => {
  const { videoId } = req.params;

  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(409, "Title and description required");
  }

  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path || "";

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

  if (!videoId) {
    throw new ApiError(409, "Video id required.");
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

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video Updated Successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  if (!deletedVideo) {
    throw new ApiError(200, "Something went wrong while deleting video.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Video delete successfully."));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(500, "Something went wrong while toggle published");
  }

  video.isPublished = !video.isPublished;

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Toggle published successfully."));
});

export {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
};
