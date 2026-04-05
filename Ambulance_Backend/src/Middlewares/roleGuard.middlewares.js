import apiError from "../Utils/apiError.utils.js";

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new apiError(
          403,
          `Access denied. Requires role: ${roles.join(" or ")}`,
        ),
      );
    }
    next();
  };

export default requireRole;
