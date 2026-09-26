# WorkforcePulse - Employee Attrition Prediction & Workforce Analytics Platform

An AI-powered employee attrition prediction and workforce analytics platform designed for HR leaders and people operations teams. Built to predict individual employee flight risk, explain underlying drivers, and model retention interventions.

---

## 📋 System Requirements & Features

### 1. Inputs (6 Core Dimensions)
1. **Employee Age**: Range 18 to 65 years.
2. **Salary (Monthly Income)**: Base monthly compensation ($2,000 – $25,000/mo).
3. **Experience (Tenure)**: Total career experience & organizational tenure (0 – 40 years).
4. **Department**: Research & Development, Sales, Human Resources, Engineering, Marketing, Finance.
5. **Job Satisfaction Parameters (Multi-Factor)**:
   - Overall Job Satisfaction (1 to 5)
   - Work-Life Balance (1 to 5)
   - Environment Satisfaction & Workplace Culture (1 to 5)
   - Relationship Satisfaction with Management & Peers (1 to 5)
   - Composite Satisfaction metric (1.0 to 5.0)
6. **Overtime**: Active overtime requirement (Yes / No).

---

### 2. Outputs
1. **Attrition Prediction**:
   - Binary classification: `YES (Likely to Leave)` vs `NO (Likely to Stay)`.
2. **Attrition Probability**:
   - Calibrated percentage (0.0% – 100.0%) with animated circular gauge and benchmark comparison to workforce baseline.
3. **Risk Probability & Classification**:
   - Risk Tiers:
     - 🔴 **High Risk** ($\ge$ 60% probability): Critical flight risk, urgent intervention needed.
     - 🟡 **Medium Risk** (30% – 59% probability): Moderate risk, proactive retention planning.
     - 🟢 **Low Risk** (< 30% probability): Stable retention profile.
   - **SHAP-Style Factor Attribution**:
     - Highlights positive risk multipliers (e.g. Overtime $+26.4\%$, Low Salary $+14.8\%$) and protective anchors (e.g. 10+ Yrs Experience $-12.0\%$, High Work-Life Balance $-10.8\%$).
   - **Prescriptive HR Retention Playbook**:
     - Actionable steps covering workload rebalancing, compensation benchmarking, flexible hours, and mentorship.
4. **HR Analytics Dashboard**:
   - **Workforce KPIs**: Total Headcount, Attrition Rate, High Flight-Risk Cohort Count, Avg Salary, Avg Tenure, Cost Exposure at Risk.
   - **Department Analytics**: Attrition rate and headcount across all business units.
   - **Overtime Risk Multiplier**: Side-by-side comparative analysis (Overtime $61.5\%$ vs Standard $25.9\%$).
   - **Compensation Correlation**: Attrition curve across income tiers.
   - **Experience / Tenure Curve**: Early-career flight vulnerability vs seasoned loyalty.
   - **Immediate Action Queue**: Priority flight-risk cohort table for immediate outreach.
   - **What-If Scenario Sandbox**: Interactive simulation tool to model raises, overtime removal, and work-life balance boosts with financial ROI calculation.
   - **Workforce Roster**: Searchable, filterable directory with 360-degree modal inspect, CSV batch upload, and CSV export.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, Vite 8, Lucide React, Canvas/SVG visualization, CSS Design System (Dark/Light mode).
- **Machine Learning Engine**:
  - `ml/train_model.py`: Generates realistic workforce distribution, trains Logistic Regression, Random Forest, and Gradient Boosting models with Stratified K-Fold CV, exports metrics and model artifacts.
  - `ml/predict.py`: Standalone Python CLI for scoring employees directly via terminal.
  - `src/utils/predictor.js`: High-performance client-side calibrated scoring engine with instant sub-millisecond evaluation.

---

## 🚀 Getting Started

### 1. Launch the Web Application
```bash
npm install
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your web browser.

### 2. Train or Re-evaluate ML Models (Python)
```bash
.venv/bin/python ml/train_model.py
```

### 3. Run Command-Line Inference (Python)
```bash
.venv/bin/python ml/predict.py
```
