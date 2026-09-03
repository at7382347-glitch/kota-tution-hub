import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

function Home() {
  return (
    <div className="bg-sandstone min-h-screen overflow-x-hidden">
      <Helmet>
        <title>Kota Tuition Hub - Find the Best Home Tutors in Kota, Rajasthan</title>
        <meta name="description" content="Kota Tuition Hub — Find the best home tutors in Kota, Rajasthan for IIT-JEE, NEET, and board exam preparation." />
        <meta property="og:title" content="Kota Tuition Hub - Find the Best Home Tutors in Kota, Rajasthan" />
        <meta property="og:description" content="Kota Tuition Hub — Find the best home tutors in Kota, Rajasthan for IIT-JEE, NEET, and board exam preparation." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_IN" />
      </Helmet>
      <main>
        {/* ── Hero Section ─────────────────────────────────────────── */}
        <section 
        className="relative overflow-hidden px-4 sm:px-6 md:px-8 lg:px-24 pt-20 pb-28 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')" }}
      >
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-ink/80 sm:bg-ink/70 bg-gradient-to-b from-ink/90 to-ink/60"></div>
        
        {/* Subtle decorative circle */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-marigold/10" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sage/10" />

        <div className="relative mx-auto max-w-4xl text-center sm:text-left">
          <p className="font-body mb-4 inline-block rounded-full bg-marigold/15 border border-marigold/20 px-4 py-1.5 text-sm font-medium tracking-wide text-sandstone/90">
            Connecting Kota's students with verified tutors
          </p>

          <h1 className="font-display text-sandstone text-3xl font-bold leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Find the Best Home Tutors
            <span className="block text-marigold">in Kota, Rajasthan</span>
          </h1>

          <p className="font-body text-sandstone/80 mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg md:text-xl">
            Whether you're preparing for IIT-JEE, NEET, or board exams — connect
            with experienced, verified home tutors right in your neighbourhood.
          </p>

          <p className="font-body text-sandstone/60 mx-auto mt-4 max-w-lg text-sm italic leading-relaxed sm:text-base">
            Your personal tutor, guiding you one-on-one — because every student learns differently.
          </p>

          <div className="mt-10 flex flex-col items-center sm:items-start justify-center sm:justify-start gap-4 sm:flex-row">
            <Link
              to="/browse-teachers"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-marigold px-8 py-3.5 text-base font-semibold text-ink shadow-lg shadow-marigold/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-marigold/90 hover:shadow-xl hover:shadow-marigold/30 active:translate-y-0 sm:w-auto sm:text-lg"
            >
              Browse Teachers
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="font-body inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-sandstone/30 bg-sandstone/5 backdrop-blur-sm px-8 py-3.5 text-base font-semibold text-sandstone transition-all duration-200 hover:bg-sandstone/10 hover:border-sandstone/50 sm:w-auto sm:text-lg"
            >
              I'm a Teacher
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust Banner ─────────────────────────────────────────── */}
      <section className="border-y border-ink/10 bg-ink/[0.03] px-4 sm:px-6 md:px-8 lg:px-24 py-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-display text-lg sm:text-xl font-medium text-ink/80">
            A new platform built to connect Kota's students with genuinely verified, experienced tutors.
          </p>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 md:px-8 lg:px-24 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-ink text-center text-2xl font-bold sm:text-3xl md:text-4xl">
            How It Works
          </h2>
          <p className="font-body text-ink/60 mx-auto mt-3 max-w-xl text-center text-base sm:text-lg">
            Three simple steps to find your perfect tutor
          </p>

          <div className="mt-14 grid gap-10 grid-cols-1 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Post Your Requirement',
                desc: 'Tell us the subject, class, preferred timings, and your area in Kota.',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'Get Matched',
                desc: 'We connect you with verified, experienced tutors who fit your needs.',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Start Learning',
                desc: 'Take a free demo class. If you\'re happy, begin regular sessions.',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative rounded-2xl border border-ink/8 bg-white/60 p-8 backdrop-blur-sm transition-all duration-300 hover:border-marigold/30 hover:shadow-lg hover:shadow-marigold/10 hover:-translate-y-1"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-marigold/15 text-marigold transition-colors duration-300 group-hover:bg-marigold group-hover:text-ink">
                  {item.icon}
                </div>
                <span className="font-mono text-xs font-medium tracking-widest text-ink/30">
                  STEP {item.step}
                </span>
                <h3 className="font-display text-ink mt-2 text-lg font-semibold sm:text-xl">
                  {item.title}
                </h3>
                <p className="font-body text-ink/60 mt-2 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Subjects We Cover ────────────────────────────────────── */}
      <section className="bg-ink/5 border-y border-ink/8 px-4 sm:px-6 md:px-8 lg:px-24 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-ink text-center text-2xl font-bold sm:text-3xl md:text-4xl">
            Subjects We Cover
          </h2>
          <p className="font-body mx-auto mt-3 max-w-xl text-center text-base text-ink/60 sm:text-lg">
            From school boards to competitive exams
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {[
              'Physics', 'Chemistry', 'Mathematics', 'Biology',
              'English', 'Hindi', 'Social Science', 'Computer Science',
              'IIT-JEE Prep', 'NEET Prep', 'Board Exams', 'Olympiads',
            ].map((subject, i) => (
              <span
                key={subject}
                className={`font-body rounded-full px-5 py-2 text-sm font-medium transition-colors duration-200 cursor-default ${
                  i === 7
                    ? 'bg-marigold text-ink border border-marigold shadow-sm shadow-marigold/20'
                    : 'bg-white text-ink/70 border border-ink/12 hover:border-marigold/40 hover:bg-marigold/10 hover:text-marigold'
                }`}
              >
                {subject}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Teaser ───────────────────────────────────────── */}
      <section className="px-4 sm:px-6 md:px-8 lg:px-24 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-ink text-2xl font-bold sm:text-3xl md:text-4xl">
            Affordable &amp; Transparent Pricing
          </h2>
          <p className="font-body text-ink/60 mx-auto mt-3 max-w-xl text-base sm:text-lg">
            No hidden fees. Pay the tutor directly after a free demo class.
          </p>

          <div className="mt-12 grid gap-6 grid-cols-1 md:grid-cols-3">
            {[
              { title: 'Foundation (Class 6-8)', price: 'From ₹6,500', period: '/month', desc: 'Build a strong academic base.' },
              { title: 'Board Exams (Class 9-12)', price: 'From ₹7,500', period: '/month', desc: 'Score high with expert guidance.' },
              { title: 'JEE / NEET Prep', price: 'From ₹10,000', period: '/month', desc: 'Advanced coaching & dropper batches.' },
            ].map((tier) => (
              <div
                key={tier.title}
                className="rounded-2xl border border-ink/8 bg-white/60 p-6 backdrop-blur-sm flex flex-col"
              >
                <p className="font-body text-sm font-medium text-ink/50">{tier.title}</p>
                <p className="font-mono mt-2 text-2xl font-semibold text-ink sm:text-3xl">
                  {tier.price}
                  <span className="text-base font-normal text-ink/40">{tier.period}</span>
                </p>
                <p className="font-body mt-2 text-sm text-ink/60">{tier.desc}</p>
              </div>
            ))}
          </div>

          <p className="font-body mt-6 text-sm text-ink/40">
            All packages are for offline home tuition. Free demo class included.
          </p>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 md:px-8 lg:px-24 pb-24">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-ink to-ink/90 px-6 py-10 text-center sm:px-16 sm:py-14">
          {/* Maroon accent — used sparingly */}
          <div className="pointer-events-none absolute -top-10 right-10 h-32 w-32 rounded-full bg-maroon/20 blur-2xl" />

          <h2 className="font-display text-2xl font-bold text-sandstone sm:text-3xl md:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="font-body mx-auto mt-4 max-w-lg text-base text-sandstone/70 sm:text-lg">
            Connect with Kota's best verified home tutors to achieve your academic goals.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-marigold px-8 py-3.5 text-base font-semibold text-ink shadow-lg shadow-marigold/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-marigold/90 hover:shadow-xl sm:w-auto sm:text-lg"
            >
              Get Started — It's Free
            </Link>
            <div className="flex flex-col gap-2 sm:gap-1 mt-2 sm:mt-0 sm:ml-4">
              <a
                href="tel:+916206105858"
                className="font-mono inline-flex w-full items-center justify-center sm:justify-start gap-2 text-base text-sandstone/70 transition-colors hover:text-marigold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                Ankur: +91 6206105858
              </a>
              <a
                href="tel:+919536783342"
                className="font-mono inline-flex w-full items-center justify-center sm:justify-start gap-2 text-base text-sandstone/70 transition-colors hover:text-marigold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                Sanskar: +91 9536783342
              </a>
            </div>
          </div>
        </div>
      </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="bg-ink px-4 sm:px-6 md:px-8 lg:px-24 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between">
            {/* Left — Brand */}
            <div className="text-center sm:text-left">
              <p className="font-display text-xl font-bold text-sandstone">
                Kota Tuition Hub
              </p>
              <p className="font-body mt-1 text-sm text-sandstone/50">
                Founded by Ankur Yadav &amp; Sanskar Thakur
              </p>
            </div>

            {/* Right — Contact */}
            <div className="text-center sm:text-right">
              <p className="font-body text-xs font-medium uppercase tracking-wider text-sandstone/40">
                For any queries
              </p>
              <div className="mt-2 flex flex-col gap-1.5">
                <div className="flex items-center justify-center gap-2 sm:justify-end">
                  <span className="font-body text-sm text-sandstone/70">Ankur Yadav</span>
                  <a href="tel:+916206105858" className="font-mono text-sm text-marigold hover:text-marigold/80 transition-colors">+91 6206105858</a>
                </div>
                <div className="flex items-center justify-center gap-2 sm:justify-end">
                  <span className="font-body text-sm text-sandstone/70">Sanskar Thakur</span>
                  <a href="tel:+919536783342" className="font-mono text-sm text-marigold hover:text-marigold/80 transition-colors">+91 9536783342</a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom line */}
          <div className="mt-8 border-t border-sandstone/10 pt-6 text-center">
            <p className="font-body text-xs text-sandstone/30">
              &copy; {new Date().getFullYear()} Kota Tuition Hub. Made with ❤️ in Kota, Rajasthan.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
