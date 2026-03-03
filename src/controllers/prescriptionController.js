import Prescription from "../models/Prescription.js";
import { generatePrescriptionPdf } from "../utils/pdf.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

/** List prescriptions - by doctor or by patient */
export const list = async (req, res) => {
  try {
    const { patientId, doctorId } = req.query;
    const filter = {};
    if (req.userRole === "doctor") filter.doctorId = req.user.userId;
    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;
    const prescriptions = await Prescription.find(filter)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "name email")
      .sort({ createdAt: -1 });
    res.json({ prescriptions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Create prescription and optionally generate PDF (upload to Cloudinary if configured) */
export const create = async (req, res) => {
  try {
    const prescription = await Prescription.create({
      ...req.body,
      doctorId: req.user.userId,
    });
    const populated = await Prescription.findById(prescription._id)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "name email");
    let pdfUrl = null;
    try {
      const pdfBuffer = await generatePrescriptionPdf(populated);
      if (pdfBuffer && process.env.CLOUDINARY_CLOUD_NAME) {
        const result = await uploadToCloudinary(
          pdfBuffer,
          `prescriptions/${prescription._id}.pdf`
        );
        if (result?.secure_url) {
          pdfUrl = result.secure_url;
          populated.pdfUrl = pdfUrl;
          await populated.save();
        }
      }
    } catch (pdfErr) {
      console.error("PDF generation/upload failed:", pdfErr.message);
    }
    res.status(201).json({
      prescription: { ...populated.toObject(), pdfUrl: pdfUrl ?? populated.pdfUrl },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Get one prescription */
export const getOne = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "name email");
    if (!prescription)
      return res.status(404).json({ message: "Prescription not found" });
    res.json({ prescription });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Generate PDF for existing prescription (and optionally re-upload) */
export const generatePdf = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "name email");
    if (!prescription)
      return res.status(404).json({ message: "Prescription not found" });
    const pdfBuffer = await generatePrescriptionPdf(prescription);
    if (!pdfBuffer) {
      return res.status(500).json({ message: "PDF generation failed" });
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=prescription-${prescription._id}.pdf`
    );
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
