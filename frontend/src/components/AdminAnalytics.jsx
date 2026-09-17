import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { BarChart2, TrendingUp, AlertCircle, CheckCircle, Clock, ShieldAlert, Building2, Activity, RefreshCw } from 'lucide-react';

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
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p>Aggregating departmental telemetry and SLA compliance statistics...</p>
      </div>
    );
  }

  const { kpis, department_performance, recent_audit_trail } = data;
  const overallComplianceRate = Math.max(0, 100 - kpis.breach_rate_pct);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Redressal Telemetry & SLA Compliance</h1>
          <p className="page-subtitle">
            System-wide operational oversight: monitor inter-departmental resolution velocity, identify bottleneck queues, and enforce accountability.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchAnalytics}
          disabled={isLoading}
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          Refresh Telemetry
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="kpi-card">
          <div className="kpi-label">Cumulative Intake</div>
          <div className="kpi-value">{kpis.total_complaints}</div>
          <div className="kpi-footnote">
            Active in Queue: <strong>{kpis.active_complaints}</strong> records
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--status-green-text)' }}>
          <div className="kpi-label">Statutory Compliance Ratio</div>
          <div className="kpi-value" style={{ color: overallComplianceRate >= 80 ? 'var(--status-green-text)' : 'var(--status-amber-text)' }}>
            {overallComplianceRate}%
          </div>
          <div className="kpi-footnote">
            Breach Rate: <strong>{kpis.breach_rate_pct}%</strong> ({kpis.total_breached} total breaches)
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Mean Turnaround Time (TAT)</div>
          <div className="kpi-value" style={{ color: 'var(--primary-700)' }}>
            {kpis.avg_resolution_hours}h
          </div>
          <div className="kpi-footnote">
            Disposed tickets: <strong>{kpis.resolved + kpis.closed}</strong>
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--status-red-text)' }}>
          <div className="kpi-label" style={{ color: 'var(--status-red-text)' }}>Active Supervisory Escalations</div>
          <div className="kpi-value" style={{ color: 'var(--status-red-text)' }}>
            {kpis.escalated}
          </div>
          <div className="kpi-footnote">
            Reassigned to supervisor queue
          </div>
        </div>
      </div>

      {/* Department SLA Compliance Matrix */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <span className="card-title">
            <Building2 size={16} color="var(--primary-600)" />
            Departmental SLA Compliance & Resolution Performance Matrix
          </span>
        </div>

        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Department Jurisdiction</th>
                <th>Total Intake</th>
                <th>Active Workload</th>
                <th>Resolved</th>
                <th>Breached SLA</th>
                <th>Compliance Index</th>
                <th>Mean TAT</th>
              </tr>
            </thead>
            <tbody>
              {department_performance.map((d) => {
                const compliance = Math.max(0, 100 - d.breach_rate_pct);
                return (
                  <tr key={d.id}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{d.name}</strong>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Code: {d.code}</div>
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
                        <div style={{ flex: 1, height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${compliance}%`,
                              height: '100%',
                              backgroundColor: compliance >= 80 ? 'var(--status-green-text)' : compliance >= 60 ? 'var(--status-amber-text)' : 'var(--status-red-text)',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.775rem', fontWeight: 700 }}>{compliance}%</span>
                      </div>
                    </td>
                    <td>
                      <strong>{d.avg_resolution_hours} Hours</strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supervisory Audit Ledger */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Activity size={16} color="var(--primary-600)" />
            System Supervisory Audit Ledger (Recent Lifecycle Mutations)
          </span>
        </div>

        <div className="timeline">
          {recent_audit_trail.map((log) => (
            <div key={log.id} className="timeline-item">
              <div className={`timeline-bullet ${log.to_status === 'ESCALATED' ? 'breached' : log.to_status === 'RESOLVED' ? 'completed' : 'current'}`}>
                {log.to_status === 'ESCALATED' ? '!' : '✓'}
              </div>
              <div className="timeline-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge badge-${log.to_status === 'ESCALATED' ? 'red' : log.to_status === 'RESOLVED' ? 'green' : 'blue'}`}>
                      {log.from_status ? `${log.from_status} ➔ ` : ''}{log.to_status}
                    </span>
                    <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>Ticket #{log.complaint_id}</strong>
                  </div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{log.reason}</p>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Action Registered By: <strong>{log.changed_by}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
