# Wiring Diagram – VoltVigil Sensor Node

This document describes all electrical connections for the VoltVigil ESP32 sensor node, including the INMP441 MEMS microphone, GPS module, and power supply.

---

## Overview

The sensor node consists of:
- **ESP32 DevKit** (main microcontroller)
- **INMP441** – I2S digital MEMS microphone
- **NEO-6M GPS Module** – for attaching geographic coordinates to each alert
- **5V USB power supply** (or LiPo battery with 3.3 V regulator)

---

## INMP441 MEMS Microphone (I2S)

| INMP441 Pin | ESP32 Pin | Description |
|-------------|-----------|-------------|
| VDD | 3.3 V | Power supply (3.3 V only – do **not** use 5 V) |
| GND | GND | Ground |
| SD (Serial Data) | GPIO 32 | I2S data line |
| SCK (Serial Clock) | GPIO 14 | I2S bit clock |
| WS (Word Select / LRCLK) | GPIO 15 | I2S left/right clock |
| L/R (Channel select) | GND | Tie to GND for left channel |

> **Note:** The INMP441 operates on **3.3 V** only. Connecting VDD to 5 V will damage the sensor.

---

## NEO-6M GPS Module (UART)

| GPS Pin | ESP32 Pin | Description |
|---------|-----------|-------------|
| VCC | 3.3 V | Power supply |
| GND | GND | Ground |
| TX | GPIO 16 (RX2) | GPS transmit → ESP32 receive |
| RX | GPIO 17 (TX2) | ESP32 transmit → GPS receive |

> The ESP32's hardware UART2 (`Serial2`) is used for GPS communication at 9600 baud.

---

## Power

| Connection | Detail |
|------------|--------|
| USB Micro/USB-C → ESP32 | 5 V from USB powers the ESP32 on-board regulator |
| ESP32 3.3 V pin → INMP441 VDD | Regulated 3.3 V from ESP32 |
| ESP32 3.3 V pin → GPS VCC | Regulated 3.3 V from ESP32 |
| Common GND | All GND pins share a common ground rail |

> When powering from a LiPo battery, use a 3.3 V LDO regulator (e.g., AMS1117-3.3) between the battery and the sensor VDD pins.

---

## GPIO Summary

| GPIO | Function |
|------|----------|
| 14 | I2S BCK (bit clock) |
| 15 | I2S LRCK (word select) |
| 32 | I2S SD (data in) |
| 16 | UART2 RX (GPS TX) |
| 17 | UART2 TX (GPS RX) |

---

## Notes

- Keep I2S wires short (< 20 cm) to minimise noise.
- Place a 100 nF decoupling capacitor between VDD and GND, close to the INMP441.
- The INMP441 has an internal anti-aliasing filter; no external filter is required for 8 kHz sampling.

---

*For circuit diagrams see [schematics/](schematics/).*
