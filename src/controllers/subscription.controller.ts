import mongoose from "mongoose"
import { Subscription } from "../models/subscription.model"
import {ApiError} from "../utils/ApiError"
import {ApiResponse} from "../utils/ApiResponse"
import {asyncHandler} from "../utils/asyncHandler"
import { IRequest } from "./user.controller"


const toggleSubscription = asyncHandler(async (req:IRequest, res) => {

    const { channelId } = req.params;

    if (!channelId) {
        throw new ApiError(409, "Channel ID is required.");
    }

    const subscriberId = req.user._id; 

    // Check if the subscription already exists
    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId,
    });

    if (existingSubscription) {

        // Unsubscribe
        await Subscription.deleteOne({ _id: existingSubscription._id });

        res.status(200).json(
            new ApiResponse(200,{}, "Successfully unsubscribed.")
        );
    } else {

        // Subscribe
        const newSubscription = await Subscription.create({
            subscriber: subscriberId,
            channel: channelId,
        });

        res.status(200).json(
            new ApiResponse(200, newSubscription, "Successfully subscribed.")
        );
    }


})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
  
    // Validate channelId
    if (!channelId) {
      throw new ApiError(400, "Channel ID is required.");
    }
  
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      throw new ApiError(400, "Invalid Channel ID.");
    }
  
    // Aggregation pipeline
    const subscribers = await Subscription.aggregate([
      {
        $match: { channel: new mongoose.Types.ObjectId(channelId) } 
      },
      {
        $lookup: {
          from: "users", 
          localField: "subscriber",
          foreignField: "_id", 
          as: "subscriberInfo" 
        }
      },
      {
        $unwind: "$subscriberInfo"
      },
      {
        $project: {
          _id: 0, 
          subscriberId: "$subscriberInfo._id",
          fullname: "$subscriberInfo.fullname", 
          username: "$subscriberInfo.username", 
          avatar: "$subscriberInfo.avatar" 
        }
      }
    ]);
  
    if (!subscribers || subscribers.length === 0) {
      throw new ApiError(404, "No subscribers found for the specified channel.");
    }
  
    res.status(200).json(
      new ApiResponse(
        200,
        subscribers,
        "Subscribers fetched successfully."
      )
    );
  });
  

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {

  const { subscriberId } = req.params
    
  if (!subscriberId) {
     
    throw new ApiError(400, "Subscriber ID is required.");
  }
  

  const subscribedChannels = await Subscription.aggregate(
    [
      {
        $match:{_id:new mongoose.Types.ObjectId(subscriberId)}
      },
      {
        $lookup:{
          from:"users",
          localField:"channel",
          foreignField:"_id",
          as:"subscriberedTo"
        }
      },
      {
        $project: {
          _id: 0, 
          channelId: "$subscribedTo._id",
          fullname: "$subscribedTo.fullname",
          username: "$subscribedTo.username",
          avatar: "$subscribedTo.avatar", 
          subscribedAt: "$createdAt" 
        }
      }

    ]
  )

  if (!subscribedChannels) {
    
    throw new ApiError(409,"Something went wrong while fetched channels");
  }

  res.status(200).json(new ApiResponse(
    200,
    subscribedChannels,
    "Subscribed channels fetched successfully."
  ))

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}