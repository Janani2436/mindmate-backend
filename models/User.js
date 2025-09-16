import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can contain only letters, numbers, and underscores'],
      // index: true, // Uncomment to speed queries if needed
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please fill a valid email address'],
      // index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      // Consider adding stronger password policies externally (validation middleware)
    },
    role: {
      type: String,
      enum: ['patient', 'therapist', 'supervisor', 'admin'],
      default: 'patient',
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Pre-save middleware to hash password if modified or new
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12); // 12 rounds recommended for balance of performance and security
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare plaintext password with stored hash
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT signed token with user id and role for authorization
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '1d' }
  );
};

// Customize returned object removing sensitive info like password
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  // You can remove other sensitive fields here as needed
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
