import React, { useState } from 'react';
import { 
  BrainCircuit, 
  CheckCircle, 
  Award, 
  BarChart, 
  Layers, 
  ShieldCheck, 
  Info, 
  ExternalLink,
  Cpu
} from 'lucide-react';
import modelMetadata from '../data/modelMetadata.js';

export default function ModelInsightsTab() {
  const [activeModel, setActiveModel] = useState(modelMetadata.selected_model || 'Random Forest');
  const models = modelMetadata.models_evaluated || {};
  const currentMetrics = models[activeModel] || Object.values(models)[0];

  const featureWeights = modelMetadata.feature_weights || [];
  const sortedFeatures = [...featureWeights].sort((a, b) => b.importance - a.importance);

  const cm = currentMetrics?.confusion_matrix || [[158, 29], [48, 65]];
  const tn = cm[0][0];
  const fp = cm[0][1];
  const fn = cm[1][0];
  const tp = cm[1][1];
  const totalTest = tn + fp + fn + tp;

  return (
    <div className="model-insights-container animate-fade-in">
      {/* Header */}
      <div className="model-header-row">
        <div>
          <div className="badge badge-neutral" style={{ marginBottom: '6px' }}>
            <Cpu size={12} color="var(--primary)" /> Machine Learning Architecture
          </div>
          <h2 className="section-heading">Model Evaluation & Feature Explainability</h2>
          <p className="section-subheading">
            Trained and calibrated on workforce attrition datasets using stratified train/test partitioning, cross-validation, and multi-model benchmark comparisons.
          </p>
        </div>

        <div className="active-model-chip">
          <span className="chip-label">Production Champion:</span>
          <span className="chip-val">
            <Award size={15} color="#10b981" />
            {modelMetadata.selected_model} (ROC-AUC {currentMetrics.roc_auc})
          </span>
        </div>
      </div>

      {/* Model Selector Tabs */}
      <div className="model-tabs-list">
        {Object.keys(models).map((mName) => (
          <button
            key={mName}
            className={`model-tab-btn ${activeModel === mName ? 'model-tab-btn-active' : ''}`}
            onClick={() => setActiveModel(mName)}
          >
            <span>{mName}</span>
            {mName === modelMetadata.selected_model && (
              <span className="champion-pill">Selected</span>
            )}
          </button>
        ))}
      </div>

      {/* Grid: Metrics Cards */}
      <div className="metrics-summary-grid">
        <div className="metric-box glass-panel">
          <span className="metric-box-label">ROC-AUC Score</span>
          <h3 className="metric-box-val text-primary">{currentMetrics.roc_auc}</h3>
          <span className="metric-box-sub">CV Mean: {currentMetrics.cv_roc_auc_mean} (±{currentMetrics.cv_roc_auc_std})</span>
        </div>

        <div className="metric-box glass-panel">
          <span className="metric-box-label">Accuracy</span>
          <h3 className="metric-box-val">{currentMetrics.accuracy}</h3>
          <span className="metric-box-sub">Overall correct classification score</span>
        </div>

        <div className="metric-box glass-panel">
          <span className="metric-box-label">Precision</span>
          <h3 className="metric-box-val text-success">{currentMetrics.precision}</h3>
          <span className="metric-box-sub">Positive predictive value</span>
        </div>

        <div className="metric-box glass-panel">
          <span className="metric-box-label">Recall (Sensitivity)</span>
          <h3 className="metric-box-val" style={{ color: '#f59e0b' }}>{currentMetrics.recall}</h3>
          <span className="metric-box-sub">True turnover identification</span>
        </div>

        <div className="metric-box glass-panel">
          <span className="metric-box-label">F1-Score</span>
          <h3 className="metric-box-val">{currentMetrics.f1}</h3>
          <span className="metric-box-sub">Harmonic mean of Prec/Recall</span>
        </div>
      </div>

      {/* Double Column: Confusion Matrix & Feature Importances */}
      <div className="analytics-double-row">
        {/* Confusion Matrix */}
        <div className="chart-card glass-panel">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">
                <Layers size={18} className="icon-accent" />
                <span>Confusion Matrix (Held-out Test Set)</span>
              </h3>
              <p className="chart-card-sub">Evaluation on N={totalTest} unseen employee records</p>
            </div>
          </div>

          <div className="confusion-matrix-wrapper">
            <div className="cm-grid">
              <div className="cm-cell cm-tn">
                <span className="cm-tag">True Negative (Retained)</span>
                <strong className="cm-num">{tn}</strong>
                <span className="cm-sub">{(tn / totalTest).toFixed(2)} fraction of test</span>
              </div>

              <div className="cm-cell cm-fp">
                <span className="cm-tag">False Positive (False Alarm)</span>
                <strong className="cm-num">{fp}</strong>
                <span className="cm-sub">{(fp / totalTest).toFixed(2)} fraction of test</span>
              </div>

              <div className="cm-cell cm-fn">
                <span className="cm-tag">False Negative (Missed Risk)</span>
                <strong className="cm-num">{fn}</strong>
                <span className="cm-sub">{(fn / totalTest).toFixed(2)} fraction of test</span>
              </div>

              <div className="cm-cell cm-tp">
                <span className="cm-tag">True Positive (Correct Flight)</span>
                <strong className="cm-num">{tp}</strong>
                <span className="cm-sub">{(tp / totalTest).toFixed(2)} fraction of test</span>
              </div>
            </div>

            <div className="cm-labels-row">
              <span>Predicted Stays: {tn + fn}</span>
              <span>Predicted Leaves: {fp + tp}</span>
            </div>
          </div>
        </div>

        {/* Global Feature Importance Ranking */}
        <div className="chart-card glass-panel">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">
                <BarChart size={18} className="icon-accent" />
                <span>Feature Importance Rankings</span>
              </h3>
              <p className="chart-card-sub">Relative predictive weight of input parameters</p>
            </div>
          </div>

          <div className="feature-imp-list">
            {sortedFeatures.map((f) => {
              const pct = Math.round(f.importance * 100);
              const isProtect = f.impact_direction.includes('Protects');
              return (
                <div key={f.feature} className="feature-imp-row">
                  <div className="feature-imp-info">
                    <span className="feature-imp-name">{f.feature.replace('department_', 'Dept: ')}</span>
                    <div className="feature-imp-tags">
                      <span className={`direction-tag ${isProtect ? 'text-success' : 'text-danger'}`}>
                        {f.impact_direction}
                      </span>
                      <strong className="feature-imp-pct">{(f.importance).toFixed(3)}</strong>
                    </div>
                  </div>
                  <div className="feature-imp-track">
                    <div 
                      className="feature-imp-fill"
                      style={{ 
                        width: `${Math.min(100, Math.max(5, pct * 3.5))}%`,
                        backgroundColor: isProtect ? '#10b981' : '#6366f1'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Model Comparison Table */}
      <div className="model-comp-card glass-panel">
        <div className="card-header-styled">
          <h3 className="card-title">Cross-Model Performance Benchmarking</h3>
        </div>

        <div className="table-responsive">
          <table className="roster-table">
            <thead>
              <tr>
                <th>Model Architecture</th>
                <th>Accuracy</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1-Score</th>
                <th>ROC-AUC (Test)</th>
                <th>5-Fold CV ROC-AUC</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(models).map(([name, m]) => {
                const isSelected = name === modelMetadata.selected_model;
                return (
                  <tr key={name} className={isSelected ? 'champion-row' : ''}>
                    <td>
                      <strong>{name}</strong>
                    </td>
                    <td>{m.accuracy}</td>
                    <td>{m.precision}</td>
                    <td>{m.recall}</td>
                    <td>{m.f1}</td>
                    <td><strong>{m.roc_auc}</strong></td>
                    <td>{m.cv_roc_auc_mean} ±{m.cv_roc_auc_std}</td>
                    <td>
                      {isSelected ? (
                        <span className="badge badge-low">
                          <CheckCircle size={12} /> Champion
                        </span>
                      ) : (
                        <span className="badge badge-neutral">Evaluated</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
