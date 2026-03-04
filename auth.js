const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/login', (req, res) => {
  res.render('login', { error: req.flash('error'), success: req.flash('success') });
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || !(await user.comparePassword(password))) {
      req.flash('error', 'Invalid username or password');
      return res.redirect('/auth/login');
    }

    if (user.role === 'staff' && user.status === 'pending') {
      req.flash('error', 'Your account is pending admin approval. Please wait.');
      return res.redirect('/auth/login');
    }

    if (user.role === 'staff' && user.status === 'denied') {
      req.flash('error', 'Access denied. Your account has been rejected by the admin.');
      return res.redirect('/auth/login');
    }

    req.session.user = {
      id: user._id,
      username: user.username,
      role: user.role,
      permissions: user.permissions
    };

    res.redirect('/dashboard');
  } catch (error) {
    req.flash('error', 'Login failed');
    res.redirect('/auth/login');
  }
});

// bootstrap endpoint for creating the default admin account
router.get('/admin', async (req, res) => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return res.send('Admin already exists');
    }

    await User.create({
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      status: 'approved',
      permissions: {
        canAddAlumni: true,
        canEditAlumni: true,
        canDeleteAlumni: true,
        canViewAlumni: true
      }
    });

    res.send('Admin created: username=admin, password=admin123');
  } catch (error) {
    res.status(500).send('Error creating admin');
  }
});

router.get('/signup', (req, res) => {
  res.render('signup', { error: req.flash('error'), success: req.flash('success') });
});

router.post('/signup', async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/auth/signup');
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      req.flash('error', 'Username already exists');
      return res.redirect('/auth/signup');
    }

    await User.create({
      username,
      password,
      role: 'staff',
      status: 'pending'
    });

    req.flash('success', 'Registration successful! Waiting for admin approval.');
    res.redirect('/auth/login');
  } catch (error) {
    req.flash('error', 'Registration failed');
    res.redirect('/auth/signup');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/auth/login');
});

module.exports = router;
