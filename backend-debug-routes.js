/**
 * Quick Backend Password Test
 * Add this to your backend to test password functionality
 */

// Add this route to your backend router (e.g., in authController.js or a separate debug route file)

export const testPasswordDebug = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  console.log('\n🔍 PASSWORD DEBUG TEST');
  console.log('='.repeat(40));
  console.log(`Testing login for: ${email}`);
  console.log(`Password provided: ${password}`);
  
  try {
    // Step 1: Find the user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(404).json({ 
        error: 'User not found',
        debug: { userExists: false }
      });
    }
    
    console.log(`✅ User found: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Password hash: ${user.password.substring(0, 30)}...`);
    
    // Step 2: Check if password hash is valid bcrypt format
    const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(user.password);
    console.log(`   Is valid bcrypt hash: ${isBcryptHash}`);
    
    if (!isBcryptHash) {
      console.log('🚨 CRITICAL: Password is not a valid bcrypt hash!');
      return res.status(500).json({
        error: 'Invalid password hash format in database',
        debug: { 
          userExists: true, 
          validHash: false,
          passwordHash: user.password.substring(0, 20) + '...'
        }
      });
    }
    
    // Step 3: Test password comparison
    console.log('🧪 Testing password comparison...');
    
    // Test with bcrypt directly
    const directMatch = await bcrypt.compare(password, user.password);
    console.log(`   Direct bcrypt.compare: ${directMatch}`);
    
    // Test with model method
    const modelMatch = await user.matchPassword(password);
    console.log(`   Model matchPassword: ${modelMatch}`);
    
    // Step 4: Return results
    if (directMatch && modelMatch) {
      console.log('✅ PASSWORD TEST PASSED: Login should work');
      
      return res.json({
        success: true,
        message: 'Password verification successful',
        debug: {
          userExists: true,
          validHash: true,
          directMatch: true,
          modelMatch: true
        }
      });
    } else {
      console.log('❌ PASSWORD TEST FAILED: Login will not work');
      
      return res.status(401).json({
        error: 'Password verification failed',
        debug: {
          userExists: true,
          validHash: true,
          directMatch,
          modelMatch,
          issue: 'Password does not match stored hash'
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error during password debug:', error);
    
    return res.status(500).json({
      error: 'Debug test failed',
      debug: { error: error.message }
    });
  }
});

// Test route to create a user with known password
export const createDebugUser = asyncHandler(async (req, res) => {
  const testEmail = `debug.user.${Date.now()}@example.com`;
  const testPassword = 'DebugPassword123!';
  
  console.log('\n👤 CREATING DEBUG USER');
  console.log('='.repeat(40));
  console.log(`Email: ${testEmail}`);
  console.log(`Password: ${testPassword}`);
  
  try {
    // Create user
    const user = new User({
      firstName: 'Debug',
      lastName: 'User',
      email: testEmail,
      password: testPassword, // Will be hashed by pre-save middleware
      role: 'client',
      userType: 'individual'
    });
    
    await user.save();
    
    console.log('✅ Debug user created successfully');
    console.log(`   User ID: ${user._id}`);
    console.log(`   Password hash: ${user.password.substring(0, 30)}...`);
    
    // Test the password immediately
    const testResult = await bcrypt.compare(testPassword, user.password);
    console.log(`   Password test: ${testResult ? 'PASS' : 'FAIL'}`);
    
    res.json({
      success: true,
      message: 'Debug user created',
      data: {
        email: testEmail,
        password: testPassword,
        userId: user._id,
        passwordTest: testResult
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating debug user:', error);
    
    res.status(500).json({
      error: 'Failed to create debug user',
      details: error.message
    });
  }
});
