// Monthly fee per package (one student, 1 hr/day). Keep in sync with client/src/fees.js.
const PACKAGE_FEES = {
  'class-6': 7500,
  'class-7': 7500,
  'class-8': 8500,
  'class-9-board': 8500,
  'class-10-board': 10000,
  'class-11-board': 10000,
  'class-12-board': 10000,
  'class-9-10-jee-neet': 10000,
  'class-11-jee-neet': 12000,
  'class-12-jee-neet': 12000,
  'dropper-jee-neet': 12000,
};

// Group tuition (2–3 students): each student pays 40% less than the solo fee.
const GROUP_DISCOUNT = 0.4;

// Per-student monthly fee for a package, or null if the package is unknown.
function perStudentFeeFor(packageValue, isGroupTuition) {
  const fee = PACKAGE_FEES[packageValue];
  if (!fee) return null;
  return isGroupTuition ? Math.round(fee * (1 - GROUP_DISCOUNT)) : fee;
}

module.exports = { PACKAGE_FEES, GROUP_DISCOUNT, perStudentFeeFor };
