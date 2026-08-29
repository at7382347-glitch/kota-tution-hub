const express = require('express');
const router = express.Router();
const User = require('../models/User');
const TuitionRequest = require('../models/TuitionRequest');

// POST /api/admin/login - Simple password check
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'Server configuration error: ADMIN_PASSWORD not set.' });
  }
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password.' });
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

    // 2. Delete any associated tuition requests
    const deleteResult = await TuitionRequest.deleteMany({
      $or: [
        { studentFirebaseUid: firebaseUid },
        { teacherFirebaseUid: firebaseUid }
      ]
    });

    res.json({
      message: `User deleted, ${deleteResult.deletedCount} requests removed`,
      deletedRequestsCount: deleteResult.deletedCount
    });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
