import React, { useState, useEffect } from 'react';
import { api } from '../api';
import confetti from 'canvas-confetti';
import { 
  Send, Search, CheckCircle2, Clock, AlertTriangle, 
  Sparkles, ShieldAlert, ArrowRight, RefreshCw, FileText, CheckCircle
} from 'lucide-react';

export default function CitizenPortal({ onOpenTracker, initialTrackingId }) {
  const [subTab, setSubTab] = useState(initialTrackingId ? 'track' : 'file');

  // Intake Form State
  const [formData, setFormData] = useState({
    citizen_name: '',
    citizen_contact: '',
    citizen_email: '',
    title: '',
    description: '',
  });

  // Classifier live prediction
  const [prediction, setPrediction] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  // Tracker State
  const [trackingInput, setTrackingInput] = useState(initialTrackingId || '');
  const [trackedTicket, setTrackedTicket] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackError, setTrackError] = useState('');
  const [sampleTickets, setSampleTickets] = useState([]);

  // Fetch some sample active tickets for 1-click tracking demonstration
  useEffect(() => {
    api.getComplaints({ limit: 5 }).then((data) => {
      setSampleTickets(data);
      if (initialTrackingId) {
        handleTrack(initialTrackingId);
      } else if (data.length > 0 && !trackedTicket) {
        // Preload first ticket for instant demo
        handleTrack(data[0].tracking_id);
      }
    }).catch(console.error);
  }, [initialTrackingId]);

  // Debounced auto-classification
  useEffect(() => {
    if (!formData.title.trim() && !formData.description.trim()) {
      setPrediction(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsClassifying(true);
        const res = await api.classify(formData.title, formData.description);
        setPrediction(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsClassifying(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.title, formData.description]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;

    setIsSubmitting(true);
    try {
      const ticket = await api.submitComplaint(formData);
      setSubmittedTicket(ticket);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      // Reset form
      setFormData({
        citizen_name: '',
        citizen_contact: '',
        citizen_email: '',
        title: '',
        description: '',
      });
      setPrediction(null);
    } catch (err) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrack = async (trackingCode) => {
    const code = (trackingCode || trackingInput).trim();
    if (!code) return;
    setTrackError('');
    setIsTracking(true);
    try {
      const ticket = await api.getComplaint(code);
      setTrackedTicket(ticket);
      setTrackingInput(ticket.tracking_id);
    } catch (err) {
      setTrackError(err.message || 'Ticket not found');
      setTrackedTicket(null);
    } finally {
      setIsTracking(false);
    }
  };

  const applyPreset = (title, desc) => {
    setFormData({
      citizen_name: 'Rahul Sharma',
      citizen_contact: '+91-9876543210',
      citizen_email: 'rahul.sharma@example.com',
      title,
      description: desc,
    });
  };

  return (
    <div>
      {/* Sub-Header Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2>Citizen Grievance Portal</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Submit civic complaints with automated AI routing, guaranteed SLA deadlines, and live public tracking.
          </p>
        </div>

        <div className="nav-tabs">
          <button
            className={`nav-tab-btn ${subTab === 'file' ? 'active' : ''}`}
            onClick={() => setSubTab('file')}
          >
            <Send size={15} />
            File Grievance
          </button>
          <button
            className={`nav-tab-btn ${subTab === 'track' ? 'active' : ''}`}
            onClick={() => setSubTab('track')}
          >
            <Search size={15} />
            Track Grievance
          </button>
        </div>
      </div>

      {/* TAB 1: FILE GRIEVANCE */}
      {subTab === 'file' && (
        <div className="grid-2">
          {/* Left Column: Form */}
          <div className="card">
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--primary)" />
              Lodge Public Grievance
            </h3>

            {/* Quick Demo Presets */}
            <div style={{ marginBottom: '18px', padding: '12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                ⚡ Quick Autofill Test Cases:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => applyPreset('No water supply in my area for 3 days', 'Water supply has completely ceased in Sector 4 Block B. Tap water is totally dry.')}
                >
                  💧 Water Issue
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => applyPreset('Huge pothole near flyover exit', 'Deep dangerous asphalt crater causing two-wheelers to slip during evening rush.')}
                >
                  🛣️ Road Pothole
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => applyPreset('Fallen power line sparking on road', 'Live high-tension electric cable snapped and hanging near the school entrance.')}
                >
                  ⚡ Electric Hazard
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => applyPreset('Rotting garbage dump overflowing', 'Municipal dumpster overflowing with waste onto the sidewalk for over 5 days.')}
                >
                  🧹 Sanitation
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">Citizen Name *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Ramesh Verma"
                    value={formData.citizen_name}
                    onChange={(e) => setFormData({ ...formData, citizen_name: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="+91-9876543210"
                    value={formData.citizen_contact}
                    onChange={(e) => setFormData({ ...formData, citizen_contact: e.target.value })}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Email Address (Optional for notifications)</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="ramesh.verma@example.com"
                  value={formData.citizen_email}
                  onChange={(e) => setFormData({ ...formData, citizen_email: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Grievance Title *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. No water supply in my area for 3 days"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Detailed Description *</label>
                <textarea
                  required
                  rows={4}
                  className="textarea-field"
                  placeholder="Describe location, duration, and urgency of the issue..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Routing Grievance...' : 'Submit Grievance into Grid'}
                <ArrowRight size={16} />
              </button>
            </form>
          </div>

          {/* Right Column: Live Classification Preview & Submission Feedback */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Live AI Router Card */}
            <div className="card" style={{ border: '1px solid var(--border-bright)', background: 'linear-gradient(145deg, #101626, #141C30)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#93C5FD" />
                  Real-Time Auto-Routing Engine
                </h3>
                {isClassifying && <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Analyzing...</span>}
              </div>

              {prediction ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Target Department</span>
                    <strong style={{ color: '#93C5FD' }}>{prediction.department_name}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Auto-Classified Category</span>
                    <strong>{prediction.category_name}</strong>
                  </div>

                  <div className="grid-2">
                    <div style={{ padding: '10px 14px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Guaranteed SLA</span>
                      <strong style={{ color: 'var(--sla-green)', fontSize: '1.1rem' }}>
                        {prediction.default_sla_hours} Hours
                      </strong>
                    </div>
                    <div style={{ padding: '10px 14px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Initial Priority</span>
                      <span className={`badge badge-${prediction.priority === 'CRITICAL' ? 'red' : prediction.priority === 'HIGH' ? 'amber' : 'blue'}`}>
                        {prediction.priority}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Routing Method: <code>{prediction.method}</code></span>
                    <span>Confidence: <strong>{Math.round(prediction.confidence * 100)}%</strong></span>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '0.875rem' }}>
                    Start typing your grievance title or description. The automated classifier will instantly evaluate keywords and suggest the exact department and SLA window.
                  </p>
                </div>
              )}
            </div>

            {/* Submission Confirmation Card */}
            {submittedTicket && (
              <div className="card" style={{ border: '1px solid var(--sla-green)', background: 'rgba(16, 185, 129, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--sla-green)', marginBottom: '12px' }}>
                  <CheckCircle2 size={24} />
                  <h3 style={{ fontSize: '1.1rem', color: 'white' }}>Grievance Registered Successfully!</h3>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Your grievance has been auto-classified and stamped with a strict SLA deadline in the department queue.
                </p>

                <div style={{ padding: '12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Your Official Tracking ID</span>
                  <strong style={{ fontSize: '1.3rem', letterSpacing: '0.05em', color: '#60A5FA' }}>
                    {submittedTicket.tracking_id}
                  </strong>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setSubTab('track');
                    handleTrack(submittedTicket.tracking_id);
                  }}
                >
                  Track Status in Real-Time
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TRACK GRIEVANCE */}
      {subTab === 'track' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Search Header */}
          <div className="card">
            <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
              <h3 style={{ marginBottom: '8px' }}>Track Citizen Grievance Status</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '20px' }}>
                Enter your unique Tracking ID to inspect real-time department queue position, SLA countdown, and resolution audit trail.
              </p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. GG-20260917-7333"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => handleTrack()}
                  disabled={isTracking}
                >
                  <Search size={16} />
                  {isTracking ? 'Searching...' : 'Track'}
                </button>
              </div>

              {/* Sample Ticket Chips */}
              {sampleTickets.length > 0 && (
                <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Try sample ticket:</span>
                  {sampleTickets.slice(0, 4).map((t) => (
                    <button
                      key={t.id}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                      onClick={() => handleTrack(t.tracking_id)}
                    >
                      {t.tracking_id} ({t.department?.code})
                    </button>
                  ))}
                </div>
              )}

              {trackError && (
                <div style={{ marginTop: '16px', color: '#F87171', fontSize: '0.85rem' }}>
                  ⚠️ {trackError}
                </div>
              )}
            </div>
          </div>

          {/* Ticket Detail & Status View */}
          {trackedTicket && (
            <div className="grid-2">
              {/* Left Column: Core Ticket Details */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span className="badge badge-blue" style={{ marginBottom: '6px' }}>
                      {trackedTicket.department?.name || 'General Department'}
                    </span>
                    <h3>{trackedTicket.title}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Filed by {trackedTicket.citizen_name} on {new Date(trackedTicket.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge badge-${trackedTicket.sla_status === 'GREEN' ? 'green' : trackedTicket.sla_status === 'AMBER' ? 'amber' : 'red'}`}>
                      SLA: {trackedTicket.sla_status}
                    </span>
                  </div>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.6 }}>
                  {trackedTicket.description}
                </p>

                {/* SLA Metric Card */}
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SLA Target Window</span>
                    <strong>{trackedTicket.category?.default_sla_hours || 24} Hours</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SLA Deadline</span>
                    <strong style={{ color: trackedTicket.is_breached ? '#F87171' : '#34D399' }}>
                      {trackedTicket.sla_deadline ? new Date(trackedTicket.sla_deadline).toLocaleString() : 'N/A'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hours Remaining</span>
                    <strong style={{ fontSize: '1.1rem', color: trackedTicket.sla_hours_remaining < 0 ? '#F87171' : '#60A5FA' }}>
                      {trackedTicket.sla_hours_remaining !== null ? `${trackedTicket.sla_hours_remaining} hrs` : 'N/A'}
                    </strong>
                  </div>
                </div>

                {/* Assigned Queue & Supervisor Info */}
                <div style={{ padding: '12px', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  <div>Assigned Queue: <strong>{trackedTicket.assigned_to || 'Department Dispatch'}</strong></div>
                  <div>Supervisor Escort: <strong>{trackedTicket.department?.supervisor_email || 'supervisor@grievance.gov.in'}</strong></div>
                </div>

                {trackedTicket.resolution_notes && (
                  <div style={{ marginTop: '16px', padding: '14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)' }}>
                    <strong style={{ color: '#34D399', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>
                      Official Resolution Note:
                    </strong>
                    <p style={{ fontSize: '0.875rem' }}>{trackedTicket.resolution_notes}</p>
                  </div>
                )}
              </div>

              {/* Right Column: Interactive State Machine Stepper & Immutable Audit Logs */}
              <div className="card">
                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} color="var(--primary)" />
                  Resolution Lifecycle & Audit Trail
                </h3>

                {/* Stepper */}
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '32px', marginTop: '12px' }}>
                  {['SUBMITTED', 'ROUTED', 'IN_PROGRESS', 'RESOLVED'].map((step, idx) => {
                    const stepOrder = ['SUBMITTED', 'ROUTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
                    const currentIdx = stepOrder.indexOf(trackedTicket.status);
                    const thisIdx = stepOrder.indexOf(step);
                    const isPassed = currentIdx >= thisIdx;
                    const isEscalated = trackedTicket.status === 'ESCALATED' && step === 'IN_PROGRESS';

                    return (
                      <div key={step} style={{ textAlign: 'center', zIndex: 2, flex: 1 }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: isEscalated ? '#EF4444' : isPassed ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 8px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            border: `2px solid ${isPassed ? 'var(--primary)' : 'var(--border-subtle)'}`,
                          }}
                        >
                          {isPassed ? <CheckCircle size={16} /> : idx + 1}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: isPassed ? 'var(--text-primary)' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {isEscalated ? 'ESCALATED' : step.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Audit Logs List */}
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Immutable Audit History ({trackedTicket.status_logs?.length || 0} events)
                </h4>

                <div className="timeline">
                  {trackedTicket.status_logs?.map((log) => (
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
          )}
        </div>
      )}
    </div>
  );
}
