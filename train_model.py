import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
import seaborn as sns
import matplotlib.pyplot as plt
import joblib

# ===== LOAD DATA =====
file_path = "/Users/piyushsethy/Downloads/corona_audio_dataset_labeled.csv"
df = pd.read_csv(file_path)

print("\n=== DATA PREVIEW ===")
print(df.head())

# ===== CLEAN COLUMN NAMES =====
df.columns = df.columns.str.strip()

# ===== FEATURES & LABEL =====
X = df.drop(columns=["noise_type", "label"])
y = df["label"]

# ===== TRAIN TEST SPLIT =====
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# ===== MODEL =====
model = RandomForestClassifier(
    n_estimators=200,   # slightly stronger
    max_depth=6,
    random_state=42
)

# ===== TRAIN =====
model.fit(X_train, y_train)

# ===== PREDICT =====
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]  # only corona probability

# ===== EVALUATION =====
print("\n=== ACCURACY ===")
print(accuracy_score(y_test, y_pred))

print("\n=== CLASSIFICATION REPORT ===")
print(classification_report(y_test, y_pred))

# ===== CONFUSION MATRIX =====
cm = confusion_matrix(y_test, y_pred)

plt.figure(figsize=(6, 4))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues")
plt.title("Confusion Matrix")
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.show()

# ===== FEATURE IMPORTANCE =====
importances = model.feature_importances_

feature_importance_df = pd.DataFrame({
    "feature": X.columns,
    "importance": importances
}).sort_values(by="importance", ascending=False)

print("\n=== FEATURE IMPORTANCE ===")
print(feature_importance_df)

# ===== RISK CLASSIFICATION =====
def risk_from_prob(p):
    if p >= 0.70:
        return "HIGH RISK"
    elif p >= 0.35:
        return "MEDIUM RISK"
    else:
        return "LOW RISK"

risk_levels = [risk_from_prob(p) for p in y_prob]

# ===== CLEAN RESULTS TABLE =====
results_df = pd.DataFrame({
    "actual_label": y_test.values,
    "predicted_label": y_pred,
    "corona_probability": y_prob,
    "risk_level": risk_levels
})

# round for readability
results_df["corona_probability"] = results_df["corona_probability"].round(3)

print("\n=== PREDICTION RESULTS ===")
print(results_df)

print("\n=== RISK DISTRIBUTION ===")
print(results_df["risk_level"].value_counts())

# ===== SAVE MODEL =====
joblib.dump(model, "corona_rf_model.pkl")
print("\nModel saved as corona_rf_model.pkl")