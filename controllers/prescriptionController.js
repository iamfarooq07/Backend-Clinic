import Prescription from '../models/Prescription.js';
import Patient from '../models/Patient.js';
import { generatePrescriptionPDF } from '../utils/pdfGenerator.js';
import { generatePrescriptionExplanation } from '../utils/aiService.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

// @desc    Create new prescription
// @route   POST /api/prescriptions
// @access  Private (Doctor)
export const createPrescription = async (req, res) => {
  try {
    const { patientId, appointmentId, diagnosis, medicines, instructions } = req.body;

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Create prescription
    const prescription = await Prescription.create({
      patientId,
      doctorId: req.user._id,
      appointmentId,
      diagnosis,
      medicines,
      instructions,
    });

    // Generate PDF
    try {
      const { filePath, fileName } = await generatePrescriptionPDF(
        prescription,
        patient,
        req.user
      );

      // Upload to Cloudinary (optional - if configured)
      if (process.env.CLOUDINARY_CLOUD_NAME && 
          process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name') {
        const uploadResult = await cloudinary.uploader.upload(filePath, {
          folder: 'prescriptions',
          resource_type: 'raw',
        });
        prescription.pdfUrl = uploadResult.secure_url;
        
        // Delete local file after upload
        fs.unlinkSync(filePath);
      } else {
        // Store local path if Cloudinary not configured
        prescription.pdfUrl = `/uploads/${fileName}`;
      }

      await prescription.save();
    } catch (pdfError) {
      console.error('PDF Generation Error:', pdfError);
      // Continue without PDF if generation fails
    }

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patientId', 'name age gender contact')
      .populate('doctorId', 'name specialization');

    res.status(201).json(populatedPrescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all prescriptions
// @route   GET /api/prescriptions
// @access  Private
export const getPrescriptions = async (req, res) => {
  try {
    const { patientId, doctorId, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    if (patientId) {
      query.patientId = patientId;
    }
    
    if (doctorId) {
      query.doctorId = doctorId;
    } else if (req.user.role === 'doctor') {
      query.doctorId = req.user._id;
    }

    const prescriptions = await Prescription.find(query)
      .populate('patientId', 'name age gender contact')
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Prescription.countDocuments(query);

    res.json({
      prescriptions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single prescription
// @route   GET /api/prescriptions/:id
// @access  Private
export const getPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'name age gender contact email')
      .populate('doctorId', 'name specialization contact');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get AI explanation for prescription
// @route   GET /api/prescriptions/:id/explanation
// @access  Private (Pro Plan)
export const getPrescriptionExplanation = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Generate AI explanation
    const explanation = await generatePrescriptionExplanation(
      prescription.medicines,
      prescription.diagnosis
    );

    res.json(explanation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete prescription
// @route   DELETE /api/prescriptions/:id
// @access  Private (Doctor, Admin)
export const deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Check if user is authorized
    if (req.user.role !== 'admin' && prescription.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this prescription' });
    }

    await prescription.deleteOne();
    res.json({ message: 'Prescription removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
