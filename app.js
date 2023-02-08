import express from "express";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import cors from "cors";
export const app = express();

app.use(express.json({limit: "50mb"}));
app.use(express.urlencoded({limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(
    fileUpload({
      limits: { fileSize: 50 * 1024 * 1024 },
      useTempFiles: true,
    })
  );
  app.use(cors());

import userRoute from './routes/User.js';
import postRoute from './routes/Post.js';


app.use("/shades/v1", userRoute);
app.use("/shades/v1", postRoute);
