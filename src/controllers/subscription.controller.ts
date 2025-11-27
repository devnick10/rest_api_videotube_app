import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model";
import { ApiError, ValidationError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Request } from "express";
import {
  getSubscribedChannelsSchema,
  getUserChannelSubscribersSchema,
  toggleSubscriptionSchema,
} from "../schema/subscriptionSchema";

const toggleSubscription = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = toggleSubscriptionSchema.safeParse(
    req.params
  );
  if (!success) {
    throw new ValidationError(error);
  }

  const { channelId } = data;
  const subscriberId = req.userId;
  // Check if the subscription already exists
  const existingSubscription = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });

  if (existingSubscription) {
    // Unsubscribe
    await Subscription.deleteOne({ _id: existingSubscription._id });

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Successfully unsubscribed."));
    return;
  } else {
    // Subscribe
    const newSubscription = await Subscription.create({
      subscriber: subscriberId,
      channel: channelId,
    });

    res
      .status(200)
      .json(new ApiResponse(200, newSubscription, "Successfully subscribed."));
    return;
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = getUserChannelSubscribersSchema.safeParse(
    req.params
  );
  if (!success) {
    throw new ValidationError(error);
  }

  const { channelId } = data;
  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid Channel ID.");
  }

  // Aggregation pipeline
  const subscribers = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(channelId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberInfo",
      },
    },
    {
      $unwind: "$subscriberInfo",
    },
    {
      $project: {
        _id: 0,
        subscriberId: "$subscriberInfo._id",
        fullname: "$subscriberInfo.fullname",
        username: "$subscriberInfo.username",
        avatar: "$subscriberInfo.avatar",
      },
    },
  ]);

  if (!subscribers || subscribers.length === 0) {
    throw new ApiError(404, "No subscribers found for the specified channel.");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers fetched successfully.")
    );
  return;
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = getSubscribedChannelsSchema.safeParse(
    req.params
  );
  if (!success) {
    throw new ValidationError(error);
  }

  const { subscriberId } = data;
  const subscribedChannels = await Subscription.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(subscriberId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscriberedTo",
      },
    },
    {
      $project: {
        _id: 0,
        channelId: "$subscribedTo._id",
        fullname: "$subscribedTo.fullname",
        username: "$subscribedTo.username",
        avatar: "$subscribedTo.avatar",
        subscribedAt: "$createdAt",
      },
    },
  ]);

  if (!subscribedChannels) {
    throw new ApiError(409, "Something went wrong while fetched channels");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "Subscribed channels fetched successfully."
      )
    );
  return;
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
