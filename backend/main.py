from fastapi import FastAPI
import joblib
from pydantic import BaseModel

app = FastAPI()



model = joblib.load('../model/model.pk1')
scaler = joblib.load('../model/scaler.pk1')

class PatientData(BaseModel):
    Pregnancies: float
    Glucose: float
    BloodPressure: float
    SkinThickness: float
    Insulin: float
    BMI: float
    DiabetesPedigreeFunction: float
    Age: float
    
@app.post("/predict")
def predict(data: PatientData)
    
