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
# Edit .env with your MongoDB URI if needed
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
| `GET` | `/api/alerts` | List all alerts (supports `?severity=` and `?nodeId=` filters) |
| `GET` | `/api/alerts/:id` | Get single alert by ID |
| `DELETE` | `/api/alerts/:id` | Delete alert by ID |

## Socket.io Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `connection_status` | Server → Client | `{ connected, message, socketId }` |
| `new_alert` | Server → All clients | Alert document |

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
