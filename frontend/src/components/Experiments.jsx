import React, { useEffect, useState } from 'react';
import {
  Layers,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  RefreshCw,
  BarChart3,
  X,
  ShieldCheck,
  Target,
  TrendingUp,
  Activity,
} from 'lucide-react';

import { api } from '../services/api';

const USE_OFFLINE_DEMO = true;

const DEMO_EXPERIMENTS = [
  {
    id: 'demo-1',
    goal_field: 'screenTime',
    target_change: -2,
    status: 'active',
    start_date: '2026-09-27',
    end_date: '2026-10-04',
  },
  {
    id: 'demo-2',
    goal_field: 'steps',
    target_change: 2000,
    status: 'completed',
    start_date: '2026-09-17',
    end_date: '2026-09-24',
  },
];

const DEMO_COMPARISON = {
  before: {
    sleep: 6.9,
    steps: 7600,
    screenTime: 6.1,
    activity: 35,
    heartRate: 74,
    energy: 6.2,
  },
  after: {
    sleep: 7.4,
    steps: 9100,
    screenTime: 4.8,
    activity: 47,
    heartRate: 71,
    energy: 7.3,
  },
};

export default function Experiments({
  userId,
  prefilledScenario,
  clearPrefilledScenario,
}) {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(!!prefilledScenario);
  const [goalField, setGoalField] = useState(
    prefilledScenario?.goalField || 'screenTime'
  );
  const [targetChange, setTargetChange] = useState(
    prefilledScenario?.targetChange ?? -2
  );
  const [creating, setCreating] = useState(false);

  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [comparingLoading, setComparingLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState(null);

  useEffect(() => {
    if (prefilledScenario) {
      setGoalField(prefilledScenario.goalField || 'screenTime');
      setTargetChange(prefilledScenario.targetChange ?? -2);
      setShowModal(true);
    }
  }, [prefilledScenario]);

  const fetchExperiments = async () => {
    setLoading(true);
    setError(null);

    try {
      if (USE_OFFLINE_DEMO) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        setExperiments(DEMO_EXPERIMENTS);
        return;
      }

      // Backend integration remains available for reconnecting later.
      const res = await api.getExperiments(userId);
      setExperiments(res.experiments || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch experiments list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, [userId]);

  const handleCreateExperiment = async (e) => {
    e.preventDefault();

    setCreating(true);
    setError(null);

    try {
      if (USE_OFFLINE_DEMO) {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const today = new Date();
        const end = new Date(today);
        end.setDate(end.getDate() + 7);

        const newExperiment = {
          id: `demo-${Date.now()}`,
          goal_field: goalField,
          target_change: targetChange,
          status: 'active',
          start_date: today.toISOString().split('T')[0],
          end_date: end.toISOString().split('T')[0],
        };

        setExperiments((current) => [newExperiment, ...current]);
        setShowModal(false);

        if (clearPrefilledScenario) {
          clearPrefilledScenario();
        }

        return;
      }

      // Backend integration remains available for reconnecting later.
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

  const handleCompareExperiment = async (experiment) => {
    setSelectedExperiment(experiment);
    setComparingLoading(true);
    setComparisonError(null);
    setComparisonData(null);

    try {
      if (USE_OFFLINE_DEMO) {
        await new Promise((resolve) => setTimeout(resolve, 450));
        setComparisonData(DEMO_COMPARISON);
        return;
      }

      // Backend integration remains available for reconnecting later.
      const res = await api.compareExperiment(experiment.id);
      setComparisonData(res);
    } catch (err) {
      setComparisonError(
        err.message || 'Failed to fetch experiment comparison'
      );
    } finally {
      setComparingLoading(false);
    }
  };

  const formatFieldName = (field) => {
    if (field === 'screenTime') return 'Screen Time';
    if (field === 'steps') return 'Daily Steps';
    if (field === 'activity') return 'Active Time';
    return field;
  };

  const getUnit = (field) => {
    if (field === 'screenTime') return 'hrs';
    if (field === 'steps') return 'steps';
    if (field === 'activity') return 'mins';
    return '';
  };

  const getGoalIcon = (field) => {
    if (field === 'screenTime') return <Target size={18} />;
    if (field === 'steps') return <Activity size={18} />;
    return <TrendingUp size={18} />;
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';

    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <span
            className="badge badge-emerald"
            style={{ marginBottom: '8px' }}
          >
            Stages 4 & 5: Experiment & Measure
          </span>

          <h1 className="section-title">7-Day Personal Experiments</h1>

          <p className="section-subtitle" style={{ marginBottom: 0 }}>
            Turn a personal hypothesis into a short, measurable experiment.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} />
          Start New Experiment
        </button>
      </div>

      {/* Demo mode banner */}
      {USE_OFFLINE_DEMO && (
        <div
          className="nex-card"
          style={{
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid rgba(16, 185, 129, 0.22)',
            background: 'rgba(16, 185, 129, 0.06)',
          }}
        >
          <ShieldCheck
            size={19}
            color="var(--emerald-main)"
            style={{ flexShrink: 0 }}
          />

          <div>
            <div
              style={{
                fontWeight: 700,
                color: '#fff',
                fontSize: '0.88rem',
              }}
            >
              Frontend demo mode
            </div>

            <div
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                marginTop: '2px',
              }}
            >
              Sample experiments are shown locally while backend integration
              is unavailable.
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="nex-card"
          style={{
            padding: '18px',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: 'var(--rose-main)',
          }}
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div
          className="nex-card"
          style={{
            padding: '60px',
            textAlign: 'center',
          }}
        >
          <RefreshCw
            size={32}
            color="var(--emerald-main)"
            style={{
              animation: 'spin 1s linear infinite',
            }}
          />

          <p
            style={{
              marginTop: '16px',
              color: 'var(--text-muted)',
            }}
          >
            Preparing your experiments...
          </p>
        </div>
      )}

      {/* Empty */}
      {!loading && experiments.length === 0 && (
        <div
          className="nex-card"
          style={{
            textAlign: 'center',
            padding: '50px',
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
              fontWeight: 700,
            }}
          >
            No Experiments Yet
          </h3>

          <p
            style={{
              color: 'var(--text-muted)',
              marginTop: '6px',
              marginBottom: '20px',
            }}
          >
            Pick one small change and test it for seven days.
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

      {/* Experiment cards */}
      {!loading && experiments.length > 0 && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
            }}
          >
            {experiments.map((exp) => {
              const changeVal = Number(exp.target_change);

              const changeStr = `${
                changeVal > 0 ? '+' : ''
              }${changeVal} ${getUnit(exp.goal_field)}`;

              const isActive = exp.status === 'active';

              return (
                <div
                  key={exp.id}
                  className="nex-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px',
                  }}
                >
                  {/* Card top */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-subtle)',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {String(exp.id).startsWith('demo-')
                        ? 'DEMO EXPERIMENT'
                        : `EXPERIMENT #${exp.id}`}
                    </span>

                    <span
                      className={`badge ${
                        isActive
                          ? 'badge-emerald'
                          : 'badge-indigo'
                      }`}
                    >
                      {isActive ? (
                        <Clock size={12} />
                      ) : (
                        <CheckCircle2 size={12} />
                      )}

                      {isActive ? 'Active' : 'Completed'}
                    </span>
                  </div>

                  {/* Goal */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--emerald-main)',
                        background:
                          'rgba(16, 185, 129, 0.1)',
                        border:
                          '1px solid rgba(16, 185, 129, 0.18)',
                      }}
                    >
                      {getGoalIcon(exp.goal_field)}
                    </div>

                    <div>
                      <div
                        style={{
                          color: 'var(--text-subtle)',
                          fontSize: '0.75rem',
                          marginBottom: '3px',
                        }}
                      >
                        Experiment Goal
                      </div>

                      <h3
                        style={{
                          fontSize: '1.15rem',
                          fontWeight: 800,
                          color: '#fff',
                        }}
                      >
                        {formatFieldName(exp.goal_field)}
                      </h3>
                    </div>
                  </div>

                  {/* Target */}
                  <div
                    style={{
                      padding: '13px',
                      borderRadius: '10px',
                      background:
                        'rgba(255, 255, 255, 0.035)',
                    }}
                  >
                    <div
                      style={{
                        color: 'var(--text-subtle)',
                        fontSize: '0.72rem',
                        marginBottom: '4px',
                      }}
                    >
                      Target change
                    </div>

                    <strong
                      style={{
                        color: 'var(--emerald-main)',
                        fontSize: '1rem',
                      }}
                    >
                      {changeStr}
                    </strong>
                  </div>

                  {/* Timeline */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <Calendar
                      size={15}
                      color="var(--indigo-main)"
                    />

                    <span>
                      {formatDate(exp.start_date)} →{' '}
                      {formatDate(exp.end_date)}
                    </span>
                  </div>

                  {/* Action */}
                  <button
                    className="btn-secondary"
                    onClick={() =>
                      handleCompareExperiment(exp)
                    }
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      marginTop: '2px',
                    }}
                  >
                    <BarChart3 size={16} />
                    View Before vs After
                  </button>
                </div>
              );
            })}
          </div>

          {/* Experiment philosophy */}
          <div
            className="nex-card"
            style={{
              padding: '20px',
              display: 'flex',
              gap: '14px',
              alignItems: 'flex-start',
            }}
          >
            <Layers
              size={21}
              color="var(--indigo-main)"
              style={{ flexShrink: 0 }}
            />

            <div>
              <h3
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: '#fff',
                  marginBottom: '5px',
                }}
              >
                Measure, don't assume
              </h3>

              <p
                style={{
                  fontSize: '0.8rem',
                  lineHeight: 1.6,
                  color: 'var(--text-muted)',
                  margin: 0,
                }}
              >
                NexWell uses your experiment window to compare
                recorded patterns before and during the trial.
                Results are observational and depend on the
                available data.
              </p>
            </div>
          </div>
        </>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="nex-card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '500px',
              background: 'var(--bg-card)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
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
                paddingBottom: '14px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
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
                    color: '#fff',
                  }}
                >
                  Start 7-Day Experiment
                </h3>
              </div>

              <button
                onClick={() => setShowModal(false)}
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateExperiment}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginBottom: '6px',
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
                    background: 'var(--bg-card-subtle)',
                    border:
                      '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontWeight: 600,
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
                    marginBottom: '6px',
                  }}
                >
                  Target Change
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
                    setTargetChange(Number(e.target.value))
                  }
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'var(--bg-card-subtle)',
                    border:
                      '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                  }}
                />

                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-subtle)',
                    marginTop: '4px',
                    display: 'block',
                  }}
                >
                  Example: -2 hours screen time, +2000
                  daily steps, or +30 active minutes.
                </span>
              </div>

              <div
                style={{
                  background:
                    'rgba(16, 185, 129, 0.08)',
                  border:
                    '1px solid rgba(16, 185, 129, 0.2)',
                  padding: '13px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                }}
              >
                <ShieldCheck
                  size={16}
                  color="var(--emerald-main)"
                  style={{
                    display: 'inline',
                    marginRight: '6px',
                    verticalAlign: 'middle',
                  }}
                />

                Your experiment will use a seven-day window
                for comparison. Demo mode keeps the data
                local during frontend development.
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '10px',
                }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    justifyContent: 'center',
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
                    justifyContent: 'center',
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

      {/* COMPARISON MODAL */}
      {selectedExperiment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="nex-card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '700px',
              background: 'var(--bg-card)',
              boxShadow:
                '0 25px 60px rgba(0,0,0,0.9)',
              border:
                '1px solid rgba(99, 102, 241, 0.3)',
              maxHeight: '90vh',
              overflowY: 'auto',
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
                paddingBottom: '14px',
              }}
            >
              <div>
                <span
                  className="badge badge-indigo"
                  style={{ marginBottom: '5px' }}
                >
                  Experiment Results
                </span>

                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#fff',
                  }}
                >
                  Before vs During Comparison
                </h3>
              </div>

              <button
                onClick={() =>
                  setSelectedExperiment(null)
                }
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {comparingLoading && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                }}
              >
                <RefreshCw
                  size={28}
                  color="var(--indigo-main)"
                  style={{
                    animation:
                      'spin 1s linear infinite',
                  }}
                />

                <p
                  style={{
                    marginTop: '12px',
                    color: 'var(--text-muted)',
                  }}
                >
                  Preparing comparison...
                </p>
              </div>
            )}

            {comparisonError && (
              <div
                style={{
                  color: 'var(--rose-main)',
                  padding: '20px',
                }}
              >
                {comparisonError}
              </div>
            )}

            {!comparingLoading && comparisonData && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background:
                      'rgba(99, 102, 241, 0.07)',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    lineHeight: 1.5,
                  }}
                >
                  This comparison shows changes in the
                  available demo data. It describes
                  association during the experiment and
                  does not establish causation.
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '12px',
                  }}
                >
                  <div className="nex-card">
                    <div
                      style={{
                        color: 'var(--text-subtle)',
                        fontSize: '0.72rem',
                      }}
                    >
                      Before
                    </div>
                    <strong
                      style={{
                        display: 'block',
                        marginTop: '4px',
                        fontSize: '1.3rem',
                        color: '#fff',
                      }}
                    >
                      Baseline
                    </strong>
                  </div>

                  <div className="nex-card">
                    <div
                      style={{
                        color: 'var(--text-subtle)',
                        fontSize: '0.72rem',
                      }}
                    >
                      During
                    </div>
                    <strong
                      style={{
                        display: 'block',
                        marginTop: '4px',
                        fontSize: '1.3rem',
                        color:
                          'var(--emerald-main)',
                      }}
                    >
                      Experiment
                    </strong>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.88rem',
                      textAlign: 'left',
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom:
                            '1px solid var(--border-color)',
                          color:
                            'var(--text-subtle)',
                        }}
                      >
                        <th style={{ padding: '10px' }}>
                          Metric
                        </th>

                        <th style={{ padding: '10px' }}>
                          Before
                        </th>

                        <th style={{ padding: '10px' }}>
                          During
                        </th>

                        <th style={{ padding: '10px' }}>
                          Change
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {[
                        {
                          label: 'Sleep',
                          unit: 'hrs',
                          b: comparisonData.before
                            ?.sleep,
                          a: comparisonData.after
                            ?.sleep,
                        },
                        {
                          label: 'Steps',
                          unit: '',
                          b: comparisonData.before
                            ?.steps,
                          a: comparisonData.after
                            ?.steps,
                        },
                        {
                          label: 'Screen Time',
                          unit: 'hrs',
                          b: comparisonData.before
                            ?.screenTime,
                          a: comparisonData.after
                            ?.screenTime,
                        },
                        {
                          label: 'Activity',
                          unit: 'mins',
                          b: comparisonData.before
                            ?.activity,
                          a: comparisonData.after
                            ?.activity,
                        },
                        {
                          label: 'Heart Rate',
                          unit: 'bpm',
                          b: comparisonData.before
                            ?.heartRate,
                          a: comparisonData.after
                            ?.heartRate,
                        },
                        {
                          label: 'Energy',
                          unit: '/10',
                          b: comparisonData.before
                            ?.energy,
                          a: comparisonData.after
                            ?.energy,
                        },
                      ].map((row) => {
                        const hasNumbers =
                          row.b !== undefined &&
                          row.b !== null &&
                          row.a !== undefined &&
                          row.a !== null;

                        const diff = hasNumbers
                          ? Number(
                              (
                                Number(row.a) -
                                Number(row.b)
                              ).toFixed(1)
                            )
                          : null;

                        return (
                          <tr
                            key={row.label}
                            style={{
                              borderBottom:
                                '1px solid rgba(255,255,255,0.04)',
                            }}
                          >
                            <td
                              style={{
                                padding: '12px 10px',
                                fontWeight: 600,
                                color: '#fff',
                              }}
                            >
                              {row.label}
                            </td>

                            <td
                              style={{
                                padding: '12px 10px',
                                color:
                                  'var(--text-muted)',
                              }}
                            >
                              {row.b ?? 'N/A'}
                              {row.b != null &&
                                ` ${row.unit}`}
                            </td>

                            <td
                              style={{
                                padding: '12px 10px',
                                fontWeight: 700,
                                color:
                                  'var(--emerald-main)',
                              }}
                            >
                              {row.a ?? 'N/A'}
                              {row.a != null &&
                                ` ${row.unit}`}
                            </td>

                            <td
                              style={{
                                padding: '12px 10px',
                                fontWeight: 700,
                                color:
                                  diff === null
                                    ? 'var(--text-subtle)'
                                    : diff >= 0
                                    ? 'var(--emerald-main)'
                                    : 'var(--amber-main)',
                              }}
                            >
                              {diff === null
                                ? 'Pending'
                                : diff > 0
                                ? `+${diff}`
                                : diff}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <button
                  className="btn-secondary"
                  onClick={() =>
                    setSelectedExperiment(null)
                  }
                  style={{
                    alignSelf: 'flex-end',
                  }}
                >
                  Close Results
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}