import Patient from "../models/Patient.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import DiagnosisLog from "../models/DiagnosisLog.js";

const FREE_PLAN_PATIENT_LIMIT = 50;

/** List patients - for doctor/receptionist: by createdBy; admin: all */
export const list = async (req, res) => {
  try {
    const role = req.userRole || req.user?.role;
    const userId = req.user.userId;
    let filter = {};
    if (role === "admin") {
      // Admin sees all
    } else {
      filter.createdBy = userId;
    }
    const patients = await Patient.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    res.json({ patients });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Create patient. Free plan: max 50 patients (by createdBy count). */
export const create = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (user.subscriptionPlan === "free") {
      const count = await Patient.countDocuments({ createdBy: userId });
      if (count >= FREE_PLAN_PATIENT_LIMIT) {
        return res.status(403).json({
          message: `Free plan limited to ${FREE_PLAN_PATIENT_LIMIT} patients. Upgrade to Pro for unlimited.`,
        });
      }
    }
    const patient = await Patient.create({
      ...req.body,
      createdBy: userId,
    });
    const populated = await Patient.findById(patient._id).populate(
      "createdBy",
      "name email"
    );
    res.status(201).json({ patient: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Get one patient by id */
export const getOne = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json({ patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Update patient */
export const update = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json({ patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Delete patient */
export const remove = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json({ message: "Patient deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Medical history timeline: appointments + prescriptions + diagnosis logs */
export const getHistory = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    const [appointments, prescriptions, diagnosisLogs] = await Promise.all([
      Appointment.find({ patientId: patient._id })
        .populate("doctorId", "name email")
        .sort({ date: -1 })
        .lean(),
      Prescription.find({ patientId: patient._id })
        .populate("doctorId", "name email")
        .sort({ createdAt: -1 })
        .lean(),
      DiagnosisLog.find({ patientId: patient._id }).sort({ createdAt: -1 }).lean(),
    ]);
    res.json({
      patient: { id: patient._id, name: patient.name, age: patient.age, gender: patient.gender, contact: patient.contact },
      appointments,
      prescriptions,
      diagnosisLogs,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
