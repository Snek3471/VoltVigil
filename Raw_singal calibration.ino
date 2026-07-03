#include <Arduino.h>
#include <driver/i2s.h>
#include <arduinoFFT.h>

#define SAMPLE_RATE 16000
#define FFT_SIZE 1024


#define I2S_WS 15
#define I2S_SD 32
#define I2S_SCK 14


#define FREQ_2F 100.0
#define FREQ_4F 200.0
#define FREQ_6F 300.0

double vReal[FFT_SIZE];
double vImag[FFT_SIZE];
int32_t i2sBuffer[FFT_SIZE];


ArduinoFFT<double> FFT = ArduinoFFT<double>(vReal, vImag, FFT_SIZE, SAMPLE_RATE);


int corona_counter = 0;

double getMagnitude(double freq) {
    int index = (int)(freq * FFT_SIZE / SAMPLE_RATE);
    index = constrain(index, 1, FFT_SIZE/2 - 2);
    return (vReal[index - 1] + vReal[index] + vReal[index + 1]) / 3.0;
}


void setupI2S() {
    i2s_config_t config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = 0,
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

void setup() {
    Serial.begin(115200);
    delay(2000);

    setupI2S();

    Serial.println("⚡ Live Corona Detection Started");
}

void loop() {

    size_t bytesRead;
    i2s_read(I2S_NUM_0, i2sBuffer, sizeof(i2sBuffer), &bytesRead, portMAX_DELAY);

    for (int i = 0; i < FFT_SIZE; i++) {
        vReal[i] = (double)(i2sBuffer[i] >> 8); // scaling
        vImag[i] = 0;
    }

    FFT.windowing(FFT_WIN_TYP_HANN, FFT_FORWARD);
    FFT.compute(FFT_FORWARD);
    FFT.complexToMagnitude();

    double mag2f = getMagnitude(FREQ_2F);
    double mag4f = getMagnitude(FREQ_4F);
    double mag6f = getMagnitude(FREQ_6F);

    double hiss = 0;
    int count = 0;
    for (int i = 0; i < FFT_SIZE / 2; i++) {
        double freq = (i * (double)SAMPLE_RATE) / FFT_SIZE;
        if (freq > 800 && freq < 4000) {
            hiss += vReal[i];
            count++;
        }
    }
    if (count > 0) hiss /= count;


    double harmonic_sum = mag2f + mag4f + mag6f;

    if (hiss < 1) hiss = 1; // avoid divide-by-zero

    double ratio = harmonic_sum / hiss;

    // Score mapping (based on your calibration)
    double score = (18.0 - ratio) * 10.0;
    score = constrain(score, 0, 100);

    bool corona_detected = (score > 50);

    // Stability filter
    if (corona_detected) corona_counter++;
    else corona_counter = 0;

    bool stable_corona = (corona_counter > 5);

    // ===== OUTPUT =====

    Serial.print("Score: ");
    Serial.print(score);

    Serial.print(" | Ratio: ");
    Serial.print(ratio);

    Serial.print(" | Status: ");
    Serial.print(stable_corona ? "CORONA" : "Normal");

    Serial.print(" | 2f: ");
    Serial.print(mag2f);

    Serial.print(" | Hiss: ");
    Serial.println(hiss);
}