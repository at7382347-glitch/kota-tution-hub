import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FEE_GROUPS, FEE_PACKAGES, GROUP_DISCOUNT, formatINR, groupFee } from '../fees';

const DISCOUNT_PCT = Math.round(GROUP_DISCOUNT * 100);

function FeeStructure() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-sandstone px-4 py-10 sm:px-6 sm:py-14">
      <Helmet>
        <title>Fee Structure | Nexve — Kota Tuition Hub</title>
        <meta
          name="description"
          content="Home tuition fees in Kota for Class 6 to 12, JEE, NEET and droppers. One hour a day at home. Group tuition: 40% off for each student."
        />
      </Helmet>

      <main className="mx-auto max-w-4xl">
        <p className="flex items-center gap-3 font-body text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">
          <span className="h-px w-8 bg-marigold" />
          Fees
        </p>
        <h1 className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">Fee Structure</h1>
        <p className="mt-3 max-w-2xl font-body text-base text-ink/60">
          Monthly fees for offline home tuition, one hour a day. No registration charges — the demo class is free.
        </p>

        {/* Group discount callout */}
        <div className="mt-8 flex flex-col gap-2 rounded-2xl bg-marigold/15 p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
          <p className="font-display text-3xl font-bold text-ink">{DISCOUNT_PCT}% off</p>
          <p className="font-body text-sm text-ink/70 sm:text-base">
            <span className="font-semibold text-ink">Group tuition:</span> when 2 or 3 students study together with one
            tutor, each student pays {DISCOUNT_PCT}% less. Maximum 3 students per group.
          </p>
        </div>

        <div className="mt-10 space-y-10">
          {FEE_GROUPS.map((group) => {
            const rows = FEE_PACKAGES.filter((p) => p.group === group.id);
            return (
              <section key={group.id}>
                <div className="flex items-baseline justify-between gap-4 border-b border-ink/10 pb-3">
                  <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">{group.name}</h2>
                  <p className="font-body text-xs text-ink/45 sm:text-sm">{group.classes}</p>
                </div>

                {/* Desktop / tablet table */}
                <div className="mt-4 hidden overflow-hidden rounded-2xl border border-ink/10 bg-white sm:block">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-sandstone/60 font-body text-xs uppercase tracking-wide text-ink/50">
                      <tr>
                        <th className="px-6 py-3 font-medium">Class</th>
                        <th className="px-6 py-3 font-medium">Solo (1 student)</th>
                        <th className="px-6 py-3 font-medium">Group (per student)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5">
                      {rows.map((row) => (
                        <tr key={row.value} className="transition-colors hover:bg-sandstone/30">
                          <td className="px-6 py-4 font-body font-medium text-ink">{row.label}</td>
                          <td className="whitespace-nowrap px-6 py-4 font-display text-base font-bold text-ink">
                            {formatINR(row.fee)}
                            <span className="font-body text-xs font-normal text-ink/45">/month</span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 font-display text-base font-bold text-sage">
                            {formatINR(groupFee(row.fee))}
                            <span className="font-body text-xs font-normal text-ink/45">/month</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="mt-4 grid gap-3 sm:hidden">
                  {rows.map((row) => (
                    <div key={row.value} className="rounded-xl border border-ink/10 bg-white px-4 py-3.5">
                      <p className="font-body text-sm font-semibold text-ink">{row.label}</p>
                      <div className="mt-2 flex items-end justify-between gap-3">
                        <p className="font-display text-lg font-bold text-ink">
                          {formatINR(row.fee)}
                          <span className="font-body text-xs font-normal text-ink/45">/month</span>
                        </p>
                        <p className="text-right font-body text-xs text-ink/50">
                          Group:{' '}
                          <span className="font-display text-sm font-bold text-sage">{formatINR(groupFee(row.fee))}</span>
                          /student
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col items-start gap-4 rounded-2xl bg-ink p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <p className="font-display text-xl font-semibold text-sandstone">Book a free demo class at home.</p>
          <Link
            to="/browse-teachers"
            className="rounded-full bg-marigold px-6 py-3 font-body text-sm font-semibold text-ink transition-colors hover:bg-marigold/90"
          >
            Find a tutor
          </Link>
        </div>
      </main>
    </div>
  );
}

export default FeeStructure;
