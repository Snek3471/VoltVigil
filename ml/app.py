from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)

FEATURES = [
    'avg_80', 'avg_100', 'avg_120',
    'avg_180', 'avg_200', 'avg_220',
    'avg_280', 'avg_300', 'avg_320',
    'avg_lowband_20_80',
    'avg_band_80_140',
    'avg_band_170_230',
    'avg_band_270_330',
    'avg_hiss_800_4000',
]

model_data = None
model = None

def load_model():
    global model_data, model
    try:
        model_data = joblib.load('corona_rf_model.pkl')
        model = model_data['model']
        print(f"[ML] Model loaded: {model_data['model_name']}")
        print(f"[ML] Test accuracy: {model_data['test_accuracy']:.3f}")
        print(f"[ML] Trained on: {model_data['n_original_samples']} real INMP441 samples")
        print(f"[ML] Augmented to: {model_data['n_augmented_samples']} samples")
    except Exception as e:
        print(f'[ML] No model found: {e} — run train.py first')

def risk_from_prob(p):
    if p >= 0.70: return 'HIGH RISK'
    if p >= 0.35: return 'MEDIUM RISK'
    return 'LOW RISK'

def severity_from_prob(p):
    if p >= 0.70: return 'critical'
    if p >= 0.50: return 'high'
    if p >= 0.35: return 'medium'
    return 'low'

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'modelLoaded': model is not None,
        'modelName': model_data['model_name'] if model_data else None,
        'testAccuracy': model_data['test_accuracy'] if model_data else None,
        'trainedOn': 'real_inmp441_data',
        'originalSamples': model_data['n_original_samples'] if model_data else None,
    })

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Model not loaded — run train.py first'}), 503

    data = request.json
    features = data.get('features', {})

    # Build feature vector — 0.0 for any missing features
    vector = np.array([[features.get(f, 0.0) for f in FEATURES]])

    corona_prob = float(model.predict_proba(vector)[0][1])
    predicted_label = int(model.predict(vector)[0])
    confidence = corona_prob if predicted_label == 1 else (1 - corona_prob)

    return jsonify({
        'coronaProbability': round(corona_prob, 4),
        'isCorona': bool(predicted_label),
        'severity': severity_from_prob(corona_prob),
        'confidence': round(confidence, 4),
        'riskLevel': risk_from_prob(corona_prob),
        'modelName': model_data['model_name'],
        'modelAccuracy': model_data['test_accuracy'],
        'dataSource': 'real_inmp441_microphone',
        'modelInfo': f"{model_data['model_name']} trained on {model_data['n_original_samples']} real samples from INMP441 mic",
    })

def warmup_model():
    if model is None:
        return
    dummy = np.zeros((1, len(FEATURES)))
    model.predict_proba(dummy)
    print('[ML] Model warmed up and ready')

load_model()
warmup_model()

if __name__ == '__main__':
    app.run(port=5001, debug=False)
