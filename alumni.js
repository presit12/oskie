const express = require('express');
const router = express.Router();
const Alumni = require('../models/Alumni');
const Program = require('../models/Program');
const { isAuthenticated, hasPermission } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { search, graduationYear, programFilter } = req.query;
    let query = {};
    
    if (search) {
      query.$or = [
        { fullName: new RegExp(search, 'i') },
        { registrationNumber: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }
    if (graduationYear) query.graduationYear = parseInt(graduationYear);
    if (programFilter) query.program = programFilter;

    const alumni = await Alumni.find(query).populate('program').sort({ dateRegistered: -1 });
    const programs = await Program.find().sort({ name: 1 });
    
    res.render('alumni/index', { 
      alumni, 
      programs,
      user: req.session.user,
      search: search || '',
      graduationYear: graduationYear || '',
      programFilter: programFilter || '',
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    req.flash('error', 'Error loading alumni');
    res.redirect('/dashboard');
  }
});

router.get('/add', isAuthenticated, hasPermission('canAddAlumni'), async (req, res) => {
  try {
    const programs = await Program.find().sort({ name: 1 });
    res.render('alumni/add', { programs, user: req.session.user, error: req.flash('error') });
  } catch (error) {
    req.flash('error', 'Error loading form');
    res.redirect('/alumni');
  }
});

router.post('/add', isAuthenticated, hasPermission('canAddAlumni'), async (req, res) => {
  try {
    const program = await Program.findById(req.body.program);
    if (!program) {
      req.flash('error', 'Invalid program selected');
      return res.redirect('/alumni/add');
    }
    // remove deprecated field if present
    if (req.body.linkedIn) delete req.body.linkedIn;
    
    await Alumni.create(req.body);
    req.flash('success', 'Alumni added successfully');
    res.redirect('/alumni');
  } catch (error) {
    req.flash('error', 'Error adding alumni');
    res.redirect('/alumni/add');
  }
});

router.get('/edit/:id', isAuthenticated, hasPermission('canEditAlumni'), async (req, res) => {
  try {
    const alumnus = await Alumni.findById(req.params.id).populate('program');
    const programs = await Program.find().sort({ name: 1 });
    res.render('alumni/edit', { alumnus, programs, user: req.session.user, error: req.flash('error') });
  } catch (error) {
    req.flash('error', 'Alumni not found');
    res.redirect('/alumni');
  }
});

router.post('/edit/:id', isAuthenticated, hasPermission('canEditAlumni'), async (req, res) => {
  try {
    const program = await Program.findById(req.body.program);
    if (!program) {
      req.flash('error', 'Invalid program selected');
      return res.redirect(`/alumni/edit/${req.params.id}`);
    }
    // strip out deprecated field
    if (req.body.linkedIn) delete req.body.linkedIn;
    
    await Alumni.findByIdAndUpdate(req.params.id, req.body);
    req.flash('success', 'Alumni updated successfully');
    res.redirect('/alumni');
  } catch (error) {
    req.flash('error', 'Error updating alumni');
    res.redirect(`/alumni/edit/${req.params.id}`);
  }
});

router.post('/delete/:id', isAuthenticated, hasPermission('canDeleteAlumni'), async (req, res) => {
  try {
    await Alumni.findByIdAndDelete(req.params.id);
    req.flash('success', 'Alumni deleted successfully');
    res.redirect('/alumni');
  } catch (error) {
    req.flash('error', 'Error deleting alumni');
    res.redirect('/alumni');
  }
});

router.get('/view/:id', isAuthenticated, async (req, res) => {
  try {
    const alumnus = await Alumni.findById(req.params.id).populate('program');
    res.render('alumni/view', { alumnus, user: req.session.user });
  } catch (error) {
    req.flash('error', 'Alumni not found');
    res.redirect('/alumni');
  }
});

module.exports = router;
