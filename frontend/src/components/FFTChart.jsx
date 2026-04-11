import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

/**
 * Live FFT frequency chart.
 * Plots the most recent peak frequency values from incoming Socket.io alerts.
 * @param {Array} alerts – array of alert objects (newest first)
 */
export default function FFTChart({ alerts = [] }) {
  const data = useMemo(() => {
    // Show last 30 data points, oldest first for left→right time flow
    return [...alerts]
      .slice(0, 30)
      .reverse()
      .map((a, i) => ({
        index: i + 1,
        freq: a.peakFrequency,
        label: a.nodeId,
        time: new Date(a.timestamp).toLocaleTimeString(),
      }));
  }, [alerts]);

  if (data.length === 0) {
    return (
      <div style={emptyStyle}>
        Waiting for live FFT data…
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
        <XAxis
          dataKey="time"
          stroke="#8b949e"
          tick={{ fontSize: 11, fill: '#8b949e' }}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="#8b949e"
          tick={{ fontSize: 11, fill: '#8b949e' }}
          domain={[0, 2200]}
          tickFormatter={(v) => `${v} Hz`}
          width={70}
        />
        <Tooltip
          contentStyle={{
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: 6,
            color: '#c9d1d9',
          }}
          formatter={(value) => [`${value} Hz`, 'Peak Frequency']}
          labelFormatter={(label) => `Time: ${label}`}
        />
        {/* Anomaly band boundaries */}
        <ReferenceLine y={100}  stroke="#3fb950" strokeDasharray="4 2" label={{ value: '100 Hz',  fill: '#3fb950', fontSize: 10 }} />
        <ReferenceLine y={2000} stroke="#f85149" strokeDasharray="4 2" label={{ value: '2000 Hz', fill: '#f85149', fontSize: 10 }} />
        <Line
          type="monotone"
          dataKey="freq"
          stroke="#58a6ff"
          strokeWidth={2}
          dot={{ r: 3, fill: '#58a6ff' }}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

const emptyStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#8b949e',
  fontSize: 13,
};
