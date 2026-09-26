import React, { useState, useMemo } from 'react';
import { 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Clock, 
  DollarSign, 
  Briefcase, 
  HeartHandshake, 
  Sliders, 
  ShieldCheck, 
  Sparkles, 
  UserPlus, 
  ChevronRight,
  Flame,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { calculateAttritionRisk } from '../utils/predictor';

const DEPARTMENTS = [
  { id: 'Research & Development', label: 'R&D', icon: '🔬', desc: 'Engineering & scientific research' },
  { id: 'Sales', label: 'Sales', icon: '📈', desc: 'Client acquisition & revenue' },
  { id: 'Engineering', label: 'Engineering', icon: '💻', desc: 'Software, cloud & infra' },
  { id: 'Human Resources', label: 'Human Resources', icon: '👥', desc: 'People ops & talent' },
  { id: 'Marketing', label: 'Marketing', icon: '🎯', desc: 'Growth, brand & product' },
  { id: 'Finance', label: 'Finance', icon: '💳', desc: 'Financial planning & treasury' },
];

const PRESETS = [
  {
    name: 'Overworked Junior Dev',
    tag: 'Critical Risk',
    color: '#ef4444',
    data: {
      age: 26,
      salary: 3800,
      experience: 2,
      department: 'Engineering',
      job_satisfaction: 2,
      work_life_balance: 1,
      environment_satisfaction: 2,
      relationship_satisfaction: 3,
      overtime: true
    }
  },
  {
    name: 'Stressed Sales Executive',
    tag: 'High Risk',
    color: '#f97316',
    data: {
      age: 32,
      salary: 5200,
      experience: 5,
      department: 'Sales',
      job_satisfaction: 2,
      work_life_balance: 2,
      environment_satisfaction: 3,
      relationship_satisfaction: 2,
      overtime: true
    }
  },
  {
    name: 'Tenured R&D Scientist',
    tag: 'Low Risk',
    color: '#10b981',
    data: {
      age: 44,
      salary: 13500,
      experience: 15,
      department: 'Research & Development',
      job_satisfaction: 5,
      work_life_balance: 4,
      environment_satisfaction: 5,
      relationship_satisfaction: 4,
      overtime: false
    }
  },
  {
    name: 'Underpaid HR Specialist',
    tag: 'Moderate Risk',
    color: '#f59e0b',
    data: {
      age: 30,
      salary: 4100,
      experience: 4,
      department: 'Human Resources',
      job_satisfaction: 3,
      work_life_balance: 2,
      environment_satisfaction: 3,
      relationship_satisfaction: 3,
      overtime: false
    }
  }
];

export default function PredictorTab({ onAddToRoster, onSendToWhatIf }) {
  // 6 Required Inputs state
  const [age, setAge] = useState(28);
  const [salary, setSalary] = useState(4800);
  const [experience, setExperience] = useState(3);
  const [department, setDepartment] = useState('Sales');
  const [jobSatisfaction, setJobSatisfaction] = useState(2);
  const [workLifeBalance, setWorkLifeBalance] = useState(2);
  const [envSatisfaction, setEnvSatisfaction] = useState(3);
  const [relSatisfaction, setRelSatisfaction] = useState(3);
  const [overtime, setOvertime] = useState(true);

  // Optional candidate / employee tag
  const [employeeName, setEmployeeName] = useState('Alex Mercer');

  // Compute live prediction
  const result = useMemo(() => {
    return calculateAttritionRisk({
      age,
      salary,
      experience,
      department,
      job_satisfaction: jobSatisfaction,
      work_life_balance: workLifeBalance,
      environment_satisfaction: envSatisfaction,
      relationship_satisfaction: relSatisfaction,
      overtime
    });
  }, [age, salary, experience, department, jobSatisfaction, workLifeBalance, envSatisfaction, relSatisfaction, overtime]);

  const loadPreset = (preset) => {
    setAge(preset.data.age);
    setSalary(preset.data.salary);
    setExperience(preset.data.experience);
    setDepartment(preset.data.department);
    setJobSatisfaction(preset.data.job_satisfaction);
    setWorkLifeBalance(preset.data.work_life_balance);
    setEnvSatisfaction(preset.data.environment_satisfaction);
    setRelSatisfaction(preset.data.relationship_satisfaction);
    setOvertime(preset.data.overtime);
    setEmployeeName(preset.name);
  };

  const handleSaveToRoster = () => {
    onAddToRoster({
      employee_id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: employeeName || 'New Employee',
      age,
      salary,
      experience,
      department,
      job_satisfaction: jobSatisfaction,
      work_life_balance: workLifeBalance,
      environment_satisfaction: envSatisfaction,
      relationship_satisfaction: relSatisfaction,
      composite_satisfaction: result.compositeSatisfaction,
      overtime: overtime ? 1 : 0,
      attrition: result.isAttritionLikely ? 1 : 0,
      ground_truth_prob: result.rawProbability
    });
  };

  const handleForwardToWhatIf = () => {
    onSendToWhatIf({
      age,
      salary,
      experience,
      department,
      job_satisfaction: jobSatisfaction,
      work_life_balance: workLifeBalance,
      environment_satisfaction: envSatisfaction,
      relationship_satisfaction: relSatisfaction,
      overtime,
      name: employeeName
    });
  };

  // SVG Gauge calculations
  const strokeDashoffset = 283 - (283 * result.rawProbability);

  return (
    <div className="predictor-container animate-fade-in">
      {/* Header and Preset Shortcuts */}
      <div className="predictor-header-row">
        <div>
          <div className="badge badge-neutral" style={{ marginBottom: '8px' }}>
            <Sparkles size={12} color="var(--primary)" /> Calibrated Predictive Model
          </div>
          <h2 className="section-heading">Employee Attrition Predictor & Risk Assessment</h2>
          <p className="section-subheading">
            Evaluate individual retention flight risk by inputting employee demographics, compensation, experience, role satisfaction, and overtime.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="presets-wrapper">
          <span className="presets-title">Quick Test Profiles:</span>
          <div className="presets-pills">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                className="preset-chip"
                onClick={() => loadPreset(p)}
                style={{ borderColor: p.color }}
              >
                <span className="preset-dot" style={{ backgroundColor: p.color }} />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="predictor-grid">
        {/* LEFT COLUMN: The 6 Required Input Fields */}
        <div className="input-card glass-panel">
          <div className="card-header-styled">
            <h3 className="card-title">
              <Sliders size={18} className="icon-accent" />
              <span>Input Parameters (6 Dimensions)</span>
            </h3>
            <span className="badge badge-neutral">Real-Time Scoring</span>
          </div>

          <div className="input-form">
            {/* Optional Employee Name for record keeping */}
            <div className="form-group">
              <label className="form-label" htmlFor="emp-name">
                Employee / Candidate Name
              </label>
              <input
                id="emp-name"
                type="text"
                className="form-input"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="e.g. Jordan Smith"
              />
            </div>

            {/* 1. EMPLOYEE AGE */}
            <div className="form-group">
              <div className="slider-label-row">
                <label className="form-label" htmlFor="emp-age">
                  1. Employee Age
                </label>
                <span className="slider-value-badge">{age} years old</span>
              </div>
              <input
                id="emp-age"
                type="range"
                min="18"
                max="65"
                step="1"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
              />
              <div className="slider-range-hints">
                <span>18 yrs (Early Entry)</span>
                <span>35 yrs (Mid-Level)</span>
                <span>65 yrs (Senior)</span>
              </div>
            </div>

            {/* 2. SALARY (Monthly Income) */}
            <div className="form-group">
              <div className="slider-label-row">
                <label className="form-label" htmlFor="emp-salary">
                  2. Monthly Salary ($)
                </label>
                <span className="slider-value-badge slider-value-primary">
                  ${salary.toLocaleString()} / mo 
                  <span className="salary-annual"> (~${(salary * 12 / 1000).toFixed(0)}k/yr)</span>
                </span>
              </div>
              <input
                id="emp-salary"
                type="range"
                min="2000"
                max="25000"
                step="250"
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
              />
              <div className="slider-range-hints">
                <span>$2,000 (Entry)</span>
                <span>$9,240 (Median)</span>
                <span>$25,000 (Executive)</span>
              </div>
            </div>

            {/* 3. EXPERIENCE */}
            <div className="form-group">
              <div className="slider-label-row">
                <label className="form-label" htmlFor="emp-exp">
                  3. Total Experience (Years)
                </label>
                <span className="slider-value-badge">{experience} {experience === 1 ? 'Year' : 'Years'}</span>
              </div>
              <input
                id="emp-exp"
                type="range"
                min="0"
                max="35"
                step="1"
                value={experience}
                onChange={(e) => setExperience(Number(e.target.value))}
              />
              <div className="slider-range-hints">
                <span>0 yrs (Novice)</span>
                <span>7.4 yrs (Company Avg)</span>
                <span>35 yrs (Veteran)</span>
              </div>
            </div>

            {/* 4. DEPARTMENT */}
            <div className="form-group">
              <label className="form-label">
                4. Department
              </label>
              <div className="dept-grid">
                {DEPARTMENTS.map((dept) => {
                  const isSelected = department === dept.id;
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      className={`dept-card ${isSelected ? 'dept-card-active' : ''}`}
                      onClick={() => setDepartment(dept.id)}
                    >
                      <span className="dept-icon">{dept.icon}</span>
                      <div className="dept-info">
                        <span className="dept-name">{dept.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. JOB SATISFACTION PARAMETERS */}
            <div className="form-group form-group-box">
              <div className="satisfaction-box-header">
                <div>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    5. Job Satisfaction Parameters (1 to 5 Scale)
                  </label>
                  <p className="form-helper">Multi-factor psychological & workplace wellness indicators</p>
                </div>
                <div className="composite-sat-badge" data-tooltip="Average across all 4 satisfaction parameters">
                  <span>Composite:</span>
                  <strong>{result.compositeSatisfaction} / 5.0</strong>
                </div>
              </div>

              {/* Sub-parameter 5a: Job Satisfaction */}
              <div className="rating-row">
                <div className="rating-info">
                  <span className="rating-title">Overall Job Satisfaction</span>
                  <span className="rating-desc">Role fulfillment and daily work contentment</span>
                </div>
                <div className="star-selector">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      className={`sat-btn ${jobSatisfaction === lvl ? 'sat-btn-active' : ''}`}
                      onClick={() => setJobSatisfaction(lvl)}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-parameter 5b: Work-Life Balance */}
              <div className="rating-row">
                <div className="rating-info">
                  <span className="rating-title">Work-Life Balance</span>
                  <span className="rating-desc">Boundary preservation & personal time</span>
                </div>
                <div className="star-selector">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      className={`sat-btn ${workLifeBalance === lvl ? 'sat-btn-active' : ''}`}
                      onClick={() => setWorkLifeBalance(lvl)}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-parameter 5c: Environment Satisfaction */}
              <div className="rating-row">
                <div className="rating-info">
                  <span className="rating-title">Workplace Environment</span>
                  <span className="rating-desc">Culture, tools, team harmony, psychological safety</span>
                </div>
                <div className="star-selector">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      className={`sat-btn ${envSatisfaction === lvl ? 'sat-btn-active' : ''}`}
                      onClick={() => setEnvSatisfaction(lvl)}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-parameter 5d: Relationship Satisfaction */}
              <div className="rating-row">
                <div className="rating-info">
                  <span className="rating-title">Manager & Peer Relationship</span>
                  <span className="rating-desc">Direct manager support & peer trust</span>
                </div>
                <div className="star-selector">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      className={`sat-btn ${relSatisfaction === lvl ? 'sat-btn-active' : ''}`}
                      onClick={() => setRelSatisfaction(lvl)}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 6. OVERTIME */}
            <div className="form-group form-group-overtime">
              <div className="overtime-left">
                <div className="ot-icon-wrapper">
                  <Clock size={20} className={overtime ? 'icon-ot-active' : 'icon-ot-inactive'} />
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    6. Active Overtime
                  </label>
                  <p className="form-helper">
                    Regularly required to work extra hours beyond 40 hrs/week
                  </p>
                </div>
              </div>

              <div className="overtime-right">
                <span className={`ot-text-label ${overtime ? 'text-danger' : 'text-success'}`}>
                  {overtime ? 'YES (Active OT)' : 'NO (Standard Hours)'}
                </span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={overtime}
                    onChange={(e) => setOvertime(e.target.checked)}
                  />
                  <span className="slider-switch"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The 3 Core Outputs (Prediction, Probability, Risk Assessment) */}
        <div className="output-column">
          {/* OUTPUT 1: ATTRITION PREDICTION & PROBABILITY */}
          <div className="output-card glass-panel glow-card">
            <div className="output-card-header">
              <span className="output-kicker">Predictive Output Engine</span>
              <span className={`badge ${
                result.riskLevel === 'HIGH' ? 'badge-high' : 
                result.riskLevel === 'MEDIUM' ? 'badge-med' : 'badge-low'
              }`}>
                {result.riskBadge}
              </span>
            </div>

            {/* Output 1: Attrition Prediction Banner */}
            <div className={`prediction-banner ${result.isAttritionLikely ? 'banner-attrition-yes' : 'banner-attrition-no'}`}>
              <div className="banner-icon-side">
                {result.isAttritionLikely ? (
                  <Flame size={32} className="alert-flame" />
                ) : (
                  <ShieldCheck size={32} className="shield-safe" />
                )}
              </div>
              <div className="banner-text-side">
                <span className="banner-small-label">OUTPUT 1: ATTRITION PREDICTION</span>
                <h3 className="prediction-headline">{result.attritionPrediction}</h3>
                <p className="prediction-explanation">
                  {result.isAttritionLikely 
                    ? `Warning: Model predicts ${employeeName} has an elevated probability of voluntary resignation in the next 6-12 months.`
                    : `${employeeName} displays stable retention characteristics with low statistical intent to leave.`
                  }
                </p>
              </div>
            </div>

            {/* Output 2 & 3: Circular Speedometer Gauge & Risk Probability */}
            <div className="probability-display-block">
              <div className="gauge-container">
                <svg className="gauge-svg" viewBox="0 0 100 100">
                  <circle
                    className="gauge-bg"
                    cx="50"
                    cy="50"
                    r="45"
                    strokeWidth="8"
                  />
                  <circle
                    className="gauge-fill"
                    cx="50"
                    cy="50"
                    r="45"
                    strokeWidth="8"
                    stroke={result.riskColor}
                    strokeDasharray="283"
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="gauge-inner-content">
                  <span className="gauge-pct" style={{ color: result.riskColor }}>
                    {result.attritionProbability}
                  </span>
                  <span className="gauge-label">PROBABILITY SCORE (0.00 - 1.00)</span>
                </div>
              </div>

              <div className="probability-meta">
                <div className="prob-stat-row">
                  <span className="prob-meta-title">OUTPUT 2: Attrition Probability</span>
                  <strong className="prob-meta-value" style={{ color: result.riskColor }}>
                    {result.attritionProbability}
                  </strong>
                </div>

                <div className="prob-stat-row">
                  <span className="prob-meta-title">OUTPUT 3: Risk Classification</span>
                  <strong className="prob-meta-value">
                    {result.riskLevel} TIER (Index: {result.rawProbability.toFixed(2)})
                  </strong>
                </div>

                <div className="prob-stat-row">
                  <span className="prob-meta-title">Workforce Baseline Index</span>
                  <span className="prob-meta-value">0.375 Baseline</span>
                </div>

                <div className="prob-stat-row">
                  <span className="prob-meta-title">Delta from Baseline</span>
                  <span className={`prob-meta-value ${result.rawProbability > 0.375 ? 'text-danger' : 'text-success'}`}>
                    {result.rawProbability > 0.375 ? '+' : ''}
                    {(result.rawProbability - 0.375).toFixed(3)}
                  </span>
                </div>
              </div>
            </div>

            {/* OUTPUT 3 Continued: Contributing Risk Factors Waterfall */}
            <div className="factors-section">
              <h4 className="factors-title">
                <span>Key Risk Drivers & Attribution</span>
                <span className="factors-subtitle">SHAP-Style Factor Attribution</span>
              </h4>

              <div className="factors-list">
                {result.factorContributions.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`factor-item ${item.type === 'risk' ? 'factor-risk' : 'factor-protective'}`}
                  >
                    <div className="factor-header">
                      <div className="factor-name-row">
                        {item.type === 'risk' ? (
                          <TrendingUp size={16} className="text-danger" />
                        ) : (
                          <TrendingDown size={16} className="text-success" />
                        )}
                        <strong className="factor-name">{item.feature}</strong>
                      </div>
                      <span className={`factor-impact ${item.type === 'risk' ? 'impact-risk' : 'impact-safe'}`}>
                        {item.impact}
                      </span>
                    </div>
                    <p className="factor-desc">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Prescriptive HR Retention Strategy */}
            <div className="retention-actions-section">
              <div className="actions-header">
                <HeartHandshake size={18} className="icon-accent" />
                <h4 className="actions-title">Prescriptive HR Retention Playbook</h4>
              </div>

              <div className="retention-plan-list">
                {result.retentionRecommendations.map((rec, i) => (
                  <div key={i} className="retention-plan-card">
                    <div className="rec-top">
                      <span className="rec-action">{rec.action}</span>
                      <span className="rec-urgency">{rec.urgency}</span>
                    </div>
                    <p className="rec-desc">{rec.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="output-actions-bar">
              <button 
                type="button" 
                className="btn-primary-action"
                onClick={handleForwardToWhatIf}
              >
                <span>Simulate In What-If Sandbox</span>
                <ArrowRight size={16} />
              </button>

              <button 
                type="button" 
                className="btn-secondary-action"
                onClick={handleSaveToRoster}
              >
                <UserPlus size={16} />
                <span>Save to Roster</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
