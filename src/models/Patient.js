import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: 0,
      max: 150,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    contact: {
      type: String,
      required: [true, "Contact is required"],
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Patient", patientSchema);
