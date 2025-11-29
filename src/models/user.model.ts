import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config/config";

export interface IUser extends Document {
  username: string;
  email: string;
  fullname: string;
  avatar: string;
  coverImage?: string;
  watchHistory: mongoose.Types.ObjectId[];
  password: string;
  refreshToken?: string;
}

interface IUserMethods {
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String, // cloudinary url
    },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "password is required"],
      select: false,
    },
    refreshToken: {
      select: false,
      type: String,
    },
  },
  { timestamps: true }
);

// mongodb methods / middlwares / hooks

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);

  next();
});

userSchema.methods.isPasswordCorrect = async function (
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

// jwt token
userSchema.methods.generateAccessToken = function (): string {
  return jwt.sign(
    {
      id: this._id,
    },
    config.get("ACCESS_TOKEN_SECRET"),
    {
      expiresIn: config.get("ACCESS_TOKEN_EXPIRY"),
    }
  );
};

userSchema.methods.generateRefreshToken = function (): string {
  return jwt.sign(
    {
      id: this._id,
    },
    config.get("REFRESH_TOKEN_SECRET"),
    {
      expiresIn: config.get("REFRESH_TOKEN_EXPIRY"),
    }
  );
};

export const User = mongoose.model<IUser, UserModel>("User", userSchema);
