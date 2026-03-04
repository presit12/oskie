const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Class = require('../models/Class');
const User = require('../models/User');
const Alumni = require('../models/Alumni');
const Program = require('../models/Program');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
  try {
    const classes = await Class.find().sort({ name: 1 });
    // gather basic alumni stats for dashboard
    const totalAlumni = await Alumni.countDocuments();
    const alumniByProgram = await Alumni.aggregate([
      { $group: { _id: '$program', count: { $sum: 1 } } }
    ]);
    // populate program names
    const populated = await Program.find({ _id: { $in: alumniByProgram.map(p => p._id) } });
    const programMap = populated.reduce((m, p) => (m[p._id] = p.name, m), {});
    const alumniByProgramFormatted = alumniByProgram.map(p => ({
      program: programMap[p._id] || 'Unknown',
      count: p.count
    }));
    
    res.render('reports/index', { 
      classes,
      totalAlumni,
      alumniByProgram: alumniByProgramFormatted,
      user: req.session.user,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    req.flash('error', 'Error loading reports');
    res.redirect('/dashboard');
  }
});

router.get('/full', isAuthenticated, async (req, res) => {
  try {
    const students = await Student.find().populate('class').sort({ fullName: 1 });
    const classes = await Class.find();
    const staff = await User.find({ role: 'staff' });
    const alumni = await Alumni.find();
    
    const totalStudents = students.length;
    const totalFees = students.reduce((sum, s) => sum + s.totalFees, 0);
    const totalPaid = students.reduce((sum, s) => sum + s.amountPaid, 0);
    const totalBalance = totalFees - totalPaid;
    const totalAlumni = alumni.length;
    
    const classBreakdown = classes.map(classItem => {
      const classStudents = students.filter(s => s.class && s.class._id.toString() === classItem._id.toString());
      return {
        class: classItem,
        studentCount: classStudents.length,
        totalFees: classStudents.reduce((sum, s) => sum + s.totalFees, 0),
        totalPaid: classStudents.reduce((sum, s) => sum + s.amountPaid, 0),
        totalBalance: classStudents.reduce((sum, s) => sum + s.balance, 0)
      };
    });
    
    const levelBreakdown = ['Level 3', 'Level 4', 'Level 5'].map(level => {
      const levelStudents = students.filter(s => s.level === level);
      return {
        level,
        studentCount: levelStudents.length,
        totalFees: levelStudents.reduce((sum, s) => sum + s.totalFees, 0),
        totalPaid: levelStudents.reduce((sum, s) => sum + s.amountPaid, 0),
        totalBalance: levelStudents.reduce((sum, s) => sum + s.balance, 0)
      };
    });
    
    res.render('reports/full', {
      students,
      totalStudents,
      totalFees,
      totalPaid,
      totalBalance,
      totalAlumni,
      classBreakdown,
      levelBreakdown,
      totalClasses: classes.length,
      totalStaff: staff.length,
      user: req.session.user
    });
  } catch (error) {
    req.flash('error', 'Error generating report');
    res.redirect('/reports');
  }
});

router.get('/class/:id', isAuthenticated, async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      req.flash('error', 'Class not found');
      return res.redirect('/reports');
    }
    
    const students = await Student.find({ class: req.params.id }).sort({ fullName: 1 });
    
    const totalStudents = students.length;
    const totalFees = students.reduce((sum, s) => sum + s.totalFees, 0);
    const totalPaid = students.reduce((sum, s) => sum + s.amountPaid, 0);
    const totalBalance = totalFees - totalPaid;
    
    const fullyPaidCount = students.filter(s => s.balance === 0).length;
    const partiallyPaidCount = students.filter(s => s.amountPaid > 0 && s.balance > 0).length;
    const notPaidCount = students.filter(s => s.amountPaid === 0).length;
    
    const levelBreakdown = ['Level 3', 'Level 4', 'Level 5'].map(level => {
      const levelStudents = students.filter(s => s.level === level);
      return {
        level,
        studentCount: levelStudents.length,
        totalPaid: levelStudents.reduce((sum, s) => sum + s.amountPaid, 0),
        totalBalance: levelStudents.reduce((sum, s) => sum + s.balance, 0)
      };
    });
    
    res.render('reports/class', {
      classItem,
      students,
      totalStudents,
      totalFees,
      totalPaid,
      totalBalance,
      fullyPaidCount,
      partiallyPaidCount,
      notPaidCount,
      levelBreakdown,
      user: req.session.user
    });
  } catch (error) {
    req.flash('error', 'Error generating class report');
    res.redirect('/reports');
  }
});


// detailed alumni report
router.get('/alumni', isAuthenticated, async (req, res) => {
  try {
    const alumni = await Alumni.find().populate('program').sort({ fullName: 1 });
    const totalAlumni = alumni.length;
    const byProgram = {};
    const byYear = {};
    alumni.forEach(a => {
      const progName = a.program ? a.program.name : 'Unknown';
      byProgram[progName] = (byProgram[progName] || 0) + 1;
      const year = a.graduationYear || 'Unknown';
      byYear[year] = (byYear[year] || 0) + 1;
    });
    res.render('reports/alumni', {
      alumni,
      totalAlumni,
      byProgram,
      byYear,
      user: req.session.user
    });
  } catch (error) {
    req.flash('error', 'Error generating alumni report');
    res.redirect('/reports');
  }
});

module.exports = router;
