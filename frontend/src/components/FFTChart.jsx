import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

const MAX_POINTS = 20;
const THRESHOLD_HZ = 2000;

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg px-3.5 py-2.5 text-sm shadow-xl">
        <p className="text-slate-500 text-xs mb-1">{label}</p>
        <p className="text-yellow-400 font-bold tabular-nums">
          {payload[0].value?.toFixed(1)}{' '}
          <span className="text-slate-400 font-normal text-xs">Hz</span>
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
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Peak Frequency
        </h3>
        <span className="text-[11px] text-slate-600">Last {MAX_POINTS} alerts</span>
      </div>
      {data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
          <span className="text-2xl opacity-20">📈</span>
          <span className="text-slate-600 text-sm">Waiting for alerts…</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 24, left: 8, bottom: 32 }}
          >
            <CartesianGrid strokeDasharray="3 4" stroke="#1e3250" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#1e3250"
              tick={{ fill: '#475569', fontSize: 9 }}
              tickLine={false}
              axisLine={{ stroke: '#1e3250' }}
              label={{
                value: 'Time',
                position: 'insideBottom',
                offset: -22,
                fill: '#475569',
                fontSize: 11,
              }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#1e3250"
              tick={{ fill: '#475569', fontSize: 9 }}
              tickLine={false}
              axisLine={{ stroke: '#1e3250' }}
              label={{
                value: 'Frequency (Hz)',
                angle: -90,
                position: 'insideLeft',
                offset: 12,
                fill: '#475569',
                fontSize: 11,
              }}
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1 }} />
            <ReferenceLine
              y={THRESHOLD_HZ}
              stroke="#ef4444"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{
                value: `${THRESHOLD_HZ} Hz`,
                position: 'insideTopRight',
                fill: '#ef4444',
                fontSize: 9,
              }}
            />
            <Line
              type="monotone"
              dataKey="frequency"
              stroke="#eab308"
              strokeWidth={2}
              dot={{ r: 3, fill: '#eab308', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#fbbf24', strokeWidth: 0 }}
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
