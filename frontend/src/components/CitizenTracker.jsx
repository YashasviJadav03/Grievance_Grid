import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Search, AlertCircle, Clock, CheckCircle, FileText, Inbox } from 'lucide-react';

export default function CitizenTracker({ initialTrackingId }) {
  const [trackingInput, setTrackingInput] = useState(initialTrackingId || '');
  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [recentRecords, setRecentRecords] = useState([]);

  useEffect(() => {
    api.getComplaints({ limit: 5 }).then((data) => {
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
      setErrorMsg(err.message || 'Reference record could not be found.');
      setTicket(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="content-container">
      {/* Page Header */}
      <h1 className="page-title">Grievance Status Verification</h1>
      <p className="page-description">
        Inspect live departmental queue placement, statutory SLA time balance, and chronological audit ledger.
      </p>

      {/* Search Panel */}
      <div className="panel" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ maxWidth: '600px' }}>
          <label className="form-label" style={{ marginBottom: 'var(--space-2)' }}>
            Enter Tracking Identifier
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. GG-20260917-7436"
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
              <span>{isLoading ? 'Searching...' : 'Verify'}</span>
            </button>
          </div>

          {recentRecords.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-gray-500)' }}>Recent samples:</span>
              {recentRecords.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '11px', padding: '2px 6px', fontFamily: 'monospace' }}
                  onClick={() => handleSearch(r.tracking_id)}
                >
                  {r.tracking_id}
                </button>
              ))}
            </div>
          )}

          {errorMsg && (
            <div style={{ marginTop: 'var(--space-3)', color: 'var(--status-red-text)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <AlertCircle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Details & Timeline */}
      {ticket ? (
        <div className="col-2">
          {/* Left Column: Dossier */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="badge badge-gray" style={{ marginBottom: 'var(--space-1)' }}>
                  {ticket.department?.name}
                </span>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-gray-900)' }}>
                  {ticket.title}
                </h3>
              </div>

              <span className={`badge badge-${ticket.sla_status === 'GREEN' ? 'green' : ticket.sla_status === 'AMBER' ? 'amber' : 'red'}`}>
                SLA: {ticket.sla_status}
              </span>
            </div>

            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-gray-100)', borderRadius: 'var(--radius)', fontSize: '13px', lineHeight: 1.5, color: 'var(--color-gray-700)', marginBottom: 'var(--space-4)' }}>
              {ticket.description}
            </div>

            {/* SLA Schedule Card */}
            <div style={{ border: '1px solid var(--color-gray-200)', borderRadius: 'var(--radius)', padding: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-gray-200)', marginBottom: 'var(--space-2)' }}>
                <span style={{ color: 'var(--color-gray-500)' }}>Registration Timestamp:</span>
                <strong>{new Date(ticket.created_at).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-gray-200)', marginBottom: 'var(--space-2)' }}>
                <span style={{ color: 'var(--color-gray-500)' }}>Standard SLA Window:</span>
                <strong>{ticket.category?.default_sla_hours || 24} Hours</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-gray-200)', marginBottom: 'var(--space-2)' }}>
                <span style={{ color: 'var(--color-gray-500)' }}>Statutory Resolution Deadline:</span>
                <strong style={{ color: ticket.is_breached ? 'var(--status-red-text)' : 'var(--status-green-text)' }}>
                  {ticket.sla_deadline ? new Date(ticket.sla_deadline).toLocaleString() : 'N/A'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--color-gray-500)' }}>Time Remaining Balance:</span>
                <strong style={{ color: ticket.sla_hours_remaining < 0 ? 'var(--status-red-text)' : 'var(--color-primary)' }}>
                  {ticket.sla_hours_remaining !== null ? `${ticket.sla_hours_remaining} hrs` : 'Resolved'}
                </strong>
              </div>
            </div>

            {/* Department Officer Reference */}
            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-gray-100)', borderRadius: 'var(--radius)', fontSize: '12px', color: 'var(--color-gray-700)' }}>
              <div>Assigned Queue: <strong>{ticket.assigned_to || 'Department Operational Dispatch'}</strong></div>
              <div style={{ marginTop: '2px' }}>Supervisor Escalation: <strong>{ticket.department?.supervisor_email || 'supervisor@grievance.gov.in'}</strong></div>
            </div>

            {ticket.resolution_notes && (
              <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', backgroundColor: 'var(--status-green-bg)', border: '1px solid var(--status-green-border)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--status-green-text)', textTransform: 'uppercase', marginBottom: '2px' }}>
                  Official Redressal Summary
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-gray-900)' }}>{ticket.resolution_notes}</p>
              </div>
            )}
          </div>

          {/* Right Column: Linear Progress Stepper & Audit Log */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">
                <Clock size={16} color="var(--color-primary)" />
                Redressal Lifecycle & Audit Ledger
              </span>
            </div>

            {/* Progression Stepper */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
              {['SUBMITTED', 'ROUTED', 'IN_PROGRESS', 'RESOLVED'].map((step, idx) => {
                const stepOrder = ['SUBMITTED', 'ROUTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
                const currentIdx = stepOrder.indexOf(ticket.status);
                const thisIdx = stepOrder.indexOf(step);
                const isPassed = currentIdx >= thisIdx;
                const isEscalated = ticket.status === 'ESCALATED' && step === 'IN_PROGRESS';

                return (
                  <div key={step} style={{ textAlign: 'center', flex: 1, position: 'relative' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isEscalated ? 'var(--status-red-bg)' : isPassed ? 'var(--color-primary)' : 'var(--color-white)',
                        color: isEscalated ? 'var(--status-red-text)' : isPassed ? 'var(--color-white)' : 'var(--color-gray-500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--space-1)',
                        fontSize: '11px',
                        fontWeight: 700,
                        border: `1px solid ${isEscalated ? 'var(--status-red-border)' : isPassed ? 'var(--color-primary)' : 'var(--color-gray-200)'}`,
                      }}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: isPassed ? 'var(--color-gray-900)' : 'var(--color-gray-500)', textTransform: 'uppercase' }}>
                      {isEscalated ? 'ESCALATED' : step.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Audit History */}
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
              Chronological Audit Trail ({ticket.status_logs?.length || 0} Records)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {ticket.status_logs?.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    backgroundColor: 'var(--color-gray-100)',
                    borderRadius: 'var(--radius)',
                    fontSize: '12px',
                    border: '1px solid var(--color-gray-200)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span className={`badge badge-${log.to_status === 'ESCALATED' ? 'red' : log.to_status === 'RESOLVED' ? 'green' : 'gray'}`}>
                      {log.to_status}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-gray-500)' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ color: 'var(--color-gray-700)', marginTop: '2px' }}>{log.reason}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-gray-500)', marginTop: '2px' }}>
                    Actor: {log.changed_by}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="panel" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <Inbox size={32} style={{ margin: '0 auto var(--space-2)', opacity: 0.4 }} />
          <p style={{ color: 'var(--color-gray-500)', fontSize: '13px' }}>
            Enter a grievance tracking identifier above to inspect the case dossier and audit history.
          </p>
        </div>
      )}
    </div>
  );
}
