const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Class = require('../models/Class');
const { isAuthenticated, hasPermission } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { search, level, classFilter } = req.query;
    let query = {};
    
    if (search) {
      query.$or = [
        { fullName: new RegExp(search, 'i') },
        { registrationNumber: new RegExp(search, 'i') }
      ];
    }
    if (level) query.level = level;
    if (classFilter) query.class = classFilter;

    const students = await Student.find(query).populate('class').sort({ dateRegistered: -1 });
    const classes = await Class.find().sort({ name: 1 });
    
    res.render('students/index', { 
      students, 
      classes,
      user: req.session.user,
      search: search || '',
      level: level || '',
      classFilter: classFilter || '',
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    req.flash('error', 'Error loading students');
    res.redirect('/dashboard');
  }
});

router.get('/add', isAuthenticated, hasPermission('canAddStudent'), async (req, res) => {
  try {
    const classes = await Class.find().sort({ name: 1 });
    res.render('students/add', { classes, user: req.session.user, error: req.flash('error') });
  } catch (error) {
    req.flash('error', 'Error loading form');
    res.redirect('/students');
  }
});

router.post('/add', isAuthenticated, hasPermission('canAddStudent'), async (req, res) => {
  try {
    const classItem = await Class.findById(req.body.class);
    if (!classItem) {
      req.flash('error', 'Invalid class selected');
      return res.redirect('/students/add');
    }
    
    const studentData = {
      ...req.body,
      totalFees: classItem.fees
    };
    
    await Student.create(studentData);
    req.flash('success', 'Student added successfully');
    res.redirect('/students');
  } catch (error) {
    req.flash('error', 'Error adding student');
    res.redirect('/students/add');
  }
});

router.get('/edit/:id', isAuthenticated, hasPermission('canEditStudent'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('class');
    const classes = await Class.find().sort({ name: 1 });
    res.render('students/edit', { student, classes, user: req.session.user, error: req.flash('error') });
  } catch (error) {
    req.flash('error', 'Student not found');
    res.redirect('/students');
  }
});

router.post('/edit/:id', isAuthenticated, hasPermission('canEditStudent'), async (req, res) => {
  try {
    const classItem = await Class.findById(req.body.class);
    if (!classItem) {
      req.flash('error', 'Invalid class selected');
      return res.redirect(`/students/edit/${req.params.id}`);
    }
    
    const updateData = {
      ...req.body,
      totalFees: classItem.fees
    };
    
    await Student.findByIdAndUpdate(req.params.id, updateData);
    req.flash('success', 'Student updated successfully');
    res.redirect('/students');
  } catch (error) {
    req.flash('error', 'Error updating student');
    res.redirect(`/students/edit/${req.params.id}`);
  }
});

router.post('/delete/:id', isAuthenticated, hasPermission('canDeleteStudent'), async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    req.flash('success', 'Student deleted successfully');
    res.redirect('/students');
  } catch (error) {
    req.flash('error', 'Error deleting student');
    res.redirect('/students');
  }
});

router.get('/payment/:id', isAuthenticated, hasPermission('canRecordPayment'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('class');
    res.render('students/payment', { student, user: req.session.user, error: req.flash('error') });
  } catch (error) {
    req.flash('error', 'Student not found');
    res.redirect('/students');
  }
});

router.post('/payment/:id', isAuthenticated, hasPermission('canRecordPayment'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    const amount = parseFloat(req.body.amount);
    
    student.amountPaid += amount;
    student.payments.push({
      amount,
      recordedBy: req.session.user.username
    });
    
    await student.save();
    req.flash('success', 'Payment recorded successfully');
    res.redirect('/students');
  } catch (error) {
    req.flash('error', 'Error recording payment');
    res.redirect(`/students/payment/${req.params.id}`);
  }
});

module.exports = router;
