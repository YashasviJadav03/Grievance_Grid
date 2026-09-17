import React, { useState, useEffect } from 'react';
import { api } from '../api';
import TicketDrawer from './TicketDrawer';
import { Search, Filter, ArrowRight, Inbox, RefreshCw } from 'lucide-react';

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
  const activeCaseload = complaints.length - resolvedCount;

  const handleTicketUpdated = (updated) => {
    setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setActiveTicket(updated);
  };

  return (
    <div className="content-container">
      {/* Header */}
      <div className="view-header">
        <div className="view-header-main">
          <h1 className="page-title">Operational Caseload</h1>
          <p className="page-description">
            Prioritized civic grievances and real-time SLA deadline monitoring.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchComplaints}
          disabled={isLoading}
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="metric-row">
        <div className="metric-card">
          <div className="metric-header">Active Caseload</div>
          <div className="metric-number">{activeCaseload}</div>
          <div className="metric-sub">Pending resolution across queues</div>
        </div>

        <div className="metric-card" style={{ borderTop: '3px solid var(--status-red-text)' }}>
          <div className="metric-header" style={{ color: 'var(--status-red-text)' }}>Breached / Escalated</div>
          <div className="metric-number" style={{ color: 'var(--status-red-text)' }}>{redCount}</div>
          <div className="metric-sub">Reassigned to supervisors</div>
        </div>

        <div className="metric-card" style={{ borderTop: '3px solid var(--status-amber-text)' }}>
          <div className="metric-header" style={{ color: 'var(--status-amber-text)' }}>At Risk (&gt;75% SLA)</div>
          <div className="metric-number" style={{ color: 'var(--status-amber-text)' }}>{amberCount}</div>
          <div className="metric-sub">Approaching deadline threshold</div>
        </div>

        <div className="metric-card" style={{ borderTop: '3px solid var(--status-green-text)' }}>
          <div className="metric-header" style={{ color: 'var(--status-green-text)' }}>Resolved</div>
          <div className="metric-number" style={{ color: 'var(--status-green-text)' }}>{resolvedCount}</div>
          <div className="metric-sub">Successfully disposed records</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="panel" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Department Select */}
          <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
            <select
              className="form-select"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div style={{ flex: '2 1 300px', minWidth: '240px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search tracking ID, complainant, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Chip Pills */}
        <div className="filter-chip-group" style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-gray-100)' }}>
          <button
            type="button"
            className={`filter-chip ${slaFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setSlaFilter('ALL')}
          >
            All Records ({complaints.length})
          </button>
          <button
            type="button"
            className={`filter-chip chip-red ${slaFilter === 'RED' ? 'active' : ''}`}
            onClick={() => setSlaFilter('RED')}
          >
            Breached ({redCount})
          </button>
          <button
            type="button"
            className={`filter-chip chip-amber ${slaFilter === 'AMBER' ? 'active' : ''}`}
            onClick={() => setSlaFilter('AMBER')}
          >
            At Risk ({amberCount})
          </button>
          <button
            type="button"
            className={`filter-chip chip-green ${slaFilter === 'GREEN' ? 'active' : ''}`}
            onClick={() => setSlaFilter('GREEN')}
          >
            On Schedule ({greenCount})
          </button>
          <button
            type="button"
            className={`filter-chip ${slaFilter === 'RESOLVED' ? 'active' : ''}`}
            onClick={() => setSlaFilter('RESOLVED')}
          >
            Resolved ({resolvedCount})
          </button>
        </div>
      </div>

      {/* Spacious Table */}
      <div className="table-wrapper">
        <table className="table-dense">
          <thead>
            <tr>
              <th>Tracking ID</th>
              <th>Subject & Citizen</th>
              <th>Department</th>
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
                    <Inbox size={32} style={{ margin: '0 auto var(--space-2)', opacity: 0.35 }} />
                    <p>No grievances match the current filter criteria.</p>
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
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
                    {c.tracking_id}
                  </td>

                  <td style={{ maxWidth: '380px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-gray-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-gray-500)', marginTop: '2px' }}>
                      {c.citizen_name} • {c.citizen_contact}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--color-gray-800)' }}>
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
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span className={`badge badge-${c.sla_status === 'GREEN' ? 'green' : c.sla_status === 'AMBER' ? 'amber' : c.sla_status === 'RESOLVED' ? 'green' : 'red'}`}>
                        {c.sla_status}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: c.sla_hours_remaining !== null && c.sla_hours_remaining < 0 ? 'var(--status-red-text)' : 'var(--color-gray-600)' }}>
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
