import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Layers,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  BarChart3,
  AlertCircle,
  X,
  ShieldCheck
} from 'lucide-react';

export default function Experiments({
  userId,
  prefilledScenario,
  clearPrefilledScenario
}) {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [showModal, setShowModal] = useState(!!prefilledScenario);
  const [goalField, setGoalField] = useState(
    prefilledScenario?.goalField || 'screenTime'
  );
  const [targetChange, setTargetChange] = useState(
    prefilledScenario?.targetChange || -2
  );
  const [creating, setCreating] = useState(false);

  // Comparison Modal State
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [comparingLoading, setComparingLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState(null);

  // Open modal if prefilled scenario arrives
  useEffect(() => {
    if (prefilledScenario) {
      setGoalField(prefilledScenario.goalField || 'screenTime');
      setTargetChange(prefilledScenario.targetChange || -2);
      setShowModal(true);
    }
  }, [prefilledScenario]);

  // Fetch experiments list
  const fetchExperiments = async () => {
    setLoading(true);
    setError(null);

    const demoExperiments = [
      {
        id: 'DEMO-01',
        goal_field: 'screenTime',
        target_change: -2,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString()
      },
      {
        id: 'DEMO-02',
        goal_field: 'steps',
        target_change: 3000,
        status: 'completed',
        start_date: new Date(
          Date.now() - 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        end_date: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString()
      }
    ];

    try {
      const res = await api.getExperiments(userId);
      setExperiments(res.experiments || []);
    } catch (err) {
      setExperiments([]);
      setError(err.message || 'Could not load experiments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, [userId]);

  // Handle start experiment submit
  const handleCreateExperiment = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      await api.startExperiment(userId, goalField, targetChange);

      setShowModal(false);

      if (clearPrefilledScenario) {
        clearPrefilledScenario();
      }

      await fetchExperiments();
    } catch (err) {
      setError(err.message || 'Failed to start experiment');
    } finally {
      setCreating(false);
    }
  };

  // Compare experiment before vs after
  const handleCompareExperiment = async (exp) => {
    setSelectedExperiment(exp);
    setComparingLoading(true);
    setComparisonError(null);
    setComparisonData(null);

    try {
      const res = await api.compareExperiment(exp.id);
      setComparisonData(res);
    } catch (err) {
      setComparisonError(
        err.message || 'Failed to fetch experiment comparison'
      );
    } finally {
      setComparingLoading(false);
    }
  };

  const formatFieldName = (f) => {
    if (f === 'screenTime') return 'Screen Time';
    if (f === 'steps') return 'Daily Steps';
    if (f === 'activity') return 'Active Time';
    return f;
  };

  const getUnit = (f) => {
    if (f === 'screenTime') return 'hrs';
    if (f === 'steps') return 'steps';
    if (f === 'activity') return 'mins';
    return '';
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '28px'
      }}
    >
      {/* Header & CTA */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <span
            className="badge badge-emerald"
            style={{ marginBottom: '8px' }}
          >
            Stages 4 & 5: Experiment & Measure
          </span>

          <h1 className="section-title">
            7-Day Personal Experiments
          </h1>

          <p
            className="section-subtitle"
            style={{ marginBottom: 0 }}
          >
            Put hypotheses into action, track 7-day trial windows,
            and measure real outcomes
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} />
          Start New 7-Day Experiment
        </button>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div
          className="nex-card"
          style={{
            padding: '60px',
            textAlign: 'center'
          }}
        >
          <RefreshCw
            size={32}
            className="animate-spin"
            color="var(--emerald-main)"
            style={{
              animation: 'spin 1s linear infinite'
            }}
          />

          <p
            style={{
              marginTop: '16px',
              color: 'var(--text-muted)'
            }}
          >
            Loading active & past experiments...
          </p>
        </div>
      )}

      {error && (
        <div
          className="nex-card"
          style={{
            border: '1px solid rgba(244, 63, 94, 0.3)',
            padding: '24px',
            color: 'var(--rose-main)'
          }}
        >
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && experiments.length === 0 && (
        <div
          className="nex-card"
          style={{
            textAlign: 'center',
            padding: '50px'
          }}
        >
          <Layers
            size={40}
            color="var(--text-subtle)"
            style={{ margin: '0 auto 12px' }}
          />

          <h3
            style={{
              fontSize: '1.1rem',
              fontWeight: 700
            }}
          >
            No Experiments Started Yet
          </h3>

          <p
            style={{
              color: 'var(--text-muted)',
              marginTop: '6px',
              marginBottom: '20px'
            }}
          >
            Test out your hypotheses by starting a 7-day experiment
            window.
          </p>

          <button
            className="btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={18} />
            Start Your First Experiment
          </button>
        </div>
      )}

      {/* Experiments Grid */}
      {!loading && experiments.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}
        >
          {experiments.map((exp) => {
            const startDate = exp.start_date
              ? new Date(exp.start_date).toLocaleDateString(
                  undefined,
                  {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }
                )
              : 'Started';

            const endDate = exp.end_date
              ? new Date(exp.end_date).toLocaleDateString(
                  undefined,
                  {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }
                )
              : 'Day 7';

            const changeVal = Number(exp.target_change);

            const changeStr = `${
              changeVal > 0 ? '+' : ''
            }${changeVal} ${getUnit(exp.goal_field)}`;

            return (
              <div
                key={exp.id}
                className="nex-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div>
                  {/* Status & ID */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '14px'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-subtle)',
                        fontWeight: 600
                      }}
                    >
                      EXPERIMENT #{exp.id}
                    </span>

                    <span
                      className={`badge ${
                        exp.status === 'active'
                          ? 'badge-emerald'
                          : 'badge-indigo'
                      }`}
                    >
                      {exp.status === 'active' ? (
                        <Clock size={12} />
                      ) : (
                        <CheckCircle2 size={12} />
                      )}

                      {exp.status}
                    </span>
                  </div>

                  {/* Goal Header */}
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: '#FFF',
                      marginBottom: '8px'
                    }}
                  >
                    {formatFieldName(exp.goal_field)}
                  </h3>

                  <div
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-muted)',
                      marginBottom: '16px'
                    }}
                  >
                    Target Change:{' '}
                    <strong
                      style={{
                        color: 'var(--emerald-main)'
                      }}
                    >
                      {changeStr}
                    </strong>
                  </div>

                  {/* Timeline Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.8rem',
                      color: 'var(--text-subtle)',
                      background:
                        'rgba(255, 255, 255, 0.04)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <Calendar
                      size={14}
                      color="var(--indigo-main)"
                    />

                    <span>
                      {startDate} → {endDate} (7 Days)
                    </span>
                  </div>
                </div>

                {/* Compare Action Button */}
                <button
                  className="btn-secondary"
                  onClick={() =>
                    handleCompareExperiment(exp)
                  }
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    background:
                      'rgba(99, 102, 241, 0.1)',
                    borderColor:
                      'rgba(99, 102, 241, 0.3)',
                    color: 'var(--indigo-main)',
                    fontWeight: 600
                  }}
                >
                  <BarChart3 size={16} />
                  View Before vs After Results
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE EXPERIMENT MODAL */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            className="nex-card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '500px',
              background: 'var(--bg-card)',
              boxShadow:
                '0 20px 50px rgba(0,0,0,0.8)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom:
                  '1px solid var(--border-color)',
                paddingBottom: '14px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <Layers
                  size={20}
                  color="var(--emerald-main)"
                />

                <h3
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: '#FFF'
                  }}
                >
                  Start 7-Day Experiment
                </h3>
              </div>

              <button
                onClick={() => setShowModal(false)}
                style={{
                  color: 'var(--text-muted)'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateExperiment}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginBottom: '6px'
                  }}
                >
                  Goal Metric / Habit
                </label>

                <select
                  value={goalField}
                  onChange={(e) =>
                    setGoalField(e.target.value)
                  }
                  style={{
                    width: '100%',
                    padding: '12px',
                    background:
                      'var(--bg-card-subtle)',
                    border:
                      '1px solid var(--border-color)',
                    borderRadius:
                      'var(--radius-sm)',
                    color: '#FFF',
                    fontWeight: 600
                  }}
                >
                  <option value="screenTime">
                    Screen Time
                  </option>

                  <option value="steps">
                    Daily Steps
                  </option>

                  <option value="activity">
                    Active Time
                  </option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginBottom: '6px'
                  }}
                >
                  Target Change (Delta)
                </label>

                <input
                  type="number"
                  step={
                    goalField === 'screenTime'
                      ? '0.5'
                      : '100'
                  }
                  value={targetChange}
                  onChange={(e) =>
                    setTargetChange(
                      Number(e.target.value)
                    )
                  }
                  style={{
                    width: '100%',
                    padding: '12px',
                    background:
                      'var(--bg-card-subtle)',
                    border:
                      '1px solid var(--border-color)',
                    borderRadius:
                      'var(--radius-sm)',
                    color: '#FFF',
                    fontWeight: 700,
                    fontSize: '1.05rem'
                  }}
                />

                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-subtle)',
                    marginTop: '4px',
                    display: 'block'
                  }}
                >
                  E.g., -2 for -2 hours screen time,
                  +2000 for +2000 daily steps.
                </span>
              </div>

              <div
                style={{
                  background:
                    'rgba(16, 185, 129, 0.08)',
                  border:
                    '1px solid rgba(16, 185, 129, 0.2)',
                  padding: '12px',
                  borderRadius:
                    'var(--radius-sm)',
                  fontSize: '0.825rem',
                  color: 'var(--text-muted)'
                }}
              >
                <ShieldCheck
                  size={16}
                  color="var(--emerald-main)"
                  style={{
                    display: 'inline',
                    marginRight: '6px'
                  }}
                />

                Starts today for 7 days. PostgreSQL
                database will record experiment state
                automatically.
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '10px'
                }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    setShowModal(false)
                  }
                  style={{
                    flex: 1,
                    justifyContent: 'center'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creating}
                  style={{
                    flex: 1,
                    justifyContent: 'center'
                  }}
                >
                  {creating
                    ? 'Starting...'
                    : 'Confirm & Launch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPARE BEFORE VS AFTER RESULTS MODAL */}
      {selectedExperiment && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            className="nex-card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '650px',
              background: 'var(--bg-card)',
              boxShadow:
                '0 25px 60px rgba(0,0,0,0.9)',
              border:
                '1px solid rgba(99, 102, 241, 0.3)'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom:
                  '1px solid var(--border-color)',
                paddingBottom: '14px'
              }}
            >
              <div>
                <span
                  className="badge badge-indigo"
                  style={{ marginBottom: '4px' }}
                >
                  Experiment #{selectedExperiment.id}{' '}
                  Results
                </span>

                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#FFF'
                  }}
                >
                  Before vs During Experiment Comparison
                </h3>
              </div>

              <button
                onClick={() =>
                  setSelectedExperiment(null)
                }
                style={{
                  color: 'var(--text-muted)'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Comparison Loading */}
            {comparingLoading && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px'
                }}
              >
                <RefreshCw
                  size={28}
                  className="animate-spin"
                  color="var(--indigo-main)"
                />

                <p
                  style={{
                    marginTop: '12px',
                    color: 'var(--text-muted)'
                  }}
                >
                  Calculating historical baseline
                  averages...
                </p>
              </div>
            )}

            {comparisonError && (
              <div
                style={{
                  color: 'var(--rose-main)',
                  padding: '20px'
                }}
              >
                {comparisonError}
              </div>
            )}

            {/* Comparison Results Content */}
            {!comparingLoading && comparisonData && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
                {/* Metric Comparison Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.9rem',
                      textAlign: 'left'
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom:
                            '1px solid var(--border-color)',
                          color: 'var(--text-subtle)'
                        }}
                      >
                        <th style={{ padding: '10px' }}>
                          Lifestyle Metric
                        </th>

                        <th style={{ padding: '10px' }}>
                          Before Experiment
                        </th>

                        <th style={{ padding: '10px' }}>
                          During Experiment
                        </th>

                        <th style={{ padding: '10px' }}>
                          Net Impact
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {[
                        {
                          label: 'Sleep (hrs)',
                          b: comparisonData.before?.sleep,
                          a: comparisonData.after?.sleep
                        },
                        {
                          label: 'Steps',
                          b: comparisonData.before?.steps,
                          a: comparisonData.after?.steps
                        },
                        {
                          label: 'Screen Time (hrs)',
                          b: comparisonData.before?.screenTime,
                          a: comparisonData.after?.screenTime
                        },
                        {
                          label: 'Activity (mins)',
                          b: comparisonData.before?.activity,
                          a: comparisonData.after?.activity
                        },
                        {
                          label: 'Heart Rate (bpm)',
                          b: comparisonData.before?.heartRate,
                          a: comparisonData.after?.heartRate
                        },
                        {
                          label: 'Energy Score (/10)',
                          b: comparisonData.before?.energy,
                          a: comparisonData.after?.energy,
                          isScore: true
                        }
                      ].map((row, i) => {
                        const beforeVal =
                          row.b ?? 'N/A';

                        const afterVal =
                          row.a ?? 'N/A';

                        const hasNums =
                          row.b !== null &&
                          row.a !== null &&
                          row.b !== undefined &&
                          row.a !== undefined;

                        const diff = hasNums
                          ? Number(
                              (
                                row.a - row.b
                              ).toFixed(1)
                            )
                          : null;

                        let isPositive = diff > 0;

                        if (
                          row.label.includes(
                            'Screen Time'
                          )
                        ) {
                          isPositive = diff < 0;
                        }

                        return (
                          <tr
                            key={i}
                            style={{
                              borderBottom:
                                '1px solid rgba(255, 255, 255, 0.04)'
                            }}
                          >
                            <td
                              style={{
                                padding: '12px 10px',
                                fontWeight: 600,
                                color: '#FFF'
                              }}
                            >
                              {row.label}
                            </td>

                            <td
                              style={{
                                padding: '12px 10px',
                                color:
                                  'var(--text-muted)'
                              }}
                            >
                              {beforeVal}
                            </td>

                            <td
                              style={{
                                padding: '12px 10px',
                                fontWeight: 700,
                                color:
                                  'var(--emerald-main)'
                              }}
                            >
                              {afterVal}
                            </td>

                            <td
                              style={{
                                padding: '12px 10px'
                              }}
                            >
                              {diff !== null ? (
                                <span
                                  style={{
                                    color: isPositive
                                      ? 'var(--emerald-main)'
                                      : 'var(--amber-main)',
                                    fontWeight: 700
                                  }}
                                >
                                  {diff > 0
                                    ? `+${diff}`
                                    : diff}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    color:
                                      'var(--text-subtle)'
                                  }}
                                >
                                  Pending logs
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div
                  style={{
                    textAlign: 'right',
                    marginTop: '10px'
                  }}
                >
                  <button
                    className="btn-secondary"
                    onClick={() =>
                      setSelectedExperiment(null)
                    }
                  >
                    Close Results
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}