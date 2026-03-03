import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private (Doctor, Receptionist, Patient)
export const createAppointment = async (req, res) => {
  try {
    let { patientId, doctorId, date, time, reason, notes } = req.body;

    // If user is a patient, auto-create/get their patient record
    if (req.user.role === 'patient') {
      // Check if patient record exists for this user
      let patient = await Patient.findOne({ email: req.user.email });
      
      if (!patient) {
        // Auto-create patient record from user data
        patient = await Patient.create({
          name: req.user.name,
          age: 25, // Default age, can be updated later
          gender: 'other', // Default, can be updated later
          contact: req.user.contact || 'Not provided',
          email: req.user.email,
          createdBy: req.user._id,
        });
      }
      
      patientId = patient._id;
    }

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Verify doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date,
      time,
      reason,
      notes,
      status: req.user.role === 'patient' ? 'pending' : 'confirmed',
      createdBy: req.user._id,
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name age gender contact')
      .populate('doctorId', 'name specialization');

    res.status(201).json(populatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
export const getAppointments = async (req, res) => {
  try {
    const { status, doctorId, date, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by doctor
    if (doctorId) {
      query.doctorId = doctorId;
    } else if (req.user.role === 'doctor') {
      query.doctorId = req.user._id;
    } else if (req.user.role === 'patient') {
      // For patients, find their patient record and show only their appointments
      const patient = await Patient.findOne({ email: req.user.email });
      if (patient) {
        query.patientId = patient._id;
      } else {
        // No patient record yet, return empty
        return res.json({
          appointments: [],
          totalPages: 0,
          currentPage: page,
          total: 0,
        });
      }
    }
    
    // Filter by date
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name age gender contact')
      .populate('doctorId', 'name specialization')
      .sort({ date: -1, time: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Appointment.countDocuments(query);

    res.json({
      appointments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
export const getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name age gender contact email')
      .populate('doctorId', 'name specialization contact');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
export const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('patientId', 'name age gender contact')
     .populate('doctorId', 'name specialization');

    res.json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    await appointment.deleteOne();
    res.json({ message: 'Appointment removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor schedule
// @route   GET /api/appointments/doctor/:doctorId/schedule
// @access  Private
export const getDoctorSchedule = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;

    let query = { doctorId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name contact')
      .sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all doctors
// @route   GET /api/appointments/doctors
// @access  Private
export const getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' })
      .select('name specialization contact email')
      .sort({ name: 1 });

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
