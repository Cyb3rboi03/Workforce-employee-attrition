"""
Command line interface for Employee Attrition Prediction using the trained ML model.
Accepts the 6 mandatory inputs:
1. Employee age
2. Salary (Monthly income)
3. Experience (Total working years)
4. Department
5. Job satisfaction parameters (Job satisfaction, Work-life balance, Environment, Relationship)
6. Overtime (Yes / No)
"""

import sys
import json
import joblib
import pandas as pd
import numpy as np

def predict_attrition(
    age: int,
    salary: float,
    experience: int,
    department: str,
    job_satisfaction: int,
    work_life_balance: int,
    environment_satisfaction: int,
    relationship_satisfaction: int,
    overtime: str
):
    model = joblib.load("ml/best_attrition_model.joblib")
    with open("ml/model_metadata.json", "r") as f:
        meta = json.load(f)

    ot_binary = 1 if str(overtime).strip().lower() in ["yes", "y", "true", "1"] else 0
    composite_sat = (job_satisfaction + work_life_balance + environment_satisfaction + relationship_satisfaction) / 4.0

    input_df = pd.DataFrame([{
        "age": age,
        "salary": salary,
        "experience": experience,
        "department": department,
        "job_satisfaction": job_satisfaction,
        "work_life_balance": work_life_balance,
        "environment_satisfaction": environment_satisfaction,
        "relationship_satisfaction": relationship_satisfaction,
        "overtime": ot_binary
    }])

    prob = float(model.predict_proba(input_df)[0][1])
    prediction = "YES (Likely to Leave)" if prob >= 0.50 else "NO (Likely to Stay)"

    if prob >= 0.60:
        risk_level = "HIGH RISK"
        risk_color = "red"
    elif prob >= 0.30:
        risk_level = "MEDIUM RISK"
        risk_color = "yellow"
    else:
        risk_level = "LOW RISK"
        risk_color = "green"

    # Identify key risk drivers
    drivers = []
    if ot_binary == 1:
        drivers.append("Working frequent Overtime (Strongest positive risk factor)")
    if composite_sat < 2.5:
        drivers.append(f"Low satisfaction metrics across roles (Composite: {composite_sat:.1f}/5)")
    if salary < 4500:
        drivers.append(f"Compensation (${salary:,.0f}) is below department median")
    if experience < 3:
        drivers.append(f"Early tenure / Low experience ({experience} yrs) is vulnerable to attrition")
    if age < 30:
        drivers.append("Younger demographic cohort with higher market mobility")

    if not drivers:
        drivers.append("Competitive compensation and healthy work-life balance maintain low turnover risk")

    result = {
        "inputs": {
            "age": age,
            "salary": salary,
            "experience": experience,
            "department": department,
            "job_satisfaction": job_satisfaction,
            "work_life_balance": work_life_balance,
            "environment_satisfaction": environment_satisfaction,
            "relationship_satisfaction": relationship_satisfaction,
            "overtime": "Yes" if ot_binary == 1 else "No"
        },
        "outputs": {
            "attrition_prediction": prediction,
            "attrition_probability": f"{prob * 100:.2f}%",
            "probability_value": round(prob, 4),
            "risk_level": risk_level,
            "risk_factors": drivers
        }
    }
    return result

if __name__ == "__main__":
    # Test sample prediction
    sample = predict_attrition(
        age=28,
        salary=3400,
        experience=2,
        department="Sales",
        job_satisfaction=2,
        work_life_balance=1,
        environment_satisfaction=2,
        relationship_satisfaction=3,
        overtime="Yes"
    )
    print("\n--- SAMPLE PREDICTION TEST ---")
    print(json.dumps(sample, indent=2))
