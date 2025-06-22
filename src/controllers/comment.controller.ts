import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Comment } from "../models/comments.model";
import { IRequest } from "./user.controller";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const pageNo = Number(page);
  const pageLimit = Number(limit);

  const skip = (pageNo - 1) * pageLimit;

  if (!videoId) {
    throw new ApiError(400, "Video ID required");
  }

  const commentsData = await Comment.aggregate([
    { $match: { video: new mongoose.Types.ObjectId(videoId) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              _id: 1,
              name: 1,
              avatar: 1,
              fullname: 1,
              email: 1,
            },
          },
        ],
        as: "ownerDetails",
      },
    },
    {
      $project: {
        content: 1,
        owner: { $arrayElemAt: ["$ownerDetails", 0] },
        createdAt: 1,
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        comments: [{ $skip: skip }, { $limit: pageLimit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  const totalCount = commentsData[0]?.totalCount[0]?.count || 0; // Extract total count
  const comments = commentsData[0]?.comments || [];

  // Pagination metadata
  const pagination = {
    totalComments: totalCount,
    totalPages: Math.ceil(totalCount / pageLimit),
    currentPage: pageNo,
    hasNextPage: pageNo * pageLimit < totalCount,
    hasPrevPage: pageNo > 1,
  };

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { comments, pagination },
        "Comments fetched successfully."
      )
    );
});

const addComment = asyncHandler(async (req: IRequest, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!videoId || !content) {
    throw new ApiError(400, "Video ID and content required.");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });

  if (!comment) {
    throw new ApiError(400, "Something went wrong while add comment.");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully."));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Valid comment ID.");
  }

  if (!content) {
    throw new ApiError(400, "Comment id required.");
  }

  const comment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: { content },
    },
    { new: true }
  );

  if (!comment) {
    throw new ApiError(404, "Something went wrong while update comment.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully."));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Valid comment ID.");
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment) {
    throw new ApiError(404, "Something went wrong while deleting comment.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Comment deleted successfully."));
});

export { getVideoComments, addComment, updateComment, deleteComment };
