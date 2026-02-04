const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rental-saas', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    const email = 'auxxweb@gmail.com';
    const password = 'Pass@123#';
    const name = 'Super Admin';

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists with email:', email);
      console.log('Updating user to super_admin role...');
      
      existingUser.role = 'super_admin';
      existingUser.password = password; // This will be hashed by the pre-save hook
      await existingUser.save();
      
      console.log('User updated successfully!');
      console.log('Email:', email);
      console.log('Password:', password);
      process.exit(0);
    }

    // Create super admin
    const admin = await User.create({
      name: name,
      email: email,
      password: password,
      role: 'super_admin'
    });

    console.log('Super admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role: super_admin');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
