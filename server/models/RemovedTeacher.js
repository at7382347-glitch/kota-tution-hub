const mongoose = require('mongoose');

// Record kept after a teacher's account is deleted for leaving without notice.
// Used for the penalty and to block the same person from registering again.
const removedTeacherSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, index: true },
  name: { type: String, default: '' },
  email: { type: String, default: '', index: true },
  phone: { type: String, default: '' },
  contactNumber: { type: String, default: '' },
  reason: { type: String, default: '' },
  requestId: { type: String, default: '' },
  penaltyAmount: { type: Number, default: 5000 },
  penaltyStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  removedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('RemovedTeacher', removedTeacherSchema);
