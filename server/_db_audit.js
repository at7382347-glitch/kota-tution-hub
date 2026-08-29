const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function audit() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();

  console.log('========================================');
  console.log('  DATABASE AUDIT: kota-tuition-hub.users');
  console.log('========================================\n');
  console.log('Total documents:', users.length);

  const teachers = users.filter(u => u.role === 'teacher');
  const students = users.filter(u => u.role === 'student');
  const completeTeachers = teachers.filter(u => u.teacherProfile && u.teacherProfile.isProfileComplete);
  const completeStudents = students.filter(u => u.studentRequirement && u.studentRequirement.isRequirementComplete);

  console.log('Teachers:', teachers.length, `(${completeTeachers.length} with complete profile)`);
  console.log('Students:', students.length, `(${completeStudents.length} with complete requirement)`);

  // ─── Show all documents ───
  users.forEach((u, i) => {
    console.log(`\n--- Document ${i + 1} ---`);
    console.log(JSON.stringify(u, null, 2));
  });

  // ─── Teacher Profile Field Check ───
  if (completeTeachers.length > 0) {
    const requiredFields = ['contactNumber', 'subjects', 'classLevels', 'feePackages', 'profilePhoto', 'qualification', 'experience', 'mode', 'bio', 'isProfileComplete'];
    console.log('\n========================================');
    console.log('  TEACHER PROFILE FIELD CHECK');
    console.log('========================================');
    completeTeachers.forEach((t, i) => {
      console.log(`\nTeacher ${i + 1}: ${t.name || t.phone}`);
      requiredFields.forEach(field => {
        const val = t.teacherProfile[field];
        const present = val !== undefined && val !== null;
        const display = typeof val === 'object' ? JSON.stringify(val) : String(val);
        console.log(`  ${present ? 'OK' : 'MISSING'}  ${field}: ${display}`);
      });
      const photo = t.teacherProfile.profilePhoto || '';
      console.log(`  Photo URL valid: ${photo.startsWith('/uploads/') ? 'YES' : 'NO/EMPTY'} (${photo || 'empty'})`);
    });
  }

  // ─── Student Requirement Field Check ───
  if (completeStudents.length > 0) {
    const requiredFields = ['contactNumber', 'subjects', 'classLevel', 'budgetPackages', 'area', 'mode', 'additionalNotes', 'isRequirementComplete'];
    console.log('\n========================================');
    console.log('  STUDENT REQUIREMENT FIELD CHECK');
    console.log('========================================');
    completeStudents.forEach((s, i) => {
      console.log(`\nStudent ${i + 1}: ${s.name || s.phone}`);
      requiredFields.forEach(field => {
        const val = s.studentRequirement[field];
        const present = val !== undefined && val !== null;
        const display = typeof val === 'object' ? JSON.stringify(val) : String(val);
        console.log(`  ${present ? 'OK' : 'MISSING'}  ${field}: ${display}`);
      });
    });
  }

  // ─── Data Isolation Check ───
  console.log('\n========================================');
  console.log('  DATA ISOLATION CHECK');
  console.log('========================================');

  teachers.forEach(t => {
    const hasStudentReq = !!t.studentRequirement;
    console.log(`\nTeacher "${t.name || t.phone}" (UID: ${t.firebaseUid}):`);
    console.log(`  Has teacherProfile: ${!!t.teacherProfile}`);
    console.log(`  Has studentRequirement: ${hasStudentReq} ${hasStudentReq ? '⚠️ UNEXPECTED!' : '✓ Clean'}`);
  });

  students.forEach(s => {
    const hasTeacherProfile = !!s.teacherProfile;
    console.log(`\nStudent "${s.name || s.phone}" (UID: ${s.firebaseUid}):`);
    console.log(`  Has studentRequirement: ${!!s.studentRequirement}`);
    console.log(`  Has teacherProfile: ${hasTeacherProfile} ${hasTeacherProfile ? '⚠️ UNEXPECTED!' : '✓ Clean'}`);
  });

  await mongoose.disconnect();
}

audit().catch(err => { console.error(err); process.exit(1); });
