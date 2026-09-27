import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Clock, 
  HeartHandshake, 
  Sliders, 
  ShieldCheck, 
  Sparkles, 
  UserPlus, 
  Flame, 
  ArrowRight,
  Database,
  Search,
  Check,
  X,
  RotateCcw
} from 'lucide-react';
import { calculateAttritionRisk } from '../utils/predictor';
import ibmRealWorkforceDataset from '../data/ibmRealWorkforceDataset.json';

const DEPARTMENTS = [
  { id: 'Research & Development', label: 'R&D', icon: '🔬', desc: 'Engineering & scientific research' },
  { id: 'Sales', label: 'Sales', icon: '📈', desc: 'Client acquisition & revenue' },
  { id: 'Engineering', label: 'Engineering', icon: '💻', desc: 'Software, cloud & infra' },
  { id: 'Human Resources', label: 'Human Resources', icon: '👥', desc: 'People ops & talent' },
  { id: 'Marketing', label: 'Marketing', icon: '🎯', desc: 'Growth, brand & product' },
  { id: 'Finance', label: 'Finance', icon: '💳', desc: 'Financial planning & treasury' },
];

export default function PredictorTab({ 
  employees = [], 
  initialEmployee = null,
  onAddToRoster, 
  onSendToWhatIf 
}) {
  // Combine incoming employees with IBM workforce database
  const workforceDatabase = useMemo(() => {
    if (employees && employees.length > 0) return employees;
    return ibmRealWorkforceDataset;
  }, [employees]);

  // Initial baseline employee ONLY if explicitly provided via props
  const initialBaseline = initialEmployee || null;

  // Track the synced database employee record
  const [syncedEmployee, setSyncedEmployee] = useState(initialBaseline);
  const [isModified, setIsModified] = useState(false);
  const [employeeName, setEmployeeName] = useState(initialBaseline?.name || '');

  // 6 Required Input Dimensions (Null when no name given or reset)
  const [age, setAge] = useState(initialBaseline ? Number(initialBaseline.age) : null);
  const [salary, setSalary] = useState(initialBaseline ? Number(initialBaseline.salary) : null);
  const [experience, setExperience] = useState(initialBaseline ? Number(initialBaseline.experience) : null);
  const [department, setDepartment] = useState(initialBaseline?.department || null);
  const [jobSatisfaction, setJobSatisfaction] = useState(initialBaseline ? Number(initialBaseline.job_satisfaction) : null);
  const [workLifeBalance, setWorkLifeBalance] = useState(initialBaseline ? Number(initialBaseline.work_life_balance) : null);
  const [envSatisfaction, setEnvSatisfaction] = useState(initialBaseline ? Number(initialBaseline.environment_satisfaction) : null);
  const [relSatisfaction, setRelSatisfaction] = useState(initialBaseline ? Number(initialBaseline.relationship_satisfaction) : null);
  const [overtime, setOvertime] = useState(
    initialBaseline ? (initialBaseline.overtime === 1 || initialBaseline.overtime === true || String(initialBaseline.overtime).toLowerCase() === 'yes') : false
  );

  // Autocomplete suggestions & Database Browser state
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isDbBrowserOpen, setIsDbBrowserOpen] = useState(false);
  const [dbSearchQuery, setDbSearchQuery] = useState('');
  const [dbDeptFilter, setDbDeptFilter] = useState('ALL');

  const searchBoxRef = useRef(null);

  // Reset all fields so nothing is selected
  const resetAllFields = () => {
    setEmployeeName('');
    setSyncedEmployee(null);
    setIsModified(false);
    setAge(null);
    setSalary(null);
    setExperience(null);
    setDepartment(null);
    setJobSatisfaction(null);
    setWorkLifeBalance(null);
    setEnvSatisfaction(null);
    setRelSatisfaction(null);
    setOvertime(false);
    setIsSuggestionsOpen(false);
  };

  // Synchronize state with an employee record
  const syncWithEmployee = (emp) => {
    if (!emp) return;
    setEmployeeName(emp.name || '');
    setAge(Number(emp.age) || 30);
    setSalary(Number(emp.salary) || 5000);
    setExperience(Number(emp.experience) || 3);
    if (emp.department) {
      setDepartment(emp.department);
    }
    setJobSatisfaction(Number(emp.job_satisfaction) || 3);
    setWorkLifeBalance(Number(emp.work_life_balance) || 3);
    setEnvSatisfaction(Number(emp.environment_satisfaction) || 3);
    setRelSatisfaction(Number(emp.relationship_satisfaction) || 3);

    const isOt = emp.overtime === 1 || emp.overtime === true || String(emp.overtime).toLowerCase() === 'yes';
    setOvertime(isOt);

    setSyncedEmployee(emp);
    setIsModified(false);
    setIsSuggestionsOpen(false);
    setIsDbBrowserOpen(false);
  };

  // Sync when initialEmployee prop updates dynamically from external action
  useEffect(() => {
    if (initialEmployee) {
      syncWithEmployee(initialEmployee);
    }
  }, [initialEmployee]);

  // Click outside listener for suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute suggestions based on user input
  const suggestions = useMemo(() => {
    const query = employeeName.trim().toLowerCase();
    if (!query) return [];
    return workforceDatabase
      .filter((emp) => {
        const matchName = emp.name && emp.name.toLowerCase().includes(query);
        const matchId = emp.employee_id && emp.employee_id.toLowerCase().includes(query);
        const matchDept = emp.department && emp.department.toLowerCase().includes(query);
        return matchName || matchId || matchDept;
      })
      .slice(0, 8);
  }, [employeeName, workforceDatabase]);

  // Handle typing in the name input field
  const handleNameChange = (e) => {
    const value = e.target.value;
    setEmployeeName(value);

    const clean = value.trim().toLowerCase();
    if (!clean) {
      // If no name is given, reset all fields so nothing is selected!
      resetAllFields();
      return;
    }

    setIsSuggestionsOpen(true);
    setHighlightedIndex(-1);

    // Direct exact match check (Name or Employee ID)
    const exactMatch = workforceDatabase.find((emp) => 
      (emp.name && emp.name.toLowerCase() === clean) ||
      (emp.employee_id && emp.employee_id.toLowerCase() === clean)
    );

    if (exactMatch) {
      syncWithEmployee(exactMatch);
    } else if (syncedEmployee && syncedEmployee.name.toLowerCase() !== clean) {
      // User typed a custom name different from synced employee
      setSyncedEmployee(null);
      setIsModified(true);
    }
  };

  // Keyboard navigation for suggestions
  const handleKeyDown = (e) => {
    if (!isSuggestionsOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = highlightedIndex >= 0 ? suggestions[highlightedIndex] : suggestions[0];
      if (target) {
        syncWithEmployee(target);
      }
    } else if (e.key === 'Escape') {
      setIsSuggestionsOpen(false);
    }
  };

  // Helper when user tweaks any input parameter
  const updateInputWithFlag = (setter, val) => {
    setter(val);
    if (syncedEmployee) {
      setIsModified(true);
    }
  };

  // Check if an employee profile is active or inputs are given
  const hasActiveProfile = Boolean(
    employeeName.trim() || 
    syncedEmployee || 
    department !== null || 
    jobSatisfaction !== null
  );

  // Compute composite satisfaction for display
  const compositeScore = useMemo(() => {
    const activeRatings = [jobSatisfaction, workLifeBalance, envSatisfaction, relSatisfaction].filter(v => v !== null);
    if (activeRatings.length === 0) return null;
    return (activeRatings.reduce((a, b) => a + b, 0) / activeRatings.length).toFixed(1);
  }, [jobSatisfaction, workLifeBalance, envSatisfaction, relSatisfaction]);

  // Compute live prediction only when an active profile exists
  const result = useMemo(() => {
    if (!hasActiveProfile) return null;

    return calculateAttritionRisk({
      age: age ?? 30,
      salary: salary ?? 5000,
      experience: experience ?? 3,
      department: department ?? 'Sales',
      job_satisfaction: jobSatisfaction ?? 3,
      work_life_balance: workLifeBalance ?? 3,
      environment_satisfaction: envSatisfaction ?? 3,
      relationship_satisfaction: relSatisfaction ?? 3,
      overtime: Boolean(overtime)
    });
  }, [hasActiveProfile, age, salary, experience, department, jobSatisfaction, workLifeBalance, envSatisfaction, relSatisfaction, overtime]);

  const handleSaveToRoster = () => {
    if (!result || !employeeName.trim()) return;

    onAddToRoster({
      employee_id: syncedEmployee?.employee_id || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: employeeName.trim(),
      age: age ?? 30,
      salary: salary ?? 5000,
      experience: experience ?? 3,
      department: department || 'Sales',
      job_satisfaction: jobSatisfaction ?? 3,
      work_life_balance: workLifeBalance ?? 3,
      environment_satisfaction: envSatisfaction ?? 3,
      relationship_satisfaction: relSatisfaction ?? 3,
      composite_satisfaction: compositeScore ? Number(compositeScore) : 3.0,
      overtime: overtime ? 1 : 0,
      attrition: result.isAttritionLikely ? 1 : 0,
      ground_truth_prob: result.rawProbability
    });
  };

  const handleForwardToWhatIf = () => {
    if (!result || !employeeName.trim()) return;

    onSendToWhatIf({
      employee_id: syncedEmployee?.employee_id,
      age: age ?? 30,
      salary: salary ?? 5000,
      experience: experience ?? 3,
      department: department || 'Sales',
      job_satisfaction: jobSatisfaction ?? 3,
      work_life_balance: workLifeBalance ?? 3,
      environment_satisfaction: envSatisfaction ?? 3,
      relationship_satisfaction: relSatisfaction ?? 3,
      overtime: Boolean(overtime),
      name: employeeName.trim()
    });
  };

  // Filtered list for Database Explorer modal
  const filteredDbEmployees = useMemo(() => {
    return workforceDatabase.filter((emp) => {
      if (dbDeptFilter !== 'ALL' && emp.department !== dbDeptFilter) return false;
      if (dbSearchQuery.trim()) {
        const q = dbSearchQuery.toLowerCase();
        const matchName = emp.name && emp.name.toLowerCase().includes(q);
        const matchId = emp.employee_id && emp.employee_id.toLowerCase().includes(q);
        const matchDept = emp.department && emp.department.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchDept) return false;
      }
      return true;
    });
  }, [workforceDatabase, dbSearchQuery, dbDeptFilter]);

  // SVG Gauge calculations
  const strokeDashoffset = result ? (283 - (283 * result.rawProbability)) : 283;

  return (
    <div className="predictor-container animate-fade-in">
      {/* Header */}
      <div className="predictor-header-row">
        <div>
          <div className="badge badge-neutral" style={{ marginBottom: '8px' }}>
            <Sparkles size={12} color="var(--primary)" /> Calibrated Predictive Model & Database Link
          </div>
          <h2 className="section-heading">Employee Attrition Predictor & Risk Assessment</h2>
          <p className="section-subheading">
            Evaluate individual retention flight risk by inputting employee demographics, compensation, experience, role satisfaction, and overtime.
          </p>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {(employeeName || department !== null || age !== null) && (
                <button
                  type="button"
                  className="reset-all-pill-btn"
                  onClick={resetAllFields}
                  title="Reset and unselect all values"
                >
                  <RotateCcw size={12} />
                  <span>Reset All</span>
                </button>
              )}
              <span className="badge badge-neutral">Real-Time Scoring</span>
            </div>
          </div>

          <div className="input-form">
            {/* Database Linked Employee Name Search & Auto-Sync Bar */}
            <div className="form-group db-sync-search-group" ref={searchBoxRef}>
              <div className="name-header-row">
                <label className="form-label" htmlFor="emp-name">
                  Employee Name / Database Lookup
                </label>
                <button
                  type="button"
                  className="browse-db-pill-btn"
                  onClick={() => setIsDbBrowserOpen(true)}
                  title="Open workforce database directory"
                >
                  <Database size={12} className="icon-database-glow" />
                  <span>Workforce DB ({workforceDatabase.length})</span>
                </button>
              </div>

              <div className="name-input-wrapper">
                <Search size={16} className="name-input-icon" />
                <input
                  id="emp-name"
                  type="text"
                  className="form-input name-search-field"
                  value={employeeName}
                  onChange={handleNameChange}
                  onFocus={() => {
                    if (employeeName.trim()) setIsSuggestionsOpen(true);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter employee name from database (e.g. Liam Moore) or ID..."
                  autoComplete="off"
                />
                {employeeName && (
                  <button 
                    type="button" 
                    className="name-clear-action-btn"
                    onClick={resetAllFields}
                    title="Clear name and reset all values"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown List */}
              {isSuggestionsOpen && suggestions.length > 0 && (
                <div className="name-autocomplete-dropdown animate-fade-in">
                  <div className="autocomplete-header">
                    <span>Database Matches ({suggestions.length})</span>
                    <span className="autocomplete-hint">Click or press Enter to sync</span>
                  </div>
                  <div className="autocomplete-items-list">
                    {suggestions.map((emp, idx) => (
                      <div
                        key={emp.employee_id}
                        className={`autocomplete-item ${highlightedIndex === idx ? 'autocomplete-item-active' : ''}`}
                        onClick={() => syncWithEmployee(emp)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                      >
                        <div className="autocomplete-avatar">
                          {emp.name ? emp.name.charAt(0) : 'E'}
                        </div>
                        <div className="autocomplete-info">
                          <div className="autocomplete-name-row">
                            <strong className="autocomplete-emp-name">{emp.name}</strong>
                            <span className="autocomplete-id">{emp.employee_id}</span>
                            <span className="autocomplete-dept-badge">{emp.department}</span>
                          </div>
                          <div className="autocomplete-meta">
                            <span>Age {emp.age}</span>
                            <span>•</span>
                            <span>${emp.salary?.toLocaleString()}/mo</span>
                            <span>•</span>
                            <span>{emp.experience}y exp</span>
                            <span>•</span>
                            <span>OT: {emp.overtime ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                        <div className="autocomplete-action">
                          <span className="sync-pill-tag">
                            <Sparkles size={11} /> Sync
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Database Sync Status Bar */}
              {syncedEmployee ? (
                <div className="db-sync-card animate-fade-in">
                  <div className="db-sync-card-left">
                    <div className="db-sync-icon-bubble">
                      <Check size={14} />
                    </div>
                    <div>
                      <div className="db-sync-title-line">
                        <span className="db-sync-status-text">Synced with Database:</span>
                        <strong className="db-sync-emp-title">{syncedEmployee.name}</strong>
                        <span className="db-sync-badge-id">{syncedEmployee.employee_id}</span>
                        <span className="db-sync-badge-dept">{syncedEmployee.department}</span>
                        {isModified && (
                          <span className="db-sync-badge-mod" title="Inputs modified from database record">
                            Modified
                          </span>
                        )}
                      </div>
                      <p className="db-sync-desc">
                        Loaded details: ${syncedEmployee.salary?.toLocaleString()}/mo • {syncedEmployee.age} yrs • {syncedEmployee.experience} yrs exp • OT: {syncedEmployee.overtime ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                  <div className="db-sync-card-actions">
                    {isModified && (
                      <button
                        type="button"
                        className="db-action-btn-reset"
                        onClick={() => syncWithEmployee(syncedEmployee)}
                        title="Reset all inputs back to original database values"
                      >
                        <RotateCcw size={12} />
                        <span>Reset DB</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="db-action-btn-unlink"
                      onClick={() => {
                        setSyncedEmployee(null);
                        setIsModified(false);
                      }}
                      title="Unlink from database to create custom candidate"
                    >
                      Unlink
                    </button>
                  </div>
                </div>
              ) : (
                <div className="db-sync-hint-row">
                  <Database size={13} color="var(--primary)" />
                  <span>
                    Linked to workforce database ({workforceDatabase.length} employees). Type any name (e.g. <strong>Alexander Brown</strong>, <strong>Liam Moore</strong>) to auto-populate all fields.
                  </span>
                </div>
              )}
            </div>

            {/* 1. EMPLOYEE AGE */}
            <div className="form-group">
              <div className="slider-label-row">
                <label className="form-label" htmlFor="emp-age">
                  1. Employee Age
                </label>
                <span className={`slider-value-badge ${age === null ? 'badge-unselected' : ''}`}>
                  {age !== null ? `${age} years old` : 'Not Selected'}
                </span>
              </div>
              <input
                id="emp-age"
                type="range"
                min="18"
                max="65"
                step="1"
                value={age ?? 18}
                onChange={(e) => updateInputWithFlag(setAge, Number(e.target.value))}
                className={age === null ? 'slider-unselected' : ''}
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
                <span className={`slider-value-badge ${salary !== null ? 'slider-value-primary' : 'badge-unselected'}`}>
                  {salary !== null ? (
                    <>
                      ${salary.toLocaleString()} / mo 
                      <span className="salary-annual"> (~${(salary * 12 / 1000).toFixed(0)}k/yr)</span>
                    </>
                  ) : (
                    'Not Selected'
                  )}
                </span>
              </div>
              <input
                id="emp-salary"
                type="range"
                min="2000"
                max="25000"
                step="250"
                value={salary ?? 2000}
                onChange={(e) => updateInputWithFlag(setSalary, Number(e.target.value))}
                className={salary === null ? 'slider-unselected' : ''}
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
                <span className={`slider-value-badge ${experience === null ? 'badge-unselected' : ''}`}>
                  {experience !== null ? `${experience} ${experience === 1 ? 'Year' : 'Years'}` : 'Not Selected'}
                </span>
              </div>
              <input
                id="emp-exp"
                type="range"
                min="0"
                max="35"
                step="1"
                value={experience ?? 0}
                onChange={(e) => updateInputWithFlag(setExperience, Number(e.target.value))}
                className={experience === null ? 'slider-unselected' : ''}
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
                      onClick={() => updateInputWithFlag(setDepartment, dept.id)}
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
                <div className="composite-sat-badge" data-tooltip="Average across all satisfaction parameters">
                  <span>Composite:</span>
                  <strong>{compositeScore !== null ? `${compositeScore} / 5.0` : '-- / 5.0'}</strong>
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
                      onClick={() => updateInputWithFlag(setJobSatisfaction, lvl)}
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
                      onClick={() => updateInputWithFlag(setWorkLifeBalance, lvl)}
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
                      onClick={() => updateInputWithFlag(setEnvSatisfaction, lvl)}
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
                      onClick={() => updateInputWithFlag(setRelSatisfaction, lvl)}
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
                    onChange={(e) => updateInputWithFlag(setOvertime, e.target.checked)}
                  />
                  <span className="slider-switch"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The 3 Core Outputs (Prediction, Probability, Risk Assessment) */}
        <div className="output-column">
          <div className="output-card glass-panel glow-card">
            <div className="output-card-header">
              <span className="output-kicker">Predictive Output Engine</span>
              <span className={`badge ${
                result ? (
                  result.riskLevel === 'HIGH' ? 'badge-high' : 
                  result.riskLevel === 'MEDIUM' ? 'badge-med' : 'badge-low'
                ) : 'badge-neutral'
              }`}>
                {result ? result.riskBadge : 'Awaiting Input Profile'}
              </span>
            </div>

            {/* Output 1: Attrition Prediction Banner */}
            {result ? (
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
                      ? `Warning: Model predicts ${employeeName || 'this employee'} has an elevated probability of voluntary resignation in the next 6-12 months.`
                      : `${employeeName || 'This employee'} displays stable retention characteristics with low statistical intent to leave.`
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="prediction-banner banner-attrition-awaiting">
                <div className="banner-icon-side">
                  <Sliders size={32} className="icon-awaiting" />
                </div>
                <div className="banner-text-side">
                  <span className="banner-small-label">OUTPUT 1: ATTRITION PREDICTION</span>
                  <h3 className="prediction-headline" style={{ color: 'var(--text-main)' }}>No Employee Selected</h3>
                  <p className="prediction-explanation">
                    Enter an employee name from the database (e.g. <em>Alexander Brown</em>, <em>Liam Moore</em>) or select parameters on the left to evaluate retention flight risk.
                  </p>
                </div>
              </div>
            )}

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
                    stroke={result ? result.riskColor : 'var(--border-color)'}
                    strokeDasharray="283"
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="gauge-inner-content">
                  <span className="gauge-pct" style={{ color: result ? result.riskColor : 'var(--text-muted)' }}>
                    {result ? result.attritionProbability : '--'}
                  </span>
                  <span className="gauge-label">
                    <span>{result ? 'PROBABILITY' : 'AWAITING'}</span>
                    <span>{result ? 'SCORE' : 'SELECTION'}</span>
                  </span>
                  <span className="gauge-range">{result ? '(0.00 – 1.00)' : 'Select profile'}</span>
                </div>
              </div>

              <div className="probability-meta">
                <div className="prob-stat-row">
                  <span className="prob-meta-title">OUTPUT 2: Attrition Probability</span>
                  <strong className="prob-meta-value" style={{ color: result ? result.riskColor : 'var(--text-muted)' }}>
                    {result ? result.attritionProbability : '--'}
                  </strong>
                </div>

                <div className="prob-stat-row">
                  <span className="prob-meta-title">OUTPUT 3: Risk Classification</span>
                  <strong className="prob-meta-value">
                    {result ? `${result.riskLevel} FLIGHT RISK` : 'Not Evaluated'}
                  </strong>
                </div>

                <div className="prob-stat-row">
                  <span className="prob-meta-title">Estimated Replacement Cost</span>
                  <strong className="prob-meta-value text-accent">
                    {result ? `$${(result.estimatedTurnoverCost != null ? result.estimatedTurnoverCost : Math.round((salary || 5000) * 6)).toLocaleString()}` : '$--'}
                  </strong>
                </div>

                <div className="prob-stat-row">
                  <span className="prob-meta-title">Composite Satisfaction</span>
                  <strong className="prob-meta-value">
                    {compositeScore !== null ? `${compositeScore} / 5.0` : '-- / 5.0'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Risk Attribution Diagnostics Breakdown */}
            <div className="risk-factors-section">
              <h4 className="factors-title">Diagnostic Drivers (Feature Attributions)</h4>
              {result ? (
                <div className="factor-pills-grid">
                  {(result.topRiskFactors || []).map((f, i) => (
                    <div key={i} className="factor-card factor-risk">
                      <span className="factor-dot factor-dot-risk"></span>
                      <span className="factor-text">{f}</span>
                    </div>
                  ))}
                  {(result.protectiveFactors || []).map((f, i) => (
                    <div key={i} className="factor-card factor-safe">
                      <span className="factor-dot factor-dot-safe"></span>
                      <span className="factor-text">{f}</span>
                    </div>
                  ))}
                  {(!result.topRiskFactors?.length && !result.protectiveFactors?.length) && (
                    <div className="factor-card factor-safe">
                      <span className="factor-dot factor-dot-safe"></span>
                      <span className="factor-text">Balanced Retention Profile</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="awaiting-placeholder-box">
                  Select or enter an employee name to generate AI-attributed risk and protective drivers.
                </div>
              )}
            </div>

            {/* Prescriptive HR Retention Strategy */}
            <div className="retention-actions-section">
              <div className="actions-header">
                <HeartHandshake size={18} className="icon-accent" />
                <h4 className="actions-title">Prescriptive HR Retention Playbook</h4>
              </div>

              {result ? (
                <div className="retention-plan-list">
                  {(result.retentionRecommendations || []).map((rec, i) => (
                    <div key={i} className="retention-plan-card">
                      <div className="rec-top">
                        <span className="rec-action">{rec.action}</span>
                        <span className="rec-urgency">{rec.urgency}</span>
                      </div>
                      <p className="rec-desc">{rec.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="awaiting-placeholder-box">
                  Targeted retention actions will populate automatically when an employee profile is active.
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="output-actions-bar">
              <button 
                type="button" 
                className={`btn-primary-action ${!result || !employeeName.trim() ? 'btn-action-disabled' : ''}`}
                onClick={handleForwardToWhatIf}
                disabled={!result || !employeeName.trim()}
              >
                <span>Simulate In What-If Sandbox</span>
                <ArrowRight size={16} />
              </button>

              <button 
                type="button" 
                className={`btn-secondary-action ${!result || !employeeName.trim() ? 'btn-action-disabled' : ''}`}
                onClick={handleSaveToRoster}
                disabled={!result || !employeeName.trim()}
              >
                <UserPlus size={16} />
                <span>Save to Roster</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Workforce Database Browser Modal */}
      {isDbBrowserOpen && (
        <div className="modal-backdrop" onClick={() => setIsDbBrowserOpen(false)}>
          <div className="modal-card glass-panel db-modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="db-modal-title-wrap">
                <div className="db-modal-icon-badge">
                  <Database size={20} color="var(--primary)" />
                </div>
                <div>
                  <h3 className="modal-emp-name">Workforce Database Directory</h3>
                  <p className="modal-emp-sub">
                    {workforceDatabase.length} Linked Records • Select any employee to synchronize all details into the predictor
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsDbBrowserOpen(false)} aria-label="Close modal">
                <X size={20} />
              </button>
            </div>

            <div className="db-modal-body">
              {/* Search & Filter Bar */}
              <div className="db-modal-controls">
                <div className="db-modal-search-field">
                  <Search size={16} className="db-search-icon" />
                  <input
                    type="text"
                    className="form-input"
                    value={dbSearchQuery}
                    onChange={(e) => setDbSearchQuery(e.target.value)}
                    placeholder="Search by name (e.g. Liam Moore), ID (e.g. EMP-1002), or department..."
                    autoFocus
                  />
                  {dbSearchQuery && (
                    <button 
                      type="button" 
                      className="name-clear-action-btn"
                      onClick={() => setDbSearchQuery('')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="db-modal-dept-pills">
                  {['ALL', 'Sales', 'Research & Development', 'Engineering', 'Marketing', 'Human Resources', 'Finance'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`db-filter-pill ${dbDeptFilter === d ? 'db-filter-pill-active' : ''}`}
                      onClick={() => setDbDeptFilter(d)}
                    >
                      {d === 'Research & Development' ? 'R&D' : d === 'Human Resources' ? 'HR' : d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Employee Records Scrollable List */}
              <div className="db-modal-employee-list">
                {filteredDbEmployees.length === 0 ? (
                  <div className="empty-db-search">
                    <p>No workforce database records matched "{dbSearchQuery}"</p>
                  </div>
                ) : (
                  filteredDbEmployees.slice(0, 60).map((emp) => (
                    <div key={emp.employee_id} className="db-list-item">
                      <div className="db-list-item-left">
                        <div className="emp-avatar">{emp.name ? emp.name.charAt(0) : 'E'}</div>
                        <div>
                          <div className="db-item-name-row">
                            <strong className="db-emp-title">{emp.name}</strong>
                            <span className="db-badge-id">{emp.employee_id}</span>
                            <span className="dept-tag">{emp.department}</span>
                          </div>
                          <div className="db-item-meta-row">
                            <span>Age {emp.age}</span>
                            <span>•</span>
                            <span>${emp.salary?.toLocaleString()}/mo</span>
                            <span>•</span>
                            <span>{emp.experience} yrs exp</span>
                            <span>•</span>
                            <span>Satisfaction: {emp.composite_satisfaction || 3.0}/5</span>
                            <span>•</span>
                            <span>Overtime: {emp.overtime ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="db-sync-trigger-btn"
                        onClick={() => syncWithEmployee(emp)}
                      >
                        <Sparkles size={14} />
                        <span>Sync Details</span>
                      </button>
                    </div>
                  ))
                )}
                {filteredDbEmployees.length > 60 && (
                  <div className="db-overflow-note">
                    Showing top 60 of {filteredDbEmployees.length} matching employees. Type in the search box to find specific records.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="action-btn action-btn-secondary" 
                onClick={() => setIsDbBrowserOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
