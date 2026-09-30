import React, { useEffect, useState } from 'react';

import Navbar from './components/Navbar';
import Overview from './components/Overview';
import Patterns from './components/Patterns';
import WhatIfSimulator from './components/WhatIfSimulator';
import Experiments from './components/Experiments';
import Profile from './components/Profile';
import ConnectedDevices from './components/ConnectedDevices';

import { api } from './services/api';

function App() {
  const [userId] = useState('1');

  const [activeTab, setActiveTab] = useState('overview');

  const [lifestyleData, setLifestyleData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedFactorForSimulator, setSelectedFactorForSimulator] =
    useState('screenTime');

  const [prefilledScenarioForExperiment, setPrefilledScenarioForExperiment] =
    useState(null);

  const demoLifestyleData = [
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

  const loadLifestyleData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getLifestyleData(userId);

      const data =
        response?.lifestyleData ||
        response?.data ||
        response;

      if (Array.isArray(data) && data.length > 0) {
        setLifestyleData(data);
      } else {
        setLifestyleData(demoLifestyleData);
      }
    } catch (err) {
      console.log(
        'Using demo lifestyle data:',
        err.message
      );

      setLifestyleData(demoLifestyleData);
      setError(null);
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

  const clearPrefilledScenario = () => {
    setPrefilledScenarioForExperiment(null);
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <Overview
            lifestyleData={lifestyleData}
            loading={loading}
            error={error}
            onRefresh={loadLifestyleData}
            onNavigateToSimulator={() =>
              setActiveTab('simulator')
            }
          />
        );

      case 'patterns':
        return (
          <Patterns
            userId={userId}
            onSelectPatternForSimulation={
              handleSelectPatternForSimulation
            }
          />
        );

      case 'simulator':
        return (
          <WhatIfSimulator
            userId={userId}
            selectedFactor={selectedFactorForSimulator}
            onStartExperimentFromSimulation={
              handleStartExperimentFromSimulation
            }
          />
        );

      case 'experiments':
        return (
          <Experiments
            userId={userId}
            prefilledScenario={
              prefilledScenarioForExperiment
            }
            clearPrefilledScenario={
              clearPrefilledScenario
            }
          />
        );

      case 'profile':
        return <Profile />;

      case 'devices':
        return <ConnectedDevices />;

      default:
        return (
          <Overview
            lifestyleData={lifestyleData}
            loading={loading}
            error={error}
            onRefresh={loadLifestyleData}
            onNavigateToSimulator={() =>
              setActiveTab('simulator')
            }
          />
        );
    }
  };

  return (
    <div className="app-shell">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="main-content">
        {renderActivePage()}
      </main>

      <footer
        style={{
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-subtle)',
          fontSize: '0.8rem'
        }}
      >
        NexWell • Personalized wellness insights
      </footer>
    </div>
  );
}

export default App;