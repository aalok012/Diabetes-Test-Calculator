from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
import pandas as pd
import shap
from pydantic import BaseModel, field_validator
from sklearn.metrics import roc_auc_score, precision_score, recall_score
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "..", "model")

model = joblib.load(os.path.join(MODEL_DIR, "model.pk1"))
scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.pk1"))

FEATURE_NAMES = [
    "Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
    "Insulin", "BMI", "DiabetesPedigreeFunction", "Age",
]

# Build SHAP explainer once at startup using training data as background
_df = pd.read_csv(os.path.join(MODEL_DIR, "diabetes.csv"))
_X_train = scaler.transform(_df[FEATURE_NAMES].values)
explainer = shap.LinearExplainer(model, _X_train, feature_perturbation="interventional")


class PatientData(BaseModel):
    Pregnancies: float
    Glucose: float
    BloodPressure: float
    SkinThickness: float
    Insulin: float
    BMI: float
    DiabetesPedigreeFunction: float
    Age: float

    @field_validator("Glucose")
    @classmethod
    def glucose_nonzero(cls, v):
        if v <= 0:
            raise ValueError("Glucose must be greater than 0")
        return v

    @field_validator("BMI")
    @classmethod
    def bmi_nonzero(cls, v):
        if v <= 0:
            raise ValueError("BMI must be greater than 0")
        return v

    @field_validator("BloodPressure")
    @classmethod
    def bp_nonzero(cls, v):
        if v <= 0:
            raise ValueError("BloodPressure must be greater than 0")
        return v


@app.post("/predict")
def predict(data: PatientData):
    input_array = np.array([[
        data.Pregnancies, data.Glucose, data.BloodPressure, data.SkinThickness,
        data.Insulin, data.BMI, data.DiabetesPedigreeFunction, data.Age,
    ]])
    scaled = scaler.transform(input_array)

    probability = float(model.predict_proba(scaled)[0][1])
    risk_level = "high" if probability >= 0.5 else "low"

    shap_vals = explainer.shap_values(scaled)
    # LinearExplainer returns shape (n_samples, n_features) for binary classification
    if isinstance(shap_vals, list):
        shap_vals = shap_vals[1]
    shap_dict = {name: float(val) for name, val in zip(FEATURE_NAMES, shap_vals[0])}

    return {
        "probability": probability,
        "shap_values": shap_dict,
        "risk_level": risk_level,
    }


@app.get("/model-info")
def model_info():
    df = pd.read_csv(os.path.join(MODEL_DIR, "diabetes.csv"))
    X = scaler.transform(df[FEATURE_NAMES].values)
    y = df["Outcome"].values

    proba = model.predict_proba(X)[:, 1]
    preds = (proba >= 0.5).astype(int)

    return {
        "auc": float(roc_auc_score(y, proba)),
        "precision": float(precision_score(y, preds)),
        "recall": float(recall_score(y, preds)),
        "threshold": 0.5,
    }
