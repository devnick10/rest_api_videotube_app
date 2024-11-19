import { ApiError } from '../utils/ApiError';
import {ApiResponse} from '../utils/ApiResponse';
import {asyncHandler} from "../utils/asyncHandler";
import { User } from '../models/user.model';
import {Request} from 'express';
import { cloudinaryUploader, deleteFromCloudinary } from '../utils/cloudinary';
import mongoose from 'mongoose';

interface IRequest extends Request{
    files?:any
}

const generateAccessAndRefreshToken = async(userid:mongoose.Types.ObjectId)=>{
try {
    
     const user = await User.findById(userid);
    
     if (!user) throw new ApiError(409,"User not found . Failed to generate access token.")
    
     const accessToken = user.generateAccessToken()
     const refreshToken = user.generateRefreshToken()
     
     user.refreshToken = refreshToken;
    
     await user.save({validateBeforeSave:false});
    
     return {accessToken,refreshToken};

} catch (error) {
    throw new ApiError(407,"Something went wrong while generating access and refresh token")
}



}


const registerUser = asyncHandler(async(req:IRequest,res,next)=>{

    const {fullname,username,email,password} = req.body;

     // validation

    if (
        [fullname,username,email,password].some((field)=>field?.trim() === "")
    ) {
        
        throw new ApiError(400,"All fields are required")
    }
    
    const exitedUser = await User.findOne({
        $or:[{ email }, { username: username.toLowerCase() }]
    })
 
    
    if (exitedUser) {
        
        throw new ApiError(409,"User with email or password already exit.")
    }
    
    const avatarlocalPath =  req.files?.avatar?.[0]?.path
    const coverImagelocalPath =  req.files?.coverImage?.[0]?.path

   

    let avatar; 
    
    try {

       avatar = await cloudinaryUploader(avatarlocalPath);
       
       console.log("Uploaded avatar",avatar);
       

    } catch (error) {
        
        console.log("Error uploading avatar.",error);
        throw new ApiError(500,"Failed to Upload avatar.")
    }
    
    let coverImage

    try {

       coverImage = await cloudinaryUploader(coverImagelocalPath);
       
       console.log("Uploaded coverImage",coverImage);
       

    } catch (error) {
        
        console.log("Error uploading coverImage.",error);
        throw new ApiError(500,"Failed to Upload coverImage.")
    }
    

    try {
        
        const user = await User.create({
            fullname,
            username:username.toLowerCase(),
            email,
            coverImage:coverImage?.url,
            avatar:avatar?.url,
            password,
            
        });
        
    
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )
    
        if (!createdUser) {
            
            throw new ApiError(409,"user regestration failed.")
        }
        
        
        res.
        status(200)
        .json(new ApiResponse(200,createdUser,"User registered successfully"))
        
    } catch (error) {

        console.log('User registraion failed.');
        
        if (avatar) {

            await deleteFromCloudinary(avatar.public_id)
        }
        if (coverImage) {
            
         await deleteFromCloudinary(coverImage.public_id)
        }
        
        throw new ApiError(409,"Something went wrong while registering a user and images were deleted.")
    }
})


const loginUser = asyncHandler(async(req,res)=>{

    const { username , email , password } = req.body;
    
    if (
        [username,email,password].some((field)=>field?.trim() === "")
    ) {
        
        throw new ApiError(400,"All fields are required")
    }
    
    const exitedUser = await User.findOne({
        $or:[{ email }, { username: username.toLowerCase() }]
    })

    if (!exitedUser) {
      
        throw new ApiError(400,"Invalid credentials.")
    }

    // avalidate password
    
    const validUser = await exitedUser.isPasswordCorrect(password)
    
    if (!validUser) {
      
        throw new ApiError(400,"Invalid credentials.")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(exitedUser._id);
    
    // query once for getting fresh userObject .

    const loggedUser = await User.findById(exitedUser._id)
    .select("-password,-refreshToken"); 

    if (!loggedUser) {
        throw new ApiError(502,"User not found .");
    }

    const options = {
        httpOnly:true,
        secure: process.env.NODE_ENV === "production",
    }


    res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(
        200,
        {user:loggedUser,accessToken,refreshToken},
        "User Logged in successfully."
    ));


})



export {
    registerUser,
    loginUser,
    
}