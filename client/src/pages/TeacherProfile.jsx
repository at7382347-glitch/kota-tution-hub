import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { Helmet } from 'react-helmet-async';

const API_BASE = import.meta.env.DEV ? 'http://localhost:5000' : import.meta.env.VITE_API_URL;

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
  const [imageError, setImageError] = useState(false);

  // Review state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

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

  // Handle review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a star rating.');
      return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/teachers/${teacher.firebaseUid}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentUser.uid,
          studentName: currentUser.displayName || currentUser.email || 'Student',
          rating,
          comment: reviewComment,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTeacher(prev => ({
          ...prev,
          teacherProfile: {
            ...prev.teacherProfile,
            averageRating: data.averageRating,
            totalRatings: data.totalRatings,
            reviews: data.reviews,
          }
        }));
        setShowReviewModal(false);
        setRating(0);
        setReviewComment('');
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Error: ${errData.error || 'Failed to submit review'}`);
      }
    } catch (err) {
      console.error('Review error:', err);
      alert('Network error while submitting review');
    } finally {
      setSubmittingReview(false);
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
  
  let photoUrl = null;
  if (p.profilePhoto) {
    photoUrl = p.profilePhoto.startsWith('http') ? p.profilePhoto : `${API_BASE}${p.profilePhoto}`;
  } else if (teacher.photoURL) {
    photoUrl = teacher.photoURL;
  }

  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4 overflow-x-hidden">
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
          <div className="p-5 sm:p-8 flex flex-col md:flex-row gap-5 items-start">
            {photoUrl && !imageError ? (
              <img
                src={photoUrl}
                onError={(e) => {
                  const prodUrl = `${import.meta.env.VITE_API_URL}${p.profilePhoto}`;
                  if (import.meta.env.DEV && e.target.src !== prodUrl && p.profilePhoto && !p.profilePhoto.startsWith('http')) {
                    e.target.src = prodUrl;
                  } else {
                    setImageError(true);
                  }
                }}
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

              {p.totalRatings > 0 && (
                <div className="flex items-center gap-1.5 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700">{p.averageRating}</span>
                  <span className="text-sm text-gray-500">({p.totalRatings} review{p.totalRatings !== 1 ? 's' : ''})</span>
                </div>
              )}

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

            {/* Reviews Section */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Reviews</h2>
                {auth.currentUser && auth.currentUser.uid !== teacher.firebaseUid && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="text-sm px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
                    aria-label="Write a Review for this teacher"
                  >
                    Write a Review
                  </button>
                )}
              </div>
              
              {!p.reviews || p.reviews.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {p.reviews.map((rev, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-gray-800">{rev.studentName}</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${star <= rev.rating ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      {rev.comment && <p className="text-sm text-gray-600">{rev.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
              aria-label="Request This Teacher"
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

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 w-[90%] md:w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Rate {teacher.name || 'Teacher'}</h2>
            <form onSubmit={handleReviewSubmit}>
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-12 w-12 sm:h-10 sm:w-10 ${(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-200'}`} 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
              
              <div className="mb-6">
                <label htmlFor="reviewComment" className="block text-sm font-medium text-gray-700 mb-1">
                  Share your experience (Optional)
                </label>
                <textarea
                  id="reviewComment"
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="How was your learning experience?"
                  className="w-full rounded-xl border border-gray-300 px-3 py-3 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewModal(false);
                    setRating(0);
                    setReviewComment('');
                  }}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                  aria-label="Cancel rating"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview || rating === 0}
                  className="flex-1 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
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
