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
      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
      : 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${cls}`}>
      {severity}
    </span>
  );
};

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
    <main className="flex-1 p-4 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-4">

        {/* ── Subscribe Form ─────────────────────────────────────────────── */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-1">Subscribe to Fault Alerts</h2>
          <p className="text-sm text-slate-400 mb-5">
            Get notified by email when a sensor detects a high or critical fault.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
                  Name <span className="text-slate-600 normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your name"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
                Alert Threshold
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, minSeverity: 'high' }))}
                  className={`px-4 py-2 text-sm rounded border transition-colors ${
                    form.minSeverity === 'high'
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                      : 'bg-transparent border-[#334155] text-slate-400 hover:border-slate-400'
                  }`}
                >
                  High &amp; Critical
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, minSeverity: 'critical' }))}
                  className={`px-4 py-2 text-sm rounded border transition-colors ${
                    form.minSeverity === 'critical'
                      ? 'bg-red-500/20 border-red-500/50 text-red-400'
                      : 'bg-transparent border-[#334155] text-slate-400 hover:border-slate-400'
                  }`}
                >
                  Critical Only
                </button>
              </div>
            </div>

            {successMsg && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-2.5 rounded">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2.5 rounded">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded transition-colors"
            >
              {submitting ? 'Subscribing…' : 'Subscribe to Alerts'}
            </button>
          </form>
        </div>

        {/* ── Active Subscribers ─────────────────────────────────────────── */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Active Subscribers</h2>
            <span className="text-xs text-slate-400 bg-[#0f172a] px-3 py-1 rounded-full border border-[#334155]">
              {subscribers.length} active
            </span>
          </div>

          {subscribers.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No subscribers yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-[#334155]">
                    <th className="text-left pb-3 pr-4 font-medium">Name</th>
                    <th className="text-left pb-3 pr-4 font-medium">Email</th>
                    <th className="text-left pb-3 pr-4 font-medium">Alert Level</th>
                    <th className="text-left pb-3 pr-4 font-medium">Subscribed</th>
                    <th className="text-left pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => (
                    <tr
                      key={sub._id}
                      className="border-b border-[#334155]/50 last:border-0 text-slate-300 hover:bg-[#0f172a]/40 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        {sub.name || <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-slate-300">{sub.email}</td>
                      <td className="py-3 pr-4">
                        {sub.minSeverity === 'high' ? (
                          <span className="text-xs text-orange-400">High &amp; Critical</span>
                        ) : (
                          <span className="text-xs text-red-400">Critical Only</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-slate-500 text-xs">
                        {formatDate(sub.subscribedAt)}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleUnsubscribe(sub._id)}
                          className="text-xs text-red-400 hover:text-red-300 hover:underline transition-colors"
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
        </div>

        {/* ── Notification Log ───────────────────────────────────────────── */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Notifications Sent</h2>

          {logs.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No notifications sent yet.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log._id}
                  className="flex items-center gap-3 bg-[#0f172a] border border-[#334155] rounded px-4 py-3 text-sm"
                >
                  <span className="text-slate-500 text-xs w-32 shrink-0">
                    {formatLogTime(log.sentAt)}
                  </span>
                  <span className="font-mono text-slate-300 flex-1 truncate">{log.nodeId}</span>
                  <SeverityBadge severity={log.severity} />
                  <span className="text-slate-400 text-xs shrink-0">
                    {log.subscribersNotified} notified
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
};

export default Notifications;
