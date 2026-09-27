import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Globe, 
  Download, 
  ArrowRight,
  Server
} from 'lucide-react';
import { calculateAttritionRisk } from '../utils/predictor';
import ibmRealDataset from '../data/ibmRealWorkforceDataset.json';
import * as XLSX from 'xlsx';

export default function CsvUploadModal({ isOpen, onClose, onImportEmployees }) {
  const [activeSourceTab, setActiveSourceTab] = useState('ibm'); // 'ibm', 'file', 'api'
  const [parseStatus, setParseStatus] = useState(null); // 'parsed', 'error'
  const [previewRows, setPreviewRows] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState('');

  if (!isOpen) return null;

  const handleLoadIbmData = () => {
    setLoading(true);
    setErrorMsg('');
    setTimeout(() => {
      setPreviewRows(ibmRealDataset);
      setParseStatus('parsed');
      setLoading(false);
    }, 120);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    parseCsv(selectedFile);
  };

  const parseCsv = (fileToParse) => {
    setLoading(true);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rows || rows.length < 2) {
          throw new Error('Dataset must contain a header row and at least one data row.');
        }

        const headers = rows[0].map(h => String(h).trim().toLowerCase().replace(/['"]/g, ''));

        // Identify key columns
        const ageIdx = headers.findIndex(h => h.includes('age'));
        const salaryIdx = headers.findIndex(h => h.includes('salary') || h.includes('income') || h.includes('pay'));
        const expIdx = headers.findIndex(h => h.includes('exp') || h.includes('tenure') || h.includes('years'));
        const deptIdx = headers.findIndex(h => h.includes('dept') || h.includes('department'));
        const satIdx = headers.findIndex(h => h.includes('satisfaction') || h.includes('sat'));
        const otIdx = headers.findIndex(h => h.includes('overtime') || h.includes('ot'));
        const nameIdx = headers.findIndex(h => h.includes('name'));
        const idIdx = headers.findIndex(h => h.includes('id'));

        const parsed = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const age = ageIdx !== -1 && row[ageIdx] !== '' ? Number(row[ageIdx]) || 32 : 32;
          const salary = salaryIdx !== -1 && row[salaryIdx] !== '' ? Number(row[salaryIdx]) || 6500 : 6500;
          const exp = expIdx !== -1 && row[expIdx] !== '' ? Number(row[expIdx]) || 5 : 5;
          const dept = deptIdx !== -1 && row[deptIdx] ? String(row[deptIdx]) : 'Research & Development';
          const sat = satIdx !== -1 && row[satIdx] !== '' ? Number(row[satIdx]) || 3 : 3;
          const otStr = otIdx !== -1 ? String(row[otIdx]).toLowerCase() : 'no';
          const isOt = otStr === 'yes' || otStr === 'true' || otStr === '1';
          const empName = nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]) : `Imported Staff ${i}`;
          const empId = idIdx !== -1 && row[idIdx] ? String(row[idIdx]) : `EMP-${1000 + i}`;

          // Score using ML model
          const score = calculateAttritionRisk({
            age,
            salary,
            experience: exp,
            department: dept,
            job_satisfaction: sat,
            work_life_balance: sat,
            environment_satisfaction: sat,
            relationship_satisfaction: sat,
            overtime: isOt
          });

          parsed.push({
            employee_id: empId,
            name: empName,
            age,
            salary,
            experience: exp,
            department: dept,
            job_satisfaction: sat,
            work_life_balance: sat,
            environment_satisfaction: sat,
            relationship_satisfaction: sat,
            composite_satisfaction: Number(sat.toFixed(1)),
            overtime: isOt ? 1 : 0,
            attrition: score.isAttritionLikely ? 1 : 0,
            ground_truth_prob: score.rawProbability
          });
        }

        if (parsed.length === 0) {
          throw new Error('Could not parse any valid rows from the provided file.');
        }

        setPreviewRows(parsed);
        setParseStatus('parsed');
      } catch (err) {
        setErrorMsg(err.message || 'Failed to parse file.');
        setParseStatus('error');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(fileToParse);
  };

  const handleFetchRemoteApi = async () => {
    if (!remoteUrl.trim()) {
      setErrorMsg('Please enter a valid HTTP/HTTPS database or API URL.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(remoteUrl.trim());
      if (!res.ok) throw new Error(`HTTP Error ${res.status}: Failed to reach remote database.`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.employees || data.data || [];
      if (!list.length) throw new Error('Remote response must contain an array of records.');

      const parsed = list.map((item, idx) => {
        const age = Number(item.age) || 34;
        const salary = Number(item.salary) || 6200;
        const exp = Number(item.experience || item.years_at_company) || 5;
        const dept = item.department || 'Research & Development';
        const sat = Number(item.job_satisfaction || item.satisfaction) || 3;
        const isOt = item.overtime === 1 || item.overtime === true || String(item.overtime).toLowerCase() === 'yes';
        const score = calculateAttritionRisk({ age, salary, experience: exp, department: dept, job_satisfaction: sat, overtime: isOt });

        return {
          employee_id: item.employee_id || item.id || `API-${1000 + idx}`,
          name: item.name || `Employee ${1000 + idx}`,
          age,
          salary,
          experience: exp,
          department: dept,
          job_satisfaction: sat,
          work_life_balance: Number(item.work_life_balance) || 3,
          environment_satisfaction: Number(item.environment_satisfaction) || 3,
          relationship_satisfaction: Number(item.relationship_satisfaction) || 3,
          composite_satisfaction: Number(item.composite_satisfaction) || sat,
          overtime: isOt ? 1 : 0,
          attrition: score.isAttritionLikely ? 1 : 0,
          ground_truth_prob: score.rawProbability
        };
      });

      setPreviewRows(parsed);
      setParseStatus('parsed');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch from remote database site.');
      setParseStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (previewRows.length > 0) {
      onImportEmployees(previewRows);
      onClose();
    }
  };

  const downloadSampleTemplate = () => {
    const sampleRows = [
      { EmployeeID: 'EMP-901', Name: 'Maria Gomez', Age: 29, Salary: 5400, Experience: 4, Department: 'Sales', JobSatisfaction: 2, Overtime: 'Yes' },
      { EmployeeID: 'EMP-902', Name: 'Brian Lee', Age: 42, Salary: 12500, Experience: 14, Department: 'Research & Development', JobSatisfaction: 4, Overtime: 'No' },
      { EmployeeID: 'EMP-903', Name: 'Sophia Taylor', Age: 26, Salary: 3800, Experience: 2, Department: 'Engineering', JobSatisfaction: 2, Overtime: 'Yes' },
      { EmployeeID: 'EMP-904', Name: 'David Wilson', Age: 35, Salary: 7800, Experience: 8, Department: 'Human Resources', JobSatisfaction: 3, Overtime: 'No' }
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    ws['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 8 }, { wch: 12 }, { wch: 14 }, { wch: 25 }, { wch: 18 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Sample Template');
    XLSX.writeFile(wb, 'workforce_import_template.xlsx', { bookType: 'xlsx', type: 'binary' });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div className="brand-title-row">
            <Database size={22} className="icon-accent" />
            <div>
              <h3 className="modal-emp-name" style={{ fontSize: '1.15rem' }}>Import Real Workforce Datasets</h3>
              <p className="brand-subtitle" style={{ fontSize: '0.75rem' }}>Connect industry databases, live REST APIs, or custom CSV records</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Source Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', padding: '12px 24px 0', borderBottom: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveSourceTab('ibm')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              borderBottom: activeSourceTab === 'ibm' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
              color: activeSourceTab === 'ibm' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            <Server size={14} />
            <span>IBM HR Benchmark (1,470)</span>
          </button>

          <button
            onClick={() => setActiveSourceTab('file')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              borderBottom: activeSourceTab === 'file' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
              color: activeSourceTab === 'file' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            <Upload size={14} />
            <span>Upload CSV File</span>
          </button>

          <button
            onClick={() => setActiveSourceTab('api')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              borderBottom: activeSourceTab === 'api' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
              color: activeSourceTab === 'api' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            <Globe size={14} />
            <span>Remote Database API</span>
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px' }}>
          {/* TAB 1: IBM Real Dataset */}
          {activeSourceTab === 'ibm' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ 
                padding: '16px', 
                borderRadius: 'var(--radius-md)', 
                background: 'rgba(37, 99, 235, 0.05)', 
                border: '1px solid rgba(37, 99, 235, 0.20)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Server size={18} style={{ color: 'var(--primary)' }} />
                    <strong style={{ fontSize: '0.95rem' }}>IBM Watson HR Analytics Dataset</strong>
                  </div>
                  <span className="badge badge-low">1,470 Real Records</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45', marginBottom: '14px' }}>
                  The gold-standard industry employee turnover dataset. Contains verified workforce records across Sales, R&D, and HR with real satisfaction indexes, overtime flags, tenure, and ground-truth attrition labels.
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button 
                    className="action-btn action-btn-primary" 
                    onClick={handleLoadIbmData}
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    <span>Load 1,470 Real Records</span>
                    <ArrowRight size={14} />
                  </button>
                  <a 
                    href="/ibm_real_workforce_1470.csv" 
                    download="ibm_real_workforce_1470.csv"
                    className="action-btn action-btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.85rem', textDecoration: 'none' }}
                  >
                    <Download size={14} />
                    <span>Download CSV Dataset</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: File Upload */}
          {activeSourceTab === 'file' && (
            <div>
              <p className="section-subheading" style={{ marginBottom: '14px', fontSize: '0.82rem' }}>
                Upload any Excel spreadsheet (.xlsx, .xls) or CSV containing Age, Salary, Experience, Department, Job Satisfaction, and Overtime.
              </p>

              <div className="upload-dropzone">
                <FileText size={36} className="dropzone-icon" />
                <label className="upload-file-btn">
                  <span>Choose Excel / CSV File</span>
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    style={{ display: 'none' }} 
                    onChange={handleFileChange} 
                  />
                </label>
                <span className="dropzone-hint">Supported formats: .xlsx (MS Excel), .xls, .csv</span>
              </div>

              <div className="sample-template-row" style={{ marginTop: '10px' }}>
                <button className="link-button" onClick={downloadSampleTemplate}>
                  📥 Download Sample Excel Template (.xlsx)
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Remote API / Database URL */}
          {activeSourceTab === 'api' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p className="section-subheading" style={{ fontSize: '0.82rem' }}>
                Fetch live workforce records from any remote REST API endpoint, Cloud Database (PostgreSQL/Supabase/Firebase REST), or mock API server.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="url" 
                  className="form-input" 
                  placeholder="https://api.example.com/workforce/employees" 
                  value={remoteUrl} 
                  onChange={(e) => setRemoteUrl(e.target.value)}
                  style={{ flex: 1, padding: '9px 12px', fontSize: '0.85rem' }}
                />
                <button 
                  className="action-btn action-btn-primary" 
                  onClick={handleFetchRemoteApi}
                  disabled={loading}
                >
                  <Globe size={14} />
                  <span>Fetch & Score</span>
                </button>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Tip: Endpoint should return a JSON array with objects matching standard employee fields.
              </span>
            </div>
          )}

          {loading && <p className="loading-text" style={{ marginTop: '14px' }}>Scoring records with AI engine...</p>}

          {errorMsg && (
            <div className="error-banner" style={{ marginTop: '14px' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {parseStatus === 'parsed' && (
            <div className="upload-preview-box" style={{ marginTop: '16px' }}>
              <div className="preview-header">
                <CheckCircle2 size={18} className="text-success" />
                <strong>Successfully Ready: {previewRows.length} Real Employee Records!</strong>
              </div>
              <p className="preview-note">
                Sample: {previewRows[0]?.name} (${previewRows[0]?.salary?.toLocaleString()}/mo, {previewRows[0]?.department}, Risk: {(previewRows[0]?.ground_truth_prob || 0).toFixed(2)} prob)
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="action-btn action-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="action-btn action-btn-primary" 
            disabled={previewRows.length === 0}
            onClick={handleConfirmImport}
          >
            <span>Import & Merge {previewRows.length > 0 ? `(${previewRows.length})` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
