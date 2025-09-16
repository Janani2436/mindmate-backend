import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Log helper for colored and consistent logs
const log = (...args) => console.log('\x1b[36m[AuthRoute]\x1b[0m', ...args);

const ALLOWED_ROLES = ['patient', 'therapist', 'supervisor'];

/**
 * Register a new user
 * POST /api/auth/register
 * Body: { username, email, password, role }
 */
router.post('/register', async (req, res) => {
  let { username, email, password, role } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.ip;

  log('Register attempt:', { username, email, role, ip });

  // Validate required fields
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required.' });
  }

  // Username constraints
  if (username.length < 3 || username.length > 30 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: 'Username must be 3–30 characters, letters/numbers/underscore only.' });
  }

  // Email format check
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  // Normalize
  username = username.toLowerCase();
  email = email.toLowerCase();

  // Validate and assign role
  if (!role || !ALLOWED_ROLES.includes(role.toLowerCase())) {
    role = 'patient'; // default role
  } else {
    role = role.toLowerCase();
  }

  try {
    // Check duplicates in username or email
    const duplicateUser = await User.findOne({ 
      $or: [{ username }, { email }]
    });
    if (duplicateUser) {
      const takenField = duplicateUser.username === username ? 'Username' : 'Email';
      return res.status(409).json({ error: `${takenField} is already taken.` });
    }

    // Create and save user (hash handled in model)
    const user = new User({ username, email, password, role });
    await user.save();

    log('User registered:', username, role, user._id.toString());

    // Generate JWT token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      message: 'User registered successfully.',
      user: user.toJSON(),
      token,
    });
  } catch (err) {
    log('Registration error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * Login user
 * POST /api/auth/login
 * Body: { username, password, role }
 */
router.post('/login', async (req, res) => {
  let { username, password, role } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.ip;

  log('Login attempt:', { username, role, ip });

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  username = username.toLowerCase();
  if (role) {
    role = role.toLowerCase();
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Check role matches if provided (strict)
    if (role && user.role !== role) {
      return res.status(403).json({ error: 'Role mismatch.' });
    }

    const passwordMatches = await user.matchPassword(password);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = user.getSignedJwtToken();

    log('Login successful:', username, user.role);

    res.json({
      message: 'Login successful.',
      user: user.toJSON(),
      token,
    });
  } catch (err) {
    log('Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
