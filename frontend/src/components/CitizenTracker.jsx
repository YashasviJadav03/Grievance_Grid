import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from './Toast';
import { Search, AlertCircle, Clock, CheckCircle2, Copy, Inbox, Calendar, Shield, User } from 'lucide-react';

export default function CitizenTracker({ initialTrackingId }) {
  const toast = useToast();
  const [trackingInput, setTrackingInput] = useState(initialTrackingId || '');
  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [recentRecords, setRecentRecords] = useState([]);

  useEffect(() => {
    api.getComplaints({ limit: 6 }).then((data) => {
      setRecentRecords(data);
      if (initialTrackingId) {
        handleSearch(initialTrackingId);
      } else if (data.length > 0 && !ticket) {
        handleSearch(data[0].tracking_id);
      }
    }).catch(console.error);
  }, [initialTrackingId]);

  const handleSearch = async (code) => {
    const target = (code || trackingInput).trim();
    if (!target) return;
    setErrorMsg('');
    setIsLoading(true);
    try {
      const data = await api.getComplaint(target);
      setTicket(data);
      setTrackingInput(data.tracking_id);
    } catch (err) {
      setErrorMsg(err.message || 'Grievance record not found.');
      setTicket(null);
      toast.error('Grievance not found. Please check your tracking ID.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    toast.success('Tracking ID copied!');
  };

  const STEPS = ['SUBMITTED', 'ROUTED', 'IN_PROGRESS', 'RESOLVED'];
  const getStepIndex = (status) => {
    if (status === 'CLOSED') return 3;
    if (status === 'RESOLVED') return 3;
    if (status === 'ESCALATED' || status === 'REASSIGNED' || status === 'IN_PROGRESS') return 2;
    if (status === 'ROUTED') return 1;
    return 0;
  };

  return (
    <div className="content-container">
      {/* Header */}
      <div className="view-header">
        <div className="view-header-main">
          <h1 className="page-title">Track Grievance</h1>
          <p className="page-description">
            Live status verification, resolution milestones, and official audit ledger.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="panel" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Enter Tracking ID (e.g. GG-20260917-XXXXXX)"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSearch()}
              disabled={isLoading}
            >
              <Search size={14} />
              <span>{isLoading ? 'Searching...' : 'Track'}</span>
            </button>
          </div>

          {recentRecords.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--color-gray-500)' }}>Recent Grievances:</span>
              {recentRecords.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="filter-chip"
                  style={{ fontFamily: 'monospace', fontSize: '11px', padding: '2px 8px' }}
                  onClick={() => handleSearch(r.tracking_id)}
                >
                  {r.tracking_id}
                </button>
              ))}
            </div>
          )}

          {errorMsg && (
            <div style={{ marginTop: 'var(--space-3)', color: 'var(--status-red-text)', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Details & Timeline */}
      {ticket ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Hero Ticket Header Card */}
          <div className="panel" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <span className="badge badge-blue">{ticket.department?.name || 'Assigned Dept'}</span>
                  <span className="badge badge-gray">{ticket.category?.name || 'Category'}</span>
                  <span className={`badge badge-${ticket.status === 'ESCALATED' ? 'red' : ticket.status === 'RESOLVED' ? 'green' : 'amber'}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-gray-900)' }}>
                  {ticket.title}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '12.5px', color: 'var(--color-gray-500)' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)' }}>
                    {ticket.tracking_id}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '2px 6px', height: 'auto', fontSize: '11px' }}
                    onClick={() => handleCopyId(ticket.tracking_id)}
                  >
                    <Copy size={11} />
                    <span>Copy</span>
                  </button>
                  <span>•</span>
                  <span>Filed by {ticket.citizen_name}</span>
                </div>
              </div>

              {/* SLA Highlight Badge */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>
                  SLA Status
                </div>
                <div style={{ marginTop: '2px' }}>
                  <span className={`badge badge-${ticket.sla_status === 'GREEN' ? 'green' : ticket.sla_status === 'AMBER' ? 'amber' : ticket.sla_status === 'RESOLVED' ? 'green' : 'red'}`} style={{ fontSize: '13px', padding: '4px 10px' }}>
                    {ticket.sla_status === 'RESOLVED' ? 'Resolved' : ticket.sla_status === 'RED' ? 'Breached' : ticket.sla_status === 'AMBER' ? 'At Risk' : 'On Track'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginTop: '4px' }}>
                  {ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? (
                    ticket.sla_hours_remaining !== null && ticket.sla_hours_remaining >= 0 ? (
                      <span style={{ color: 'var(--status-green-text)', fontWeight: 600 }}>
                        Resolved on schedule ({ticket.sla_hours_remaining}h spare)
                      </span>
                    ) : (
                      <span style={{ color: 'var(--status-red-text)', fontWeight: 600 }}>
                        Resolved after breach
                      </span>
                    )
                  ) : (
                    ticket.sla_hours_remaining !== null ? (
                      ticket.sla_hours_remaining >= 0 ? (
                        <span><strong>{ticket.sla_hours_remaining}h</strong> remaining</span>
                      ) : (
                        <span style={{ color: 'var(--status-red-text)', fontWeight: 600 }}>
                          Overdue by {Math.abs(ticket.sla_hours_remaining)}h
                        </span>
                      )
                    ) : '—'
                  )}
                </div>
              </div>
            </div>

            {/* Visual Milestone Progression Stepper */}
            <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-gray-100)' }}>
              <div className="timeline-stepper">
                {STEPS.map((step, idx) => {
                  const currentIdx = getStepIndex(ticket.status);
                  const isDone = currentIdx >= idx;
                  const isCurrent = currentIdx === idx;
                  const isEscalated = ticket.status === 'ESCALATED' && idx === 2;

                  return (
                    <div key={step} className="timeline-step">
                      <div className={`step-node ${isEscalated ? 'escalated' : isDone ? 'completed' : ''}`}>
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <div className={`step-label ${isCurrent ? 'active' : ''}`}>
                        {isEscalated ? 'Escalated' : step.replace('_', ' ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2-Column Details & Activity Log */}
          <div className="col-2">
            {/* Left: Case Description & Metadata */}
            <div className="panel" style={{ marginBottom: 0 }}>
              <div className="panel-header">
                <span className="panel-title">
                  <Shield size={16} color="var(--color-primary)" />
                  Grievance Dossier
                </span>
              </div>

              <div style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--color-gray-800)', marginBottom: 'var(--space-4)' }}>
                {ticket.description}
              </div>

              {/* Resolution Notes (if available) */}
              {ticket.resolution_notes && (
                <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--status-green-bg)', border: '1px solid var(--status-green-border)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--status-green-text)', textTransform: 'uppercase', marginBottom: '3px' }}>
                    Official Resolution Summary
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-gray-900)' }}>
                    {ticket.resolution_notes}
                  </div>
                </div>
              )}

              {/* Key Timestamps */}
              <div style={{ borderTop: '1px solid var(--color-gray-100)', paddingTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-gray-600)' }}>
                  <span>Registered At:</span>
                  <strong>{new Date(ticket.created_at).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-gray-600)' }}>
                  <span>SLA Target Deadline:</span>
                  <strong style={{ color: ticket.is_breached ? 'var(--status-red-text)' : 'var(--color-gray-900)' }}>
                    {ticket.sla_deadline ? new Date(ticket.sla_deadline).toLocaleString() : 'N/A'}
                  </strong>
                </div>
                {ticket.resolved_at && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-gray-600)' }}>
                    <span>Disposed At:</span>
                    <strong style={{ color: 'var(--status-green-text)' }}>
                      {new Date(ticket.resolved_at).toLocaleString()}
                    </strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-gray-600)' }}>
                  <span>Assigned Queue:</span>
                  <strong>{ticket.assigned_to || 'Operational Dispatch'}</strong>
                </div>
              </div>
            </div>

            {/* Right: Chronological Activity Log */}
            <div className="panel" style={{ marginBottom: 0 }}>
              <div className="panel-header">
                <span className="panel-title">
                  <Clock size={16} color="var(--color-primary)" />
                  Audit Trail ({ticket.status_logs?.length || 0})
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {ticket.status_logs?.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: 'var(--color-gray-50)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-gray-200)',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                      <span className={`badge badge-${log.to_status === 'ESCALATED' ? 'red' : log.to_status === 'RESOLVED' ? 'green' : 'gray'}`}>
                        {log.to_status.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-gray-400)' }}>
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ color: 'var(--color-gray-700)', marginTop: '4px' }}>
                      {log.reason}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-gray-400)', marginTop: '3px' }}>
                      Actor: <strong>{log.changed_by}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="panel" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
          <Inbox size={36} style={{ margin: '0 auto var(--space-2)', opacity: 0.35 }} />
          <p style={{ color: 'var(--color-gray-500)', fontSize: '13px' }}>
            Enter a grievance tracking identifier above to inspect the case dossier and audit history.
          </p>
        </div>
      )}
    </div>
  );
}
