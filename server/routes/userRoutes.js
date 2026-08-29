const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const TuitionRequest = require('../models/TuitionRequest');

// Multer config - save uploaded images to /server/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files (jpg, png, webp, gif) are allowed.'));
  },
});

// POST /api/users/sync - Create or update a user
router.post('/sync', async (req, res) => {
  try {
    const { firebaseUid, name, email, phone, photoURL, role } = req.body;

    if (!firebaseUid || !role) {
      return res.status(400).json({ error: 'firebaseUid and role are required.' });
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      { name, email, phone, photoURL, role },
      { new: true, upsert: true, runValidators: true }
    );

    console.log(`User synced: ${user.name || user.phone} (${user.role})`);
    res.json(user);
  } catch (err) {
    console.error('User sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/teachers - Fetch all teachers with complete profiles (public listing)
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await User.find(
      { role: 'teacher', 'teacherProfile.isProfileComplete': true },
      {
        firebaseUid: 1,
        name: 1,
        'teacherProfile.contactNumber': 1,
        'teacherProfile.subjects': 1,
        'teacherProfile.classLevels': 1,
        'teacherProfile.qualification': 1,
        'teacherProfile.experience': 1,
        'teacherProfile.feePackages': 1,
        'teacherProfile.area': 1,
        'teacherProfile.mode': 1,
        'teacherProfile.bio': 1,
        'teacherProfile.profilePhoto': 1,
      }
    ).lean();

    console.log(`[GET /teachers] Found ${teachers.length} complete teacher(s)`);
    res.json(teachers);
  } catch (err) {
    console.error('Fetch teachers error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/students - Fetch all students with complete requirements (admin listing)
router.get('/students', async (req, res) => {
  try {
    const students = await User.find(
      { role: 'student', 'studentRequirement.isRequirementComplete': true },
      {
        firebaseUid: 1,
        name: 1,
        'studentRequirement.contactNumber': 1,
        'studentRequirement.subjects': 1,
        'studentRequirement.classLevel': 1,
        'studentRequirement.budgetPackages': 1,
        'studentRequirement.area': 1,
        'studentRequirement.mode': 1,
        'studentRequirement.additionalNotes': 1,
      }
    ).lean();

    console.log(`[GET /students] Found ${students.length} complete student(s)`);
    res.json(students);
  } catch (err) {
    console.error('Fetch students error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:firebaseUid/teacher-profile - Update teacher profile (multipart/form-data)
// IMPORTANT: This must be defined BEFORE the generic GET /:firebaseUid route,
// otherwise Express 5 treats "uid/teacher-profile" as a single :firebaseUid param.
router.put('/:firebaseUid/teacher-profile', upload.single('profilePhoto'), async (req, res) => {
  try {
    console.log('[PUT teacher-profile] Params:', req.params);
    console.log('[PUT teacher-profile] Body keys:', Object.keys(req.body));
    console.log('[PUT teacher-profile] File:', req.file ? req.file.filename : 'none');

    const { name, contactNumber, subjects, classLevels, qualification, experience, feePackages, area, mode, bio } = req.body;

    // Build profile object
    const profileData = {
      contactNumber: contactNumber || '',
      subjects: subjects ? (Array.isArray(subjects) ? subjects : JSON.parse(subjects)) : [],
      classLevels: classLevels ? (Array.isArray(classLevels) ? classLevels : JSON.parse(classLevels)) : [],
      qualification: qualification || '',
      experience: Number(experience) || 0,
      feePackages: feePackages ? (Array.isArray(feePackages) ? feePackages : JSON.parse(feePackages)) : [],
      area: area || '',
      mode: mode || 'offline',
      bio: bio || '',
      isProfileComplete: true,
    };

    // If a new photo was uploaded, add its URL
    if (req.file) {
      profileData.profilePhoto = `/uploads/${req.file.filename}`;
    } else {
      // Keep existing photo if editing without re-uploading
      const existingUser = await User.findOne({ firebaseUid: req.params.firebaseUid });
      if (existingUser?.teacherProfile?.profilePhoto) {
        profileData.profilePhoto = existingUser.teacherProfile.profilePhoto;
      }
    }

    const updateData = { teacherProfile: profileData };
    if (name !== undefined) updateData.name = name;

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.params.firebaseUid },
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    console.log(`Teacher profile updated for: ${user.name || user.firebaseUid}`);
    res.json(user);
  } catch (err) {
    console.error('Teacher profile update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:firebaseUid/student-requirement - Update student requirement (JSON body)
// Must be defined BEFORE the generic GET /:firebaseUid route
router.put('/:firebaseUid/student-requirement', async (req, res) => {
  try {
    console.log('[PUT student-requirement] Params:', req.params);
    console.log('[PUT student-requirement] Body:', req.body);

    const { name, contactNumber, subjects, classLevel, budgetPackages, area, additionalNotes } = req.body;

    const requirementData = {
      contactNumber: contactNumber || '',
      subjects: Array.isArray(subjects) ? subjects : [],
      classLevel: classLevel || '',
      budgetPackages: Array.isArray(budgetPackages) ? budgetPackages : [],
      area: area || '',
      mode: 'offline',
      additionalNotes: (additionalNotes || '').slice(0, 200),
      isRequirementComplete: true,
    };

    const updateData = { studentRequirement: requirementData };
    if (name !== undefined) updateData.name = name;

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.params.firebaseUid },
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // --- Create or Update General TuitionRequest ---
    const subjectString = requirementData.subjects.length > 0 
      ? requirementData.subjects.join(', ') 
      : 'General Subject';

    const existingRequest = await TuitionRequest.findOne({
      studentFirebaseUid: req.params.firebaseUid,
      requestType: 'general',
      status: 'pending'
    });

    if (existingRequest) {
      existingRequest.subject = subjectString;
      existingRequest.studentName = user.name || '';
      existingRequest.studentContactNumber = requirementData.contactNumber;
      existingRequest.area = requirementData.area || '';
      existingRequest.classLevel = requirementData.classLevel || '';
      await existingRequest.save();
      console.log(`Updated pending general request for ${user.firebaseUid}`);
    } else {
      await TuitionRequest.create({
        studentFirebaseUid: user.firebaseUid,
        studentName: user.name || '',
        studentContactNumber: requirementData.contactNumber,
        area: requirementData.area || '',
        classLevel: requirementData.classLevel || '',
        subject: subjectString,
        requestType: 'general',
        status: 'pending'
      });
      console.log(`Created new general request for ${user.firebaseUid}`);
    }

    console.log(`Student requirement updated for: ${user.name || user.firebaseUid}`);
    res.json(user);
  } catch (err) {
    console.error('Student requirement update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/teachers/:firebaseUid - Fetch one teacher's full public profile
router.get('/teachers/:firebaseUid', async (req, res) => {
  try {
    const user = await User.findOne({
      firebaseUid: req.params.firebaseUid,
      role: 'teacher',
      'teacherProfile.isProfileComplete': true,
    }).lean();

    if (!user) {
      return res.status(404).json({ error: 'Teacher not found or profile incomplete.' });
    }

    // Return only public-facing fields
    res.json({
      firebaseUid: user.firebaseUid,
      name: user.name,
      contactNumber: user.teacherProfile.contactNumber,
      teacherProfile: user.teacherProfile,
    });
  } catch (err) {
    console.error('Fetch teacher profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:firebaseUid - Fetch a user by firebaseUid
// This generic param route must come AFTER more-specific routes like /:firebaseUid/teacher-profile
router.get('/:firebaseUid', async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.firebaseUid });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(user);
  } catch (err) {
    console.error('Fetch user error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
