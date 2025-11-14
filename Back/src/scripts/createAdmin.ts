import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from '../modules/users/model';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Script to create the initial admin user.
 * Run with: npx tsx src/scripts/createAdmin.ts
 */
async function createAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Admin credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@jafar.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';

    // Check if admin already exists
    const existing = await UserModel.findOne({ email: adminEmail });
    if (existing) {
      console.log('⚠️  Admin user already exists:');
      console.log(`   Email: ${existing.email}`);
      console.log(`   Username: ${existing.username}`);
      console.log(`   Role: ${existing.role}`);
      console.log(`   ID: ${existing._id}`);

      // Update to admin if not already
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        existing.curatorStatus = 'none';
        await existing.save();
        console.log('\n✅ Updated existing user to admin role');
      }

      await mongoose.disconnect();
      process.exit(0);
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    console.log('👤 Creating admin user...');
    const admin = await UserModel.create({
      email: adminEmail,
      username: adminUsername,
      passwordHash,
      role: 'admin',
      curatorStatus: 'none',
      balance: 1000, // Give admin starting balance
    });

    console.log('\n✅ Admin user created successfully!\n');
    console.log('📋 Admin Credentials:');
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role:     ${admin.role}`);
    console.log(`   ID:       ${admin._id}`);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!\n');

    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createAdmin();
