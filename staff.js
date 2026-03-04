const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' });
    const pendingStaff = staff.filter(s => s.status === 'pending');
    const approvedStaff = staff.filter(s => s.status === 'approved');
    const deniedStaff = staff.filter(s => s.status === 'denied');
    
    res.render('staff/index', { 
      staff,
      pendingStaff,
      approvedStaff,
      deniedStaff,
      user: req.session.user,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    req.flash('error', 'Error loading staff');
    res.redirect('/dashboard');
  }
});

router.get('/add', isAuthenticated, isAdmin, (req, res) => {
  res.render('staff/add', { user: req.session.user, error: req.flash('error') });
});

router.post('/add', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { username, password, canAddAlumni, canEditAlumni, canDeleteAlumni } = req.body;
    await User.create({
      username,
      password,
      role: 'staff',
      status: 'approved',
      permissions: {
        canAddAlumni: canAddAlumni === 'on',
        canEditAlumni: canEditAlumni === 'on',
        canDeleteAlumni: canDeleteAlumni === 'on',
        canViewAlumni: true
      }
    });
    req.flash('success', 'Staff account created successfully');
    res.redirect('/staff');
  } catch (error) {
    req.flash('error', 'Error creating staff account');
    res.redirect('/staff/add');
  }
});

router.get('/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const staffMember = await User.findById(req.params.id);
    res.render('staff/edit', { staffMember, user: req.session.user, error: req.flash('error') });
  } catch (error) {
    req.flash('error', 'Staff not found');
    res.redirect('/staff');
  }
});

router.post('/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { username, password, canAddAlumni, canEditAlumni, canDeleteAlumni } = req.body;
    const updateData = {
      username,
      permissions: {
        canAddAlumni: canAddAlumni === 'on',
        canEditAlumni: canEditAlumni === 'on',
        canDeleteAlumni: canDeleteAlumni === 'on',
        canViewAlumni: true
      }
    };
    
    if (password) updateData.password = password;
    
    const staff = await User.findById(req.params.id);
    Object.assign(staff, updateData);
    await staff.save();
    
    req.flash('success', 'Staff updated successfully');
    res.redirect('/staff');
  } catch (error) {
    req.flash('error', 'Error updating staff');
    res.redirect(`/staff/edit/${req.params.id}`);
  }
});

router.post('/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    req.flash('success', 'Staff deleted successfully');
    res.redirect('/staff');
  } catch (error) {
    req.flash('error', 'Error deleting staff');
    res.redirect('/staff');
  }
});

module.exports = router;

router.post('/approve/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { canAddAlumni, canEditAlumni, canDeleteAlumni } = req.body;
    await User.findByIdAndUpdate(req.params.id, {
      status: 'approved',
      permissions: {
        canAddAlumni: canAddAlumni === 'on',
        canEditAlumni: canEditAlumni === 'on',
        canDeleteAlumni: canDeleteAlumni === 'on',
        canViewAlumni: true
      }
    });
    req.flash('success', 'Staff approved successfully');
    res.redirect('/staff');
  } catch (error) {
    req.flash('error', 'Error approving staff');
    res.redirect('/staff');
  }
});

router.post('/deny/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { status: 'denied' });
    req.flash('success', 'Staff denied');
    res.redirect('/staff');
  } catch (error) {
    req.flash('error', 'Error denying staff');
    res.redirect('/staff');
  }
});
