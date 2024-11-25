import mongoose, { Schema,Document } from "mongoose";


interface ILike extends Document{
 
    video?:mongoose.Types.ObjectId
    comment?:mongoose.Types.ObjectId
    tweet?:mongoose.Types.ObjectId
    likedBy:mongoose.Types.ObjectId
    createdAt: Date;
    updatedAt: Date;

}


const likeSchema = new Schema<ILike>({

    video:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    },
    
    comment:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Comment"
    },
    tweet:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Tweet"
    },
    likedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

},{timestamps:true})

export const Like = mongoose.model<ILike>("Like",likeSchema)