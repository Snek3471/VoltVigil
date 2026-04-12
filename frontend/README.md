# TeleGrid Frontend

Real-time power grid fault detection dashboard built with React, Vite, Leaflet, Recharts, and Socket.io.

## Prerequisites

- Node.js 18+
- Backend running on `http://localhost:5000`

## Setup

```bash
cd frontend
npm install
```

## Run

```bash
# Development (hot-reload via Vite)
npm run dev
```

Dashboard opens at `http://localhost:5173`.

## Features

- **Map View** — Leaflet map centered on Washington D.C. with 12 sensor node markers, color-coded by severity
- **FFT Chart** — Real-time line chart showing peak frequency over the last 20 alerts, with a 2000 Hz threshold reference line
- **Alert Feed** — Scrollable live feed of the 50 most recent alerts, updated instantly via Socket.io
- **Status Bar** — Live connection status indicator and total alert count

## Severity Colors

| Severity | Color |
|----------|-------|
| Critical | Red `#ef4444` |
| High | Orange `#f97316` |
| Medium | Yellow `#eab308` |
| Low | Green `#22c55e` |
