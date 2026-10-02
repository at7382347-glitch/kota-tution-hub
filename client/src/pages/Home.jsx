import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { apiFetch } from '../api';
import { resolveTeacherPhotoUrl } from '../utils/teacherPhoto';
import useReveal from '../hooks/useReveal';
import Logo from '../components/Logo';
import { FEE_GROUPS, FEE_PACKAGES, GROUP_DISCOUNT, formatINR, groupFee } from '../fees';

const GROUP_DISCOUNT_PCT = Math.round(GROUP_DISCOUNT * 100);

/* ─── Content ─────────────────────────────────────────────────────── */

const SUBJECTS = ['Physics', 'Chemistry', 'Maths', 'Biology', 'English'];
const CLASSES = ['6', '7', '8', '9', '10', '11', '12', 'Dropper'];

const CONTACTS = [
  { name: 'Ankur Yadav', tel: '+919536783342', display: '+91 95367 83342' },
  { name: 'Sanskar Thakur', tel: '+916206105858', display: '+91 62061 05858' },
];

const WHATSAPP_URL = `https://wa.me/919536783342?text=${encodeURIComponent(
  'Hi, I am looking for a home tutor in Kota.'
)}`;

const STEPS = [
  {
    title: 'Tell us what you need',
    text: 'Share the class, subjects and your locality — or browse tutor profiles yourself.',
  },
  {
    title: 'We shortlist a tutor',
    text: 'Our team calls you, understands your child’s level and matches an interviewed tutor near you.',
  },
  {
    title: 'Free demo class at home',
    text: 'The tutor visits for a demo. No charge, no commitment.',
  },
  {
    title: 'Regular classes begin',
    text: 'One-on-one, one hour a day, at your home — on a schedule that suits your family.',
  },
  {
    title: 'Pay monthly, at home',
    text: 'No online payments. Our team collects the fee at your home each month.',
  },
];

const PROMISES = [
  {
    title: 'Every tutor is interviewed',
    text: 'Before anyone joins, our team interviews them personally — subject depth, teaching style, and how they explain to a student who is stuck.',
  },
  {
    title: 'One team, one point of contact',
    text: 'Scheduling, fees, feedback, changes — you speak to us, not a call centre. We stay involved after the first class.',
  },
  {
    title: 'No sudden gaps in learning',
    text: 'Tutors must give 15 days’ notice before leaving, so we always have time to arrange a replacement.',
  },
  {
    title: 'Study together, pay 40% less',
    text: 'When 2 or 3 students share one tutor, each student pays 40% less than the solo fee — ideal for siblings or friends.',
  },
];

const AREAS = [
  'Talwandi', 'Vigyan Nagar', 'Mahaveer Nagar', 'Kunhadi', 'Landmark City', 'Rajeev Gandhi Nagar',
  'Indra Vihar', 'Jawahar Nagar', 'Dadabari', 'Borkhera', 'Coral Park', 'Shrinath Puram',
];

const FAQS = [
  {
    q: 'Is the demo class really free?',
    a: 'Yes. The first demo class at your home is completely free, and there is no obligation to continue.',
  },
  {
    q: 'How do I pay the fees?',
    a: 'Fees are paid monthly. A member of our team collects the fee at your home — there is no online payment involved.',
  },
  {
    q: 'How do you verify tutors?',
    a: 'Every tutor is interviewed by our team before joining. We check subject knowledge, teaching approach and experience.',
  },
  {
    q: 'What if we don’t like the tutor?',
    a: 'Tell us after the demo or at any time. We will arrange a demo with a different tutor.',
  },
  {
    q: 'Can we contact the tutor directly?',
    a: 'All coordination happens through our team. This keeps scheduling, fees and accountability in one place.',
  },
  {
    q: 'Do you offer group tuition?',
    a: 'Yes. 2 or 3 students (maximum 3) can study together with one tutor, and each student pays 40% less than the solo fee.',
  },
];

/* ─── Small pieces ────────────────────────────────────────────────── */

// Tutors type their area freely (often a long list) — show the first locality only.
function areaLabel(area) {
  const first = String(area || '')
    .split(/[,/|]/)
    .map((s) => s.trim())
    .find((s) => s && s.toLowerCase() !== 'kota');
  if (!first) return 'Kota';
  const pretty = first.replace(/\b\w/g, (c) => c.toUpperCase());
  return `${pretty}, Kota`;
}

// Shows the tutor's initial underneath; the photo fades in on top only once it has loaded,
// so a missing or slow photo never flashes a broken-image icon.
function TutorAvatar({ teacher, className }) {
  const [status, setStatus] = useState('loading'); // loading | loaded | failed
  const url = resolveTeacherPhotoUrl(teacher);
  const initial = (teacher.name || 'T').trim().charAt(0).toUpperCase();

  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-marigold/20 font-display font-bold text-marigold ${className}`}>
      {initial}
      {url && status !== 'failed' && (
        <img
          src={url}
          alt={`${teacher.name || 'Tutor'}, home tutor in Kota`}
          loading="lazy"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('failed')}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}

function Stars({ value }) {
  return (
    <span className="inline-flex items-center gap-1 font-body text-xs font-semibold text-ink">
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-marigold" fill="currentColor" aria-hidden="true">
        <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
      </svg>
      {Number(value).toFixed(1)}
    </span>
  );
}

function TutorCard({ teacher, compact = false }) {
  const p = teacher.teacherProfile || {};
  return (
    <Link
      to={`/teacher/${teacher.firebaseUid}`}
      className={`group block rounded-2xl border border-ink/10 bg-white p-4 shadow-[0_1px_2px_rgba(31,42,68,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-[0_12px_32px_-12px_rgba(31,42,68,0.25)] ${
        compact ? '' : 'h-full'
      }`}
    >
      <div className="flex items-center gap-3.5">
        <TutorAvatar teacher={teacher} className="h-14 w-14 flex-shrink-0 rounded-xl text-xl" />
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold text-ink">{teacher.name || 'Tutor'}</p>
          <p className="truncate font-body text-xs text-ink/55">
            {(p.subjects || []).join(' · ') || 'Multiple subjects'}
          </p>
          <div className="mt-1 flex items-center gap-2.5 font-body text-xs text-ink/55">
            {p.experience > 0 && <span>{p.experience} yrs exp.</span>}
            {p.averageRating > 0 && <Stars value={p.averageRating} />}
          </div>
        </div>
      </div>
      {!compact && (
        <>
          {p.qualification && (
            <p className="mt-4 line-clamp-1 font-body text-sm text-ink/70">{p.qualification}</p>
          )}
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-ink/5 pt-3 font-body text-xs">
            <span className="min-w-0 truncate text-ink/50" title={p.area || 'Kota'}>
              {areaLabel(p.area)}
            </span>
            <span className="flex-shrink-0 font-semibold text-ink transition-colors group-hover:text-marigold">
              View profile →
            </span>
          </div>
        </>
      )}
    </Link>
  );
}

function SectionLabel({ children, light = false }) {
  return (
    <p className={`flex items-center gap-3 font-body text-xs font-semibold uppercase tracking-[0.18em] ${light ? 'text-marigold' : 'text-ink/50'}`}>
      <span className="h-px w-8 bg-marigold" />
      {children}
    </p>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */

function Home() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [teachersLoaded, setTeachersLoaded] = useState(false);
  const [searchClass, setSearchClass] = useState('');
  const [searchSubject, setSearchSubject] = useState('');

  useReveal([teachersLoaded]);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/users/teachers')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        // Tutors with a working (Cloudinary) photo first, then by rating and experience
        const score = (t) => {
          const p = t.teacherProfile || {};
          const hasPhoto = /^https?:\/\//.test(p.profilePhoto || '') ? 1 : 0;
          return hasPhoto * 1000 + (p.averageRating || 0) * 10 + (p.experience || 0);
        };
        setTeachers([...data].sort((a, b) => score(b) - score(a)));
      })
      .catch(() => {})
      .finally(() => !cancelled && setTeachersLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchSubject) params.append('subject', searchSubject);
    if (searchClass) params.append('class', searchClass);
    const qs = params.toString();
    navigate(`/browse-teachers${qs ? `?${qs}` : ''}`);
  };

  const heroTeachers = teachers.slice(0, 3);
  const railTeachers = teachers.slice(0, 8);
  const tutorCount = teachers.length;

  const selectClass =
    'w-full appearance-none rounded-xl border border-ink/10 bg-sandstone/40 px-4 py-3.5 pr-10 font-body text-sm text-ink focus:border-marigold focus:outline-none focus:ring-2 focus:ring-marigold/30';

  return (
    <div className="overflow-x-hidden bg-sandstone">
      <Helmet>
        <title>Home Tutors in Kota for JEE, NEET &amp; Boards | Nexved — Kota Tuition Hub</title>
        <meta
          name="description"
          content="Interviewed home tutors across Kota, Rajasthan for Class 6–12, JEE, NEET and droppers. Free demo class at home. Fees collected monthly at your doorstep."
        />
        <meta property="og:title" content="Home Tutors in Kota for JEE, NEET & Boards | Nexved — Kota Tuition Hub" />
        <meta
          property="og:description"
          content="Interviewed home tutors across Kota for Class 6–12, JEE, NEET and droppers. Free demo class at home."
        />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_IN" />
      </Helmet>

      <main>
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="relative px-4 pb-20 pt-10 sm:px-6 sm:pt-16 lg:pb-28">
          {/* Faint grid texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(31,42,68,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(31,42,68,0.06) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(ellipse at 30% 20%, black 20%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(ellipse at 30% 20%, black 20%, transparent 70%)',
            }}
          />

          <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="rise">
                <SectionLabel>Home tuition · Kota, Rajasthan</SectionLabel>
              </div>

              <h1
                className="rise mt-6 font-display text-[2.6rem] font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-[4.1rem]"
                style={{ animationDelay: '80ms' }}
              >
                Kota’s home tutors,{' '}
                <span className="relative whitespace-nowrap">
                  <span className="relative z-10">handpicked</span>
                  <span className="absolute inset-x-0 bottom-1 z-0 h-3 bg-marigold/50 sm:bottom-2 sm:h-4" />
                </span>{' '}
                for your child.
              </h1>

              <p
                className="rise mt-6 max-w-xl font-body text-base leading-relaxed text-ink/65 sm:text-lg"
                style={{ animationDelay: '160ms' }}
              >
                Every tutor is personally interviewed by our team. Book a free demo class at home for
                Class 6 to 12, JEE, NEET and droppers — we take care of everything after that.
              </p>

              {/* Search */}
              <form
                onSubmit={handleSearch}
                className="rise mt-9 grid gap-2.5 rounded-2xl border border-ink/10 bg-white p-2.5 shadow-[0_20px_50px_-24px_rgba(31,42,68,0.35)] sm:grid-cols-[1fr_1fr_auto]"
                style={{ animationDelay: '240ms' }}
              >
                <label className="relative">
                  <span className="sr-only">Class</span>
                  <select value={searchClass} onChange={(e) => setSearchClass(e.target.value)} className={selectClass}>
                    <option value="">Any class</option>
                    {CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c === 'Dropper' ? 'Dropper' : `Class ${c}`}
                      </option>
                    ))}
                  </select>
                  <Chevron />
                </label>
                <label className="relative">
                  <span className="sr-only">Subject</span>
                  <select value={searchSubject} onChange={(e) => setSearchSubject(e.target.value)} className={selectClass}>
                    <option value="">Any subject</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <Chevron />
                </label>
                <button
                  type="submit"
                  className="rounded-xl bg-ink px-7 py-3.5 font-body text-sm font-semibold text-sandstone transition-colors hover:bg-ink/90"
                >
                  Find tutors
                </button>
              </form>

              <ul
                className="rise mt-6 flex flex-wrap gap-x-6 gap-y-2 font-body text-sm text-ink/60"
                style={{ animationDelay: '320ms' }}
              >
                {['Free demo class', 'Interview-verified tutors', 'Fees collected at home'].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <svg viewBox="0 0 20 20" className="h-4 w-4 text-sage" fill="currentColor" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Live tutor stack */}
            <div className="rise lg:col-span-5" style={{ animationDelay: '200ms' }}>
              <div className="relative mx-auto max-w-sm lg:max-w-none">
                <div className="relative rounded-[1.75rem] bg-ink p-5 shadow-[0_30px_60px_-30px_rgba(31,42,68,0.6)] sm:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-sandstone/50">
                      Tutors on Nexved
                    </p>
                    <span className="flex items-center gap-2 font-body text-xs text-sandstone/60">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-sage" />
                      </span>
                      Accepting students
                    </span>
                  </div>

                  <div className="space-y-3">
                    {!teachersLoaded &&
                      [0, 1, 2].map((i) => <div key={i} className="h-[86px] animate-pulse rounded-2xl bg-sandstone/10" />)}
                    {teachersLoaded &&
                      heroTeachers.map((t, i) => (
                        <div key={t.firebaseUid} style={{ marginLeft: `${i * 14}px`, marginRight: `${(2 - i) * 14}px` }}>
                          <TutorCard teacher={t} compact />
                        </div>
                      ))}
                    {teachersLoaded && heroTeachers.length === 0 && (
                      <p className="rounded-2xl bg-sandstone/10 p-6 text-center font-body text-sm text-sandstone/70">
                        Tutor profiles are being updated. Call us and we’ll match you personally.
                      </p>
                    )}
                  </div>

                  <Link
                    to="/browse-teachers"
                    className="mt-5 flex items-center justify-between rounded-xl border border-sandstone/15 px-4 py-3 font-body text-sm font-semibold text-sandstone transition-colors hover:border-marigold hover:text-marigold"
                  >
                    {tutorCount > 0 ? `See all ${tutorCount} tutors` : 'Browse tutors'}
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Facts strip ────────────────────────────────────────── */}
        <section className="border-y border-ink/10 bg-white/50 px-4 sm:px-6">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 lg:grid-cols-4">
            {[
              { k: tutorCount > 0 ? `${tutorCount}+` : '—', v: 'Interviewed tutors' },
              { k: '6 – 12', v: 'Every class, plus droppers' },
              { k: '₹0', v: 'For your demo class' },
              { k: '1 : 1', v: 'One hour a day, at home' },
            ].map((f, i) => (
              <div
                key={f.v}
                className={`reveal px-2 py-8 sm:px-6 ${i % 2 === 1 ? 'border-l border-ink/10' : ''} ${
                  i >= 2 ? 'border-t border-ink/10 lg:border-t-0' : ''
                } ${i === 2 ? 'lg:border-l' : ''}`}
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <dt className="font-display text-3xl font-bold text-ink sm:text-4xl">{f.k}</dt>
                <dd className="mt-1 font-body text-sm text-ink/55">{f.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Tutors rail ────────────────────────────────────────── */}
        {railTeachers.length > 0 && (
          <section className="px-4 py-20 sm:px-6 lg:py-28">
            <div className="mx-auto max-w-6xl">
              <div className="reveal flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <SectionLabel>Meet the tutors</SectionLabel>
                  <h2 className="mt-4 max-w-xl font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
                    Real people. Real experience. All in Kota.
                  </h2>
                </div>
                <Link
                  to="/browse-teachers"
                  className="font-body text-sm font-semibold text-ink underline decoration-marigold decoration-2 underline-offset-4 hover:text-marigold"
                >
                  View all tutors
                </Link>
              </div>

              <div className="no-scrollbar -mx-4 mt-10 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
                {railTeachers.map((t, i) => (
                  <div
                    key={t.firebaseUid}
                    className="reveal w-[78%] flex-shrink-0 snap-start sm:w-auto"
                    style={{ transitionDelay: `${(i % 4) * 70}ms` }}
                  >
                    <TutorCard teacher={t} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── How it works ───────────────────────────────────────── */}
        <section className="bg-white/60 px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-12">
            <div className="reveal lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <SectionLabel>How it works</SectionLabel>
                <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
                  From first call to first class in a few days.
                </h2>
                <p className="mt-4 font-body text-base leading-relaxed text-ink/60">
                  You talk to a person, not a form. We stay with you after the tutor starts, too.
                </p>
              </div>
            </div>

            <ol className="relative lg:col-span-7 lg:col-start-6">
              <span className="absolute bottom-6 left-[1.2rem] top-6 w-px bg-ink/15" aria-hidden="true" />
              {STEPS.map((s, i) => (
                <li key={s.title} className="reveal relative flex gap-6 pb-10 last:pb-0" style={{ transitionDelay: `${i * 60}ms` }}>
                  <span className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-ink/15 bg-sandstone font-display text-sm font-bold text-ink">
                    {i + 1}
                  </span>
                  <div className="pt-1.5">
                    <h3 className="font-display text-xl font-semibold text-ink">{s.title}</h3>
                    <p className="mt-1.5 font-body leading-relaxed text-ink/60">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Why us ─────────────────────────────────────────────── */}
        <section className="bg-ink px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="reveal max-w-2xl">
              <SectionLabel light>Why families choose us</SectionLabel>
              <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-sandstone sm:text-4xl">
                A tuition service that stays accountable after the demo.
              </h2>
            </div>

            <div className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2">
              {PROMISES.map((p, i) => (
                <div key={p.title} className="reveal border-t border-sandstone/15 pt-6" style={{ transitionDelay: `${(i % 2) * 80}ms` }}>
                  <p className="font-display text-sm font-bold text-marigold">0{i + 1}</p>
                  <h3 className="mt-3 font-display text-2xl font-semibold text-sandstone">{p.title}</h3>
                  <p className="mt-3 max-w-md font-body leading-relaxed text-sandstone/60">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ────────────────────────────────────────────── */}
        <section className="px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="reveal flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <SectionLabel>Fees</SectionLabel>
                <h2 className="mt-4 max-w-xl font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
                  Simple monthly fees. No registration charges.
                </h2>
              </div>
              <Link
                to="/fee-structure"
                className="font-body text-sm font-semibold text-ink underline decoration-marigold decoration-2 underline-offset-4 hover:text-marigold"
              >
                Full fee structure
              </Link>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {FEE_GROUPS.map((group, i) => (
                <div
                  key={group.id}
                  className="reveal flex flex-col rounded-2xl border border-ink/10 bg-white p-7 transition-shadow duration-300 hover:shadow-[0_16px_40px_-20px_rgba(31,42,68,0.3)]"
                  style={{ transitionDelay: `${i * 70}ms` }}
                >
                  <p className="font-body text-xs font-semibold uppercase tracking-[0.15em] text-ink/45">{group.classes}</p>
                  <h3 className="mt-2 font-display text-2xl font-bold text-ink">{group.name}</h3>
                  <p className="mt-1 font-body text-sm text-ink/55">{group.note}</p>
                  <ul className="mt-5 flex-1 divide-y divide-ink/5 border-y border-ink/5">
                    {FEE_PACKAGES.filter((p) => p.group === group.id).map((p) => (
                      <li key={p.value} className="flex items-baseline justify-between gap-3 py-2.5">
                        <span className="font-body text-sm text-ink/70">{p.label}</span>
                        <span className="whitespace-nowrap font-display text-lg font-bold text-ink">
                          {formatINR(p.fee)}
                          <span className="font-body text-xs font-normal text-ink/40">/mo</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 font-body text-xs text-ink/50">1 hour a day · at your home</p>
                </div>
              ))}
            </div>

            <div className="reveal mt-4 flex flex-col gap-4 rounded-2xl bg-marigold/15 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div className="flex items-center gap-5">
                <p className="flex-shrink-0 font-display text-3xl font-bold text-ink sm:text-4xl">{GROUP_DISCOUNT_PCT}% off</p>
                <div>
                  <p className="font-display text-lg font-semibold text-ink">Group tuition for 2–3 students</p>
                  <p className="mt-1 font-body text-sm text-ink/65">
                    Study with a sibling or friend and each student pays {GROUP_DISCOUNT_PCT}% less — e.g.{' '}
                    {formatINR(12000)} becomes {formatINR(groupFee(12000))} per student.
                  </p>
                </div>
              </div>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 rounded-full bg-ink px-6 py-3 text-center font-body text-sm font-semibold text-sandstone transition-colors hover:bg-ink/90"
              >
                Ask about group fees
              </a>
            </div>
          </div>
        </section>

        {/* ── Areas ──────────────────────────────────────────────── */}
        <section className="border-y border-ink/10 bg-white/50 px-4 py-20 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-12 lg:items-center">
            <div className="reveal lg:col-span-5">
              <SectionLabel>Coverage</SectionLabel>
              <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
                Wherever you are in Kota, we’ll find a tutor near you.
              </h2>
            </div>
            <ul className="reveal flex flex-wrap gap-2 lg:col-span-7">
              {AREAS.map((a) => (
                <li key={a} className="rounded-full border border-ink/12 bg-sandstone/60 px-4 py-2 font-body text-sm text-ink/75">
                  {a}
                </li>
              ))}
              <li className="rounded-full bg-ink px-4 py-2 font-body text-sm font-medium text-sandstone">
                + every other locality
              </li>
            </ul>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────── */}
        <section className="px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-12">
            <div className="reveal lg:col-span-4">
              <SectionLabel>Questions</SectionLabel>
              <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
                Things parents usually ask.
              </h2>
              <p className="mt-4 font-body text-ink/60">
                Something else on your mind?{' '}
                <a href={`tel:${CONTACTS[0].tel}`} className="font-semibold text-ink underline decoration-marigold decoration-2 underline-offset-4">
                  Give us a call
                </a>
                .
              </p>
            </div>
            <div className="reveal divide-y divide-ink/10 border-y border-ink/10 lg:col-span-8">
              {FAQS.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-lg font-semibold text-ink [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink/60 transition-transform duration-300 group-open:rotate-45">
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M10 4v12M4 10h12" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-3 max-w-2xl pr-12 font-body leading-relaxed text-ink/65">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────────── */}
        <section className="px-4 pb-20 sm:px-6 lg:pb-28">
          <div className="reveal relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-ink px-6 py-14 sm:px-14 sm:py-16">
            <svg
              viewBox="0 0 200 200"
              className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 opacity-[0.07] sm:h-80 sm:w-80"
              aria-hidden="true"
            >
              <path d="M40 160V40M160 40v120" stroke="#F2ECDD" strokeWidth="18" strokeLinecap="round" fill="none" />
              <path d="M40 40l120 120" stroke="#E8A33D" strokeWidth="18" strokeLinecap="round" fill="none" />
            </svg>
            <div className="relative grid gap-10 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <h2 className="font-display text-3xl font-bold leading-tight text-sandstone sm:text-5xl">
                  Book a free demo class this week.
                </h2>
                <p className="mt-4 max-w-md font-body text-base text-sandstone/60 sm:text-lg">
                  Tell us the class and subject. We’ll call you back and set up a demo at your home.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/browse-teachers"
                    className="rounded-full bg-marigold px-7 py-3.5 text-center font-body text-sm font-semibold text-ink transition-colors hover:bg-marigold/90"
                  >
                    Find a tutor
                  </Link>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-sandstone/25 px-7 py-3.5 text-center font-body text-sm font-semibold text-sandstone transition-colors hover:border-sandstone/60"
                  >
                    Message us on WhatsApp
                  </a>
                </div>
              </div>
              <div className="space-y-3 lg:col-span-5">
                {CONTACTS.map((c) => (
                  <a
                    key={c.tel}
                    href={`tel:${c.tel}`}
                    className="flex items-center justify-between rounded-2xl border border-sandstone/10 bg-sandstone/5 px-5 py-4 transition-colors hover:border-marigold/50"
                  >
                    <span>
                      <span className="block font-body text-xs uppercase tracking-[0.15em] text-sandstone/45">Call</span>
                      <span className="mt-0.5 block font-display text-lg font-semibold text-sandstone">{c.name}</span>
                    </span>
                    <span className="font-body text-sm font-medium text-marigold">{c.display}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-ink/10 px-4 pb-24 pt-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Logo />
              <p className="mt-4 max-w-xs font-body text-sm leading-relaxed text-ink/55">
                Interviewed home tutors for every class, across Kota, Rajasthan.
              </p>
            </div>
            <div className="lg:col-span-3">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.15em] text-ink/40">Explore</p>
              <ul className="mt-4 space-y-2.5 font-body text-sm">
                <li><Link to="/browse-teachers" className="text-ink/70 hover:text-ink">Find a tutor</Link></li>
                <li><Link to="/fee-structure" className="text-ink/70 hover:text-ink">Fee structure</Link></li>
                <li><Link to="/login" className="text-ink/70 hover:text-ink">Join as a tutor</Link></li>
                <li><Link to="/login" className="text-ink/70 hover:text-ink">Log in</Link></li>
              </ul>
            </div>
            <div className="lg:col-span-4">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.15em] text-ink/40">Contact</p>
              <ul className="mt-4 space-y-2.5 font-body text-sm">
                {CONTACTS.map((c) => (
                  <li key={c.tel} className="flex justify-between gap-4 sm:block">
                    <span className="text-ink/70">{c.name}</span>{' '}
                    <a href={`tel:${c.tel}`} className="font-medium text-ink hover:text-marigold">{c.display}</a>
                  </li>
                ))}
                <li className="pt-1 text-ink/55">Kota, Rajasthan</li>
              </ul>
            </div>
          </div>
          <div className="mt-14 flex flex-col gap-2 border-t border-ink/10 pt-6 font-body text-xs text-ink/45 sm:flex-row sm:justify-between">
            <p>© {new Date().getFullYear()} Nexved · Kota Tuition Hub</p>
            <p>Founded by Ankur Yadav &amp; Sanskar Thakur</p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.4)] transition-transform hover:scale-105"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
          <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.04 21.5h-.01a9.45 9.45 0 01-4.82-1.32l-.35-.2-3.58.94.96-3.49-.23-.36a9.44 9.44 0 01-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.91.99 6.7 2.78a9.41 9.41 0 012.77 6.7c0 5.22-4.25 9.46-9.47 9.46zm8.06-17.53A11.33 11.33 0 0012.04.62C5.76.62.65 5.73.65 12.01c0 2.01.52 3.97 1.52 5.69L.55 23.6l6.04-1.58a11.36 11.36 0 005.44 1.39h.01c6.28 0 11.39-5.11 11.39-11.39 0-3.04-1.19-5.9-3.33-8.05z" />
        </svg>
      </a>
    </div>
  );
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 8l5 5 5-5" />
    </svg>
  );
}

export default Home;
