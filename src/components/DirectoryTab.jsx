import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  Eye, 
  Sliders, 
  Database, 
  Upload, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Sparkles
} from 'lucide-react';

export default function DirectoryTab({ 
  employees, 
  onSelectEmployee, 
  onSendToWhatIf, 
  onSendToPredictor,
  onOpenUpload, 
  onExportCsv,
  onNavigateToPredictor
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [overtimeFilter, setOvertimeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('risk'); // 'risk', 'salary', 'experience', 'age'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Filter & Sort
  const processedEmployees = useMemo(() => {
    return employees
      .filter((emp) => {
        // Search
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = emp.name && emp.name.toLowerCase().includes(q);
          const matchId = emp.employee_id && emp.employee_id.toLowerCase().includes(q);
          const matchDept = emp.department && emp.department.toLowerCase().includes(q);
          if (!matchName && !matchId && !matchDept) return false;
        }

        // Dept
        if (deptFilter !== 'ALL' && emp.department !== deptFilter) return false;

        // Overtime
        const isOt = emp.overtime === 1 || emp.overtime === true || String(emp.overtime).toLowerCase() === 'yes';
        if (overtimeFilter === 'YES' && !isOt) return false;
        if (overtimeFilter === 'NO' && isOt) return false;

        // Risk
        const prob = emp.ground_truth_prob !== undefined ? emp.ground_truth_prob : (emp.attrition ? 0.75 : 0.2);
        if (riskFilter === 'HIGH' && prob < 0.60) return false;
        if (riskFilter === 'MEDIUM' && (prob < 0.30 || prob >= 0.60)) return false;
        if (riskFilter === 'LOW' && prob >= 0.30) return false;

        return true;
      })
      .sort((a, b) => {
        let valA, valB;
        if (sortBy === 'risk') {
          valA = a.ground_truth_prob !== undefined ? a.ground_truth_prob : (a.attrition || 0);
          valB = b.ground_truth_prob !== undefined ? b.ground_truth_prob : (b.attrition || 0);
        } else if (sortBy === 'salary') {
          valA = a.salary;
          valB = b.salary;
        } else if (sortBy === 'experience') {
          valA = a.experience;
          valB = b.experience;
        } else if (sortBy === 'age') {
          valA = a.age;
          valB = b.age;
        }

        return sortOrder === 'desc' ? valB - valA : valA - valB;
      });
  }, [employees, searchTerm, deptFilter, riskFilter, overtimeFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(processedEmployees.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedEmployees.slice(start, start + pageSize);
  }, [processedEmployees, currentPage]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="directory-container animate-fade-in">
      {/* Header with Search and Actions */}
      <div className="directory-header-row">
        <div>
          <div className="badge badge-neutral" style={{ marginBottom: '6px' }}>
            Workforce Directory
          </div>
          <h2 className="section-heading">Employee Roster & Risk Scoring</h2>
          <p className="section-subheading">
            Explore {employees.length.toLocaleString()} indexed staff members with real-time attrition probabilities, risk tier assignments, and drilldowns.
          </p>
        </div>

        <div className="directory-actions-top">
          <button className="action-btn action-btn-primary" onClick={onNavigateToPredictor}>
            <Plus size={15} />
            <span>Score New Employee</span>
          </button>
          <button className="action-btn action-btn-secondary" onClick={onOpenUpload}>
            <Database size={15} />
            <span>Real Data / CSV</span>
          </button>
          <button 
            className="action-btn action-btn-secondary" 
            onClick={onExportCsv}
            title="Export full workforce roster to Microsoft Excel (.xlsx)"
          >
            <Upload size={15} />
            <span>Export Roster</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="directory-filters-bar glass-panel">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by employee name, ID, or department..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="dir-filter-selects">
          <select 
            value={deptFilter} 
            onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
            className="dashboard-select"
          >
            <option value="ALL">All Departments</option>
            <option value="Research & Development">R&D</option>
            <option value="Sales">Sales</option>
            <option value="Engineering">Engineering</option>
            <option value="Human Resources">HR</option>
            <option value="Marketing">Marketing</option>
            <option value="Finance">Finance</option>
          </select>

          <select 
            value={riskFilter} 
            onChange={(e) => { setRiskFilter(e.target.value); setCurrentPage(1); }}
            className="dashboard-select"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="HIGH">High Risk (≥0.60)</option>
            <option value="MEDIUM">Medium (0.30 - 0.59)</option>
            <option value="LOW">Low Risk (&lt;0.30)</option>
          </select>

          <select 
            value={overtimeFilter} 
            onChange={(e) => { setOvertimeFilter(e.target.value); setCurrentPage(1); }}
            className="dashboard-select"
          >
            <option value="ALL">All Schedules</option>
            <option value="YES">Overtime Active</option>
            <option value="NO">Standard Hours</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="directory-table-card glass-panel">
        <div className="table-responsive">
          <table className="roster-table">
            <thead>
              <tr>
                <th>Employee Name & ID</th>
                <th>Department</th>
                <th onClick={() => toggleSort('age')} className="sortable-th">
                  <span>Age / Exp</span>
                  <ArrowUpDown size={12} />
                </th>
                <th onClick={() => toggleSort('salary')} className="sortable-th">
                  <span>Monthly Salary</span>
                  <ArrowUpDown size={12} />
                </th>
                <th>Satisfaction</th>
                <th>Overtime</th>
                <th onClick={() => toggleSort('risk')} className="sortable-th">
                  <span>Attrition Risk</span>
                  <ArrowUpDown size={12} />
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-table-cell">
                    No employees matched the current filters.
                  </td>
                </tr>
              ) : (
                paginatedList.map((emp) => {
                  const prob = emp.ground_truth_prob !== undefined ? emp.ground_truth_prob : (emp.attrition ? 0.78 : 0.15);
                  const probScore = prob.toFixed(2);
                  const isHigh = prob >= 0.60;
                  const isMed = prob >= 0.30 && prob < 0.60;
                  const isOt = emp.overtime === 1 || emp.overtime === true || String(emp.overtime).toLowerCase() === 'yes';

                  const badgeClass = isHigh ? 'badge-high' : isMed ? 'badge-med' : 'badge-low';
                  const riskTierText = isHigh ? 'High Risk' : isMed ? 'Medium' : 'Low Risk';

                  return (
                    <tr key={emp.employee_id} className="roster-row">
                      <td>
                        <div className="emp-cell">
                          <div className="emp-avatar">{emp.name ? emp.name.charAt(0) : 'E'}</div>
                          <div>
                            <strong className="emp-name-text">{emp.name || 'Employee'}</strong>
                            <span className="emp-id-text">{emp.employee_id}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="dept-tag">{emp.department}</span>
                      </td>
                      <td>
                        <span className="emp-dim-text">{emp.age} yrs • {emp.experience} yrs exp</span>
                      </td>
                      <td>
                        <strong>${emp.salary.toLocaleString()}</strong>
                      </td>
                      <td>
                        <span className="sat-pill">
                          {emp.composite_satisfaction || ((emp.job_satisfaction + emp.work_life_balance + emp.environment_satisfaction + emp.relationship_satisfaction) / 4).toFixed(1)} / 5.0
                        </span>
                      </td>
                      <td>
                        {isOt ? (
                          <span className="badge badge-high" style={{ fontSize: '0.72rem' }}>
                            <Clock size={11} /> Overtime
                          </span>
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                            Standard
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="risk-metric-cell">
                          <div className="risk-bar-track">
                            <div 
                              className="risk-bar-fill" 
                              style={{ 
                                width: `${Math.min(100, Math.max(5, prob * 100))}%`,
                                backgroundColor: isHigh ? 'var(--risk-high)' : isMed ? 'var(--risk-med)' : 'var(--risk-low)'
                              }}
                            />
                          </div>
                          <span className={`risk-score-badge ${badgeClass}`}>
                            {probScore} ({riskTierText})
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button 
                            className="icon-action-btn"
                            title="Inspect 360 Risk Profile"
                            onClick={() => onSelectEmployee(emp)}
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            className="icon-action-btn"
                            title="Sync Details in Attrition Predictor"
                            onClick={() => onSendToPredictor && onSendToPredictor(emp)}
                          >
                            <Sparkles size={15} />
                          </button>
                          <button 
                            className="icon-action-btn"
                            title="Simulate Retention Levers in What-If"
                            onClick={() => onSendToWhatIf(emp)}
                          >
                            <Sliders size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="pagination-bar">
          <span className="pagination-info">
            Showing {processedEmployees.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(currentPage * pageSize, processedEmployees.length)} of {processedEmployees.length} employees
          </span>

          <div className="pagination-controls">
            <button 
              className="page-btn" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <span className="page-indicator">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              className="page-btn" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
