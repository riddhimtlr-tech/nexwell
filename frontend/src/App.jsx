import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Overview from './components/Overview';
import Patterns from './components/Patterns';
import WhatIfSimulator from './components/WhatIfSimulator';
import Experiments from './components/Experiments';
import { api } from './services/api';

export default function App() {
  const [userId, setUserId] = useState('1');
  const [activeTab, setActiveTab] = useState('overview');

  // Lifestyle data state
  const [lifestyleData, setLifestyleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cross-component state transfers
  const [selectedFactorForSimulator, setSelectedFactorForSimulator] = useState('screenTime');
  const [prefilledScenarioForExperiment, setPrefilledScenarioForExperiment] = useState(null);

  // Fetch lifestyle history
  const loadLifestyleData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getLifestyleData(userId);
      setLifestyleData(res.data || []);
    } catch (err) {
      console.error('Error fetching lifestyle data:', err);
      setError(err.message || 'Failed to fetch lifestyle data from backend on http://localhost:5001');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLifestyleData();
  }, [userId]);

  // Handler: Pattern -> Simulator
  const handleSelectPatternForSimulation = (factor) => {
    setSelectedFactorForSimulator(factor);
    setActiveTab('simulator');
  };

  // Handler: Simulator -> Experiment
  const handleStartExperimentFromSimulation = (scenario) => {
    setPrefilledScenarioForExperiment(scenario);
    setActiveTab('experiments');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navbar with Sticky Header & User Selector */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userId={userId}
        setUserId={setUserId}
      />

      {/* Main Content Body */}
      <main className="app-container" style={{ flex: 1 }}>
        
        {/* Tab 1: Overview & Track */}
        {activeTab === 'overview' && (
          <Overview
            lifestyleData={lifestyleData}
            loading={loading}
            error={error}
            onRefresh={loadLifestyleData}
            onNavigateToSimulator={() => setActiveTab('simulator')}
          />
        )}

        {/* Tab 2: Discover Patterns */}
        {activeTab === 'patterns' && (
          <Patterns
            userId={userId}
            onSelectPatternForSimulation={handleSelectPatternForSimulation}
          />
        )}

        {/* Tab 3: What-If Simulator (Hero) */}
        {activeTab === 'simulator' && (
          <WhatIfSimulator
            userId={userId}
            selectedFactor={selectedFactorForSimulator}
            onStartExperimentFromSimulation={handleStartExperimentFromSimulation}
          />
        )}

        {/* Tab 4: 7-Day Experiments & Measure Results */}
        {activeTab === 'experiments' && (
          <Experiments
            userId={userId}
            prefilledScenario={prefilledScenarioForExperiment}
            clearPrefilledScenario={() => setPrefilledScenarioForExperiment(null)}
          />
        )}

      </main>

      {/* Modern Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '24px 0',
        color: 'var(--text-subtle)',
        fontSize: '0.85rem',
        marginTop: '60px',
        textAlign: 'center'
      }}>
        <div className="app-container" style={{ paddingBottom: 0 }}>
          <p>
            NexWell • Personal Lifestyle Experimentation Engine • Powered by PostgreSQL & Python Data Engines
          </p>
        </div>
      </footer>

    </div>
  );
}
