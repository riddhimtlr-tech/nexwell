import React, { useEffect, useState } from 'react';

import './App.css';

import Auth from './components/Auth';
import Navbar from './components/Navbar';
import Overview from './components/Overview';
import Patterns from './components/Patterns';
import WhatIfSimulator from './components/WhatIfSimulator';
import Experiments from './components/Experiments';
import Profile from './components/Profile';
import ConnectedDevices from './components/ConnectedDevices';
import ManualEntry from './components/ManualEntry';

import { api } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('nexwell_token'));
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('nexwell_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [lifestyleData, setLifestyleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedFactorForSimulator, setSelectedFactorForSimulator] =
    useState('screenTime');

  const [prefilledScenarioForExperiment, setPrefilledScenarioForExperiment] =
    useState(null);

  const userId = user?.id;

const loadLifestyleData = async () => {
  if (!userId) {
    setLifestyleData([]);
    setLoading(false);
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const response = await api.getLifestyleData();

    const data =
      response?.lifestyleData ||
      response?.data ||
      response;

    if (Array.isArray(data)) {
      setLifestyleData(data);
    } else {
      setLifestyleData([]);
    }
  } catch (err) {
    console.error('Failed to load lifestyle data:', err);
    setLifestyleData([]);
    setError(err.message || 'Failed to load lifestyle data');
  } finally {
    setLoading(false);
  }
};

  // Wake the Render backend early (free tier sleeps after 15 min idle)
  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL || '/api';
    fetch(`${base}/health-check`).catch(() => {});
  }, []);

  // On startup, ask the backend who this token belongs to (never trust stale localStorage).
  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .getMe()
      .then(({ user: me }) => {
        setUser(me);
        localStorage.setItem('nexwell_user', JSON.stringify(me));
      })
      .catch(() => handleLogout());
  }, [isAuthenticated]);

  // Load this user's data, then keep it fresh so Android syncs show up automatically.
  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    loadLifestyleData();

    const refreshQuietly = () => {
      api
        .getLifestyleData()
        .then((res) => setLifestyleData(Array.isArray(res?.data) ? res.data : []))
        .catch(() => {});
    };

    const interval = setInterval(refreshQuietly, 30000);
    window.addEventListener('focus', refreshQuietly);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refreshQuietly);
    };
  }, [isAuthenticated, userId]);

  // api.js fires this when the token is rejected
  useEffect(() => {
    const onForcedLogout = () => handleLogout();
    window.addEventListener('nexwell:logout', onForcedLogout);
    return () => window.removeEventListener('nexwell:logout', onForcedLogout);
  }, []);

  const handleLogin = (loggedInUser) => {
    // Clear anything left from a previous user before showing the new one
    setLifestyleData([]);
    setError(null);
    setPrefilledScenarioForExperiment(null);
    setUser(loggedInUser);
    setIsAuthenticated(true);
    setActiveTab('overview');
  };

  const handleLogout = () => {
    localStorage.removeItem('nexwell_token');
    localStorage.removeItem('nexwell_user');

    setUser(null);
    setIsAuthenticated(false);
    setLifestyleData([]);
    setActiveTab('overview');
  };

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
          <>
            <ManualEntry onSaved={loadLifestyleData} />
            <Overview
              user={user}
              lifestyleData={lifestyleData}
              loading={loading}
              error={error}
              onRefresh={loadLifestyleData}
              onNavigateToSimulator={() =>
                setActiveTab('simulator')
              }
            />
          </>
        );

      case 'patterns':
        return (
          <Patterns
            key={userId}
            userId={userId}
            onSelectPatternForSimulation={
              handleSelectPatternForSimulation
            }
          />
        );

      case 'simulator':
        return (
          <WhatIfSimulator
            key={userId}
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
            key={userId}
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
        return (
          <Profile
            key={userId}
            user={user}
            onProfileSaved={(p) => {
              const updated = { ...user, name: p.name };
              setUser(updated);
              localStorage.setItem('nexwell_user', JSON.stringify(updated));
            }}
          />
        );

      case 'devices':
        return <ConnectedDevices key={userId} />;

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

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        user={user}
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
