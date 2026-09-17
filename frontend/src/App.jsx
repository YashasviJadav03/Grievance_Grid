import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import OfficerDashboard from './components/OfficerDashboard';
import CitizenIntake from './components/CitizenIntake';
import CitizenTracker from './components/CitizenTracker';
import AdminAnalytics from './components/AdminAnalytics';
import SLADiagnostics from './components/SLADiagnostics';
import { api } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('officer');
  const [trackedId, setTrackedId] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleTriggerScan = async () => {
    setIsScanning(true);
    try {
      const res = await api.triggerSLAScan();
      alert(`SLA Scan Complete: ${res.result.scanned_count} complaints evaluated, ${res.result.escalated_count} escalated.`);
    } catch (err) {
      alert(`SLA Scan Error: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="app-layout">
      {/* Professional Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
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
            <CitizenTracker
              initialTrackingId={trackedId}
            />
          )}

          {activeTab === 'analytics' && <AdminAnalytics />}

          {activeTab === 'simulator' && (
            <SLADiagnostics
              onNavigateToOfficer={() => setActiveTab('officer')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
