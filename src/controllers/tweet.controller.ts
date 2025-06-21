import { Tweet } from "../models/tweet.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { IRequest } from "./user.controller";

const createTweet = asyncHandler(async (req: IRequest, res) => {
  const { content } = req.body;

  if (!content) {
    throw new ApiError(200, "Content is required.");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
  });

  if (!tweet) {
    throw new ApiError(200, "Something went wrong while create tweet.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully."));
});

const getUserTweets = asyncHandler(async (req: IRequest, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(409, "User ID required.");
  }

  const userTweets = await Tweet.find({ _id: userId });

  if (!userTweets) {
    throw new ApiError(409, "Something went wrong while fetch tweets.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { tweets: userTweets },
        "Tweet fetched successfully."
      )
    );
});

const updateTweet = asyncHandler(async (req: IRequest, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!tweetId) {
    throw new ApiError(409, "Tweet ID required.");
  }

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

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated sccussefully."));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(409, "Tweet ID required.");
  }

  const tweet = await Tweet.findByIdAndDelete(tweetId);

  if (!tweet) {
    throw new ApiError(409, "Something went wrong while deleting tweet.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Tweet deleted sccussefully."));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
