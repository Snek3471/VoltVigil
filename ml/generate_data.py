"""
generate_data.py
Generates 2000 synthetic VoltVigil alert samples and saves them to
training_data.csv. Run this once before train.py.
"""

import numpy as np
import pandas as pd

SEED = 42
N_SAMPLES = 2000

rng = np.random.default_rng(SEED)


# ---------------------------------------------------------------------------
# Region risk score derived from GPS coordinates
# ---------------------------------------------------------------------------

def compute_region_risk(lat: np.ndarray, lng: np.ndarray) -> np.ndarray:
    scores = np.full(len(lat), 0.4)  # default: standard
    scores = np.where((lat > 45) & (lng < -115), 0.8, scores)           # Pacific Northwest
    scores = np.where((lat > 32) & (lat < 42) & (lng < -114), 0.75, scores)  # California
    scores = np.where((lat < 30) & (lng > -85), 0.7, scores)            # Florida
    scores = np.where((lat < 32) & (lng > -97) & (lng < -85), 0.65, scores)  # Gulf Coast
    return scores


# ---------------------------------------------------------------------------
# Severity label from final score
# ---------------------------------------------------------------------------

def score_to_severity(score: np.ndarray) -> np.ndarray:
    severity = np.where(score < 0.3, 'low',
               np.where(score < 0.55, 'medium',
               np.where(score < 0.75, 'high', 'critical')))
    return severity


# ---------------------------------------------------------------------------
# Feature generation
# ---------------------------------------------------------------------------

# peakFrequency: slight skew toward lower values (more normal operation)
peak_frequency = rng.uniform(50, 2500, N_SAMPLES)

# amplitude: beta(2,2) → bell-shaped around 0.5
amplitude = rng.beta(2, 2, N_SAMPLES)

# US coordinates
lat = rng.uniform(24, 49, N_SAMPLES)
lng = rng.uniform(-125, -66, N_SAMPLES)

# Hour of day: uniform int
hour_of_day = rng.integers(0, 24, N_SAMPLES)

# Frequency variance: exponential — most readings are stable, some are noisy
frequency_variance = rng.exponential(80, N_SAMPLES).clip(0, 500)

# Alerts last hour: Poisson(3), capped at 20
alerts_last_hour = rng.poisson(3, N_SAMPLES).clip(0, 20)

# Derived
region_risk_score = compute_region_risk(lat, lng)


# ---------------------------------------------------------------------------
# Severity derivation (with noise to prevent perfect separability)
# ---------------------------------------------------------------------------

base_score = np.where(peak_frequency < 500,  0.2,
             np.where(peak_frequency < 1000, 0.4,
             np.where(peak_frequency < 1500, 0.65, 0.85)))

score = (
    base_score
    + amplitude * 0.15
    + region_risk_score * 0.1
    + np.minimum(alerts_last_hour, 10) / 10 * 0.1
    + np.where(frequency_variance > 200, 0.05, 0.0)
    + rng.normal(0, 0.06, N_SAMPLES)   # noise — prevents perfect linear fit
)

score = score.clip(0, 1)
severity = score_to_severity(score)


# ---------------------------------------------------------------------------
# Assemble and save
# ---------------------------------------------------------------------------

df = pd.DataFrame({
    'peakFrequency':    peak_frequency,
    'amplitude':        amplitude,
    'lat':              lat,
    'lng':              lng,
    'hourOfDay':        hour_of_day,
    'frequencyVariance': frequency_variance,
    'alertsLastHour':   alerts_last_hour,
    'regionRiskScore':  region_risk_score,
    'severity':         severity,
})

df.to_csv('training_data.csv', index=False)

print(f"Generated {N_SAMPLES} samples → training_data.csv")
print(f"\nClass distribution:")
print(df['severity'].value_counts().sort_index())
print(f"\nFeature summary:")
print(df.drop(columns=['severity']).describe().round(2))
