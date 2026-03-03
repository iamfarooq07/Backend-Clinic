import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import connectDB from './config/database.js';

dotenv.config();

const doctors = [
  {
    name: 'Sarah Johnson',
    email: 'dr.sarah@clinic.com',
    password: 'doctor123',
    role: 'doctor',
    contact: '+1-234-567-8901',
    specialization: 'Cardiologist',
    subscriptionPlan: 'pro',
  },
  {
    name: 'Michael Chen',
    email: 'dr.chen@clinic.com',
    password: 'doctor123',
    role: 'doctor',
    contact: '+1-234-567-8902',
    specialization: 'Pediatrician',
    subscriptionPlan: 'pro',
  },
  {
    name: 'Emily Rodriguez',
    email: 'dr.emily@clinic.com',
    password: 'doctor123',
    role: 'doctor',
    contact: '+1-234-567-8903',
    specialization: 'Dermatologist',
    subscriptionPlan: 'pro',
  },
  {
    name: 'David Kumar',
    email: 'dr.kumar@clinic.com',
    password: 'doctor123',
    role: 'doctor',
    contact: '+1-234-567-8904',
    specialization: 'Orthopedic Surgeon',
    subscriptionPlan: 'pro',
  },
  {
    name: 'Lisa Anderson',
    email: 'dr.lisa@clinic.com',
    password: 'doctor123',
    role: 'doctor',
    contact: '+1-234-567-8905',
    specialization: 'General Physician',
    subscriptionPlan: 'pro',
  },
];

const seedDoctors = async () => {
  try {
    await connectDB();

    // Check if doctors already exist
    const existingDoctors = await User.find({ role: 'doctor' });
    
    if (existingDoctors.length > 0) {
      console.log('Doctors already exist in database:');
      existingDoctors.forEach(doc => {
        console.log(`- Dr. ${doc.name} (${doc.specialization || 'General'})`);
      });
      console.log('\nTo reset, delete existing doctors first.');
      process.exit(0);
    }

    // Create doctors
    console.log('Creating sample doctors...');
    const createdDoctors = await User.insertMany(doctors);
    
    console.log('\n✅ Successfully created doctors:');
    createdDoctors.forEach(doc => {
      console.log(`- Dr. ${doc.name} (${doc.specialization})`);
      console.log(`  Email: ${doc.email}`);
      console.log(`  Password: doctor123\n`);
    });

    console.log('You can now login with any of these doctor accounts!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding doctors:', error);
    process.exit(1);
  }
};

seedDoctors();
