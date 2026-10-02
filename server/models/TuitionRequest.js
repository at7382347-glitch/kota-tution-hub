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
  isGroupTuition: {
    type: Boolean,
    default: false,
  },
  groupSize: {
    type: Number,
    enum: [1, 2, 3],
    default: 1,
  },
  perStudentFee: {
    type: Number,
    default: null,
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
  // Lifecycle of a converted tuition: running → teacher gives 15-day notice → ended,
  // or the teacher leaves without notice (penalty + removal).
  tuitionStatus: {
    type: String,
    enum: ['active', 'notice', 'ended', 'left_without_notice'],
    default: 'active',
  },
  noticeGivenAt: { type: Date },
  noticeEndDate: { type: Date },
  noticeReason: { type: String, default: '' },
  noticeCancelledBy: { type: String, enum: ['', 'teacher', 'admin'], default: '' },
  // Set when the teacher leaves or is removed — admin must assign a replacement
  needsNewTeacher: { type: Boolean, default: false },
  teacherRemoved: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('TuitionRequest', tuitionRequestSchema);
