import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Remove deprecated options - they're no longer needed in Mongoose 6+
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
