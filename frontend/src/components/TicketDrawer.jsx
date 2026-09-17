import React, { useState } from 'react';
import { X, Clock, CheckCircle2, AlertTriangle, ArrowRight, ShieldAlert, UserCheck } from 'lucide-react';
import { api } from '../api';

export default function TicketDrawer({ ticket, onClose, onUpdated }) {
  if (!ticket) return null;

  const [isUpdating, setIsUpdating] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolveBox, setShowResolveBox] = useState(false);
  const [actorName, setActorName] = useState('OFFICER_IN_CHARGE');

  const handleTransition = async (targetStatus, reason = null) => {
    setIsUpdating(true);
    try {
      const updated = await api.updateComplaintStatus(ticket.id, {
        target_status: targetStatus,
        actor: actorName,
        reason: reason || `Status transitioned to ${targetStatus} by ${actorName}`,
        resolution_notes: targetStatus === 'RESOLVED' ? resolutionNotes : undefined,
      });
      onUpdated(updated);
      setShowResolveBox(false);
    } catch (err) {
      alert(`Transition failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className={`badge badge-${ticket.sla_status === 'GREEN' ? 'green' : ticket.sla_status === 'AMBER' ? 'amber' : 'red'}`}>
                SLA: {ticket.sla_status}
              </span>
              <span className="badge badge-gray">{ticket.priority}</span>
              <span className="badge badge-blue">{ticket.status}</span>
            </div>
            <h3 style={{ fontSize: '1.2rem' }}>{ticket.tracking_id}</h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '6px 8px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          {/* Title & Description */}
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '6px' }}>{ticket.title}</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              {ticket.description}
            </p>
          </div>

          {/* Citizen & Dept Info */}
          <div className="grid-2">
            <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Citizen Details</span>
              <strong>{ticket.citizen_name}</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ticket.citizen_contact}</div>
              {ticket.citizen_email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ticket.citizen_email}</div>}
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Assigned Department</span>
              <strong style={{ color: '#93C5FD' }}>{ticket.department?.name}</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Category: {ticket.category?.name}</div>
            </div>
          </div>

          {/* SLA Tracking Bar */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SLA Deadline:</span>
              <strong style={{ color: ticket.is_breached ? '#F87171' : '#34D399', fontSize: '0.85rem' }}>
                {ticket.sla_deadline ? new Date(ticket.sla_deadline).toLocaleString() : 'N/A'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Remaining Window:</span>
              <strong style={{ fontSize: '1rem', color: ticket.sla_hours_remaining < 0 ? '#F87171' : '#60A5FA' }}>
                {ticket.sla_hours_remaining !== null ? `${ticket.sla_hours_remaining} Hours` : 'N/A'}
              </strong>
            </div>
          </div>

          {/* Action Workflow Section */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-bright)' }}>
            <h4 style={{ fontSize: '0.875rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={16} color="var(--primary)" />
              Officer State Machine Actions
            </h4>

            {ticket.status === 'ROUTED' && (
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={isUpdating}
                onClick={() => handleTransition('IN_PROGRESS', 'Officer acknowledged grievance and dispatched field team.')}
              >
                Start Investigation / Work (Set IN PROGRESS)
              </button>
            )}

            {(ticket.status === 'IN_PROGRESS' || ticket.status === 'ESCALATED' || ticket.status === 'REASSIGNED') && !showResolveBox && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-success"
                  style={{ flex: 1 }}
                  disabled={isUpdating}
                  onClick={() => setShowResolveBox(true)}
                >
                  <CheckCircle2 size={16} />
                  Resolve Grievance
                </button>
                {ticket.status !== 'ESCALATED' && (
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={isUpdating}
                    onClick={() => handleTransition('ESCALATED', 'Manually escalated by officer due to field complications.')}
                  >
                    <ShieldAlert size={14} />
                    Escalate
                  </button>
                )}
              </div>
            )}

            {showResolveBox && (
              <div style={{ marginTop: '10px' }}>
                <label className="input-label">Mandatory Official Resolution Note *</label>
                <textarea
                  rows={3}
                  className="textarea-field"
                  placeholder="Explain actions taken to fix the issue (e.g. repaired pipeline, replaced bulb)..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button
                    className="btn btn-success"
                    disabled={isUpdating || !resolutionNotes.trim()}
                    onClick={() => handleTransition('RESOLVED', resolutionNotes)}
                  >
                    Confirm & Mark RESOLVED
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowResolveBox(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {ticket.status === 'RESOLVED' && (
              <div style={{ textAlign: 'center' }}>
                <span className="badge badge-green" style={{ marginBottom: '8px' }}>TICKET RESOLVED</span>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', marginTop: '8px' }}
                  disabled={isUpdating}
                  onClick={() => handleTransition('CLOSED', 'Citizen satisfied. Ticket formally archived.')}
                >
                  Formally Close Ticket
                </button>
              </div>
            )}

            {ticket.status === 'CLOSED' && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                This grievance is formally closed and archived.
              </div>
            )}
          </div>

          {/* Audit Trail Timeline */}
          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
              Immutable Audit History ({ticket.status_logs?.length || 0} events)
            </h4>
            <div className="timeline">
              {ticket.status_logs?.map((log) => (
                <div key={log.id} className="timeline-item">
                  <div className={`timeline-dot ${log.to_status === 'ESCALATED' ? 'breached' : log.to_status === 'RESOLVED' ? 'completed' : 'active'}`}>
                    {log.to_status === 'ESCALATED' ? '!' : '✓'}
                  </div>
                  <div className="timeline-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span className={`badge badge-${log.to_status === 'ESCALATED' ? 'red' : log.to_status === 'RESOLVED' ? 'green' : 'blue'}`}>
                        {log.to_status}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
        <div className="drawer-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
}
