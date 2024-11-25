import mongoose, { Schema ,Document } from "mongoose";

interface ISubscription extends Document{
 
  subscriber:mongoose.Types.ObjectId
  channel:mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date

}

const subcriptionSchema = new Schema<ISubscription>(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required:true
    },

    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required:true
    },
  },
  {
    timestamps: true,
  }
);

subcriptionSchema.index({subcriber:1,channel:1},{unique:true})

export const Subscription = mongoose.model<ISubscription>("Subscription", subcriptionSchema);