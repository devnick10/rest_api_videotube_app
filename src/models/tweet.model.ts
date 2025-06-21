import mongoose, { Schema, Document } from "mongoose";

interface ITweet extends Document {
  content: string;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const tweetSchema = new Schema<ITweet>(
  {
    content: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Tweet = mongoose.model<ITweet>("Tweet", tweetSchema);
