import { Request } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/user.model";
import {
  changePasswordSchema,
  getUserChannelProfileSchema,
  loginSchema,
  registerSchema,
  updateAccountDetailsSchema,
} from "../schema/userSchema";
import { ApiError, ValidationError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { cloudinaryUploader, deleteFromCloudinary } from "../utils/cloudinary";
import logger from "../utils/logger";
import { config } from "../config/config";

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
  const { success, error, data } = registerSchema.safeParse(req.body);
  if (!success) {
    throw new ValidationError(error);
  }

  const { fullname, email, username, password } = data;
  const exitedUser = await User.findOne({
    $or: [{ email }, { username: username.toLowerCase() }],
  });

  if (exitedUser) {
    throw new ApiError(409, "User with email or password already exit.");
  }
  // @ts-expect-error avatar image might be empty
  const avatarlocalPath = req.files?.avatar[0]?.path || "";
  const coverImagelocalPath = req.files?.coverImage?.[0]?.path || "";

  let avatar;
  let coverImage;
  if (avatarlocalPath) {
    try {
      avatar = await cloudinaryUploader(avatarlocalPath);
      logger.debug("Uploaded avatar", avatar);
    } catch (error) {
      logger.debug("Error uploading avatar.", {
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
      throw new ApiError(500, "Failed to Upload avatar.");
    }
  }
  if (coverImagelocalPath) {
    try {
      coverImage = await cloudinaryUploader(coverImagelocalPath);
      logger.debug("Uploaded coverImage", coverImage);
    } catch (error) {
      logger.debug("Error uploading coverImage.", {
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
      throw new ApiError(500, "Failed to Upload coverImage.");
    }
  }

  try {
    const user = await User.create({
      fullname,
      username: username.toLowerCase(),
      email,
      coverImage: coverImage?.url || "",
      avatar: avatar?.url || "",
      password,
    });

    const createdUser = await User.findById(user.id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(409, "user regestration failed.");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, createdUser, "User registered successfully"));
  } catch (error) {
    logger.debug("User registraion failed.", {
      message: (error as Error).message,
      stack: (error as Error).message,
    });

    if (avatar) {
      await deleteFromCloudinary(avatar.public_id);
    }
    if (coverImage) {
      await deleteFromCloudinary(coverImage.public_id);
    }

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

  return res
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

  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshTOken", option)
    .json(new ApiResponse(200, {}, "Logout successfully"));
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
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Current user details."));
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
  const avatarLocalPath = req.files?.avatar?.[0]?.path || "";

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
  const coverImagelocalPath = req.files?.coverImage?.[0]?.path || "";

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

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Update avatar successfully."));
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

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "Channel profile fetched successfully.")
    );
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

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0]?.watchHistory,
        "Watch history fetched successfully."
      )
    );
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
