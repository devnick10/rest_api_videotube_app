import { Request } from "express";
import { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model";
import {
  toggleCommentLikeSchema,
  toggleTweetLikeSchema,
  toggleVideoLikeSchema,
} from "../schema/likeSchema";
import { ApiError, ValidationError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const toggleVideoLike = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = toggleVideoLikeSchema.safeParse(req.params);
  if (!success) {
    throw new ValidationError(error);
  }

  const { videoId } = data;
  const check = isValidObjectId(videoId);
  if (!check) {
    throw new ApiError(400, "Invalid video Id.");
  }

  const exitstingLike = await Like.findOne({
    likedBy: req.userId,
    video: videoId,
  });

  if (exitstingLike) {
    await Like.findByIdAndDelete(exitstingLike._id);
    res.status(200).json(new ApiResponse(200, "Unlike successfully."));
    return;
  }

  const addLikeToVideo = await Like.create({
    video: videoId,
    likedBy: req.userId,
  });

  if (!addLikeToVideo) {
    throw new ApiError(500, "Something went wrong while like video.");
  }

  res.status(201).json(new ApiResponse(201, "Like successfully."));
  return;
});

const toggleCommentLike = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = toggleCommentLikeSchema.safeParse(
    req.params
  );
  if (!success) {
    throw new ValidationError(error);
  }

  const { commentId } = data;
  const check = isValidObjectId(commentId);
  if (!check) {
    throw new ApiError(400, "Invalid comment Id.");
  }

  const exitstingCommentLike = await Like.findOne({
    likedBy: req.userId,
    comment: commentId,
  });

  if (exitstingCommentLike) {
    await Like.findByIdAndDelete(exitstingCommentLike._id);
    res.status(200).json(new ApiResponse(200, "Unlike successfully."));
    return;
  }

  const addLikeToComment = await Like.create({
    comment: commentId,
    likedBy: req.userId,
  });

  if (!addLikeToComment) {
    throw new ApiError(500, "Something went wrong while like.");
  }

  res.status(201).json(new ApiResponse(201, "Like successfully."));
  return;
});

const toggleTweetLike = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = toggleTweetLikeSchema.safeParse(req.params);
  if (!success) {
    throw new ValidationError(error);
  }

  const { tweetId } = data;
  const check = isValidObjectId(tweetId);
  if (!check) {
    throw new ApiError(400, "Invalid tweet Id.");
  }

  const exitstingTweetLike = await Like.findOne({
    likedBy: req.userId,
    tweet: tweetId,
  });

  if (exitstingTweetLike) {
    await Like.findByIdAndDelete(exitstingTweetLike._id);
    res.status(200).json(new ApiResponse(200, "Unlike successfully."));
    return;
  }

  const addLikeToTweet = await Like.create({
    tweet: tweetId,
    likedBy: req.userId,
  });

  if (!addLikeToTweet) {
    throw new ApiError(500, "Something went wrong while like.");
  }

  res.status(201).json(new ApiResponse(201, "Like successfully."));
  return;
});

const getLikedVideos = asyncHandler<Request>(async (req, res) => {
  const likedVidoes = await Like.aggregate([
    {
      $match: { likedBy: req.userId },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              _id: 1,
              title: 1,
              description: 1,
              thumbnail: 1,
              videoFile: 1,
              createdAt: 1,
            },
          },
        ],
        as: "videoDetails",
      },
    },
    {
      $unwind: "$videoDetails",
    },
    {
      $project: {
        videoDetails: 1,
      },
    },
  ]);

  if (!likedVidoes || likedVidoes.length === 0) {
    res.status(404).json(new ApiResponse(404, "No liked videos found."));
    return;
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, likedVidoes, "Liked videos fetched successfully.")
    );
  return;
});

export { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike };
