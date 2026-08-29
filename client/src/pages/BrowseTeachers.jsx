import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const API_BASE = import.meta.env.VITE_API_URL;

const SUBJECT_OPTIONS = ['Physics', 'Chemistry', 'Maths', 'Biology', 'English'];
const CLASS_OPTIONS = ['6', '7', '8', '9', '10', '11', '12', 'Dropper'];

const FEE_PACKAGES = {
  '1hr-10000': '1 hr — ₹10k/mo',
  '1.5hr-15000': '1.5 hr — ₹15k/mo',
  '2hr-20000': '2 hr — ₹20k/mo',
};

function BrowseTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [subjectFilters, setSubjectFilters] = useState([]);
  const [classFilters, setClassFilters] = useState([]);

  // Fetch all teachers on mount
  useEffect(() => {
    async function fetchTeachers() {
      try {
        const res = await fetch(`${API_BASE}/api/users/teachers`);
        if (res.ok) {
          const data = await res.json();
          setTeachers(data);
        } else {
          setError('Failed to load teachers.');
        }
      } catch (err) {
        console.error('Fetch teachers error:', err);
        setError('Network error. Please check your connection.');
      } finally {
        setLoading(false);
      }
    }
    fetchTeachers();
  }, []);

  // Toggle filter helpers
  const toggleFilter = (arr, setArr, value) => {
    setArr((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // Filtered list
  const filtered = teachers.filter((t) => {
    const profile = t.teacherProfile;
    if (!profile) return false;

    if (
      subjectFilters.length > 0 &&
      !subjectFilters.some((s) => profile.subjects?.includes(s))
    ) {
      return false;
    }

    if (
      classFilters.length > 0 &&
      !classFilters.some((c) => profile.classLevels?.includes(c))
    ) {
      return false;
    }

    return true;
  });

  const hasActiveFilters = subjectFilters.length > 0 || classFilters.length > 0;

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sandstone">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-marigold border-t-transparent mx-auto"></div>
          <p className="mt-3 font-body text-ink/50 text-sm">Loading teachers…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sandstone py-8 px-4">
      <Helmet>
        <title>Browse Verified Home Tutors in Kota | Kota Tuition Hub</title>
        <meta name="description" content="Browse and find verified home tutors for IIT-JEE, NEET, and board exams in Kota, Rajasthan. Filter by subject, class, and fee." />
        <meta property="og:title" content="Browse Verified Home Tutors in Kota | Kota Tuition Hub" />
        <meta property="og:description" content="Browse and find verified home tutors for IIT-JEE, NEET, and board exams in Kota, Rajasthan. Filter by subject, class, and fee." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_IN" />
      </Helmet>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-ink text-2xl sm:text-3xl font-bold">Browse Teachers</h1>
          <p className="font-body text-ink/50 mt-1">
            {teachers.length} teacher{teachers.length !== 1 ? 's' : ''} available in Kota
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-maroon/10 text-maroon text-sm font-medium font-body">
            {error}
          </div>
        )}

        {/* ─── Filters ─── */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-ink/8 p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-ink text-sm font-semibold uppercase tracking-wide">Filters</h2>
            {hasActiveFilters && (
              <button
                onClick={() => { setSubjectFilters([]); setClassFilters([]); }}
                className="text-xs text-marigold hover:text-marigold/80 font-medium cursor-pointer font-body"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Subject filters */}
          <div className="mb-3">
            <p className="font-display text-xs text-ink/40 mb-1.5">Subject</p>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_OPTIONS.map((sub) => (
                <button
                  key={sub}
                  onClick={() => toggleFilter(subjectFilters, setSubjectFilters, sub)}
                  className={`px-3 py-1.5 sm:py-1 rounded-full border text-[11px] sm:text-xs font-medium cursor-pointer transition-all duration-200 font-body ${
                    subjectFilters.includes(sub)
                      ? 'bg-marigold text-ink border-marigold shadow-sm shadow-marigold/20'
                      : 'bg-white text-ink/60 border-ink/15 hover:border-marigold/50 hover:text-ink'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Class level filters */}
          <div>
            <p className="font-display text-xs text-ink/40 mb-1.5">Class Level</p>
            <div className="flex flex-wrap gap-2">
              {CLASS_OPTIONS.map((cls) => (
                <button
                  key={cls}
                  onClick={() => toggleFilter(classFilters, setClassFilters, cls)}
                  className={`px-3 py-1.5 sm:py-1 rounded-full border text-[11px] sm:text-xs font-medium cursor-pointer transition-all duration-200 font-body ${
                    classFilters.includes(cls)
                      ? 'bg-marigold text-ink border-marigold shadow-sm shadow-marigold/20'
                      : 'bg-white text-ink/60 border-ink/15 hover:border-marigold/50 hover:text-ink'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Teacher Cards Grid ─── */}
        {filtered.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-ink/8 p-8 sm:p-12 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="font-display text-lg font-semibold text-ink mb-1">
              {teachers.length === 0
                ? 'No teachers have joined yet'
                : 'No teachers found matching your criteria'}
            </h3>
            <p className="font-body text-ink/50 text-sm">
              {teachers.length === 0
                ? 'Check back soon — teachers are signing up every day!'
                : 'Try adjusting your filters to see more results.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filtered.map((teacher) => (
              <TeacherCard key={teacher.firebaseUid} teacher={teacher} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Teacher Card Component ─── */
function TeacherCard({ teacher }) {
  const p = teacher.teacherProfile;
  const photoUrl = p.profilePhoto
    ? `${API_BASE}${p.profilePhoto}`
    : null;

  const bioPreview =
    p.bio && p.bio.length > 80 ? p.bio.slice(0, 80) + '…' : p.bio;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-ink/8 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:shadow-marigold/10 hover:border-marigold/20 hover:-translate-y-0.5">
      {/* Top section: photo + basic info */}
      <div className="p-4 sm:p-5 flex gap-4">
        {/* Photo */}
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`${teacher.name || 'Verified teacher'}, ${p?.subjects?.[0] || 'expert'} tutor in Kota`}
            className="w-14 h-14 sm:w-[72px] sm:h-[72px] rounded-xl object-cover border border-ink/10 flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 sm:w-[72px] sm:h-[72px] rounded-xl bg-marigold/15 flex items-center justify-center text-marigold text-xl sm:text-2xl font-bold flex-shrink-0 font-display">
            {(teacher.name || 'T').charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <h3 className="font-display text-sm sm:text-base font-semibold text-ink truncate">
            {teacher.name || 'Teacher'}
          </h3>
          <p className="font-body text-xs text-ink/50 mt-0.5">
            {p.qualification || 'Qualification not specified'}
          </p>
          <p className="font-body text-xs text-ink/50">
            {p.experience > 0 ? `${p.experience} yr${p.experience > 1 ? 's' : ''} experience` : 'New teacher'}
          </p>
          {p.area && (
            <p className="font-body text-xs text-ink/50 flex items-center gap-1 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {p.area}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex-1 space-y-3">
        {/* Subjects */}
        <div>
          <p className="font-display text-[10px] text-ink/30 uppercase tracking-wide mb-1">Subjects</p>
          <div className="flex flex-wrap gap-1">
            {(p.subjects || []).map((sub) => (
              <span key={sub} className="inline-block bg-marigold/10 text-marigold text-[11px] px-2 py-0.5 rounded-full font-medium font-body">
                {sub}
              </span>
            ))}
          </div>
        </div>

        {/* Class Levels */}
        <div>
          <p className="font-display text-[10px] text-ink/30 uppercase tracking-wide mb-1">Classes</p>
          <p className="font-body text-xs text-ink/70">
            {(p.classLevels || []).join(', ') || '—'}
          </p>
        </div>

        {/* Fee Packages */}
        {p.feePackages && p.feePackages.length > 0 && (
          <div>
            <p className="font-display text-[10px] text-ink/30 uppercase tracking-wide mb-1">Fee Packages</p>
            <div className="flex flex-wrap gap-1">
              {p.feePackages.map((pkg) => (
                <span key={pkg} className="inline-block bg-sage/10 text-sage text-[11px] px-2 py-0.5 rounded-full font-medium font-mono">
                  {FEE_PACKAGES[pkg] || pkg}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bio preview */}
        {bioPreview && (
          <p className="font-body text-xs text-ink/40 italic leading-relaxed">"{bioPreview}"</p>
        )}
      </div>

      {/* Footer: View Profile button */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
        <Link
          to={`/teacher/${teacher.firebaseUid}`}
          className="block w-full py-3 sm:py-2.5 bg-marigold text-ink text-sm font-semibold rounded-xl hover:bg-marigold/90 transition-all duration-200 text-center shadow-sm shadow-marigold/20 hover:shadow-md hover:shadow-marigold/25 font-body"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}

export default BrowseTeachers;
