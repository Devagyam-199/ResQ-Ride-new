import "./config/env.js";
import dbConn from "./Database/dbConn.js";
import { app } from "./app.js";
import http from "http";
import { initSocket } from "./sockets/socket.js";
import { v2 as cloudinary } from "cloudinary";
import dns from "node:dns/promises";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const server = http.createServer(app);
initSocket(server);
dbConn()
  .then(() => {
    server.listen(process.env.PORT || 3000, (req, res) => {
      console.log(`Server is running on port ${process.env.PORT || 3000} `);
      console.log(`http://localhost:${process.env.PORT || 3000}`);
    });
  })
  .catch((err) => {
    console.error("database connection failed : ", err);
  });
