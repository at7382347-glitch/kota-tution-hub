import { useState } from 'react';
import { Link } from 'react-router-dom';
import { INTRO_VIDEO } from '../media';


const POINTS = ['Ghar pe one-on-one padhai', 'Har tutor ka interview hum khud lete hain', 'Pehli demo class bilkul free'];

// Home-page explainer. Only the small poster image loads with the page (lazily);
// the 1.7 MB video is fetched only after the visitor taps play.
function VideoIntro() {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="px-4 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-12">
        <div className="reveal lg:col-span-6">
          <p className="flex items-center gap-3 font-body text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">
            <span className="h-px w-8 bg-marigold" />1 minute mein samjhiye
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Coaching ki bheed se personal tutor tak.
          </h2>
          <p className="mt-4 max-w-md font-body text-base leading-relaxed text-ink/60">
            200 bachchon ki class mein aapka bachcha peeche reh jaata hai. Dekhiye Nexved kaise ghar pe uska apna tutor laata hai.
          </p>
          <ul className="mt-6 space-y-2.5">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-3 font-body text-sm text-ink/75">
                <svg viewBox="0 0 20 20" className="h-4 w-4 flex-shrink-0 text-sage" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {p}
              </li>
            ))}
          </ul>
          <Link
            to="/browse-teachers"
            className="mt-8 hidden rounded-full bg-ink px-7 py-3.5 font-body text-sm font-semibold text-sandstone transition-colors hover:bg-ink/90 lg:inline-block"
          >
            Book a free demo
          </Link>
        </div>

        <div className="reveal lg:col-span-5 lg:col-start-8">
          {/* Phone frame */}
          <div className="mx-auto w-full max-w-[300px] rounded-[2.6rem] bg-ink p-2.5 shadow-[0_40px_80px_-40px_rgba(31,42,68,0.7)]">
            <div className="relative aspect-[9/16] overflow-hidden rounded-[2.1rem] bg-sandstone">
              {playing ? (
                <video
                  src={INTRO_VIDEO.src}
                  poster={INTRO_VIDEO.poster}
                  autoPlay
                  controls
                  playsInline
                  preload="auto"
                  className="h-full w-full object-cover"
                >
                  Your browser can’t play this video.
                </video>
              ) : (
                <button
                  type="button"
                  onClick={() => setPlaying(true)}
                  aria-label="Play the 1-minute Nexved video (with sound)"
                  className="group absolute inset-0 h-full w-full cursor-pointer"
                >
                  <img
                    src={INTRO_VIDEO.poster}
                    alt="Hello, Kota waalon! Kya aapke bachche ko chahiye apna personal tutor?"
                    width={540}
                    height={960}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-[18%] flex flex-col items-center gap-3">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-marigold text-ink shadow-[0_10px_30px_-8px_rgba(31,42,68,0.5)] transition-transform duration-300 group-hover:scale-110">
                      <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7" fill="currentColor" aria-hidden="true">
                        <path d="M8 5.5v13a1 1 0 001.5.86l10.5-6.5a1 1 0 000-1.72L9.5 4.64A1 1 0 008 5.5z" />
                      </svg>
                    </span>
                    <span className="rounded-full bg-ink/85 px-3 py-1 font-body text-xs font-semibold text-sandstone">
                      ▶ 1:02 · with sound
                    </span>
                  </span>
                </button>
              )}
            </div>
          </div>
          <Link
            to="/browse-teachers"
            className="mt-8 block rounded-full bg-ink px-7 py-3.5 text-center font-body text-sm font-semibold text-sandstone transition-colors hover:bg-ink/90 lg:hidden"
          >
            Book a free demo
          </Link>
        </div>
      </div>
    </section>
  );
}

export default VideoIntro;
