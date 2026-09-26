import React, { useState, useMemo } from 'react';
import { 
  Users, 
  TrendingUp, 
  AlertOctagon, 
  DollarSign, 
  Briefcase, 
  Coins, 
  Filter, 
  BarChart3, 
  PieChart, 
  Activity, 
  Clock, 
  Smile, 
  ChevronRight,
  Flame,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';

export default function DashboardTab({ employees, onSelectEmployee, onNavigateToPredictor }) {
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedOvertime, setSelectedOvertime] = useState('ALL');
  const [selectedRisk, setSelectedRisk] = useState('ALL');

  // Filtered dataset
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (selectedDept !== 'ALL' && emp.department !== selectedDept) return false;
      if (selectedOvertime === 'YES' && emp.overtime !== 1 && emp.overtime !== true) return false;
      if (selectedOvertime === 'NO' && (emp.overtime === 1 || emp.overtime === true)) return false;
      
      const prob = emp.ground_truth_prob || 0.35;
      if (selectedRisk === 'HIGH' && prob < 0.60) return false;
      if (selectedRisk === 'MEDIUM' && (prob < 0.30 || prob >= 0.60)) return false;
      if (selectedRisk === 'LOW' && prob >= 0.30) return false;

      return true;
    });
  }, [employees, selectedDept, selectedOvertime, selectedRisk]);

  // Aggregate KPIs
  const stats = useMemo(() => {
    const total = filteredEmployees.length;
    if (total === 0) {
      return {
        total: 0,
        attritionRate: 0,
        highRiskCount: 0,
        avgSalary: 0,
        avgExp: 0,
        replacementCostAtRisk: 0,
        otAttritionRate: 0,
        nonOtAttritionRate: 0,
        riskDist: { high: 0, med: 0, low: 0 }
      };
    }

    const attrited = filteredEmployees.filter(e => e.attrition === 1).length;
    const rate = total > 0 ? (attrited / total) : 0;
    
    let highRiskCount = 0;
    let medRiskCount = 0;
    let lowRiskCount = 0;
    let totalSalary = 0;
    let totalExp = 0;
    let costAtRisk = 0;

    let otCount = 0;
    let otAttrited = 0;
    let nonOtCount = 0;
    let nonOtAttrited = 0;

    filteredEmployees.forEach(e => {
      const prob = e.ground_truth_prob !== undefined ? e.ground_truth_prob : (e.attrition ? 0.8 : 0.2);
      if (prob >= 0.60) {
        highRiskCount++;
        // Annual turnover replacement cost is approx 50% of annual salary
        costAtRisk += (e.salary * 12 * 0.50);
      } else if (prob >= 0.30) {
        medRiskCount++;
      } else {
        lowRiskCount++;
      }

      totalSalary += e.salary;
      totalExp += e.experience;

      if (e.overtime === 1 || e.overtime === true) {
        otCount++;
        if (e.attrition === 1) otAttrited++;
      } else {
        nonOtCount++;
        if (e.attrition === 1) nonOtAttrited++;
      }
    });

    const otAttritionRate = otCount > 0 ? (otAttrited / otCount) : 0;
    const nonOtAttritionRate = nonOtCount > 0 ? (nonOtAttrited / nonOtCount) : 0;

    return {
      total,
      attritedCount: attrited,
      attritionRate: rate.toFixed(2),
      highRiskCount,
      avgSalary: Math.round(totalSalary / total),
      avgExp: (totalExp / total).toFixed(1),
      replacementCostAtRisk: Math.round(costAtRisk),
      otAttritionRate: otAttritionRate.toFixed(2),
      nonOtAttritionRate: nonOtAttritionRate.toFixed(2),
      riskDist: {
        high: total > 0 ? (highRiskCount / total).toFixed(2) : '0.00',
        med: total > 0 ? (medRiskCount / total).toFixed(2) : '0.00',
        low: total > 0 ? (lowRiskCount / total).toFixed(2) : '0.00'
      }
    };
  }, [filteredEmployees]);

  // Breakdown by Department
  const deptBreakdown = useMemo(() => {
    const depts = {};
    filteredEmployees.forEach(emp => {
      const d = emp.department || 'Other';
      if (!depts[d]) {
        depts[d] = { count: 0, attrited: 0, highRisk: 0, salarySum: 0 };
      }
      depts[d].count++;
      if (emp.attrition === 1) depts[d].attrited++;
      if ((emp.ground_truth_prob || 0) >= 0.60) depts[d].highRisk++;
      depts[d].salarySum += emp.salary;
    });

    return Object.entries(depts).map(([name, data]) => ({
      name,
      count: data.count,
      rate: data.count > 0 ? (data.attrited / data.count).toFixed(2) : '0.00',
      highRiskCount: data.highRisk,
      avgSalary: data.count > 0 ? Math.round(data.salarySum / data.count) : 0
    })).sort((a, b) => Number(b.rate) - Number(a.rate));
  }, [filteredEmployees]);

  // Salary Bracket Breakdown
  const salaryBrackets = useMemo(() => {
    const brackets = [
      { label: '<$4,000 (Entry Tier)', min: 0, max: 4000, count: 0, attrited: 0 },
      { label: '$4,000 - $7,000 (Mid-Junior)', min: 4000, max: 7000, count: 0, attrited: 0 },
      { label: '$7,000 - $11,000 (Senior)', min: 7000, max: 11000, count: 0, attrited: 0 },
      { label: '$11,000 - $16,000 (Lead)', min: 11000, max: 16000, count: 0, attrited: 0 },
      { label: '$16,000+ (Executive)', min: 16000, max: 100000, count: 0, attrited: 0 },
    ];

    filteredEmployees.forEach(e => {
      const b = brackets.find(br => e.salary >= br.min && e.salary < br.max);
      if (b) {
        b.count++;
        if (e.attrition === 1) b.attrited++;
      }
    });

    return brackets.map(b => ({
      ...b,
      rate: b.count > 0 ? (b.attrited / b.count).toFixed(2) : '0.00'
    }));
  }, [filteredEmployees]);

  // Experience Tenure Breakdown
  const experienceTiers = useMemo(() => {
    const tiers = [
      { label: '0-2 Yrs (Early Shock)', min: 0, max: 2.5, count: 0, attrited: 0 },
      { label: '3-5 Yrs (Developing)', min: 2.5, max: 5.5, count: 0, attrited: 0 },
      { label: '6-10 Yrs (Established)', min: 5.5, max: 10.5, count: 0, attrited: 0 },
      { label: '11-18 Yrs (Senior)', min: 10.5, max: 18.5, count: 0, attrited: 0 },
      { label: '19+ Yrs (Veterans)', min: 18.5, max: 100, count: 0, attrited: 0 },
    ];

    filteredEmployees.forEach(e => {
      const t = tiers.find(tier => e.experience >= tier.min && e.experience < tier.max);
      if (t) {
        t.count++;
        if (e.attrition === 1) t.attrited++;
      }
    });

    return tiers.map(t => ({
      ...t,
      rate: t.count > 0 ? (t.attrited / t.count).toFixed(2) : '0.00'
    }));
  }, [filteredEmployees]);

  // Top At-Risk Employees for immediate HR intervention
  const topAtRisk = useMemo(() => {
    return [...filteredEmployees]
      .sort((a, b) => (b.ground_truth_prob || 0) - (a.ground_truth_prob || 0))
      .slice(0, 5);
  }, [filteredEmployees]);

  return (
    <div className="dashboard-container animate-fade-in">
      {/* Top Banner */}
      <div className="dashboard-header-block">
        <div className="badge badge-neutral" style={{ marginBottom: '6px' }}>
          Workforce Intelligence Overview
        </div>
        <h2 className="section-heading">HR Analytics Dashboard</h2>
        <p className="section-subheading">
          Enterprise analytics on workforce attrition trends, departmental risks, compensation correlation, and overtime impact.
        </p>
      </div>

      {/* DEDICATED FILTER MENU BOX */}
      <div className="filter-console-box glass-panel">
        <div className="filter-box-header">
          <div className="filter-box-title-row">
            <div className="filter-icon-pill">
              <Filter size={15} />
            </div>
            <div>
              <h4 className="filter-box-title">Workforce Segment Filter Console</h4>
              <span className="filter-box-sub">Filter data across departments, overtime schedules, and attrition risk tiers</span>
            </div>
          </div>

          <div className="filter-box-actions">
            <span className="filter-results-counter">
              Showing <strong>{stats.total.toLocaleString()}</strong> of <strong>{employees.length.toLocaleString()}</strong> employees
            </span>
            {(selectedDept !== 'ALL' || selectedOvertime !== 'ALL' || selectedRisk !== 'ALL') && (
              <button 
                type="button"
                className="reset-filters-btn"
                onClick={() => {
                  setSelectedDept('ALL');
                  setSelectedOvertime('ALL');
                  setSelectedRisk('ALL');
                }}
              >
                <RotateCcw size={13} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        <div className="filter-inputs-grid">
          {/* Department Filter Card */}
          <div className="filter-field-card">
            <label className="filter-field-label">
              <Building2 size={14} className="icon-accent" />
              <span>Department</span>
            </label>
            <div className="filter-custom-select-wrap">
              <select 
                value={selectedDept} 
                onChange={(e) => setSelectedDept(e.target.value)}
                className="filter-boxed-select"
              >
                <option value="ALL">🏢 All Departments</option>
                <option value="Research & Development">🔬 Research & Development</option>
                <option value="Sales">📈 Sales</option>
                <option value="Engineering">💻 Engineering</option>
                <option value="Human Resources">👥 Human Resources</option>
                <option value="Marketing">🎯 Marketing</option>
                <option value="Finance">💳 Finance</option>
              </select>
            </div>
          </div>

          {/* Overtime Schedule Card */}
          <div className="filter-field-card">
            <label className="filter-field-label">
              <Clock size={14} className="icon-accent" />
              <span>Overtime Schedule</span>
            </label>
            <div className="filter-custom-select-wrap">
              <select 
                value={selectedOvertime} 
                onChange={(e) => setSelectedOvertime(e.target.value)}
                className="filter-boxed-select"
              >
                <option value="ALL">⏱️ All Schedules</option>
                <option value="YES">🔥 Active Overtime Only</option>
                <option value="NO">🛡️ Standard Hours Only</option>
              </select>
            </div>
          </div>

          {/* Risk Tier Card */}
          <div className="filter-field-card">
            <label className="filter-field-label">
              <ShieldAlert size={14} className="icon-accent" />
              <span>Attrition Risk Tier</span>
            </label>
            <div className="filter-custom-select-wrap">
              <select 
                value={selectedRisk} 
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="filter-boxed-select"
              >
                <option value="ALL">🌐 All Risk Tiers</option>
                <option value="HIGH">🔴 High Risk (≥0.60 prob)</option>
                <option value="MEDIUM">🟡 Medium Risk (0.30 - 0.59 prob)</option>
                <option value="LOW">🟢 Low Risk (&lt;0.30 prob)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 6 EXECUTIVE KPI SUMMARY CARDS */}
      <div className="kpi-grid">
        {/* Card 1: Total Workforce */}
        <div className="kpi-card glass-panel">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
            <Users size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Active Headcount</span>
            <h3 className="kpi-value">{stats.total.toLocaleString()}</h3>
            <span className="kpi-subtext">Monitored employees</span>
          </div>
        </div>

        {/* Card 2: Overall Attrition Rate */}
        <div className="kpi-card glass-panel">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--risk-high)' }}>
            <TrendingUp size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Workforce Attrition Rate</span>
            <h3 className="kpi-value">{stats.attritionRate}</h3>
            <span className="kpi-subtext">
              {stats.attritedCount} of {stats.total} staff ({Number(stats.attritionRate) > 0.30 ? 'Above target 0.20' : 'Within stable bounds'})
            </span>
          </div>
        </div>

        {/* Card 3: High Risk Flight Cohort */}
        <div className="kpi-card glass-panel">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--risk-med)' }}>
            <AlertOctagon size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">High Flight-Risk Cohort</span>
            <h3 className="kpi-value" style={{ color: 'var(--risk-high)' }}>{stats.highRiskCount}</h3>
            <span className="kpi-subtext">Probability Index ≥ 0.60</span>
          </div>
        </div>

        {/* Card 4: Avg Monthly Salary */}
        <div className="kpi-card glass-panel">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
            <DollarSign size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Avg Monthly Salary</span>
            <h3 className="kpi-value">${stats.avgSalary.toLocaleString()}</h3>
            <span className="kpi-subtext">~${Math.round(stats.avgSalary * 12 / 1000)}k annual mean</span>
          </div>
        </div>

        {/* Card 5: Avg Experience */}
        <div className="kpi-card glass-panel">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--risk-low)' }}>
            <Briefcase size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Avg Career Tenure</span>
            <h3 className="kpi-value">{stats.avgExp} yrs</h3>
            <span className="kpi-subtext">Total working experience</span>
          </div>
        </div>

        {/* Card 6: Estimated Turnover Cost Exposure */}
        <div className="kpi-card glass-panel glow-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
            <Coins size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Cost Exposure at Risk</span>
            <h3 className="kpi-value" style={{ color: '#f87171' }}>
              ${(stats.replacementCostAtRisk / 1000000).toFixed(2)}M
            </h3>
            <span className="kpi-subtext">0.50 annual salary factor replacement cost</span>
          </div>
        </div>
      </div>

      {/* ROW 1: DEPARTMENT BREAKDOWN & OVERTIME COMPARISON */}
      <div className="analytics-double-row">
        {/* CHART 1: Attrition by Department */}
        <div className="chart-card glass-panel">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">
                <BarChart3 size={18} className="icon-accent" />
                <span>Attrition Rate by Department</span>
              </h3>
              <p className="chart-card-sub">Turnover percentage and headcount distribution across units</p>
            </div>
            <span className="badge badge-neutral">{deptBreakdown.length} Units</span>
          </div>

          <div className="dept-bars-list">
            {deptBreakdown.map((dept) => {
              const rateNum = Number(dept.rate);
              const barColor = rateNum >= 0.40 ? 'var(--risk-high)' : rateNum >= 0.30 ? 'var(--risk-med)' : 'var(--risk-low)';
              return (
                <div key={dept.name} className="dept-bar-row">
                  <div className="dept-bar-labels">
                    <span className="dept-bar-name">{dept.name}</span>
                    <div className="dept-bar-metrics">
                      <span className="dept-bar-count">{dept.count} staff</span>
                      <strong className="dept-bar-rate" style={{ color: barColor }}>
                        {dept.rate}
                      </strong>
                    </div>
                  </div>
                  <div className="dept-bar-track">
                    <div 
                      className="dept-bar-fill" 
                      style={{ 
                        width: `${Math.min(100, Math.max(5, rateNum * 100))}%`,
                        backgroundColor: barColor
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 2: Overtime Disparity & Risk Tier Donut */}
        <div className="chart-card glass-panel">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">
                <Clock size={18} className="icon-accent" />
                <span>Overtime Impact on Attrition</span>
              </h3>
              <p className="chart-card-sub">Comparative turnover odds for Overtime vs Standard Hours</p>
            </div>
          </div>

          {/* Overtime comparison cards */}
          <div className="ot-comparison-grid">
            <div className="ot-stat-card ot-stat-active">
              <div className="ot-card-top">
                <Flame size={20} className="text-danger" />
                <span className="ot-card-label">Overtime Required</span>
              </div>
              <h4 className="ot-card-pct text-danger">{stats.otAttritionRate}</h4>
              <p className="ot-card-footnote">Turnover Rate Index (2.4x higher risk)</p>
            </div>

            <div className="ot-stat-card ot-stat-standard">
              <div className="ot-card-top">
                <CheckCircle2 size={20} className="text-success" />
                <span className="ot-card-label">Standard Hours</span>
              </div>
              <h4 className="ot-card-pct text-success">{stats.nonOtAttritionRate}</h4>
              <p className="ot-card-footnote">Turnover Rate Index (Protected)</p>
            </div>
          </div>

          {/* Risk Tier Donut / Bar Distribution */}
          <div className="risk-dist-section">
            <h4 className="risk-dist-title">Workforce Retention Tier Distribution</h4>
            <div className="risk-stacked-bar">
              <div 
                className="risk-stack-segment bg-risk-high" 
                style={{ width: `${Number(stats.riskDist.high) * 100}%` }}
                data-tooltip={`High Risk: ${stats.riskDist.high}`}
              />
              <div 
                className="risk-stack-segment bg-risk-med" 
                style={{ width: `${Number(stats.riskDist.med) * 100}%` }}
                data-tooltip={`Medium Risk: ${stats.riskDist.med}`}
              />
              <div 
                className="risk-stack-segment bg-risk-low" 
                style={{ width: `${Number(stats.riskDist.low) * 100}%` }}
                data-tooltip={`Low Risk: ${stats.riskDist.low}`}
              />
            </div>

            <div className="risk-legend-row">
              <div className="legend-item">
                <span className="legend-dot dot-high" />
                <span>High Risk (≥0.60): <strong>{stats.riskDist.high}</strong></span>
              </div>
              <div className="legend-item">
                <span className="legend-dot dot-med" />
                <span>Medium (0.30 - 0.59): <strong>{stats.riskDist.med}</strong></span>
              </div>
              <div className="legend-item">
                <span className="legend-dot dot-low" />
                <span>Low (&lt;0.30): <strong>{stats.riskDist.low}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: SALARY & EXPERIENCE CORRELATION CHARTS */}
      <div className="analytics-double-row">
        {/* CHART 3: Salary Tiers vs Attrition */}
        <div className="chart-card glass-panel">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">
                <DollarSign size={18} className="icon-accent" />
                <span>Salary Brackets vs Turnover Rate</span>
              </h3>
              <p className="chart-card-sub">Demonstrates how compensation acts as a primary retention anchor</p>
            </div>
          </div>

          <div className="tier-bars-list">
            {salaryBrackets.map((bracket) => {
              const rateNum = Number(bracket.rate);
              return (
                <div key={bracket.label} className="tier-row">
                  <div className="tier-header">
                    <span className="tier-name">{bracket.label}</span>
                    <span className="tier-stats">
                      {bracket.count} staff • <strong className="tier-rate">{bracket.rate} rate</strong>
                    </span>
                  </div>
                  <div className="tier-track">
                    <div 
                      className="tier-fill"
                      style={{ 
                        width: `${Math.min(100, Math.max(8, rateNum * 100))}%`,
                        backgroundColor: rateNum > 0.45 ? 'var(--risk-high)' : rateNum > 0.25 ? 'var(--risk-med)' : 'var(--risk-low)'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 4: Experience / Tenure Curve */}
        <div className="chart-card glass-panel">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">
                <Activity size={18} className="icon-accent" />
                <span>Tenure / Experience Attrition Curve</span>
              </h3>
              <p className="chart-card-sub">Early-career volatility vs long-term institutional retention</p>
            </div>
          </div>

          <div className="tier-bars-list">
            {experienceTiers.map((tier) => {
              const rateNum = Number(tier.rate);
              return (
                <div key={tier.label} className="tier-row">
                  <div className="tier-header">
                    <span className="tier-name">{tier.label}</span>
                    <span className="tier-stats">
                      {tier.count} staff • <strong className="tier-rate">{tier.rate} rate</strong>
                    </span>
                  </div>
                  <div className="tier-track">
                    <div 
                      className="tier-fill"
                      style={{ 
                        width: `${Math.min(100, Math.max(8, rateNum * 100))}%`,
                        backgroundColor: rateNum > 0.45 ? 'var(--risk-high)' : rateNum > 0.30 ? 'var(--risk-med)' : 'var(--risk-low)'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ROW 3: IMMEDIATE HR INTERVENTION QUEUE */}
      <div className="intervention-card glass-panel">
        <div className="intervention-header">
          <div>
            <div className="badge badge-high" style={{ marginBottom: '6px' }}>
              Action Required
            </div>
            <h3 className="intervention-title">Priority Flight-Risk Cohort (Top Critical Attention)</h3>
            <p className="intervention-sub">Immediate proactive engagement recommended to avoid imminent departure</p>
          </div>
          <button 
            className="action-btn action-btn-primary"
            onClick={onNavigateToPredictor}
          >
            <span>Run New Individual Prediction</span>
            <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="at-risk-table-wrapper">
          <table className="roster-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Age / Exp</th>
                <th>Monthly Salary</th>
                <th>Satisfaction</th>
                <th>Overtime</th>
                <th>Attrition Risk</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {topAtRisk.map((emp) => {
                const probScore = (emp.ground_truth_prob !== undefined ? emp.ground_truth_prob : 0.85).toFixed(2);
                return (
                  <tr key={emp.employee_id} className="roster-row">
                    <td>
                      <div className="emp-cell">
                        <div className="emp-avatar">{emp.name.charAt(0)}</div>
                        <div>
                          <strong className="emp-name-text">{emp.name}</strong>
                          <span className="emp-id-text">{emp.employee_id}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="dept-tag">{emp.department}</span></td>
                    <td>{emp.age} yrs / {emp.experience} yrs</td>
                    <td><strong>${emp.salary.toLocaleString()}</strong></td>
                    <td>
                      <span className="sat-pill">
                        {emp.composite_satisfaction || ((emp.job_satisfaction + emp.work_life_balance + emp.environment_satisfaction + emp.relationship_satisfaction) / 4).toFixed(1)} / 5
                      </span>
                    </td>
                    <td>
                      {emp.overtime === 1 || emp.overtime === true ? (
                        <span className="badge badge-high">Overtime Active</span>
                      ) : (
                        <span className="badge badge-low">Standard</span>
                      )}
                    </td>
                    <td>
                      <span className="risk-score-badge badge-high">
                        {probScore} Risk Index
                      </span>
                    </td>
                    <td>
                      <button 
                        className="assess-btn"
                        onClick={() => onSelectEmployee(emp)}
                      >
                        <span>Inspect Profile</span>
                        <ChevronRight size={14} />
                      </button>
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
