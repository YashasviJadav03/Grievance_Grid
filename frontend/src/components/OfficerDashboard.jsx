import React, { useState, useEffect } from 'react';
import { api } from '../api';
import TicketDrawer from './TicketDrawer';
import { Filter, Search, RefreshCw, AlertCircle, Clock, CheckCircle, ShieldAlert, ArrowUpRight } from 'lucide-react';

export default function OfficerDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [slaFilter, setSlaFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const data = await api.getComplaints({
        department_id: selectedDept || undefined,
        search: searchQuery || undefined,
      });
      setComplaints(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    api.getDepartments().then(setDepartments).catch(console.error);
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [selectedDept, searchQuery]);

  const filteredComplaints = complaints.filter((c) => {
    if (slaFilter === 'ALL') return true;
    if (slaFilter === 'RED') return c.sla_status === 'RED' || c.status === 'ESCALATED';
    if (slaFilter === 'AMBER') return c.sla_status === 'AMBER';
    if (slaFilter === 'GREEN') return c.sla_status === 'GREEN';
    if (slaFilter === 'RESOLVED') return c.status === 'RESOLVED' || c.status === 'CLOSED';
    return true;
  });

  const redCount = complaints.filter((c) => c.sla_status === 'RED' || c.status === 'ESCALATED').length;
  const amberCount = complaints.filter((c) => c.sla_status === 'AMBER').length;
  const greenCount = complaints.filter((c) => c.sla_status === 'GREEN').length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;

  const handleTicketUpdated = (updated) => {
    setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setActiveTicket(updated);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Officer Operations & SLA Triage Queue</h1>
          <p className="page-subtitle">
            Departmental grievance triage sorted by statutory deadline urgency. Review workload, execute transitions, and record formal redressals.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchComplaints}
          disabled={isLoading}
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          Refresh Registry
        </button>
      </div>

      {/* KPI Triage Statistics */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="kpi-card">
          <div className="kpi-label">Active Queue Caseload</div>
          <div className="kpi-value">{complaints.length - resolvedCount}</div>
          <div className="kpi-footnote">Total assigned across departments</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--status-red-text)' }}>
          <div className="kpi-label" style={{ color: 'var(--status-red-text)' }}>Breached / Escalated</div>
          <div className="kpi-value" style={{ color: 'var(--status-red-text)' }}>{redCount}</div>
          <div className="kpi-footnote">Requires urgent supervisory intervention</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--status-amber-text)' }}>
          <div className="kpi-label" style={{ color: 'var(--status-amber-text)' }}>At Risk (&gt;75% SLA)</div>
          <div className="kpi-value" style={{ color: 'var(--status-amber-text)' }}>{amberCount}</div>
          <div className="kpi-footnote">Turnaround approaching breach threshold</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--status-green-text)' }}>
          <div className="kpi-label" style={{ color: 'var(--status-green-text)' }}>Compliant Disposals</div>
          <div className="kpi-value" style={{ color: 'var(--status-green-text)' }}>{resolvedCount}</div>
          <div className="kpi-footnote">Resolved within statutory deadlines</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div className="grid-2">
          {/* Department Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} color="var(--text-muted)" />
            <select
              className="form-select"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="">All Departmental Jurisdictions</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              className="form-input"
              placeholder="Filter by tracking number, complainant, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Segmented Triage Filter Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
          <button
            type="button"
            className={`btn ${slaFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setSlaFilter('ALL')}
          >
            All Tickets ({complaints.length})
          </button>
          <button
            type="button"
            className={`btn ${slaFilter === 'RED' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ backgroundColor: slaFilter === 'RED' ? 'var(--status-red-text)' : undefined, color: slaFilter !== 'RED' && redCount > 0 ? 'var(--status-red-text)' : undefined }}
            onClick={() => setSlaFilter('RED')}
          >
            Breached / Escalated ({redCount})
          </button>
          <button
            type="button"
            className={`btn ${slaFilter === 'AMBER' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ backgroundColor: slaFilter === 'AMBER' ? 'var(--status-amber-text)' : undefined, color: slaFilter !== 'AMBER' && amberCount > 0 ? 'var(--status-amber-text)' : undefined }}
            onClick={() => setSlaFilter('AMBER')}
          >
            At Risk ({amberCount})
          </button>
          <button
            type="button"
            className={`btn ${slaFilter === 'GREEN' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ backgroundColor: slaFilter === 'GREEN' ? 'var(--status-green-text)' : undefined }}
            onClick={() => setSlaFilter('GREEN')}
          >
            On Schedule ({greenCount})
          </button>
          <button
            type="button"
            className={`btn ${slaFilter === 'RESOLVED' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setSlaFilter('RESOLVED')}
          >
            Resolved ({resolvedCount})
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tracking ID</th>
              <th>Complainant & Subject</th>
              <th>Department / Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>SLA Balance</th>
              <th>Operation</th>
            </tr>
          </thead>
          <tbody>
            {filteredComplaints.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No grievances found matching the specified parameters.
                </td>
              </tr>
            ) : (
              filteredComplaints.map((c) => (
                <tr
                  key={c.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveTicket(c)}
                >
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-700)', fontSize: '0.85rem' }}>
                      {c.tracking_id}
                    </span>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </div>
                  </td>

                  <td style={{ maxWidth: '320px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {c.citizen_name} • {c.citizen_contact}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {c.department?.name || 'Unassigned'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {c.category?.name || 'General'}
                    </div>
                  </td>

                  <td>
                    <span className={`badge badge-${c.priority === 'CRITICAL' ? 'red' : c.priority === 'HIGH' ? 'amber' : 'gray'}`}>
                      {c.priority}
                    </span>
                  </td>

                  <td>
                    <span className={`badge badge-${c.status === 'ESCALATED' ? 'red' : c.status === 'RESOLVED' ? 'green' : c.status === 'IN_PROGRESS' ? 'amber' : 'blue'}`}>
                      {c.status}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`badge badge-${c.sla_status === 'GREEN' ? 'green' : c.sla_status === 'AMBER' ? 'amber' : 'red'}`}>
                        {c.sla_status}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: c.sla_hours_remaining < 0 ? 'var(--status-red-text)' : 'var(--text-primary)' }}>
                        {c.sla_hours_remaining !== null ? `${c.sla_hours_remaining}h` : '—'}
                      </span>
                    </div>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTicket(c);
                      }}
                    >
                      Inspect
                      <ArrowUpRight size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Ticket Drawer */}
      {activeTicket && (
        <TicketDrawer
          ticket={activeTicket}
          onClose={() => setActiveTicket(null)}
          onUpdated={handleTicketUpdated}
        />
      )}
    </div>
  );
}
