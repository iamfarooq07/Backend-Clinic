import mongoose from 'mongoose';

const diagnosisLogSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  symptoms: {
    type: String,
    required: [true, 'Symptoms are required'],
    trim: true,
  },
  patientAge: {
    type: Number,
    required: true,
  },
  patientGender: {
    type: String,
    required: true,
  },
  medicalHistory: {
    type: String,
    trim: true,
  },
  aiResponse: {
    possibleConditions: [String],
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
    },
    suggestedTests: [String],
    recommendations: String,
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const DiagnosisLog = mongoose.model('DiagnosisLog', diagnosisLogSchema);

export default DiagnosisLog;
