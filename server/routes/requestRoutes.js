const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const TuitionRequest = require('../models/TuitionRequest');
const User = require('../models/User');
const { requireUser, requireAdmin, requireUserOrAdmin } = require('../middleware/auth');
const { perStudentFeeFor } = require('../config/fees');

const COMMISSION_RATE = 0.1; // Platform keeps 10%, teacher gets 90%

// Phone numbers are admin-only: students and teachers must never receive each other's
// (or any) contact number through a request, so strip them for non-admin callers.
function forViewer(req, requestDoc) {
  if (req.isAdmin) return requestDoc;
  const { studentContactNumber, teacherContactNumber, ...rest } =
    typeof requestDoc.toObject === 'function' ? requestDoc.toObject() : requestDoc;
  return rest;
}

// Rejects malformed :requestId values with 400 instead of a CastError 500
router.param('requestId', (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid request ID.' });
  }
  next();
});

// POST /api/requests - Student creates a tuition request for a teacher
router.post('/', requireUser, async (req, res) => {
  try {
    const { teacherFirebaseUid, subject, isGroupTuition, groupSize } = req.body;
    const studentFirebaseUid = req.firebaseUid;

    if (!teacherFirebaseUid || !subject) {
      return res.status(400).json({
        error: 'teacherFirebaseUid and subject are required.',
      });
    }

    // Look up student info
    const student = await User.findOne({ firebaseUid: studentFirebaseUid });
    if (!student || student.role !== 'student') {
      return res.status(403).json({ error: 'Only student accounts can send tuition requests.' });
    }

    // Look up teacher info
    const teacher = await User.findOne({ firebaseUid: teacherFirebaseUid, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found.' });
    }

    // Group tuition fields — prefer explicit payload, fall back to student's saved requirement (backward compatible)
    const groupFlag = isGroupTuition !== undefined
      ? !!isGroupTuition
      : !!student.studentRequirement?.isGroupTuition;
    const parsedGroupSize = groupFlag
      ? ([2, 3].includes(Number(groupSize)) ? Number(groupSize)
        : ([2, 3].includes(student.studentRequirement?.groupSize) ? student.studentRequirement.groupSize : 2))
      : 1;
    // Fee comes from the student's chosen package (group = 40% off per student), never from the client
    const parsedPerStudentFee =
      perStudentFeeFor(student.studentRequirement?.budgetPackages?.[0], groupFlag) ??
      student.studentRequirement?.perStudentFee ??
      null;

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
      isGroupTuition: groupFlag,
      groupSize: parsedGroupSize,
      perStudentFee: parsedPerStudentFee,
    });

    console.log(`[POST /requests] Request created: ${tuitionRequest._id} (${subject})`);

    res.status(201).json(forViewer(req, tuitionRequest));
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/requests - Admin gets all requests; a user gets only their own (newest first)
router.get('/', requireUserOrAdmin, async (req, res) => {
  try {
    const filter = req.isAdmin
      ? {}
      : { $or: [{ studentFirebaseUid: req.firebaseUid }, { teacherFirebaseUid: req.firebaseUid }] };
    const requests = await TuitionRequest.find(filter).sort({ createdAt: -1 }).lean();
    res.json(requests.map((r) => forViewer(req, r)));
  } catch (err) {
    console.error('Fetch requests error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/requests/:requestId - Update status or assign teacher of a request (Admin only)
router.put('/:requestId', requireAdmin, async (req, res) => {
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

// GET /api/requests/:requestId - Fetch a single tuition request (admin or a party to it)
router.get('/:requestId', requireUserOrAdmin, async (req, res) => {
  try {
    const request = await TuitionRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    const isParty = [request.studentFirebaseUid, request.teacherFirebaseUid].includes(req.firebaseUid);
    if (!req.isAdmin && !isParty) {
      return res.status(403).json({ error: 'You do not have access to this request.' });
    }
    res.json(forViewer(req, request));
  } catch (err) {
    console.error('Fetch request error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/requests/:requestId/confirm - Teacher or Student confirm tuition
// The confirmer's role is derived from the logged-in user, not trusted from the body.
router.put('/:requestId/confirm', requireUser, async (req, res) => {
  try {
    const { confirmation } = req.body;

    if (!['yes', 'no'].includes(confirmation)) {
      return res.status(400).json({ error: 'Invalid confirmation. Must be yes or no.' });
    }

    const request = await TuitionRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (req.firebaseUid === request.teacherFirebaseUid) {
      request.teacherConfirmation = confirmation;
    } else if (req.firebaseUid === request.studentFirebaseUid) {
      request.studentConfirmation = confirmation;
    } else {
      return res.status(403).json({ error: 'You are not part of this tuition request.' });
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
    res.json(forViewer(req, updatedRequest));
  } catch (err) {
    console.error('Confirm request error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/requests/:requestId/payment - Update fee, commission, and payment status (Admin only)
router.put('/:requestId/payment', requireAdmin, async (req, res) => {
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
        request.commissionAmount = Math.round(feeAmount * COMMISSION_RATE);
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
