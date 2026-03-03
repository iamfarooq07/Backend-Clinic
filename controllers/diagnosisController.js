import DiagnosisLog from '../models/DiagnosisLog.js';
import Patient from '../models/Patient.js';
import { analyzeSymptoms } from '../utils/aiService.js';

// @desc    Create AI diagnosis
// @route   POST /api/diagnosis
// @access  Private (Doctor - Pro Plan)
export const createDiagnosis = async (req, res) => {
  try {
    const { patientId, symptoms, medicalHistory } = req.body;

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get AI analysis
    const aiResponse = await analyzeSymptoms(
      symptoms,
      patient.age,
      patient.gender,
      medicalHistory || patient.medicalHistory
    );

    // Create diagnosis log
    const diagnosisLog = await DiagnosisLog.create({
      patientId,
      doctorId: req.user._id,
      symptoms,
      patientAge: patient.age,
      patientGender: patient.gender,
      medicalHistory: medicalHistory || patient.medicalHistory,
      aiResponse,
      riskLevel: aiResponse.riskLevel,
    });

    const populatedLog = await DiagnosisLog.findById(diagnosisLog._id)
      .populate('patientId', 'name age gender contact')
      .populate('doctorId', 'name specialization');

    res.status(201).json(populatedLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all diagnosis logs
// @route   GET /api/diagnosis
// @access  Private
export const getDiagnosisLogs = async (req, res) => {
  try {
    const { patientId, doctorId, riskLevel, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    if (patientId) {
      query.patientId = patientId;
    }
    
    if (doctorId) {
      query.doctorId = doctorId;
    } else if (req.user.role === 'doctor') {
      query.doctorId = req.user._id;
    }
    
    if (riskLevel) {
      query.riskLevel = riskLevel;
    }

    const logs = await DiagnosisLog.find(query)
      .populate('patientId', 'name age gender contact')
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await DiagnosisLog.countDocuments(query);

    res.json({
      logs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single diagnosis log
// @route   GET /api/diagnosis/:id
// @access  Private
export const getDiagnosisLog = async (req, res) => {
  try {
    const log = await DiagnosisLog.findById(req.params.id)
      .populate('patientId', 'name age gender contact email medicalHistory')
      .populate('doctorId', 'name specialization contact');

    if (!log) {
      return res.status(404).json({ message: 'Diagnosis log not found' });
    }

    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get risk flagged patients
// @route   GET /api/diagnosis/risk-flags
// @access  Private (Doctor, Admin - Pro Plan)
export const getRiskFlags = async (req, res) => {
  try {
    // Get patients with high or critical risk
    const highRiskLogs = await DiagnosisLog.find({
      riskLevel: { $in: ['high', 'critical'] },
    })
      .populate('patientId', 'name age gender contact')
      .populate('doctorId', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    // Get patients with repeated infections (multiple diagnosis logs)
    const repeatedCases = await DiagnosisLog.aggregate([
      {
        $group: {
          _id: '$patientId',
          count: { $sum: 1 },
          latestRisk: { $last: '$riskLevel' },
          latestDate: { $last: '$createdAt' },
        },
      },
      {
        $match: { count: { $gte: 3 } },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Populate patient details
    const Patient = (await import('../models/Patient.js')).default;
    const repeatedPatientsDetails = await Patient.find({
      _id: { $in: repeatedCases.map(c => c._id) },
    }).select('name age gender contact');

    const repeatedPatients = repeatedCases.map(rc => {
      const patient = repeatedPatientsDetails.find(p => p._id.toString() === rc._id.toString());
      return {
        patient,
        visitCount: rc.count,
        latestRisk: rc.latestRisk,
        latestDate: rc.latestDate,
      };
    });

    res.json({
      highRiskPatients: highRiskLogs,
      repeatedVisits: repeatedPatients,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
