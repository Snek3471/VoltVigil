"""
train.py
Trains a RandomForestClassifier (with GradientBoosting fallback) on the
synthetic VoltVigil training data and saves model.pkl + scaler.pkl.

Run generate_data.py first, then:
    python train.py
"""

import json
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

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
TARGET = 'severity'
ACCURACY_THRESHOLD = 0.85

# ---------------------------------------------------------------------------
# Load data
# ---------------------------------------------------------------------------

print("Loading training_data.csv...")
try:
    df = pd.read_csv('training_data.csv')
except FileNotFoundError:
    raise SystemExit(
        "training_data.csv not found. Run 'python generate_data.py' first."
    )

X = df[FEATURES]
y = df[TARGET]

print(f"  {len(df)} samples, {y.nunique()} classes: {sorted(y.unique())}")

# ---------------------------------------------------------------------------
# Train / test split
# ---------------------------------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"  Train: {len(X_train)}  Test: {len(X_test)}")

# ---------------------------------------------------------------------------
# Scale features
# ---------------------------------------------------------------------------

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)

# ---------------------------------------------------------------------------
# Train RandomForest
# ---------------------------------------------------------------------------

print("\nTraining RandomForestClassifier (n_estimators=100)...")
rf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
rf.fit(X_train_scaled, y_train)
rf_acc = accuracy_score(y_test, rf.predict(X_test_scaled))
print(f"  RandomForest accuracy: {rf_acc:.4f} ({rf_acc*100:.1f}%)")

# ---------------------------------------------------------------------------
# Fallback to GradientBoosting if below threshold
# ---------------------------------------------------------------------------

if rf_acc >= ACCURACY_THRESHOLD:
    model = rf
    model_type = 'RandomForestClassifier'
    accuracy = rf_acc
else:
    print(f"\n  Accuracy {rf_acc:.1%} below {ACCURACY_THRESHOLD:.0%} threshold.")
    print("  Trying GradientBoostingClassifier...")
    gbc = GradientBoostingClassifier(n_estimators=100, random_state=42)
    gbc.fit(X_train_scaled, y_train)
    gbc_acc = accuracy_score(y_test, gbc.predict(X_test_scaled))
    print(f"  GradientBoosting accuracy: {gbc_acc:.4f} ({gbc_acc*100:.1f}%)")
    model = gbc
    model_type = 'GradientBoostingClassifier'
    accuracy = gbc_acc

# ---------------------------------------------------------------------------
# Evaluation report
# ---------------------------------------------------------------------------

y_pred = model.predict(X_test_scaled)

print(f"\n{'='*55}")
print(f"Final model: {model_type}")
print(f"Test accuracy: {accuracy:.4f} ({accuracy*100:.1f}%)")
print(f"{'='*55}")
print("\nClassification report:")
print(classification_report(y_test, y_pred, digits=3))

# Feature importances
if hasattr(model, 'feature_importances_'):
    print("Feature importances:")
    importances = sorted(
        zip(FEATURES, model.feature_importances_),
        key=lambda x: x[1], reverse=True
    )
    for feat, imp in importances:
        bar = '█' * int(imp * 40)
        print(f"  {feat:<22} {imp:.4f}  {bar}")

# ---------------------------------------------------------------------------
# Save artifacts
# ---------------------------------------------------------------------------

joblib.dump(model,  'model.pkl')
joblib.dump(scaler, 'scaler.pkl')

meta = {
    'model_type':      model_type,
    'accuracy':        round(accuracy * 100, 1),
    'n_estimators':    100,
    'features':        FEATURES,
    'training_samples': len(X_train),
    'test_samples':    len(X_test),
}
with open('model_meta.json', 'w') as f:
    json.dump(meta, f, indent=2)

print(f"\nSaved: model.pkl  scaler.pkl  model_meta.json")
print(f"Done. Accuracy: {accuracy*100:.1f}%")
