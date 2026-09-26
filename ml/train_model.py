"""
Employee Attrition Prediction & Workforce Analytics - Machine Learning Pipeline
Trains calibrated classification models (Logistic Regression, Random Forest, Gradient Boosting)
on workforce data and exports metrics, benchmarks, and model artifacts.
"""

import json
import math
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)
import joblib

np.random.seed(42)

def generate_workforce_dataset(n_samples=1500):
    """
    Generates realistic workforce analytics dataset modeled after enterprise HR attrition patterns:
    Inputs:
      - Employee age (18 - 65)
      - Salary / Monthly Income ($2,000 - $25,000)
      - Experience / Total Working Years (0 - 40)
      - Department (Research & Development, Sales, Human Resources, Engineering, Marketing, Finance)
      - Job satisfaction parameters:
          * job_satisfaction (1-5)
          * work_life_balance (1-5)
          * environment_satisfaction (1-5)
          * relationship_satisfaction (1-5)
      - Overtime (Yes/No: 1 or 0)
    """
    departments = [
        "Research & Development",
        "Sales",
        "Human Resources",
        "Engineering",
        "Marketing",
        "Finance"
    ]
    dept_weights = [0.35, 0.25, 0.08, 0.18, 0.08, 0.06]

    # 1. Age: mean 37, std 8.5, clipped 20-62
    ages = np.clip(np.random.normal(37, 8.5, n_samples).astype(int), 20, 62)

    # 2. Experience: positively correlated with age
    # min experience 0, max roughly age - 18
    max_exp = np.maximum(0, ages - 19)
    exp_ratio = np.random.beta(2, 3, n_samples)
    experiences = np.clip(np.round(max_exp * exp_ratio).astype(int), 0, 40)

    # 3. Department
    dept = np.random.choice(departments, size=n_samples, p=dept_weights)

    # 4. Salary: base on experience, department, with lognormal variance
    dept_multiplier = {
        "Engineering": 1.25,
        "Research & Development": 1.15,
        "Sales": 1.05,
        "Finance": 1.10,
        "Marketing": 0.95,
        "Human Resources": 0.90
    }
    
    salaries = []
    for a, exp, d in zip(ages, experiences, dept):
        base = 2800 + exp * 450 + (a - 20) * 120
        mult = dept_multiplier[d]
        noise = np.random.lognormal(0, 0.25)
        sal = int(np.clip(base * mult * noise, 2200, 24500))
        salaries.append(sal)
    salaries = np.array(salaries)

    # 5. Overtime: ~28% of employees
    # Slightly higher in Sales and Engineering
    ot_prob = [0.38 if d in ["Sales", "Engineering"] else 0.25 for d in dept]
    overtime = (np.random.rand(n_samples) < ot_prob).astype(int)

    # 6. Job satisfaction parameters (1 to 5 scale, 1: Very Low, 5: Very High)
    # Stressed/Overtime employees have slightly lower satisfaction
    job_sat = np.clip(np.random.choice([1, 2, 3, 4, 5], n_samples, p=[0.10, 0.20, 0.35, 0.25, 0.10]) - (overtime * np.random.binomial(1, 0.3, n_samples)), 1, 5)
    wlb = np.clip(np.random.choice([1, 2, 3, 4, 5], n_samples, p=[0.12, 0.23, 0.35, 0.20, 0.10]) - (overtime * np.random.binomial(1, 0.45, n_samples)), 1, 5)
    env_sat = np.random.choice([1, 2, 3, 4, 5], n_samples, p=[0.10, 0.20, 0.36, 0.24, 0.10])
    rel_sat = np.random.choice([1, 2, 3, 4, 5], n_samples, p=[0.08, 0.18, 0.38, 0.26, 0.10])

    # Composite satisfaction parameter
    composite_sat = (job_sat + wlb + env_sat + rel_sat) / 4.0

    # 7. Ground Truth Attrition Calculation (Calibrated log-odds formula)
    # Statistical drivers:
    # - Overtime: strongly increases odds (+1.35)
    # - Low satisfaction: strongly increases odds (+1.2 for composite <= 2.2, -0.9 for >= 4)
    # - Young age (< 28) or early experience (< 3 years): higher flight risk (+0.75)
    # - Below average salary: increases odds (+0.8)
    # - Department risk variation (Sales & Marketing higher turnover, R&D & Finance lower)
    dept_risk_log_odds = {
        "Sales": 0.45,
        "Marketing": 0.35,
        "Human Resources": 0.25,
        "Engineering": 0.05,
        "Research & Development": -0.20,
        "Finance": -0.30
    }
    
    log_odds = -2.35  # baseline approx 16% turnover
    log_odds += overtime * 1.45
    log_odds += (5 - composite_sat) * 0.65
    log_odds += np.where(salaries < 4500, 0.85, np.where(salaries > 12000, -0.95, -0.15))
    log_odds += np.where(experiences < 3, 0.70, np.where(experiences > 12, -0.65, -0.10))
    log_odds += np.where(ages < 29, 0.55, np.where(ages > 45, -0.50, 0.0))
    log_odds += np.array([dept_risk_log_odds[d] for d in dept])
    
    # Add idiosyncratic personal variance
    log_odds += np.random.normal(0, 0.45, n_samples)
    
    probabilities = 1.0 / (1.0 + np.exp(-log_odds))
    attrition = (np.random.rand(n_samples) < probabilities).astype(int)

    df = pd.DataFrame({
        "employee_id": [f"EMP-{1000 + i}" for i in range(n_samples)],
        "name": [f"Employee {1000 + i}" for i in range(n_samples)],
        "age": ages,
        "salary": salaries,
        "experience": experiences,
        "department": dept,
        "job_satisfaction": job_sat,
        "work_life_balance": wlb,
        "environment_satisfaction": env_sat,
        "relationship_satisfaction": rel_sat,
        "composite_satisfaction": np.round(composite_sat, 2),
        "overtime": overtime,
        "attrition": attrition,
        "ground_truth_prob": np.round(probabilities, 4)
    })
    
    return df

def main():
    print("==================================================")
    print("Generating Workforce Analytics Dataset...")
    df = generate_workforce_dataset(1500)
    
    print(f"Total Employees: {len(df)}")
    print(f"Attrition Rate: {df['attrition'].mean():.2%}")
    print("\nAttrition by Department:")
    print(df.groupby('department')['attrition'].agg(['count', 'mean']).rename(columns={'mean': 'attrition_rate'}))
    print("\nAttrition by Overtime:")
    print(df.groupby('overtime')['attrition'].agg(['count', 'mean']).rename(columns={'mean': 'attrition_rate'}))

    # Save CSV
    df.to_csv("ml/dataset.csv", index=False)
    print("Saved dataset to ml/dataset.csv")

    # Feature definitions
    numeric_features = ["age", "salary", "experience", "job_satisfaction", "work_life_balance", "environment_satisfaction", "relationship_satisfaction"]
    categorical_features = ["department"]
    binary_features = ["overtime"]

    all_features = numeric_features + categorical_features + binary_features
    X = df[all_features]
    y = df["attrition"]

    # Strict featurization ordering: Train/Test split BEFORE any fit
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print(f"\nTrain set: {len(X_train)} samples, Test set: {len(X_test)} samples")

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_features),
            ("cat", OneHotEncoder(drop="first", sparse_output=False), categorical_features),
            ("bin", "passthrough", binary_features)
        ]
    )

    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42, C=1.0),
        "Random Forest": RandomForestClassifier(n_estimators=150, max_depth=6, min_samples_leaf=4, random_state=42),
        "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, learning_rate=0.08, max_depth=4, random_state=42)
    }

    results = {}
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    best_model_name = None
    best_roc_auc = -1.0
    fitted_pipelines = {}

    print("\nEvaluating Models:")
    for name, clf in models.items():
        pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("classifier", clf)
        ])

        # Cross-validation
        cv_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring="roc_auc")
        pipeline.fit(X_train, y_train)
        fitted_pipelines[name] = pipeline

        y_pred = pipeline.predict(X_test)
        y_prob = pipeline.predict_proba(X_test)[:, 1]

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        auc = roc_auc_score(y_test, y_prob)
        cm = confusion_matrix(y_test, y_pred).tolist()

        results[name] = {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1": round(float(f1), 4),
            "roc_auc": round(float(auc), 4),
            "cv_roc_auc_mean": round(float(np.mean(cv_scores)), 4),
            "cv_roc_auc_std": round(float(np.std(cv_scores)), 4),
            "confusion_matrix": cm
        }

        print(f"[{name}] Acc: {acc:.3f} | Prec: {prec:.3f} | Rec: {rec:.3f} | F1: {f1:.3f} | ROC-AUC: {auc:.3f} (CV: {np.mean(cv_scores):.3f} +/- {np.std(cv_scores):.3f})")

        if auc > best_roc_auc:
            best_roc_auc = auc
            best_model_name = name

    print(f"\nOptimal Production Model Selected: {best_model_name} (ROC-AUC: {best_roc_auc:.4f})")

    # Logistic Regression coefficients for exact interpretable risk odds calculation
    lr_pipeline = fitted_pipelines["Logistic Regression"]
    cat_feature_names = lr_pipeline.named_steps["preprocessor"].named_transformers_["cat"].get_feature_names_out(categorical_features).tolist()
    feature_names = numeric_features + cat_feature_names + binary_features

    lr_coefs = lr_pipeline.named_steps["classifier"].coef_[0].tolist()
    lr_intercept = float(lr_pipeline.named_steps["classifier"].intercept_[0])

    scaler_means = lr_pipeline.named_steps["preprocessor"].named_transformers_["num"].mean_.tolist()
    scaler_scales = lr_pipeline.named_steps["preprocessor"].named_transformers_["num"].scale_.tolist()

    # Feature Importance from Random Forest / Gradient Boosting
    rf_pipeline = fitted_pipelines["Random Forest"]
    rf_importances = rf_pipeline.named_steps["classifier"].feature_importances_.tolist()

    feature_analysis = []
    for f, c, imp in zip(feature_names, lr_coefs, rf_importances):
        feature_analysis.append({
            "feature": f,
            "logistic_weight": round(float(c), 4),
            "importance": round(float(imp), 4),
            "impact_direction": "Increases Attrition" if c > 0 else "Protects Retention"
        })

    # Department attrition benchmarks for HR platform
    dept_benchmarks = df.groupby("department").agg(
        total_count=("attrition", "count"),
        attrition_count=("attrition", "sum"),
        attrition_rate=("attrition", "mean"),
        avg_salary=("salary", "mean"),
        avg_experience=("experience", "mean")
    ).round(3).to_dict(orient="index")

    # Salary bracket attrition benchmark
    salary_bins = [0, 4000, 7000, 11000, 16000, 30000]
    salary_labels = ["<$4k Entry", "$4k-$7k Mid-Junior", "$7k-$11k Senior", "$11k-$16k Lead/Manager", "$16k+ Executive"]
    df["salary_bracket"] = pd.cut(df["salary"], bins=salary_bins, labels=salary_labels)
    salary_benchmarks = df.groupby("salary_bracket", observed=False)["attrition"].agg(["count", "mean"]).round(3).to_dict(orient="index")

    # Experience bracket benchmark
    exp_bins = [-1, 2, 5, 10, 20, 50]
    exp_labels = ["0-2 yrs (High Risk)", "3-5 yrs", "6-10 yrs", "11-20 yrs", "20+ yrs"]
    df["exp_bracket"] = pd.cut(df["experience"], bins=exp_bins, labels=exp_labels)
    exp_benchmarks = df.groupby("exp_bracket", observed=False)["attrition"].agg(["count", "mean"]).round(3).to_dict(orient="index")

    # Overtime benchmark
    ot_benchmarks = df.groupby("overtime")["attrition"].agg(["count", "mean"]).round(3).to_dict(orient="index")

    # Package metadata for React app & backend
    metadata = {
        "models_evaluated": results,
        "selected_model": best_model_name,
        "dataset_summary": {
            "total_records": len(df),
            "overall_attrition_rate": round(float(df["attrition"].mean()), 4),
            "avg_age": round(float(df["age"].mean()), 1),
            "avg_salary": round(float(df["salary"].mean()), 1),
            "avg_experience": round(float(df["experience"].mean()), 1),
            "overtime_ratio": round(float(df["overtime"].mean()), 4),
            "high_risk_count": int((df["ground_truth_prob"] >= 0.6).sum()),
            "medium_risk_count": int(((df["ground_truth_prob"] >= 0.3) & (df["ground_truth_prob"] < 0.6)).sum()),
            "low_risk_count": int((df["ground_truth_prob"] < 0.3).sum())
        },
        "feature_weights": feature_analysis,
        "logistic_parameters": {
            "numeric_features": numeric_features,
            "scaler_means": scaler_means,
            "scaler_scales": scaler_scales,
            "categorical_features": categorical_features,
            "cat_feature_names": cat_feature_names,
            "binary_features": binary_features,
            "feature_names": feature_names,
            "coefficients": lr_coefs,
            "intercept": lr_intercept
        },
        "benchmarks": {
            "by_department": dept_benchmarks,
            "by_salary_bracket": salary_benchmarks,
            "by_experience_bracket": exp_benchmarks,
            "by_overtime": ot_benchmarks
        }
    }

    with open("ml/model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    # Save joblib model
    joblib.dump(fitted_pipelines[best_model_name], "ml/best_attrition_model.joblib")
    joblib.dump(fitted_pipelines["Logistic Regression"], "ml/logistic_regression_model.joblib")

    print("\nSaved artifacts:")
    print(" - ml/model_metadata.json")
    print(" - ml/best_attrition_model.joblib")
    print(" - ml/logistic_regression_model.joblib")
    print(" - ml/dataset.csv")
    print("==================================================")

if __name__ == "__main__":
    main()
