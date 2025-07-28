# Backend Password Hashing Fix

## 🚨 Critical Issue Identified

Your backend User model has a potential **double-hashing** issue that can cause login failures. Here's what's happening and how to fix it.

## 🔍 Current Backend Code Issues

### Problem 1: Automatic Password Hashing on Every Save
```javascript
// CURRENT CODE - POTENTIAL ISSUE
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

**Issue**: This middleware runs on EVERY save operation, which could potentially cause double-hashing if:
- The user document is saved multiple times during registration
- Updates to other fields trigger password re-hashing
- API validation causes multiple save operations

### Problem 2: No Password Format Validation
The current code doesn't check if a password is already hashed before hashing it again.

## ✅ Recommended Backend Fix

Replace your current password hashing middleware with this improved version:

```javascript
// IMPROVED VERSION - PREVENTS DOUBLE-HASHING
userSchema.pre('save', async function (next) {
  // Only hash password if it's modified AND not already hashed
  if (!this.isModified('password')) {
    return next();
  }

  // Check if password is already hashed (bcrypt format)
  const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(this.password);
  
  if (isBcryptHash) {
    console.log('Password is already hashed, skipping hash operation');
    return next();
  }

  // Only hash if it's a plain text password
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password successfully hashed');
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});
```

## 🔧 Additional Backend Improvements

### 1. Enhanced Registration Endpoint
```javascript
export const registerUser = asyncHandler(async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, userType } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        error: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists with this email'
      });
    }

    // Validate password is not already hashed
    const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(password);
    if (isBcryptHash) {
      return res.status(400).json({
        error: 'Password appears to be already hashed. Please send plain text password.'
      });
    }

    // Create user (password will be hashed by pre-save middleware)
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: password, // This will be hashed by the middleware
      role: role || 'client',
      userType: userType || 'individual'
    });

    console.log(`User created successfully: ${user.email}`);

    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role)
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Failed to create user account'
    });
  }
});
```

### 2. Enhanced Login Endpoint with Better Error Handling
```javascript
export const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`Login attempt for non-existent user: ${email}`);
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check if password matches
    const isPasswordMatch = await user.matchPassword(password);
    
    if (!isPasswordMatch) {
      console.log(`Invalid password attempt for user: ${email}`);
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Update last login timestamp
    user.lastLogin = Date.now();
    await user.save();

    console.log(`User logged in successfully: ${email}`);

    const response = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    };

    // Include companyId for non-superadmin users
    if (user.role !== 'superadmin' && user.companyId) {
      response.companyId = user.companyId;
    }

    res.json(response);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed due to server error'
    });
  }
});
```

## 🧪 Testing the Fix

### Test Case 1: Registration with Plain Text Password
```bash
curl -X POST http://localhost:5000/api/v1/auth/register/user \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "TestPassword123!",
    "role": "client",
    "userType": "individual"
  }'
```

### Test Case 2: Login with Same Password
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### Test Case 3: Attempt Registration with Hashed Password (Should Fail)
```bash
curl -X POST http://localhost:5000/api/v1/auth/register/user \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test2@example.com",
    "password": "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890",
    "role": "client",
    "userType": "individual"
  }'
```

## 🔒 Security Best Practices Implemented

1. **Hash Detection**: Prevents double-hashing by detecting already hashed passwords
2. **Input Validation**: Validates required fields and password format
3. **Error Logging**: Logs authentication attempts for security monitoring
4. **Clean Data**: Trims and normalizes input data
5. **Secure Responses**: Doesn't leak sensitive information in error messages

## 📋 Implementation Checklist

- [ ] Update User model pre-save middleware
- [ ] Update registration endpoint with hash detection
- [ ] Update login endpoint with better error handling
- [ ] Test registration with plain text password
- [ ] Test login with registered password
- [ ] Test rejection of already-hashed passwords
- [ ] Verify no double-hashing occurs
- [ ] Check database to ensure passwords are properly hashed

## 🚨 Critical Points

1. **Frontend sends plain text passwords** ✅ (Fixed)
2. **Backend hashes passwords only once** ❌ (Needs fix)
3. **Login compares plain text with hashed** ✅ (Working)
4. **No double-hashing occurs** ❌ (Needs fix)

Apply these backend changes and your password login issue should be resolved!
