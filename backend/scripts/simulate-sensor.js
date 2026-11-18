// Mock ESP32 sensor: replays rows from the labeled dataset as live readings,
// so the full pipeline (backend -> ML -> Socket.io -> dashboard) runs without hardware.
//
// Usage: npm run simulate -- [--url http://localhost:5000] [--interval 1000] [--node sensor-01]
// The dashboard tracks node "sensor-01" live, so that is the default.

const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith('--')) pairs.push([arg.slice(2), all[i + 1]]);
    return pairs;
  }, [])
);

const BASE_URL = args.url || process.env.SIM_URL || 'http://localhost:5000';
const INTERVAL_MS = Number(args.interval || 1000);
const NODE_ID = args.node || 'sensor-01';
const LAT = 38.9072;
const LNG = -77.0369;

const FEATURES = [
  'avg_80', 'avg_100', 'avg_120',
  'avg_180', 'avg_200', 'avg_220',
  'avg_280', 'avg_300', 'avg_320',
  'avg_lowband_20_80', 'avg_band_80_140', 'avg_band_170_230',
  'avg_band_270_330', 'avg_hiss_800_4000',
];

const csvPath = path.join(__dirname, '..', '..', 'ml', 'corona_audio_dataset_labeled.csv');
const [header, ...lines] = fs.readFileSync(csvPath, 'utf8').trim().split(/\r?\n/);
const columns = header.split(',').map((c) => c.trim());
const rows = lines.map((line) => {
  const values = line.split(',');
  return Object.fromEntries(columns.map((c, i) => [c, values[i]]));
});

// +/-5% jitter so repeated rows don't look identical
const jitter = (v) => Number((Number(v) * (1 + (Math.random() - 0.5) * 0.1)).toFixed(6));

async function sendReading() {
  const row = rows[Math.floor(Math.random() * rows.length)];
  const features = Object.fromEntries(FEATURES.map((f) => [f, jitter(row[f])]));

  try {
    const res = await fetch(`${BASE_URL}/api/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId: NODE_ID, lat: LAT, lng: LNG, features }),
    });
    const alert = await res.json();
    console.log(`[sim] ${row.noise_type.padEnd(28)} -> ${res.status} severity=${alert.severity}`);
  } catch (err) {
    console.error(`[sim] POST failed: ${err.message}`);
  }
}

console.log(`[sim] Replaying ${rows.length} samples as ${NODE_ID} -> ${BASE_URL} every ${INTERVAL_MS} ms`);
sendReading();
setInterval(sendReading, INTERVAL_MS);
