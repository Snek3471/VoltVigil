#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <driver/i2s.h>
#include <arduinoFFT.h>

// ===== WIFI =====
// Fill in for your network before flashing — do not commit real credentials.
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverURL = "http://YOUR_BACKEND_HOST:5000/api/alerts";

// ===== I2S PINS =====
#define I2S_WS 15
#define I2S_SD 32
#define I2S_SCK 14

#define SAMPLE_RATE 16000
#define FFT_SIZE 1024

// smoothing factor
#define ALPHA 0.7

double vReal[FFT_SIZE];
double vImag[FFT_SIZE];
int32_t i2sBuffer[FFT_SIZE];

ArduinoFFT<double> FFT = ArduinoFFT<double>(vReal, vImag, FFT_SIZE, SAMPLE_RATE);

// ===== LOCATION =====
float lat = 38.9072;
float lng = -77.0369;

// ===== PREVIOUS VALUES (for smoothing) =====
double p80=0,p100=0,p120=0;
double p180=0,p200=0,p220=0;
double p280=0,p300=0,p320=0;
double plow=0,pb1=0,pb2=0,pb3=0,ph=0;

// ===== HELPERS =====
double getMag(double freq) {
  int idx = (int)(freq * FFT_SIZE / SAMPLE_RATE);
  idx = constrain(idx, 1, FFT_SIZE/2 - 2);
  return (vReal[idx-1] + vReal[idx] + vReal[idx+1]) / 3.0;
}

double avgBand(double fLow, double fHigh) {
  double sum = 0;
  int count = 0;

  for (int i = 1; i < FFT_SIZE/2; i++) {
    double f = (i * (double)SAMPLE_RATE) / FFT_SIZE;
    if (f >= fLow && f <= fHigh) {
      sum += vReal[i];
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

// ===== I2S SETUP =====
void setupI2S() {
  i2s_config_t config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .dma_buf_count = 8,
    .dma_buf_len = 1024
  };

  i2s_pin_config_t pins = {
    .bck_io_num = I2S_SCK,
    .ws_io_num = I2S_WS,
    .data_out_num = -1,
    .data_in_num = I2S_SD
  };

  i2s_driver_install(I2S_NUM_0, &config, 0, NULL);
  i2s_set_pin(I2S_NUM_0, &pins);
}

// ===== WIFI =====
void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting");

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }

  Serial.println("\nConnected!");
}

// ===== 1-SECOND FEATURE COLLECTION =====
void collectFeatures(JsonObject features) {

  double sum_80=0,sum_100=0,sum_120=0;
  double sum_180=0,sum_200=0,sum_220=0;
  double sum_280=0,sum_300=0,sum_320=0;
  double sum_low=0,sum_b1=0,sum_b2=0,sum_b3=0,sum_h=0;

  int frames = 0;
  unsigned long start = millis();

  while (millis() - start < 1000) {

    size_t bytesRead;
    i2s_read(I2S_NUM_0, i2sBuffer, sizeof(i2sBuffer), &bytesRead, portMAX_DELAY);

    for (int i = 0; i < FFT_SIZE; i++) {
      vReal[i] = (double)(i2sBuffer[i] >> 8);
      vImag[i] = 0;
    }

    FFT.windowing(FFT_WIN_TYP_HANN, FFT_FORWARD);
    FFT.compute(FFT_FORWARD);
    FFT.complexToMagnitude();

    double total = 0;
    for (int i = 1; i < FFT_SIZE/2; i++) total += vReal[i];
    if (total < 1) total = 1;

    double m80 = getMag(80)/total;
    double m100 = getMag(100)/total;
    double m120 = getMag(120)/total;

    double m180 = getMag(180)/total;
    double m200 = getMag(200)/total;
    double m220 = getMag(220)/total;

    double m280 = getMag(280)/total;
    double m300 = getMag(300)/total;
    double m320 = getMag(320)/total;

    double low = avgBand(20,80)/total;
    double b1 = avgBand(80,140)/total;
    double b2 = avgBand(170,230)/total;
    double b3 = avgBand(270,330)/total;
    double h = avgBand(800,4000)/total;

    sum_80+=m80; sum_100+=m100; sum_120+=m120;
    sum_180+=m180; sum_200+=m200; sum_220+=m220;
    sum_280+=m280; sum_300+=m300; sum_320+=m320;
    sum_low+=low; sum_b1+=b1; sum_b2+=b2; sum_b3+=b3; sum_h+=h;

    frames++;
  }

  // ===== RAW AVERAGE =====
  double avg80 = sum_80/frames;
  double avg100 = sum_100/frames;
  double avg120 = sum_120/frames;

  double avg180 = sum_180/frames;
  double avg200 = sum_200/frames;
  double avg220 = sum_220/frames;

  double avg280 = sum_280/frames;
  double avg300 = sum_300/frames;
  double avg320 = sum_320/frames;

  double avg_low = sum_low/frames;
  double avg_b1 = sum_b1/frames;
  double avg_b2 = sum_b2/frames;
  double avg_b3 = sum_b3/frames;
  double avg_h = sum_h/frames;

  // ===== APPLY SMOOTHING =====
  p80 = ALPHA*p80 + (1-ALPHA)*avg80;
  p100 = ALPHA*p100 + (1-ALPHA)*avg100;
  p120 = ALPHA*p120 + (1-ALPHA)*avg120;

  p180 = ALPHA*p180 + (1-ALPHA)*avg180;
  p200 = ALPHA*p200 + (1-ALPHA)*avg200;
  p220 = ALPHA*p220 + (1-ALPHA)*avg220;

  p280 = ALPHA*p280 + (1-ALPHA)*avg280;
  p300 = ALPHA*p300 + (1-ALPHA)*avg300;
  p320 = ALPHA*p320 + (1-ALPHA)*avg320;

  plow = ALPHA*plow + (1-ALPHA)*avg_low;
  pb1 = ALPHA*pb1 + (1-ALPHA)*avg_b1;
  pb2 = ALPHA*pb2 + (1-ALPHA)*avg_b2;
  pb3 = ALPHA*pb3 + (1-ALPHA)*avg_b3;
  ph = ALPHA*ph + (1-ALPHA)*avg_h;

  // ===== STORE =====
  features["avg_80"] = p80;
  features["avg_100"] = p100;
  features["avg_120"] = p120;

  features["avg_180"] = p180;
  features["avg_200"] = p200;
  features["avg_220"] = p220;

  features["avg_280"] = p280;
  features["avg_300"] = p300;
  features["avg_320"] = p320;

  features["avg_lowband_20_80"] = plow;
  features["avg_band_80_140"] = pb1;
  features["avg_band_170_230"] = pb2;
  features["avg_band_270_330"] = pb3;
  features["avg_hiss_800_4000"] = ph;
}

// ===== SEND =====
void sendToServer() {

  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<512> doc;

  doc["lat"] = lat;
  doc["lng"] = lng;

  JsonObject features = doc.createNestedObject("features");
  collectFeatures(features);

  String payload;
  serializeJson(doc, payload);

  Serial.println("Sending:");
  Serial.println(payload);

  int code = http.POST(payload);

  Serial.print("Response: ");
  Serial.println(code);

  if (code > 0) {
    Serial.println(http.getString());
  }

  http.end();
}

// ===== SETUP =====
void setup() {
  Serial.begin(115200);
  connectToWiFi();
  setupI2S();
}

// ===== LOOP =====
void loop() {
  sendToServer();
  delay(1000);  // send every second
}