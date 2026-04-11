# Component List – VoltVigil Sensor Node

All components required to build one VoltVigil sensor node.

---

## Microcontroller

| Component | Specification | Quantity | Supplier / Link |
|-----------|--------------|----------|----------------|
| ESP32 DevKit v1 | Dual-core Xtensa LX6, 240 MHz, Wi-Fi 802.11 b/g/n, Bluetooth 4.2, 4 MB Flash | 1 | [AliExpress](https://www.aliexpress.com/item/1005001636295529.html) · [Digi-Key](https://www.digikey.com/en/products/detail/espressif-systems/ESP32-DEVKITC-32D/9356990) |

---

## Microphone

| Component | Specification | Quantity | Supplier / Link |
|-----------|--------------|----------|----------------|
| INMP441 MEMS Microphone | I2S interface, 3.3 V, frequency response 60 Hz – 15 kHz, SNR 61 dB, sensitivity −26 dBFS | 1 | [AliExpress](https://www.aliexpress.com/item/4000057928885.html) · [SparkFun (breakout)](https://www.sparkfun.com/products/19389) |

---

## GPS Module

| Component | Specification | Quantity | Supplier / Link |
|-----------|--------------|----------|----------------|
| NEO-6M GPS Module | UART, 3.3 V–5 V, 50-channel receiver, 10 Hz update rate, integrated antenna | 1 | [AliExpress](https://www.aliexpress.com/item/32858765752.html) · [Amazon](https://www.amazon.com/dp/B07P8YMVNT) |

---

## Passive Components & Accessories

| Component | Specification | Quantity | Notes |
|-----------|--------------|----------|-------|
| 100 nF ceramic capacitor | 0.1 µF, 10 V, 0402 or through-hole | 2 | Decoupling for INMP441 & GPS VCC |
| Breadboard | 830 tie-point full-size | 1 | For prototyping |
| Jumper wires (M-M) | 20 cm | 1 pack | Breadboard connections |
| Jumper wires (M-F) | 20 cm | 1 pack | Sensor breakout connections |
| USB Micro-B cable | Data + power | 1 | For programming and power |
| 5 V USB power supply | ≥ 500 mA | 1 | Node power source |

---

## Optional (Battery Operation)

| Component | Specification | Quantity | Supplier / Link |
|-----------|--------------|----------|----------------|
| LiPo Battery | 3.7 V, 2000 mAh, JST connector | 1 | [Adafruit](https://www.adafruit.com/product/2011) |
| TP4056 LiPo Charger | USB-C input, 1 A charge current | 1 | [AliExpress](https://www.aliexpress.com/item/32649780468.html) |
| AMS1117-3.3 LDO | 800 mA, SOT-223 | 1 | [Digi-Key](https://www.digikey.com/en/products/detail/diodes-incorporated/AMS1117-3.3/856232) |

---

## Tools Required

| Tool | Purpose |
|------|---------|
| Arduino IDE ≥ 2.x | Firmware development and flashing |
| USB-to-Serial driver (CH340 / CP2102) | Required on some OS to detect ESP32 |
| Multimeter | Continuity and voltage checks |
| Soldering iron + solder | Soldering header pins to GPS/mic modules |

---

## Total Estimated Cost (per node)

| Category | Approximate Cost |
|----------|----------------|
| ESP32 DevKit | $4 – $8 USD |
| INMP441 Microphone | $2 – $5 USD |
| NEO-6M GPS Module | $5 – $10 USD |
| Passives & accessories | $3 – $5 USD |
| **Total** | **~$14 – $28 USD** |

*Prices vary by supplier and region.*
