import { Request } from "express";
import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comments.model";
import {
  addCommentParamsSchema,
  addCommentSchema,
  deleteCommentSchema,
  getVideoCommentsParamsSchema,
  getVideoCommentsQuerySchema,
  updateCommentParamsSchema,
  updateCommentSchema,
} from "../schema/commentSchema";
import { ApiError, ValidationError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const getVideoComments = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = getVideoCommentsParamsSchema.safeParse(
    req.params
  );
  const {
    success: isValidQuery,
    error: queryValidationError,
    data: queryData,
  } = getVideoCommentsQuerySchema.safeParse(req.query);
  if (!success) {
    throw new ValidationError(error);
  }
  if (!isValidQuery) {
    throw new ValidationError(queryValidationError);
  }

  const { videoId } = data;
  const { page, limit } = queryData;

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
  return;
});

const addComment = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = addCommentSchema.safeParse(req.body);
  if (!success) {
    throw new ValidationError(error);
  }

  const {
    success: isValidParams,
    error: paramsValidationError,
    data: paramsData,
  } = addCommentParamsSchema.safeParse(req.params);
  if (!isValidParams) {
    throw new ValidationError(paramsValidationError);
  }

  const { videoId } = paramsData;
  const { content } = data;

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.userId,
  });

  if (!comment) {
    throw new ApiError(400, "Something went wrong while add comment.");
  }

  res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully."));
  return;
});

const updateComment = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = updateCommentSchema.safeParse(req.body);
  if (!success) {
    throw new ValidationError(error);
  }

  const {
    success: isValidParams,
    error: paramsValidationError,
    data: paramsData,
  } = updateCommentParamsSchema.safeParse(req.params);
  if (!isValidParams) {
    throw new ValidationError(paramsValidationError);
  }

  const { commentId } = paramsData;
  const { content } = data;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Valid comment ID.");
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

  res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully."));
  return;
});

const deleteComment = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = deleteCommentSchema.safeParse(req.params);
  if (!success) {
    throw new ValidationError(error);
  }

  const { commentId } = data;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Valid comment ID.");
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);
  if (!deletedComment) {
    throw new ApiError(404, "Something went wrong while deleting comment.");
  }

  res.status(200).json(new ApiResponse(200, "Comment deleted successfully."));
  return;
});

export { addComment, deleteComment, getVideoComments, updateComment };
