import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from './Toast';
import { FilePlus, ArrowRight, ShieldCheck, CheckCircle2, Copy, Sparkles } from 'lucide-react';

const DEMO_PRESETS = [
  {
    icon: "💧",
    label: "Water Supply Outage",
    title: "Potable water supply interrupted for past 72 hours",
    description: "Municipal piped water supply has completely ceased in Sector 4 Block B since Tuesday morning. Multiple households affected.",
  },
  {
    icon: "🕳️",
    label: "Roadway Pothole",
    title: "Deep roadway pothole at arterial intersection",
    description: "Substantial asphalt subsidence near the central junction causing severe vehicular deceleration and accident risks for two-wheelers.",
  },
  {
    icon: "⚡",
    label: "Fallen Power Line",
    title: "Live conductor detached from distribution pole",
    description: "High-tension power line has snapped and is suspended dangerously close to the pedestrian walkway near the public school perimeter.",
  },
  {
    icon: "🗑️",
    label: "Garbage Overflow",
    title: "Uncollected municipal waste container overflowing",
    description: "Primary colony waste disposal bin has exceeded storage capacity for 5 consecutive days without clearance by sanitation vehicles.",
  },
];

export default function CitizenIntake({ onNavigateToTracker }) {
  const toast = useToast();
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
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.title, formData.description]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.warning('Please enter a title and description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ticket = await api.submitComplaint(formData);
      setSubmittedTicket(ticket);
      toast.success(`Grievance registered! Tracking ID: ${ticket.tracking_id}`);
      setFormData({
        citizen_name: '',
        citizen_contact: '',
        citizen_email: '',
        title: '',
        description: '',
      });
      setPrediction(null);
    } catch (err) {
      toast.error(`Submission failed: ${err.message}`);
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
    toast.info(`Loaded preset: ${preset.label}`);
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    toast.success('Tracking ID copied to clipboard!');
  };

  return (
    <div className="content-container">
      {/* Header */}
      <div className="view-header">
        <div className="view-header-main">
          <h1 className="page-title">Register Grievance</h1>
          <p className="page-description">
            Submit a civic complaint with automated departmental routing and SLA guarantee.
          </p>
        </div>
      </div>

      {/* 1-Click Quick Preset Chips */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-gray-500)', marginBottom: '8px' }}>
          Quick Incident Templates:
        </div>
        <div className="preset-chips-row">
          {DEMO_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="preset-chip-btn"
              onClick={() => handleApplyPreset(preset)}
            >
              <span style={{ marginRight: '6px' }}>{preset.icon}</span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="col-2">
        {/* Form Panel */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <FilePlus size={16} color="var(--color-primary)" />
              Complaint Details
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="col-2" style={{ gap: 'var(--space-3)' }}>
              <div className="form-field">
                <label className="form-label">
                  Your Full Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Rahul Verma"
                  value={formData.citizen_name}
                  onChange={(e) => setFormData({ ...formData, citizen_name: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  Mobile Number <span className="req">*</span>
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
                placeholder="name@example.com"
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
                placeholder="Brief summary of the issue"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                Location & Description <span className="req">*</span>
              </label>
              <textarea
                required
                rows={4}
                className="form-textarea"
                placeholder="Include landmark, locality, and how long the issue has persisted..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div style={{ marginTop: 'var(--space-5)' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px 18px', fontSize: '14px' }}
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? 'Submitting Grievance...' : 'Submit Grievance'}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </div>

        {/* Right Panel: Auto-Classification Intelligence & Success State */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Real-Time Assessment Card */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">
                <Sparkles size={16} color="var(--color-primary)" />
                Auto-Routing Prediction
              </span>
              {isClassifying && (
                <span style={{ fontSize: '11px', color: 'var(--color-primary)' }}>Analyzing...</span>
              )}
            </div>

            {prediction ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-gray-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-gray-200)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>
                    Assigned Department
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-gray-900)', marginTop: '2px' }}>
                    {prediction.department_name}
                  </div>
                </div>

                <div className="col-2" style={{ gap: 'var(--space-3)' }}>
                  <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-gray-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-gray-200)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>
                      Category
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-gray-800)', marginTop: '2px' }}>
                      {prediction.category_name}
                    </div>
                  </div>

                  <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--status-green-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-green-border)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--status-green-text)', textTransform: 'uppercase' }}>
                      SLA Deadline
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--status-green-text)', marginTop: '2px' }}>
                      {prediction.default_sla_hours} Hours
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-gray-500)', paddingTop: 'var(--space-2)' }}>
                  <span>Engine: <strong>{prediction.method === 'RULE_BASED' ? 'Keyword Match' : 'ML Classifier'}</strong></span>
                  <span>Confidence: <strong>{Math.round(prediction.confidence * 100)}%</strong></span>
                </div>
              </div>
            ) : (
              <div style={{ padding: 'var(--space-8) var(--space-4)', textAlign: 'center', color: 'var(--color-gray-400)' }}>
                <ShieldCheck size={36} style={{ margin: '0 auto var(--space-2)', opacity: 0.35 }} />
                <p style={{ fontSize: '13px', color: 'var(--color-gray-500)' }}>
                  Start typing your grievance to see real-time department routing and SLA prediction.
                </p>
              </div>
            )}
          </div>

          {/* Submission Success Notice */}
          {submittedTicket && (
            <div className="panel" style={{ borderLeft: '4px solid var(--status-green-text)', backgroundColor: '#F9FEFB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
                <CheckCircle2 size={18} color="var(--status-green-text)" />
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-gray-900)' }}>
                  Grievance Submitted Successfully
                </h3>
              </div>

              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-green-border)', marginBottom: 'var(--space-4)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>
                  Your Tracking ID
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '17px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary)' }}>
                    {submittedTicket.tracking_id}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleCopyId(submittedTicket.tracking_id)}
                    title="Copy Tracking ID"
                  >
                    <Copy size={13} />
                    <span>Copy</span>
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginTop: '6px' }}>
                  Routed to: <strong>{submittedTicket.department?.name}</strong>
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
