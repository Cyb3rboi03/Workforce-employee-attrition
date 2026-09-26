import React, { useState, useMemo } from 'react';
import { 
  Sliders, 
  TrendingDown, 
  ArrowRight, 
  Sparkles, 
  DollarSign, 
  Clock, 
  Smile, 
  CheckCircle, 
  ShieldAlert, 
  Coins, 
  RotateCcw,
  Zap
} from 'lucide-react';
import { calculateAttritionRisk } from '../utils/predictor';

export default function WhatIfSimulator({ initialEmployee }) {
  // Baseline Employee
  const baseEmployee = useMemo(() => {
    return initialEmployee || {
      name: 'Jordan Smith',
      age: 29,
      salary: 4200,
      experience: 3,
      department: 'Sales',
      job_satisfaction: 2,
      work_life_balance: 1,
      environment_satisfaction: 2,
      relationship_satisfaction: 2,
      overtime: true
    };
  }, [initialEmployee]);

  // Interventions
  const [salaryIncreasePct, setSalaryIncreasePct] = useState(15);
  const [removeOvertime, setRemoveOvertime] = useState(true);
  const [wlbBoost, setWlbBoost] = useState(2);
  const [jobSatBoost, setJobSatBoost] = useState(2);
  const [envBoost, setEnvBoost] = useState(1);

  // Baseline risk
  const baselineResult = useMemo(() => {
    return calculateAttritionRisk(baseEmployee);
  }, [baseEmployee]);

  // Simulated Employee
  const simulatedEmployee = useMemo(() => {
    const newSalary = Math.round(baseEmployee.salary * (1 + salaryIncreasePct / 100));
    const newOvertime = removeOvertime ? false : baseEmployee.overtime;
    const newWlb = Math.min(5, baseEmployee.work_life_balance + wlbBoost);
    const newJobSat = Math.min(5, baseEmployee.job_satisfaction + jobSatBoost);
    const newEnv = Math.min(5, baseEmployee.environment_satisfaction + envBoost);

    return {
      ...baseEmployee,
      salary: newSalary,
      overtime: newOvertime,
      work_life_balance: newWlb,
      job_satisfaction: newJobSat,
      environment_satisfaction: newEnv,
    };
  }, [baseEmployee, salaryIncreasePct, removeOvertime, wlbBoost, jobSatBoost, envBoost]);

  // Simulated risk
  const simulatedResult = useMemo(() => {
    return calculateAttritionRisk(simulatedEmployee);
  }, [simulatedEmployee]);

  // Delta calculations
  const probDelta = (simulatedResult.rawProbability - baselineResult.rawProbability) * 100;
  const isReduced = probDelta < 0;

  // Financial ROI
  const annualCostOfRaise = (simulatedEmployee.salary - baseEmployee.salary) * 12;
  const baselineTurnoverRiskCost = (baseEmployee.salary * 12 * 0.50) * baselineResult.rawProbability;
  const simulatedTurnoverRiskCost = (simulatedEmployee.salary * 12 * 0.50) * simulatedResult.rawProbability;
  const expectedTurnoverCostSaved = Math.max(0, baselineTurnoverRiskCost - simulatedTurnoverRiskCost);
  const netCorporateSavings = expectedTurnoverCostSaved - annualCostOfRaise;
  const roiMultiplier = annualCostOfRaise > 0 ? (expectedTurnoverCostSaved / annualCostOfRaise).toFixed(1) : '∞';

  const resetInterventions = () => {
    setSalaryIncreasePct(0);
    setRemoveOvertime(false);
    setWlbBoost(0);
    setJobSatBoost(0);
    setEnvBoost(0);
  };

  return (
    <div className="whatif-container animate-fade-in">
      <div className="whatif-header">
        <div>
          <div className="badge badge-neutral" style={{ marginBottom: '6px' }}>
            <Zap size={12} color="#f59e0b" /> Retention Strategy Simulator
          </div>
          <h2 className="section-heading">Interactive What-If Scenario Sandbox</h2>
          <p className="section-subheading">
            Model retention interventions for <strong>{baseEmployee.name}</strong> ({baseEmployee.department}). 
            Simulate compensation raises, overtime elimination, and wellness programs to observe retention impact and financial ROI.
          </p>
        </div>

        <button className="action-btn action-btn-secondary" onClick={resetInterventions}>
          <RotateCcw size={14} />
          <span>Reset Simulation</span>
        </button>
      </div>

      <div className="whatif-grid">
        {/* INTERVENTIONS CONTROLS */}
        <div className="glass-panel whatif-controls-card">
          <div className="card-header-styled">
            <h3 className="card-title">
              <Sliders size={18} className="icon-accent" />
              <span>Simulate HR Retention Levers</span>
            </h3>
            <span className="badge badge-low">Live Modeling</span>
          </div>

          <div className="whatif-form">
            {/* Lever 1: Salary Increase */}
            <div className="form-group">
              <div className="slider-label-row">
                <label className="form-label">
                  <DollarSign size={15} className="inline-icon text-success" />
                  Proposed Salary Adjustment
                </label>
                <span className="slider-value-badge slider-value-primary">
                  +{(salaryIncreasePct / 100).toFixed(2)} (➔ ${simulatedEmployee.salary.toLocaleString()}/mo)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="5"
                value={salaryIncreasePct}
                onChange={(e) => setSalaryIncreasePct(Number(e.target.value))}
              />
              <div className="slider-range-hints">
                <span>0.00 (No change)</span>
                <span>+0.15 (Competitive)</span>
                <span>+0.40 (Top Market)</span>
              </div>
            </div>

            {/* Lever 2: Overtime Elimination */}
            <div className="form-group form-group-overtime">
              <div>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  <Clock size={15} className="inline-icon" />
                  Eliminate Mandatory Overtime
                </label>
                <p className="form-helper">Reassign extra hours to protect employee bandwidth</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={removeOvertime}
                  onChange={(e) => setRemoveOvertime(e.target.checked)}
                />
                <span className="slider-switch"></span>
              </label>
            </div>

            {/* Lever 3: Work-Life Balance Intervention */}
            <div className="form-group">
              <div className="slider-label-row">
                <label className="form-label">
                  <Smile size={15} className="inline-icon" />
                  Work-Life Balance Initiative
                </label>
                <span className="slider-value-badge">
                  +{wlbBoost} pts (Now {simulatedEmployee.work_life_balance}/5)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={wlbBoost}
                onChange={(e) => setWlbBoost(Number(e.target.value))}
              />
              <div className="slider-range-hints">
                <span>0 pts (Current)</span>
                <span>+1 pt (Hybrid work)</span>
                <span>+3 pts (Full flexibility)</span>
              </div>
            </div>

            {/* Lever 4: Job Satisfaction & Role Redesign */}
            <div className="form-group">
              <div className="slider-label-row">
                <label className="form-label">
                  <Sparkles size={15} className="inline-icon" />
                  Role Redesign & Autonomy
                </label>
                <span className="slider-value-badge">
                  +{jobSatBoost} pts (Now {simulatedEmployee.job_satisfaction}/5)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={jobSatBoost}
                onChange={(e) => setJobSatBoost(Number(e.target.value))}
              />
              <div className="slider-range-hints">
                <span>0 pts</span>
                <span>+1 pt (Stretch projects)</span>
                <span>+3 pts (Full role pivot)</span>
              </div>
            </div>

            {/* Lever 5: Environment & Management Alignment */}
            <div className="form-group">
              <div className="slider-label-row">
                <label className="form-label">
                  Work Environment & Manager Support
                </label>
                <span className="slider-value-badge">
                  +{envBoost} pts (Now {simulatedEmployee.environment_satisfaction}/5)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={envBoost}
                onChange={(e) => setEnvBoost(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* COMPARATIVE IMPACT RESULTS */}
        <div className="whatif-results-column">
          {/* COMPARISON CARDS */}
          <div className="comparison-cards-grid">
            {/* BEFORE SCENARIO */}
            <div className="sim-state-card glass-panel">
              <div className="sim-state-header">
                <span className="sim-state-tag">Baseline State</span>
                <span className={`badge ${
                  baselineResult.riskLevel === 'HIGH' ? 'badge-high' : 
                  baselineResult.riskLevel === 'MEDIUM' ? 'badge-med' : 'badge-low'
                }`}>
                  {baselineResult.riskLevel} TIER
                </span>
              </div>
              
              <div className="sim-prob-display">
                <span className="sim-prob-val" style={{ color: baselineResult.riskColor }}>
                  {baselineResult.attritionProbability}
                </span>
                <span className="sim-prob-label">Baseline Probability Score</span>
              </div>

              <div className="sim-meta-list">
                <div className="sim-meta-row">
                  <span>Salary:</span>
                  <strong>${baseEmployee.salary.toLocaleString()}/mo</strong>
                </div>
                <div className="sim-meta-row">
                  <span>Overtime:</span>
                  <span className={baseEmployee.overtime ? 'text-danger' : 'text-success'}>
                    {baseEmployee.overtime ? 'Active Overtime' : 'Standard'}
                  </span>
                </div>
                <div className="sim-meta-row">
                  <span>Satisfaction:</span>
                  <strong>{baselineResult.compositeSatisfaction} / 5.0</strong>
                </div>
              </div>
            </div>

            {/* TRANSITION ARROW */}
            <div className="sim-arrow-divider">
              <div className="arrow-circle">
                <ArrowRight size={22} color="var(--primary)" />
              </div>
              <span className={`prob-delta-badge ${isReduced ? 'text-success' : 'text-danger'}`}>
                {probDelta > 0 ? '+' : ''}{(probDelta / 100).toFixed(2)} Risk Delta
              </span>
            </div>

            {/* AFTER SCENARIO */}
            <div className="sim-state-card glass-panel glow-card">
              <div className="sim-state-header">
                <span className="sim-state-tag tag-simulated">With Interventions</span>
                <span className={`badge ${
                  simulatedResult.riskLevel === 'HIGH' ? 'badge-high' : 
                  simulatedResult.riskLevel === 'MEDIUM' ? 'badge-med' : 'badge-low'
                }`}>
                  {simulatedResult.riskLevel} TIER
                </span>
              </div>

              <div className="sim-prob-display">
                <span className="sim-prob-val" style={{ color: simulatedResult.riskColor }}>
                  {simulatedResult.attritionProbability}
                </span>
                <span className="sim-prob-label">New Probability Score</span>
              </div>

              <div className="sim-meta-list">
                <div className="sim-meta-row">
                  <span>New Salary:</span>
                  <strong className="text-success">${simulatedEmployee.salary.toLocaleString()}/mo</strong>
                </div>
                <div className="sim-meta-row">
                  <span>Overtime:</span>
                  <span className={simulatedEmployee.overtime ? 'text-danger' : 'text-success'}>
                    {simulatedEmployee.overtime ? 'Active Overtime' : 'Eliminated (Standard)'}
                  </span>
                </div>
                <div className="sim-meta-row">
                  <span>Satisfaction:</span>
                  <strong className="text-success">{simulatedResult.compositeSatisfaction} / 5.0</strong>
                </div>
              </div>
            </div>
          </div>

          {/* FINANCIAL ROI BOX */}
          <div className="roi-card glass-panel">
            <div className="roi-header">
              <Coins size={22} className="text-accent" />
              <div>
                <h4 className="roi-title">Intervention Financial ROI & Replacement Savings</h4>
                <p className="roi-sub">Calculated against the cost of attrition (0.50 factor of annual salary per vacancy)</p>
              </div>
            </div>

            <div className="roi-stats-grid">
              <div className="roi-stat-box">
                <span className="roi-stat-label">Annual Intervention Cost</span>
                <strong className="roi-stat-val">${annualCostOfRaise.toLocaleString()}/yr</strong>
                <span className="roi-stat-note">Base pay increase</span>
              </div>

              <div className="roi-stat-box">
                <span className="roi-stat-label">Turnover Cost Saved</span>
                <strong className="roi-stat-val text-success">
                  +${Math.round(expectedTurnoverCostSaved).toLocaleString()}/yr
                </strong>
                <span className="roi-stat-note">Departure risk averted</span>
              </div>

              <div className="roi-stat-box">
                <span className="roi-stat-label">Net Corporate Value</span>
                <strong className="roi-stat-val" style={{ color: netCorporateSavings >= 0 ? '#10b981' : '#f59e0b' }}>
                  ${Math.round(netCorporateSavings).toLocaleString()}
                </strong>
                <span className="roi-stat-note">{roiMultiplier}x ROI on retention spend</span>
              </div>
            </div>

            <div className="roi-conclusion-banner">
              <CheckCircle size={18} className="text-success" />
              <span>
                By implementing this retention package, {baseEmployee.name}'s flight risk drops by{' '}
                <strong>{Math.abs(probDelta / 100).toFixed(2)}</strong>, shifting them into the{' '}
                <strong style={{ color: simulatedResult.riskColor }}>{simulatedResult.riskLevel} TIER</strong>.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
