// Measures end-to-end alert latency as seen by a dashboard client:
//   POST /api/alerts  ->  Socket.io `new_alert`      (threshold severity)
//   POST /api/alerts  ->  Socket.io `alert_updated`  (after the ML service responds)
//
// Requires the backend (and ideally the ML service) to be running.
// Usage: npm run latency -- [--url http://localhost:5000] [--n 50]
// Note: alerts are written to the configured database under nodeId "latency-test".

const { io } = require('socket.io-client');

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 ? argv[i + 1] : fallback;
};
const BASE_URL = arg('url', 'http://localhost:5000');
const N = Number(arg('n', 50));

const sentAt = {};
const received = { new_alert: {}, alert_updated: {} };

const socket = io(BASE_URL, { transports: ['websocket'] });
socket.on('new_alert', (a) => { received.new_alert[a._id] = performance.now(); });
socket.on('alert_updated', (a) => { received.alert_updated[a._id] = performance.now(); });

function summarize(label, event) {
  const samples = Object.keys(sentAt)
    .filter((id) => received[event][id])
    .map((id) => received[event][id] - sentAt[id])
    .sort((a, b) => a - b);
  if (samples.length === 0) return console.log(`${label}: no events received`);
  const pct = (p) => samples[Math.min(samples.length - 1, Math.floor(samples.length * p))].toFixed(1);
  console.log(`${label}: median ${pct(0.5)} ms | p95 ${pct(0.95)} ms | max ${pct(1)} ms (n=${samples.length})`);
}

socket.on('connect', async () => {
  for (let i = 0; i < N; i++) {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/api/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: 'latency-test',
        lat: 0,
        lng: 0,
        features: { avg_100: 0.02, avg_hiss_800_4000: 0.002 },
      }),
    });
    const alert = await res.json();
    sentAt[alert._id] = t0;
    await new Promise((r) => setTimeout(r, 200));
  }

  // Give the async ML updates time to arrive
  setTimeout(() => {
    summarize('POST -> new_alert    ', 'new_alert');
    summarize('POST -> alert_updated', 'alert_updated');
    process.exit(0);
  }, 2000);
});
