import { User } from "../models/User.js";
import { sendMail } from "../utils/sendMail.js";
import { sendToken } from "../utils/sendToken.js";
import cloudinary from "cloudinary";
import fs from "fs";
import { Post } from "../models/Post.js";

export const register = async (req, res) => {
  try {
    const { name, email, password, bio, username } = req.body;

      const avatar = req.files.avatar.tempFilePath;

    let user = await User.findOne({ email });

    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const otp = Math.floor(Math.random() * 1000000);

      const myCloud = await cloudinary.v2.uploader.upload(avatar, {
        folder: "avatars",
        resource_type: "image",
      });

      fs.rmSync("./tmp", { recursive: true });

    user = await User.create({
      name,
      email,
      password,
      bio,
      username,
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
      otp,
      otp_expiry: new Date(Date.now() + process.env.OTP_EXPIRE * 60 * 1000),
    });

    await sendMail(email, "Verify your account", `Your OTP is ${otp}`);

    sendToken(
      res,
      user,
      201,
      "OTP sent to your email, please verify your account"
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verify = async (req, res) => {
  try {
    const otp = Number(req.body.otp);

    const user = await User.findById(req.user.id);

    if (user.otp !== otp || user.otp_expiry < Date.now()) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP or has been Expired" });
    }

    user.verified = true;
    user.otp = null;
    user.otp_expiry = null;

    await user.save();

    sendToken(res, user, 200, "Account Verified");
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter all fields" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Email or Password" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Email or Password" });
    }

    sendToken(res, user, 200, "Login Successful");
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    res
      .status(200)
      .cookie("token", null, {
        expires: new Date(Date.now()), httpOnly: true 
      })
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const followUser = async (req, res) => {
try {
  const userToFollow = await User.findById(req.params.id);
  const loggedInUser = await User.findById(req.user._id);

  if (!userToFollow) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (loggedInUser.following.includes(userToFollow._id)) {
    const indexfollowing = loggedInUser.following.indexOf(userToFollow._id);
    const indexfollowers = userToFollow.followers.indexOf(loggedInUser._id);

    loggedInUser.following.splice(indexfollowing, 1);
    userToFollow.followers.splice(indexfollowers, 1);

    await loggedInUser.save();
    await userToFollow.save();

    res.status(200).json({
      success: true,
      message: "User Unfollowed",
    });
  } else {
    loggedInUser.following.push(userToFollow._id);
    userToFollow.followers.push(loggedInUser._id);

    await loggedInUser.save();
    await userToFollow.save();

    res.status(200).json({
      success: true,
      message: "User followed",
    });
  }
} catch (error) {
  res.status(500).json({
    success: false,
    message: error.message,
  });
}
};

export const updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+password");

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter all fields" });
    }

    const isMatch = await user.comparePassword(oldPassword);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Sorry Old Password is not Matching" });
    }

    user.password = newPassword;

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password Updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
try {
  const user = await User.findById(req.user._id);

  const { name,bio,username } = req.body;
  const avatar = req.files.avatar.tempFilePath;
  // 
  if (name) {
    user.name = name;
  }
  if (bio) {
    user.bio = bio;
  }
  if (username) {
    user.username = username;
  }

  if (avatar) {
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    const myCloud = await cloudinary.v2.uploader.upload(avatar, {
      folder: "avatars",
      resource_type: "image",
    });
    fs.rmSync("./tmp", { recursive: true });
    user.avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile Updated",
  });
} catch (error) {
  res.status(500).json({
    success: false,
    message: error.message,
  });
}
};

export const deleteProfile = async (req, res) => {
try {
  const user = await User.findById(req.user._id);
  const posts = user.posts;
  const followers = user.followers;
  const following = user.following;
  const userId = user._id;

  // Removing Avatar from cloudinary
  await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  await user.remove();

  // Logout user after deleting profile

  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  // Delete all posts of the user
  for (let i = 0; i < posts.length; i++) {
    const post = await Post.findById(posts[i]);
    await cloudinary.v2.uploader.destroy(post.image.public_id);
    await post.remove();
  }

  // Removing User from Followers Following
  for (let i = 0; i < followers.length; i++) {
    const follower = await User.findById(followers[i]);

    const index = follower.following.indexOf(userId);
    follower.following.splice(index, 1);
    await follower.save();
  }

  // Removing User from Following's Followers
  for (let i = 0; i < following.length; i++) {
    const follows = await User.findById(following[i]);

    const index = follows.followers.indexOf(userId);
    follows.followers.splice(index, 1);
    await follows.save();
  }

  // removing all comments of the user from all posts
  const allPosts = await Post.find();

  for (let i = 0; i < allPosts.length; i++) {
    const post = await Post.findById(allPosts[i]._id);

    for (let j = 0; j < post.comments.length; j++) {
      if (post.comments[j].user === userId) {
        post.comments.splice(j, 1);
      }
    }
    await post.save();
  }
  // removing all likes of the user from all posts

  for (let i = 0; i < allPosts.length; i++) {
    const post = await Post.findById(allPosts[i]._id);

    for (let j = 0; j < post.likes.length; j++) {
      if (post.likes[j] === userId) {
        post.likes.splice(j, 1);
      }
    }
    await post.save();
  }

  res.status(200).json({
    success: true,
    message: "Profile Deleted",
  });
} catch (error) {
  res.status(500).json({
    success: false,
    message: error.message,
  });
}
};

export const myProfile = async (req, res) => {

try {
  const user = await User.findById(req.user._id).populate(
    "posts followers following"
  );

  res.status(200).json({
    success: true,
    user,
  });
} catch (error) {
  res.status(500).json({
    success: false,
    message: error.message,
  });
}
};
export const getUserProfile = async (req, res) => {
try {
  const user = await User.findById(req.params.id).populate(
    "posts followers following"
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    user,
  });
} catch (error) {
  res.status(500).json({
    success: false,
    message: error.message,
  });
}
};

export const getAllUsers = async (req, res) => {
    // try {
    //   const users = await User.find({
    //     name: { $regex: req.query.name, $options: "i" },
    //     username:{$regex: req.query.username, $options: "i"}
    //   });
  
    //   res.status(200).json({
    //     success: true,
    //     users,
    //   });
    // } catch (error) {
    //   res.status(500).json({
    //     success: false,
    //     message: error.message,
    //   });
    // }
    try {
      const query = {};
      if (req.query.name && typeof req.query.name === "string") {
        query.$or = [
          { name: { $regex: req.query.name, $options: "i" } },
          { username: { $regex: req.query.name, $options: "i" } }
        ];
      }
    
      if (Object.keys(query).length > 0) {
        const users = await User.find(query);
      
        res.status(200).json({
          success: true,
          users,
        });
      } else {
        res.status(400).json({
          success: false,
          message: "No User Found",
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  export const forgetPassword = async (req, res) => {
    try {
      const { email } = req.body;
  
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(400).json({ success: false, message: "Invalid Email" });
      }
  
      const otp = Math.floor(Math.random() * 1000000);
  
      user.resetPasswordOtp = otp;
      user.resetPasswordOtpExpiry = Date.now() + 10 * 60 * 1000;
  
      await user.save();
  
      const message = `Your OTP for reseting the password ${otp}. If you did not request for this, please ignore this email.`;
  
      await sendMail(email, "Request for Reseting Password", message);
  
      res.status(200).json({ success: true, message: `OTP sent to ${email}` });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  export const resetPassword = async (req, res) => {
    try {
      const { otp, newPassword } = req.body;
  
      const user = await User.findOne({
        resetPasswordOtp: otp,
        resetPasswordExpiry: { $gt: Date.now() },
      });
      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "Otp Invalid or has been Expired" });
      }
      user.password = newPassword;
      user.resetPasswordOtp = null;
      user.resetPasswordExpiry = null;
      await user.save();
  
      res
        .status(200)
        .json({ success: true, message: `Password Changed Successfully` });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  