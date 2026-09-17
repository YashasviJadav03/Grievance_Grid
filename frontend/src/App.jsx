import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import OfficerDashboard from './components/OfficerDashboard';
import CitizenIntake from './components/CitizenIntake';
import CitizenTracker from './components/CitizenTracker';
import AdminAnalytics from './components/AdminAnalytics';
import SLADiagnostics from './components/SLADiagnostics';
import { ToastProvider, useToast } from './components/Toast';
import { api } from './api';

function AppContent() {
  const [activeTab, setActiveTab] = useState('officer');
  const [trackedId, setTrackedId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const toast = useToast();

  const handleTriggerScan = async () => {
    setIsScanning(true);
    try {
      const res = await api.triggerSLAScan();
      const { scanned_count, escalated_count, at_risk_count } = res.result;
      if (escalated_count > 0) {
        toast.warning(`SLA Scan: ${scanned_count} evaluated, ${escalated_count} escalated to supervisors.`);
      } else if (at_risk_count > 0) {
        toast.info(`SLA Scan: ${scanned_count} evaluated, ${at_risk_count} at risk.`);
      } else {
        toast.success(`SLA Scan: ${scanned_count} complaints evaluated, all compliant.`);
      }
    } catch (err) {
      toast.error(`SLA Scan Error: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="app-main">
        <TopBar
          activeTab={activeTab}
          onTriggerScan={handleTriggerScan}
          isScanning={isScanning}
        />

        <main>
          {activeTab === 'officer' && <OfficerDashboard />}

          {activeTab === 'citizen_intake' && (
            <CitizenIntake
              onNavigateToTracker={(id) => {
                setTrackedId(id);
                setActiveTab('citizen_track');
              }}
            />
          )}

          {activeTab === 'citizen_track' && (
            <CitizenTracker initialTrackingId={trackedId} />
          )}

          {activeTab === 'analytics' && <AdminAnalytics />}

          {activeTab === 'simulator' && (
            <SLADiagnostics onNavigateToOfficer={() => setActiveTab('officer')} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
