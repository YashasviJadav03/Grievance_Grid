import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { FilePlus, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

const DEMO_PRESETS = [
  {
    label: "Water Supply Interruption",
    title: "Potable water supply interrupted for past 72 hours",
    description: "Municipal piped water supply has completely ceased in Sector 4 Block B since Tuesday morning. Multiple households affected.",
  },
  {
    label: "Roadway Hazard / Pothole",
    title: "Deep roadway pothole at arterial intersection",
    description: "Substantial asphalt subsidence near the central junction causing severe vehicular deceleration and accident risks for two-wheelers.",
  },
  {
    label: "Electrical Power Conductor",
    title: "Live conductor detached from distribution pole",
    description: "High-tension power line has snapped and is suspended dangerously close to the pedestrian walkway near the public school perimeter.",
  },
  {
    label: "Sanitation Waste Overflow",
    title: "Uncollected municipal waste container overflowing",
    description: "Primary colony waste disposal bin has exceeded storage capacity for 5 consecutive days without clearance by sanitation vehicles.",
  },
];

export default function CitizenIntake({ onNavigateToTracker }) {
  const [formData, setFormData] = useState({
    citizen_name: '',
    citizen_contact: '',
    citizen_email: '',
    title: '',
    description: '',
  });

  const [prediction, setPrediction] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);

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
      alert(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
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
    <div className="content-container">
      {/* Page Header */}
      <h1 className="page-title">Public Grievance Registration</h1>
      <p className="page-description">
        Lodge public grievances into the municipal redressal network with automated intent classification, deterministic routing, and statutory SLA protection.
      </p>

      <div className="col-2">
        {/* Form Panel */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <FilePlus size={16} color="var(--color-primary)" />
              Complainant Information & Incident Narrative
            </span>

            {/* Subtle demo dropdown */}
            <select
              className="form-select"
              style={{ width: 'auto', height: '30px', fontSize: '12px' }}
              onChange={(e) => {
                const found = DEMO_PRESETS.find((p) => p.label === e.target.value);
                if (found) handleApplyPreset(found);
              }}
              defaultValue=""
            >
              <option value="" disabled>Load Case Template...</option>
              {DEMO_PRESETS.map((p) => (
                <option key={p.label} value={p.label}>{p.label}</option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="col-2" style={{ gap: 'var(--space-4)' }}>
              <div className="form-field">
                <label className="form-label">
                  Full Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Complainant name"
                  value={formData.citizen_name}
                  onChange={(e) => setFormData({ ...formData, citizen_name: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  Contact Number <span className="req">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="+91-XXXXXXXXXX"
                  value={formData.citizen_contact}
                  onChange={(e) => setFormData({ ...formData, citizen_contact: e.target.value })}
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Email Address (Optional)</label>
              <input
                type="email"
                className="form-input"
                placeholder="complainant@domain.com"
                value={formData.citizen_email}
                onChange={(e) => setFormData({ ...formData, citizen_email: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                Grievance Subject <span className="req">*</span>
              </label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Concise summary of issue"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                Detailed Narrative & Geographical Location <span className="req">*</span>
              </label>
              <textarea
                required
                rows={4}
                className="form-textarea"
                placeholder="Specify street, locality, landmarks, and duration of the problem..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <span className="form-hint">
                The intake pipeline uses keyword semantics to automatically assign department jurisdiction and SLA timecards.
              </span>
            </div>

            <div style={{ marginTop: 'var(--space-6)' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? 'Registering Grievance...' : 'Submit Grievance to Official Registry'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        </div>

        {/* Forecast & Registration Confirmation Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Real-Time Assessment Card */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">
                <ShieldCheck size={16} color="var(--color-primary)" />
                Routing & SLA Assessment
              </span>
              {isClassifying && (
                <span style={{ fontSize: '11px', color: 'var(--color-primary)' }}>Evaluating...</span>
              )}
            </div>

            {prediction ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-gray-100)', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>
                    Target Department Jurisdiction
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-gray-900)', marginTop: '2px' }}>
                    {prediction.department_name}
                  </div>
                </div>

                <div className="col-2" style={{ gap: 'var(--space-3)' }}>
                  <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-gray-100)', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>
                      Category
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-gray-900)', marginTop: '2px' }}>
                      {prediction.category_name}
                    </div>
                  </div>

                  <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-gray-100)', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>
                      Statutory SLA
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--status-green-text)', marginTop: '2px' }}>
                      {prediction.default_sla_hours} Hours
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-gray-500)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-gray-200)' }}>
                  <span>Method: <strong>{prediction.method === 'RULE_BASED' ? 'Regex Match' : 'Statistical TF-IDF'}</strong></span>
                  <span>Confidence: <strong>{Math.round(prediction.confidence * 100)}%</strong></span>
                </div>
              </div>
            ) : (
              <div style={{ padding: 'var(--space-8) var(--space-4)', textAlign: 'center', color: 'var(--color-gray-500)' }}>
                <p style={{ fontSize: '13px' }}>
                  As you enter grievance details, the routing engine will evaluate keywords to forecast the receiving department and statutory turnaround window.
                </p>
              </div>
            )}
          </div>

          {/* Submission Success Notice */}
          {submittedTicket && (
            <div className="panel" style={{ borderLeft: '3px solid var(--status-green-text)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <CheckCircle2 size={18} color="var(--status-green-text)" />
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-gray-900)' }}>
                  Grievance Registered Successfully
                </h3>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--color-gray-700)', marginBottom: 'var(--space-4)' }}>
                Your complaint has been stamped with an SLA deadline and routed to the department's operational queue.
              </p>

              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-gray-100)', borderRadius: 'var(--radius)', marginBottom: 'var(--space-4)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>
                  Statutory Reference Code
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary)', marginTop: '2px' }}>
                  {submittedTicket.tracking_id}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-gray-700)', marginTop: '4px' }}>
                  Assigned Authority: <strong>{submittedTicket.department?.name}</strong>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
                onClick={() => onNavigateToTracker(submittedTicket.tracking_id)}
              >
                <span>Track Status in Real-Time</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
