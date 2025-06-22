import mongoose, { Schema, Document } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

interface IVideo extends Document {
  videoFile: string;
  thumbnail: string;
  title: string;
  description: string;
  duration: number;
  views?: number;
  isPublished?: boolean;
  owner: mongoose.Types.ObjectId;
}

const videoSchema = new Schema<IVideo>(
  {
    videoFile: {
      type: String, // couldnary url
      required: true,
    },
    thumbnail: {
      type: String, // couldnary url
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // couldnary url
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

videoSchema.index({ title: "text", description: "text" });
videoSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model<IVideo>("Video", videoSchema);
