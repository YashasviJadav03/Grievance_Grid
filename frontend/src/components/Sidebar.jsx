import React from 'react';
import { ListFilter, FilePlus, Search, BarChart2, Cpu, CheckCircle2 } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'officer', label: 'Officer Queue', icon: ListFilter },
    { id: 'citizen_intake', label: 'Lodge Grievance', icon: FilePlus },
    { id: 'citizen_track', label: 'Public Tracker', icon: Search },
    { id: 'analytics', label: 'Executive Analytics', icon: BarChart2 },
    { id: 'simulator', label: 'SLA Diagnostics', icon: Cpu },
  ];

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        {/* Literal 3x3 Grid Mark: Center square is active accent */}
        <div className="logo-grid" title="Grievance Grid Engine">
          <div className="logo-cell" />
          <div className="logo-cell" />
          <div className="logo-cell active" />
          <div className="logo-cell" />
          <div className="logo-cell" />
          <div className="logo-cell" />
          <div className="logo-cell" />
          <div className="logo-cell" />
          <div className="logo-cell" />
        </div>
        <span className="logo-text">Grievance Grid</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--status-green-text)', display: 'inline-block' }} />
          <span style={{ fontWeight: 600, color: 'var(--color-gray-700)' }}>SLA Daemon Active</span>
        </div>
        <div>v1.0.0 Enterprise Core</div>
      </div>
    </aside>
  );
}
