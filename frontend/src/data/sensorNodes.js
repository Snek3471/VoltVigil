// Real sensor — data comes from ESP32 via MongoDB
// This node ID must match exactly what the ESP32 sends in nodeId field
export const REAL_SENSOR_ID = 'sensor-01'

// All sensor nodes — 1 real + 3 simulated
// Real sensor starts with default values, gets overridden by live MongoDB data
export const defaultSensorNodes = [
  {
    nodeId: 'sensor-01',
    lat: 38.9072,
    lng: -77.0369,
    peakFrequency: 0,
    severity: 'low',
    isSimulated: false,
    label: 'Real Sensor (ESP32)'
  },
  {
    nodeId: 'Simulated-Sensor-1',
    lat: 40.7128,
    lng: -74.0060,
    peakFrequency: 312,
    severity: 'low',
    isSimulated: true,
    label: 'Simulated Sensor 1'
  },
  {
    nodeId: 'Simulated-Sensor-2',
    lat: 41.8781,
    lng: -87.6298,
    peakFrequency: 920,
    severity: 'high',
    isSimulated: true,
    label: 'Simulated Sensor 2'
  },
  {
    nodeId: 'Simulated-Sensor-3',
    lat: 34.0522,
    lng: -118.2437,
    peakFrequency: 640,
    severity: 'medium',
    isSimulated: true,
    label: 'Simulated Sensor 3'
  },
]
