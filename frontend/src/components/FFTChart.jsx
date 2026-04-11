import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const MAX_POINTS = 20;
const THRESHOLD_HZ = 2000;

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1e293b] border border-[#334155] rounded px-3 py-2 text-sm text-slate-200">
        <p className="text-slate-400">{label}</p>
        <p>
          <span className="text-yellow-400 font-semibold">
            {payload[0].value?.toFixed(1)} Hz
          </span>
        </p>
      </div>
    );
  }
  return null;
};

const FFTChart = ({ alerts }) => {
  // Build time-series from the last MAX_POINTS alerts sorted by timestamp ascending
  const sorted = [...alerts]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .slice(-MAX_POINTS);

  const data = sorted.map((alert) => ({
    time: new Date(alert.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    frequency: alert.peakFrequency,
    node: alert.nodeId,
  }));

  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-sm font-semibold text-slate-400 mb-2 px-1">
        Peak Frequency — Last {MAX_POINTS} Alerts
      </h3>
      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          Waiting for alerts…
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 20, left: 10, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              label={{
                value: 'Time',
                position: 'insideBottom',
                offset: -20,
                fill: '#94a3b8',
                fontSize: 12,
              }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              label={{
                value: 'Frequency (Hz)',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                fill: '#94a3b8',
                fontSize: 12,
              }}
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={THRESHOLD_HZ}
              stroke="#ef4444"
              strokeDasharray="6 3"
              label={{
                value: `${THRESHOLD_HZ} Hz threshold`,
                position: 'insideTopRight',
                fill: '#ef4444',
                fontSize: 10,
              }}
            />
            <Line
              type="monotone"
              dataKey="frequency"
              stroke="#eab308"
              strokeWidth={2}
              dot={{ r: 3, fill: '#eab308', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#fbbf24' }}
              isAnimationActive={false}
              name="Peak Freq (Hz)"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default FFTChart;
