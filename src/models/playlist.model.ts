import mongoose, { Document, Schema } from "mongoose";


interface IPlaylist extends Document{
 
  name:string
  description:string
  videos?:mongoose.Types.ObjectId[]
  owner:mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date

}

const playlistSchema = new Schema<IPlaylist>(
  {
    name: {
      type: String,
      required: true,
      minlength:3,
      maxlength:50
    },
    description: {
      type: String,
      required: true,
      maxlength:500,
    },
    videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required:true
    },
  },
  { timestamps: true }
);

export const Playlist = mongoose.model<IPlaylist>("Playlist", playlistSchema);