const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'biomedical_default_jwt_secret_key_change_me';
const makeToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
// The very first user becomes ADMIN. Later users can pick TECHNICIAN or STAFF.
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const isFirst = (await User.countDocuments()) === 0;
    const finalRole = isFirst ? 'ADMIN' : ['ADMIN', 'TECHNICIAN', 'STAFF'].includes(role) ? role : 'STAFF';

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role: finalRole,
    });

    res.status(201).json({
      token: makeToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user || !(await bcrypt.compare(password || '', user.password))) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    res.json({
      token: makeToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => res.json({ user: req.user }));

module.exports = router;
