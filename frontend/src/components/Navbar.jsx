import React from 'react';
import { ShieldCheck, User, Users, BarChart3, FastForward, Activity } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, lastScanTime, onTriggerScan, isScanning }) {
  return (
    <header className="navbar">
      <div className="nav-inner">
        {/* Brand */}
        <div className="nav-brand" onClick={() => setActiveTab('citizen')}>
          <div className="brand-icon">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="brand-title">GRIEVANCE GRID</div>
            <span className="brand-tag">SLA Routing & Accountability Engine</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'citizen' ? 'active' : ''}`}
            onClick={() => setActiveTab('citizen')}
          >
            <User size={16} />
            Citizen Portal
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'officer' ? 'active' : ''}`}
            onClick={() => setActiveTab('officer')}
          >
            <Users size={16} />
            Officer Dashboard
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={16} />
            Admin Analytics
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'simulator' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulator')}
          >
            <FastForward size={16} />
            SLA Simulator
          </button>
        </nav>

        {/* Engine Status & Manual Scan Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="nav-status">
            <div className="pulse-dot" />
            <span>SLA Engine Active (30s)</span>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onTriggerScan}
            disabled={isScanning}
            title="Trigger immediate background SLA sweep"
          >
            <Activity size={14} className={isScanning ? 'animate-spin' : ''} />
            {isScanning ? 'Sweeping...' : 'Run Sweep'}
          </button>
        </div>
      </div>
    </header>
  );
}
