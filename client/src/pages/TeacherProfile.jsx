import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { Helmet } from 'react-helmet-async';

const API_BASE = import.meta.env.VITE_API_URL;

const FEE_PACKAGES = {
  '1hr-10000': '1 hr — ₹10,000/mo',
  '1.5hr-15000': '1.5 hr — ₹15,000/mo',
  '2hr-20000': '2 hr — ₹20,000/mo',
};

function TeacherProfile() {
  const { id } = useParams(); // firebaseUid from URL
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Request state
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestMessage, setRequestMessage] = useState({ text: '', type: '' });

  // Fetch teacher profile
  useEffect(() => {
    async function fetchTeacher() {
      try {
        const res = await fetch(`${API_BASE}/api/users/teachers/${id}`);
        if (res.ok) {
          const data = await res.json();
          setTeacher(data);
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || 'Teacher not found.');
        }
      } catch (err) {
        console.error('Fetch teacher error:', err);
        setError('Network error. Please check your connection.');
      } finally {
        setLoading(false);
      }
    }
    fetchTeacher();
  }, [id]);

  // Handle request submission
  const handleRequest = async () => {
    const subjects = teacher?.teacherProfile?.subjects || [];

    // If no subject selected yet, show the picker
    if (!selectedSubject) {
      if (subjects.length === 1) {
        // Only one subject — auto-select it
        setSelectedSubject(subjects[0]);
      } else {
        setShowSubjectPicker(true);
        return;
      }
    }

    const subjectToSend = selectedSubject || subjects[0];
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setRequestMessage({ text: 'Please log in to send a request.', type: 'error' });
      return;
    }

    setRequesting(true);
    setRequestMessage({ text: '', type: '' });

    try {
      const res = await fetch(`${API_BASE}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentFirebaseUid: currentUser.uid,
          teacherFirebaseUid: teacher.firebaseUid,
          subject: subjectToSend,
        }),
      });

      if (res.ok) {
        setRequestSent(true);
        setRequestMessage({
          text: `Request sent! We'll connect you with ${teacher.name || 'this teacher'} soon.`,
          type: 'success',
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        setRequestMessage({
          text: `Error: ${errData.error || 'Failed to send request.'}`,
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Request error:', err);
      setRequestMessage({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setRequesting(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-gray-500 text-sm">Loading teacher profile…</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Profile Not Found</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link
            to="/browse-teachers"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            ← Back to Browse Teachers
          </Link>
        </div>
      </div>
    );
  }

  const p = teacher.teacherProfile;
  const photoUrl = p.profilePhoto ? `${API_BASE}${p.profilePhoto}` : null;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <Helmet>
        <title>{`${teacher.name || 'Teacher'} - ${p?.subjects?.[0] || 'Expert'} Tutor in Kota | Kota Tuition Hub`}</title>
        <meta name="description" content={`View ${teacher.name || 'this teacher'}'s profile on Kota Tuition Hub. Verified home tutor in Kota, Rajasthan.`} />
      </Helmet>
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <Link
          to="/browse-teachers"
          className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium mb-5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Browse Teachers
        </Link>

        {/* ─── Profile Card ─── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header section with photo + name */}
          <div className="p-5 sm:p-8 flex flex-col sm:flex-row gap-5 items-start">
            {/* Profile photo */}
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={`${teacher.name || 'Verified teacher'}, ${p?.subjects?.[0] || 'expert'} tutor in Kota`}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-2 border-gray-200 flex-shrink-0"
              />
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-500 text-4xl font-bold flex-shrink-0">
                {(teacher.name || 'T').charAt(0).toUpperCase()}
              </div>
            )}

            {/* Name + basic info */}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                {teacher.name || 'Teacher'}
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                {p.qualification || 'Qualification not specified'}
              </p>

              <p className="text-sm text-gray-500">
                {p.experience > 0
                  ? `${p.experience} year${p.experience > 1 ? 's' : ''} of experience`
                  : 'New teacher'}
              </p>

              {p.area && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {p.area}, Kota
                </p>
              )}

              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {teacher.contactNumber || p.contactNumber || 'Not provided'}
              </div>
            </div>
          </div>

          {/* ─── Details Grid ─── */}
          <div className="px-5 sm:px-8 pb-6 space-y-5">
            {/* Mode */}
            <DetailRow label="Teaching Mode">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                {p.mode === 'both' ? '🏠 Offline + 💻 Online' : '🏠 Offline Only'}
              </span>
            </DetailRow>

            {/* Subjects */}
            <DetailRow label="Subjects">
              <div className="flex flex-wrap gap-1.5">
                {(p.subjects || []).map((sub) => (
                  <span key={sub} className="inline-block bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium">
                    {sub}
                  </span>
                ))}
                {(!p.subjects || p.subjects.length === 0) && <span className="text-gray-400 text-sm">—</span>}
              </div>
            </DetailRow>

            {/* Class Levels */}
            <DetailRow label="Class Levels">
              <div className="flex flex-wrap gap-1.5">
                {(p.classLevels || []).map((cls) => (
                  <span key={cls} className="inline-block bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium">
                    {cls === 'Dropper' ? 'Dropper' : `Class ${cls}`}
                  </span>
                ))}
                {(!p.classLevels || p.classLevels.length === 0) && <span className="text-gray-400 text-sm">—</span>}
              </div>
            </DetailRow>

            {/* Fee Packages */}
            {p.feePackages && p.feePackages.length > 0 && (
              <DetailRow label="Fee Packages">
                <div className="flex flex-wrap gap-1.5">
                  {p.feePackages.map((pkg) => (
                    <span key={pkg} className="inline-block bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">
                      {FEE_PACKAGES[pkg] || pkg}
                    </span>
                  ))}
                </div>
              </DetailRow>
            )}

            {/* Bio */}
            {p.bio && (
              <DetailRow label="About">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{p.bio}</p>
              </DetailRow>
            )}
          </div>

          {/* ─── Request Section ─── */}
          <div className="px-5 sm:px-8 pb-6 sm:pb-8 border-t border-gray-100 pt-5">
            {/* Status messages */}
            {requestMessage.text && (
              <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
                requestMessage.type === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {requestMessage.text}
              </div>
            )}

            {/* Subject picker */}
            {showSubjectPicker && !requestSent && (
              <div className="mb-4">
                <label htmlFor="subjectSelect" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Which subject do you need help with?
                </label>
                <select
                  id="subjectSelect"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select a subject…</option>
                  {(p.subjects || []).map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Request button */}
            <button
              onClick={handleRequest}
              disabled={requesting || requestSent || (showSubjectPicker && !selectedSubject)}
              className={`w-full py-3 text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
                requestSent
                  ? 'bg-green-600 text-white cursor-default'
                  : requesting
                    ? 'bg-indigo-400 text-white cursor-wait'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {requestSent
                ? 'Request Sent ✓'
                : requesting
                  ? 'Sending…'
                  : 'Request This Teacher'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Detail Row Helper ─── */
function DetailRow({ label, children }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1.5">{label}</p>
      {children}
    </div>
  );
}

export default TeacherProfile;
