import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model"
import {ApiError} from "../utils/ApiError"
import {ApiResponse} from "../utils/ApiResponse"
import {asyncHandler} from "../utils/asyncHandler"
import { throwDeprecation, title } from "process"
import { IRequest } from "./user.controller"

const toggleVideoLike = asyncHandler(async (req:IRequest, res) => {

    const {videoId} = req.params

    const check = isValidObjectId(videoId);
    if (!check) {
        
        throw new ApiError(400,"Invalid video Id.")
    }

    const exitstingLike = await Like.findOne({likedBy:req.user._id,video:videoId})
    
    if (exitstingLike) {
        
        await Like.findByIdAndDelete(exitstingLike._id);

     return  res.status(200).json(new ApiResponse(200,"Unlike successfully."))
    }

    const addLikeToVideo = await Like.create({
       video:videoId,
       likedBy:req.user._id 
    })

    if (!addLikeToVideo) {
        
        throw new ApiError(500,"Something went wrong while like video.")
    }

  return  res.status(201).json(new ApiResponse(201,"Like successfully."))

})

const toggleCommentLike = asyncHandler(async (req:IRequest, res) => {

    const {commentId} = req.params

    const check = isValidObjectId(commentId);
    if (!check) {
        
        throw new ApiError(400,"Invalid comment Id.")
    }

    const exitstingCommentLike = await Like.findOne({likedBy:req.user._id,comment:commentId})
    
    if (exitstingCommentLike) {
        
        await Like.findByIdAndDelete(exitstingCommentLike._id);

      return res.status(200).json(new ApiResponse(200,"Unlike successfully."))

    }

    const addLikeToComment = await Like.create({
       comment:commentId,
       likedBy:req.user._id 
    })

    if (!addLikeToComment) {
        
        throw new ApiError(500,"Something went wrong while like.")
    }

   return res.status(201).json(new ApiResponse(201,"Like successfully."))

})


const toggleTweetLike = asyncHandler(async (req:IRequest, res) => {

    const {tweetId} = req.params


    const check = isValidObjectId(tweetId);
    if (!check) {
        
        throw new ApiError(400,"Invalid tweet Id.")
    }

    const exitstingTweetLike = await Like.findOne({likedBy:req.user._id,tweet:tweetId})
    
    if (exitstingTweetLike) {
        
        await Like.findByIdAndDelete(exitstingTweetLike._id);

      return res.status(200).json(new ApiResponse(200,"Unlike successfully."))

    }

    const addLikeToTweet = await Like.create({
       tweet:tweetId,
       likedBy:req.user._id 
    })

    if (!addLikeToTweet) {
        
        throw new ApiError(500,"Something went wrong while like.")
    }

    return res.status(201).json(new ApiResponse(201,"Like successfully."))
  

}
)

const getLikedVideos = asyncHandler(async (req:IRequest, res) => {
    //TODO: get all liked videos
      
    const likedVidoes = await Like.aggregate([
        
     {
        $match:{likedBy:new mongoose.Types.ObjectId(req.user._id as string)}
     },
     {
        $lookup:{
             from:"videos",
             localField:"video",
             foreignField:"_id",
             pipeline:[
                {
                    $project:{
                        _id:1,
                        title:1,
                        description:1,
                        thumbnail:1,
                        videoFile:1,
                        createdAt:1
                    }
                }
             ],
             as:"videoDetails"
        },
        
     },
     {
        $unwind:"$videoDetails"
     },
     {
        $project:{
            videoDetails:1
        }
     },
     
    ])
   
    if (!likedVidoes || likedVidoes.length === 0) {
        return res.status(404).json(new ApiResponse(404,"No liked videos found."));
    }

    return res.status(200).json(new ApiResponse(
        200,
        likedVidoes,
        "Liked videos fetched successfully."
    ))

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}

