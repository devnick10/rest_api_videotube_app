import mongoose , {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema(
    {
     videoFile:{
        type:String,// couldnary url
        required:true
     },
     thumbnail:{
        type:String,// couldnary url
        required:true
     },
     title:{
        type:String,
        required:true
     },
     discription:{
        type:String,
        required:true
     },
     durantion:{
        type:Number,// couldnary url
        required:true
     },
     views:{
        type:Number,
        default:true,
     },
      isPublished:{
        type:Boolean,
        default:true,
     },
     owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
     }

    },{timestamps:true}
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video",videoSchema)