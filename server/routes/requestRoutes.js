const express = require('express');
const router = express.Router();
const TuitionRequest = require('../models/TuitionRequest');
const User = require('../models/User');

// POST /api/requests - Create a new tuition request
router.post('/', async (req, res) => {
  try {
    const { studentFirebaseUid, teacherFirebaseUid, subject } = req.body;

    if (!studentFirebaseUid || !teacherFirebaseUid || !subject) {
      return res.status(400).json({
        error: 'studentFirebaseUid, teacherFirebaseUid, and subject are required.',
      });
    }

    // Look up student info
    const student = await User.findOne({ firebaseUid: studentFirebaseUid });
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    // Look up teacher info
    const teacher = await User.findOne({ firebaseUid: teacherFirebaseUid });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found.' });
    }

    // Build the request document
    const tuitionRequest = await TuitionRequest.create({
      studentFirebaseUid,
      studentName: student.name || '',
      studentContactNumber:
        student.studentRequirement?.contactNumber || student.phone || '',
      area: student.studentRequirement?.area || '',
      classLevel: student.studentRequirement?.classLevel || '',
      teacherFirebaseUid,
      teacherName: teacher.name || '',
      subject,
      requestType: 'direct',
    });

    console.log(
      `[POST /requests] Request created: ${student.name || studentFirebaseUid} → ${teacher.name || teacherFirebaseUid} (${subject})`
    );

    res.status(201).json(tuitionRequest);
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/requests - Fetch all tuition requests (newest first)
router.get('/', async (req, res) => {
  try {
    const requests = await TuitionRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error('Fetch requests error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/requests/:requestId - Update status or assign teacher of a request
router.put('/:requestId', async (req, res) => {
  try {
    const { status, teacherName, teacherContactNumber } = req.body;
    
    let updates = {};

    if (status) {
      if (!['pending', 'contacted', 'closed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      updates.status = status;
    }

    if (teacherName !== undefined) updates.teacherName = teacherName;
    if (teacherContactNumber !== undefined) updates.teacherContactNumber = teacherContactNumber;

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
    console.error('Update request error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/requests/:requestId - Fetch a single tuition request
router.get('/:requestId', async (req, res) => {
  try {
    const request = await TuitionRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json(request);
  } catch (err) {
    console.error('Fetch request error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/requests/:requestId/confirm - Teacher or Student confirm tuition
router.put('/:requestId/confirm', async (req, res) => {
  try {
    const { confirmerRole, confirmation } = req.body;
    
    if (!['teacher', 'student'].includes(confirmerRole)) {
      return res.status(400).json({ error: 'Invalid confirmerRole. Must be teacher or student.' });
    }
    if (!['yes', 'no'].includes(confirmation)) {
      return res.status(400).json({ error: 'Invalid confirmation. Must be yes or no.' });
    }

    const request = await TuitionRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (confirmerRole === 'teacher') {
      request.teacherConfirmation = confirmation;
    } else if (confirmerRole === 'student') {
      request.studentConfirmation = confirmation;
    }

    // Logic checks
    if (request.teacherConfirmation === 'yes' && request.studentConfirmation === 'yes') {
      request.demoStatus = 'converted';
      request.paymentStatus = 'unpaid';
    } else if (request.teacherConfirmation === 'no' && request.studentConfirmation === 'no') {
      request.demoStatus = 'not_converted';
    }
    // If one is yes and one is no, or if any is pending, leave demoStatus as is.

    const updatedRequest = await request.save();
    res.json(updatedRequest);
  } catch (err) {
    console.error('Confirm request error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/requests/:requestId/payment - Update fee, commission, and payment status (Admin only)
router.put('/:requestId/payment', async (req, res) => {
  try {
    const { feeAmount, commissionAmount, paymentStatus } = req.body;

    const request = await TuitionRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (feeAmount !== undefined) {
      request.feeAmount = feeAmount;
      if (commissionAmount !== undefined) {
        request.commissionAmount = commissionAmount;
      } else {
        request.commissionAmount = feeAmount * 0.2;
      }
    } else if (commissionAmount !== undefined) {
        request.commissionAmount = commissionAmount;
    }

    if (paymentStatus) {
      if (!['unpaid', 'paid'].includes(paymentStatus)) {
        return res.status(400).json({ error: 'Invalid paymentStatus' });
      }
      request.paymentStatus = paymentStatus;
    }

    const updatedRequest = await request.save();
    res.json(updatedRequest);
  } catch (err) {
    console.error('Update payment error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
