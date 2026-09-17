import React, { useState } from 'react';
import Navbar from './components/Navbar';
import CitizenPortal from './components/CitizenPortal';
import OfficerDashboard from './components/OfficerDashboard';
import AdminAnalytics from './components/AdminAnalytics';
import SLASimulator from './components/SLASimulator';
import { api } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('citizen');
  const [trackedId, setTrackedId] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleTriggerScan = async () => {
    setIsScanning(true);
    try {
      const res = await api.triggerSLAScan();
      alert(`SLA Sweep completed. Scanned: ${res.result.scanned_count}, Escalated: ${res.result.escalated_count}`);
    } catch (err) {
      alert(`SLA Sweep failed: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTriggerScan={handleTriggerScan}
        isScanning={isScanning}
      />

      <main className="main-content">
        {activeTab === 'citizen' && (
          <CitizenPortal
            initialTrackingId={trackedId}
            onOpenTracker={(id) => {
              setTrackedId(id);
              setActiveTab('citizen');
            }}
          />
        )}

        {activeTab === 'officer' && <OfficerDashboard />}

        {activeTab === 'analytics' && <AdminAnalytics />}

        {activeTab === 'simulator' && (
          <SLASimulator
            onNavigateToOfficer={() => setActiveTab('officer')}
          />
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--border-light)', backgroundColor: '#FFFFFF', padding: '20px 24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Grievance Grid — Autonomous Public Grievance Routing & SLA Accountability Platform. Enterprise GovTech Architecture.
      </footer>
    </div>
  );
}
