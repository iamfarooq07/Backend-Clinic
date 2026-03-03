import mongoose from "mongoose";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import User from "../models/User.js";
import DiagnosisLog from "../models/DiagnosisLog.js";

/** Admin dashboard: total patients, doctors, monthly appointments, simulated revenue, most common diagnosis */
export const adminDashboard = async (req, res) => {
  try {
    const [totalPatients, totalDoctors, monthlyAppointments, revenue, diagnosisStats] =
      await Promise.all([
        Patient.countDocuments(),
        User.countDocuments({ role: "doctor" }),
        Appointment.aggregate([
          {
            $match: {
              date: {
                $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                $lte: new Date(),
              },
            },
          },
          { $count: "count" },
        ]),
        Appointment.aggregate([
          {
            $match: {
              status: "completed",
              date: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) },
            },
          },
          { $count: "count" },
        ]),
        DiagnosisLog.aggregate([
          { $group: { _id: "$riskLevel", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
      ]);

    const monthlyCount = monthlyAppointments[0]?.count ?? 0;
    const completedLastMonth = revenue[0]?.count ?? 0;
    const simulatedRevenue = completedLastMonth * 50; // $50 per completed visit

    res.json({
      totalPatients,
      totalDoctors,
      monthlyAppointments: monthlyCount,
      simulatedRevenue,
      diagnosisByRisk: diagnosisStats,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Doctor dashboard: daily appointments, monthly stats, prescription count */
export const doctorDashboard = async (req, res) => {
  try {
    const doctorId = new mongoose.Types.ObjectId(req.user.userId);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [dailyAppointments, monthlyStats, prescriptionCount] = await Promise.all([
      Appointment.countDocuments({
        doctorId,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ["pending", "confirmed"] },
      }),
      Appointment.aggregate([
        { $match: { doctorId, date: { $gte: startOfMonth } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Prescription.countDocuments({ doctorId }),
    ]);

    const monthlyByStatus = monthlyStats.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {});

    res.json({
      dailyAppointments,
      monthlyStats: monthlyByStatus,
      prescriptionCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Monthly appointments chart data (for admin or doctor) */
export const monthlyAppointmentsChart = async (req, res) => {
  try {
    const doctorId = req.userRole === "doctor" ? req.user.userId : null;
    const match = doctorId ? { doctorId: new mongoose.Types.ObjectId(doctorId) } : {};
    const months = 6;
    const result = await Appointment.aggregate([
      { $match: match },
      {
        $match: {
          date: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - months)),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
