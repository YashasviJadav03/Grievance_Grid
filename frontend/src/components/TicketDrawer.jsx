import React, { useState } from 'react';
import { X, ArrowRight, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { api } from '../api';
import { useToast } from './Toast';

export default function TicketDrawer({ ticket, onClose, onUpdated }) {
  if (!ticket) return null;

  const toast = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);

  const handleTransition = async (targetStatus, reason = null) => {
    setIsUpdating(true);
    try {
      const updated = await api.updateComplaintStatus(ticket.id, {
        target_status: targetStatus,
        actor: 'OFFICER_IN_CHARGE',
        reason: reason || `Transitioned to ${targetStatus}`,
        resolution_notes: targetStatus === 'RESOLVED' ? resolutionNotes : undefined,
      });
      onUpdated(updated);
      setShowResolveForm(false);
      toast.success(`Status updated to ${targetStatus.replace('_', ' ')}`);
    } catch (err) {
      toast.error(`Action could not be executed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-pane" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-head">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
              <span className={`badge badge-${ticket.sla_status === 'GREEN' ? 'green' : ticket.sla_status === 'AMBER' ? 'amber' : ticket.sla_status === 'RESOLVED' ? 'green' : 'red'}`}>
                {ticket.sla_status}
              </span>
              <span className="badge badge-gray">{ticket.priority}</span>
              <span className="badge badge-gray">{ticket.status.replace('_', ' ')}</span>
            </div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '15px', color: 'var(--color-gray-900)' }}>
              {ticket.tracking_id}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="drawer-main">
          {/* Grievance Summary */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Subject
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-gray-900)', marginBottom: '8px' }}>
              {ticket.title}
            </h3>
            <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-gray-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-gray-200)', fontSize: '13px', color: 'var(--color-gray-700)', lineHeight: 1.5 }}>
              {ticket.description}
            </div>
          </div>

          {/* Details Row */}
          <div className="col-2" style={{ gap: 'var(--space-3)' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--color-gray-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-gray-200)' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>
                Citizen
              </div>
              <div style={{ fontWeight: 600, marginTop: '2px', color: 'var(--color-gray-900)' }}>
                {ticket.citizen_name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-gray-500)', marginTop: '2px' }}>
                {ticket.citizen_contact}
              </div>
              {ticket.citizen_email && (
                <div style={{ fontSize: '11.5px', color: 'var(--color-gray-500)' }}>{ticket.citizen_email}</div>
              )}
            </div>

            <div style={{ padding: '12px', backgroundColor: 'var(--color-gray-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-gray-200)' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>
                Assigned Authority
              </div>
              <div style={{ fontWeight: 600, marginTop: '2px', color: 'var(--color-gray-900)' }}>
                {ticket.department?.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-gray-500)', marginTop: '2px' }}>
                {ticket.category?.name}
              </div>
            </div>
          </div>

          {/* SLA Time Balance */}
          <div style={{ padding: '12px 14px', border: '1px solid var(--color-gray-200)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--color-gray-500)' }}>Target SLA Deadline:</span>
              <strong style={{ color: ticket.is_breached ? 'var(--status-red-text)' : 'var(--color-gray-900)' }}>
                {ticket.sla_deadline ? new Date(ticket.sla_deadline).toLocaleString() : 'N/A'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
              <span style={{ color: 'var(--color-gray-500)' }}>Time Balance:</span>
              <strong style={{ color: ticket.sla_hours_remaining !== null && ticket.sla_hours_remaining < 0 ? 'var(--status-red-text)' : 'var(--color-primary)' }}>
                {ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? (
                  ticket.sla_hours_remaining !== null && ticket.sla_hours_remaining >= 0 ? (
                    <span style={{ color: 'var(--status-green-text)' }}>Resolved ({ticket.sla_hours_remaining}h spare)</span>
                  ) : (
                    <span style={{ color: 'var(--status-red-text)' }}>Resolved after breach</span>
                  )
                ) : (
                  ticket.sla_hours_remaining !== null ? `${ticket.sla_hours_remaining} hrs` : 'N/A'
                )}
              </strong>
            </div>
          </div>

          {/* Primary Operations Actions */}
          <div style={{ padding: '16px', backgroundColor: 'var(--color-gray-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-gray-200)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-gray-900)', marginBottom: '12px' }}>
              Operational Actions
            </div>

            {ticket.status === 'ROUTED' && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={isUpdating}
                onClick={() => handleTransition('IN_PROGRESS', 'Officer acknowledged grievance and initiated field investigation.')}
              >
                Acknowledge & Initiate Work (Set IN PROGRESS)
              </button>
            )}

            {(ticket.status === 'IN_PROGRESS' || ticket.status === 'ESCALATED' || ticket.status === 'REASSIGNED') && !showResolveForm && (
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={isUpdating}
                  onClick={() => setShowResolveForm(true)}
                >
                  Document Formal Resolution
                </button>
                {ticket.status !== 'ESCALATED' && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={isUpdating}
                    onClick={() => handleTransition('ESCALATED', 'Manual supervisory escalation triggered by handling officer.')}
                  >
                    Escalate
                  </button>
                )}
              </div>
            )}

            {showResolveForm && (
              <div style={{ marginTop: '8px' }}>
                <label className="form-label">
                  Resolution Notes <span className="req">*</span>
                </label>
                <textarea
                  rows={3}
                  className="form-textarea"
                  placeholder="Document corrective actions completed on ground..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={isUpdating || !resolutionNotes.trim()}
                    onClick={() => handleTransition('RESOLVED', resolutionNotes)}
                  >
                    Confirm Resolution
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowResolveForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {ticket.status === 'RESOLVED' && (
              <div>
                <div className="badge badge-green" style={{ marginBottom: '8px' }}>
                  Grievance Resolved
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                  disabled={isUpdating}
                  onClick={() => handleTransition('CLOSED', 'Complainant satisfaction verified. Case formally archived.')}
                >
                  Formally Archive / Close Record
                </button>
              </div>
            )}

            {ticket.status === 'CLOSED' && (
              <div style={{ fontSize: '12.5px', color: 'var(--color-gray-500)' }}>
                This record is formally closed and archived.
              </div>
            )}
          </div>

          {/* Audit Ledger */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Audit History ({ticket.status_logs?.length || 0} Events)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {ticket.status_logs?.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-gray-50)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    border: '1px solid var(--color-gray-200)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span className={`badge badge-${log.to_status === 'ESCALATED' ? 'red' : log.to_status === 'RESOLVED' ? 'green' : 'gray'}`}>
                      {log.to_status.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-gray-400)' }}>
                      {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div style={{ color: 'var(--color-gray-700)', marginTop: '2px' }}>{log.reason}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-gray-400)', marginTop: '2px' }}>
                    Actor: {log.changed_by}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="drawer-foot">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
