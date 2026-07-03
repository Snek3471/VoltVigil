# VoltVigil Frontend

Real-time power grid fault detection dashboard built with React, Vite, MapLibre GL, Recharts, and Socket.io.

## Prerequisites

- Node.js 18+
- Backend running on `http://localhost:5000`

## Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if the backend isn't on localhost:5000
```

## Run

```bash
# Development (hot-reload via Vite)
npm run dev
```

Dashboard opens at `http://localhost:5173`.

## Tabs

- **Home** — Landing page with a live-updating 3D globe of sensor nodes
- **Map** — MapLibre GL map (CARTO dark basemap) locked to the continental US, with 4 sensor node markers (1 live + 3 simulated for demo), color-coded by severity
- **Sensors** — Per-node accordion with location, regional risk, live peak-frequency graph, and detection thresholds
- **Notifications** — Subscriber signup and notification log
- **About** — Project overview and live system status

All tabs update in real time via Socket.io (`new_alert` / `alert_updated`).

## Severity Colors

| Severity | Color |
|----------|-------|
| Critical | Red `#ef4444` |
| High | Orange `#f97316` |
| Medium | Yellow `#eab308` |
| Low | Green `#22c55e` |
