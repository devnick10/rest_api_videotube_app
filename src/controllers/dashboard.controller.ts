import mongoose from "mongoose"
import {Video} from "../models/video.model"
import {Subscription} from "../models/subscription.model"
import {ApiError} from "../utils/ApiError"
import {ApiResponse} from "../utils/ApiResponse"
import {asyncHandler} from "../utils/asyncHandler"
import { IRequest } from "./user.controller"

const getChannelStats = asyncHandler(async (req:IRequest, res) => {

    const stats = await Video.aggregate([
        {
        $match: { owner: new mongoose.Types.ObjectId(req.user._id as string) },
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
            totalViews: { $sum: "$views" }, // Assuming the Video schema has a `views` field
            totalLikes: { $sum: { $size: "$likes" } },
        },
        },
    ]);
    
    const subscribersCount = await Subscription.countDocuments({
        subscribedTo: req.user._id,
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
    
    return res.status(200).json(new ApiResponse(
        200,
        channelStats,
        "Channel stats fetched successfully."
    ));

})

const getChannelVideos = asyncHandler(async (req:IRequest, res) => {

    const { page = 1, limit = 10 } = req.query;
    
    const pageNo = Number(page);
    const pageLimit = Number(limit);
    const skip = (pageNo - 1) * pageLimit;
    
    const videos = await Video.aggregate([
        { $match: {owner: new mongoose.Types.ObjectId(req.user._id as string) } },
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
            description:1,
            views: 1,
            thumbnail:1,
            videoFile:1,
            createdAt: 1,
            totalLikes: { $size: "$likes" }, // Calculate total likes for each video
        },
        },
        { $sort: { createdAt: -1 } }, // Sort by newest
        { $skip: skip },
        { $limit: pageLimit },
    ]);
    
    const totalVideos = await Video.countDocuments({ owner: req.user._id });
    
    const response = {
        videos,
        totalVideos,
        currentPage: pageNo,
        totalPages: Math.ceil(totalVideos / pageLimit),
    };
    
    return res.status(200).json(new ApiResponse(
        200,
        response,
        "Channel videos fetched successfully."
    ));

      
})

export {
    getChannelStats, 
    getChannelVideos
    }