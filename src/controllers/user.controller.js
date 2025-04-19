import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"; 
import {uploadCloudinary} from "../utils/cloudinary.js";
import {User} from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async(userId)=>{
  try{
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken=refreshToken;
    await user.save({validateBeforeSave:false})
    return {accessToken, refreshToken}
  }
  catch(error){
    throw new ApiError(500,"Something went wrong while generating refresh and access token")
  }
}

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

const loginUser = asyncHandler(async (req, res) => {
  // Logic for logging in a user
  //get the user data from the request body(frontned)
  //validate the data(not empty, valid email, password length, etc.)
  //check if the user already exists in the database(email, username, etc.)
  //check if the password is correct
  //generate access and refresh tokens
  //send cookies with tokens to the client
  //remove the password and token field from response
  //return response with success message and user data

  const {email, username, password} = req.body;

  if(!username || !email) {
    throw new ApiError(400, "Email or username is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (!user) {
    throw new ApiError(404, "user does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if(!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).
  select("-password -refreshToken")

  const options={
    httpOnly:true,
    secure: true
  }
  return res.
  status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser,
        accessToken,
        refreshToken
      },
      "User logged in successfully"
      )
  )

});

const logoutUser = asyncHandler(async (req, res) => {
  // Logic for logging out a user
  //remove the refresh token from the database
  //clear the cookies from the client
  //return response with success message

  await User.findByIdAndUpdate(
    req.user._id, 
    {
      $set: { 
        refreshToken: undefined  
      }
    },
    {
      new: true,
    }
);
const options={
  httpOnly:true,
  secure: true
}
return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(
    new ApiResponse(200, null, "User logged out successfully")
  )
  .json(
    new ApiResponse(200, {}, "User logged out successfully")
  )
});


export {
  registerUser,
  loginUser,
  logoutUser
};