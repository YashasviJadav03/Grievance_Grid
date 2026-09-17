const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1';

export const api = {
  // Departments & Categories
  async getDepartments() {
    const res = await fetch(`${API_BASE}/departments/`);
    if (!res.ok) throw new Error('Failed to fetch departments');
    return res.json();
  },

  // Auto-Classification Probe
  async classify(title, description) {
    const res = await fetch(`${API_BASE}/classify/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });
    if (!res.ok) throw new Error('Classification failed');
    return res.json();
  },

  // Complaints
  async submitComplaint(data) {
    const res = await fetch(`${API_BASE}/complaints/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to submit complaint');
    }
    return res.json();
  },

  async getComplaints(params = {}) {
    const query = new URLSearchParams();
    if (params.department_id) query.append('department_id', params.department_id);
    if (params.status) query.append('status', params.status);
    if (params.priority) query.append('priority', params.priority);
    if (params.is_breached !== undefined && params.is_breached !== null && params.is_breached !== '') {
      query.append('is_breached', params.is_breached);
    }
    if (params.search) query.append('search', params.search);
    query.append('limit', params.limit || 100);

    const res = await fetch(`${API_BASE}/complaints/?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch complaints');
    return res.json();
  },

  async getComplaint(identifier) {
    const res = await fetch(`${API_BASE}/complaints/${identifier}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Complaint not found');
    }
    return res.json();
  },

  async updateComplaintStatus(complaintId, payload) {
    const res = await fetch(`${API_BASE}/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update complaint status');
    }
    return res.json();
  },

  // SLA Engine & Simulation
  async triggerSLAScan() {
    const res = await fetch(`${API_BASE}/sla/scan`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to trigger SLA scan');
    return res.json();
  },

  async backdateComplaint(trackingId, hoursBack = 24) {
    const res = await fetch(`${API_BASE}/sla/simulate-backdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tracking_id: trackingId, hours_back: hoursBack }),
    });
    if (!res.ok) throw new Error('Backdating failed');
    return res.json();
  },

  // Analytics
  async getAnalyticsOverview() {
    const res = await fetch(`${API_BASE}/analytics/overview`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },
};
