import React, { useState } from 'react';
import { X, Clock, CheckCircle, AlertTriangle, ShieldAlert, ArrowRight, UserCheck, Phone, Mail, Building2 } from 'lucide-react';
import { api } from '../api';

export default function TicketDrawer({ ticket, onClose, onUpdated }) {
  if (!ticket) return null;

  const [isUpdating, setIsUpdating] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [officerDesignation, setOfficerDesignation] = useState('DESK_OFFICER_IN_CHARGE');

  const handleTransition = async (targetStatus, reason = null) => {
    setIsUpdating(true);
    try {
      const updated = await api.updateComplaintStatus(ticket.id, {
        target_status: targetStatus,
        actor: officerDesignation,
        reason: reason || `State advanced to ${targetStatus} by ${officerDesignation}.`,
        resolution_notes: targetStatus === 'RESOLVED' ? resolutionNotes : undefined,
      });
      onUpdated(updated);
      setShowResolveModal(false);
    } catch (err) {
      alert(`Status transition could not be executed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-top">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className={`badge badge-${ticket.sla_status === 'GREEN' ? 'green' : ticket.sla_status === 'AMBER' ? 'amber' : 'red'}`}>
                SLA: {ticket.sla_status}
              </span>
              <span className="badge badge-gray">{ticket.priority}</span>
              <span className="badge badge-blue">{ticket.status}</span>
            </div>
            <h2 style={{ fontSize: '1.15rem', fontFamily: 'monospace', letterSpacing: '0.02em' }}>
              {ticket.tracking_id}
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ padding: '6px 8px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-content">
          {/* Incident Summary */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Grievance Subject
            </div>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
              {ticket.title}
            </h3>
            <div style={{ padding: '14px', background: 'var(--bg-card-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              {ticket.description}
            </div>
          </div>

          {/* Department & Complainant Cards */}
          <div className="grid-2">
            <div style={{ padding: '12px', background: 'var(--bg-card-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                Complainant Record
              </div>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{ticket.citizen_name}</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{ticket.citizen_contact}</div>
              {ticket.citizen_email && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{ticket.citizen_email}</div>
              )}
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-card-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                Department Routing
              </div>
              <strong style={{ fontSize: '0.9rem', color: 'var(--primary-700)' }}>{ticket.department?.name}</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {ticket.category?.name}
              </div>
            </div>
          </div>

          {/* SLA Timecard */}
          <div style={{ padding: '14px 16px', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>SLA Deadline:</span>
              <strong style={{ color: ticket.is_breached ? 'var(--status-red-text)' : 'var(--status-green-text)' }}>
                {ticket.sla_deadline ? new Date(ticket.sla_deadline).toLocaleString() : 'N/A'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Hours Remaining:</span>
              <strong style={{ color: ticket.sla_hours_remaining < 0 ? 'var(--status-red-text)' : 'var(--primary-700)' }}>
                {ticket.sla_hours_remaining !== null ? `${ticket.sla_hours_remaining} hrs` : 'N/A'}
              </strong>
            </div>
          </div>

          {/* Officer Action Workflow Controls */}
          <div style={{ padding: '16px', background: 'var(--bg-card-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={16} color="var(--primary-600)" />
              Operational State Machine Controls
            </div>

            {ticket.status === 'ROUTED' && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={isUpdating}
                onClick={() => handleTransition('IN_PROGRESS', 'Desk Officer formally acknowledged grievance and assigned dispatch crew.')}
              >
                Acknowledge & Initiate Work (Set IN PROGRESS)
              </button>
            )}

            {(ticket.status === 'IN_PROGRESS' || ticket.status === 'ESCALATED' || ticket.status === 'REASSIGNED') && !showResolveModal && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1, backgroundColor: 'var(--status-green-text)' }}
                  disabled={isUpdating}
                  onClick={() => setShowResolveModal(true)}
                >
                  <CheckCircle size={15} />
                  Record Official Resolution
                </button>
                {ticket.status !== 'ESCALATED' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ borderColor: 'var(--status-red-border)', color: 'var(--status-red-text)' }}
                    disabled={isUpdating}
                    onClick={() => handleTransition('ESCALATED', 'Manual supervisory escalation triggered by handling officer.')}
                  >
                    Escalate
                  </button>
                )}
              </div>
            )}

            {showResolveModal && (
              <div style={{ marginTop: '10px' }}>
                <label className="form-label">
                  Official Redressal Summary <span className="required">*</span>
                </label>
                <textarea
                  rows={3}
                  className="form-textarea"
                  placeholder="Document corrective actions completed on ground (e.g., pipeline repaired, inspection verified)..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ backgroundColor: 'var(--status-green-text)' }}
                    disabled={isUpdating || !resolutionNotes.trim()}
                    onClick={() => handleTransition('RESOLVED', resolutionNotes)}
                  >
                    Confirm Disposal & Mark RESOLVED
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowResolveModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {ticket.status === 'RESOLVED' && (
              <div style={{ textAlign: 'center' }}>
                <span className="badge badge-green" style={{ marginBottom: '8px' }}>
                  GRIEVANCE DISPOSED & RESOLVED
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', marginTop: '8px' }}
                  disabled={isUpdating}
                  onClick={() => handleTransition('CLOSED', 'Complainant satisfaction confirmed. Record archived.')}
                >
                  Formally Archive / Close
                </button>
              </div>
            )}

            {ticket.status === 'CLOSED' && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                This record has been archived. No further operational transitions permitted.
              </div>
            )}
          </div>

          {/* Chronological Audit Ledger */}
          <div>
            <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
              Immutable Audit Ledger ({ticket.status_logs?.length || 0} Entries)
            </div>
            <div className="timeline">
              {ticket.status_logs?.map((log) => (
                <div key={log.id} className="timeline-item">
                  <div className={`timeline-bullet ${log.to_status === 'ESCALATED' ? 'breached' : log.to_status === 'RESOLVED' ? 'completed' : 'current'}`}>
                    {log.to_status === 'ESCALATED' ? '!' : '✓'}
                  </div>
                  <div className="timeline-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span className={`badge badge-${log.to_status === 'ESCALATED' ? 'red' : log.to_status === 'RESOLVED' ? 'green' : 'blue'}`}>
                        {log.to_status}
                      </span>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{log.reason}</p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                      Actor: <strong>{log.changed_by}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="drawer-bottom">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
