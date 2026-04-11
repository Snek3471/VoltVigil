# VoltVigil – Frontend

React (Vite) dashboard for the VoltVigil power grid fault detection system.

## Features

- **Leaflet.js map** with 12 sensor node markers, colour-coded by severity
- **Live FFT chart** (Recharts) updating via Socket.io events
- **Alert feed panel** listing recent fault events
- Dark monitoring-dashboard theme

## Setup

```bash
cp .env.example .env   # set VITE_BACKEND_URL
npm install
npm run dev            # development server on http://localhost:5173
npm run build          # production build
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_BACKEND_URL` | `http://localhost:5000` | Backend API + Socket.io URL |

