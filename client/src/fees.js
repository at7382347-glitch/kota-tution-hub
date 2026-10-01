// Single source of truth for tuition fees shown anywhere on the site.
// Keep in sync with server/config/fees.js (the server recomputes group fees).

export const FEE_GROUPS = [
  { id: 'foundation', name: 'Foundation', classes: 'Class 6 – 8', note: 'Strong basics in every subject.' },
  { id: 'board', name: 'School / Board', classes: 'Class 9 – 12', note: 'School and board exam preparation.' },
  { id: 'jee-neet', name: 'JEE / NEET', classes: 'Class 9 – 12 & Droppers', note: 'Competitive exam coaching at home.' },
];

// Monthly fee for one student, one hour a day, at home.
export const FEE_PACKAGES = [
  { value: 'class-6', group: 'foundation', label: 'Class 6', fee: 7500 },
  { value: 'class-7', group: 'foundation', label: 'Class 7', fee: 7500 },
  { value: 'class-8', group: 'foundation', label: 'Class 8', fee: 8500 },
  { value: 'class-9-board', group: 'board', label: 'Class 9', fee: 8500 },
  { value: 'class-10-board', group: 'board', label: 'Class 10', fee: 10000 },
  { value: 'class-11-board', group: 'board', label: 'Class 11', fee: 10000 },
  { value: 'class-12-board', group: 'board', label: 'Class 12', fee: 10000 },
  { value: 'class-9-10-jee-neet', group: 'jee-neet', label: 'Class 9 & 10 (Foundation)', fee: 10000 },
  { value: 'class-11-jee-neet', group: 'jee-neet', label: 'Class 11', fee: 12000 },
  { value: 'class-12-jee-neet', group: 'jee-neet', label: 'Class 12', fee: 12000 },
  { value: 'dropper-jee-neet', group: 'jee-neet', label: 'Dropper', fee: 12000 },
];

// Group tuition: 2 or 3 students with one tutor; each student pays 40% less.
export const GROUP_DISCOUNT = 0.4;
export const GROUP_SIZES = [2, 3];

export function groupFee(fee) {
  return Math.round(fee * (1 - GROUP_DISCOUNT));
}

export function formatINR(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

export function getPackage(value) {
  return FEE_PACKAGES.find((p) => p.value === value) || null;
}

// Full label, e.g. "Class 11 (JEE / NEET) — ₹12,000/month"
export function packageFullLabel(pkg) {
  const group = FEE_GROUPS.find((g) => g.id === pkg.group);
  const track = pkg.group === 'foundation' ? '' : ` (${group.name})`;
  return `${pkg.label}${track} — ${formatINR(pkg.fee)}/month`;
}

// Hour-based packages from the old pricing model, still present on some saved profiles.
const LEGACY_LABELS = {
  '1hr-10000': '1 hr/day — ₹10,000/mo (old)',
  '1.5hr-15000': '1.5 hr/day — ₹15,000/mo (old)',
  '2hr-20000': '2 hr/day — ₹20,000/mo (old)',
  '1hr-5000': '1 hr/day — ₹5,000/mo (old)',
  '1.5hr-8000': '1.5 hr/day — ₹8,000/mo (old)',
  '2hr-10000': '2 hr/day — ₹10,000/mo (old)',
};

// Readable label for any saved package value (current or legacy)
export function packageLabel(value) {
  const pkg = getPackage(value);
  if (pkg) return packageFullLabel(pkg);
  return LEGACY_LABELS[value] || value;
}
