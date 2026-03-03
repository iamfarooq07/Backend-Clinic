import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Verify JWT and attach user to req.user
 */
const auth = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * Restrict access to given roles. Use after auth middleware.
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'doctor')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    // Fetch user role from DB for accuracy
    User.findById(req.user.userId)
      .then((user) => {
        if (!user) return res.status(401).json({ message: "User not found" });
        if (!roles.includes(user.role)) {
          return res.status(403).json({ message: "Access denied for your role" });
        }
        req.userRole = user.role;
        req.userPlan = user.subscriptionPlan;
        next();
      })
      .catch((err) => res.status(500).json({ message: err.message }));
  };
};

/**
 * Require Pro subscription for AI/advanced features. Use after auth (and optionally restrictTo).
 */
const requirePro = (req, res, next) => {
  if (req.userPlan === "pro") return next();
  return res.status(403).json({
    message: "Pro subscription required for this feature",
  });
};

export default auth;
export { restrictTo, requirePro };
