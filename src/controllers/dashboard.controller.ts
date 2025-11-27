import { Request } from "express";
import { Subscription } from "../models/subscription.model";
import { Video } from "../models/video.model";
import { getChannelVideosSchema } from "../schema/dashboardSchema";
import { ApiError, ValidationError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const getChannelStats = asyncHandler<Request>(async (req, res) => {
  const stats = await Video.aggregate([
    {
      $match: { owner: req.userId },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $group: {
        _id: "$owner",
        totalVideos: { $sum: 1 },
        totalViews: { $sum: "$views" },
        totalLikes: { $sum: { $size: "$likes" } },
      },
    },
  ]);

  const subscribersCount = await Subscription.countDocuments({
    subscribedTo: req.userId,
  });

  if (!stats || stats.length === 0) {
    throw new ApiError(404, "No stats found for this channel.");
  }

  const channelStats = {
    totalVideos: stats[0].totalVideos,
    totalViews: stats[0].totalViews,
    totalLikes: stats[0].totalLikes,
    totalSubscribers: subscribersCount,
  };

  res
    .status(200)
    .json(
      new ApiResponse(200, channelStats, "Channel stats fetched successfully.")
    );
  return;
});

const getChannelVideos = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = getChannelVideosSchema.safeParse(req.params);
  if (!success) {
    throw new ValidationError(error);
  }

  // default value page=1 limit=10 set by zod;
  const { page, limit } = data;

  const pageNo = Number(page);
  const pageLimit = Number(limit);
  const skip = (pageNo - 1) * pageLimit;

  const videos = await Video.aggregate([
    { $match: { owner: req.userId } },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $project: {
        title: 1,
        description: 1,
        views: 1,
        thumbnail: 1,
        videoFile: 1,
        createdAt: 1,
        totalLikes: { $size: "$likes" }, // Calculate total likes for each video
      },
    },
    { $sort: { createdAt: -1 } }, // Sort by newest
    { $skip: skip },
    { $limit: pageLimit },
  ]);

  const totalVideos = await Video.countDocuments({ owner: req.userId });

  const response = {
    videos,
    totalVideos,
    currentPage: pageNo,
    totalPages: Math.ceil(totalVideos / pageLimit),
  };

  res
    .status(200)
    .json(
      new ApiResponse(200, response, "Channel videos fetched successfully.")
    );
  return;
});

export { getChannelStats, getChannelVideos };
