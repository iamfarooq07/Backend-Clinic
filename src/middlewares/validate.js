/**
 * Simple request body validation helpers.
 * In production you might use joi or express-validator.
 */

export const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;
  const errors = [];
  if (!name || typeof name !== "string" || !name.trim())
    errors.push("Valid name is required");
  if (!email || typeof email !== "string" || !email.trim())
    errors.push("Valid email is required");
  if (!password || typeof password !== "string" || password.length < 6)
    errors.push("Password must be at least 6 characters");
  if (role && !["admin", "doctor", "receptionist", "patient"].includes(role))
    errors.push("Invalid role");
  if (errors.length) return res.status(400).json({ message: errors.join("; ") });
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });
  next();
};

export const validatePatient = (req, res, next) => {
  const { name, age, gender, contact } = req.body;
  const errors = [];
  if (!name || !String(name).trim()) errors.push("Name is required");
  if (age === undefined || age === null || Number(age) < 0 || Number(age) > 150)
    errors.push("Valid age (0-150) is required");
  if (!gender || !["male", "female", "other"].includes(gender))
    errors.push("Gender must be male, female, or other");
  if (!contact || !String(contact).trim()) errors.push("Contact is required");
  if (errors.length) return res.status(400).json({ message: errors.join("; ") });
  next();
};

export const validateAppointment = (req, res, next) => {
  const { patientId, doctorId, date, status } = req.body;
  const errors = [];
  if (!patientId) errors.push("patientId is required");
  if (!doctorId) errors.push("doctorId is required");
  if (!date) errors.push("date is required");
  if (status && !["pending", "confirmed", "completed", "cancelled"].includes(status))
    errors.push("Invalid status");
  if (errors.length) return res.status(400).json({ message: errors.join("; ") });
  next();
};

export const validatePrescription = (req, res, next) => {
  const { patientId, medicines, instructions } = req.body;
  const errors = [];
  if (!patientId) errors.push("patientId is required");
  if (!Array.isArray(medicines) || medicines.length === 0)
    errors.push("At least one medicine is required");
  else {
    for (let i = 0; i < medicines.length; i++) {
      const m = medicines[i];
      if (!m.name || !m.dosage || !m.frequency)
        errors.push(`Medicine ${i + 1}: name, dosage, and frequency are required`);
    }
  }
  if (errors.length) return res.status(400).json({ message: errors.join("; ") });
  next();
};

export const validateDiagnosisInput = (req, res, next) => {
  const { symptoms, age, gender, history } = req.body;
  if (!symptoms || !String(symptoms).trim())
    return res.status(400).json({ message: "Symptoms are required" });
  req.body.age = age != null ? Number(age) : null;
  req.body.gender = gender || "";
  req.body.history = history || "";
  next();
};
