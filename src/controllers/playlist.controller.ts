import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model";
import { ApiError, ValidationError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Request } from "express";
import {
  addVideoToPlaylistSchema,
  createPlaylistSchema,
  deletePlaylistSchema,
  getPlaylistByIdSchema,
  getUserPlaylistsSchema,
  removeVideoFromPlaylistSchema,
  updatePlaylistParamsSchema,
  updatePlaylistSchema,
} from "../schema/playlistSchema";

const createPlaylist = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = createPlaylistSchema.safeParse(req.body);
  if (!success) {
    throw new ValidationError(error);
  }

  const { name, description } = data;
  const playlist = await Playlist.create({
    name,
    description,
    owner: req.userId,
  });

  if (!playlist) {
    throw new ApiError(401, "Something went wrong while creating playlist.");
  }

  res.status(200).json(new ApiResponse(200, "Playlist created successfully."));
  return;
});

const getUserPlaylists = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = getUserPlaylistsSchema.safeParse(req.params);
  if (!success) {
    throw new ValidationError(error);
  }

  const { userId } = data;
  const userPlaylist = await Playlist.aggregate([
    {
      $match: { owner: new mongoose.Types.ObjectId(userId) },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        videos: {
          title: 1,
          duration: 1,
          thumbnail: 1,
          videoFile: 1,
          views: 1,
        },
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { playlists: userPlaylist },
        "Playlists fetched successfully."
      )
    );
  return;
});

const getPlaylistById = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = getPlaylistByIdSchema.safeParse(req.params);
  if (!success) {
    throw new ValidationError(error);
  }

  const { playlistId } = data;
  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(401, "Something went wrong while fetch playlist.");
  }

  res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully."));
  return;
});

const addVideoToPlaylist = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = addVideoToPlaylistSchema.safeParse(
    req.params
  );
  if (!success) {
    throw new ValidationError(error);
  }

  const { playlistId, videoId } = data;
  const addedvideo = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: { videos: videoId },
    },
    { new: true }
  );

  if (!addedvideo) {
    throw new ApiError(401, "Something went wrong while adding video.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { playlist: addedvideo },
        "Video added successfully."
      )
    );
});

const removeVideoFromPlaylist = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = removeVideoFromPlaylistSchema.safeParse(
    req.params
  );
  if (!success) {
    throw new ValidationError(error);
  }

  const { playlistId, videoId } = data;
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId },
    },
    {
      new: true,
    }
  );

  if (!updatedPlaylist) {
    throw new ApiError(409, "Something went wrong while remove video.");
  }

  res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video removed Successfully."));
  return;
});

const deletePlaylist = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = deletePlaylistSchema.safeParse(req.params);
  if (!success) {
    throw new ValidationError(error);
  }
  const { playlistId } = data;

  if (!playlistId) {
    throw new ApiError(400, "Playlist ID required.");
  }

  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

  if (!deletedPlaylist) {
    throw new ApiError(401, "Something went wrong while deleting playlist.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Playlist deleted successfully."));
});

const updatePlaylist = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = updatePlaylistSchema.safeParse(req.body);
  const {
    success: isValidparams,
    error: paramsValidationError,
    data: paramsData,
  } = updatePlaylistParamsSchema.safeParse(req.params);
  if (!success) {
    throw new ValidationError(error);
  }
  if (!isValidparams) {
    throw new ValidationError(paramsValidationError);
  }

  const { playlistId } = paramsData;
  const { name, description } = data;

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      name,
      description,
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(409, "Something went wrong while update playlist.");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist updated successfully.")
    );
  return;
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
