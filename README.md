# Diabetictor — Diabetes Risk Assessment Tool

A full-stack web application that predicts an individual's risk of diabetes using a machine learning model trained on the **Pima Indians Diabetes Dataset (NIDDK)**. The app provides an interactive clinical questionnaire, a probability score with a visual gauge, SHAP-based feature explanations, and population comparison charts.

> **Medical Disclaimer:** Diabetictor is an educational tool only and does not constitute a medical diagnosis or clinical recommendation. Always consult a qualified healthcare professional before making health-related decisions.

---

## Features

- **Multi-step clinical questionnaire** — walks through 8 health parameters one at a time with slider inputs and sensible defaults for unknown values
- **Risk probability score** — logistic regression model outputs a 0–100% diabetes risk with a speedometer-style gauge
- **SHAP explainability** — per-prediction feature importance chart showing which factors increase or decrease risk
- **Population comparison radar** — plots your clinical profile against diabetic and non-diabetic population averages
- **Model performance dashboard** — live AUC, Precision, and Recall metrics served from the backend
- **Fully responsive UI** — clean medical-green design built with React and Recharts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Recharts |
| Backend | FastAPI, Uvicorn |
| ML | scikit-learn (Logistic Regression), SHAP, joblib |
| Data | Pima Indians Diabetes Dataset (NIDDK) |

---

## Project Structure

```
Diabetictor/
├── backend/
│   ├── main.py               # FastAPI app — /predict and /model-info endpoints
│   ├── requirements.txt      # Python dependencies
│   └── model/
│       ├── model.pk1         # Trained logistic regression model
│       ├── scaler.pk1        # StandardScaler fitted on training data
│       ├── diabetes.csv      # Pima Indians dataset
│       └── explore.ipynb     # Model training & exploration notebook
└── frontend/
    ├── src/
    │   ├── App.jsx           # Main React app (form, results, charts)
    │   ├── App.css           # All styles
    │   └── main.jsx          # Entry point
    ├── package.json
    └── vite.config.js
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### 1. Backend

```bash
cd backend

# Create and activate a virtual environment (optional but recommended)
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## API Reference

### `POST /predict`

Accepts patient data and returns a risk probability with SHAP values.

**Request body:**
```json
{
  "Pregnancies": 3,
  "Glucose": 120,
  "BloodPressure": 69,
  "SkinThickness": 20,
  "Insulin": 79,
  "BMI": 32.0,
  "DiabetesPedigreeFunction": 0.47,
  "Age": 33
}
```

**Response:**
```json
{
  "probability": 0.38,
  "risk_level": "low",
  "shap_values": {
    "Glucose": 0.12,
    "BMI": 0.08,
    ...
  }
}
```

### `GET /model-info`

Returns model performance metrics evaluated on the training dataset.

```json
{
  "auc": 0.84,
  "precision": 0.76,
  "recall": 0.68,
  "threshold": 0.5
}
```

---

## Input Features

| Feature | Description | Unit |
|---|---|---|
| Pregnancies | Number of times pregnant | — |
| Plasma Glucose | Blood glucose 2 hrs after oral glucose tolerance test | mg/dL |
| Diastolic Blood Pressure | Diastolic blood pressure | mmHg |
| Triceps Skin Fold | Skin fold thickness at the tricep | mm |
| Serum Insulin | 2-hour serum insulin | µU/mL |
| BMI | Body mass index (weight/height²) | kg/m² |
| Diabetes Pedigree Function | Genetic influence score based on family history | — |
| Age | Current age | years |

---

## How It Works

1. The user fills in up to 8 clinical parameters via a guided form (or skips to use the dataset average as a default).
2. The frontend sends values to `POST /predict` on the FastAPI backend.
3. The backend scales the input with a pre-fitted `StandardScaler`, runs the logistic regression model, and computes SHAP values using `shap.LinearExplainer`.
4. The response is rendered as a gauge chart, a SHAP bar chart, and a radar comparison against population averages from the original dataset.

---

## Screenshots


## License

This project is for educational and demonstrative purposes only.
