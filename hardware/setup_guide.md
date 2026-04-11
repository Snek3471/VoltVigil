# Setup Guide – VoltVigil Sensor Node

Step-by-step instructions for assembling the hardware and flashing the firmware.

---

## 1. Gather Components

Refer to [components.md](components.md) for the full bill of materials.

---

## 2. Physical Assembly

### 2.1 Prepare Headers

If your INMP441 or GPS module came without soldered headers, solder 0.1″ male header pins now before proceeding.

### 2.2 Breadboard Layout

1. Place the ESP32 DevKit across the centre of the breadboard so each row of pins has an accessible column.
2. Place the INMP441 breakout in an empty section of the breadboard.
3. Place the NEO-6M GPS module in another empty section.

### 2.3 Wire the INMP441 (follow [wiring_diagram.md](wiring_diagram.md))

| Wire | From | To |
|------|------|----|
| Power | INMP441 VDD | ESP32 3.3 V |
| Ground | INMP441 GND | Common GND rail |
| Channel | INMP441 L/R | Common GND rail |
| Data | INMP441 SD | ESP32 GPIO 32 |
| Clock | INMP441 SCK | ESP32 GPIO 14 |
| LR Clock | INMP441 WS | ESP32 GPIO 15 |

Add a 100 nF decoupling capacitor between INMP441 VDD and GND.

### 2.4 Wire the NEO-6M GPS

| Wire | From | To |
|------|------|----|
| Power | GPS VCC | ESP32 3.3 V |
| Ground | GPS GND | Common GND rail |
| Serial RX | GPS TX | ESP32 GPIO 16 (RX2) |
| Serial TX | GPS RX | ESP32 GPIO 17 (TX2) |

### 2.5 Common Ground

Connect all GND pins (ESP32 GND, INMP441 GND, GPS GND) to a single GND rail on the breadboard.

---

## 3. Install Arduino IDE and Board Support

1. Download and install [Arduino IDE ≥ 2.x](https://www.arduino.cc/en/software).
2. Open **File → Preferences** and add the following URL to *Additional boards manager URLs*:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Open **Tools → Board → Boards Manager**, search for **esp32**, and install the package by Espressif Systems.

---

## 4. Install Required Libraries

Open **Tools → Manage Libraries** and install:

| Library | Version | Notes |
|---------|---------|-------|
| arduinoFFT | ≥ 2.x | FFT processing |
| ArduinoJson | ≥ 7.x | JSON payload serialisation |
| TinyGPS++ | ≥ 1.x | GPS NMEA parsing |

---

## 5. Configure the Firmware

1. Open `firmware/VoltVigil/VoltVigil.ino` in Arduino IDE.
2. Edit the configuration constants near the top of the file:
   ```cpp
   const char* WIFI_SSID     = "YOUR_WIFI_SSID";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   const char* SERVER_URL    = "http://YOUR_BACKEND_IP:5000/api/alerts";
   ```
3. Save the file.

---

## 6. Flash the Firmware

1. Connect the ESP32 to your PC via USB Micro-B cable.
2. In Arduino IDE select:
   - **Board:** ESP32 Dev Module
   - **Port:** the COM / tty port for your ESP32
   - **Upload Speed:** 115200
3. Click **Upload** (▶).
4. If upload fails, hold the **BOOT** button on the ESP32 while clicking Upload, then release after the upload starts.

---

## 7. Verify Operation

1. Open **Tools → Serial Monitor** at 115200 baud.
2. You should see:
   - Wi-Fi connection confirmation
   - GPS fix acquisition (may take up to 60 seconds outdoors)
   - FFT sample output with peak frequency
   - HTTP POST responses from the backend (`201 Created`)

---

## 8. Schematics

Uploaded circuit diagram files are stored in [schematics/](schematics/).  
To add a new schematic, place the image (PNG, PDF, or KiCad `.sch`) in the `schematics/` folder and open a PR.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| ESP32 not detected by PC | Missing USB driver | Install CH340 or CP2102 driver |
| Upload fails | Board not in bootloader mode | Hold BOOT during upload |
| No I2S audio data | Wrong GPIO wiring | Double-check GPIOs 14, 15, 32 |
| GPS never gets a fix | No sky view | Move outdoors; wait up to 2 minutes |
| HTTP POST fails | Wrong SERVER_URL or Wi-Fi | Check SSID/password and backend URL |
