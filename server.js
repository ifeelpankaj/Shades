import { app } from "./app.js";
import { config } from "dotenv";
import { connectDatabase } from "./config/database.js";
import cloudinary from "cloudinary";

config({
  path: "./config/config.env",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get("/", (req, res, next) => {
  res.send("<h1>Server is Online</h1>");
});

connectDatabase();
app.listen(process.env.PORT, () => {
  console.log("Welcome Server is Online on port " + process.env.PORT);
});
