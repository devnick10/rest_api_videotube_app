import { Request } from "express";
import { Tweet } from "../models/tweet.model";
import { ApiError, ValidationError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createTweetSchema,
  deleteTweetSchema,
  getUserTweetsSchema,
  updateTweetParamSchema,
  updateTweetSchema,
} from "../schema/tweetSchema";

const createTweet = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = createTweetSchema.safeParse(req.body);
  if (!success) {
    throw new ValidationError(error);
  }

  const { content } = data;
  const tweet = await Tweet.create({
    content,
    owner: req.userId,
  });

  if (!tweet) {
    throw new ApiError(200, "Something went wrong while create tweet.");
  }

  res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully."));
  return;
});

const getUserTweets = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = getUserTweetsSchema.safeParse(req.params);
  if (!success) {
    throw new ValidationError(error);
  }

  const { userId } = data;
  const userTweets = await Tweet.find({ _id: userId });

  if (!userTweets) {
    throw new ApiError(409, "Something went wrong while fetch tweets.");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { tweets: userTweets },
        "Tweet fetched successfully."
      )
    );
  return;
});

const updateTweet = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = updateTweetSchema.safeParse(req.body);
  const {
    success: isValidParams,
    error: paramsValidationError,
    data: paramsData,
  } = updateTweetParamSchema.safeParse(req.params);
  if (!success) {
    throw new ValidationError(error);
  }
  if (!isValidParams) {
    throw new ValidationError(paramsValidationError);
  }
  const { tweetId } = paramsData;
  const { content } = data;

  const tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      content,
    },
    { new: true }
  );

  if (!tweet) {
    throw new ApiError(409, "Something went wrong while update tweet.");
  }

  res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated sccussefully."));
  return;
});

const deleteTweet = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = deleteTweetSchema.safeParse(req.body);
  if (!success) {
    throw new ValidationError(error);
  }

  const { tweetId } = data;
  const tweet = await Tweet.findByIdAndDelete(tweetId);

  if (!tweet) {
    throw new ApiError(409, "Something went wrong while deleting tweet.");
  }

  res.status(200).json(new ApiResponse(200, "Tweet deleted sccussefully."));
  return;
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
