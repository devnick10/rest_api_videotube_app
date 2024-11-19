import mongoose, { Model, Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

export interface IUser {
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

type UserModel = Model<IUser, {}, IUserMethods>;
                       


const userSchema =  new Schema<IUser,UserModel,IUserMethods>({

    username:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
        index:true,
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
(password:string):Promise<boolean> {
  return await  bcrypt.compare(password,this.password)
}


// jwt token
userSchema.methods.generateAccessToken = function():string{

  return  jwt.sign(
        {
         id:this._id
        },
        process.env.ACCESS_TOKEN_SECRET as string,{
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY as string
        }
    )
    
}


userSchema.methods.generateRefreshToken = function():string{

  return  jwt.sign(
        {
         id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET as string,{
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY as string
        }
    )
    
}




export const User = mongoose.model<IUser,UserModel>("User",userSchema);