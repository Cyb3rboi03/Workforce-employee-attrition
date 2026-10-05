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
  RotateCcw,
  Zap
} from 'lucide-react';

// Helper to distribute tenths of a percent so percentages sum to EXACTLY 100.0%
function computeExactPercentages(list, totalCount) {
  if (!totalCount || totalCount === 0 || !list || list.length === 0) {
    return (list || []).map(item => ({ ...item, pct: '0.0' }));
  }
  const scaled = list.map((item, idx) => {
    const raw = (item.count / totalCount) * 1000;
    const floor = Math.floor(raw);
    return { idx, floor, remainder: raw - floor };
  });

  const sumFloor = scaled.reduce((acc, curr) => acc + curr.floor, 0);
  let diff = 1000 - sumFloor;

  scaled.sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; i < diff; i++) {
    scaled[i].floor += 1;
  }
  scaled.sort((a, b) => a.idx - b.idx);

  return list.map((item, idx) => ({
    ...item,
    pct: (scaled[idx].floor / 10).toFixed(1)
  }));
}

export default function DashboardTab({ employees, onSelectEmployee, onNavigateToPredictor }) {
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedOvertime, setSelectedOvertime] = useState('ALL');
  const [selectedRisk, setSelectedRisk] = useState('ALL');

  // Filtered dataset
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (selectedDept !== 'ALL' && emp.department !== selectedDept) return false;
      if (selectedOvertime === 'HEAVY' && (emp.overtime !== 1 || (emp.work_life_balance || 3) > 2)) return false;
      if (selectedOvertime === 'MODERATE' && (emp.overtime !== 1 || (emp.work_life_balance || 3) <= 2)) return false;
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

  // Canonical list of all monitored enterprise departments
  const ALL_DEPARTMENTS = useMemo(() => [
    'Research & Development',
    'Sales',
    'Engineering',
    'Marketing',
    'Human Resources',
    'Finance'
  ], []);

  // Breakdown by Department (shows ALL departments, headcount, and exact % summing to 100%)
  const deptBreakdown = useMemo(() => {
    // Evaluate the cohort filtered by Overtime & Risk, but NOT by Department so all departments are visible and compared
    const cohort = employees.filter((emp) => {
      if (selectedOvertime === 'HEAVY' && (emp.overtime !== 1 || (emp.work_life_balance || 3) > 2)) return false;
      if (selectedOvertime === 'MODERATE' && (emp.overtime !== 1 || (emp.work_life_balance || 3) <= 2)) return false;
      if (selectedOvertime === 'YES' && emp.overtime !== 1 && emp.overtime !== true) return false;
      if (selectedOvertime === 'NO' && (emp.overtime === 1 || emp.overtime === true)) return false;

      const prob = emp.ground_truth_prob !== undefined ? emp.ground_truth_prob : (emp.attrition ? 0.8 : 0.2);
      if (selectedRisk === 'HIGH' && prob < 0.60) return false;
      if (selectedRisk === 'MEDIUM' && (prob < 0.30 || prob >= 0.60)) return false;
      if (selectedRisk === 'LOW' && prob >= 0.30) return false;

      return true;
    });

    const totalCohortCount = cohort.length;
    const deptCounts = {};
    ALL_DEPARTMENTS.forEach(d => { deptCounts[d] = 0; });

    cohort.forEach(emp => {
      const d = emp.department || 'Other';
      deptCounts[d] = (deptCounts[d] || 0) + 1;
    });

    const list = ALL_DEPARTMENTS.map(name => ({
      name,
      count: deptCounts[name] || 0,
      isSelected: selectedDept === name
    })).sort((a, b) => b.count - a.count);

    return computeExactPercentages(list, totalCohortCount);
  }, [employees, selectedOvertime, selectedRisk, selectedDept, ALL_DEPARTMENTS]);

  // Breakdown by Overtime Schedule (Overtime Required / Heavy, Moderate / Medium, Standard Hours, headcount & exact % summing to 100%)
  const overtimeBreakdown = useMemo(() => {
    // Evaluated across the department & risk cohort (without collapsing on selectedOvertime)
    const cohort = employees.filter((emp) => {
      if (selectedDept !== 'ALL' && emp.department !== selectedDept) return false;

      const prob = emp.ground_truth_prob !== undefined ? emp.ground_truth_prob : (emp.attrition ? 0.8 : 0.2);
      if (selectedRisk === 'HIGH' && prob < 0.60) return false;
      if (selectedRisk === 'MEDIUM' && (prob < 0.30 || prob >= 0.60)) return false;
      if (selectedRisk === 'LOW' && prob >= 0.30) return false;

      return true;
    });

    const totalCohortCount = cohort.length;
    let heavyCount = 0;
    let modCount = 0;
    let nonOtCount = 0;

    cohort.forEach(emp => {
      if (emp.overtime === 1 || emp.overtime === true) {
        if ((emp.work_life_balance || 3) <= 2) {
          heavyCount++;
        } else {
          modCount++;
        }
      } else {
        nonOtCount++;
      }
    });

    const list = [
      { 
        id: 'HEAVY',
        label: 'Overtime Required', 
        count: heavyCount, 
        colorClass: 'ot-stat-active',
        color: '#f87171',
        barColor: '#ef4444',
        iconType: 'flame',
        isSelected: selectedOvertime === 'HEAVY' 
      },
      { 
        id: 'MODERATE',
        label: 'Moderate Overtime', 
        count: modCount, 
        colorClass: 'ot-stat-moderate',
        color: '#fbbf24',
        barColor: '#f59e0b',
        iconType: 'zap',
        isSelected: selectedOvertime === 'MODERATE' 
      },
      { 
        id: 'NO',
        label: 'Standard Hours', 
        count: nonOtCount, 
        colorClass: 'ot-stat-standard',
        color: '#34d399',
        barColor: '#10b981',
        iconType: 'check',
        isSelected: selectedOvertime === 'NO' 
      }
    ];

    return computeExactPercentages(list, totalCohortCount);
  }, [employees, selectedDept, selectedRisk, selectedOvertime]);

  // Breakdown by Attrition Risk Tier (High, Medium, Low, headcount & exact % summing to 100%)
  const riskTierBreakdown = useMemo(() => {
    // Evaluated across the department & overtime cohort (without collapsing on selectedRisk)
    const cohort = employees.filter((emp) => {
      if (selectedDept !== 'ALL' && emp.department !== selectedDept) return false;
      if (selectedOvertime === 'HEAVY' && (emp.overtime !== 1 || (emp.work_life_balance || 3) > 2)) return false;
      if (selectedOvertime === 'MODERATE' && (emp.overtime !== 1 || (emp.work_life_balance || 3) <= 2)) return false;
      if (selectedOvertime === 'YES' && emp.overtime !== 1 && emp.overtime !== true) return false;
      if (selectedOvertime === 'NO' && (emp.overtime === 1 || emp.overtime === true)) return false;

      return true;
    });

    const totalCohortCount = cohort.length;
    let highCount = 0;
    let medCount = 0;
    let lowCount = 0;

    cohort.forEach(emp => {
      const prob = emp.ground_truth_prob !== undefined ? emp.ground_truth_prob : (emp.attrition ? 0.8 : 0.2);
      if (prob >= 0.60) {
        highCount++;
      } else if (prob >= 0.30) {
        medCount++;
      } else {
        lowCount++;
      }
    });

    const list = [
      {
        id: 'HIGH',
        label: 'High Risk',
        count: highCount,
        colorClass: 'bg-risk-high',
        dotClass: 'dot-high',
        textColor: '#ef4444',
        barColor: '#ef4444',
        cardClass: 'risk-card-high',
        iconType: 'flame',
        isSelected: selectedRisk === 'HIGH'
      },
      {
        id: 'MEDIUM',
        label: 'Medium Risk',
        count: medCount,
        colorClass: 'bg-risk-med',
        dotClass: 'dot-med',
        textColor: '#f59e0b',
        barColor: '#f59e0b',
        cardClass: 'risk-card-med',
        iconType: 'alert',
        isSelected: selectedRisk === 'MEDIUM'
      },
      {
        id: 'LOW',
        label: 'Low Risk',
        count: lowCount,
        colorClass: 'bg-risk-low',
        dotClass: 'dot-low',
        textColor: '#10b981',
        barColor: '#10b981',
        cardClass: 'risk-card-low',
        iconType: 'shield',
        isSelected: selectedRisk === 'LOW'
      }
    ];

    return computeExactPercentages(list, totalCohortCount);
  }, [employees, selectedDept, selectedOvertime, selectedRisk]);

  // Filtered displayed lists: when a specific item is selected in the console, show ONLY that item, preserving its % share among the cohort
  const displayedDeptList = useMemo(() => {
    if (selectedDept === 'ALL') {
      return deptBreakdown;
    }
    return deptBreakdown.filter(d => d.name === selectedDept);
  }, [deptBreakdown, selectedDept]);

  const displayedOvertimeList = useMemo(() => {
    if (selectedOvertime === 'ALL') {
      return overtimeBreakdown;
    }
    return overtimeBreakdown.filter(ot => ot.id === selectedOvertime);
  }, [overtimeBreakdown, selectedOvertime]);

  const displayedRiskList = useMemo(() => {
    if (selectedRisk === 'ALL') {
      return riskTierBreakdown;
    }
    return riskTierBreakdown.filter(r => r.id === selectedRisk);
  }, [riskTierBreakdown, selectedRisk]);

  // Salary Bracket Breakdown (Headcount & exact % summing to 100%)
  const salaryBrackets = useMemo(() => {
    const totalCount = filteredEmployees.length;
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

    const list = brackets.map(b => ({
      ...b,
      rate: b.count > 0 ? (b.attrited / b.count).toFixed(2) : '0.00'
    }));

    return computeExactPercentages(list, totalCount);
  }, [filteredEmployees]);

  // Experience Tenure Breakdown (Headcount & exact % summing to 100%)
  const experienceTiers = useMemo(() => {
    const totalCount = filteredEmployees.length;
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

    const list = tiers.map(t => ({
      ...t,
      rate: t.count > 0 ? (t.attrited / t.count).toFixed(2) : '0.00'
    }));

    return computeExactPercentages(list, totalCount);
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
                <option value="HEAVY">🔥 Overtime Required (Heavy)</option>
                <option value="MODERATE">⚡ Moderate Overtime (Medium)</option>
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
                <option value="HIGH">🔴 High Risk</option>
                <option value="MEDIUM">🟡 Medium Risk</option>
                <option value="LOW">🟢 Low Risk</option>
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
        {/* CHART 1: Headcount Distribution by Department */}
        <div className="chart-card glass-panel">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">
                <BarChart3 size={18} className="icon-accent" />
                <span>Headcount Distribution by Department</span>
              </h3>
            </div>
            <span className="badge badge-neutral">
              {selectedDept === 'ALL' ? `${deptBreakdown.length} Departments` : '1 Selected Department'}
            </span>
          </div>

          <div className="dept-bars-list">
            {displayedDeptList.map((dept) => {
              const pctNum = Number(dept.pct);
              return (
                <div 
                  key={dept.name} 
                  className={`dept-bar-row ${dept.isSelected ? 'dept-row-selected' : ''}`}
                  onClick={() => setSelectedDept(selectedDept === dept.name ? 'ALL' : dept.name)}
                  style={{ cursor: 'pointer' }}
                  title={`Click to toggle filter for ${dept.name}`}
                >
                  <div className="dept-bar-labels">
                    <span className="dept-bar-name">
                      {dept.name}
                      {dept.isSelected && (
                        <span className="badge badge-primary" style={{ marginLeft: '8px', fontSize: '0.68rem', padding: '2px 7px' }}>
                          Selected
                        </span>
                      )}
                    </span>
                    <div className="dept-bar-metrics">
                      <span className="dept-bar-count">{dept.count.toLocaleString()} staff</span>
                      <span className="dept-bar-sep">•</span>
                      <strong className="dept-bar-rate" style={{ color: '#38bdf8', fontWeight: 700 }}>
                        {dept.pct}%
                      </strong>
                    </div>
                  </div>
                  <div className="dept-bar-track">
                    <div 
                      className="dept-bar-fill" 
                      style={{ 
                        width: `${Math.min(100, Math.max(dept.count > 0 ? 3 : 0, pctNum))}%`,
                        background: dept.isSelected 
                          ? 'linear-gradient(90deg, #38bdf8, #818cf8)' 
                          : 'linear-gradient(90deg, #6366f1, #06b6d4)'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 2: Overtime Schedule & Risk Tier Distribution */}
        <div className="chart-card glass-panel">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">
                <Clock size={18} className="icon-accent" />
                <span>Overtime Schedule & Risk Tier Distribution</span>
              </h3>
            </div>
            <span className="badge badge-neutral">
              {(selectedOvertime !== 'ALL' || selectedRisk !== 'ALL') ? 'Filtered Breakdown' : 'Headcount Breakdown'}
            </span>
          </div>

          {/* Overtime comparison cards */}
          <div 
            className={`ot-comparison-grid ot-cols-${displayedOvertimeList.length}`}
            style={{ 
              gap: '12px'
            }}
          >
            {displayedOvertimeList.map((ot) => (
              <div 
                key={ot.id}
                className={`ot-stat-card ${ot.isSelected ? 'ot-stat-selected' : ot.colorClass}`}
                onClick={() => setSelectedOvertime(selectedOvertime === ot.id ? 'ALL' : ot.id)}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease', padding: '14px 16px' }}
                title={`Click to toggle filter for ${ot.label}`}
              >
                <div className="ot-card-top">
                  {ot.iconType === 'flame' && <Flame size={18} style={{ color: ot.color }} />}
                  {ot.iconType === 'zap' && <Zap size={18} style={{ color: ot.color }} />}
                  {ot.iconType === 'check' && <CheckCircle2 size={18} style={{ color: ot.color }} />}
                  <span className="ot-card-label">{ot.label}</span>
                  {ot.isSelected && (
                    <span className="badge badge-primary" style={{ marginLeft: 'auto', fontSize: '0.62rem', padding: '1px 5px' }}>
                      Selected
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '6px 0 2px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {ot.count.toLocaleString()} staff
                  </span>
                  <h4 className="ot-card-pct" style={{ color: ot.color, margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
                    {ot.pct}%
                  </h4>
                </div>
                <div style={{ height: '5px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', overflow: 'hidden', marginTop: '6px' }}>
                  <div style={{ height: '100%', width: `${ot.pct}%`, background: ot.barColor, borderRadius: '9999px' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Overtime Stacked Distribution Bar */}
          <div className="risk-stacked-bar" style={{ marginBottom: '8px' }}>
            {displayedOvertimeList.map((ot) => (
              <div 
                key={ot.id}
                className="risk-stack-segment" 
                style={{ width: `${ot.pct}%`, backgroundColor: ot.barColor }}
                title={`${ot.label}: ${ot.count} staff (${ot.pct}%)`}
              />
            ))}
          </div>

          {/* Overtime Legend Row */}
          <div className="risk-legend-row" style={{ marginBottom: '4px' }}>
            {displayedOvertimeList.map((ot) => (
              <div 
                key={ot.id}
                className="legend-item" 
                style={{ 
                  cursor: 'pointer', 
                  opacity: 1,
                  fontWeight: ot.isSelected ? 700 : 400
                }}
                onClick={() => setSelectedOvertime(selectedOvertime === ot.id ? 'ALL' : ot.id)}
                title={`Click to toggle filter for ${ot.label}`}
              >
                <span className="legend-dot" style={{ backgroundColor: ot.barColor }} />
                <span>
                  {ot.label.split(' ')[0]}: <strong>{ot.count.toLocaleString()} staff • {ot.pct}%</strong>
                  {ot.isSelected && (
                    <span className="badge badge-primary" style={{ marginLeft: '4px', fontSize: '0.6rem', padding: '1px 5px' }}>
                      Selected
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Risk Tier Distribution Section with Stat Cards + Stacked Bar */}
          <div className="risk-dist-section" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 className="risk-dist-title" style={{ margin: 0 }}>Attrition Risk Tier Distribution</h4>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {selectedRisk === 'ALL' ? 'Sum: 100.0%' : `Cohort Share: ${displayedRiskList[0]?.pct || 0}%`}
              </span>
            </div>

            {/* Risk Tier Cards (High, Medium, Low) */}
            <div 
              className={`ot-comparison-grid ot-cols-${displayedRiskList.length}`}
              style={{ 
                gap: '12px',
                marginBottom: '14px'
              }}
            >
              {displayedRiskList.map((tier) => (
                <div 
                  key={tier.id}
                  className={`ot-stat-card ${tier.isSelected ? 'ot-stat-selected' : tier.cardClass}`}
                  onClick={() => setSelectedRisk(selectedRisk === tier.id ? 'ALL' : tier.id)}
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease', padding: '14px 16px' }}
                  title={`Click to toggle filter for ${tier.label}`}
                >
                  <div className="ot-card-top">
                    {tier.iconType === 'flame' && <Flame size={18} style={{ color: tier.textColor }} />}
                    {tier.iconType === 'alert' && <AlertOctagon size={18} style={{ color: tier.textColor }} />}
                    {tier.iconType === 'shield' && <ShieldCheck size={18} style={{ color: tier.textColor }} />}
                    <span className="ot-card-label">{tier.label}</span>
                    {tier.isSelected && (
                      <span className="badge badge-primary" style={{ marginLeft: 'auto', fontSize: '0.62rem', padding: '1px 5px' }}>
                        Selected
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '6px 0 2px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {tier.count.toLocaleString()} staff
                    </span>
                    <h4 className="ot-card-pct" style={{ color: tier.textColor, margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
                      {tier.pct}%
                    </h4>
                  </div>
                  <div style={{ height: '5px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', overflow: 'hidden', marginTop: '6px' }}>
                    <div style={{ height: '100%', width: `${tier.pct}%`, background: tier.barColor, borderRadius: '9999px' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Stacked bar */}
            <div className="risk-stacked-bar">
              {displayedRiskList.map((tier) => (
                <div 
                  key={tier.id}
                  className={`risk-stack-segment ${tier.colorClass}`} 
                  style={{ width: `${tier.pct}%` }}
                  title={`${tier.label}: ${tier.count} staff (${tier.pct}%)`}
                />
              ))}
            </div>

            {/* Legend row */}
            <div className="risk-legend-row" style={{ marginTop: '8px' }}>
              {displayedRiskList.map((tier) => (
                <div 
                  key={tier.id}
                  className="legend-item" 
                  style={{ 
                    cursor: 'pointer', 
                    opacity: 1,
                    fontWeight: tier.isSelected ? 700 : 400
                  }}
                  onClick={() => setSelectedRisk(selectedRisk === tier.id ? 'ALL' : tier.id)}
                  title={`Click to toggle filter for ${tier.label}`}
                >
                  <span className={`legend-dot ${tier.dotClass}`} />
                  <span>
                    {tier.label}: <strong>{tier.count.toLocaleString()} staff • {tier.pct}%</strong>
                    {tier.isSelected && (
                      <span className="badge badge-primary" style={{ marginLeft: '4px', fontSize: '0.6rem', padding: '1px 5px' }}>
                        Selected
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: SALARY & EXPERIENCE CORRELATION CHARTS */}
      <div className="analytics-double-row">
        {/* CHART 3: Headcount by Salary Bracket */}
        <div className="chart-card glass-panel">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">
                <DollarSign size={18} className="icon-accent" />
                <span>Headcount by Salary Bracket</span>
              </h3>
            </div>
          </div>

          <div className="tier-bars-list">
            {salaryBrackets.map((bracket) => {
              const pctNum = Number(bracket.pct);
              return (
                <div key={bracket.label} className="tier-row">
                  <div className="tier-header">
                    <span className="tier-name">{bracket.label}</span>
                    <span className="tier-stats">
                      {bracket.count} staff • <strong className="tier-rate" style={{ color: '#38bdf8', fontWeight: 700 }}>{bracket.pct}%</strong>
                    </span>
                  </div>
                  <div className="tier-track">
                    <div 
                      className="tier-fill"
                      style={{ 
                        width: `${Math.min(100, Math.max(4, pctNum))}%`,
                        background: 'linear-gradient(90deg, #6366f1, #06b6d4)'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 4: Headcount by Experience / Tenure */}
        <div className="chart-card glass-panel">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">
                <Activity size={18} className="icon-accent" />
                <span>Headcount by Experience / Tenure</span>
              </h3>
            </div>
          </div>

          <div className="tier-bars-list">
            {experienceTiers.map((tier) => {
              const pctNum = Number(tier.pct);
              return (
                <div key={tier.label} className="tier-row">
                  <div className="tier-header">
                    <span className="tier-name">{tier.label}</span>
                    <span className="tier-stats">
                      {tier.count} staff • <strong className="tier-rate" style={{ color: '#38bdf8', fontWeight: 700 }}>{tier.pct}%</strong>
                    </span>
                  </div>
                  <div className="tier-track">
                    <div 
                      className="tier-fill"
                      style={{ 
                        width: `${Math.min(100, Math.max(4, pctNum))}%`,
                        background: 'linear-gradient(90deg, #6366f1, #06b6d4)'
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
