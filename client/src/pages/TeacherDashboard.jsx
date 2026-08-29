import { useState, useEffect, useCallback } from 'react';
import { auth } from '../firebase';
import { Helmet } from 'react-helmet-async';

const API_BASE = import.meta.env.VITE_API_URL;

const SUBJECT_OPTIONS = ['Physics', 'Chemistry', 'Maths', 'Biology', 'English'];
const CLASS_OPTIONS = ['6', '7', '8', '9', '10', '11', '12', 'Dropper'];
const MODE_OPTIONS = ['offline', 'both'];

const FEE_PACKAGES = [
  { id: '1hr-10000', label: '1 hour - ₹10000/month' },
  { id: '1.5hr-15000', label: '1.5 hours - ₹15000/month' },
  { id: '2hr-20000', label: '2 hours - ₹20000/month' },
];

const initialForm = {
  name: '',
  contactNumber: '',
  subjects: [],
  classLevels: [],
  qualification: '',
  experience: '',
  feePackages: [],
  area: '',
  mode: 'offline',
  bio: '',
};

function TeacherDashboard() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [requests, setRequests] = useState([]);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [viewedIds, setViewedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('teacherViewedRequests') || '[]');
    } catch {
      return [];
    }
  });

  // Compute unread count
  const unreadCount = requests.filter((r) => !viewedIds.includes(r._id)).length;

  // Mark all current requests as viewed
  const markAllViewed = useCallback(() => {
    const allIds = requests.map((r) => r._id);
    setViewedIds((prev) => {
      const merged = Array.from(new Set([...prev, ...allIds]));
      localStorage.setItem('teacherViewedRequests', JSON.stringify(merged));
      return merged;
    });
  }, [requests]);

  // Toggle the collapsible; mark viewed on open
  const toggleRequests = () => {
    setRequestsOpen((prev) => {
      const willOpen = !prev;
      if (willOpen) markAllViewed();
      return willOpen;
    });
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/users/${firebaseUser.uid}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          if (data.teacherProfile?.isProfileComplete) {
            setForm({
              name: data.name || '',
              contactNumber: data.teacherProfile.contactNumber || '',
              subjects: data.teacherProfile.subjects || [],
              classLevels: data.teacherProfile.classLevels || [],
              qualification: data.teacherProfile.qualification || '',
              experience: data.teacherProfile.experience || '',
              feePackages: data.teacherProfile.feePackages || [],
              area: data.teacherProfile.area || '',
              mode: data.teacherProfile.mode || 'offline',
              bio: data.teacherProfile.bio || '',
            });
            if (data.teacherProfile.profilePhoto) {
              setPhotoPreview(`${API_BASE}${data.teacherProfile.profilePhoto}`);
            }
            setShowForm(false);
          } else {
            setShowForm(true);
          }
        }

        // Fetch requests for this teacher
        const reqsRes = await fetch(`${API_BASE}/api/requests`);
        if (reqsRes.ok) {
          const reqsData = await reqsRes.json();
          const teacherReqs = reqsData.filter((r) => r.teacherFirebaseUid === firebaseUser.uid);
          setRequests(teacherReqs);
        }
      } catch (err) {
        console.error('Failed to fetch user/requests:', err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleCheckbox = (field, value) => {
    setForm((prev) => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[TeacherDashboard] handleSubmit fired');

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
    if (form.classLevels.length === 0) {
      setMessage({ text: 'Please select at least one class level.', type: 'error' });
      return;
    }
    if (!form.qualification.trim()) {
      setMessage({ text: 'Please enter your qualification.', type: 'error' });
      return;
    }
    if (form.experience === '' || form.experience === null) {
      setMessage({ text: 'Please enter your experience (0 if none).', type: 'error' });
      return;
    }
    if (form.feePackages.length === 0) {
      setMessage({ text: 'Please select at least one fee package.', type: 'error' });
      return;
    }
    if (!form.area.trim()) {
      setMessage({ text: 'Please enter your area in Kota.', type: 'error' });
      return;
    }
    if (!form.bio.trim()) {
      setMessage({ text: 'Please write a short bio.', type: 'error' });
      return;
    }

    // Validate photo: required for first-time, optional when editing
    const isEditing = user?.teacherProfile?.isProfileComplete;
    const hasExistingPhoto = !!user?.teacherProfile?.profilePhoto;
    if (!photoFile && !hasExistingPhoto) {
      setMessage({ text: 'Please upload a profile photo.', type: 'error' });
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

      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('contactNumber', form.contactNumber);
      formData.append('subjects', JSON.stringify(form.subjects));
      formData.append('classLevels', JSON.stringify(form.classLevels));
      formData.append('qualification', form.qualification);
      formData.append('experience', String(Number(form.experience) || 0));
      formData.append('feePackages', JSON.stringify(form.feePackages));
      formData.append('area', form.area);
      formData.append('mode', form.mode);
      formData.append('bio', form.bio);
      if (photoFile) {
        formData.append('profilePhoto', photoFile);
      }

      console.log('[TeacherDashboard] Sending PUT to', `${API_BASE}/api/users/${firebaseUid}/teacher-profile`);

      const res = await fetch(`${API_BASE}/api/users/${firebaseUid}/teacher-profile`, {
        method: 'PUT',
        body: formData,
      });

      console.log('[TeacherDashboard] Response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setShowForm(false);
        setPhotoFile(null);
        if (data.teacherProfile?.profilePhoto) {
          setPhotoPreview(`${API_BASE}${data.teacherProfile.profilePhoto}`);
        }
        setMessage({ text: 'Profile saved successfully!', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
      } else {
        const errData = await res.json();
        console.error('[TeacherDashboard] Server error:', errData);
        setMessage({ text: `Error: ${errData.error || 'Failed to save'}`, type: 'error' });
      }
    } catch (err) {
      console.error('[TeacherDashboard] Network error:', err);
      setMessage({ text: 'Network error. Please check your connection and try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async (requestId, confirmationVal) => {
    try {
      const res = await fetch(`${API_BASE}/api/requests/${requestId}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmerRole: 'teacher', confirmation: confirmationVal }),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sandstone">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-marigold border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sandstone">
        <p className="font-body text-ink/60 text-lg">Please log in to access the Teacher Dashboard.</p>
      </div>
    );
  }

  const profile = user.teacherProfile;
  const isComplete = profile?.isProfileComplete;

  return (
    <div className="min-h-screen bg-sandstone py-8 px-4">
      <Helmet>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-ink text-2xl sm:text-3xl font-bold">Teacher Dashboard</h1>
          <p className="font-body text-ink/50 mt-1">Welcome, {user.name || 'Teacher'}!</p>
        </div>

        {message.text && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium font-body ${
            message.type === 'error' ? 'bg-maroon/10 text-maroon' : 'bg-sage/10 text-sage'
          }`}>
            {message.text}
          </div>
        )}

        {/* Profile Summary */}
        {isComplete && !showForm && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-ink/8 p-5 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-ink text-lg sm:text-xl font-semibold">Your Profile</h2>
              <button
                onClick={() => setShowForm(true)}
                className="text-sm font-medium text-marigold hover:text-marigold/80 cursor-pointer font-body"
              >
                Edit Profile
              </button>
            </div>

            {photoPreview && (
              <div className="mb-5 flex justify-center">
                <img src={photoPreview} alt="Profile" className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] rounded-lg object-cover border-2 border-marigold/30" />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="sm:col-span-2">
                <ProfileField label="Contact Number" value={profile.contactNumber} />
              </div>
              <ProfileField label="Subjects" value={profile.subjects?.join(', ')} />
              <ProfileField label="Class Levels" value={profile.classLevels?.join(', ')} />
              <ProfileField label="Qualification" value={profile.qualification} />
              <ProfileField label="Experience" value={`${profile.experience} years`} />
              <div className="sm:col-span-2">
                <p className="font-display text-ink/40 text-xs uppercase tracking-wide mb-1">Fee Packages</p>
                <div className="flex flex-wrap gap-1.5">
                  {(profile.feePackages || []).map((pkg) => {
                    const match = FEE_PACKAGES.find((f) => f.id === pkg);
                    return (
                      <span key={pkg} className="inline-block bg-marigold/10 text-marigold text-xs px-2 py-1 rounded-full font-mono font-medium">
                        {match ? match.label : pkg}
                      </span>
                    );
                  })}
                  {(!profile.feePackages || profile.feePackages.length === 0) && <span className="text-ink/30">—</span>}
                </div>
              </div>
              <ProfileField label="Area" value={profile.area} />
              <ProfileField label="Mode" value={profile.mode} />
              <div className="sm:col-span-2">
                <ProfileField label="Bio" value={profile.bio} />
              </div>
            </div>
          </div>
        )}

        {/* Incoming Requests — Collapsible Box (below profile) */}
        {isComplete && !showForm && (
          <div className="mt-6">
            {/* Collapsed / Header Bar */}
            <button
              type="button"
              onClick={toggleRequests}
              className="w-full flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-ink/8 px-5 py-4 sm:px-8 sm:py-5 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <span className="font-display text-ink text-lg sm:text-xl font-semibold">Incoming Requests</span>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-xs font-bold shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-ink/40 transition-transform duration-200 ${requestsOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Expanded Content */}
            {requestsOpen && (
              <div className="bg-white/80 backdrop-blur-sm rounded-b-2xl border border-t-0 border-ink/8 shadow-sm px-5 py-5 sm:px-8 sm:py-6 -mt-3 rounded-t-none">
                {requests.length === 0 ? (
                  <p className="font-body text-ink/50 text-sm">No requests yet.</p>
                ) : (
                  <div className="space-y-4">
                    {requests.map(req => (
                      <div key={req._id} className="border border-ink/8 rounded-xl p-5 bg-sandstone/50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <ProfileField label="Student Area" value={req.area || 'Not specified'} />
                          <ProfileField label="Subject" value={req.subject || 'N/A'} />
                          <ProfileField label="Class Level" value={req.classLevel || 'Not specified'} />

                          <div>
                            <p className="font-display text-ink/40 text-xs uppercase tracking-wide mb-0.5">Status</p>
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize mt-1 font-body
                              ${req.status === 'pending' ? 'bg-marigold/15 text-marigold' : ''}
                              ${req.status === 'contacted' ? 'bg-blue-100 text-blue-800' : ''}
                              ${req.status === 'closed' ? 'bg-ink/10 text-ink/60' : ''}
                              ${!req.status ? 'bg-marigold/15 text-marigold' : ''}
                            `}>
                              {req.status || 'pending'}
                            </span>
                          </div>

                          <div>
                            <p className="font-display text-ink/40 text-xs uppercase tracking-wide mb-0.5">Demo Status</p>
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mt-1 font-body
                              ${req.demoStatus === 'scheduled' ? 'bg-blue-100 text-blue-800' : ''}
                              ${req.demoStatus === 'completed' ? 'bg-marigold/15 text-marigold' : ''}
                              ${req.demoStatus === 'converted' ? 'bg-sage/15 text-sage' : ''}
                              ${req.demoStatus === 'not_converted' ? 'bg-maroon/10 text-maroon' : ''}
                              ${!req.demoStatus || req.demoStatus === 'not_scheduled' ? 'bg-ink/8 text-ink/50' : ''}
                            `}>
                              {req.demoStatus ? req.demoStatus.replace('_', ' ').toUpperCase() : 'NOT SCHEDULED'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tuition Requests / Demos Section */}
        {isComplete && !showForm && requests.filter((r) => r.demoStatus === 'completed').length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-ink/8 p-5 sm:p-8 mt-6">
            <h2 className="font-display text-ink text-lg sm:text-xl font-semibold mb-6">Completed Demos</h2>
            <div className="space-y-4">
              {requests
                .filter((r) => r.demoStatus === 'completed')
                .map((req) => (
                  <div key={req._id} className="border border-ink/8 rounded-xl p-5 bg-sandstone/50">
                    <div className="mb-4">
                      <p className="font-body text-sm font-medium text-ink">Student: {req.studentName || 'Unknown'}</p>
                      <p className="font-body text-xs text-ink/50 mt-1">Subject: {req.subject || 'N/A'}</p>
                    </div>

                    {req.teacherConfirmation === 'yes' || req.teacherConfirmation === 'no' ? (
                      <div
                        className={`text-sm font-medium px-4 py-2 rounded-lg inline-flex items-center gap-2 font-body ${
                          req.teacherConfirmation === 'yes'
                            ? 'bg-sage/15 text-sage'
                            : 'bg-maroon/10 text-maroon'
                        }`}
                      >
                        You confirmed: {req.teacherConfirmation === 'yes' ? 'Yes ✓' : 'No ✗'}
                      </div>
                    ) : (
                      <div className="bg-white p-4 rounded-lg border border-ink/10 shadow-sm">
                        <p className="font-body text-sm text-ink mb-3 font-medium">
                          Did the student decide to continue with tuition?
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() => handleConfirm(req._id, 'yes')}
                            className="flex-1 px-5 py-3 sm:py-2 bg-sage text-white text-sm font-medium rounded-lg hover:bg-sage/90 transition-colors cursor-pointer font-body"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => handleConfirm(req._id, 'no')}
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

        {/* Profile Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-ink/8 p-5 sm:p-8 space-y-6">
            <h2 className="font-display text-ink text-lg sm:text-xl font-semibold">
              {isComplete ? 'Edit Your Profile' : 'Complete Your Profile'}
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
                placeholder="e.g. Rajesh Kumar"
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-marigold focus:border-transparent"
              />
            </div>

            {/* Profile Photo */}
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-2 font-body">
                Profile Photo <span className="text-maroon">*</span>
              </label>
              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] rounded-lg object-cover border-2 border-marigold/30" />
                ) : (
                  <div className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] rounded-lg bg-sandstone border-2 border-dashed border-ink/20 flex items-center justify-center text-ink/30 text-xs font-body">
                    No photo
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="text-sm text-ink/60 font-body file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-marigold/15 file:text-marigold hover:file:bg-marigold/25 file:cursor-pointer cursor-pointer"
                />
              </div>
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
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm font-mono text-ink focus:outline-none focus:ring-2 focus:ring-marigold focus:border-transparent"
              />
              {form.contactNumber && form.contactNumber.length !== 10 && (
                <p className="text-xs text-marigold mt-1 font-body">{form.contactNumber.length}/10 digits</p>
              )}
            </div>

            {/* Subjects */}
            <fieldset>
              <legend className="text-sm font-medium text-ink/70 mb-2 font-body">Subjects <span className="text-maroon">*</span></legend>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_OPTIONS.map((sub) => (
                  <label
                    key={sub}
                    className={`px-3 py-1.5 rounded-full border text-sm cursor-pointer select-none transition-all duration-200 font-body ${
                      form.subjects.includes(sub)
                        ? 'bg-marigold text-ink border-marigold shadow-sm shadow-marigold/20'
                        : 'bg-white text-ink/60 border-ink/15 hover:border-marigold/50'
                    }`}
                  >
                    <input type="checkbox" className="hidden" checked={form.subjects.includes(sub)} onChange={() => handleCheckbox('subjects', sub)} />
                    {sub}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Class Levels */}
            <fieldset>
              <legend className="text-sm font-medium text-ink/70 mb-2 font-body">Class Levels <span className="text-maroon">*</span></legend>
              <div className="flex flex-wrap gap-2">
                {CLASS_OPTIONS.map((cls) => (
                  <label
                    key={cls}
                    className={`px-3 py-1.5 rounded-full border text-sm cursor-pointer select-none transition-all duration-200 font-body ${
                      form.classLevels.includes(cls)
                        ? 'bg-marigold text-ink border-marigold shadow-sm shadow-marigold/20'
                        : 'bg-white text-ink/60 border-ink/15 hover:border-marigold/50'
                    }`}
                  >
                    <input type="checkbox" className="hidden" checked={form.classLevels.includes(cls)} onChange={() => handleCheckbox('classLevels', cls)} />
                    {cls}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Qualification */}
            <div>
              <label htmlFor="qualification" className="block text-sm font-medium text-ink/70 mb-1 font-body">Qualification <span className="text-maroon">*</span></label>
              <input id="qualification" name="qualification" type="text" value={form.qualification} onChange={handleChange} placeholder="e.g. M.Sc. Physics, B.Tech IIT" className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-marigold focus:border-transparent" />
            </div>

            {/* Experience */}
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-ink/70 mb-1 font-body">Experience (years) <span className="text-maroon">*</span></label>
              <input id="experience" name="experience" type="number" min="0" value={form.experience} onChange={handleChange} placeholder="e.g. 5" className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm font-mono text-ink focus:outline-none focus:ring-2 focus:ring-marigold focus:border-transparent" />
            </div>

            {/* Fee Packages */}
            <fieldset>
              <legend className="text-sm font-medium text-ink/70 mb-2 font-body">Fee Packages <span className="text-maroon">*</span></legend>
              <div className="space-y-2">
                {FEE_PACKAGES.map((pkg) => (
                  <label
                    key={pkg.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer select-none transition-all duration-200 ${
                      form.feePackages.includes(pkg.id)
                        ? 'bg-marigold/10 border-marigold/40'
                        : 'bg-white border-ink/10 hover:border-marigold/30'
                    }`}
                  >
                    <input type="checkbox" className="accent-marigold w-4 h-4" checked={form.feePackages.includes(pkg.id)} onChange={() => handleCheckbox('feePackages', pkg.id)} />
                    <span className="text-sm font-mono text-ink">{pkg.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Area */}
            <div>
              <label htmlFor="area" className="block text-sm font-medium text-ink/70 mb-1 font-body">Area in Kota <span className="text-maroon">*</span></label>
              <input id="area" name="area" type="text" value={form.area} onChange={handleChange} placeholder="e.g. Talwandi, Kota" className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-marigold focus:border-transparent" />
            </div>

            {/* Mode */}
            <fieldset>
              <legend className="text-sm font-medium text-ink/70 mb-2 font-body">Teaching Mode</legend>
              <div className="flex flex-wrap gap-4">
                {MODE_OPTIONS.map((m) => (
                  <label key={m} className="flex items-center gap-2 cursor-pointer text-sm text-ink/70 font-body">
                    <input type="radio" name="mode" value={m} checked={form.mode === m} onChange={handleChange} className="accent-marigold" />
                    <span className="capitalize">{m}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-ink/70 mb-1 font-body">
                Short Bio <span className="text-maroon">*</span> <span className="text-ink/30">{form.bio.length}/200)</span>
              </label>
              <textarea id="bio" name="bio" maxLength={200} rows={3} value={form.bio} onChange={handleChange} placeholder="Tell students about yourself..." className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-marigold focus:border-transparent resize-none" />
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button type="submit" disabled={saving} className="w-full sm:w-auto px-6 py-3.5 sm:py-2.5 bg-marigold text-ink text-sm font-semibold rounded-lg hover:bg-marigold/90 disabled:opacity-50 transition-colors cursor-pointer font-body shadow-sm shadow-marigold/20 min-h-[44px]">
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
              {isComplete && (
                <button type="button" onClick={() => setShowForm(false)} className="w-full sm:w-auto px-6 py-3.5 sm:py-2.5 bg-ink/10 text-ink text-sm font-medium rounded-lg hover:bg-ink/15 transition-colors cursor-pointer font-body min-h-[44px]">
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ProfileField({ label, value }) {
  return (
    <div>
      <p className="font-display text-ink/40 text-xs uppercase tracking-wide mb-0.5">{label}</p>
      <p className="font-body text-ink font-medium capitalize">{value || '—'}</p>
    </div>
  );
}

export default TeacherDashboard;
