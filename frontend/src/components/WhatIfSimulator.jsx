import React, { useEffect, useState } from 'react';
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
  TrendingUp,
  Target,
} from 'lucide-react';

export default function WhatIfSimulator({
  userId,
  selectedFactor,
  onStartExperimentFromSimulation,
}) {
  const [field, setField] = useState(
    selectedFactor || 'screenTime'
  );

  const [delta, setDelta] = useState(
    field === 'screenTime'
      ? -2
      : field === 'steps'
        ? 2000
        : 30
  );

  const [simulationResult, setSimulationResult] =
    useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /*
   * OFFLINE FRONTEND MODE
   *
   * Keep this true while the backend/database is unavailable.
   * When the backend is ready, change this to false.
   *
   * The API integration below remains intact.
   */
  const USE_OFFLINE_DEMO = false;

  /*
   * Frontend-only illustrative simulation.
   *
   * This is intentionally simple demo logic so the UI can
   * be developed without depending on the backend/database.
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

    const baseline =
      baselines[factor] || baselines.screenTime;

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
        sleep: Number(
          baseline.sleep.toFixed(1)
        ),
        energy: Number(
          baseline.energy.toFixed(1)
        ),
      },
      estimated: {
        sleep: Number(
          estimatedSleep.toFixed(1)
        ),
        energy: Number(
          estimatedEnergy.toFixed(1)
        ),
      },
      confidence: 'demo',
    };
  };

  /*
   * Sync the selected factor when another page
   * sends a factor into the simulator.
   */
  useEffect(() => {
    if (!selectedFactor) return;

    setField(selectedFactor);

    if (selectedFactor === 'screenTime') {
      setDelta(-2);
    } else if (selectedFactor === 'steps') {
      setDelta(2000);
    } else if (selectedFactor === 'activity') {
      setDelta(30);
    }
  }, [selectedFactor]);

  /*
   * Run simulation.
   *
   * Offline mode is used for frontend development.
   *
   * To reconnect the backend later:
   * change USE_OFFLINE_DEMO to false.
   */
  const handleSimulate = async () => {
    setLoading(true);
    setError(null);

    try {
      if (USE_OFFLINE_DEMO) {
        // Small delay keeps the demo interaction natural.
        await new Promise((resolve) =>
          setTimeout(resolve, 350)
        );

        const result = runOfflineSimulation(
          field,
          delta
        );

        setSimulationResult(result);
        return;
      }

      /*
       * REAL BACKEND INTEGRATION
       *
       * Keep this path intact for backend reconnect.
       */
      const res = await api.runSimulation(
        userId,
        field,
        delta
      );

      setSimulationResult(
        res.simulation || res
      );
    } catch (err) {
      setError(
        err.message ||
          'Unable to run simulation. Please verify the backend connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Initial simulation.
   */
  useEffect(() => {
    handleSimulate();
  }, [userId, field]);

  /*
   * Change factor and reset to a sensible default.
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

  const applyPreset = (presetField, presetDelta) => {
    setField(presetField);
    setDelta(presetDelta);
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

  const current =
    simulationResult?.current || {};

  const estimated =
    simulationResult?.estimated || {};

  const confidence =
    simulationResult?.confidence || 'estimate';

  const sleepDifference =
    estimated.sleep !== undefined &&
    current.sleep !== undefined
      ? Number(
          (
            estimated.sleep -
            current.sleep
          ).toFixed(1)
        )
      : null;

  const energyDifference =
    estimated.energy !== undefined &&
    current.energy !== undefined
      ? Number(
          (
            estimated.energy -
            current.energy
          ).toFixed(1)
        )
      : null;

  const formatDelta = (value) => {
    if (value > 0) return `+${value}`;
    return value;
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '18px',
        }}
      >
        <div>
          <span
            className="badge badge-emerald"
            style={{
              marginBottom: '8px',
            }}
          >
            Stage 3: Simulate
          </span>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              marginBottom: '8px',
            }}
          >
            <h1
              className="section-title"
              style={{
                marginBottom: 0,
              }}
            >
              What-If Simulator
            </h1>

            <span className="badge badge-indigo">
              Explore
            </span>
          </div>

          <p
            className="section-subtitle"
            style={{
              marginBottom: 0,
              maxWidth: '680px',
            }}
          >
            Explore how a proposed lifestyle adjustment
            might change estimated sleep and energy
            signals.
          </p>
        </div>

        <div
          style={{
            background:
              'rgba(16, 185, 129, 0.1)',
            border:
              '1px solid rgba(16, 185, 129, 0.3)',
            padding: '9px 14px',
            borderRadius:
              'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.82rem',
            color: 'var(--emerald-main)',
            fontWeight: 700,
          }}
        >
          <FlaskConical size={16} />
          Interactive Sandbox
        </div>
      </div>

      {/* How it works */}
      <div
        className="nex-card"
        style={{
          background:
            'rgba(99, 102, 241, 0.06)',
          border:
            '1px solid rgba(99, 102, 241, 0.2)',
          padding: '17px 20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
        }}
      >
        <Info
          size={20}
          color="var(--indigo-main)"
          style={{
            flexShrink: 0,
            marginTop: '2px',
          }}
        />

        <div>
          <strong
            style={{
              color: '#FFF',
              fontSize: '0.875rem',
            }}
          >
            How it works
          </strong>

          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              lineHeight: 1.55,
              margin: '4px 0 0',
            }}
          >
            Choose one lifestyle factor, adjust it,
            and explore an illustrative estimate for
            sleep and energy. The current frontend uses
            sample data while the backend is being
            integrated.
          </p>
        </div>
      </div>

      {/* Main simulator */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'minmax(300px, 0.9fr) minmax(340px, 1.2fr)',
          gap: '24px',
        }}
      >
        {/* Configuration */}
        <div
          className="nex-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '22px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingBottom: '14px',
              borderBottom:
                '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  'rgba(16, 185, 129, 0.1)',
                color: 'var(--emerald-main)',
              }}
            >
              <Sliders size={18} />
            </div>

            <div>
              <span
                style={{
                  color:
                    'var(--text-subtle)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                }}
              >
                STEP 1
              </span>

              <h3
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: '#FFF',
                  marginTop: '2px',
                }}
              >
                Configure Scenario
              </h3>
            </div>
          </div>

          {/* Factor */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                marginBottom: '8px',
              }}
            >
              Lifestyle factor
            </label>

            <select
              value={field}
              onChange={(e) =>
                handleFieldChange(
                  e.target.value
                )
              }
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                background:
                  'var(--bg-card-subtle)',
                border:
                  '1px solid var(--border-color)',
                borderRadius:
                  'var(--radius-sm)',
                color: '#FFF',
                fontWeight: 600,
                fontSize: '0.9rem',
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

          {/* Delta */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
              }}
            >
              <label
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color:
                    'var(--text-muted)',
                }}
              >
                Proposed change
              </label>

              <span
                style={{
                  padding: '5px 9px',
                  borderRadius: '8px',
                  background:
                    'rgba(16, 185, 129, 0.1)',
                  color:
                    'var(--emerald-main)',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                }}
              >
                {formatDelta(delta)}{' '}
                {getDeltaUnit(field)}
              </span>
            </div>

            {field === 'screenTime' && (
              <input
                type="range"
                min="-5"
                max="5"
                step="0.5"
                value={delta}
                onChange={(e) =>
                  setDelta(
                    Number(e.target.value)
                  )
                }
                style={{
                  width: '100%',
                  accentColor:
                    'var(--emerald-main)',
                  cursor: 'pointer',
                }}
              />
            )}

            {field === 'steps' && (
              <input
                type="range"
                min="-5000"
                max="10000"
                step="500"
                value={delta}
                onChange={(e) =>
                  setDelta(
                    Number(e.target.value)
                  )
                }
                style={{
                  width: '100%',
                  accentColor:
                    'var(--emerald-main)',
                  cursor: 'pointer',
                }}
              />
            )}

            {field === 'activity' && (
              <input
                type="range"
                min="-60"
                max="90"
                step="5"
                value={delta}
                onChange={(e) =>
                  setDelta(
                    Number(e.target.value)
                  )
                }
                style={{
                  width: '100%',
                  accentColor:
                    'var(--emerald-main)',
                  cursor: 'pointer',
                }}
              />
            )}

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                fontSize: '0.7rem',
                color:
                  'var(--text-subtle)',
                marginTop: '6px',
              }}
            >
              <span>Decrease</span>
              <span>Increase</span>
            </div>
          </div>

          {/* Presets */}
          <div>
            <span
              style={{
                fontSize: '0.7rem',
                color:
                  'var(--text-subtle)',
                fontWeight: 800,
                display: 'block',
                marginBottom: '9px',
                letterSpacing: '0.06em',
              }}
            >
              QUICK SCENARIOS
            </span>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(3, 1fr)',
                gap: '8px',
              }}
            >
              <button
                className="btn-secondary"
                style={{
                  fontSize: '0.76rem',
                  padding: '8px 8px',
                  justifyContent:
                    'center',
                }}
                onClick={() =>
                  applyPreset(
                    'screenTime',
                    -2
                  )
                }
              >
                -2h Screen
              </button>

              <button
                className="btn-secondary"
                style={{
                  fontSize: '0.76rem',
                  padding: '8px 8px',
                  justifyContent:
                    'center',
                }}
                onClick={() =>
                  applyPreset(
                    'steps',
                    3000
                  )
                }
              >
                +3k Steps
              </button>

              <button
                className="btn-secondary"
                style={{
                  fontSize: '0.76rem',
                  padding: '8px 8px',
                  justifyContent:
                    'center',
                }}
                onClick={() =>
                  applyPreset(
                    'activity',
                    30
                  )
                }
              >
                +30m Activity
              </button>
            </div>
          </div>

          {/* Run */}
          <button
            className="btn-primary"
            onClick={handleSimulate}
            disabled={loading}
            style={{
              width: '100%',
              justifyContent: 'center',
              marginTop: '2px',
              padding: '13px 16px',
            }}
          >
            {loading ? (
              <RefreshCw
                size={18}
                style={{
                  animation:
                    'spin 1s linear infinite',
                }}
              />
            ) : (
              <Play size={18} />
            )}

            {loading
              ? 'Running Simulation...'
              : 'Run Simulation'}
          </button>

          <div
            style={{
              display: 'flex',
              gap: '9px',
              alignItems:
                'flex-start',
              padding: '11px 12px',
              borderRadius:
                'var(--radius-sm)',
              background:
                'rgba(255,255,255,0.025)',
              border:
                '1px solid var(--border-color)',
            }}
          >
            <Target
              size={15}
              color="var(--text-subtle)"
              style={{
                flexShrink: 0,
                marginTop: '2px',
              }}
            />

            <span
              style={{
                fontSize: '0.72rem',
                color:
                  'var(--text-subtle)',
                lineHeight: 1.5,
              }}
            >
              Try small, measurable changes so you
              can compare them with your actual data
              later.
            </span>
          </div>
        </div>

        {/* Results */}
        <div
          className="nex-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            background:
              'linear-gradient(135deg, #121826 0%, #161F30 100%)',
            border:
              '1px solid rgba(16, 185, 129, 0.25)',
          }}
        >
          {/* Results header */}
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
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
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background:
                    'rgba(16, 185, 129, 0.1)',
                }}
              >
                <Sparkles
                  size={18}
                  color="var(--emerald-main)"
                />
              </div>

              <div>
                <span
                  style={{
                    color:
                      'var(--text-subtle)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing:
                      '0.06em',
                  }}
                >
                  STEP 2
                </span>

                <h3
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: '#FFF',
                    marginTop: '2px',
                  }}
                >
                  Simulation Output
                </h3>
              </div>
            </div>

            <span className="badge badge-emerald">
              {confidence === 'demo'
                ? 'Demo Estimate'
                : `Confidence: ${confidence}`}
            </span>
          </div>

          {/* Loading */}
          {loading && (
            <div
              style={{
                minHeight: '280px',
                display: 'flex',
                flexDirection:
                  'column',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                textAlign: 'center',
              }}
            >
              <RefreshCw
                size={30}
                color="var(--emerald-main)"
                style={{
                  animation:
                    'spin 1s linear infinite',
                }}
              />

              <p
                style={{
                  marginTop: '14px',
                  color:
                    'var(--text-muted)',
                  fontSize: '0.88rem',
                }}
              >
                Exploring your scenario...
              </p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div
              style={{
                padding: '16px',
                background:
                  'rgba(244, 63, 94, 0.1)',
                border:
                  '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius:
                  'var(--radius-sm)',
                color:
                  'var(--rose-main)',
                fontSize: '0.85rem',
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
                flexDirection:
                  'column',
                gap: '18px',
                flex: 1,
              }}
            >
              {/* Scenario summary */}
              <div
                style={{
                  padding:
                    '14px 16px',
                  borderRadius:
                    'var(--radius-sm)',
                  background:
                    'rgba(16, 185, 129, 0.08)',
                  border:
                    '1px solid rgba(16, 185, 129, 0.22)',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    fontSize:
                      '0.7rem',
                    color:
                      'var(--text-subtle)',
                    fontWeight: 700,
                    letterSpacing:
                      '0.05em',
                    marginBottom:
                      '5px',
                  }}
                >
                  PROPOSED SCENARIO
                </span>

                <strong
                  style={{
                    color:
                      'var(--emerald-main)',
                    fontSize:
                      '1rem',
                  }}
                >
                  {formatLabel(field)}{' '}
                  {formatDelta(delta)}{' '}
                  {getDeltaUnit(field)}
                </strong>
              </div>

              {/* Current vs estimated */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: '0',
                  background:
                    'rgba(0, 0, 0, 0.22)',
                  borderRadius:
                    'var(--radius-md)',
                  border:
                    '1px solid var(--border-color)',
                  overflow: 'hidden',
                }}
              >
                {/* Current */}
                <div
                  style={{
                    padding: '20px',
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        '0.68rem',
                      color:
                        'var(--text-subtle)',
                      fontWeight: 800,
                      letterSpacing:
                        '0.05em',
                    }}
                  >
                    CURRENT
                  </span>

                  <div
                    style={{
                      marginTop:
                        '16px',
                      display: 'flex',
                      flexDirection:
                        'column',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap: '7px',
                          marginBottom:
                            '5px',
                        }}
                      >
                        <Moon
                          size={15}
                          color="#3B82F6"
                        />

                        <span
                          style={{
                            fontSize:
                              '0.75rem',
                            color:
                              'var(--text-muted)',
                          }}
                        >
                          Sleep
                        </span>
                      </div>

                      <strong
                        style={{
                          fontSize:
                            '1.25rem',
                          color:
                            '#FFF',
                        }}
                      >
                        {current.sleep ??
                          '—'}
                        <span
                          style={{
                            fontSize:
                              '0.7rem',
                            color:
                              'var(--text-subtle)',
                            marginLeft:
                              '4px',
                          }}
                        >
                          hrs
                        </span>
                      </strong>
                    </div>

                    <div>
                      <div
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap: '7px',
                          marginBottom:
                            '5px',
                        }}
                      >
                        <Zap
                          size={15}
                          color="#6366F1"
                        />

                        <span
                          style={{
                            fontSize:
                              '0.75rem',
                            color:
                              'var(--text-muted)',
                          }}
                        >
                          Energy
                        </span>
                      </div>

                      <strong
                        style={{
                          fontSize:
                            '1.25rem',
                          color:
                            '#FFF',
                        }}
                      >
                        {current.energy ??
                          '—'}
                        <span
                          style={{
                            fontSize:
                              '0.7rem',
                            color:
                              'var(--text-subtle)',
                            marginLeft:
                              '4px',
                          }}
                        >
                          / 10
                        </span>
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Estimated */}
                <div
                  style={{
                    padding: '20px',
                    borderLeft:
                      '1px solid var(--border-color)',
                    background:
                      'rgba(16, 185, 129, 0.035)',
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        '0.68rem',
                      color:
                        'var(--emerald-main)',
                      fontWeight: 800,
                      letterSpacing:
                        '0.05em',
                    }}
                  >
                    ESTIMATED
                  </span>

                  <div
                    style={{
                      marginTop:
                        '16px',
                      display: 'flex',
                      flexDirection:
                        'column',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap: '7px',
                          marginBottom:
                            '5px',
                        }}
                      >
                        <Moon
                          size={15}
                          color="#3B82F6"
                        />

                        <span
                          style={{
                            fontSize:
                              '0.75rem',
                            color:
                              'var(--text-muted)',
                          }}
                        >
                          Sleep
                        </span>
                      </div>

                      <div
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'baseline',
                          gap: '6px',
                          flexWrap:
                            'wrap',
                        }}
                      >
                        <strong
                          style={{
                            fontSize:
                              '1.25rem',
                            color:
                              'var(--emerald-main)',
                          }}
                        >
                          {estimated.sleep ??
                            '—'}
                          <span
                            style={{
                              fontSize:
                                '0.7rem',
                              marginLeft:
                                '4px',
                            }}
                          >
                            hrs
                          </span>
                        </strong>

                        {sleepDifference !==
                          null && (
                          <span
                            style={{
                              fontSize:
                                '0.7rem',
                              fontWeight: 800,
                              color:
                                sleepDifference >=
                                0
                                  ? 'var(--emerald-main)'
                                  : 'var(--amber-main)',
                            }}
                          >
                            {sleepDifference >=
                            0
                              ? '+'
                              : ''}
                            {sleepDifference}h
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap: '7px',
                          marginBottom:
                            '5px',
                        }}
                      >
                        <Zap
                          size={15}
                          color="#6366F1"
                        />

                        <span
                          style={{
                            fontSize:
                              '0.75rem',
                            color:
                              'var(--text-muted)',
                          }}
                        >
                          Energy
                        </span>
                      </div>

                      <div
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'baseline',
                          gap: '6px',
                          flexWrap:
                            'wrap',
                        }}
                      >
                        <strong
                          style={{
                            fontSize:
                              '1.25rem',
                            color:
                              'var(--emerald-main)',
                          }}
                        >
                          {estimated.energy ??
                            '—'}
                          <span
                            style={{
                              fontSize:
                                '0.7rem',
                              marginLeft:
                                '4px',
                            }}
                          >
                            / 10
                          </span>
                        </strong>

                        {energyDifference !==
                          null && (
                          <span
                            style={{
                              fontSize:
                                '0.7rem',
                              fontWeight: 800,
                              color:
                                energyDifference >=
                                0
                                  ? 'var(--emerald-main)'
                                  : 'var(--amber-main)',
                            }}
                          >
                            {energyDifference >=
                            0
                              ? '+'
                              : ''}
                            {energyDifference}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interpretation */}
              <div
                style={{
                  display: 'flex',
                  alignItems:
                    'flex-start',
                  gap: '10px',
                  padding:
                    '12px 14px',
                  borderRadius:
                    'var(--radius-sm)',
                  background:
                    'rgba(255,255,255,0.025)',
                  border:
                    '1px solid var(--border-color)',
                }}
              >
                <TrendingUp
                  size={16}
                  color="var(--indigo-main)"
                  style={{
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                />

                <span
                  style={{
                    fontSize:
                      '0.75rem',
                    color:
                      'var(--text-muted)',
                    lineHeight: 1.55,
                  }}
                >
                  The estimate shows how the
                  illustrative demo model responds to
                  your selected change. Compare future
                  observations with this scenario rather
                  than treating it as a guaranteed result.
                </span>
              </div>

              {/* Disclaimer */}
              <div
                style={{
                  display: 'flex',
                  alignItems:
                    'flex-start',
                  gap: '10px',
                  fontSize:
                    '0.72rem',
                  color:
                    'var(--text-subtle)',
                  padding:
                    '11px 13px',
                  borderRadius:
                    'var(--radius-sm)',
                  background:
                    'rgba(245, 158, 11, 0.05)',
                  border:
                    '1px solid rgba(245, 158, 11, 0.16)',
                }}
              >
                <ShieldAlert
                  size={15}
                  color="var(--amber-main)"
                  style={{
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                />

                <span>
                  This is an illustrative estimate using
                  demo data. It is not a guaranteed outcome
                  or medical prediction.
                </span>
              </div>
            </div>
          )}

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
              disabled={
                loading || !!error
              }
              style={{
                width: '100%',
                justifyContent:
                  'center',
                padding: '14px 20px',
                fontSize: '0.9rem',
              }}
            >
              Turn Scenario into 7-Day Experiment
              <ArrowRight size={18} />
            </button>

            <p
              style={{
                textAlign: 'center',
                margin:
                  '9px 0 0',
                color:
                  'var(--text-subtle)',
                fontSize:
                  '0.7rem',
              }}
            >
              Measure the change with your actual
              data over time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}