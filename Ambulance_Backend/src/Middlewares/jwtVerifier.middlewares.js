import jwt from "jsonwebtoken";
import apiError from "../Utils/apiError.utils.js";

const jwtVerify = (req, res, next) => {
  const authheader = req.headers.authorization;

  if (!authheader || !authheader.startsWith("Bearer ")) {
    return next(new apiError(401, "No token provided for the request"));
  }

  const jwttoken = authheader.split(" ")[1];

  try {
    const decoded = jwt.verify(jwttoken, process.env.Access_Token_Secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new apiError(401, "Token has expired"));
    }
    if (error.name === "JsonWebTokenError") {
      return next(new apiError(401, "Invalid token signature"));
    }
    return next(new apiError(401, "Authentication failed"));
  }
};

export default jwtVerify;