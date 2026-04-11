"""
app.py
VoltVigil ML microservice — serves severity predictions via a Flask REST API.

Start with:  python app.py
Runs on:     http://0.0.0.0:5001
"""

import json
import os

import joblib
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# Load model artifacts at startup (fail gracefully — don't crash the server)
# ---------------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model        = None
scaler       = None
model_meta   = {}
MODEL_LOADED = False

try:
    model  = joblib.load(os.path.join(BASE_DIR, 'model.pkl'))
    scaler = joblib.load(os.path.join(BASE_DIR, 'scaler.pkl'))
    with open(os.path.join(BASE_DIR, 'model_meta.json')) as fh:
        model_meta = json.load(fh)
    MODEL_LOADED = True
    print(f"[ML] Model loaded: {model_meta.get('model_type')} "
          f"— accuracy {model_meta.get('accuracy')}%")
except FileNotFoundError as exc:
    print(f"[ML] Model files not found ({exc}). "
          "Run 'python generate_data.py && python train.py' first.")

FEATURES = [
    'peakFrequency',
    'amplitude',
    'lat',
    'lng',
    'hourOfDay',
    'frequencyVariance',
    'alertsLastHour',
    'regionRiskScore',
]

REQUIRED_INPUT = [
    'peakFrequency', 'amplitude', 'lat', 'lng',
    'hourOfDay', 'frequencyVariance', 'alertsLastHour',
]


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def compute_region_risk(lat: float, lng: float) -> float:
    if lat > 45 and lng < -115:
        return 0.8   # Pacific Northwest — wildfire / forest fire
    if lat > 32 and lat < 42 and lng < -114:
        return 0.75  # California — wildfire / drought
    if lat < 30 and lng > -85:
        return 0.7   # Florida — hurricane
    if lat < 32 and lng > -97 and lng < -85:
        return 0.65  # Gulf Coast — flood / storm surge
    return 0.4       # Standard


def get_feature_breakdown(peak_frequency: float, region_risk_score: float,
                          alerts_last_hour: int, frequency_variance: float) -> dict:
    # Frequency risk
    if peak_frequency < 500:
        freq_risk = 'low'
    elif peak_frequency < 1000:
        freq_risk = 'medium'
    elif peak_frequency < 1500:
        freq_risk = 'high'
    else:
        freq_risk = 'critical'

    # Region risk
    if region_risk_score >= 0.75:
        region_risk = 'high'
    elif region_risk_score >= 0.6:
        region_risk = 'elevated'
    else:
        region_risk = 'standard'

    # Behavior risk (activity + variance)
    if alerts_last_hour >= 8 or frequency_variance > 300:
        behavior_risk = 'high'
    elif alerts_last_hour >= 4 or frequency_variance > 150:
        behavior_risk = 'elevated'
    else:
        behavior_risk = 'normal'

    return {
        'frequencyRisk': freq_risk,
        'regionRisk':    region_risk,
        'behaviorRisk':  behavior_risk,
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route('/predict', methods=['POST'])
def predict():
    if not MODEL_LOADED:
        return jsonify({
            'error': 'Model not loaded. Run generate_data.py then train.py.'
        }), 503

    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Request body must be JSON'}), 400

    missing = [f for f in REQUIRED_INPUT if f not in data]
    if missing:
        return jsonify({'error': f'Missing required fields: {missing}'}), 400

    # Derive region risk from coordinates
    region_risk_score = compute_region_risk(float(data['lat']), float(data['lng']))

    # Build feature vector in the same column order used during training
    feature_vector = np.array([[
        float(data['peakFrequency']),
        float(data['amplitude']),
        float(data['lat']),
        float(data['lng']),
        int(data['hourOfDay']),
        float(data['frequencyVariance']),
        int(data['alertsLastHour']),
        region_risk_score,
    ]])

    scaled = scaler.transform(feature_vector)

    predicted_severity = model.predict(scaled)[0]
    probabilities      = model.predict_proba(scaled)[0]
    confidence         = float(probabilities.max())

    feature_breakdown = get_feature_breakdown(
        float(data['peakFrequency']),
        region_risk_score,
        int(data['alertsLastHour']),
        float(data['frequencyVariance']),
    )

    return jsonify({
        'predictedSeverity': predicted_severity,
        'confidence':        round(confidence, 4),
        'featureBreakdown':  feature_breakdown,
        'modelInfo': (
            f"{model_meta.get('model_type', 'RandomForest')} trained on simulated data — "
            'accuracy improves with real deployment data'
        ),
    })


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status':      'ok',
        'modelLoaded': MODEL_LOADED,
        'accuracy':    f"{model_meta.get('accuracy', 'unknown')}%",
    })


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    print("[ML] VoltVigil prediction service starting on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=False)
