const mongoose = require('mongoose');

const teacherProfileSchema = new mongoose.Schema({
  contactNumber: {
    type: String,
    default: '',
  },
  subjects: {
    type: [String],
    default: [],
  },
  classLevels: {
    type: [String],
    default: [],
  },
  qualification: {
    type: String,
    default: '',
  },
  experience: {
    type: Number,
    default: 0,
  },
  feePackages: {
    type: [String],
    default: [],
  },
  area: {
    type: String,
    default: '',
  },
  mode: {
    type: String,
    enum: ['offline', 'both'],
    default: 'offline',
  },
  bio: {
    type: String,
    default: '',
  },
  profilePhoto: {
    type: String,
    default: '',
  },
  isProfileComplete: {
    type: Boolean,
    default: false,
  },
  reviews: [
    {
      studentId: String,
      studentName: String,
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: String,
      date: { type: Date, default: Date.now },
    },
  ],
  averageRating: {
    type: Number,
    default: 0,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const studentRequirementSchema = new mongoose.Schema({
  contactNumber: {
    type: String,
    default: '',
  },
  subjects: {
    type: [String],
    default: [],
  },
  classLevel: {
    type: String,
    default: '',
  },
  budgetPackages: {
    type: [String],
    default: [],
  },
  area: {
    type: String,
    default: '',
  },
  mode: {
    type: String,
    enum: ['offline'],
    default: 'offline',
  },
  additionalNotes: {
    type: String,
    default: '',
  },
  isRequirementComplete: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  photoURL: {
    type: String,
  },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    required: true,
  },
  teacherProfile: {
    type: teacherProfileSchema,
    default: undefined,
  },
  studentRequirement: {
    type: studentRequirementSchema,
    default: undefined,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
