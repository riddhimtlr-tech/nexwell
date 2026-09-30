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

  const [lifestyleData, setLifestyleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedFactorForSimulator, setSelectedFactorForSimulator] =
    useState('screenTime');

  const [prefilledScenarioForExperiment, setPrefilledScenarioForExperiment] =
    useState(null);

  const loadLifestyleData = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.getLifestyleData(userId);
      setLifestyleData(res.data || []);
    } catch (err) {
      console.warn('Backend unavailable, using demo lifestyle data.');

      const demoData = [
        {
          date: '2026-09-24',
          sleep: 6.8,
          steps: 7420,
          screenTime: 6.2,
          activity: 34,
          heartRate: 74,
          energy: 6.1
        },
        {
          date: '2026-09-25',
          sleep: 7.1,
          steps: 8150,
          screenTime: 5.7,
          activity: 42,
          heartRate: 72,
          energy: 6.7
        },
        {
          date: '2026-09-26',
          sleep: 7.4,
          steps: 9210,
          screenTime: 5.1,
          activity: 48,
          heartRate: 71,
          energy: 7.2
        },
        {
          date: '2026-09-27',
          sleep: 6.9,
          steps: 6800,
          screenTime: 6.5,
          activity: 30,
          heartRate: 75,
          energy: 6.0
        },
        {
          date: '2026-09-28',
          sleep: 7.3,
          steps: 9840,
          screenTime: 4.8,
          activity: 52,
          heartRate: 70,
          energy: 7.5
        },
        {
          date: '2026-09-29',
          sleep: 7.2,
          steps: 9850,
          screenTime: 5.0,
          activity: 46,
          heartRate: 72,
          energy: 7.3
        }
      ];

      setLifestyleData(demoData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLifestyleData();
  }, [userId]);

  const handleSelectPatternForSimulation = (factor) => {
    setSelectedFactorForSimulator(factor);
    setActiveTab('simulator');
  };

  const handleStartExperimentFromSimulation = (scenario) => {
    setPrefilledScenarioForExperiment(scenario);
    setActiveTab('experiments');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userId={userId}
        setUserId={setUserId}
      />

      <main className="app-container" style={{ flex: 1 }}>
        {activeTab === 'overview' && (
          <Overview
            lifestyleData={lifestyleData}
            loading={loading}
            error={error}
            onRefresh={loadLifestyleData}
            onNavigateToSimulator={() => setActiveTab('simulator')}
          />
        )}

        {activeTab === 'patterns' && (
          <Patterns
            userId={userId}
            onSelectPatternForSimulation={
              handleSelectPatternForSimulation
            }
          />
        )}

        {activeTab === 'simulator' && (
          <WhatIfSimulator
            userId={userId}
            selectedFactor={selectedFactorForSimulator}
            onStartExperimentFromSimulation={
              handleStartExperimentFromSimulation
            }
          />
        )}

        {activeTab === 'experiments' && (
          <Experiments
            userId={userId}
            prefilledScenario={prefilledScenarioForExperiment}
            clearPrefilledScenario={() =>
              setPrefilledScenarioForExperiment(null)
            }
          />
        )}
      </main>

      <footer
        style={{
          borderTop: '1px solid var(--border-color)',
          padding: '24px 0',
          color: 'var(--text-subtle)',
          fontSize: '0.85rem',
          marginTop: '60px',
          textAlign: 'center'
        }}
      >
        <div className="app-container" style={{ paddingBottom: 0 }}>
          <p>
            NexWell • Personal Lifestyle Experimentation Engine •
            Powered by PostgreSQL & Python Data Engines
          </p>
        </div>
      </footer>
    </div>
  );
}