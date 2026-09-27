import React, { useMemo } from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Clock, 
  DollarSign, 
  Briefcase, 
  Sliders, 
  ShieldAlert, 
  ShieldCheck, 
  HeartHandshake,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { calculateAttritionRisk } from '../utils/predictor';

export default function EmployeeDetailModal({ employee, onClose, onSendToWhatIf, onSendToPredictor }) {
  const result = useMemo(() => {
    if (!employee) return null;
    return calculateAttritionRisk(employee);
  }, [employee]);

  if (!employee || !result) return null;

  const isOt = employee.overtime === 1 || employee.overtime === true || String(employee.overtime).toLowerCase() === 'yes';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-profile">
            <div className="emp-avatar avatar-large">
              {employee.name ? employee.name.charAt(0) : 'E'}
            </div>
            <div>
              <div className="emp-title-row">
                <h3 className="modal-emp-name">{employee.name || 'Employee Assessment'}</h3>
                <span className={`badge ${
                  result.riskLevel === 'HIGH' ? 'badge-high' : 
                  result.riskLevel === 'MEDIUM' ? 'badge-med' : 'badge-low'
                }`}>
                  {result.riskBadge}
                </span>
              </div>
              <p className="modal-emp-sub">
                ID: {employee.employee_id} • {employee.department} • {employee.age} yrs old
              </p>
            </div>
          </div>

          <button className="modal-close-btn" onClick={onClose} aria-label="Close Modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Key Output Metrics Banner */}
          <div className="modal-metrics-banner">
            <div className="modal-metric-col">
              <span className="modal-meta-label">Output 1: Attrition Forecast</span>
              <strong className={`modal-meta-val ${result.isAttritionLikely ? 'text-danger' : 'text-success'}`}>
                {result.attritionPrediction}
              </strong>
            </div>

            <div className="modal-metric-col">
              <span className="modal-meta-label">Output 2: Attrition Probability</span>
              <strong className="modal-meta-val" style={{ color: result.riskColor }}>
                {result.attritionProbability}
              </strong>
            </div>

            <div className="modal-metric-col">
              <span className="modal-meta-label">Output 3: Risk Classification</span>
              <strong className="modal-meta-val">
                {result.riskLevel} TIER
              </strong>
            </div>
          </div>

          {/* 6 Dimension Inputs Summary */}
          <div className="modal-inputs-summary">
            <h4 className="modal-section-title">Evaluation Dimensions (6 Inputs)</h4>
            <div className="dim-summary-grid">
              <div className="dim-chip">
                <span className="dim-label">1. Age:</span>
                <strong>{employee.age} years</strong>
              </div>
              <div className="dim-chip">
                <span className="dim-label">2. Salary:</span>
                <strong>${employee.salary.toLocaleString()}/mo</strong>
              </div>
              <div className="dim-chip">
                <span className="dim-label">3. Experience:</span>
                <strong>{employee.experience} years</strong>
              </div>
              <div className="dim-chip">
                <span className="dim-label">4. Department:</span>
                <strong>{employee.department}</strong>
              </div>
              <div className="dim-chip">
                <span className="dim-label">5. Satisfaction:</span>
                <strong>{result.compositeSatisfaction} / 5.0 (Composite)</strong>
              </div>
              <div className="dim-chip">
                <span className="dim-label">6. Overtime:</span>
                <strong className={isOt ? 'text-danger' : 'text-success'}>
                  {isOt ? 'Active Overtime' : 'Standard'}
                </strong>
              </div>
            </div>
          </div>

          {/* Satisfaction Sub-Parameters */}
          <div className="modal-satisfaction-breakdown">
            <span className="dim-label">Satisfaction Sub-Metrics:</span>
            <div className="sat-sub-grid">
              <span>Job Sat: <strong>{employee.job_satisfaction || 3}/5</strong></span>
              <span>Work-Life: <strong>{employee.work_life_balance || 3}/5</strong></span>
              <span>Environment: <strong>{employee.environment_satisfaction || 3}/5</strong></span>
              <span>Relationship: <strong>{employee.relationship_satisfaction || 3}/5</strong></span>
            </div>
          </div>

          {/* Contributing Risk Factors */}
          <div className="modal-factors-section">
            <h4 className="modal-section-title">Key Contributing Factors</h4>
            <div className="factors-list">
              {result.factorContributions.map((item, idx) => (
                <div key={idx} className={`factor-item ${item.type === 'risk' ? 'factor-risk' : 'factor-protective'}`}>
                  <div className="factor-header">
                    <span className="factor-name">{item.feature}</span>
                    <strong className={`factor-impact ${item.type === 'risk' ? 'impact-risk' : 'impact-safe'}`}>
                      {item.impact}
                    </strong>
                  </div>
                  <p className="factor-desc">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Retention Recommendations */}
          <div className="modal-retention-section">
            <h4 className="modal-section-title">Prescriptive Retention Action Plan</h4>
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
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          <button className="action-btn action-btn-secondary" onClick={onClose}>
            Close
          </button>
          {onSendToPredictor && (
            <button 
              className="action-btn action-btn-secondary"
              onClick={() => {
                onClose();
                onSendToPredictor(employee);
              }}
              title="Sync employee into Attrition Predictor"
            >
              <Sparkles size={15} color="var(--primary)" />
              <span>Sync in Predictor</span>
            </button>
          )}
          <button 
            className="action-btn action-btn-primary"
            onClick={() => {
              onClose();
              onSendToWhatIf(employee);
            }}
          >
            <span>Simulate Interventions in What-If</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
