import React, { useState, useEffect } from 'react';

import { api } from '../services/api';

import {
  FlaskConical,
  Sliders,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Moon,
  Zap,
  Play,
  ShieldAlert,
  Info,
} from 'lucide-react';

export default function WhatIfSimulator({
  userId,
  selectedFactor,
  onStartExperimentFromSimulation,
}) {
  const [field, setField] = useState(selectedFactor || 'screenTime');

  const [delta, setDelta] = useState(
    field === 'screenTime' ? -2 : field === 'steps' ? 2000 : 30
  );

  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /*
   * OFFLINE FRONTEND MODE
   *
   * Keep this true while the backend/database is not available.
   * When Riddhi reconnects the backend, change this to false.
   */
  const USE_OFFLINE_DEMO = true;

  /*
   * Temporary frontend-only simulation.
   *
   * This gives us realistic-looking demo results while developing
   * the UI without depending on the backend/database.
   */
  const runOfflineSimulation = (factor, change) => {
    const baselines = {
      screenTime: {
        sleep: 7.2,
        energy: 7.3,
      },
      steps: {
        sleep: 7.2,
        energy: 7.3,
      },
      activity: {
        sleep: 7.2,
        energy: 7.3,
      },
    };

    const baseline = baselines[factor] || baselines.screenTime;

    let sleepChange = 0;
    let energyChange = 0;

    if (factor === 'screenTime') {
      sleepChange = -change * 0.18;
      energyChange = -change * 0.35;
    } else if (factor === 'steps') {
      sleepChange = change * 0.00004;
      energyChange = change * 0.00008;
    } else if (factor === 'activity') {
      sleepChange = change * 0.006;
      energyChange = change * 0.012;
    }

    const estimatedSleep = Math.max(
      0,
      Math.min(12, baseline.sleep + sleepChange)
    );

    const estimatedEnergy = Math.max(
      0,
      Math.min(10, baseline.energy + energyChange)
    );

    return {
      current: {
        sleep: Number(baseline.sleep.toFixed(1)),
        energy: Number(baseline.energy.toFixed(1)),
      },

      estimated: {
        sleep: Number(estimatedSleep.toFixed(1)),
        energy: Number(estimatedEnergy.toFixed(1)),
      },

      confidence: 'demo',
    };
  };

  /*
   * Sync field if selectedFactor changes externally.
   */
  useEffect(() => {
    if (selectedFactor) {
      setField(selectedFactor);

      if (selectedFactor === 'screenTime') {
        setDelta(-2);
      } else if (selectedFactor === 'steps') {
        setDelta(2000);
      } else if (selectedFactor === 'activity') {
        setDelta(30);
      }
    }
  }, [selectedFactor]);

  /*
   * Run simulation.
   *
   * Offline mode is used for frontend development.
   *
   * When the backend is ready, set USE_OFFLINE_DEMO to false.
   * The existing API integration will then be used.
   */
  const handleSimulate = async () => {
    setLoading(true);
    setError(null);

    try {
      if (USE_OFFLINE_DEMO) {
        // Small delay so the UI still feels like a real simulation.
        await new Promise((resolve) => setTimeout(resolve, 350));

        const result = runOfflineSimulation(field, delta);

        setSimulationResult(result);

        return;
      }

      /*
       * REAL BACKEND INTEGRATION
       *
       * Riddhi can reconnect the backend later by setting
       * USE_OFFLINE_DEMO to false.
       */
      const res = await api.runSimulation(userId, field, delta);

      setSimulationResult(res.simulation || res);
    } catch (err) {
      setError(
        err.message ||
          'Unable to run simulation. Please verify backend connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Run initial simulation when the component loads
   * or when the selected factor changes.
   */
  useEffect(() => {
    handleSimulate();
  }, [userId, field]);

  /*
   * Adjust default delta when factor changes.
   */
  const handleFieldChange = (newField) => {
    setField(newField);

    if (newField === 'screenTime') {
      setDelta(-2);
    } else if (newField === 'steps') {
      setDelta(2000);
    } else if (newField === 'activity') {
      setDelta(30);
    }
  };

  /*
   * Human-readable labels.
   */
  const formatLabel = (factor) => {
    const labels = {
      screenTime: 'Screen Time',
      sleep: 'Sleep',
      steps: 'Steps',
      activity: 'Activity',
      heartRate: 'Heart Rate',
      energy: 'Energy',
    };

    return labels[factor] || factor;
  };

  /*
   * Units used for each factor.
   */
  const getDeltaUnit = (factor) => {
    if (factor === 'screenTime') return 'hrs';
    if (factor === 'steps') return 'steps';
    if (factor === 'activity') return 'mins';

    return '';
  };

  const current = simulationResult?.current || {};
  const estimated = simulationResult?.estimated || {};
  const confidence = simulationResult?.confidence || 'estimate';

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
      }}
    >
      {/* 1. Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <span
            className="badge badge-emerald"
            style={{ marginBottom: '8px' }}
          >
            Stage 3: Simulate
          </span>

          <h1 className="section-title">What-If Simulator</h1>

          <p
            className="section-subtitle"
            style={{ marginBottom: 0 }}
          >
            Explore how a proposed lifestyle adjustment might change
            estimated sleep and energy outcomes.
          </p>
        </div>

        <div
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            color: 'var(--emerald-main)',
            fontWeight: 600,
          }}
        >
          <FlaskConical size={16} />
          Interactive Predictive Sandbox
        </div>
      </div>

      {/* 2. Helper information */}
      <div
        className="nex-card"
        style={{
          background: 'rgba(99, 102, 241, 0.06)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        <Info
          size={20}
          color="var(--indigo-main)"
          style={{ flexShrink: 0 }}
        />

        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            lineHeight: '1.5',
            margin: 0,
          }}
        >
          <strong style={{ color: '#FFF' }}>How it works:</strong>{' '}
          Choose a lifestyle factor to adjust and explore a possible
          change. The current frontend demo uses sample data and an
          illustrative model. Real historical-data predictions can be
          connected when the backend is ready.
        </p>
      </div>

      {/* 3. Simulator layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'minmax(300px, 1fr) minmax(340px, 1.2fr)',
          gap: '24px',
        }}
      >
        {/* Left: Configure Scenario */}
        <div
          className="nex-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '14px',
            }}
          >
            <Sliders
              size={20}
              color="var(--emerald-main)"
            />

            <h3
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#FFF',
              }}
            >
              1. Configure Proposed Scenario
            </h3>
          </div>

          {/* Factor Selection */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '8px',
              }}
            >
              Lifestyle Factor to Adjust
            </label>

            <select
              value={field}
              onChange={(e) =>
                handleFieldChange(e.target.value)
              }
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: '#FFF',
                fontWeight: 600,
                fontSize: '0.95rem',
                outline: 'none',
              }}
            >
              <option value="screenTime">
                Screen Time (hours)
              </option>

              <option value="steps">
                Steps (daily count)
              </option>

              <option value="activity">
                Activity (minutes)
              </option>
            </select>
          </div>

          {/* Proposed Change */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <label
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                }}
              >
                Proposed Change (Delta)
              </label>

              <span
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: 'var(--emerald-main)',
                }}
              >
                {delta > 0 ? `+${delta}` : delta}{' '}
                {getDeltaUnit(field)}
              </span>
            </div>

            {/* Screen Time Slider */}
            {field === 'screenTime' && (
              <input
                type="range"
                min="-5"
                max="5"
                step="0.5"
                value={delta}
                onChange={(e) =>
                  setDelta(Number(e.target.value))
                }
                style={{
                  width: '100%',
                  accentColor: 'var(--emerald-main)',
                  cursor: 'pointer',
                }}
              />
            )}

            {/* Steps Slider */}
            {field === 'steps' && (
              <input
                type="range"
                min="-5000"
                max="10000"
                step="500"
                value={delta}
                onChange={(e) =>
                  setDelta(Number(e.target.value))
                }
                style={{
                  width: '100%',
                  accentColor: 'var(--emerald-main)',
                  cursor: 'pointer',
                }}
              />
            )}

            {/* Activity Slider */}
            {field === 'activity' && (
              <input
                type="range"
                min="-60"
                max="90"
                step="5"
                value={delta}
                onChange={(e) =>
                  setDelta(Number(e.target.value))
                }
                style={{
                  width: '100%',
                  accentColor: 'var(--emerald-main)',
                  cursor: 'pointer',
                }}
              />
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--text-subtle)',
                marginTop: '4px',
              }}
            >
              <span>Decrease (-)</span>
              <span>Increase (+)</span>
            </div>
          </div>

          {/* Preset Scenarios */}
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-subtle)',
                fontWeight: 700,
                display: 'block',
                marginBottom: '8px',
                letterSpacing: '0.05em',
              }}
            >
              POPULAR PRESET SCENARIOS
            </span>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <button
                className="btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  padding: '6px 12px',
                }}
                onClick={() => {
                  setField('screenTime');
                  setDelta(-2);
                }}
              >
                -2h Screen Time
              </button>

              <button
                className="btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  padding: '6px 12px',
                }}
                onClick={() => {
                  setField('steps');
                  setDelta(3000);
                }}
              >
                +3,000 Steps
              </button>

              <button
                className="btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  padding: '6px 12px',
                }}
                onClick={() => {
                  setField('activity');
                  setDelta(30);
                }}
              >
                +30m Activity
              </button>
            </div>
          </div>

          {/* Recalculate */}
          <button
            className="btn-primary"
            onClick={handleSimulate}
            disabled={loading}
            style={{
              width: '100%',
              justifyContent: 'center',
              marginTop: '6px',
            }}
          >
            {loading ? (
              <RefreshCw
                size={18}
                className="animate-spin"
              />
            ) : (
              <Play size={18} />
            )}

            {loading
              ? 'Running Simulation...'
              : 'Recalculate Simulation'}
          </button>
        </div>

        {/* Right: Results */}
        <div
          className="nex-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background:
              'linear-gradient(135deg, #121826 0%, #161F30 100%)',
            border:
              '1px solid rgba(16, 185, 129, 0.25)',
          }}
        >
          <div>
            {/* Results Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Sparkles
                  size={20}
                  color="var(--emerald-main)"
                />

                <h3
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#FFF',
                  }}
                >
                  2. Simulation Output
                </h3>
              </div>

              <span className="badge badge-emerald">
                Confidence: {confidence}
              </span>
            </div>

            {/* Loading */}
            {loading && (
              <div
                style={{
                  padding: '40px',
                  textAlign: 'center',
                }}
              >
                <RefreshCw
                  size={28}
                  className="animate-spin"
                  color="var(--emerald-main)"
                />

                <p
                  style={{
                    marginTop: '12px',
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem',
                  }}
                >
                  Running simulation...
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                style={{
                  padding: '16px',
                  background:
                    'rgba(244, 63, 94, 0.1)',
                  border:
                    '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--rose-main)',
                  fontSize: '0.875rem',
                }}
              >
                {error}
              </div>
            )}

            {/* Results */}
            {!loading && !error && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                {/* Proposed Change */}
                <div
                  style={{
                    background:
                      'rgba(16, 185, 129, 0.08)',
                    border:
                      '1px solid rgba(16, 185, 129, 0.25)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                  }}
                >
                  <span
                    style={{
                      color: 'var(--text-muted)',
                    }}
                  >
                    Proposed Change:
                  </span>

                  <strong
                    style={{
                      color: 'var(--emerald-main)',
                      fontSize: '0.95rem',
                    }}
                  >
                    {formatLabel(field)}{' '}
                    {delta > 0 ? `+${delta}` : delta}{' '}
                    {getDeltaUnit(field)}
                  </strong>
                </div>

                {/* Current vs Estimated */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    gap: '16px',
                    background:
                      'rgba(0, 0, 0, 0.25)',
                    padding: '20px',
                    borderRadius: 'var(--radius-md)',
                    border:
                      '1px solid var(--border-color)',
                  }}
                >
                  {/* Current */}
                  <div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-subtle)',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                      }}
                    >
                      CURRENT BASELINE
                    </span>

                    <div
                      style={{
                        marginTop: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <Moon
                          size={16}
                          color="#3B82F6"
                        />

                        <span
                          style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-muted)',
                          }}
                        >
                          Sleep:
                        </span>

                        <strong
                          style={{
                            fontSize: '1.1rem',
                            color: '#FFF',
                          }}
                        >
                          {current.sleep !==
                            undefined &&
                          current.sleep !== null
                            ? `${current.sleep} hrs`
                            : 'N/A'}
                        </strong>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <Zap
                          size={16}
                          color="#6366F1"
                        />

                        <span
                          style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-muted)',
                          }}
                        >
                          Energy:
                        </span>

                        <strong
                          style={{
                            fontSize: '1.1rem',
                            color: '#FFF',
                          }}
                        >
                          {current.energy !==
                            undefined &&
                          current.energy !== null
                            ? `${current.energy} / 10`
                            : 'N/A'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Estimated */}
                  <div
                    style={{
                      borderLeft:
                        '1px solid var(--border-color)',
                      paddingLeft: '16px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--emerald-main)',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                      }}
                    >
                      ESTIMATED RESULT
                    </span>

                    <div
                      style={{
                        marginTop: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <Moon
                          size={16}
                          color="#3B82F6"
                        />

                        <span
                          style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-muted)',
                          }}
                        >
                          Sleep:
                        </span>

                        <strong
                          style={{
                            fontSize: '1.2rem',
                            color:
                              'var(--emerald-main)',
                            fontWeight: 800,
                          }}
                        >
                          {estimated.sleep !==
                            undefined &&
                          estimated.sleep !== null
                            ? `${estimated.sleep} hrs`
                            : 'N/A'}
                        </strong>

                        {estimated.sleep !==
                          undefined &&
                          current.sleep !==
                            undefined && (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color:
                                  estimated.sleep >=
                                  current.sleep
                                    ? 'var(--emerald-main)'
                                    : 'var(--amber-main)',
                                fontWeight: 700,
                              }}
                            >
                              (
                              {estimated.sleep >=
                              current.sleep
                                ? '+'
                                : ''}
                              {(
                                estimated.sleep -
                                current.sleep
                              ).toFixed(1)}
                              h)
                            </span>
                          )}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <Zap
                          size={16}
                          color="#6366F1"
                        />

                        <span
                          style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-muted)',
                          }}
                        >
                          Energy:
                        </span>

                        <strong
                          style={{
                            fontSize: '1.2rem',
                            color:
                              'var(--emerald-main)',
                            fontWeight: 800,
                          }}
                        >
                          {estimated.energy !==
                            undefined &&
                          estimated.energy !== null
                            ? `${estimated.energy} / 10`
                            : 'N/A'}
                        </strong>

                        {estimated.energy !==
                          undefined &&
                          current.energy !==
                            undefined && (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color:
                                  estimated.energy >=
                                  current.energy
                                    ? 'var(--emerald-main)'
                                    : 'var(--amber-main)',
                                fontWeight: 700,
                              }}
                            >
                              (
                              {estimated.energy >=
                              current.energy
                                ? '+'
                                : ''}
                              {(
                                estimated.energy -
                                current.energy
                              ).toFixed(1)}
                              )
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Disclaimer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '0.775rem',
                    color: 'var(--text-subtle)',
                    background:
                      'rgba(255, 255, 255, 0.03)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border:
                      '1px solid var(--border-color)',
                  }}
                >
                  <ShieldAlert
                    size={16}
                    color="var(--amber-main)"
                    style={{
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  />

                  <span>
                    This is an illustrative model-based
                    estimate, not a guaranteed outcome or
                    medical prediction.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Experiment CTA */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop:
                '1px solid var(--border-color)',
            }}
          >
            <button
              className="btn-primary"
              onClick={() =>
                onStartExperimentFromSimulation({
                  goalField: field,
                  targetChange: delta,
                })
              }
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '14px 20px',
                fontSize: '0.95rem',
              }}
            >
              Turn Scenario into 7-Day Experiment
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}