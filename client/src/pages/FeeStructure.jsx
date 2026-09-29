import { Helmet } from 'react-helmet-async';

const FEES = [
  { cls: 'Class 6', detail: 'All subjects', fee: 7500 },
  { cls: 'Class 7', detail: 'All subjects', fee: 7500 },
  { cls: 'Class 8', detail: 'All subjects', fee: 8500 },
  { cls: 'Class 9 (School/Board)', detail: 'School / Board', fee: 8500 },
  { cls: 'Class 10 (School/Board)', detail: 'School / Board', fee: 10000 },
  { cls: 'Class 9 & 10 (JEE/NEET Foundation)', detail: 'JEE/NEET Foundation', fee: 10000 },
  { cls: 'Class 11 (School/Board)', detail: 'School / Board', fee: 10000 },
  { cls: 'Class 11 (JEE/NEET)', detail: 'JEE / NEET', fee: 12000 },
  { cls: 'Class 12 (School/Board)', detail: 'School / Board', fee: 10000 },
  { cls: 'Class 12 (JEE/NEET)', detail: 'JEE / NEET', fee: 12000 },
  { cls: 'Dropper (JEE/NEET)', detail: 'JEE / NEET', fee: 12000 },
];

function formatINR(amount) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function FeeStructure() {
  return (
    <div className="min-h-screen bg-sandstone py-8 px-4 sm:px-6 overflow-x-hidden">
      <Helmet>
        <title>Fee Structure | Kota Tuition Hub</title>
        <meta
          name="description"
          content="View Kota Tuition Hub fee structure for home tuition in Kota, Rajasthan. Transparent monthly pricing for Class 6 to Dropper."
        />
      </Helmet>
      <main className="max-w-3xl mx-auto">
        <div className="mb-6 text-center sm:text-left">
          <h1 className="font-display text-ink text-2xl sm:text-3xl font-bold">Fee Structure</h1>
          <p className="font-body text-ink/50 mt-1 text-sm sm:text-base">
            Transparent monthly pricing. Offline home tuition, 1 hour/day.
          </p>
        </div>

        {/* Desktop / tablet table */}
        <div className="hidden sm:block bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-ink/8 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[560px]">
              <thead className="bg-sandstone/70 text-ink/50 text-xs uppercase font-medium font-display">
                <tr>
                  <th className="px-6 py-3">Class</th>
                  <th className="px-6 py-3">Fee</th>
                  <th className="px-6 py-3">Schedule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {FEES.map((row) => (
                  <tr key={row.cls} className="hover:bg-sandstone/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-ink font-body">{row.cls}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-ink whitespace-nowrap">
                      {formatINR(row.fee)}/month
                    </td>
                    <td className="px-6 py-4 text-ink/60 font-body">1 hour/day</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="grid grid-cols-1 gap-3 sm:hidden">
          {FEES.map((row) => (
            <div
              key={row.cls}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-ink/8 px-4 py-3.5"
            >
              <p className="font-body text-sm font-semibold text-ink">{row.cls}</p>
              <p className="mt-1 font-mono text-sm font-bold text-ink">
                {formatINR(row.fee)}
                <span className="font-body font-normal text-ink/50">/month</span>
              </p>
              <p className="mt-0.5 font-body text-xs text-ink/50">1 hour/day</p>
            </div>
          ))}
        </div>

        {/* Static info note */}
        <div className="mt-6 rounded-2xl border border-marigold/30 bg-marigold/10 px-4 py-4 sm:px-6 text-center sm:text-left">
          <p className="font-body text-sm sm:text-base text-ink">
            Group Tuition Discount: Up to 3 students can split the fee per session!
          </p>
        </div>
      </main>
    </div>
  );
}

export default FeeStructure;
