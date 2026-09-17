import React from 'react';
import { Landmark, FileText, ClipboardList, BarChart2, Cpu, RefreshCw } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onTriggerScan, isScanning }) {
  return (
    <header className="navbar">
      <div className="nav-inner">
        {/* Brand */}
        <div className="nav-brand" onClick={() => setActiveTab('citizen')}>
          <div className="brand-crest">
            <Landmark size={20} />
          </div>
          <div className="brand-details">
            <span className="brand-name">Grievance Grid</span>
            <span className="brand-sub">Autonomous Redressal & SLA Accountability System</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-menu">
          <button
            className={`nav-link ${activeTab === 'citizen' ? 'active' : ''}`}
            onClick={() => setActiveTab('citizen')}
          >
            <FileText size={15} />
            Citizen Portal
          </button>
          <button
            className={`nav-link ${activeTab === 'officer' ? 'active' : ''}`}
            onClick={() => setActiveTab('officer')}
          >
            <ClipboardList size={15} />
            Officer Operations
          </button>
          <button
            className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart2 size={15} />
            Executive Analytics
          </button>
          <button
            className={`nav-link ${activeTab === 'simulator' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulator')}
          >
            <Cpu size={15} />
            SLA Diagnostics
          </button>
        </nav>

        {/* Operational Status & Trigger */}
        <div className="nav-meta">
          <div className="system-status-indicator">
            <div className="status-dot-green" />
            <span>SLA Daemon Active</span>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onTriggerScan}
            disabled={isScanning}
            title="Execute on-demand SLA sweep across active complaints"
          >
            <RefreshCw size={13} className={isScanning ? 'animate-spin' : ''} />
            {isScanning ? 'Sweeping...' : 'Run Scan'}
          </button>
        </div>
      </div>
    </header>
  );
}
