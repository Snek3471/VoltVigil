# VoltVigil

Real-time IoT power grid fault detection using ESP32, Node.js, React, and machine learning.

VoltVigil listens for **corona discharge** (an acoustic precursor to power-line/transformer faults) using a field-deployed ESP32 + INMP441 MEMS microphone sensor node. The sensor streams FFT-derived audio features to a backend, which classifies severity, broadcasts alerts live to a dashboard, and emails subscribers when high/critical faults are detected.

## Architecture

```
ESP32 + INMP441 mic  --POST /api/alerts-->  backend (Express/Socket.io/MongoDB)
                                                |  |
                                     threshold  |  | async
                                     severity   |  v
                                                |  ml/ (Flask + scikit-learn)
                                                v
                                   Socket.io (new_alert / alert_updated)
                                                |
                                                v
                                   frontend (React/Vite live dashboard)
```

1. Sensor node samples audio, computes 14 FFT band-average features + peak frequency, POSTs to backend with `nodeId`, `lat/lng`, `features`.
2. Backend computes an immediate threshold-based severity, saves to MongoDB, emits `new_alert` over Socket.io, and responds to the sensor without waiting.
3. Asynchronously, backend calls the ML service for a corona-discharge probability/severity classification.
4. Backend updates the alert with ML results, emits `alert_updated`, and — if severity is high/critical and a per-node cooldown has passed — emails subscribers via Nodemailer/Gmail.
5. The dashboard shows a live map, sensor list, and notification log, all updated in real time via Socket.io.

## Components

| Folder | What it is |
|--------|------------|
| [`backend/`](backend/README.md) | Node.js/Express API, Socket.io real-time layer, MongoDB storage, email alerts |
| [`frontend/`](frontend/README.md) | React + Vite live dashboard (map, sensor list, notifications) |
| [`ml/`](ml/README.md) | Python Flask microservice; RandomForest/GradientBoosting classifier for corona discharge |
| [`hardware/`](hardware/) | ESP32 + INMP441 sensor firmware (Arduino `.ino`) |
| `housing/` | 3D-printable enclosure (STL) for the sensor unit — `Housing.stl` + `Cap.stl` |

## Tech Stack

- **Backend:** Node.js, Express, Socket.io, Mongoose (MongoDB), Nodemailer
- **Frontend:** React 18, Vite, Tailwind CSS, MapLibre GL, Recharts, Socket.io-client, Three.js
- **ML:** Flask, scikit-learn, pandas, numpy, joblib
- **Hardware:** ESP32 + INMP441 I2S MEMS microphone, 16 kHz sampling, 1024-point Hann-windowed FFT
- **Enclosure:** 3D-printed housing (STL in `housing/`)

## Quick Start

```bash
# Backend
cd backend && npm install && cp .env.example .env && npm run dev

# ML service
cd ml && pip install -r requirements.txt && python app.py

# Frontend
cd frontend && npm install && cp .env.example .env && npm run dev
```

Backend runs on `http://localhost:5000`, ML service on `http://localhost:5001`, dashboard on `http://localhost:5173`.

For the sensor node itself, open `hardware/Pipeline.ino` in the Arduino IDE, fill in your Wi-Fi SSID/password and backend host, and flash to an ESP32 wired to an INMP441 mic.

See each component's README for full setup, API endpoints, and configuration details.
