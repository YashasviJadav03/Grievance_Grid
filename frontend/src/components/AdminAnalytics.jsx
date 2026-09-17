import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { BarChart2, Building2, Clock, ShieldAlert, Layers, RefreshCw } from 'lucide-react';

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
        <div className="panel" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
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
      {/* Page Header */}
      <h1 className="page-title">Executive Redressal Telemetry</h1>
      <p className="page-description">
        System-wide operational oversight: monitor inter-departmental resolution velocity, identify bottleneck queues, and enforce statutory accountability.
      </p>

      {/* KPI Cards Row */}
      <div className="metric-row">
        <div className="metric-card">
          <div className="metric-header">Cumulative Inflow</div>
          <div className="metric-number">{kpis.total_complaints}</div>
          <div className="metric-sub">Active in queue: <strong>{kpis.active_complaints}</strong></div>
        </div>

        <div className="metric-card" style={{ borderTop: '2px solid var(--status-green-text)' }}>
          <div className="metric-header">Statutory Compliance</div>
          <div className="metric-number" style={{ color: complianceRate >= 80 ? 'var(--status-green-text)' : 'var(--status-amber-text)' }}>
            {complianceRate}%
          </div>
          <div className="metric-sub">Breach ratio: <strong>{kpis.breach_rate_pct}%</strong></div>
        </div>

        <div className="metric-card">
          <div className="metric-header">Mean Turnaround (TAT)</div>
          <div className="metric-number" style={{ color: 'var(--color-primary)' }}>
            {kpis.avg_resolution_hours}h
          </div>
          <div className="metric-sub">Disposed records: <strong>{kpis.resolved + kpis.closed}</strong></div>
        </div>

        <div className="metric-card" style={{ borderTop: '2px solid var(--status-red-text)' }}>
          <div className="metric-header" style={{ color: 'var(--status-red-text)' }}>Supervisory Escalations</div>
          <div className="metric-number" style={{ color: 'var(--status-red-text)' }}>{kpis.escalated}</div>
          <div className="metric-sub">Reassigned to supervisor queue</div>
        </div>
      </div>

      {/* Department Compliance Matrix Table */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-gray-200)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Building2 size={16} color="var(--color-primary)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-gray-900)' }}>
            Departmental SLA Performance & Turnaround Compliance
          </span>
        </div>

        <table className="table-dense">
          <thead>
            <tr>
              <th>Department Jurisdiction</th>
              <th>Total Inflow</th>
              <th>Active Workload</th>
              <th>Resolved</th>
              <th>Breached</th>
              <th>Compliance Index</th>
              <th>Mean TAT</th>
            </tr>
          </thead>
          <tbody>
            {department_performance.map((d) => {
              const comp = Math.max(0, 100 - d.breach_rate_pct);
              return (
                <tr key={d.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>{d.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-gray-500)' }}>Code: {d.code}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{d.total}</td>
                  <td><span className="badge badge-gray">{d.active} Active</span></td>
                  <td><span className="badge badge-green">{d.resolved} Resolved</span></td>
                  <td>
                    <span className={`badge badge-${d.breached > 0 ? 'red' : 'gray'}`}>
                      {d.breached} Breached
                    </span>
                  </td>
                  <td style={{ width: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--color-gray-200)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${comp}%`,
                            height: '100%',
                            backgroundColor: comp >= 80 ? 'var(--status-green-text)' : comp >= 60 ? 'var(--status-amber-text)' : 'var(--status-red-text)',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{comp}%</span>
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

      {/* Supervisory Audit Ledger */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-gray-200)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <ShieldAlert size={16} color="var(--color-primary)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-gray-900)' }}>
            Supervisory Audit Stream (Recent Mutations)
          </span>
        </div>

        <div style={{ padding: 'var(--space-4) var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {recent_audit_trail.map((log) => (
            <div
              key={log.id}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: 'var(--color-gray-50)',
                borderRadius: 'var(--radius)',
                fontSize: '12px',
                border: '1px solid var(--color-gray-200)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span className={`badge badge-${log.to_status === 'ESCALATED' ? 'red' : log.to_status === 'RESOLVED' ? 'green' : 'gray'}`}>
                    {log.from_status ? `${log.from_status} → ` : ''}{log.to_status}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-gray-900)' }}>
                    Ticket #{log.complaint_id}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-gray-500)' }}>
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
              <div style={{ color: 'var(--color-gray-700)', marginTop: '2px' }}>{log.reason}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-gray-500)', marginTop: '2px' }}>
                Actor: <strong>{log.changed_by}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
