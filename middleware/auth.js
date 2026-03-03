import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Role-based authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// Subscription-based authorization
export const requireProPlan = (req, res, next) => {
  if (req.user.subscriptionPlan !== 'pro') {
    return res.status(403).json({
      message: 'This feature requires a Pro subscription plan',
      upgrade: true,
    });
  }
  next();
};

// Check patient limit for free plan
export const checkPatientLimit = async (req, res, next) => {
  if (req.user.subscriptionPlan === 'free') {
    const Patient = (await import('../models/Patient.js')).default;
    const patientCount = await Patient.countDocuments({ createdBy: req.user._id });
    
    if (patientCount >= 50) {
      return res.status(403).json({
        message: 'Patient limit reached for Free plan. Upgrade to Pro for unlimited patients.',
        upgrade: true,
      });
    }
  }
  next();
};
