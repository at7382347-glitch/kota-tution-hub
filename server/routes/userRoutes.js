const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const User = require('../models/User');
const TuitionRequest = require('../models/TuitionRequest');
const { requireUser, requireAdmin, requireUserOrAdmin, requireSelf } = require('../middleware/auth');
const { perStudentFeeFor } = require('../config/fees');

// Cloudinary config - reads CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const isCloudinaryConfigured = () =>
  !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

// Stream an in-memory image buffer to Cloudinary and resolve with its HTTPS URL
function uploadToCloudinary(buffer, firebaseUid) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'kota-tuition-hub/teachers',
        public_id: `${firebaseUid}-${Date.now()}`,
        resource_type: 'image',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'auto' }],
      },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });
}

// Public profile text must not carry contact details (phone numbers are admin-only).
// Matches Indian mobile numbers (optionally +91/0 prefixed, with spaces/dashes) and
// common "contact me" phrases; years like "2015 2019" don't match since mobiles start with 6-9.
const PHONE_PATTERN = /(?<!\d)(?:\+?91[\s-]?|0)?[6-9](?:[\s.-]?\d){9}(?!\d)/;
const CONTACT_PHRASE_PATTERN = /whats\s*app|watsapp|wa\.me|call\s+me|contact\s+me|ph(?:one)?\s*(?:no|number)|mob(?:ile)?\s*(?:no|number)|@gmail|@yahoo|instagram|telegram/i;

function findContactInfo(fields) {
  for (const [label, value] of Object.entries(fields)) {
    const text = String(value || '');
    if (PHONE_PATTERN.test(text) || CONTACT_PHRASE_PATTERN.test(text)) return label;
  }
  return null;
}

// Multer config - keep uploaded images in memory; they are streamed to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
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
// The role is locked after the first sync: an existing user keeps their role and profile name.
router.post('/sync', requireUser, async (req, res) => {
  try {
    const firebaseUid = req.firebaseUid;
    const { name, email, phone, photoURL, role } = req.body;

    const existingUser = await User.findOne({ firebaseUid });
    if (existingUser) {
      existingUser.email = email || existingUser.email;
      existingUser.phone = phone || existingUser.phone;
      existingUser.photoURL = photoURL || existingUser.photoURL;
      if (!existingUser.name && name) existingUser.name = name;
      await existingUser.save();
      console.log(`User signed in: ${firebaseUid} (${existingUser.role})`);
      return res.json(existingUser);
    }

    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ error: 'A valid role (student or teacher) is required.' });
    }

    const user = await User.create({ firebaseUid, name, email, phone, photoURL, role });

    console.log(`User registered: ${firebaseUid} (${user.role})`);
    res.json(user);
  } catch (err) {
    console.error('User sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/teachers - Fetch all teachers with complete profiles (public listing, no contact info)
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await User.find(
      { role: 'teacher', 'teacherProfile.isProfileComplete': true },
      {
        firebaseUid: 1,
        name: 1,
        'teacherProfile.subjects': 1,
        'teacherProfile.classLevels': 1,
        'teacherProfile.qualification': 1,
        'teacherProfile.experience': 1,
        'teacherProfile.feePackages': 1,
        'teacherProfile.area': 1,
        'teacherProfile.mode': 1,
        'teacherProfile.bio': 1,
        'teacherProfile.profilePhoto': 1,
        'teacherProfile.averageRating': 1,
        'teacherProfile.totalRatings': 1,
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
router.get('/students', requireAdmin, async (req, res) => {
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
router.put('/:firebaseUid/teacher-profile', requireUser, requireSelf, upload.single('profilePhoto'), async (req, res) => {
  try {
    const existingUser = await User.findOne({ firebaseUid: req.params.firebaseUid });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (existingUser.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teacher accounts can edit a teacher profile.' });
    }
    const existingProfile = existingUser.teacherProfile || {};

    const { name, contactNumber, subjects, classLevels, qualification, experience, feePackages, area, mode, bio } = req.body;

    const fieldWithContact = findContactInfo({ Name: name, Qualification: qualification, Area: area, Bio: bio });
    if (fieldWithContact) {
      return res.status(400).json({
        error: `Please remove the phone number / contact details from "${fieldWithContact}". Students contact you only through Kota Tuition Hub.`,
      });
    }

    // Build profile object
    const profileData = {
      contactNumber: contactNumber || '',
      subjects: subjects ? (Array.isArray(subjects) ? subjects : JSON.parse(subjects)) : [],
      classLevels: classLevels ? (Array.isArray(classLevels) ? classLevels : JSON.parse(classLevels)) : [],
      qualification: qualification || '',
      experience: Number(experience) || 0,
      feePackages: feePackages ? (Array.isArray(feePackages) ? feePackages : JSON.parse(feePackages)) : (existingProfile.feePackages || []),
      area: area || '',
      mode: mode || 'offline',
      bio: bio || '',
      isProfileComplete: true,
      // Ratings are not editable by the teacher; carry them over so a profile edit doesn't wipe them
      reviews: existingProfile.reviews || [],
      averageRating: existingProfile.averageRating || 0,
      totalRatings: existingProfile.totalRatings || 0,
    };

    // If a new photo was uploaded, push it to Cloudinary and store the full HTTPS URL
    if (req.file) {
      if (!isCloudinaryConfigured()) {
        console.error('[PUT teacher-profile] Cloudinary env vars are missing; cannot store photo.');
        return res.status(500).json({ error: 'Photo storage is not configured. Please contact support.' });
      }
      profileData.profilePhoto = await uploadToCloudinary(req.file.buffer, req.params.firebaseUid);
    } else if (existingProfile.profilePhoto) {
      // Keep existing photo if editing without re-uploading
      profileData.profilePhoto = existingProfile.profilePhoto;
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

    console.log(`Teacher profile updated for: ${user.firebaseUid}`);
    res.json(user);
  } catch (err) {
    console.error('Teacher profile update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:firebaseUid/student-requirement - Update student requirement (JSON body)
// Must be defined BEFORE the generic GET /:firebaseUid route
router.put('/:firebaseUid/student-requirement', requireUser, requireSelf, async (req, res) => {
  try {
    const existingUser = await User.findOne({ firebaseUid: req.params.firebaseUid }, { role: 1 });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (existingUser.role !== 'student') {
      return res.status(403).json({ error: 'Only student accounts can post a tuition requirement.' });
    }

    const { name, contactNumber, subjects, classLevel, budgetPackages, area, additionalNotes, isGroupTuition, groupSize } = req.body;

    const groupFlag = !!isGroupTuition;
    const parsedGroupSize = groupFlag ? (Number(groupSize) === 3 ? 3 : 2) : 1;
    // Fee is computed here from the chosen package (group = 40% off per student), never trusted from the client
    const parsedPerStudentFee = perStudentFeeFor(Array.isArray(budgetPackages) ? budgetPackages[0] : null, groupFlag);

    const requirementData = {
      contactNumber: contactNumber || '',
      subjects: Array.isArray(subjects) ? subjects : [],
      classLevel: classLevel || '',
      budgetPackages: Array.isArray(budgetPackages) ? budgetPackages : [],
      area: area || '',
      mode: 'offline',
      additionalNotes: (additionalNotes || '').slice(0, 200),
      isGroupTuition: groupFlag,
      groupSize: parsedGroupSize,
      perStudentFee: parsedPerStudentFee,
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
      existingRequest.isGroupTuition = requirementData.isGroupTuition;
      existingRequest.groupSize = requirementData.groupSize;
      existingRequest.perStudentFee = requirementData.perStudentFee;
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
        status: 'pending',
        isGroupTuition: requirementData.isGroupTuition,
        groupSize: requirementData.groupSize,
        perStudentFee: requirementData.perStudentFee
      });
      console.log(`Created new general request for ${user.firebaseUid}`);
    }

    console.log(`Student requirement updated for: ${user.firebaseUid}`);
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

    // Return only public-facing fields (no contact number — students connect via the platform)
    const { contactNumber, ...publicProfile } = user.teacherProfile;
    res.json({
      firebaseUid: user.firebaseUid,
      name: user.name,
      teacherProfile: publicProfile,
    });
  } catch (err) {
    console.error('Fetch teacher profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/teachers/:firebaseUid/rate - Rate a teacher
// Only a student whose tuition with this teacher was converted can rate them.
router.post('/teachers/:firebaseUid/rate', requireUser, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const teacherUid = req.params.firebaseUid;
    const studentId = req.firebaseUid;

    if (!rating) {
      return res.status(400).json({ error: 'Rating is required.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    const convertedTuition = await TuitionRequest.exists({
      studentFirebaseUid: studentId,
      teacherFirebaseUid: teacherUid,
      demoStatus: 'converted',
    });
    if (!convertedTuition) {
      return res.status(403).json({ error: 'You can rate a teacher only after your tuition with them is confirmed.' });
    }

    const student = await User.findOne({ firebaseUid: studentId }, { name: 1 });
    const studentName = student?.name;

    const teacher = await User.findOne({ firebaseUid: teacherUid, role: 'teacher' });
    if (!teacher || !teacher.teacherProfile) {
      return res.status(404).json({ error: 'Teacher not found.' });
    }

    const reviews = teacher.teacherProfile.reviews || [];
    const existingReviewIndex = reviews.findIndex(r => r.studentId === studentId);

    const newReview = {
      studentId,
      studentName: studentName || 'Anonymous',
      rating: Number(rating),
      comment: comment || '',
      date: new Date()
    };

    if (existingReviewIndex >= 0) {
      // Overwrite existing review
      reviews[existingReviewIndex] = newReview;
    } else {
      // Add new review
      reviews.push(newReview);
    }

    // Recalculate average and total
    const totalRatings = reviews.length;
    const sumRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRatings > 0 ? (sumRatings / totalRatings).toFixed(1) : 0;

    teacher.teacherProfile.reviews = reviews;
    teacher.teacherProfile.totalRatings = totalRatings;
    teacher.teacherProfile.averageRating = Number(averageRating);

    await teacher.save();

    res.json({
      message: 'Rating submitted successfully',
      averageRating: teacher.teacherProfile.averageRating,
      totalRatings: teacher.teacherProfile.totalRatings,
      reviews: teacher.teacherProfile.reviews
    });

  } catch (err) {
    console.error('Rate teacher error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:firebaseUid - Fetch a user by firebaseUid
// This generic param route must come AFTER more-specific routes like /:firebaseUid/teacher-profile
router.get('/:firebaseUid', requireUserOrAdmin, requireSelf, async (req, res) => {
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
