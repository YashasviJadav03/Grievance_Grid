import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Building2, ShieldAlert, RefreshCw, TrendingUp, CheckCircle, Clock } from 'lucide-react';

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
      <div className="content-container">
        <div className="panel" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto var(--space-2)' }} />
          <p style={{ color: 'var(--color-gray-500)', fontSize: '13px' }}>
            Aggregating departmental telemetry and SLA compliance metrics...
          </p>
        </div>
      </div>
    );
  }

  const { kpis, department_performance, recent_audit_trail } = data;
  const complianceRate = Math.max(0, 100 - kpis.breach_rate_pct);

  return (
    <div className="content-container">
      {/* Header */}
      <div className="view-header">
        <div className="view-header-main">
          <h1 className="page-title">Operational Analytics</h1>
          <p className="page-description">
            System-wide resolution metrics, departmental compliance index, and supervisory audit trail.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchAnalytics}
          disabled={isLoading}
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Row */}
      <div className="metric-row">
        <div className="metric-card">
          <div className="metric-header">Total Grievances</div>
          <div className="metric-number">{kpis.total_complaints}</div>
          <div className="metric-sub">Active in queues: <strong>{kpis.active_complaints}</strong></div>
        </div>

        <div className="metric-card" style={{ borderTop: '3px solid var(--status-green-text)' }}>
          <div className="metric-header" style={{ color: 'var(--status-green-text)' }}>SLA Compliance</div>
          <div className="metric-number" style={{ color: complianceRate >= 80 ? 'var(--status-green-text)' : 'var(--status-amber-text)' }}>
            {complianceRate}%
          </div>
          <div className="metric-sub">Breach rate: <strong>{kpis.breach_rate_pct}%</strong></div>
        </div>

        <div className="metric-card" style={{ borderTop: '3px solid var(--color-primary)' }}>
          <div className="metric-header">Mean Turnaround (TAT)</div>
          <div className="metric-number" style={{ color: 'var(--color-primary)' }}>
            {kpis.avg_resolution_hours}h
          </div>
          <div className="metric-sub">Resolved grievances: <strong>{kpis.resolved + kpis.closed}</strong></div>
        </div>

        <div className="metric-card" style={{ borderTop: '3px solid var(--status-red-text)' }}>
          <div className="metric-header" style={{ color: 'var(--status-red-text)' }}>Supervisory Escalations</div>
          <div className="metric-number" style={{ color: 'var(--status-red-text)' }}>{kpis.escalated}</div>
          <div className="metric-sub">Currently escalated to supervisors</div>
        </div>
      </div>

      {/* Department Compliance Matrix */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--space-6)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-gray-200)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={16} color="var(--color-primary)" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-gray-900)' }}>
            Departmental Compliance Breakdown
          </span>
        </div>

        <table className="table-dense">
          <thead>
            <tr>
              <th>Department</th>
              <th>Total Inflow</th>
              <th>Active</th>
              <th>Resolved</th>
              <th>Breached</th>
              <th>Compliance Index</th>
              <th>Avg Turnaround</th>
            </tr>
          </thead>
          <tbody>
            {department_performance.map((d) => {
              const comp = Math.max(0, 100 - d.breach_rate_pct);
              return (
                <tr key={d.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>{d.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-gray-400)' }}>{d.code}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{d.total}</td>
                  <td><span className="badge badge-gray">{d.active} Active</span></td>
                  <td><span className="badge badge-green">{d.resolved} Done</span></td>
                  <td>
                    <span className={`badge badge-${d.breached > 0 ? 'red' : 'gray'}`}>
                      {d.breached} Breached
                    </span>
                  </td>
                  <td style={{ width: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '7px', backgroundColor: 'var(--color-gray-100)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${comp}%`,
                            height: '100%',
                            backgroundColor: comp >= 80 ? 'var(--status-green-text)' : comp >= 60 ? 'var(--status-amber-text)' : 'var(--status-red-text)',
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '36px' }}>{comp}%</span>
                    </div>
                  </td>
                  <td>
                    <strong>{d.avg_resolution_hours}h</strong>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Supervisory Activity Stream */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-gray-200)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={16} color="var(--color-primary)" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-gray-900)' }}>
            Recent Activity & Audit Stream
          </span>
        </div>

        <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {recent_audit_trail.map((log) => (
            <div
              key={log.id}
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--color-gray-50)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12.5px',
                border: '1px solid var(--color-gray-200)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge badge-${log.to_status === 'ESCALATED' ? 'red' : log.to_status === 'RESOLVED' ? 'green' : 'gray'}`}>
                    {log.from_status ? `${log.from_status} → ` : ''}{log.to_status}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-gray-900)' }}>
                    Ticket #{log.complaint_id}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-gray-400)' }}>
                  {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              <div style={{ color: 'var(--color-gray-700)' }}>{log.reason}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-gray-400)', marginTop: '2px' }}>
                By: <strong>{log.changed_by}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
