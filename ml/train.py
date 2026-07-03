import pandas as pd
import numpy as np
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, classification_report,
    confusion_matrix, roc_auc_score
)
import joblib
import warnings
warnings.filterwarnings('ignore')

print("=" * 50)
print("VoltVigil Corona Discharge ML Trainer")
print("Real data from INMP441 microphone module")
print("=" * 50)

# ===== LOAD REAL DATA =====
df = pd.read_csv('corona_audio_dataset_labeled.csv')
df.columns = df.columns.str.strip()

print(f"\nDataset loaded: {len(df)} samples")
print(f"Label distribution:\n{df['label'].value_counts()}")
print(f"\nNoise types present:\n{df['noise_type'].value_counts()}")

# ===== FEATURES =====
# Use only features the ESP32 actually sends
# max_100 is in the CSV but not sent by ESP32 — exclude it
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

X = df[FEATURES].values
y = df['label'].values

print(f"\nFeatures used: {len(FEATURES)}")
print(f"Corona samples (label=1): {sum(y == 1)}")
print(f"Non-corona samples (label=0): {sum(y == 0)}")

# ===== HANDLE SMALL DATASET WITH AUGMENTATION =====
# Dataset is small (45 samples) so we augment with small Gaussian noise
# to improve generalization without distorting the real signal patterns
print("\nAugmenting dataset with noise variants...")

X_aug = list(X)
y_aug = list(y)

np.random.seed(42)
for i in range(len(X)):
    for _ in range(8):  # 8x augmentation per sample
        noise_scale = 0.05 * np.std(X[i])
        augmented = X[i] + np.random.normal(0, noise_scale, X[i].shape)
        augmented = np.clip(augmented, 0, None)  # keep non-negative
        X_aug.append(augmented)
        y_aug.append(y[i])

X_aug = np.array(X_aug)
y_aug = np.array(y_aug)

print(f"Augmented dataset size: {len(X_aug)} samples")
print(f"Corona: {sum(y_aug == 1)}, Non-corona: {sum(y_aug == 0)}")

# ===== TRAIN TEST SPLIT =====
X_train, X_test, y_train, y_test = train_test_split(
    X_aug, y_aug,
    test_size=0.2,
    random_state=42,
    stratify=y_aug
)

# ===== TRAIN RANDOM FOREST =====
print("\nTraining Random Forest...")
rf_model = RandomForestClassifier(
    n_estimators=300,
    max_depth=8,
    min_samples_split=4,
    min_samples_leaf=2,
    max_features='sqrt',
    class_weight='balanced',
    random_state=42,
    n_jobs=-1
)
rf_model.fit(X_train, y_train)

# ===== TRAIN GRADIENT BOOSTING AS BACKUP =====
print("Training Gradient Boosting...")
gb_model = GradientBoostingClassifier(
    n_estimators=200,
    max_depth=4,
    learning_rate=0.05,
    min_samples_split=4,
    random_state=42
)
gb_model.fit(X_train, y_train)

# ===== EVALUATE BOTH =====
rf_pred = rf_model.predict(X_test)
gb_pred = gb_model.predict(X_test)

rf_acc = accuracy_score(y_test, rf_pred)
gb_acc = accuracy_score(y_test, gb_pred)

print(f"\n{'='*50}")
print(f"Random Forest Accuracy:      {rf_acc:.3f}")
print(f"Gradient Boosting Accuracy:  {gb_acc:.3f}")

# ===== CROSS VALIDATION on original (non-augmented) data =====
print("\nCross-validation on original data (5-fold):")
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
rf_cv = cross_val_score(rf_model, X, y, cv=cv, scoring='accuracy')
print(f"RF CV Accuracy: {rf_cv.mean():.3f} (+/- {rf_cv.std():.3f})")

# ===== PICK BEST MODEL =====
if rf_acc >= gb_acc:
    best_model = rf_model
    best_name = "RandomForest"
    best_acc = rf_acc
else:
    best_model = gb_model
    best_name = "GradientBoosting"
    best_acc = gb_acc

print(f"\nBest model: {best_name} ({best_acc:.3f} accuracy)")

# ===== CLASSIFICATION REPORT =====
best_pred = best_model.predict(X_test)
print(f"\n{'='*50}")
print("Classification Report:")
print(classification_report(
    y_test, best_pred,
    target_names=['Non-Corona', 'Corona']
))

# ===== CONFUSION MATRIX =====
cm = confusion_matrix(y_test, best_pred)
print("Confusion Matrix:")
print(f"  True Negative  (correct non-corona): {cm[0][0]}")
print(f"  False Positive (false alarm):         {cm[0][1]}")
print(f"  False Negative (missed corona):       {cm[1][0]}")
print(f"  True Positive  (caught corona):       {cm[1][1]}")

# ===== ROC AUC =====
try:
    auc = roc_auc_score(y_test, best_model.predict_proba(X_test)[:,1])
    print(f"\nROC AUC Score: {auc:.3f}")
except:
    pass

# ===== FEATURE IMPORTANCE =====
if hasattr(best_model, 'feature_importances_'):
    importances = pd.DataFrame({
        'feature': FEATURES,
        'importance': best_model.feature_importances_
    }).sort_values('importance', ascending=False)
    print(f"\n{'='*50}")
    print("Feature Importances (what matters most):")
    print(importances.to_string(index=False))

# ===== VALIDATE AGAINST REAL SAMPLES =====
print(f"\n{'='*50}")
print("Validating against original real samples:")
real_pred = best_model.predict(X)
real_prob = best_model.predict_proba(X)[:,1]

for i, (row, true_label, pred, prob) in enumerate(zip(
    df.itertuples(), y, real_pred, real_prob
)):
    status = "OK" if true_label == pred else "XX"
    noise = row.noise_type
    print(f"  {status} [{noise}] True={true_label} Pred={pred} Corona_prob={prob:.3f}")

real_acc = accuracy_score(y, real_pred)
print(f"\nAccuracy on original real samples: {real_acc:.3f}")

# ===== SAVE MODEL =====
model_data = {
    'model': best_model,
    'features': FEATURES,
    'model_name': best_name,
    'test_accuracy': float(best_acc),
    'real_sample_accuracy': float(real_acc),
    'cv_accuracy': float(rf_cv.mean()),
    'trained_on': 'real_inmp441_data',
    'n_original_samples': len(df),
    'n_augmented_samples': len(X_aug),
}

joblib.dump(model_data, 'corona_rf_model.pkl')
print(f"\n{'='*50}")
print(f"Model saved as corona_rf_model.pkl")
print(f"Model: {best_name}")
print(f"Test accuracy: {best_acc:.3f}")
print("Ready for deployment")
