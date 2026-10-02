import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { Helmet } from 'react-helmet-async';

import { apiFetch } from '../api';
import { FEE_PACKAGES, GROUP_DISCOUNT, formatINR, getPackage, groupFee, packageFullLabel, packageLabel } from '../fees';

const SUBJECT_OPTIONS = ['Physics', 'Chemistry', 'Maths', 'Biology', 'English'];
const CLASS_OPTIONS = ['6', '7', '8', '9', '10', '11', '12', 'Dropper'];
const initialForm = {
  name: '',
  contactNumber: '',
  subjects: [],
  classLevel: '',
  budgetPackages: [],
  area: '',
  mode: 'offline',
  additionalNotes: '',
  isGroupTuition: false,
  groupSize: 2,
};

function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Fetch user data on auth state change
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiFetch(`/api/users/${firebaseUser.uid}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          if (data.studentRequirement?.isRequirementComplete) {
            // Pre-fill form with saved data
            setForm({
              name: data.name || '',
              contactNumber: data.studentRequirement.contactNumber || '',
              subjects: data.studentRequirement.subjects || [],
              classLevel: data.studentRequirement.classLevel || '',
              budgetPackages: data.studentRequirement.budgetPackages || [],
              area: data.studentRequirement.area || '',
              mode: 'offline',
              additionalNotes: data.studentRequirement.additionalNotes || '',
              isGroupTuition: !!data.studentRequirement.isGroupTuition,
              groupSize: [2, 3].includes(data.studentRequirement.groupSize) ? data.studentRequirement.groupSize : 2,
            });
            setShowForm(false);
          } else {
            setShowForm(true);
          }
        }

        // Fetch requests for this student
        const reqsRes = await apiFetch(`/api/requests`);
        if (reqsRes.ok) {
          const reqsData = await reqsRes.json();
          const studentReqs = reqsData.filter((r) => r.studentFirebaseUid === firebaseUser.uid);
          setRequests(studentReqs);
        }
      } catch (err) {
        console.error('Failed to fetch user/requests:', err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Toggle checkboxes for subjects
  const handleSubjectToggle = (subject) => {
    setForm((prev) => {
      const arr = prev.subjects;
      return {
        ...prev,
        subjects: arr.includes(subject)
          ? arr.filter((s) => s !== subject)
          : [...arr, subject],
      };
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Group tuition calculator (derived, not stored)
  const selectedPackageValue = form.budgetPackages[0] || '';
  const baseFee = getPackage(selectedPackageValue)?.fee || 0;
  const perStudentFee = form.isGroupTuition ? groupFee(baseFee) : baseFee;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all required fields
    if (!form.name.trim()) {
      setMessage({ text: 'Please enter your full name.', type: 'error' });
      return;
    }
    if (!/^\d{10}$/.test(form.contactNumber)) {
      setMessage({ text: 'Please enter a valid 10-digit contact number.', type: 'error' });
      return;
    }
    if (form.subjects.length === 0) {
      setMessage({ text: 'Please select at least one subject.', type: 'error' });
      return;
    }
    if (!form.classLevel) {
      setMessage({ text: 'Please select your class level.', type: 'error' });
      return;
    }
    if (form.budgetPackages.length === 0) {
      setMessage({ text: 'Please select a fee package.', type: 'error' });
      return;
    }
    if (!form.area.trim()) {
      setMessage({ text: 'Please enter your area in Kota.', type: 'error' });
      return;
    }

    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const firebaseUid = auth.currentUser?.uid;
      if (!firebaseUid) {
        setMessage({ text: 'Not authenticated. Please log in again.', type: 'error' });
        setSaving(false);
        return;
      }


      const res = await apiFetch(`/api/users/${firebaseUid}/student-requirement`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          contactNumber: form.contactNumber,
          subjects: form.subjects,
          classLevel: form.classLevel,
          budgetPackages: form.budgetPackages,
          area: form.area,
          mode: 'offline',
          additionalNotes: form.additionalNotes,
          isGroupTuition: !!form.isGroupTuition,
          groupSize: form.isGroupTuition ? (Number(form.groupSize) === 3 ? 3 : 2) : 1,
        }),
      });


      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setShowForm(false);
        setMessage({ text: 'Requirement saved successfully!', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
      } else {
        const errData = await res.json();
        console.error('[StudentDashboard] Server error:', errData);
        setMessage({ text: `Error: ${errData.error || 'Failed to save'}`, type: 'error' });
      }
    } catch (err) {
      console.error('[StudentDashboard] Network error:', err);
      setMessage({ text: 'Network error. Please check your connection and try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Student confirmation handler (mirrors TeacherDashboard)
  const handleConfirm = async (requestId, confirmationVal) => {
    try {
      const res = await apiFetch(`/api/requests/${requestId}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmerRole: 'student', confirmation: confirmationVal }),
      });
      if (res.ok) {
        const updatedReq = await res.json();
        setRequests((prev) => prev.map((r) => (r._id === requestId ? updatedReq : r)));
      } else {
        const errData = await res.json();
        alert(`Failed to confirm: ${errData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Confirm error:', err);
      alert('Network error while confirming');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sandstone">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-marigold border-t-transparent"></div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sandstone">
        <p className="font-body text-ink/60 text-lg">Please log in to access the Student Dashboard.</p>
      </div>
    );
  }

  if (user.role !== 'student') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-sandstone px-4 text-center gap-3">
        <p className="font-body text-ink/60 text-lg">This dashboard is for student accounts only.</p>
        <Link to="/teacher/dashboard" className="font-body text-marigold font-semibold hover:text-marigold/80">
          Go to Teacher Dashboard →
        </Link>
      </div>
    );
  }

  const req = user.studentRequirement;
  const isComplete = req?.isRequirementComplete;

  return (
    <div className="min-h-screen bg-sandstone py-8 px-4 overflow-x-hidden">
      <Helmet>
        <meta name="robots" content="noindex" />
      </Helmet>
      <main className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-ink text-2xl sm:text-3xl font-bold">Student Dashboard</h1>
          <p className="font-body text-ink/50 mt-1">Welcome, {user.name || 'Student'}!</p>
        </div>

        {/* Message banner */}
        {message.text && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium font-body ${
            message.type === 'error' ? 'bg-maroon/10 text-maroon' : 'bg-sage/10 text-sage'
          }`}>
            {message.text}
          </div>
        )}

        {/* ─── Requirement Summary ─── */}
        {isComplete && !showForm && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-ink/8 p-5 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-ink text-lg sm:text-xl font-semibold">Your Requirement</h2>
              <button
                onClick={() => setShowForm(true)}
                className="text-sm font-medium text-marigold hover:text-marigold/80 cursor-pointer font-body"
              >
                Edit Requirement
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {/* Contact Number */}
              <div className="sm:col-span-2">
                <p className="font-display text-ink/40 text-xs uppercase tracking-wide mb-0.5">Contact Number</p>
                <p className="font-mono text-ink font-medium">{req.contactNumber || '—'}</p>
              </div>

              {/* Subjects */}
              <div className="sm:col-span-2">
                <p className="font-display text-ink/40 text-xs uppercase tracking-wide mb-1">Subjects Needed</p>
                <div className="flex flex-wrap gap-1.5">
                  {(req.subjects || []).map((sub) => (
                    <span key={sub} className="inline-block bg-marigold/10 text-marigold text-xs px-2 py-1 rounded-full font-body font-medium">
                      {sub}
                    </span>
                  ))}
                  {(!req.subjects || req.subjects.length === 0) && <span className="text-ink/30">—</span>}
                </div>
              </div>

              <SummaryField label="Class Level" value={req.classLevel === 'Dropper' ? 'Dropper' : `Class ${req.classLevel}`} />
              <SummaryField label="Area in Kota" value={req.area} />
              <SummaryField label="Mode" value="Offline Only" />

              {/* Fee Packages */}
              <div className="sm:col-span-2">
                <p className="font-display text-ink/40 text-xs uppercase tracking-wide mb-1">Fee Packages</p>
                <div className="flex flex-wrap gap-1.5">
                  {(req.budgetPackages || []).map((pkg) => {
                    const label = packageLabel(pkg);
                    return (
                      <span key={pkg} className="inline-block bg-marigold/10 text-marigold text-xs px-2 py-1 rounded-full font-mono font-medium">
                        {label}
                      </span>
                    );
                  })}
                  {(!req.budgetPackages || req.budgetPackages.length === 0) && <span className="text-ink/30">—</span>}
                </div>
              </div>

              {/* Tuition Type */}
              <div className="sm:col-span-2">
                <p className="font-display text-ink/40 text-xs uppercase tracking-wide mb-1">Tuition Type</p>
                {req.isGroupTuition ? (
                  <span className="inline-block bg-sage/15 text-sage text-xs px-2.5 py-1 rounded-full font-body font-semibold">
                    Group Tuition ({req.groupSize || 2} Students)
                    {req.perStudentFee ? ` - ₹${Number(req.perStudentFee).toLocaleString('en-IN')}/student` : ''}
                  </span>
                ) : (
                  <span className="inline-block bg-ink/8 text-ink/60 text-xs px-2.5 py-1 rounded-full font-body font-medium">
                    Solo Tuition
                  </span>
                )}
              </div>

              {req.additionalNotes && (
                <div className="sm:col-span-2">
                  <SummaryField label="Additional Notes" value={req.additionalNotes} />
                </div>
              )}
            </div>

            {/* Browse Teachers link */}
            <div className="mt-6 pt-4 border-t border-ink/8 flex justify-center sm:block">
              <Link
                to="/browse-teachers"
                className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-5 py-3 sm:py-2.5 bg-marigold text-ink text-sm font-semibold rounded-lg hover:bg-marigold/90 transition-colors font-body shadow-sm shadow-marigold/20"
              >
                Browse Teachers
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* ─── My Requests ─── */}
        {isComplete && !showForm && requests.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-ink/8 p-5 sm:p-8 mt-6">
            <h2 className="font-display text-ink text-lg sm:text-xl font-semibold mb-6">My Requests</h2>
            <div className="space-y-4">
              {requests.map((r) => (
                <div key={r._id} className="border border-ink/8 rounded-xl p-5 bg-sandstone/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SummaryField label="Teacher" value={r.teacherName || 'Not assigned'} />
                    <SummaryField label="Subject" value={r.subject || 'N/A'} />

                    <div>
                      <p className="font-display text-ink/40 text-xs uppercase tracking-wide mb-0.5">Status</p>
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize mt-1 font-body
                        ${r.status === 'pending' ? 'bg-marigold/15 text-marigold' : ''}
                        ${r.status === 'contacted' ? 'bg-blue-100 text-blue-800' : ''}
                        ${r.status === 'closed' ? 'bg-ink/10 text-ink/60' : ''}
                        ${!r.status ? 'bg-marigold/15 text-marigold' : ''}
                      `}>
                        {r.status || 'pending'}
                      </span>
                    </div>

                    <div>
                      <p className="font-display text-ink/40 text-xs uppercase tracking-wide mb-0.5">Demo Status</p>
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mt-1 font-body
                        ${r.demoStatus === 'scheduled' ? 'bg-blue-100 text-blue-800' : ''}
                        ${r.demoStatus === 'completed' ? 'bg-marigold/15 text-marigold' : ''}
                        ${r.demoStatus === 'converted' ? 'bg-sage/15 text-sage' : ''}
                        ${r.demoStatus === 'not_converted' ? 'bg-maroon/10 text-maroon' : ''}
                        ${!r.demoStatus || r.demoStatus === 'not_scheduled' ? 'bg-ink/8 text-ink/50' : ''}
                      `}>
                        {r.demoStatus ? r.demoStatus.replace('_', ' ').toUpperCase() : 'NOT SCHEDULED'}
                      </span>
                    </div>
                  </div>

                  {/* Tutor is leaving (notice) or has left — reassure the family */}
                  {r.tuitionStatus === 'notice' && (
                    <div className="mt-4 rounded-lg border border-marigold/40 bg-marigold/10 p-4">
                      <p className="font-body text-sm text-ink">
                        Your tutor has given notice. Their last class is on{' '}
                        <span className="font-semibold">
                          {new Date(r.noticeEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        .
                      </p>
                      <p className="font-body text-xs text-ink/60 mt-1">
                        Don’t worry — our team is already finding a new tutor for you, so classes continue without a gap.
                      </p>
                    </div>
                  )}
                  {(r.tuitionStatus === 'left_without_notice' || (r.teacherRemoved && r.needsNewTeacher)) && (
                    <div className="mt-4 rounded-lg border border-maroon/30 bg-maroon/5 p-4">
                      <p className="font-body text-sm text-ink">This tutor is no longer with Nexved.</p>
                      <p className="font-body text-xs text-ink/60 mt-1">
                        Our team will contact you shortly to arrange a new tutor.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Completed Demos — Student Confirmation Cards ─── */}
        {isComplete && !showForm && requests.filter((r) => r.demoStatus === 'completed').length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-ink/8 p-5 sm:p-8 mt-6">
            <h2 className="font-display text-ink text-lg sm:text-xl font-semibold mb-6">Completed Demos</h2>
            <div className="space-y-4">
              {requests
                .filter((r) => r.demoStatus === 'completed')
                .map((r) => (
                  <div key={r._id} className="border border-ink/8 rounded-xl p-5 bg-sandstone/50">
                    <div className="mb-4">
                      <p className="font-body text-sm font-medium text-ink">Teacher: {r.teacherName || 'Unknown'}</p>
                      <p className="font-body text-xs text-ink/50 mt-1">Subject: {r.subject || 'N/A'}</p>
                    </div>

                    {r.studentConfirmation === 'yes' || r.studentConfirmation === 'no' ? (
                      <div
                        className={`text-sm font-medium px-4 py-2 rounded-lg inline-flex items-center gap-2 font-body ${
                          r.studentConfirmation === 'yes'
                            ? 'bg-sage/15 text-sage'
                            : 'bg-maroon/10 text-maroon'
                        }`}
                      >
                        You confirmed: {r.studentConfirmation === 'yes' ? 'Yes ✓' : 'No ✗'}
                      </div>
                    ) : (
                      <div className="bg-white p-4 rounded-lg border border-ink/10 shadow-sm">
                        <p className="font-body text-sm text-ink mb-3 font-medium">
                          Did you decide to continue with this tuition?
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() => handleConfirm(r._id, 'yes')}
                            className="flex-1 px-5 py-3 sm:py-2 bg-sage text-white text-sm font-medium rounded-lg hover:bg-sage/90 transition-colors cursor-pointer font-body"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => handleConfirm(r._id, 'no')}
                            className="flex-1 px-5 py-3 sm:py-2 bg-maroon text-white text-sm font-medium rounded-lg hover:bg-maroon/90 transition-colors cursor-pointer font-body"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ─── Requirement Form ─── */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-ink/8 p-5 sm:p-8 space-y-6">
            <h2 className="font-display text-ink text-lg sm:text-xl font-semibold">
              {isComplete ? 'Edit Your Requirement' : 'Tell Us What You Need'}
            </h2>

            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-ink/70 mb-1 font-body">
                Full Name <span className="text-maroon">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Priya Sharma"
                className="w-full rounded-lg border border-ink/15 px-3 py-3 sm:py-2 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-marigold focus:border-transparent"
              />
            </div>

            {/* Contact Number */}
            <div>
              <label htmlFor="contactNumber" className="block text-sm font-medium text-ink/70 mb-1 font-body">
                Contact Number <span className="text-maroon">*</span>
              </label>
              <input
                id="contactNumber"
                name="contactNumber"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.contactNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setForm((prev) => ({ ...prev, contactNumber: val }));
                }}
                placeholder="e.g. 9876543210"
                className="w-full rounded-lg border border-ink/15 px-3 py-3 sm:py-2 text-sm font-mono text-ink focus:outline-none focus:ring-2 focus:ring-marigold focus:border-transparent"
              />
              {form.contactNumber && form.contactNumber.length !== 10 && (
                <p className="text-xs text-marigold mt-1 font-body">{form.contactNumber.length}/10 digits</p>
              )}
            </div>

            {/* Subjects (checkboxes as pill toggles) */}
            <fieldset>
              <legend className="text-sm font-medium text-ink/70 mb-2 font-body">
                Subjects Needed <span className="text-maroon">*</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_OPTIONS.map((sub) => (
                  <label
                    key={sub}
                    className={`px-4 py-2 sm:px-3 sm:py-1.5 rounded-full border text-sm cursor-pointer select-none transition-all duration-200 font-body ${
                      form.subjects.includes(sub)
                        ? 'bg-marigold text-ink border-marigold shadow-sm shadow-marigold/20'
                        : 'bg-white text-ink/60 border-ink/15 hover:border-marigold/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={form.subjects.includes(sub)}
                      onChange={() => handleSubjectToggle(sub)}
                    />
                    {sub}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Class Level (radio buttons as pills) */}
            <fieldset>
              <legend className="text-sm font-medium text-ink/70 mb-2 font-body">
                Class Level <span className="text-maroon">*</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {CLASS_OPTIONS.map((cls) => (
                  <label
                    key={cls}
                    className={`px-4 py-2 sm:px-3 sm:py-1.5 rounded-full border text-sm cursor-pointer select-none transition-all duration-200 font-body ${
                      form.classLevel === cls
                        ? 'bg-marigold text-ink border-marigold shadow-sm shadow-marigold/20'
                        : 'bg-white text-ink/60 border-ink/15 hover:border-marigold/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="classLevel"
                      className="hidden"
                      value={cls}
                      checked={form.classLevel === cls}
                      onChange={handleChange}
                    />
                    {cls}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Fee Package (single select dropdown) */}
            <div>
              <label htmlFor="budgetPackage" className="block text-sm font-medium text-ink/70 mb-1 font-body">
                Select Fee Package <span className="text-maroon">*</span>
              </label>
              <div className="relative">
                <select
                  id="budgetPackage"
                  name="budgetPackage"
                  value={form.budgetPackages[0] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      budgetPackages: val ? [val] : [],
                    }));
                  }}
                  className="w-full appearance-none rounded-lg border border-ink/15 bg-white px-3 py-3 sm:py-2 pr-10 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-marigold focus:border-transparent"
                >
                  <option value="">Select Fee Package</option>
                  {FEE_PACKAGES.map((pkg) => (
                    <option key={pkg.value} value={pkg.value}>
                      {packageFullLabel(pkg)}
                    </option>
                  ))}
                </select>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Group Tuition / Split Fee */}
            <div className="rounded-xl border border-ink/10 bg-sandstone/50 p-4 sm:p-5">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!form.isGroupTuition}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, isGroupTuition: e.target.checked }))
                  }
                  className="mt-1 h-4 w-4 shrink-0 accent-[#b8860b] cursor-pointer"
                />
                <span>
                  <span className="block text-sm font-semibold text-ink font-body">
                    Group Tuition — {Math.round(GROUP_DISCOUNT * 100)}% off for each student
                  </span>
                  <span className="mt-0.5 block text-xs text-ink/50 font-body">
                    Study with 1 or 2 friends or siblings (maximum 3 students) with one tutor. Each student pays {Math.round(GROUP_DISCOUNT * 100)}% less.
                  </span>
                </span>
              </label>

              {form.isGroupTuition && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="groupSize" className="block text-xs font-medium text-ink/70 mb-1 font-body">
                      Group Size
                    </label>
                    <div className="relative">
                      <select
                        id="groupSize"
                        name="groupSize"
                        value={String(form.groupSize)}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, groupSize: Number(e.target.value) }))
                        }
                        className="w-full appearance-none rounded-lg border border-ink/15 bg-white px-3 py-3 sm:py-2 pr-10 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-marigold focus:border-transparent"
                      >
                        <option value="2">2 Students</option>
                        <option value="3">3 Students</option>
                      </select>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center rounded-lg border border-marigold/30 bg-marigold/10 px-3 py-3 sm:py-2">
                    {baseFee ? (
                      <p className="text-xs sm:text-sm font-body text-ink">
                        <span className="font-mono text-ink/50 line-through">{formatINR(baseFee)}</span>
                        <span className="text-ink/50"> → </span>
                        <span className="font-mono font-bold text-marigold">{formatINR(perStudentFee)}/month per student</span>
                      </p>
                    ) : (
                      <p className="text-xs font-body text-ink/50">
                        Select a fee package above to see the group fee.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Area */}
            <div>
              <label htmlFor="area" className="block text-sm font-medium text-ink/70 mb-1 font-body">Area in Kota <span className="text-maroon">*</span></label>
              <input
                id="area"
                name="area"
                type="text"
                value={form.area}
                onChange={handleChange}
                placeholder="e.g. Talwandi, Kota"
                className="w-full rounded-lg border border-ink/15 px-3 py-3 sm:py-2 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-marigold focus:border-transparent"
              />
            </div>

            {/* Mode (fixed — Offline Only) */}
            <div>
              <p className="text-sm font-medium text-ink/70 mb-1 font-body">Preferred Mode</p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-marigold/10 border border-marigold/30 text-sm text-marigold font-body">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Offline Only
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label htmlFor="additionalNotes" className="block text-sm font-medium text-ink/70 mb-1 font-body">
                Additional Notes <span className="text-ink/30 text-xs">({form.additionalNotes.length}/200)</span>
              </label>
              <textarea
                id="additionalNotes"
                name="additionalNotes"
                maxLength={200}
                rows={3}
                value={form.additionalNotes}
                onChange={handleChange}
                placeholder="Any specific needs, preferred timings, etc."
                className="w-full rounded-lg border border-ink/15 px-3 py-3 sm:py-2 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-marigold focus:border-transparent resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-3.5 sm:py-2.5 bg-marigold text-ink text-sm font-semibold rounded-lg hover:bg-marigold/90 disabled:opacity-50 transition-colors cursor-pointer font-body shadow-sm shadow-marigold/20 min-h-[44px]"
              >
                {saving ? 'Saving...' : 'Save Requirement'}
              </button>
              {isComplete && (
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="w-full sm:w-auto px-6 py-3.5 sm:py-2.5 bg-ink/10 text-ink text-sm font-medium rounded-lg hover:bg-ink/15 transition-colors cursor-pointer font-body min-h-[44px]"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

function SummaryField({ label, value }) {
  return (
    <div>
      <p className="font-display text-ink/40 text-xs uppercase tracking-wide mb-0.5">{label}</p>
      <p className="font-body text-ink font-medium capitalize">{value || '—'}</p>
    </div>
  );
}

export default StudentDashboard;
