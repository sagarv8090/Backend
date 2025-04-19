import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"; 
import {uploadCloudinary} from "../utils/cloudinary.js";
import {User} from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // Logic for registering a user
  //get the user data from the request body(frontned)
  //validate the data(not empty, valid email, password length, etc.)
  //check if the user already exists in the database(email, username, etc.)
  //check for images, check for avatar, etc.
  //upload the image to cloudinary
  //create user object and save it to the database
  //remove the password and token field from response
  //return response with success message and user data

  const { username, email, fullname, password } = req.body;
  console.log("User data:", { username, email, fullname, password });

  if([username, email, fullname, password].some(field => 
    field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { username }]
  })
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  const avatarLocalPath = req?.files?.avatar[0]?.path;
  // const coverImageLocalPath = req?.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path; 
  }

  if(!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar=await uploadCloudinary(avatarLocalPath);
  const coverImage = await uploadCloudinary(coverImageLocalPath);

  if(!avatar) {
    throw new ApiError(500, "Failed to upload avatar");
  }

 const user= await User.create({
    username:username.toLowerCase(),
    email,
    fullname,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || ""
  })

  const createdUser=await User.findById(user._id).select("-password -refreshToken");

  if(!createdUser) {
    throw new ApiError(500, "Failed to Register user");
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
  )



});

export {registerUser};