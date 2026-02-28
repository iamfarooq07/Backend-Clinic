import User from "../models/User.js";

/** List doctors for dropdowns (id, name, email) */
export const listDoctors = async (req, res) => {
  try {
    const users = await User.find({ role: "doctor" })
      .select("_id name email")
      .lean();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
