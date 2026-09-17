import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  FilePlus, Search, CheckCircle, Clock, AlertCircle, 
  ArrowRight, Shield, Building2, User, Phone, Mail, 
  FileCheck, ExternalLink, Printer
} from 'lucide-react';

const DEMO_PRESETS = [
  {
    label: "Water Supply Disruption",
    title: "Potable water supply interrupted for past 72 hours",
    description: "Municipal piped water supply has completely ceased in Sector 4 Block B since Tuesday morning. Multiple households affected.",
  },
  {
    label: "Hazardous Road Crater",
    title: "Deep roadway pothole at arterial intersection",
    description: "Substantial asphalt subsidence near the central junction causing severe vehicular deceleration and accident risks for two-wheelers.",
  },
  {
    label: "Electrical Cable Hazard",
    title: "Live conductor detached from distribution pole",
    description: "High-tension power line has snapped and is suspended dangerously close to the pedestrian walkway near the public school perimeter.",
  },
  {
    label: "Solid Waste Overflow",
    title: "Uncollected municipal waste container overflowing",
    description: "Primary colony waste disposal bin has exceeded storage capacity for 5 consecutive days without clearance by sanitation vehicles.",
  },
];

export default function CitizenPortal({ initialTrackingId }) {
  const [activeView, setActiveView] = useState(initialTrackingId ? 'track' : 'lodge');

  // Intake Form State
  const [formData, setFormData] = useState({
    citizen_name: '',
    citizen_contact: '',
    citizen_email: '',
    title: '',
    description: '',
  });

  // Classifier state
  const [prediction, setPrediction] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  // Tracker State
  const [trackingInput, setTrackingInput] = useState(initialTrackingId || '');
  const [trackedTicket, setTrackedTicket] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackError, setTrackError] = useState('');
  const [recentTickets, setRecentTickets] = useState([]);

  // Fetch recent tickets for lookup reference
  useEffect(() => {
    api.getComplaints({ limit: 6 }).then((data) => {
      setRecentTickets(data);
      if (initialTrackingId) {
        handleTrack(initialTrackingId);
      } else if (data.length > 0 && !trackedTicket) {
        handleTrack(data[0].tracking_id);
      }
    }).catch(console.error);
  }, [initialTrackingId]);

  // Debounced real-time classification preview
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
    }, 350);

    return () => clearTimeout(timer);
  }, [formData.title, formData.description]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;

    setIsSubmitting(true);
    try {
      const ticket = await api.submitComplaint(formData);
      setSubmittedTicket(ticket);
      setFormData({
        citizen_name: '',
        citizen_contact: '',
        citizen_email: '',
        title: '',
        description: '',
      });
      setPrediction(null);
    } catch (err) {
      alert(`Submission Error: ${err.message}`);
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
      setTrackError(err.message || 'Reference record could not be found.');
      setTrackedTicket(null);
    } finally {
      setIsTracking(false);
    }
  };

  const handleApplyPreset = (preset) => {
    setFormData({
      citizen_name: 'Ananya Deshmukh',
      citizen_contact: '+91-9820123456',
      citizen_email: 'ananya.deshmukh@example.org',
      title: preset.title,
      description: preset.description,
    });
  };

  return (
    <div>
      {/* Sub-Navigation Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Citizen Redressal Portal</h1>
          <p className="page-subtitle">
            Lodge public grievances with deterministic department routing, statutory SLA turnaround, and end-to-end verification.
          </p>
        </div>

        <div className="nav-menu">
          <button
            className={`nav-link ${activeView === 'lodge' ? 'active' : ''}`}
            onClick={() => setActiveView('lodge')}
          >
            <FilePlus size={15} />
            Lodge Grievance
          </button>
          <button
            className={`nav-link ${activeView === 'track' ? 'active' : ''}`}
            onClick={() => setActiveView('track')}
          >
            <Search size={15} />
            Track Status
          </button>
        </div>
      </div>

      {/* VIEW 1: LODGE GRIEVANCE */}
      {activeView === 'lodge' && (
        <div className="grid-2">
          {/* Main Submission Form */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <FilePlus size={16} color="var(--primary-600)" />
                Public Grievance Intake Form
              </span>

              {/* Unobtrusive Test Preset Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Template:</span>
                <select
                  className="form-select"
                  style={{ width: 'auto', padding: '4px 8px', fontSize: '0.75rem' }}
                  onChange={(e) => {
                    const found = DEMO_PRESETS.find((p) => p.label === e.target.value);
                    if (found) handleApplyPreset(found);
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Load Case Example...</option>
                  {DEMO_PRESETS.map((p) => (
                    <option key={p.label} value={p.label}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Enter complainant name"
                    value={formData.citizen_name}
                    onChange={(e) => setFormData({ ...formData, citizen_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Contact Number <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="+91-XXXXXXXXXX"
                    value={formData.citizen_contact}
                    onChange={(e) => setFormData({ ...formData, citizen_contact: e.target.value })}
                  />
                  <span className="form-hint">Used for dispatch confirmation & SLA milestone alerts.</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Optional)</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="complainant@domain.com"
                  value={formData.citizen_email}
                  onChange={(e) => setFormData({ ...formData, citizen_email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Grievance Subject <span className="required">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Concise summary of the civic grievance"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Detailed Narrative & Specific Location <span className="required">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  className="form-textarea"
                  placeholder="State the exact geographical location, duration, and nature of the issue..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <span className="form-hint">
                  The automated classifier utilizes keyword context to route directly to the designated department.
                </span>
              </div>

              <div style={{ marginTop: '24px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registering Grievance...' : 'Submit Grievance to Official Registry'}
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Routing Assessment & Registration Acknowledgement */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Real-time Forecast Panel */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">
                  <Shield size={16} color="var(--primary-600)" />
                  Automated Routing & SLA Assessment
                </span>
                {isClassifying && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary-600)', fontWeight: 600 }}>
                    Evaluating text...
                  </span>
                )}
              </div>

              {prediction ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ padding: '14px', background: 'var(--bg-card-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>
                      Designated Redressal Authority
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                      {prediction.department_name}
                    </div>
                  </div>

                  <div className="grid-2">
                    <div style={{ padding: '12px', background: 'var(--bg-card-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Categorization
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '2px' }}>
                        {prediction.category_name}
                      </div>
                    </div>

                    <div style={{ padding: '12px', background: 'var(--bg-card-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Statutory SLA Window
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--status-green-text)', marginTop: '2px' }}>
                        {prediction.default_sla_hours} Hours
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                    <span>Classification Pipeline: <strong>{prediction.method === 'RULE_BASED' ? 'Deterministic Regex Match' : 'Statistical TF-IDF'}</strong></span>
                    <span>Confidence: <strong>{Math.round(prediction.confidence * 100)}%</strong></span>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <Building2 size={28} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                  <p>
                    As you draft your grievance, the routing engine will evaluate terminology to determine the exact department jurisdiction and SLA turnaround target.
                  </p>
                </div>
              )}
            </div>

            {/* Official Registration Receipt Card */}
            {submittedTicket && (
              <div className="card" style={{ border: '1px solid var(--status-green-border)', backgroundColor: '#FAFAF9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--status-green-text)', marginBottom: '14px' }}>
                  <FileCheck size={22} />
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Registration Acknowledged</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Statutory Reference Generated</span>
                  </div>
                </div>

                <div style={{ padding: '16px', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Official Tracking Number
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary-700)', letterSpacing: '0.04em', marginTop: '2px' }}>
                    {submittedTicket.tracking_id}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    Assigned to: <strong>{submittedTicket.department?.name}</strong>
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setActiveView('track');
                    handleTrack(submittedTicket.tracking_id);
                  }}
                >
                  Inspect Redressal Status & SLA Countdown
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: TRACK STATUS */}
      {activeView === 'track' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Reference Lookup Panel */}
          <div className="card">
            <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Public Grievance Status Verification</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '18px' }}>
                Enter your official tracking reference number to inspect department queue progression, SLA countdown, and resolution notes.
              </p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. GG-20260917-7436"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => handleTrack()}
                  disabled={isTracking}
                >
                  <Search size={15} />
                  {isTracking ? 'Verifying...' : 'Search'}
                </button>
              </div>

              {recentTickets.length > 0 && (
                <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recent submissions:</span>
                  {recentTickets.slice(0, 4).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                      onClick={() => handleTrack(t.tracking_id)}
                    >
                      {t.tracking_id}
                    </button>
                  ))}
                </div>
              )}

              {trackError && (
                <div style={{ marginTop: '14px', color: 'var(--status-red-text)', fontSize: '0.825rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <AlertCircle size={15} />
                  {trackError}
                </div>
              )}
            </div>
          </div>

          {/* Grievance Ledger & Timeline Details */}
          {trackedTicket && (
            <div className="grid-2">
              {/* Left Column: Official Case Dossier */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <span className="badge badge-blue" style={{ marginBottom: '6px' }}>
                      {trackedTicket.department?.name || 'Departmental Registry'}
                    </span>
                    <h3 style={{ fontSize: '1.15rem' }}>{trackedTicket.title}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Tracking ID: <strong style={{ fontFamily: 'monospace' }}>{trackedTicket.tracking_id}</strong>
                    </div>
                  </div>

                  <span className={`badge badge-${trackedTicket.sla_status === 'GREEN' ? 'green' : trackedTicket.sla_status === 'AMBER' ? 'amber' : 'red'}`}>
                    SLA State: {trackedTicket.sla_status}
                  </span>
                </div>

                <div style={{ padding: '14px', background: 'var(--bg-card-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: '20px' }}>
                  {trackedTicket.description}
                </div>

                {/* Statutory SLA Schedule */}
                <div style={{ padding: '16px', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)', marginBottom: '8px', fontSize: '0.825rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Lodged Date & Time</span>
                    <strong>{new Date(trackedTicket.created_at).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)', marginBottom: '8px', fontSize: '0.825rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Standard Resolution SLA</span>
                    <strong>{trackedTicket.category?.default_sla_hours || 24} Hours</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)', marginBottom: '8px', fontSize: '0.825rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Statutory Resolution Deadline</span>
                    <strong style={{ color: trackedTicket.is_breached ? 'var(--status-red-text)' : 'var(--status-green-text)' }}>
                      {trackedTicket.sla_deadline ? new Date(trackedTicket.sla_deadline).toLocaleString() : 'Not Assigned'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Turnaround Balance</span>
                    <strong style={{ color: trackedTicket.sla_hours_remaining < 0 ? 'var(--status-red-text)' : 'var(--primary-700)' }}>
                      {trackedTicket.sla_hours_remaining !== null ? `${trackedTicket.sla_hours_remaining} hrs remaining` : 'Resolved'}
                    </strong>
                  </div>
                </div>

                {/* Responsible Nodal Point */}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-card-secondary)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
                  <div>Operating Queue: <strong>{trackedTicket.assigned_to || 'Department Operational Dispatch'}</strong></div>
                  <div>Escalation Supervisor: <strong>{trackedTicket.department?.supervisor_email || 'supervisor@grievance.gov.in'}</strong></div>
                </div>

                {trackedTicket.resolution_notes && (
                  <div style={{ marginTop: '16px', padding: '14px', background: 'var(--status-green-bg)', border: '1px solid var(--status-green-border)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--status-green-text)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Official Disposal & Resolution Summary:
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{trackedTicket.resolution_notes}</p>
                  </div>
                )}
              </div>

              {/* Right Column: Formal Lifecycle Stepper & Audit Log */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">
                    <Clock size={16} color="var(--primary-600)" />
                    Redressal Progression & Immutable Audit
                  </span>
                </div>

                {/* Stepper */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px', padding: '0 8px' }}>
                  {['SUBMITTED', 'ROUTED', 'IN_PROGRESS', 'RESOLVED'].map((step, idx) => {
                    const stepOrder = ['SUBMITTED', 'ROUTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
                    const currentIdx = stepOrder.indexOf(trackedTicket.status);
                    const thisIdx = stepOrder.indexOf(step);
                    const isPassed = currentIdx >= thisIdx;
                    const isEscalated = trackedTicket.status === 'ESCALATED' && step === 'IN_PROGRESS';

                    return (
                      <div key={step} style={{ textAlign: 'center', flex: 1, position: 'relative' }}>
                        <div
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            backgroundColor: isEscalated ? 'var(--status-red-bg)' : isPassed ? 'var(--primary-600)' : '#FFFFFF',
                            color: isEscalated ? 'var(--status-red-text)' : isPassed ? '#FFFFFF' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            border: `2px solid ${isEscalated ? 'var(--status-red-border)' : isPassed ? 'var(--primary-600)' : 'var(--border-medium)'}`,
                          }}
                        >
                          {isPassed ? '✓' : idx + 1}
                        </div>
                        <span style={{ fontSize: '0.675rem', fontWeight: 600, color: isPassed ? 'var(--text-primary)' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {isEscalated ? 'ESCALATED' : step.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Audit Ledger */}
                <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Chronological Audit Log ({trackedTicket.status_logs?.length || 0} Recorded Actions)
                </div>

                <div className="timeline">
                  {trackedTicket.status_logs?.map((log) => (
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
                          Recorded by: <strong>{log.changed_by}</strong>
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
