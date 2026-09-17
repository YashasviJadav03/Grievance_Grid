import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  BarChart3, TrendingUp, AlertTriangle, CheckCircle2, 
  Clock, ShieldAlert, Users, Layers, Activity, RefreshCw 
} from 'lucide-react';

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAnalyticsOverview();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p>Aggregating department telemetry and SLA compliance metrics...</p>
      </div>
    );
  }

  const { kpis, department_performance, recent_audit_trail } = data;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>Executive SLA Analytics & Accountability</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Data-led decision-making: Monitor cross-departmental bottlenecks, SLA compliance ratios, and resolution velocity.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchAnalytics} disabled={isLoading}>
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh Telemetry
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        {/* Total Grievances */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Ingested</span>
            <Layers size={18} color="var(--primary)" />
          </div>
          <strong style={{ fontSize: '2rem', display: 'block', marginBottom: '4px' }}>{kpis.total_complaints}</strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Active in Queue: <strong>{kpis.active_complaints}</strong>
          </span>
        </div>

        {/* Breach Rate % */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SLA Breach Ratio</span>
            <ShieldAlert size={18} color={kpis.breach_rate_pct > 20 ? '#EF4444' : '#10B981'} />
          </div>
          <strong style={{ fontSize: '2rem', display: 'block', marginBottom: '4px', color: kpis.breach_rate_pct > 20 ? '#F87171' : '#34D399' }}>
            {kpis.breach_rate_pct}%
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Breached: <strong>{kpis.total_breached}</strong> / {kpis.total_complaints}
          </span>
        </div>

        {/* Avg Resolution Turnaround */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Resolution Turnaround</span>
            <Clock size={18} color="#93C5FD" />
          </div>
          <strong style={{ fontSize: '2rem', display: 'block', marginBottom: '4px', color: '#60A5FA' }}>
            {kpis.avg_resolution_hours}h
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Resolved Tickets: <strong>{kpis.resolved + kpis.closed}</strong>
          </span>
        </div>

        {/* Active Escalations */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Escalations</span>
            <AlertTriangle size={18} color="#F59E0B" />
          </div>
          <strong style={{ fontSize: '2rem', display: 'block', marginBottom: '4px', color: '#FBBF24' }}>
            {kpis.escalated}
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Reassigned to Supervisor Queue
          </span>
        </div>
      </div>

      {/* Department Performance Table & Breakdown */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color="var(--primary)" />
          Civic Department SLA Performance & Resolution Compliance
        </h3>

        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Total Ingested</th>
                <th>Active Workload</th>
                <th>Resolved</th>
                <th>Breached SLA</th>
                <th>Compliance Ratio</th>
                <th>Avg Resolution</th>
              </tr>
            </thead>
            <tbody>
              {department_performance.map((d) => {
                const complianceRate = 100 - d.breach_rate_pct;
                return (
                  <tr key={d.id}>
                    <td>
                      <strong style={{ color: 'white' }}>{d.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Code: {d.code}</div>
                    </td>
                    <td><strong>{d.total}</strong></td>
                    <td><span className="badge badge-blue">{d.active} Active</span></td>
                    <td><span className="badge badge-green">{d.resolved} Resolved</span></td>
                    <td>
                      <span className={`badge badge-${d.breached > 0 ? 'red' : 'gray'}`}>
                        {d.breached} Breached
                      </span>
                    </td>
                    <td style={{ width: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '8px', background: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${complianceRate}%`,
                              height: '100%',
                              background: complianceRate >= 80 ? 'var(--sla-green)' : complianceRate >= 60 ? 'var(--sla-amber)' : 'var(--sla-red)',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{complianceRate}%</span>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#93C5FD' }}>{d.avg_resolution_hours} Hours</strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live System Audit Stream */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--primary)" />
          Live Governance Audit Stream (Last 10 Lifecycle Events)
        </h3>

        <div className="timeline">
          {recent_audit_trail.map((log) => (
            <div key={log.id} className="timeline-item">
              <div className={`timeline-dot ${log.to_status === 'ESCALATED' ? 'breached' : log.to_status === 'RESOLVED' ? 'completed' : 'active'}`}>
                {log.to_status === 'ESCALATED' ? '!' : '✓'}
              </div>
              <div className="timeline-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge badge-${log.to_status === 'ESCALATED' ? 'red' : log.to_status === 'RESOLVED' ? 'green' : 'blue'}`}>
                      {log.from_status ? `${log.from_status} ➔ ` : ''}{log.to_status}
                    </span>
                    <strong style={{ fontSize: '0.8rem', color: '#93C5FD' }}>Ticket #{log.complaint_id}</strong>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{log.reason}</p>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Triggered By: <strong>{log.changed_by}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
