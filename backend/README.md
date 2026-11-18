# VoltVigil Backend

Real-time power grid fault detection API built with Node.js, Express, Socket.io, and MongoDB.

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

## Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: MONGO_URI is required; EMAIL_* are optional
```

## Run

```bash
# Development (with hot-reload)
npm run dev

# Production
npm start
```

Server starts on `http://localhost:5000` by default.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/alerts` | Ingest a new fault alert |
| `GET` | `/api/alerts` | List alerts, most recent first, capped at 500 (supports `?severity=` and `?nodeId=` filters) |
| `GET` | `/api/alerts/:id` | Get single alert by ID |
| `DELETE` | `/api/alerts/:id` | Delete alert by ID |
| `POST` | `/api/subscribers` | Subscribe an email to high/critical alerts |
| `GET` | `/api/subscribers` | List active subscribers |
| `PATCH` | `/api/subscribers/:id` | Update subscriber preferences |
| `DELETE` | `/api/subscribers/:id` | Unsubscribe |
| `GET` | `/api/notifications/log` | Last 10 email batches sent |
| `GET` | `/health` | Health check |

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run simulate` | Mock ESP32: replays the labelled dataset as live readings from `sensor-01` |
| `npm run latency` | Measures POST → Socket.io `new_alert` / `alert_updated` latency |

## Socket.io Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `new_alert` | Server → All clients | Alert document with rule-based severity (sent immediately) |
| `alert_updated` | Server → All clients | Same alert after ML classification |

## Alert Schema

```json
{
  "nodeId": "NODE-01",
  "lat": 38.9072,
  "lng": -77.0369,
  "peakFrequency": 1450.5,
  "severity": "high",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

`severity` must be one of: `low`, `medium`, `high`, `critical`
