import React from 'react';
import { RefreshCw, Activity } from 'lucide-react';

const TAB_TITLES = {
  officer: 'Officer Caseload & Triage',
  citizen_intake: 'Register Grievance',
  citizen_track: 'Track Grievance',
  analytics: 'Operational Analytics',
  simulator: 'SLA Simulation Lab',
};

export default function TopBar({ activeTab, onTriggerScan, isScanning }) {
  return (
    <header className="top-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h2 className="top-bar-title">
          {TAB_TITLES[activeTab] || 'Grievance Grid'}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-gray-500)' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--status-green-text)', display: 'inline-block' }} />
          <span style={{ fontWeight: 500 }}>Live Daemon</span>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onTriggerScan}
          disabled={isScanning}
          title="Run immediate SLA evaluation across all active tickets"
        >
          <RefreshCw size={13} className={isScanning ? 'animate-spin' : ''} />
          <span>{isScanning ? 'Evaluating...' : 'Run SLA Scan'}</span>
        </button>
      </div>
    </header>
  );
}
