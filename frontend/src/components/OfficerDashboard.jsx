import React, { useState, useEffect } from 'react';
import { api } from '../api';
import TicketDrawer from './TicketDrawer';
import { 
  Filter, Search, RefreshCw, AlertCircle, Clock, 
  CheckCircle2, AlertTriangle, ShieldAlert, ArrowUpRight 
} from 'lucide-react';

export default function OfficerDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [slaFilter, setSlaFilter] = useState('ALL'); // ALL, RED, AMBER, GREEN, RESOLVED
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

  // Filter by SLA status client-side
  const filteredComplaints = complaints.filter((c) => {
    if (slaFilter === 'ALL') return true;
    if (slaFilter === 'RED') return c.sla_status === 'RED' || c.status === 'ESCALATED';
    if (slaFilter === 'AMBER') return c.sla_status === 'AMBER';
    if (slaFilter === 'GREEN') return c.sla_status === 'GREEN';
    if (slaFilter === 'RESOLVED') return c.status === 'RESOLVED' || c.status === 'CLOSED';
    return true;
  });

  // Risk count metrics
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>Officer Operations Queue</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Triaged citizen complaints sorted by SLA urgency. Review queue risk, transition states, and record official resolutions.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchComplaints} disabled={isLoading}>
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh Queue
        </button>
      </div>

      {/* SLA Triage Pills */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          className={`btn ${slaFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setSlaFilter('ALL')}
        >
          All Grievances ({complaints.length})
        </button>
        <button
          className={`btn ${slaFilter === 'RED' ? 'btn-danger' : 'btn-secondary'} btn-sm`}
          onClick={() => setSlaFilter('RED')}
          style={{ borderColor: redCount > 0 ? '#EF4444' : undefined }}
        >
          🔴 Breached / Escalated ({redCount})
        </button>
        <button
          className={`btn ${slaFilter === 'AMBER' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setSlaFilter('AMBER')}
          style={{ background: slaFilter === 'AMBER' ? '#D97706' : undefined, borderColor: amberCount > 0 ? '#F59E0B' : undefined }}
        >
          🟡 At Risk &gt;75% ({amberCount})
        </button>
        <button
          className={`btn ${slaFilter === 'GREEN' ? 'btn-success' : 'btn-secondary'} btn-sm`}
          onClick={() => setSlaFilter('GREEN')}
        >
          🟢 On Schedule ({greenCount})
        </button>
        <button
          className={`btn ${slaFilter === 'RESOLVED' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setSlaFilter('RESOLVED')}
        >
          ✓ Resolved ({resolvedCount})
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div className="grid-2">
          {/* Department Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              className="select-field"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="">All Civic Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              className="input-field"
              placeholder="Search tracking ID, citizen, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tracking ID</th>
              <th>Citizen / Grievance</th>
              <th>Department / Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>SLA Remaining</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredComplaints.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No grievances found matching the current filter.
                </td>
              </tr>
            ) : (
              filteredComplaints.map((c) => (
                <tr
                  key={c.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveTicket(c)}
                >
                  {/* Tracking Code */}
                  <td>
                    <strong style={{ color: '#60A5FA', fontSize: '0.85rem' }}>{c.tracking_id}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </div>
                  </td>

                  {/* Title & Citizen */}
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {c.citizen_name} • {c.citizen_contact}
                    </div>
                  </td>

                  {/* Department & Category */}
                  <td>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#93C5FD' }}>
                      {c.department?.name || 'Unassigned'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {c.category?.name || 'General'}
                    </div>
                  </td>

                  {/* Priority */}
                  <td>
                    <span className={`badge badge-${c.priority === 'CRITICAL' ? 'red' : c.priority === 'HIGH' ? 'amber' : 'blue'}`}>
                      {c.priority}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    <span className={`badge badge-${c.status === 'ESCALATED' ? 'red' : c.status === 'RESOLVED' ? 'green' : c.status === 'IN_PROGRESS' ? 'amber' : 'blue'}`}>
                      {c.status}
                    </span>
                  </td>

                  {/* SLA Countdown */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`badge badge-${c.sla_status === 'GREEN' ? 'green' : c.sla_status === 'AMBER' ? 'amber' : 'red'}`}>
                        {c.sla_status}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: c.sla_hours_remaining < 0 ? '#F87171' : 'var(--text-primary)' }}>
                        {c.sla_hours_remaining !== null ? `${c.sla_hours_remaining}h` : '—'}
                      </span>
                    </div>
                  </td>

                  {/* Action Link */}
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTicket(c);
                      }}
                    >
                      Inspect
                      <ArrowUpRight size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Ticket Action Drawer */}
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
