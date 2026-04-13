import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import diagnosisRoutes from './routes/diagnosisRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

// Load env
dotenv.config();

// __dirname fix (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DB connect
connectDB();

const app = express();


// ✅ CORS CONFIG (FINAL FIX)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://opticlinic-ai.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("CORS not allowed: " + origin));
    }
  },
  credentials: true,
}));

// ✅ Handle preflight requests
app.options("*", cors());


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Debug (optional - remove later)
app.use((req, res, next) => {
  console.log("Request Origin:", req.headers.origin);
  next();
});


// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/analytics', analyticsRoutes);


// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'AI Clinic Management API is running',
    timestamp: new Date().toISOString(),
  });
});


// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'AI Clinic Management API',
    version: '1.0.0',
  });
});


// Error handling
app.use(notFound);
app.use(errorHandler);


// Server start
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;