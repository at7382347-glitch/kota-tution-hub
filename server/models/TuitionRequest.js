const mongoose = require('mongoose');

const tuitionRequestSchema = new mongoose.Schema({
  studentFirebaseUid: {
    type: String,
    required: true,
  },
  studentName: {
    type: String,
    default: '',
  },
  studentContactNumber: {
    type: String,
    default: '',
  },
  teacherFirebaseUid: {
    type: String,
    default: '',
  },
  teacherName: {
    type: String,
    default: '',
  },
  teacherContactNumber: {
    type: String,
    default: '',
  },
  subject: {
    type: String,
    default: '',
  },
  area: {
    type: String,
    default: '',
  },
  classLevel: {
    type: String,
    default: '',
  },
  requestType: {
    type: String,
    enum: ['direct', 'general'],
    default: 'general',
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'closed'],
    default: 'pending',
  },
  demoDate: {
    type: Date,
  },
  demoStatus: {
    type: String,
    enum: ['not_scheduled', 'scheduled', 'completed', 'converted', 'not_converted'],
    default: 'not_scheduled',
  },
  demoNotes: {
    type: String,
    default: '',
  },
  teacherConfirmation: {
    type: String,
    enum: ["pending", "yes", "no"],
    default: "pending"
  },
  studentConfirmation: {
    type: String,
    enum: ["pending", "yes", "no"],
    default: "pending"
  },
  feeAmount: {
    type: Number,
    default: null
  },
  commissionAmount: {
    type: Number,
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid"],
    default: "unpaid"
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('TuitionRequest', tuitionRequestSchema);
