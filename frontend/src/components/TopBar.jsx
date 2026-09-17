import React from 'react';
import { RefreshCw } from 'lucide-react';

const TAB_TITLES = {
  officer: 'Departmental Queue & SLA Triage',
  citizen_intake: 'Public Grievance Registration',
  citizen_track: 'Grievance Status Verification',
  analytics: 'Executive Telemetry & Redressal Analytics',
  simulator: 'SLA Engine Diagnostics Sandbox',
};

export default function TopBar({ activeTab, onTriggerScan, isScanning }) {
  return (
    <header className="top-bar">
      <div className="top-bar-title">
        {TAB_TITLES[activeTab] || 'Grievance Grid'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onTriggerScan}
          disabled={isScanning}
          title="Run immediate SLA evaluation across all active tickets"
        >
          <RefreshCw size={13} className={isScanning ? 'animate-spin' : ''} />
          <span>{isScanning ? 'Evaluating...' : 'Run SLA Evaluation'}</span>
        </button>
      </div>
    </header>
  );
}
