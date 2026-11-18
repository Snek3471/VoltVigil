#include <Arduino.h>
#include <driver/i2s.h>
#include <arduinoFFT.h>

#define SAMPLE_RATE 16000
#define FFT_SIZE 1024

#define NUM_RUNS 10
#define RUN_TIME_MS 10000

// Pins
#define I2S_WS 15
#define I2S_SD 32
#define I2S_SCK 14

double vReal[FFT_SIZE];
double vImag[FFT_SIZE];
int32_t i2sBuffer[FFT_SIZE];

ArduinoFFT<double> FFT = ArduinoFFT<double>(vReal, vImag, FFT_SIZE, SAMPLE_RATE);


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

    if (count == 0) return 0;
    return sum / count;
}

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

void setup() {
    Serial.begin(115200);
    delay(2000);

    setupI2S();

    Serial.println("=== DATASET COLLECTION MODE ===");
    Serial.println("Each row = one 10-second sample");

    // CSV header
    Serial.println("avg_80,avg_100,avg_120,avg_180,avg_200,avg_220,avg_280,avg_300,avg_320,avg_lowband_20_80,avg_band_80_140,avg_band_170_230,avg_band_270_330,avg_hiss_800_4000,max_100");
}

void loop() {

    for (int run = 0; run < NUM_RUNS; run++) {

        double sum_80=0,sum_100=0,sum_120=0;
        double sum_180=0,sum_200=0,sum_220=0;
        double sum_280=0,sum_300=0,sum_320=0;

        double sum_low=0,sum_b1=0,sum_b2=0,sum_b3=0,sum_h=0;
        double max100=0;

        int frames = 0;
        unsigned long start = millis();

        while (millis() - start < RUN_TIME_MS) {

            size_t bytesRead;
            i2s_read(I2S_NUM_0, i2sBuffer, sizeof(i2sBuffer), &bytesRead, portMAX_DELAY);

            for (int i = 0; i < FFT_SIZE; i++) {
                vReal[i] = (double)(i2sBuffer[i] >> 8);
                vImag[i] = 0;
            }

            FFT.windowing(FFT_WIN_TYP_HANN, FFT_FORWARD);
            FFT.compute(FFT_FORWARD);
            FFT.complexToMagnitude();

            double total_energy = 0;
            for (int i = 1; i < FFT_SIZE/2; i++) total_energy += vReal[i];
            if (total_energy < 1) total_energy = 1;

            double m80  = getMag(80)/total_energy;
            double m100 = getMag(100)/total_energy;
            double m120 = getMag(120)/total_energy;

            double m180 = getMag(180)/total_energy;
            double m200 = getMag(200)/total_energy;
            double m220 = getMag(220)/total_energy;

            double m280 = getMag(280)/total_energy;
            double m300 = getMag(300)/total_energy;
            double m320 = getMag(320)/total_energy;

            double low = avgBand(20,80)/total_energy;
            double b1  = avgBand(80,140)/total_energy;
            double b2  = avgBand(170,230)/total_energy;
            double b3  = avgBand(270,330)/total_energy;
            double h   = avgBand(800,4000)/total_energy;

            sum_80+=m80; sum_100+=m100; sum_120+=m120;
            sum_180+=m180; sum_200+=m200; sum_220+=m220;
            sum_280+=m280; sum_300+=m300; sum_320+=m320;

            sum_low+=low; sum_b1+=b1; sum_b2+=b2; sum_b3+=b3;
            sum_h+=h;

            if (m100 > max100) max100 = m100;

            frames++;
        }

        // ===== PRINT ONE SAMPLE (HIGH PRECISION) =====
        Serial.print(sum_80/frames, 6); Serial.print(",");
        Serial.print(sum_100/frames, 6); Serial.print(",");
        Serial.print(sum_120/frames, 6); Serial.print(",");
        Serial.print(sum_180/frames, 6); Serial.print(",");
        Serial.print(sum_200/frames, 6); Serial.print(",");
        Serial.print(sum_220/frames, 6); Serial.print(",");
        Serial.print(sum_280/frames, 6); Serial.print(",");
        Serial.print(sum_300/frames, 6); Serial.print(",");
        Serial.print(sum_320/frames, 6); Serial.print(",");
        Serial.print(sum_low/frames, 6); Serial.print(",");
        Serial.print(sum_b1/frames, 6); Serial.print(",");
        Serial.print(sum_b2/frames, 6); Serial.print(",");
        Serial.print(sum_b3/frames, 6); Serial.print(",");
        Serial.print(sum_h/frames, 6); Serial.print(",");
        Serial.println(max100, 6);

        Serial.print("Run ");
        Serial.print(run + 1);
        Serial.println(" complete\n");

        delay(1000);
    }

    Serial.println("=== DONE ===");

    while(1);
}