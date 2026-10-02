const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const User = require('../models/User');
const mongoose = require('mongoose');
const TuitionRequest = require('../models/TuitionRequest');
const RemovedTeacher = require('../models/RemovedTeacher');
const { requireAdmin, signAdminToken } = require('../middleware/auth');

// Max 10 login attempts per IP every 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
});

// Constant-time string comparison to avoid timing attacks
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

// POST /api/admin/login - Check password and issue a signed admin token
router.post('/login', loginLimiter, (req, res) => {
  const { password } = req.body;
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_JWT_SECRET) {
    return res.status(500).json({ error: 'Server configuration error: ADMIN_PASSWORD or ADMIN_JWT_SECRET not set.' });
  }
  if (password && safeEqual(password, process.env.ADMIN_PASSWORD)) {
    res.json({ success: true, token: signAdminToken() });
  } else {
    res.status(401).json({ error: 'Invalid password.' });
  }
});

// Every admin route below requires a valid admin token
router.use(requireAdmin);

// GET /api/admin/teachers - Complete teacher profiles, including contact numbers
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await User.find(
      { role: 'teacher', 'teacherProfile.isProfileComplete': true },
      { firebaseUid: 1, name: 1, email: 1, phone: 1, teacherProfile: 1 }
    ).lean();
    res.json(teachers);
  } catch (err) {
    console.error('Admin fetch teachers error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/stats - Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Basic counts
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalRequests = await TuitionRequest.countDocuments();
    
    // Status counts
    const pendingRequests = await TuitionRequest.countDocuments({ status: 'pending' });
    const contactedRequests = await TuitionRequest.countDocuments({ status: 'contacted' });
    const closedRequests = await TuitionRequest.countDocuments({ status: 'closed' });

    // Demo counts
    const demosScheduled = await TuitionRequest.countDocuments({ demoStatus: 'scheduled' });
    const demosConverted = await TuitionRequest.countDocuments({ demoStatus: 'converted' });

    res.json({
      totalTeachers,
      totalStudents,
      totalRequests,
      statusCounts: {
        pending: pendingRequests,
        contacted: contactedRequests,
        closed: closedRequests,
      },
      demoCounts: {
        scheduled: demosScheduled,
        converted: demosConverted,
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/requests/:requestId/demo - Update demo tracking fields
router.put('/requests/:requestId/demo', async (req, res) => {
  try {
    const { demoDate, demoStatus, demoNotes } = req.body;
    let updates = {};

    if (demoDate !== undefined) updates.demoDate = demoDate;
    if (demoNotes !== undefined) updates.demoNotes = demoNotes;
    if (demoStatus !== undefined) {
      if (!['not_scheduled', 'scheduled', 'completed', 'converted', 'not_converted'].includes(demoStatus)) {
        return res.status(400).json({ error: 'Invalid demoStatus' });
      }
      updates.demoStatus = demoStatus;
    }

    const updatedRequest = await TuitionRequest.findByIdAndUpdate(
      req.params.requestId,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(updatedRequest);
  } catch (err) {
    console.error('Update demo error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:firebaseUid - Delete a user and their associated requests
router.delete('/users/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    // 1. Delete the user
    const deletedUser = await User.findOneAndDelete({ firebaseUid });
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. A student's requests go with them. A teacher's requests stay (they belong to the
    //    students too) — they are flagged so the admin can assign a new teacher.
    if (deletedUser.role === 'teacher') {
      const result = await markTeacherRemoved(firebaseUid);
      return res.json({
        message: `Teacher deleted, ${result.modifiedCount} request(s) marked for a new teacher`,
        deletedRequestsCount: 0,
      });
    }

    const deleteResult = await TuitionRequest.deleteMany({ studentFirebaseUid: firebaseUid });
    res.json({
      message: `User deleted, ${deleteResult.deletedCount} requests removed`,
      deletedRequestsCount: deleteResult.deletedCount
    });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Flags every request of a removed teacher; running tuitions need a replacement.
async function markTeacherRemoved(teacherFirebaseUid) {
  const all = await TuitionRequest.updateMany({ teacherFirebaseUid }, { teacherRemoved: true });
  await TuitionRequest.updateMany(
    { teacherFirebaseUid, $or: [{ demoStatus: 'converted' }, { status: 'pending' }] },
    { needsNewTeacher: true }
  );
  return all;
}

// POST /api/admin/teachers/:firebaseUid/left-without-notice
// Teacher abandoned a tuition: record the ₹5,000 penalty, delete the account, block re-registration.
const PENALTY_AMOUNT = 5000;

router.post('/teachers/:firebaseUid/left-without-notice', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { requestId = '', reason = '' } = req.body;

    const teacher = await User.findOne({ firebaseUid, role: 'teacher' }).lean();
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const record = await RemovedTeacher.create({
      firebaseUid,
      name: teacher.name || '',
      email: (teacher.email || '').toLowerCase(),
      phone: teacher.phone || '',
      contactNumber: teacher.teacherProfile?.contactNumber || '',
      reason: String(reason).slice(0, 300) || 'Left tuition without 15-day notice',
      requestId: String(requestId),
      penaltyAmount: PENALTY_AMOUNT,
    });

    if (requestId && mongoose.isValidObjectId(requestId)) {
      await TuitionRequest.updateOne(
        { _id: requestId, teacherFirebaseUid: firebaseUid },
        { tuitionStatus: 'left_without_notice' }
      );
    }
    const flagged = await markTeacherRemoved(firebaseUid);
    await User.deleteOne({ firebaseUid });

    console.log(`[admin] Teacher ${firebaseUid} removed for leaving without notice; penalty ₹${PENALTY_AMOUNT}`);
    res.json({
      message: `Teacher removed. ₹${PENALTY_AMOUNT} penalty recorded, ${flagged.modifiedCount} request(s) need a new teacher.`,
      removedTeacher: record,
    });
  } catch (err) {
    console.error('Left-without-notice error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/removed-teachers - Removed teachers and their penalties (newest first)
router.get('/removed-teachers', async (req, res) => {
  try {
    res.json(await RemovedTeacher.find().sort({ removedAt: -1 }).lean());
  } catch (err) {
    console.error('Fetch removed teachers error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/removed-teachers/:id/penalty - Mark the penalty paid / unpaid
router.put('/removed-teachers/:id/penalty', async (req, res) => {
  try {
    const { penaltyStatus } = req.body;
    if (!['paid', 'unpaid'].includes(penaltyStatus)) {
      return res.status(400).json({ error: 'penaltyStatus must be paid or unpaid' });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const record = await RemovedTeacher.findByIdAndUpdate(req.params.id, { penaltyStatus }, { new: true });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (err) {
    console.error('Update penalty error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
