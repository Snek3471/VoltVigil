/*
 * VoltVigil – ESP32 Sensor Node Firmware
 *
 * Hardware:  ESP32 DevKit + INMP441 MEMS microphone (I2S) + NEO-6M GPS (UART2)
 * Sampling:  8 kHz, 512-sample frames, Hamming window
 * Analysis:  arduinoFFT – detects anomalies in 100–2000 Hz band
 * Reporting: HTTP POST of JSON alert payload to backend REST API over Wi-Fi
 *
 * Libraries required (install via Arduino Library Manager):
 *   - arduinoFFT  >= 2.x
 *   - ArduinoJson >= 7.x
 *   - TinyGPS++   >= 1.x
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <driver/i2s.h>
#include <arduinoFFT.h>
#include <ArduinoJson.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>
#include <time.h>

// ---------------------------------------------------------------------------
// User configuration – edit before flashing
// ---------------------------------------------------------------------------
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL    = "http://YOUR_BACKEND_IP:5000/api/alerts";
const char* NODE_ID       = "NODE-001";   // unique identifier for this sensor node
// ---------------------------------------------------------------------------

// I2S pin assignments (INMP441)
#define I2S_WS    15   // Word Select / LRCLK
#define I2S_SCK   14   // Bit Clock
#define I2S_SD    32   // Serial Data (microphone output)
#define I2S_PORT  I2S_NUM_0

// GPS UART
#define GPS_RX_PIN 16
#define GPS_TX_PIN 17
#define GPS_BAUD   9600

// FFT parameters
#define SAMPLE_RATE   8000          // Hz
#define FFT_SAMPLES   512           // must be a power of 2
#define FFT_BIN_WIDTH ((double)SAMPLE_RATE / FFT_SAMPLES)  // ~15.6 Hz per bin

// Anomaly detection band (Hz)
#define BAND_LOW_HZ  100.0
#define BAND_HIGH_HZ 2000.0

// Severity thresholds (magnitude in FFT output)
#define THRESHOLD_MEDIUM  5000.0
#define THRESHOLD_HIGH    15000.0
#define THRESHOLD_CRITICAL 40000.0

// How often to evaluate FFT and potentially send an alert (ms)
#define EVAL_INTERVAL_MS 1000

// ---------------------------------------------------------------------------
// Globals
// ---------------------------------------------------------------------------
double vReal[FFT_SAMPLES];
double vImag[FFT_SAMPLES];

ArduinoFFT<double> FFT(vReal, vImag, FFT_SAMPLES, (double)SAMPLE_RATE);

TinyGPSPlus gps;
HardwareSerial gpsSerial(2);  // UART2

double gpsLat = 0.0;
double gpsLng = 0.0;

// ---------------------------------------------------------------------------
// I2S initialisation
// ---------------------------------------------------------------------------
void initI2S() {
  i2s_config_t i2s_config = {
    .mode                 = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate          = SAMPLE_RATE,
    .bits_per_sample      = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format       = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags     = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count        = 8,
    .dma_buf_len          = 64,
    .use_apll             = false,
    .tx_desc_auto_clear   = false,
    .fixed_mclk           = 0
  };

  i2s_pin_config_t pin_config = {
    .bck_io_num   = I2S_SCK,
    .ws_io_num    = I2S_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num  = I2S_SD
  };

  i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
  i2s_set_pin(I2S_PORT, &pin_config);
  i2s_start(I2S_PORT);
}

// ---------------------------------------------------------------------------
// Read FFT_SAMPLES audio samples via I2S
// ---------------------------------------------------------------------------
bool readAudioSamples() {
  int32_t raw[FFT_SAMPLES];
  size_t bytesRead = 0;

  esp_err_t err = i2s_read(I2S_PORT,
                            raw,
                            sizeof(raw),
                            &bytesRead,
                            portMAX_DELAY);

  if (err != ESP_OK || bytesRead == 0) {
    Serial.println("[I2S] Read error");
    return false;
  }

  size_t samplesRead = bytesRead / sizeof(int32_t);
  for (size_t i = 0; i < samplesRead && i < FFT_SAMPLES; i++) {
    // INMP441 returns 24-bit data in the upper 24 bits of a 32-bit word
    vReal[i] = (double)(raw[i] >> 8);
    vImag[i] = 0.0;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Apply Hamming window
// ---------------------------------------------------------------------------
void applyHammingWindow() {
  for (int i = 0; i < FFT_SAMPLES; i++) {
    double w = 0.54 - 0.46 * cos(2.0 * PI * i / (FFT_SAMPLES - 1));
    vReal[i] *= w;
  }
}

// ---------------------------------------------------------------------------
// Find peak frequency and magnitude within 100–2000 Hz band
// ---------------------------------------------------------------------------
struct PeakResult {
  double freqHz;
  double magnitude;
};

PeakResult findBandPeak() {
  PeakResult peak = {0.0, 0.0};

  int binLow  = (int)ceil(BAND_LOW_HZ  / FFT_BIN_WIDTH);
  int binHigh = (int)floor(BAND_HIGH_HZ / FFT_BIN_WIDTH);
  if (binHigh >= FFT_SAMPLES / 2) binHigh = FFT_SAMPLES / 2 - 1;

  for (int i = binLow; i <= binHigh; i++) {
    if (vReal[i] > peak.magnitude) {
      peak.magnitude = vReal[i];
      peak.freqHz    = i * FFT_BIN_WIDTH;
    }
  }
  return peak;
}

// ---------------------------------------------------------------------------
// Severity classification
// ---------------------------------------------------------------------------
String classifySeverity(double magnitude) {
  if (magnitude >= THRESHOLD_CRITICAL) return "critical";
  if (magnitude >= THRESHOLD_HIGH)     return "high";
  if (magnitude >= THRESHOLD_MEDIUM)   return "medium";
  return "low";
}

// ---------------------------------------------------------------------------
// Build ISO-8601 timestamp (NTP or millis-based fallback)
// ---------------------------------------------------------------------------
String getTimestamp() {
  struct tm timeinfo;
  if (getLocalTime(&timeinfo, 100)) {
    char buf[32];
    strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
    return String(buf);
  }
  // Fallback: milliseconds since boot
  return String(millis()) + "ms";
}

// ---------------------------------------------------------------------------
// Send JSON alert payload to backend
// ---------------------------------------------------------------------------
void sendAlert(const PeakResult& peak, const String& severity) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Not connected – skipping alert");
    return;
  }

  JsonDocument doc;
  doc["nodeId"]        = NODE_ID;
  doc["timestamp"]     = getTimestamp();
  doc["lat"]           = gpsLat;
  doc["lng"]           = gpsLng;
  doc["peakFrequency"] = (int)round(peak.freqHz);
  doc["severity"]      = severity;

  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    Serial.printf("[HTTP] POST %d – peak %.1f Hz  severity: %s\n",
                  httpCode, peak.freqHz, severity.c_str());
  } else {
    Serial.printf("[HTTP] POST failed: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

// ---------------------------------------------------------------------------
// Update GPS position from serial buffer
// ---------------------------------------------------------------------------
void updateGPS() {
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }
  if (gps.location.isUpdated()) {
    gpsLat = gps.location.lat();
    gpsLng = gps.location.lng();
  }
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  Serial.println("[VoltVigil] Booting...");

  // GPS
  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.println("[GPS] Waiting for fix...");

  // Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[WiFi] Connecting");
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500);
    Serial.print(".");
    retries++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Connected – IP: %s\n", WiFi.localIP().toString().c_str());
    // Sync NTP time
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  } else {
    Serial.println("\n[WiFi] Connection failed – will retry in loop");
  }

  // I2S
  initI2S();
  Serial.println("[I2S] Microphone initialised");
  Serial.println("[VoltVigil] Ready");
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
void loop() {
  static unsigned long lastEval = 0;

  // Keep GPS buffer drained
  updateGPS();

  if (millis() - lastEval < EVAL_INTERVAL_MS) {
    return;
  }
  lastEval = millis();

  // 1. Capture audio
  if (!readAudioSamples()) return;

  // 2. Hamming window
  applyHammingWindow();

  // 3. FFT
  FFT.compute(FFTDirection::Forward);
  FFT.complexToMagnitude();

  // 4. Find peak in 100–2000 Hz
  PeakResult peak = findBandPeak();

  Serial.printf("[FFT] Peak: %.1f Hz  mag: %.0f\n", peak.freqHz, peak.magnitude);

  // 5. Classify and send alert if above medium threshold
  if (peak.magnitude >= THRESHOLD_MEDIUM) {
    String severity = classifySeverity(peak.magnitude);
    sendAlert(peak, severity);
  }
}
