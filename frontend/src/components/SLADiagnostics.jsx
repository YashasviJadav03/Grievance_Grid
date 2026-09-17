import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Cpu, Clock, RefreshCw, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function SLADiagnostics({ onNavigateToOfficer }) {
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
      alert(`Simulation failed: ${err.message}`);
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
      alert(`Evaluation failed: ${err.message}`);
    } finally {
      setIsSweeping(false);
    }
  };

  return (
    <div className="content-container">
      {/* Page Header */}
      <h1 className="page-title">SLA Engine Diagnostics Console</h1>
      <p className="page-description">
        Administrative test console: simulate temporal drift on active complaints to verify autonomous deadline detection, supervisor reassignment, and status mutation.
      </p>

      <div className="col-2">
        {/* Left Column: Diagnostics Controls */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <Clock size={16} color="var(--color-primary)" />
              1. Select Target Record & Apply Offset
            </span>
          </div>

          <div className="form-field">
            <label className="form-label">Active Non-Terminal Grievance</label>
            <select
              className="form-select"
              value={selectedTrackingId}
              onChange={(e) => setSelectedTrackingId(e.target.value)}
            >
              {complaints.length === 0 ? (
                <option value="">No active non-terminal records in queue</option>
              ) : (
                complaints.map((c) => (
                  <option key={c.id} value={c.tracking_id}>
                    {c.tracking_id} — {c.title.substring(0, 36)}... ({c.department?.code}, SLA: {c.sla_status})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Negative Time Offset (Hours)</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {[12, 24, 48, 72].map((hrs) => (
                <button
                  key={hrs}
                  type="button"
                  className={`btn ${hoursBack === hrs ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  style={{ flex: 1 }}
                  onClick={() => setHoursBack(hrs)}
                >
                  +{hrs}h
                </button>
              ))}
            </div>
            <span className="form-hint">
              Shifts creation timestamp and SLA deadline backward to force an overdue state.
            </span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', marginBottom: 'var(--space-6)' }}
            onClick={handleBackdate}
            disabled={isSimulating || !selectedTrackingId}
          >
            <Clock size={13} />
            <span>{isSimulating ? 'Applying Offset...' : `Apply -${hoursBack}h Offset to Record`}</span>
          </button>

          <div className="panel-header" style={{ paddingTop: 'var(--space-4)' }}>
            <span className="panel-title">
              <Cpu size={16} color="var(--color-primary)" />
              2. Execute SLA Evaluation Daemon
            </span>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--color-gray-500)', marginBottom: 'var(--space-4)' }}>
            The background daemon continuously executes every 30 seconds. Click below to trigger an immediate evaluation sweep.
          </p>

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={handleRunSweep}
            disabled={isSweeping}
          >
            <RefreshCw size={14} className={isSweeping ? 'animate-spin' : ''} />
            <span>{isSweeping ? 'Executing Scan...' : 'Execute On-Demand SLA Scan'}</span>
          </button>
        </div>

        {/* Right Column: Execution Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {simulationLog && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">
                  <Clock size={16} color="var(--color-primary)" />
                  Temporal Mutation Applied
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-gray-700)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div>Target ID: <strong style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>{simulationLog.tracking_id}</strong></div>
                <div>Adjusted SLA Deadline: <code style={{ color: 'var(--status-red-text)' }}>{simulationLog.new_sla_deadline}</code></div>
                <div>Current Operational State: <span className="badge badge-gray">{simulationLog.current_status}</span></div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-gray-500)', marginTop: 'var(--space-3)' }}>
                Target record is now overdue. Execute Step 2 to verify automatic escalation.
              </div>
            </div>
          )}

          {sweepResult && (
            <div className="panel" style={{ borderLeft: '3px solid var(--status-red-text)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <ShieldAlert size={18} color="var(--status-red-text)" />
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-gray-900)' }}>
                  SLA Daemon Evaluation Output
                </h3>
              </div>

              <div className="col-3" style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-gray-100)', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>Scanned</div>
                  <strong style={{ fontSize: '16px' }}>{sweepResult.scanned_count}</strong>
                </div>
                <div style={{ padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-gray-100)', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>At Risk</div>
                  <strong style={{ fontSize: '16px', color: 'var(--status-amber-text)' }}>{sweepResult.at_risk_count}</strong>
                </div>
                <div style={{ padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-gray-100)', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>Escalated</div>
                  <strong style={{ fontSize: '16px', color: 'var(--status-red-text)' }}>{sweepResult.escalated_count}</strong>
                </div>
              </div>

              {sweepResult.escalated_tracking_ids?.length > 0 && (
                <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-gray-100)', borderRadius: 'var(--radius)', marginBottom: 'var(--space-4)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-gray-500)', marginBottom: 'var(--space-1)' }}>
                    Reassigned to Supervisor Queue:
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {sweepResult.escalated_tracking_ids.map((id) => (
                      <span key={id} className="badge badge-red" style={{ fontFamily: 'monospace' }}>
                        {id} (CRITICAL)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
                onClick={onNavigateToOfficer}
              >
                <span>Inspect Escalated Queue in Operations Table</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}

          {!simulationLog && !sweepResult && (
            <div className="panel" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
              <Cpu size={28} style={{ margin: '0 auto var(--space-2)', opacity: 0.3 }} />
              <p style={{ fontSize: '12px', color: 'var(--color-gray-500)' }}>
                Select a target grievance record and apply an offset on the left to verify automated SLA enforcement.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
