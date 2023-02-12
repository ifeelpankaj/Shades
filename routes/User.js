import express from "express";
import { getMyPost, getUserPosts } from "../controllers/Post.js";
import {
    deleteProfile,
  followUser,
  forgetPassword,
  getAllUsers,
  getUserProfile,
  login,
  logout,
  register,
  resetPassword,
  updatePassword,
  updateProfile,
  verify,
} from "../controllers/User.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.route("/register").post(register);

router.route("/verify").post(isAuthenticated, verify);

router.route("/login").post(login);

router.route("/logout").get(logout);

router.route("/my/posts").get(isAuthenticated, getMyPost);

router.route("/userposts/:id").get(isAuthenticated, getUserPosts);

router.route("/follow/:id").get(isAuthenticated, followUser);

router.route("/change/password").put(isAuthenticated, updatePassword);

router.route("/modify/profile").put(isAuthenticated, updateProfile);

router.route("/remove/profile").delete(isAuthenticated, deleteProfile);

router.route("/user/:id").get(isAuthenticated, getUserProfile);

router.route("/users").get(isAuthenticated, getAllUsers);

router.route("/forgetpassword").post(forgetPassword);

router.route("/resetpassword").put(resetPassword);


export default router;
