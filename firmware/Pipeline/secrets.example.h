// Copy this file to secrets.h (same folder) and fill in your values.
// secrets.h is gitignored, so never commit real credentials.
#pragma once

#define WIFI_SSID     "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Backend ingest endpoint. Use the LAN IP the backend prints on startup.
#define SERVER_URL    "http://YOUR_BACKEND_HOST:5000/api/alerts"
