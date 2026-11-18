import { useState, useEffect, useCallback } from 'react';
import {
  getSubscribers,
  createSubscriber,
  deleteSubscriber,
  getNotificationLog,
} from '../services/api';
import { DitheringShader } from '@/components/ui/dithering-shader';

const SEVERITY_BADGE = {
  critical: 'bg-red-500/20 text-red-300 border border-red-500/30',
  high:     'bg-orange-500/20 text-orange-300 border border-orange-500/30',
};

const SeverityBadge = ({ severity }) => (
  <span
    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
      SEVERITY_BADGE[severity] || SEVERITY_BADGE.high
    }`}
  >
    {severity}
  </span>
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
      setSuccessMsg(`Subscribed! Alerts will be sent to ${form.email}`);
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
    <div className="relative flex-1 overflow-hidden flex flex-col bg-[#0a0a0f]">

      {/* Ripple dithering shader — absolute so it stays within the content area */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <DitheringShader
          shape="ripple"
          type="4x4"
          colorBack="#000810"
          colorFront="#003366"
          pxSize={4}
          speed={0.3}
          width={1920}
          height={1080}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Subtle dark overlay for readability */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-black/60" />

      {/* All content sits above the shader */}
      <div className="relative z-[2] flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* Page header */}
      <div className="px-8 py-6 border-b border-[#1e293b] flex-shrink-0">
        <h1 className="text-xl font-bold text-[#f8fafc] tracking-tight">Alert Notifications</h1>
        <p className="text-sm text-[#475569] mt-0.5">
          Manage email subscribers for high and critical fault alerts
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex-1 overflow-y-auto alert-scroll">
        <div className="p-8 grid grid-cols-3 gap-6 max-w-7xl mx-auto">

          {/* ── Left column — subscribe form (1/3) ───────────────────── */}
          <div className="col-span-1">
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 hover:border-[#475569] transition-all duration-200">
              <h2 className="text-xs font-semibold tracking-widest uppercase text-[#475569] mb-6">
                Subscribe to Alerts
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name input */}
                <div>
                  <label className="text-xs text-[#94a3b8] uppercase tracking-wider mb-2 block">
                    Name <span className="normal-case text-[#475569]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2.5 text-[#f8fafc] text-sm placeholder-[#475569] focus:outline-none focus:border-[#3b82f6] transition-colors"
                  />
                </div>

                {/* Email input */}
                <div>
                  <label className="text-xs text-[#94a3b8] uppercase tracking-wider mb-2 block">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2.5 text-[#f8fafc] text-sm placeholder-[#475569] focus:outline-none focus:border-[#3b82f6] transition-colors"
                  />
                </div>

                {/* Alert level toggle */}
                <div>
                  <label className="text-xs text-[#94a3b8] uppercase tracking-wider mb-2 block">
                    Alert Level
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, minSeverity: 'high' }))}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        form.minSeverity === 'high'
                          ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300'
                          : 'bg-[#0f172a] border border-[#334155] text-[#94a3b8] hover:border-[#475569]'
                      }`}
                    >
                      High &amp; Critical
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, minSeverity: 'critical' }))}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        form.minSeverity === 'critical'
                          ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                          : 'bg-[#0f172a] border border-[#334155] text-[#94a3b8] hover:border-[#475569]'
                      }`}
                    >
                      Critical Only
                    </button>
                  </div>
                </div>

                {successMsg && (
                  <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs px-4 py-3 rounded-lg flex items-start gap-2">
                    <span className="text-sm leading-none mt-0.5">✓</span>
                    {successMsg}
                  </div>
                )}
                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-lg">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#3b82f6] hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm tracking-wider uppercase transition-all duration-200"
                >
                  {submitting ? 'Subscribing…' : 'Subscribe'}
                </button>
              </form>
            </div>
          </div>

          {/* ── Right column — subscribers table + log (2/3) ─────────── */}
          <div className="col-span-2 flex flex-col gap-6">

            {/* Active subscribers table */}
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 hover:border-[#475569] transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold tracking-widest uppercase text-[#475569]">
                  Active Subscribers
                </h2>
                <span className="text-xs text-[#94a3b8] font-mono">
                  {subscribers.length} registered
                </span>
              </div>

              {subscribers.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[#475569] text-sm">No subscribers yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#334155]">
                        {['Name', 'Email', 'Alert Level', 'Subscribed', ''].map((h) => (
                          <th
                            key={h}
                            className="text-left text-xs text-[#475569] uppercase tracking-wider pb-3 font-medium pr-4 last:pr-0"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((sub) => (
                        <tr
                          key={sub._id}
                          className="border-b border-[#334155]/40 last:border-0 hover:bg-[#0f172a]/50 transition-colors duration-100"
                        >
                          <td className="py-3 pr-4 text-sm text-[#f8fafc] font-medium">
                            {sub.name || <span className="text-[#475569]">—</span>}
                          </td>
                          <td className="py-3 pr-4 text-sm text-[#94a3b8] font-mono">{sub.email}</td>
                          <td className="py-3 pr-4">
                            <SeverityBadge severity={sub.minSeverity === 'high' ? 'high' : 'critical'} />
                          </td>
                          <td className="py-3 pr-4 text-xs text-[#475569] font-mono tabular-nums">
                            {formatDate(sub.subscribedAt)}
                          </td>
                          <td className="py-3">
                            <button
                              onClick={() => handleUnsubscribe(sub._id)}
                              className="text-xs text-[#475569] hover:text-red-400 transition-colors duration-150"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Notification log */}
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 hover:border-[#475569] transition-all duration-200">
              <h2 className="text-xs font-semibold tracking-widest uppercase text-[#475569] mb-4">
                Recent Notifications Sent
              </h2>

              {logs.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[#475569] text-sm">No notifications sent yet.</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {logs.map((log) => (
                    <div
                      key={log._id}
                      className="flex items-center justify-between py-3 border-b border-[#334155] last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <SeverityBadge severity={log.severity} />
                        <span className="text-sm text-[#f8fafc] font-mono">{log.nodeId}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-xs text-[#94a3b8]">
                          {log.subscribersNotified} {log.mock ? 'mock (not sent)' : 'notified'}
                        </span>
                        <span className="text-xs text-[#475569] font-mono tabular-nums">
                          {formatLogTime(log.sentAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      </div>
    </div>
  );
};

export default Notifications;
