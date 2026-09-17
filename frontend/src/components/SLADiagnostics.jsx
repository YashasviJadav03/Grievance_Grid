import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from './Toast';
import { Cpu, Clock, RefreshCw, ArrowRight, ShieldAlert, CheckCircle2, Play } from 'lucide-react';

export default function SLADiagnostics({ onNavigateToOfficer }) {
  const toast = useToast();
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
    if (!selectedTrackingId) {
      toast.warning('Please select a target grievance.');
      return;
    }
    setIsSimulating(true);
    setSweepResult(null);
    try {
      const res = await api.backdateComplaint(selectedTrackingId, Number(hoursBack));
      setSimulationLog(res);
      toast.success(`Record backdated by ${hoursBack}h to simulate an overdue state.`);
      fetchActiveTickets();
    } catch (err) {
      toast.error(`Simulation failed: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRunSweep = async () => {
    setIsSweeping(true);
    try {
      const res = await api.triggerSLAScan();
      setSweepResult(res.result);
      const count = res.result.escalated_count;
      if (count > 0) {
        toast.warning(`SLA Scan: ${count} grievance(s) auto-escalated to supervisors!`);
      } else {
        toast.info('SLA Scan completed: All evaluated tickets are on schedule.');
      }
      fetchActiveTickets();
    } catch (err) {
      toast.error(`Evaluation failed: ${err.message}`);
    } finally {
      setIsSweeping(false);
    }
  };

  return (
    <div className="content-container">
      {/* Header */}
      <div className="view-header">
        <div className="view-header-main">
          <h1 className="page-title">SLA Simulation Lab</h1>
          <p className="page-description">
            Test autonomous deadline enforcement and supervisor escalation by simulating temporal drift.
          </p>
        </div>
      </div>

      <div className="col-2">
        {/* Controls Panel */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <Clock size={16} color="var(--color-primary)" />
              Step 1: Force Overdue State
            </span>
          </div>

          <div className="form-field">
            <label className="form-label">Select Target Grievance</label>
            <select
              className="form-select"
              value={selectedTrackingId}
              onChange={(e) => setSelectedTrackingId(e.target.value)}
            >
              {complaints.length === 0 ? (
                <option value="">No active grievances in queue</option>
              ) : (
                complaints.map((c) => (
                  <option key={c.id} value={c.tracking_id}>
                    {c.tracking_id} — {c.title.substring(0, 32)}... ({c.department?.code})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Simulate Overdue Time</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {[12, 24, 48, 72].map((hrs) => (
                <button
                  key={hrs}
                  type="button"
                  className={`btn ${hoursBack === hrs ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  style={{ flex: 1 }}
                  onClick={() => setHoursBack(hrs)}
                >
                  +{hrs}h Overdue
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', marginBottom: 'var(--space-6)', marginTop: 'var(--space-2)' }}
            onClick={handleBackdate}
            disabled={isSimulating || !selectedTrackingId}
          >
            <Clock size={13} />
            <span>{isSimulating ? 'Applying Shift...' : `Shift Record by -${hoursBack}h`}</span>
          </button>

          <div className="panel-header" style={{ paddingTop: 'var(--space-2)' }}>
            <span className="panel-title">
              <Cpu size={16} color="var(--color-primary)" />
              Step 2: Trigger SLA Evaluation Daemon
            </span>
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--color-gray-500)', marginBottom: 'var(--space-4)' }}>
            The background daemon continuously evaluates grievances. Trigger an immediate scan to verify escalation.
          </p>

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px 16px' }}
            onClick={handleRunSweep}
            disabled={isSweeping}
          >
            <RefreshCw size={14} className={isSweeping ? 'animate-spin' : ''} />
            <span>{isSweeping ? 'Scanning Queues...' : 'Trigger SLA Evaluation Scan'}</span>
          </button>
        </div>

        {/* Output Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {simulationLog && (
            <div className="panel" style={{ borderLeft: '4px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
                <CheckCircle2 size={16} color="var(--color-primary)" />
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-gray-900)' }}>
                  Time Shift Applied
                </h3>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--color-gray-700)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>Target ID: <strong style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>{simulationLog.tracking_id}</strong></div>
                <div>Simulated Deadline: <code style={{ color: 'var(--status-red-text)' }}>{new Date(simulationLog.new_sla_deadline).toLocaleString()}</code></div>
                <div>Status: <span className="badge badge-gray">{simulationLog.current_status}</span></div>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--color-gray-500)', marginTop: 'var(--space-3)' }}>
                Record is now past deadline. Click "Trigger SLA Evaluation Scan" to auto-escalate.
              </div>
            </div>
          )}

          {sweepResult && (
            <div className="panel" style={{ borderLeft: '4px solid var(--status-red-text)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
                <ShieldAlert size={18} color="var(--status-red-text)" />
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-gray-900)' }}>
                  SLA Scan Results
                </h3>
              </div>

              <div className="col-3" style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--color-gray-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-gray-200)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>Scanned</div>
                  <strong style={{ fontSize: '17px' }}>{sweepResult.scanned_count}</strong>
                </div>
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--status-amber-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-amber-border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--status-amber-text)', textTransform: 'uppercase' }}>At Risk</div>
                  <strong style={{ fontSize: '17px', color: 'var(--status-amber-text)' }}>{sweepResult.at_risk_count}</strong>
                </div>
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--status-red-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-red-border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--status-red-text)', textTransform: 'uppercase' }}>Escalated</div>
                  <strong style={{ fontSize: '17px', color: 'var(--status-red-text)' }}>{sweepResult.escalated_count}</strong>
                </div>
              </div>

              {sweepResult.escalated_tracking_ids?.length > 0 && (
                <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-gray-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-gray-200)', marginBottom: 'var(--space-4)' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--color-gray-600)', marginBottom: '6px' }}>
                    Escalated to Supervisor Queue:
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
                <span>Inspect Escalated Queue in Caseload Table</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}

          {!simulationLog && !sweepResult && (
            <div className="panel" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
              <Cpu size={32} style={{ margin: '0 auto var(--space-2)', opacity: 0.3 }} />
              <p style={{ fontSize: '13px', color: 'var(--color-gray-500)' }}>
                Select an active grievance and apply a time shift on the left to verify automated SLA breach escalation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
