import { body, validationResult } from 'express-validator';

// Validation middleware
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return res.status(400).json({ 
      message: errorMessages,
      errors: errors.array() 
    });
  }
  next();
};

// Registration validation rules
export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'doctor', 'receptionist', 'patient']).withMessage('Invalid role'),
];

// Login validation rules
export const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Patient validation rules
export const patientValidation = [
  body('name').trim().notEmpty().withMessage('Patient name is required'),
  body('age').isInt({ min: 0 }).withMessage('Valid age is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('contact').trim().notEmpty().withMessage('Contact is required'),
];

// Appointment validation rules
export const appointmentValidation = [
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').notEmpty().withMessage('Time is required'),
  body('reason').optional().trim(),
  body('notes').optional().trim(),
  // patientId is optional - auto-created for patient role users
  body('patientId').optional(),
];
