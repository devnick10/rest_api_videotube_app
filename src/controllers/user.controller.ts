import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model";
import { cloudinaryUploader, deleteFromCloudinary } from "../utils/cloudinary";
import mongoose from "mongoose";
import jwt, { JwtPayload } from "jsonwebtoken";
import { IAuthRequest } from "../middlewares/auth.middleware";

export interface IRequest extends IAuthRequest {
  files?: any;
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
    throw new ApiError(
      407,
      "Something went wrong while generating access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req: IRequest, res) => {
  const { fullname, username, email, password } = req.body;

  if (
    [fullname, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const exitedUser = await User.findOne({
    $or: [{ email }, { username: username.toLowerCase() }],
  });

  if (exitedUser) {
    throw new ApiError(409, "User with email or password already exit.");
  }

  const avatarlocalPath = req.files?.avatar?.[0]?.path || "";
  const coverImagelocalPath = req.files?.coverImage?.[0]?.path || "";

  let avatar;
  let coverImage;
  if (avatarlocalPath) {
    try {
      avatar = await cloudinaryUploader(avatarlocalPath);

      console.log("Uploaded avatar", avatar);
    } catch (error) {
      console.log("Error uploading avatar.", error);
      throw new ApiError(500, "Failed to Upload avatar.");
    }
  } else if (coverImagelocalPath) {
    try {
      coverImage = await cloudinaryUploader(coverImagelocalPath);

      console.log("Uploaded coverImage", coverImage);
    } catch (error) {
      console.error("Error uploading coverImage.", error);
      throw new ApiError(500, "Failed to Upload coverImage.");
    }
  }

  try {
    const user = await User.create({
      fullname,
      username: username.toLowerCase(),
      email,
      coverImage: coverImage?.url || "",
      avatar: avatar?.url || "" ,
      password,
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(409, "user regestration failed.");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, createdUser, "User registered successfully"));
  } catch (error) {
    console.error("User registraion failed.", error);

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

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if ([username, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const exitedUser = await User.findOne({
    $or: [{ email }, { username }],
  }).select('+password');

  if (!exitedUser) {
    throw new ApiError(400, "Invalid credentials.");
  }

  // validate password

  const validUser = await exitedUser.isPasswordCorrect(password);

  if (!validUser) {
    throw new ApiError(400, "Invalid credentials.");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    exitedUser._id
  );

  // query once for getting fresh userObject .

  const loggedUser = await User.findById(exitedUser._id)

  if (!loggedUser) {
    throw new ApiError(502, "User not found .");
  }

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedUser},
        "User Logged in successfully."
      )
    );
});

// Refresh the access token
const refreshAcessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
  req.cookies.refreshToken || req.body.refreshToken;
  
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required.");
  }
  
  try {
    const decodedtoken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
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
      secure: process.env.NODE_ENV === "production",
    };
    const { accessToken, refreshToken: newrefreshToken } =
      await generateAccessAndRefreshToken(user._id);

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
  } catch (error) {
    throw new ApiError(
      500,
      `Something went wrong while refresh access token. ${error}`
    );
  }
});

const logoutUser = asyncHandler(async (req: IAuthRequest, res) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
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
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshTOken", option)
    .json(new ApiResponse(200, {}, "Logout successfully"));
});

const changeCurrentPassword = asyncHandler(async (req: IAuthRequest, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    throw new ApiError(401, "User not found.");
  }

  const validpassword = user?.isPasswordCorrect(oldPassword);

  if (!validpassword) {
    throw new ApiError(401, "Old password is incorrect");
  }

  user.password = newPassword;

  await user?.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "Password change successfully"));
});

const getCurrentUser = asyncHandler(async (req: IAuthRequest, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user details."));
});

const updateAccountDetails = asyncHandler(async (req: IAuthRequest, res) => {
  const { fullname, email,username } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "Fullname and email are required.");
  }
  const updatePayload = {fullname,email,username}
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {...updatePayload},
    },
    { new: true }
  )

  if (!user) {
    throw new ApiError(400, "Failed to update user details.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully."));
});

const updateAvatar = asyncHandler(async (req: IRequest, res) => {
  const avatarLocalPath = req.files?.avatar?.[0]?.path || "";

  if (!avatarLocalPath) {
    throw new ApiError(400, "Failed to update avatar.");
  }

  let avatar;

  try {
    avatar = cloudinaryUploader(avatarLocalPath);
  } catch (error) {
    throw new ApiError(401, "Failed to update avatar.");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { avatar },
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

const updateCoverImage = asyncHandler(async (req: IRequest, res) => {
  const coverImagelocalPath = req.files?.coverImage?.[0]?.path || "";

  if (!coverImagelocalPath) {
    throw new ApiError(400, "Failed to update avatar.");
  }

  let coverImage;
  try {
    coverImage = await cloudinaryUploader(coverImagelocalPath);
  } catch (error) {
    throw new ApiError(401, "Failed to update avatar.");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
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

const getUserChannelProfile = asyncHandler(async (req: IRequest, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is required.");
  }

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
            if: { $in: [req.user._id, "$subcribers.subscriber"] },
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

  console.log(channel);

  if (!channel?.length) {
    throw new ApiError(401, "Channel not found.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "Channel profile fetched successfully.")
    );
});

const getWatchHistory = asyncHandler(async (req: IRequest, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
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
  registerUser,
  loginUser,
  refreshAcessToken,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
