import { UploadApiResponse } from "cloudinary";
import { Request } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { config } from "../config/config";
import { User } from "../models/user.model";
import { muiltithreadUpload } from "../multithreading";
import {
  changePasswordSchema,
  getUserChannelProfileSchema,
  loginSchema,
  multipleUploadSchema,
  registerSchema,
  updateAccountDetailsSchema,
  uploadAvatarFileSchema,
  uploadCoverImageFileSchema,
} from "../schema/userSchema";
import { ApiError, ValidationError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { cloudinaryUploader, deleteFromCloudinary } from "../utils/cloudinary";
import logger from "../utils/logger";
import fs from "node:fs/promises";
interface UploadResponse extends UploadApiResponse {
  localFilePath: string;
}

const generateAccessAndRefreshToken = async (
  userid: mongoose.Types.ObjectId
): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    const user = await User.findById(userid).select("+refreshToken");
    if (!user)
      throw new ApiError(
        409,
        "User not found . Failed to generate access token."
      );

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    logger.debug("Error while generating access and refresh token.", {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw new ApiError(
      407,
      "Something went wrong while generating access and refresh token"
    );
  }
};

const registerUser = asyncHandler<Request>(async (req, res) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const parsedFiles = multipleUploadSchema.safeParse(files);
  if (!parsedFiles.success) {
    await fs.unlink(files.avatar[0].path);
    await fs.unlink(files.coverImage[0].path);
    throw new ValidationError(parsedFiles.error);
  }

  const parsedBody = registerSchema.safeParse(req.body);
  if (!parsedBody.success) {
    throw new ValidationError(parsedBody.error);
  }

  const { fullname, email, username, password } = parsedBody.data;

  const exitedUser = await User.findOne({
    $or: [{ email }, { username: username.toLowerCase() }],
  });

  if (exitedUser) {
    throw new ApiError(409, "User already exists");
  }

  // Extract validated files
  const avatarlocalPath = parsedFiles.data.avatar?.[0].path || "";
  const coverImagelocalPath = parsedFiles.data.coverImage?.[0].path || "";

  // filter empty values
  const localFiles = [avatarlocalPath, coverImagelocalPath].filter(Boolean);

  let uploadResult;
  try {
    uploadResult = (await muiltithreadUpload(localFiles)) as UploadResponse[];
    logger.debug("files uploaded successfully", uploadResult);
  } catch (error) {
    logger.debug("Error uploading avatar.", {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw new ApiError(500, "Failed to Upload avatar.");
  }
  let coverImageUrl: string = "";
  let avatarImageUrl: string = "";
  uploadResult.forEach((file) => {
    if (file.localFilePath == avatarlocalPath) {
      avatarImageUrl = file.secure_url || file.url;
    }
    if (file.localFilePath == coverImagelocalPath) {
      coverImageUrl = file.secure_url || file.url;
    }
  });

  try {
    const user = await User.create({
      fullname,
      username: username.toLowerCase(),
      email,
      coverImage: coverImageUrl,
      avatar: avatarImageUrl,
      password,
    });

    const createdUser = await User.findById(user.id, {
      password: false,
      refreshToken: false,
    });
    if (!createdUser) {
      throw new ApiError(409, "user regestration failed.");
    }

    res
      .status(200)
      .json(new ApiResponse(200, createdUser, "User registered successfully"));
    return;
  } catch (error) {
    logger.debug("User registraion failed.", {
      message: (error as Error).message,
      stack: (error as Error).message,
    });
    uploadResult.forEach(async (file) => {
      await deleteFromCloudinary(file.public_id);
    });
    throw new ApiError(
      409,
      "Something went wrong while registering a user and images were deleted."
    );
  }
});

const loginUser = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = loginSchema.safeParse(req.body);
  if (!success) {
    throw new ValidationError(error);
  }

  const { username, email, password } = data;
  const exitedUser = await User.findOne({
    $or: [{ email }, { username }],
  }).select("+password");

  if (!exitedUser) {
    throw new ApiError(400, "Invalid credentials.");
  }

  // validate password

  const validUser = await exitedUser.isPasswordCorrect(password);

  if (!validUser) {
    throw new ApiError(400, "Invalid credentials.");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    exitedUser.id
  );

  // query once for getting fresh userObject .

  const loggedUser = await User.findById(exitedUser.id, { password: false });

  if (!loggedUser) {
    throw new ApiError(502, "User not found .");
  }

  const options = {
    httpOnly: true,
    secure: config.get("NODE_ENV") === "production",
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, { user: loggedUser }, "User Logged in successfully.")
    );
  return;
});

// Refresh the access token
const refreshAcessToken = asyncHandler<Request>(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required.");
  }

  const decodedtoken = jwt.verify(
    incomingRefreshToken,
    config.get(" REFRESH_TOKEN_SECRET")
  ) as JwtPayload;

  if (!decodedtoken || !decodedtoken.id) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await User.findById(decodedtoken.id).select("+refreshToken");

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const options = {
    httpOnly: true,
    secure: config.get("NODE_ENV") === "production",
  };
  const { accessToken, refreshToken: newrefreshToken } =
    await generateAccessAndRefreshToken(user.id);

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newrefreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshTOken: newrefreshToken },
        "Access token refreshed successfully."
      )
    );
  return;
});

const logoutUser = asyncHandler<Request>(async (req, res) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.userId,
    {
      $set: { refreshToken: "" },
    },
    { new: true }
  );

  if (!updatedUser) {
    throw new ApiError(409, "Logout failed.");
  }

  const option = {
    httpOnly: true,
    secure: config.get("NODE_ENV") === "production",
  };

  res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshTOken", option)
    .json(new ApiResponse(200, {}, "Logout successfully"));
  return;
});

const changeCurrentPassword = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = changePasswordSchema.safeParse(req.body);
  if (!success) {
    throw new ValidationError(error);
  }

  const { oldPassword, newPassword } = data;

  const user = await User.findById(req.userId).select("+password");

  if (!user) {
    throw new ApiError(401, "User not found.");
  }

  const validpassword = user?.isPasswordCorrect(oldPassword);

  if (!validpassword) {
    throw new ApiError(401, "Old password is incorrect");
  }

  user.password = newPassword;

  await user?.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, "Password change successfully"));
  return;
});

const getCurrentUser = asyncHandler<Request>(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    throw new ApiError(404, "user not found");
  }
  res.status(200).json(new ApiResponse(200, user, "Current user details."));
  return;
});

const updateAccountDetails = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = updateAccountDetailsSchema.safeParse(
    req.body
  );
  if (!success) {
    throw new ValidationError(error);
  }

  const updatePayload = { ...data };

  const user = await User.findByIdAndUpdate(
    req.userId,
    {
      $set: { ...updatePayload },
    },
    { new: true }
  );

  if (!user) {
    throw new ApiError(400, "Failed to update user details.");
  }

  res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully."));
  return;
});

const updateAvatar = asyncHandler<Request>(async (req, res) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const parsedFile = uploadAvatarFileSchema.safeParse(files);
  if (!parsedFile.success) {
    await fs.unlink(files.avatar[0].path);
    throw new ValidationError(parsedFile.error);
  }

  const avatarLocalPath = parsedFile.data.avatar?.[0]?.path || "";
  if (!avatarLocalPath) {
    throw new ApiError(400, "Failed to update avatar.");
  }

  let avatar;

  try {
    avatar = cloudinaryUploader(avatarLocalPath);
  } catch (error) {
    logger.debug("Failed uploading avatar", {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw new ApiError(401, "Failed to update avatar.");
  }

  const user = await User.findByIdAndUpdate(
    req.userId,
    {
      $set: { avatar },
    },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(401, "Failed to update avatar.");
  }

  res
    .status(200)
    .json(new ApiResponse(200, user, "Update avatar successfully."));
  return;
});

const updateCoverImage = asyncHandler<Request>(async (req, res) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const parsedFile = uploadCoverImageFileSchema.safeParse(files);
  if (!parsedFile.success) {
    await fs.unlink(files.coverImage[0].path);
    throw new ValidationError(parsedFile.error);
  }

  const coverImagelocalPath = parsedFile.data.coverImage?.[0]?.path || "";
  if (!coverImagelocalPath) {
    throw new ApiError(400, "Failed to update avatar.");
  }

  let coverImage;
  try {
    coverImage = await cloudinaryUploader(coverImagelocalPath);
  } catch (error) {
    logger.debug("failed to upload coverImage", {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw new ApiError(401, "Failed to update avatar.");
  }

  const user = await User.findByIdAndUpdate(
    req.userId,
    {
      $set: { coverImage: coverImage?.url },
    },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(401, "Failed to update avatar.");
  }

  res
    .status(200)
    .json(new ApiResponse(200, user, "Update avatar successfully."));
  return;
});

const getUserChannelProfile = asyncHandler<Request>(async (req, res) => {
  const { success, error, data } = getUserChannelProfileSchema.safeParse(
    req.params.username
  );
  if (!success) {
    throw new ValidationError(error);
  }

  const { username } = data;
  const channel = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase().trim(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriotions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        channelSubcribedTOCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.userId, "$subcribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      // provide only neccessary data.project to frontend.
      $project: {
        fullname: 1,
        username: 1,
        email: 1,
        subscriberCount: 1,
        channelSubcribedTOCount: 1,
        isSubscribed: 1,
        coverImage: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(401, "Channel not found.");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "Channel profile fetched successfully.")
    );
  return;
});

const getWatchHistory = asyncHandler<Request>(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: req.userId,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owners",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0]?.watchHistory,
        "Watch history fetched successfully."
      )
    );
  return;
});

export {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAcessToken,
  registerUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
};
