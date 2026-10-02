import { useState } from 'react';
import { adminFetch } from '../../api';

const PENALTY = 5000;

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const daysLeft = (d) => Math.max(0, Math.ceil((new Date(d) - Date.now()) / 86400000));

function Section({ title, hint, count, children }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-ink/8 overflow-hidden">
      <div className="px-6 py-4 border-b border-ink/8 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
          {hint && <p className="font-body text-xs text-ink/50 mt-0.5">{hint}</p>}
        </div>
        <span className="text-xs font-semibold font-body px-2 py-0.5 rounded-full bg-ink/8 text-ink/60">{count}</span>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

function Empty({ children }) {
  return <p className="font-body text-sm text-ink/40">{children}</p>;
}

/**
 * Admin view for the 15-day notice policy:
 * tuitions in their notice period, tuitions that need a new teacher,
 * running tuitions (with "left without notice"), and removed teachers' penalties.
 */
function NoticesTab({ requests, removedTeachers, onChanged }) {
  const [busy, setBusy] = useState(false);

  const inNotice = requests
    .filter((r) => r.tuitionStatus === 'notice')
    .sort((a, b) => new Date(a.noticeEndDate) - new Date(b.noticeEndDate));
  const needTeacher = requests.filter((r) => r.needsNewTeacher && r.tuitionStatus !== 'notice');
  const running = requests.filter(
    (r) => r.demoStatus === 'converted' && !r.teacherRemoved && ['active', 'notice', undefined].includes(r.tuitionStatus)
  );

  const run = async (fn, okMessage) => {
    setBusy(true);
    try {
      const res = await fn();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Request failed');
      if (okMessage || data.message) alert(okMessage || data.message);
      await onChanged();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const cancelNotice = (r) =>
    run(() => adminFetch(`/api/requests/${r._id}/notice`, { method: 'DELETE' }), 'Notice cancelled — tuition is running again.');

  const markEnded = (r) =>
    window.confirm(`Mark the tuition of ${r.studentName || 'this student'} with ${r.teacherName || 'this tutor'} as ended?`) &&
    run(() =>
      adminFetch(`/api/requests/${r._id}/tuition-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tuitionStatus: 'ended' }),
      })
    );

  const leftWithoutNotice = (r) => {
    const ok = window.confirm(
      `${r.teacherName || 'This tutor'} left without notice?\n\n` +
        `This will:\n• record a ₹${PENALTY.toLocaleString('en-IN')} penalty\n• permanently DELETE their account\n` +
        `• block them from registering again\n• mark their students as needing a new tutor\n\nThis cannot be undone.`
    );
    if (!ok) return;
    const reason = window.prompt('Reason (optional):', 'Left tuition without 15-day notice');
    if (reason === null) return;
    run(() =>
      adminFetch(`/api/admin/teachers/${r.teacherFirebaseUid}/left-without-notice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: r._id, reason }),
      })
    );
  };

  const setPenalty = (t, penaltyStatus) =>
    run(() =>
      adminFetch(`/api/admin/removed-teachers/${t._id}/penalty`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ penaltyStatus }),
      }),
      penaltyStatus === 'paid' ? 'Penalty marked as paid.' : 'Penalty marked as unpaid.'
    );

  const btn = 'px-3 py-1.5 rounded-lg text-xs font-semibold font-body cursor-pointer disabled:opacity-40 transition-colors';

  return (
    <div className="space-y-6">
      <Section title="Notice period" hint="Tutors leaving soon — arrange a replacement before the last day." count={inNotice.length}>
        {inNotice.length === 0 ? (
          <Empty>No tutor is serving notice right now.</Empty>
        ) : (
          <div className="space-y-3">
            {inNotice.map((r) => {
              const left = daysLeft(r.noticeEndDate);
              return (
                <div key={r._id} className="rounded-lg border border-marigold/40 bg-marigold/5 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="font-body text-sm text-ink">
                      <p>
                        <span className="font-semibold">{r.teacherName || 'Tutor'}</span> → {r.studentName || 'Student'} ·{' '}
                        {r.subject} · {r.area || 'Kota'}
                      </p>
                      <p className="text-xs text-ink/60 mt-1">
                        Notice {formatDate(r.noticeGivenAt)} · Last class{' '}
                        <span className="font-semibold text-ink">{formatDate(r.noticeEndDate)}</span>
                      </p>
                      {r.noticeReason && <p className="text-xs text-ink/60 mt-1 italic">“{r.noticeReason}”</p>}
                    </div>
                    <span
                      className={`text-xs font-bold font-body px-2.5 py-1 rounded-full ${
                        left <= 3 ? 'bg-maroon/15 text-maroon' : 'bg-marigold/20 text-ink'
                      }`}
                    >
                      {left === 0 ? 'Ends today' : `${left} day${left === 1 ? '' : 's'} left`}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button disabled={busy} onClick={() => cancelNotice(r)} className={`${btn} bg-white border border-ink/15 text-ink hover:bg-ink/5`}>
                      Cancel notice
                    </button>
                    <button disabled={busy} onClick={() => markEnded(r)} className={`${btn} bg-ink text-white hover:bg-ink/90`}>
                      Mark tuition ended
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section
        title="Needs a new tutor"
        hint="The tutor left or was removed. Assign a replacement from the Requests tab."
        count={needTeacher.length}
      >
        {needTeacher.length === 0 ? (
          <Empty>Every student has a tutor.</Empty>
        ) : (
          <ul className="divide-y divide-ink/5">
            {needTeacher.map((r) => (
              <li key={r._id} className="py-2.5 font-body text-sm text-ink flex flex-wrap justify-between gap-2">
                <span>
                  <span className="font-semibold">{r.studentName || 'Student'}</span> · {r.subject} · Class {r.classLevel || '—'} ·{' '}
                  {r.area || 'Kota'}
                </span>
                <span className="text-xs text-ink/50">
                  {r.tuitionStatus === 'left_without_notice' ? 'Tutor left without notice' : `Previous tutor: ${r.teacherName || '—'}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Running tuitions"
        hint={`If a tutor stops teaching without notice, use “Left without notice” (₹${PENALTY.toLocaleString('en-IN')} penalty + removal).`}
        count={running.length}
      >
        {running.length === 0 ? (
          <Empty>No running tuitions yet.</Empty>
        ) : (
          <ul className="divide-y divide-ink/5">
            {running.map((r) => (
              <li key={r._id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <span className="font-body text-sm text-ink">
                  <span className="font-semibold">{r.teacherName || 'Tutor'}</span> → {r.studentName || 'Student'} · {r.subject}
                  {r.tuitionStatus === 'notice' && <span className="ml-2 text-xs text-marigold font-semibold">(serving notice)</span>}
                </span>
                <button
                  disabled={busy || !r.teacherFirebaseUid}
                  onClick={() => leftWithoutNotice(r)}
                  className={`${btn} bg-maroon/10 text-maroon hover:bg-maroon hover:text-white`}
                >
                  Left without notice
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Removed tutors" hint="Removed for leaving without notice. They cannot register again." count={removedTeachers.length}>
        {removedTeachers.length === 0 ? (
          <Empty>No tutor has been removed.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-body">
              <thead className="text-xs uppercase text-ink/40">
                <tr>
                  <th className="py-2 pr-4 font-medium">Tutor</th>
                  <th className="py-2 pr-4 font-medium">Contact</th>
                  <th className="py-2 pr-4 font-medium">Removed</th>
                  <th className="py-2 pr-4 font-medium">Reason</th>
                  <th className="py-2 pr-4 font-medium">Penalty</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {removedTeachers.map((t) => (
                  <tr key={t._id}>
                    <td className="py-3 pr-4 font-semibold text-ink">{t.name || '—'}</td>
                    <td className="py-3 pr-4 text-ink/70 font-mono text-xs">
                      {t.contactNumber || t.phone || '—'}
                      {t.email && <div className="font-body">{t.email}</div>}
                    </td>
                    <td className="py-3 pr-4 text-ink/70 whitespace-nowrap">{formatDate(t.removedAt)}</td>
                    <td className="py-3 pr-4 text-ink/70 max-w-[240px]">{t.reason}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <span className="font-semibold text-ink">₹{(t.penaltyAmount || PENALTY).toLocaleString('en-IN')}</span>{' '}
                      <span
                        className={`ml-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                          t.penaltyStatus === 'paid' ? 'bg-sage/15 text-sage' : 'bg-maroon/10 text-maroon'
                        }`}
                      >
                        {t.penaltyStatus === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        disabled={busy}
                        onClick={() => setPenalty(t, t.penaltyStatus === 'paid' ? 'unpaid' : 'paid')}
                        className={`${btn} ${t.penaltyStatus === 'paid' ? 'bg-ink/8 text-ink/60 hover:bg-ink/15' : 'bg-sage text-white hover:bg-sage/90'}`}
                      >
                        {t.penaltyStatus === 'paid' ? 'Mark unpaid' : 'Mark paid'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

export default NoticesTab;
