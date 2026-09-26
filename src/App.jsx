import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardTab from './components/DashboardTab';
import PredictorTab from './components/PredictorTab';
import WhatIfSimulator from './components/WhatIfSimulator';
import DirectoryTab from './components/DirectoryTab';
import ModelInsightsTab from './components/ModelInsightsTab';
import EmployeeDetailModal from './components/EmployeeDetailModal';
import CsvUploadModal from './components/CsvUploadModal';
import benchmarkEmployees from './data/benchmarkEmployees.js';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('royal-white');
  const [glassMode, setGlassMode] = useState(true);
  const [employees, setEmployees] = useState(benchmarkEmployees);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [whatIfTarget, setWhatIfTarget] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Apply theme & glass state to html root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-glass', glassMode ? 'true' : 'false');
  }, [glassMode]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'royal-white' ? 'midnight' : 'royal-white'));
  };

  const toggleGlassMode = () => {
    setGlassMode(prev => !prev);
  };

  // Add individual employee to live roster
  const handleAddToRoster = (newEmp) => {
    setEmployees(prev => [newEmp, ...prev]);
    setActiveTab('directory');
  };

  // Direct an employee to What-If simulator
  const handleSendToWhatIf = (emp) => {
    setWhatIfTarget(emp);
    setActiveTab('whatif');
  };

  // Import batch CSV
  const handleImportEmployees = (importedList) => {
    setEmployees(prev => [...importedList, ...prev]);
    setActiveTab('dashboard');
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'EmployeeID',
      'Name',
      'Age',
      'Salary',
      'Experience',
      'Department',
      'JobSatisfaction',
      'WorkLifeBalance',
      'EnvironmentSatisfaction',
      'RelationshipSatisfaction',
      'CompositeSatisfaction',
      'Overtime',
      'AttritionPrediction',
      'AttritionProbability',
      'RiskTier'
    ];

    const rows = employees.map(e => {
      const prob = e.ground_truth_prob !== undefined ? e.ground_truth_prob : (e.attrition ? 0.8 : 0.2);
      const isLeave = prob >= 0.50;
      const riskTier = prob >= 0.60 ? 'HIGH' : prob >= 0.30 ? 'MEDIUM' : 'LOW';
      const isOt = e.overtime === 1 || e.overtime === true ? 'Yes' : 'No';

      return [
        `"${e.employee_id || ''}"`,
        `"${e.name || ''}"`,
        e.age || '',
        e.salary || '',
        e.experience || '',
        `"${e.department || ''}"`,
        e.job_satisfaction || 3,
        e.work_life_balance || 3,
        e.environment_satisfaction || 3,
        e.relationship_satisfaction || 3,
        e.composite_satisfaction || 3.0,
        `"${isOt}"`,
        `"${isLeave ? 'YES' : 'NO'}"`,
        `"${prob.toFixed(2)}"`,
        `"${riskTier}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `workforce_attrition_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // High risk count calculation for navbar
  const highRiskCount = employees.filter(e => (e.ground_truth_prob || (e.attrition ? 0.8 : 0.1)) >= 0.60).length;

  return (
    <div className={`app-layout ${glassMode ? 'glass-active' : ''}`}>
      {/* Ambient Dynamic Frosted Glass Background Layer */}
      <div className="ambient-glass-canvas" aria-hidden="true">
        <div className="glass-orb orb-indigo"></div>
        <div className="glass-orb orb-cyan"></div>
        <div className="glass-orb orb-violet"></div>
        <div className="glass-orb orb-teal"></div>
      </div>

      {/* Global Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        glassMode={glassMode}
        toggleGlassMode={toggleGlassMode}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onExportCsv={handleExportCsv}
        totalEmployees={employees.length}
        highRiskCount={highRiskCount}
      />

      {/* Main Content Area */}
      <main className="main-content-viewport">
        {activeTab === 'dashboard' && (
          <DashboardTab
            employees={employees}
            onSelectEmployee={(emp) => setSelectedEmployee(emp)}
            onNavigateToPredictor={() => setActiveTab('predictor')}
          />
        )}

        {activeTab === 'predictor' && (
          <PredictorTab
            onAddToRoster={handleAddToRoster}
            onSendToWhatIf={handleSendToWhatIf}
          />
        )}

        {activeTab === 'whatif' && (
          <WhatIfSimulator
            initialEmployee={whatIfTarget}
          />
        )}

        {activeTab === 'directory' && (
          <DirectoryTab
            employees={employees}
            onSelectEmployee={(emp) => setSelectedEmployee(emp)}
            onSendToWhatIf={handleSendToWhatIf}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onExportCsv={handleExportCsv}
            onNavigateToPredictor={() => setActiveTab('predictor')}
          />
        )}

        {activeTab === 'model' && (
          <ModelInsightsTab />
        )}
      </main>

      {/* 360-Degree Employee Detail Modal */}
      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onSendToWhatIf={handleSendToWhatIf}
        />
      )}

      {/* Batch CSV Upload Modal */}
      <CsvUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImportEmployees={handleImportEmployees}
      />
    </div>
  );
}
