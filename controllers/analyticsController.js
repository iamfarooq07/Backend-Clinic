import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import DiagnosisLog from '../models/DiagnosisLog.js';
import User from '../models/User.js';

// @desc    Get admin dashboard analytics
// @route   GET /api/analytics/admin
// @access  Private (Admin)
export const getAdminAnalytics = async (req, res) => {
  try {
    // Total counts
    const totalPatients = await Patient.countDocuments();
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const totalAppointments = await Appointment.countDocuments();
    const totalPrescriptions = await Prescription.countDocuments();

    // Monthly appointments
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyAppointments = await Appointment.countDocuments({
      createdAt: { $gte: currentMonth },
    });

    // Appointment status breakdown
    const appointmentsByStatus = await Appointment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Most common diagnoses (from diagnosis logs)
    const commonDiagnoses = await DiagnosisLog.aggregate([
      {
        $unwind: '$aiResponse.possibleConditions',
      },
      {
        $group: {
          _id: '$aiResponse.possibleConditions',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Simulated revenue (for demo purposes)
    const proUsers = await User.countDocuments({ subscriptionPlan: 'pro' });
    const simulatedRevenue = proUsers * 99; // $99 per pro user

    // Monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          appointments: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    // Risk level distribution
    const riskDistribution = await DiagnosisLog.aggregate([
      {
        $group: {
          _id: '$riskLevel',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      overview: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        totalPrescriptions,
        monthlyAppointments,
        simulatedRevenue,
      },
      appointmentsByStatus,
      commonDiagnoses,
      monthlyTrends,
      riskDistribution,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor dashboard analytics
// @route   GET /api/analytics/doctor
// @access  Private (Doctor)
export const getDoctorAnalytics = async (req, res) => {
  try {
    const doctorId = req.user._id;

    // Today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await Appointment.countDocuments({
      doctorId,
      date: { $gte: today, $lt: tomorrow },
    });

    // Monthly stats
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyAppointments = await Appointment.countDocuments({
      doctorId,
      createdAt: { $gte: currentMonth },
    });

    const monthlyPrescriptions = await Prescription.countDocuments({
      doctorId,
      createdAt: { $gte: currentMonth },
    });

    // Total patients treated
    const totalPatients = await Patient.countDocuments({ createdBy: doctorId });

    // Appointment status breakdown
    const appointmentsByStatus = await Appointment.aggregate([
      {
        $match: { doctorId: doctorId },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Recent appointments
    const recentAppointments = await Appointment.find({ doctorId })
      .populate('patientId', 'name age gender contact')
      .sort({ date: -1 })
      .limit(5);

    // Weekly appointment trends (last 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const weeklyTrends = await Appointment.aggregate([
      {
        $match: {
          doctorId: doctorId,
          createdAt: { $gte: fourWeeksAgo },
        },
      },
      {
        $group: {
          _id: {
            week: { $week: '$createdAt' },
            year: { $year: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.week': 1 },
      },
    ]);

    res.json({
      overview: {
        todayAppointments,
        monthlyAppointments,
        monthlyPrescriptions,
        totalPatients,
      },
      appointmentsByStatus,
      recentAppointments,
      weeklyTrends,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get receptionist dashboard analytics
// @route   GET /api/analytics/receptionist
// @access  Private (Receptionist)
export const getReceptionistAnalytics = async (req, res) => {
  try {
    // Today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await Appointment.find({
      date: { $gte: today, $lt: tomorrow },
    })
      .populate('patientId', 'name contact')
      .populate('doctorId', 'name')
      .sort({ time: 1 });

    // Pending appointments
    const pendingAppointments = await Appointment.countDocuments({
      status: 'pending',
    });

    // Recent patients
    const recentPatients = await Patient.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name age gender contact createdAt');

    // Total patients registered
    const totalPatients = await Patient.countDocuments();

    res.json({
      overview: {
        todayAppointmentsCount: todayAppointments.length,
        pendingAppointments,
        totalPatients,
      },
      todayAppointments,
      recentPatients,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
