const express = require('express');
const router = express.Router();
const Program = require('../models/Program');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const programs = await Program.find().sort({ name: 1 });
    res.render('programs/index', { 
      programs, 
      user: req.session.user,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    req.flash('error', 'Error loading programs');
    res.redirect('/dashboard');
  }
});

router.get('/add', isAuthenticated, isAdmin, (req, res) => {
  res.render('programs/add', { user: req.session.user, error: req.flash('error') });
});

router.post('/add', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await Program.create(req.body);
    req.flash('success', 'Program added successfully');
    res.redirect('/programs');
  } catch (error) {
    req.flash('error', 'Error adding program');
    res.redirect('/programs/add');
  }
});

router.get('/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    res.render('programs/edit', { program, user: req.session.user, error: req.flash('error') });
  } catch (error) {
    req.flash('error', 'Program not found');
    res.redirect('/programs');
  }
});

router.post('/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await Program.findByIdAndUpdate(req.params.id, req.body);
    req.flash('success', 'Program updated successfully');
    res.redirect('/programs');
  } catch (error) {
    req.flash('error', 'Error updating program');
    res.redirect(`/programs/edit/${req.params.id}`);
  }
});

router.post('/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await Program.findByIdAndDelete(req.params.id);
    req.flash('success', 'Program deleted successfully');
    res.redirect('/programs');
  } catch (error) {
    req.flash('error', 'Error deleting program');
    res.redirect('/programs');
  }
});

module.exports = router;
