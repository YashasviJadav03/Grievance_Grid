import React, { useState, useEffect } from 'react';
import { api } from '../api';
import TicketDrawer from './TicketDrawer';
import { Search, Filter, RefreshCw, ArrowRight, Inbox } from 'lucide-react';

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
    <div className="content-container">
      {/* Page Header */}
      <h1 className="page-title">Department Queue & SLA Triage</h1>
      <p className="page-description">
        Active complaints prioritized by statutory deadline compliance. Select any entry to review field notes, escalate, or document formal disposal.
      </p>

      {/* KPI Triage Metrics */}
      <div className="metric-row">
        <div className="metric-card">
          <div className="metric-header">Active Caseload</div>
          <div className="metric-number">{complaints.length - resolvedCount}</div>
          <div className="metric-sub">Complaints across all queues</div>
        </div>

        <div className="metric-card" style={{ borderTop: '2px solid var(--status-red-text)' }}>
          <div className="metric-header" style={{ color: 'var(--status-red-text)' }}>Breached / Escalated</div>
          <div className="metric-number" style={{ color: 'var(--status-red-text)' }}>{redCount}</div>
          <div className="metric-sub">Reassigned to supervisor queue</div>
        </div>

        <div className="metric-card" style={{ borderTop: '2px solid var(--status-amber-text)' }}>
          <div className="metric-header" style={{ color: 'var(--status-amber-text)' }}>At-Risk (&gt;75% SLA)</div>
          <div className="metric-number" style={{ color: 'var(--status-amber-text)' }}>{amberCount}</div>
          <div className="metric-sub">Approaching breach threshold</div>
        </div>

        <div className="metric-card" style={{ borderTop: '2px solid var(--status-green-text)' }}>
          <div className="metric-header" style={{ color: 'var(--status-green-text)' }}>Compliant Disposals</div>
          <div className="metric-number" style={{ color: 'var(--status-green-text)' }}>{resolvedCount}</div>
          <div className="metric-sub">Resolved within deadline</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="panel" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div className="col-2" style={{ gap: 'var(--space-4)' }}>
          {/* Department Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Filter size={15} color="var(--color-gray-400)" />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Search size={15} color="var(--color-gray-400)" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by tracking code, complainant, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Status Filters */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-gray-200)', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn ${slaFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setSlaFilter('ALL')}
          >
            All Records ({complaints.length})
          </button>
          <button
            type="button"
            className={`btn ${slaFilter === 'RED' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ backgroundColor: slaFilter === 'RED' ? 'var(--status-red-text)' : undefined, color: slaFilter !== 'RED' && redCount > 0 ? 'var(--status-red-text)' : undefined }}
            onClick={() => setSlaFilter('RED')}
          >
            Breached ({redCount})
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

      {/* High Density Table */}
      <div className="table-wrapper">
        <table className="table-dense">
          <thead>
            <tr>
              <th>Tracking ID</th>
              <th>Complainant & Subject</th>
              <th>Department / Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>SLA Balance</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredComplaints.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-placeholder">
                    <Inbox size={28} style={{ margin: '0 auto', opacity: 0.4 }} />
                    <p>No complaints match the current filter criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredComplaints.map((c) => (
                <tr
                  key={c.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveTicket(c)}
                >
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)' }}>
                    {c.tracking_id}
                  </td>

                  <td style={{ maxWidth: '340px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-gray-500)', marginTop: '2px' }}>
                      {c.citizen_name} • {c.citizen_contact}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--color-gray-900)' }}>
                      {c.department?.name || 'Unassigned'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-gray-500)' }}>
                      {c.category?.name || 'General'}
                    </div>
                  </td>

                  <td>
                    <span className={`badge badge-${c.priority === 'CRITICAL' ? 'red' : c.priority === 'HIGH' ? 'amber' : 'gray'}`}>
                      {c.priority}
                    </span>
                  </td>

                  <td>
                    <span className={`badge badge-${c.status === 'ESCALATED' ? 'red' : c.status === 'RESOLVED' ? 'green' : c.status === 'IN_PROGRESS' ? 'amber' : 'gray'}`}>
                      {c.status}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span className={`badge badge-${c.sla_status === 'GREEN' ? 'green' : c.sla_status === 'AMBER' ? 'amber' : 'red'}`}>
                        {c.sla_status}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: c.sla_hours_remaining < 0 ? 'var(--status-red-text)' : 'var(--color-gray-700)' }}>
                        {c.sla_hours_remaining !== null ? `${c.sla_hours_remaining}h` : '—'}
                      </span>
                    </div>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTicket(c);
                      }}
                    >
                      <span>Review</span>
                      <ArrowRight size={13} />
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
