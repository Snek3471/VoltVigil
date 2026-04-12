import { useState, useEffect, useCallback } from 'react';
import {
  getSubscribers,
  createSubscriber,
  deleteSubscriber,
  getNotificationLog,
} from '../services/api';

const SeverityBadge = ({ severity }) => {
  const cls =
    severity === 'critical'
      ? 'bg-red-500/15 text-red-400 border border-red-500/40'
      : 'bg-orange-500/15 text-orange-400 border border-orange-500/40';
  return (
    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider ${cls}`}>
      {severity}
    </span>
  );
};

const SectionCard = ({ children, accent = 'border-[#334155]' }) => (
  <div className={`bg-[#1e293b] border border-[#334155] border-t-2 ${accent} rounded-xl p-6`}>
    {children}
  </div>
);

const Notifications = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', minSeverity: 'high' });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSubscribers = useCallback(async () => {
    try {
      const res = await getSubscribers();
      setSubscribers(res.data);
    } catch {
      // silently ignore
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await getNotificationLog();
      setLogs(res.data);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    fetchSubscribers();
    fetchLogs();
  }, [fetchSubscribers, fetchLogs]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      await createSubscriber(form);
      setSuccessMsg(`You're subscribed! You'll receive alerts at ${form.email}`);
      setForm({ name: '', email: '', minSeverity: 'high' });
      fetchSubscribers();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to subscribe.';
      if (msg.toLowerCase().includes('already')) {
        setErrorMsg('This email is already subscribed.');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnsubscribe = async (id) => {
    try {
      await deleteSubscriber(id);
      setSubscribers((prev) => prev.filter((s) => s._id !== id));
    } catch {
      // silently ignore
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const formatLogTime = (dateStr) =>
    new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  return (
    <main className="flex-1 p-4 overflow-y-auto alert-scroll">
      <div className="max-w-4xl mx-auto space-y-4 py-2">

        {/* ── Subscribe Form ─────────────────────────────────────────────── */}
        <SectionCard accent="border-blue-500/50">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white">Subscribe to Fault Alerts</h2>
            <p className="text-sm text-slate-400 mt-1">
              Get notified by email when a sensor detects a high or critical fault.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  Name <span className="text-slate-600 normal-case font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your name"
                  className="bg-[#0f172a] border border-[#334155] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  required
                  className="bg-[#0f172a] border border-[#334155] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                Alert Threshold
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, minSeverity: 'high' }))}
                  className={`px-4 py-2 text-sm rounded-lg border font-medium transition-all duration-150 ${
                    form.minSeverity === 'high'
                      ? 'bg-orange-500/15 border-orange-500/50 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.1)]'
                      : 'bg-transparent border-[#334155] text-slate-500 hover:border-slate-400 hover:text-slate-300'
                  }`}
                >
                  High &amp; Critical
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, minSeverity: 'critical' }))}
                  className={`px-4 py-2 text-sm rounded-lg border font-medium transition-all duration-150 ${
                    form.minSeverity === 'critical'
                      ? 'bg-red-500/15 border-red-500/50 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.1)]'
                      : 'bg-transparent border-[#334155] text-slate-500 hover:border-slate-400 hover:text-slate-300'
                  }`}
                >
                  Critical Only
                </button>
              </div>
            </div>

            {successMsg && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
                <span className="text-base leading-none mt-0.5">✓</span>
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors duration-150 shadow-[0_0_12px_rgba(59,130,246,0.2)]"
            >
              {submitting ? 'Subscribing…' : 'Subscribe to Alerts'}
            </button>
          </form>
        </SectionCard>

        {/* ── Active Subscribers ─────────────────────────────────────────── */}
        <SectionCard accent="border-slate-600/60">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Active Subscribers</h2>
            <span className="text-xs text-slate-400 bg-[#0f172a] border border-[#334155] px-3 py-1 rounded-full tabular-nums">
              {subscribers.length} active
            </span>
          </div>

          {subscribers.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-slate-600 text-sm">No subscribers yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] text-slate-600 uppercase tracking-widest border-b border-[#334155]">
                    <th className="text-left pb-3 pr-4 font-semibold">Name</th>
                    <th className="text-left pb-3 pr-4 font-semibold">Email</th>
                    <th className="text-left pb-3 pr-4 font-semibold">Alert Level</th>
                    <th className="text-left pb-3 pr-4 font-semibold">Subscribed</th>
                    <th className="text-left pb-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => (
                    <tr
                      key={sub._id}
                      className="border-b border-[#334155]/40 last:border-0 text-slate-300 hover:bg-[#0f172a]/50 transition-colors duration-100"
                    >
                      <td className="py-3 pr-4 font-medium">
                        {sub.name || <span className="text-slate-700">—</span>}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-slate-400">{sub.email}</td>
                      <td className="py-3 pr-4">
                        {sub.minSeverity === 'high' ? (
                          <span className="text-xs font-medium text-orange-400">High &amp; Critical</span>
                        ) : (
                          <span className="text-xs font-medium text-red-400">Critical Only</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-slate-600 text-xs tabular-nums">
                        {formatDate(sub.subscribedAt)}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleUnsubscribe(sub._id)}
                          className="text-xs text-slate-500 hover:text-red-400 transition-colors duration-150 hover:underline"
                        >
                          Unsubscribe
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* ── Notification Log ───────────────────────────────────────────── */}
        <SectionCard accent="border-slate-600/60">
          <h2 className="text-base font-semibold text-white mb-4">Recent Notifications Sent</h2>

          {logs.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-slate-600 text-sm">No notifications sent yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log._id}
                  className="flex items-center gap-3 bg-[#0f172a] border border-[#2d3f55] rounded-lg px-4 py-3 hover:border-[#3d5275] transition-colors duration-150"
                >
                  <span className="text-slate-600 text-xs w-32 shrink-0 tabular-nums">
                    {formatLogTime(log.sentAt)}
                  </span>
                  <span className="font-mono text-slate-300 text-sm flex-1 truncate">{log.nodeId}</span>
                  <SeverityBadge severity={log.severity} />
                  <span className="text-slate-500 text-xs shrink-0 tabular-nums">
                    {log.subscribersNotified} notified
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

      </div>
    </main>
  );
};

export default Notifications;
