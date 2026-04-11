# VoltVigil – Real-Time Power Grid Fault Detection System

VoltVigil is an IoT-based system that uses ESP32 microcontrollers with INMP441 MEMS microphones to detect acoustic anomalies in power grid equipment, reporting faults in real time through a Node.js backend to a React dashboard.

---

## Project Architecture

```
VoltVigil/
├── firmware/        # ESP32 Arduino sketches (INMP441 I2S + FFT + HTTP POST)
├── hardware/        # Wiring diagrams, component lists, assembly guide
├── backend/         # Node.js/Express REST API + Socket.io + MongoDB
├── frontend/        # React (Vite) dashboard with Leaflet map + FFT chart
├── .github/         # CODEOWNERS
├── CONTRIBUTING.md  # Git workflow guide
└── README.md        # This file
```

### Data Flow

```
ESP32 (sensor node)
  └─[I2S]─► INMP441 mic ─► FFT analysis
              └─[HTTP POST]─► Backend REST API
                               └─[Socket.io]─► React Frontend
                               └─[MongoDB]───► Persistent storage
```

---

## Team Responsibilities

| Area | Owner | Branches |
|------|-------|---------|
| Frontend & Backend | Person 1 | `frontend`, `backend` |
| Firmware & Hardware | Persons 2 & 3 | `firmware`, `hardware` |

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable, production-ready code. **No direct pushes.** |
| `dev` | Integration branch – all features merge here first |
| `frontend` | Person 1's frontend work |
| `backend` | Person 1's backend work |
| `firmware` | Persons 2 & 3's ESP32 code |
| `hardware` | Persons 2 & 3's hardware docs & schematics |

All new work is done on feature branches cut from `dev` and merged back via pull requests.  
See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow.

---

## Setup Instructions

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)
- Arduino IDE ≥ 2.x with ESP32 board support
- Git

---

### Backend

```bash
cd backend
cp .env.example .env        # fill in MONGO_URI, PORT, FRONTEND_URL
npm install
npm start                   # or: npm run dev
```

API available at `http://localhost:5000` by default.

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard available at `http://localhost:5173` by default.

---

### Firmware

1. Open `firmware/VoltVigil/VoltVigil.ino` in Arduino IDE.
2. Install libraries: **arduinoFFT**, **ArduinoJson**, **ESP32** board package.
3. Edit WiFi credentials and backend URL in the sketch.
4. Flash to ESP32 via USB.

See [hardware/setup_guide.md](hardware/setup_guide.md) for full assembly and flashing instructions.

---

### Hardware

See [hardware/](hardware/) for:
- [Wiring diagram](hardware/wiring_diagram.md)
- [Component list](hardware/components.md)
- [Assembly & flashing guide](hardware/setup_guide.md)
- [Schematics](hardware/schematics/)

---

## License

MIT
