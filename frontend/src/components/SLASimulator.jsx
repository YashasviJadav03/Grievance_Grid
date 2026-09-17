import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Cpu, Play, CheckCircle, AlertTriangle, ShieldAlert, Clock, RefreshCw, ArrowRight } from 'lucide-react';

export default function SLASimulator({ onNavigateToOfficer }) {
  const [complaints, setComplaints] = useState([]);
  const [selectedTrackingId, setSelectedTrackingId] = useState('');
  const [hoursBack, setHoursBack] = useState(24);
  const [simulationLog, setSimulationLog] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const [sweepResult, setSweepResult] = useState(null);

  const fetchActiveTickets = async () => {
    try {
      const data = await api.getComplaints({ status: 'ROUTED' });
      const inProg = await api.getComplaints({ status: 'IN_PROGRESS' });
      const combined = [...data, ...inProg];
      setComplaints(combined);
      if (combined.length > 0 && !selectedTrackingId) {
        setSelectedTrackingId(combined[0].tracking_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchActiveTickets();
  }, []);

  const handleBackdate = async () => {
    if (!selectedTrackingId) return;
    setIsSimulating(true);
    setSweepResult(null);
    try {
      const res = await api.backdateComplaint(selectedTrackingId, Number(hoursBack));
      setSimulationLog(res);
      fetchActiveTickets();
    } catch (err) {
      alert(`Simulation Error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRunSweep = async () => {
    setIsSweeping(true);
    try {
      const res = await api.triggerSLAScan();
      setSweepResult(res.result);
      fetchActiveTickets();
    } catch (err) {
      alert(`Sweep Error: ${err.message}`);
    } finally {
      setIsSweeping(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">SLA Engine Diagnostics & Escalation Sandbox</h1>
          <p className="page-subtitle">
            Administrative diagnostic sandbox: programmatically simulate temporal drift on active grievances to test automated breach detection and supervisor escalation.
          </p>
        </div>
      </div>

      <div className="grid-2">
        {/* Left Column: Diagnostics Controls */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Clock size={16} color="var(--primary-600)" />
              Step 1: Select Record & Apply Temporal Offset
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Active Grievance Target</label>
            <select
              className="form-select"
              value={selectedTrackingId}
              onChange={(e) => setSelectedTrackingId(e.target.value)}
            >
              {complaints.length === 0 ? (
                <option value="">No active non-terminal grievances in queue</option>
              ) : (
                complaints.map((c) => (
                  <option key={c.id} value={c.tracking_id}>
                    {c.tracking_id} — {c.title.substring(0, 42)}... ({c.department?.code}, SLA: {c.sla_status})
                  </option>
                ))
              )}
            </select>
            <span className="form-hint">Only un-resolved tickets (ROUTED or IN PROGRESS) can be evaluated.</span>
          </div>

          <div className="form-group">
            <label className="form-label">Negative Temporal Offset (Hours)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[12, 24, 48, 72].map((hrs) => (
                <button
                  key={hrs}
                  type="button"
                  className={`btn ${hoursBack === hrs ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  style={{ flex: 1 }}
                  onClick={() => setHoursBack(hrs)}
                >
                  +{hrs} Hours
                </button>
              ))}
            </div>
            <span className="form-hint">Shifts both created_at and sla_deadline backward to simulate overdue status.</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', marginBottom: '24px' }}
            onClick={handleBackdate}
            disabled={isSimulating || !selectedTrackingId}
          >
            <Clock size={14} />
            {isSimulating ? 'Applying Offset...' : `Apply -${hoursBack}h Temporal Offset to Record`}
          </button>

          <div className="card-header" style={{ paddingTop: '16px' }}>
            <span className="card-title">
              <Cpu size={16} color="var(--primary-600)" />
              Step 2: Trigger Evaluation Daemon
            </span>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            While the daemon executes autonomously every 30 seconds in production, you can trigger an immediate on-demand sweep below.
          </p>

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={handleRunSweep}
            disabled={isSweeping}
          >
            <RefreshCw size={14} className={isSweeping ? 'animate-spin' : ''} />
            {isSweeping ? 'Executing System Sweep...' : 'Execute On-Demand SLA Sweep'}
          </button>
        </div>

        {/* Right Column: State Mutation Inspection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Offset Feedback */}
          {simulationLog && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">
                  <Clock size={16} color="var(--primary-600)" />
                  Temporal Offset Record Mutation
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>Target Tracking Number: <strong style={{ fontFamily: 'monospace', color: 'var(--primary-700)' }}>{simulationLog.tracking_id}</strong></div>
                <div>Adjusted SLA Deadline: <code style={{ color: 'var(--status-red-text)' }}>{simulationLog.new_sla_deadline}</code></div>
                <div>Current Operational Status: <span className="badge badge-blue">{simulationLog.current_status}</span></div>
              </div>
              <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Target record is now past its statutory SLA deadline. Execute Step 2 to test automated breach escalation.
              </div>
            </div>
          )}

          {/* Sweep Result */}
          {sweepResult && (
            <div className="card" style={{ border: '1px solid var(--status-red-border)', backgroundColor: '#FEF2F2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-red-text)', marginBottom: '14px' }}>
                <ShieldAlert size={18} />
                <h3 style={{ fontSize: '1rem', color: 'var(--status-red-text)' }}>
                  SLA Daemon Execution Report
                </h3>
              </div>

              <div className="grid-3" style={{ marginBottom: '16px' }}>
                <div style={{ padding: '10px', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Records Scanned</div>
                  <strong style={{ fontSize: '1.25rem' }}>{sweepResult.scanned_count}</strong>
                </div>
                <div style={{ padding: '10px', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>At Risk (&gt;75%)</div>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--status-amber-text)' }}>{sweepResult.at_risk_count}</strong>
                </div>
                <div style={{ padding: '10px', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Auto-Escalated</div>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--status-red-text)' }}>{sweepResult.escalated_count}</strong>
                </div>
              </div>

              {sweepResult.escalated_tracking_ids?.length > 0 && (
                <div style={{ padding: '12px', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Escalated Records Reassigned to Supervisor Queue:
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {sweepResult.escalated_tracking_ids.map((id) => (
                      <span key={id} className="badge badge-red" style={{ fontFamily: 'monospace' }}>
                        {id} (Priority: CRITICAL)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ width: '100%' }}
                onClick={onNavigateToOfficer}
              >
                Inspect Escalated Caseload in Officer Queue
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {!simulationLog && !sweepResult && (
            <div className="card" style={{ textAlign: 'center', padding: '54px 20px', color: 'var(--text-muted)' }}>
              <Cpu size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: '0.875rem' }}>
                Select an active record and apply a negative temporal offset on the left to verify automated SLA breach detection.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
