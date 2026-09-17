import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { FastForward, Play, CheckCircle2, ShieldAlert, Clock, RefreshCw, ArrowRight } from 'lucide-react';

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
      alert(`Backdating failed: ${err.message}`);
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
      alert(`Sweep failed: ${err.message}`);
    } finally {
      setIsSweeping(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2>SLA Time Machine & Escalation Engine Simulator</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Interactive proof of autonomous SLA enforcement: Backdate timestamps to simulate SLA expiration, trigger the background scanner, and observe automatic escalation state machine transitions.
        </p>
      </div>

      <div className="grid-2">
        {/* Left Column: Simulation Controls */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FastForward size={18} color="var(--primary)" />
            Step 1: Choose Grievance & Backdate Hours
          </h3>

          <div className="input-group">
            <label className="input-label">Select Active Grievance to Test</label>
            <select
              className="select-field"
              value={selectedTrackingId}
              onChange={(e) => setSelectedTrackingId(e.target.value)}
            >
              {complaints.length === 0 ? (
                <option value="">No active ROUTED or IN_PROGRESS tickets found</option>
              ) : (
                complaints.map((c) => (
                  <option key={c.id} value={c.tracking_id}>
                    {c.tracking_id} — {c.title.substring(0, 40)} ({c.department?.code}, SLA: {c.sla_status})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Simulate Passage of Time (Hours Back)</label>
            <div style={{ display: 'flex', gap: '10px' }}>
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
          </div>

          <button
            className="btn btn-secondary"
            style={{ width: '100%', marginBottom: '20px' }}
            onClick={handleBackdate}
            disabled={isSimulating || !selectedTrackingId}
          >
            <Clock size={16} />
            {isSimulating ? 'Backdating Timestamps...' : `Backdate Ticket Timestamps by ${hoursBack}h`}
          </button>

          <hr style={{ borderColor: 'var(--border-subtle)', margin: '20px 0' }} />

          <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Play size={18} color="var(--sla-green)" />
            Step 2: Trigger Background Escalation Worker
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            The background cron normally sweeps every 30 seconds. You can trigger an immediate manual sweep here.
          </p>

          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={handleRunSweep}
            disabled={isSweeping}
          >
            <RefreshCw size={16} className={isSweeping ? 'animate-spin' : ''} />
            {isSweeping ? 'Scanning All Grievance Deadlines...' : 'Trigger SLA Scan Now'}
          </button>
        </div>

        {/* Right Column: Execution Output & State Mutation Proof */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Backdate Output */}
          {simulationLog && (
            <div className="card" style={{ border: '1px solid var(--border-bright)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#93C5FD', marginBottom: '12px' }}>
                <Clock size={18} />
                <h4 style={{ fontSize: '1rem', color: 'white' }}>Timestamp Shift Applied</h4>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>Target Ticket: <strong>{simulationLog.tracking_id}</strong></div>
                <div>New SLA Deadline: <code style={{ color: '#F87171' }}>{simulationLog.new_sla_deadline}</code></div>
                <div>Current Status: <span className="badge badge-blue">{simulationLog.current_status}</span></div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '10px' }}>
                Now run Step 2 to watch the SLA engine detect this expired deadline and auto-escalate the ticket!
              </p>
            </div>
          )}

          {/* Sweep Result Output */}
          {sweepResult && (
            <div className="card" style={{ border: '1px solid var(--sla-red)', background: 'rgba(239, 68, 68, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F87171', marginBottom: '12px' }}>
                <ShieldAlert size={20} />
                <h4 style={{ fontSize: '1.1rem', color: 'white' }}>SLA Escalation Engine Output</h4>
              </div>

              <div className="grid-3" style={{ marginBottom: '14px' }}>
                <div style={{ padding: '10px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Scanned</span>
                  <strong style={{ fontSize: '1.2rem', display: 'block' }}>{sweepResult.scanned_count}</strong>
                </div>
                <div style={{ padding: '10px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>At Risk (&gt;75%)</span>
                  <strong style={{ fontSize: '1.2rem', color: '#FBBF24', display: 'block' }}>{sweepResult.at_risk_count}</strong>
                </div>
                <div style={{ padding: '10px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Auto-Escalated</span>
                  <strong style={{ fontSize: '1.2rem', color: '#F87171', display: 'block' }}>{sweepResult.escalated_count}</strong>
                </div>
              </div>

              {sweepResult.escalated_tracking_ids?.length > 0 && (
                <div style={{ padding: '12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Tickets Flipped to ESCALATED:
                  </span>
                  {sweepResult.escalated_tracking_ids.map((id) => (
                    <span key={id} className="badge badge-red" style={{ marginRight: '6px', marginBottom: '4px' }}>
                      {id} (CRITICAL)
                    </span>
                  ))}
                </div>
              )}

              <button
                className="btn btn-primary btn-sm"
                style={{ width: '100%' }}
                onClick={onNavigateToOfficer}
              >
                Inspect Escalated Queue in Officer Dashboard
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {!simulationLog && !sweepResult && (
            <div className="card" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
              <FastForward size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ fontSize: '0.9rem' }}>
                Select a ticket and click "Backdate" on the left to start the interactive SLA breach simulation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
