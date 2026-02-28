import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";

/** List appointments - filter by doctorId or patientId or all for admin */
export const list = async (req, res) => {
  try {
    const { doctorId, patientId, status, from, to } = req.query;
    const role = req.userRole || req.user?.role;
    const filter = {};
    if (role === "doctor") filter.doctorId = req.user.userId;
    if (role === "patient") {
      const User = (await import("../models/User.js")).default;
      const user = await User.findById(req.user.userId).select("linkedPatientId");
      if (user?.linkedPatientId) filter.patientId = user.linkedPatientId;
      else filter.patientId = null;
    }
    if (doctorId) filter.doctorId = doctorId;
    if (patientId) filter.patientId = patientId;
    if (status) filter.status = status;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    const appointments = await Appointment.find(filter)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "name email")
      .sort({ date: 1 });
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Create appointment */
export const create = async (req, res) => {
  try {
    const appointment = await Appointment.create(req.body);
    const populated = await Appointment.findById(appointment._id)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "name email");
    res.status(201).json({ appointment: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Get one appointment */
export const getOne = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "name email");
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });
    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Update appointment (e.g. status) */
export const update = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "name email");
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });
    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Delete/cancel appointment */
export const remove = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });
    res.json({ message: "Appointment cancelled" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
