import express from "express";
import {
    commentOnPost,
  createPost,
  deleteComment,
  deletePost,
  getPostOfFollowing,
  likeAndUnlikePost,
  Postsss,
  updateCaption,
} from "../controllers/Post.js";
import { myProfile } from "../controllers/User.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.route("/upload").post(isAuthenticated, createPost);

router
  .route("/post/:id")
  .get(isAuthenticated, likeAndUnlikePost)
  .put(isAuthenticated, updateCaption)
  .delete(isAuthenticated, deletePost);

router
  .route("/post/comment/:id")
  .post(isAuthenticated, commentOnPost)
  .delete(isAuthenticated, deleteComment);

router.route("/posts").get(isAuthenticated, Postsss);

router.route("/userPost").get(isAuthenticated, getPostOfFollowing);

router.route("/me").get(isAuthenticated, myProfile);

export default router;
