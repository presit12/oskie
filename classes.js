const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const classes = await Class.find().sort({ name: 1 });
    res.render('classes/index', { 
      classes, 
      user: req.session.user,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    req.flash('error', 'Error loading classes');
    res.redirect('/dashboard');
  }
});

router.get('/add', isAuthenticated, isAdmin, (req, res) => {
  res.render('classes/add', { user: req.session.user, error: req.flash('error') });
});

router.post('/add', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await Class.create(req.body);
    req.flash('success', 'Class added successfully');
    res.redirect('/classes');
  } catch (error) {
    req.flash('error', 'Error adding class');
    res.redirect('/classes/add');
  }
});

router.get('/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);
    res.render('classes/edit', { classItem, user: req.session.user, error: req.flash('error') });
  } catch (error) {
    req.flash('error', 'Class not found');
    res.redirect('/classes');
  }
});

router.post('/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await Class.findByIdAndUpdate(req.params.id, req.body);
    req.flash('success', 'Class updated successfully');
    res.redirect('/classes');
  } catch (error) {
    req.flash('error', 'Error updating class');
    res.redirect(`/classes/edit/${req.params.id}`);
  }
});

router.post('/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    req.flash('success', 'Class deleted successfully');
    res.redirect('/classes');
  } catch (error) {
    req.flash('error', 'Error deleting class');
    res.redirect('/classes');
  }
});

module.exports = router;
