const nodemailer = require('nodemailer');
const Subscriber = require('../models/Subscriber');
const NotificationLog = require('../models/NotificationLog');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// In-memory cooldown tracker: { nodeId: lastSentTimestamp }
const lastAlertSent = {};

function formatCoordinates(lat, lng) {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

function getSeverityDescription(severity) {
  switch (severity) {
    case 'critical':
      return 'Critical fault detected. Immediate inspection and potential shutdown required.';
    case 'high':
      return 'Corona discharge detected above high threshold. Immediate inspection recommended.';
    default:
      return 'Fault detected. Please inspect the sensor node.';
  }
}

function buildHtmlEmail(alert) {
  const severityColor = alert.severity === 'critical' ? '#ef4444' : '#f97316';
  const severityLabel = alert.severity.toUpperCase();
  const location = formatCoordinates(alert.lat, alert.lng);
  const detectedAt = new Date(alert.timestamp).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Courier New',Courier,monospace;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#1e293b;border:1px solid #334155;border-radius:8px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="padding:24px 32px;border-bottom:2px solid #334155;">
            <span style="font-size:22px;font-weight:bold;color:#ffffff;font-family:Arial,sans-serif;">Tele</span><span style="font-size:22px;font-weight:bold;color:#facc15;font-family:Arial,sans-serif;">Grid</span>
            <span style="font-size:12px;color:#64748b;margin-left:12px;font-family:Arial,sans-serif;">Power Grid Fault Detection</span>
          </td>
        </tr>

        <!-- Alert Badge -->
        <tr>
          <td style="padding:24px 32px 0 32px;">
            <div style="margin-bottom:8px;">
              <span style="display:inline-block;background-color:${severityColor};color:#ffffff;font-weight:bold;font-size:12px;padding:4px 14px;border-radius:4px;letter-spacing:1px;font-family:Arial,sans-serif;">${severityLabel}</span>
            </div>
            <h2 style="margin:8px 0 0 0;font-size:18px;color:#f1f5f9;font-family:Arial,sans-serif;font-weight:600;">Grid Fault Detected</h2>
            <p style="margin:4px 0 20px 0;color:#94a3b8;font-size:13px;font-family:Arial,sans-serif;">A fault event has been detected by TeleGrid monitoring.</p>
            <hr style="border:none;border-top:1px solid #334155;margin:0;">
          </td>
        </tr>

        <!-- Data Fields -->
        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:16px;width:50%;vertical-align:top;">
                  <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;font-family:Arial,sans-serif;">Sensor ID</div>
                  <div style="font-size:14px;color:#f1f5f9;font-family:'Courier New',monospace;">${alert.nodeId}</div>
                </td>
                <td style="padding-bottom:16px;width:50%;vertical-align:top;">
                  <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;font-family:Arial,sans-serif;">Severity</div>
                  <div style="font-size:14px;color:${severityColor};font-family:'Courier New',monospace;font-weight:bold;">${severityLabel}</div>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:16px;vertical-align:top;">
                  <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;font-family:Arial,sans-serif;">Peak Frequency</div>
                  <div style="font-size:14px;color:#f1f5f9;font-family:'Courier New',monospace;">${alert.peakFrequency} Hz</div>
                </td>
                <td style="padding-bottom:16px;vertical-align:top;">
                  <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;font-family:Arial,sans-serif;">Location</div>
                  <div style="font-size:14px;color:#f1f5f9;font-family:'Courier New',monospace;">${location}</div>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-bottom:0;">
                  <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;font-family:Arial,sans-serif;">Detected At</div>
                  <div style="font-size:14px;color:#f1f5f9;font-family:'Courier New',monospace;">${detectedAt}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- What This Means -->
        <tr>
          <td style="padding:0 32px 24px 32px;">
            <div style="padding:14px 16px;border-left:3px solid ${severityColor};background-color:#0f172a;border-radius:0 4px 4px 0;">
              <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;font-family:Arial,sans-serif;">What This Means</div>
              <div style="font-size:13px;color:#cbd5e1;font-family:Arial,sans-serif;line-height:1.5;">${getSeverityDescription(alert.severity)}</div>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #334155;">
            <p style="margin:0;font-size:12px;color:#475569;font-family:Arial,sans-serif;">This alert was sent by TeleGrid Real-Time Power Grid Fault Detection System.</p>
            <p style="margin:6px 0 0 0;font-size:12px;color:#475569;font-family:Arial,sans-serif;">To unsubscribe, visit the TeleGrid dashboard &rsaquo; Notifications tab.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendAlertEmails(alert) {
  // Only send for high or critical
  if (!['high', 'critical'].includes(alert.severity)) return;

  // Cooldown: skip if same sensor triggered within 5 minutes
  const now = Date.now();
  const lastSent = lastAlertSent[alert.nodeId] || 0;
  if (now - lastSent < 5 * 60 * 1000) {
    console.log(`[Email] Cooldown active for ${alert.nodeId}, skipping`);
    return;
  }
  lastAlertSent[alert.nodeId] = now;

  // Fetch eligible subscribers:
  // - minSeverity 'high' → receives high AND critical alerts
  // - minSeverity 'critical' → receives critical alerts ONLY
  const severityFilter =
    alert.severity === 'critical'
      ? { minSeverity: { $in: ['high', 'critical'] } }
      : { minSeverity: 'high' };

  const subscribers = await Subscriber.find({ active: true, ...severityFilter });

  if (subscribers.length === 0) {
    console.log(`[Email] No eligible subscribers for ${alert.severity} alert, skipping`);
    return;
  }

  const subject = `⚡ TeleGrid Alert — ${alert.severity.toUpperCase()} Fault Detected at ${alert.nodeId}`;
  const html = buildHtmlEmail(alert);

  let notified = 0;
  for (const sub of subscribers) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: sub.email,
        subject,
        html,
      });
      notified++;
      console.log(`[Email] Sent to ${sub.email}`);
    } catch (err) {
      console.error(`[Email] Failed to send to ${sub.email}:`, err.message);
    }
  }

  // Persist notification log entry
  try {
    await NotificationLog.create({
      nodeId: alert.nodeId,
      severity: alert.severity,
      subscribersNotified: notified,
      alertId: alert._id,
    });
    console.log(`[Email] Logged: ${notified} subscriber(s) notified for ${alert.nodeId}`);
  } catch (err) {
    console.error('[Email] Failed to save notification log:', err.message);
  }
}

module.exports = { sendAlertEmails };
