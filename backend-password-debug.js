/**
 * Backend Password Debug and Test Script
 * Use this to test password hashing and login functionality directly in your backend
 */

import User from '../models/User.js'; // Adjust path as needed
import bcrypt from 'bcryptjs';

/**
 * Debug a specific user's password in the database
 */
export const debugUserPassword = async (email) => {
  console.log('\n🔍 DEBUG: Checking user password in database');
  console.log('=' .repeat(50));
  
  try {
    // Find the user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return false;
    }
    
    console.log(`✅ User found: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
    
    // Check if password looks like a valid bcrypt hash
    const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(user.password);
    console.log(`   Is valid bcrypt hash: ${isBcryptHash}`);
    
    if (!isBcryptHash) {
      console.log('🚨 WARNING: Password does not appear to be a valid bcrypt hash!');
      console.log('   This could be the cause of login failures.');
      return false;
    }
    
    // Check hash strength
    const hashInfo = user.password.split('$');
    if (hashInfo.length >= 3) {
      console.log(`   Hash algorithm: bcrypt`);
      console.log(`   Hash variant: ${hashInfo[1]}`);
      console.log(`   Hash rounds: ${hashInfo[2]}`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error checking user:', error);
    return false;
  }
};

/**
 * Test password comparison directly
 */
export const testPasswordComparison = async (email, plainPassword) => {
  console.log('\n🧪 TEST: Direct password comparison');
  console.log('=' .repeat(50));
  
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return false;
    }
    
    console.log(`Testing password for: ${user.email}`);
    console.log(`Plain password: ${plainPassword}`);
    console.log(`Stored hash: ${user.password.substring(0, 30)}...`);
    
    // Test using bcrypt directly
    const directMatch = await bcrypt.compare(plainPassword, user.password);
    console.log(`Direct bcrypt.compare result: ${directMatch}`);
    
    // Test using the model method
    const modelMatch = await user.matchPassword(plainPassword);
    console.log(`Model matchPassword result: ${modelMatch}`);
    
    if (directMatch !== modelMatch) {
      console.log('🚨 WARNING: Direct and model methods give different results!');
    }
    
    return directMatch;
    
  } catch (error) {
    console.error('❌ Error testing password:', error);
    return false;
  }
};

/**
 * Create a test user with proper password hashing
 */
export const createTestUser = async () => {
  console.log('\n👤 CREATE: Test user with known password');
  console.log('=' .repeat(50));
  
  const testEmail = `test.user.${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: testEmail });
    if (existingUser) {
      console.log('❌ Test user already exists');
      return false;
    }
    
    console.log(`Creating test user: ${testEmail}`);
    console.log(`With password: ${testPassword}`);
    
    // Create user (password will be hashed by pre-save middleware)
    const user = new User({
      firstName: 'Test',
      lastName: 'User',
      email: testEmail,
      password: testPassword,
      role: 'client',
      userType: 'individual'
    });
    
    await user.save();
    
    console.log('✅ Test user created successfully');
    console.log(`   User ID: ${user._id}`);
    console.log(`   Password hash: ${user.password.substring(0, 30)}...`);
    
    // Immediately test the password
    const passwordWorks = await testPasswordComparison(testEmail, testPassword);
    
    if (passwordWorks) {
      console.log('✅ Password comparison works correctly');
    } else {
      console.log('❌ Password comparison failed - there is an issue!');
    }
    
    return { email: testEmail, password: testPassword, userId: user._id };
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    return false;
  }
};

/**
 * Rehash a user's password (fix corrupted passwords)
 */
export const rehashUserPassword = async (email, newPassword) => {
  console.log('\n🔧 REPAIR: Rehashing user password');
  console.log('=' .repeat(50));
  
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return false;
    }
    
    console.log(`Rehashing password for: ${user.email}`);
    
    // Manually hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    console.log(`New hash: ${hashedPassword.substring(0, 30)}...`);
    
    // Update the user directly (bypassing middleware)
    await User.updateOne(
      { _id: user._id },
      { password: hashedPassword }
    );
    
    console.log('✅ Password rehashed successfully');
    
    // Test the new password
    const passwordWorks = await testPasswordComparison(email, newPassword);
    
    if (passwordWorks) {
      console.log('✅ New password works correctly');
    } else {
      console.log('❌ New password still not working');
    }
    
    return passwordWorks;
    
  } catch (error) {
    console.error('❌ Error rehashing password:', error);
    return false;
  }
};

/**
 * Main debug function - run this to diagnose issues
 */
export const debugPasswordIssues = async (email, password) => {
  console.log('🚀 STARTING PASSWORD DEBUG SESSION');
  console.log('=' .repeat(60));
  
  // Step 1: Check if user exists and password hash is valid
  const userExists = await debugUserPassword(email);
  
  if (!userExists) {
    console.log('\n❌ Cannot proceed - user issues detected');
    return;
  }
  
  // Step 2: Test password comparison
  const passwordWorks = await testPasswordComparison(email, password);
  
  if (passwordWorks) {
    console.log('\n✅ PASSWORD DEBUG COMPLETE: Everything works correctly!');
    console.log('   The issue might be elsewhere in your login flow.');
  } else {
    console.log('\n❌ PASSWORD DEBUG COMPLETE: Password comparison failed');
    console.log('\n🔧 SUGGESTED FIXES:');
    console.log('   1. Try rehashing the password with rehashUserPassword()');
    console.log('   2. Check if the password was corrupted during creation');
    console.log('   3. Verify the plain text password is correct');
  }
};

// Express route handlers for testing (add these to your backend routes)
export const debugPasswordRoute = async (req, res) => {
  const { email, password } = req.body;
  
  console.log(`Debug request for: ${email}`);
  
  try {
    await debugPasswordIssues(email, password);
    res.json({ message: 'Debug complete - check server console' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTestUserRoute = async (req, res) => {
  try {
    const result = await createTestUser();
    res.json({ success: !!result, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const rehashPasswordRoute = async (req, res) => {
  const { email, newPassword } = req.body;
  
  try {
    const result = await rehashUserPassword(email, newPassword);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
