import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"


const userSchema =  new Schema({

    username:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
    },
    email:{
        type:String,
        required:true,
        lowercase:true,
        unique:true,
        index:true
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
    },
    avatar:{
        type:String, // cloudinary url
        required:true
    },
    coverImage:{
        type:String,
    },
    watchHistory:[{
        type:Schema.Types.ObjectId,
        ref:"Video"
    }],
    password:{
        type:String,
        required:[true,"password is required"],
    },
    refreshToken:{
        type:String,
    }
    

},{timestamps:true})

// mongodb methods / middlwares / hooks 

userSchema.pre("save",async function(next: mongoose.CallbackWithoutResultAndOptionalError) {
   
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,10)
    
    next()
})


userSchema.methods.isPasswordCorrect = async function
(password:string) {
  return await  bcrypt.compare(password,this.password)
}


// jwt token
userSchema.methods.generateAccessToken = function(){

  return  jwt.sign(
        {
         id:this._id
        },
        `${process.env.ACCESS_TOKEN_SECRET}`,{
            expiresIn:`${process.env.ACCESS_TOKEN_EXPIRY}`
        }
    )
    
}


userSchema.methods.generateRefreshToken = function(){

  return  jwt.sign(
        {
         id:this._id
        },
        `${process.env.REFRESH_TOKEN_SECRET}`,{
            expiresIn:`${process.env.REFRESH_TOKEN_EXPIRY}`
        }
    )
    
}




export const User = mongoose.model("User",userSchema);