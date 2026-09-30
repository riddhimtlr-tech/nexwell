import React from 'react';
import {
  Moon,
  Footprints,
  Monitor,
  Zap,
  Heart,
  Flame,
  ArrowRight,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Target,
} from 'lucide-react';

export default function Overview({
  lifestyleData,
  loading,
  error,
  onRefresh,
  onNavigateToSimulator,
}) {
  if (loading) {
    return (
      <div
        className="nex-card"
        style={{
          padding: '60px',
          textAlign: 'center',
        }}
      >
        <RefreshCw
          size={32}
          className="animate-spin"
          color="var(--emerald-main)"
          style={{ animation: 'spin 1s linear infinite' }}
        />
        <p
          style={{
            marginTop: '16px',
            color: 'var(--text-muted)',
          }}
        >
          Preparing your personalized wellness snapshot...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="nex-card"
        style={{
          border: '1px solid rgba(244, 63, 94, 0.3)',
          padding: '40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--rose-main)',
            marginBottom: '12px',
          }}
        >
          <AlertCircle size={24} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            Unable to Load Lifestyle Data
          </h3>
        </div>

        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            marginBottom: '20px',
          }}
        >
          {error}
        </p>

        <button className="btn-secondary" onClick={onRefresh}>
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  const rows = lifestyleData || [];

  if (rows.length === 0) {
    return (
      <div
        className="nex-card"
        style={{
          textAlign: 'center',
          padding: '50px',
        }}
      >
        <AlertCircle
          size={36}
          color="var(--amber-main)"
          style={{ margin: '0 auto 12px' }}
        />

        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
          No Recent Wellness Data
        </h3>

        <p
          style={{
            color: 'var(--text-muted)',
            marginTop: '8px',
          }}
        >
          No recent wellness entries are available for this profile yet.
        </p>
      </div>
    );
  }

  // Sort a copy so the original lifestyleData array is never mutated.
  const sortedRows = [...rows].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const latest = sortedRows[sortedRows.length - 1] || {};

  const formatVal = (val, suffix = '', fallback = 'N/A') => {
    if (
      val === null ||
      val === undefined ||
      val === '' ||
      Number.isNaN(Number(val))
    ) {
      return fallback;
    }

    return `${val}${suffix}`;
  };

  const getValue = (row, primary, secondary) => {
    return row?.[primary] ?? row?.[secondary];
  };

  const calcAvg = (primary, secondary) => {
    const values = rows
      .map((row) => getValue(row, primary, secondary))
      .filter(
        (value) =>
          value !== null &&
          value !== undefined &&
          value !== '' &&
          !Number.isNaN(Number(value))
      )
      .map(Number);

    if (values.length === 0) return null;

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const avgSleep = calcAvg('sleep', 'sleep');
  const avgSteps = calcAvg('steps', 'steps');
  const avgScreen = calcAvg('screenTime', 'screen_time');
  const avgActivity = calcAvg('activity', 'activity');
  const avgHeartRate = calcAvg('heartRate', 'heart_rate');
  const avgEnergy = calcAvg('energy', 'energy');

  const roundedAvgSteps =
    avgSteps !== null ? Math.round(avgSteps) : null;

  const roundedAvgActivity =
    avgActivity !== null ? Math.round(avgActivity) : null;

  const roundedAvgHeartRate =
    avgHeartRate !== null ? Math.round(avgHeartRate) : null;

  const latestScreenTime = getValue(
    latest,
    'screenTime',
    'screen_time'
  );

  const latestHeartRate = getValue(
    latest,
    'heartRate',
    'heart_rate'
  );

  const latestDateStr = latest.date
    ? new Date(latest.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Today';

  const statCards = [
    {
      label: 'Sleep Duration',
      unit: 'hrs',
      value:
        latest.sleep !== undefined && latest.sleep !== null
          ? Number(latest.sleep).toFixed(1)
          : 'N/A',
      avg:
        avgSleep !== null
          ? `${avgSleep.toFixed(1)}h avg`
          : 'N/A',
      icon: Moon,
      color: '#3B82F6',
      desc: 'Nightly sleep',
    },
    {
      label: 'Daily Steps',
      unit: 'steps',
      value:
        latest.steps !== undefined && latest.steps !== null
          ? Number(latest.steps).toLocaleString()
          : 'N/A',
      avg:
        roundedAvgSteps !== null
          ? `${roundedAvgSteps.toLocaleString()} avg`
          : 'N/A',
      icon: Footprints,
      color: '#10B981',
      desc: 'Movement count',
    },
    {
      label: 'Screen Time',
      unit: 'hrs',
      value:
        latestScreenTime !== undefined &&
        latestScreenTime !== null
          ? Number(latestScreenTime).toFixed(1)
          : 'N/A',
      avg:
        avgScreen !== null
          ? `${avgScreen.toFixed(1)}h avg`
          : 'N/A',
      icon: Monitor,
      color: '#F59E0B',
      desc: 'Digital device usage',
    },
    {
      label: 'Activity Time',
      unit: 'mins',
      value:
        latest.activity !== undefined &&
        latest.activity !== null
          ? Math.round(Number(latest.activity))
          : 'N/A',
      avg:
        roundedAvgActivity !== null
          ? `${roundedAvgActivity}m avg`
          : 'N/A',
      icon: Flame,
      color: '#EC4899',
      desc: 'Active movement',
    },
    {
      label: 'Heart Rate',
      unit: 'bpm',
      value:
        latestHeartRate !== undefined &&
        latestHeartRate !== null
          ? Math.round(Number(latestHeartRate))
          : 'N/A',
      avg:
        roundedAvgHeartRate !== null
          ? `${roundedAvgHeartRate} bpm avg`
          : 'N/A',
      icon: Heart,
      color: '#F43F5E',
      desc: 'Recorded pulse',
    },
    {
      label: 'Energy Level',
      unit: '/10',
      value:
        latest.energy !== undefined &&
        latest.energy !== null
          ? Number(latest.energy).toFixed(1)
          : 'N/A',
      avg:
        avgEnergy !== null
          ? `${avgEnergy.toFixed(1)}/10 avg`
          : 'N/A',
      icon: Zap,
      color: '#6366F1',
      desc: 'Self-reported score',
    },
  ];

  /*
   * Lightweight personalized observations.
   * These are descriptive, not medical conclusions.
   */
  const screenEnergyInsight =
    avgScreen !== null && avgEnergy !== null
      ? `Your recent data averages ${avgScreen.toFixed(
          1
        )} hours of screen time and ${avgEnergy.toFixed(
          1
        )}/10 energy. Patterns can help explore how these signals move together.`
      : 'Your recent screen-time and energy data can be explored in Patterns.';

  const movementInsight =
    avgSteps !== null && avgActivity !== null
      ? `Your recent movement averages ${roundedAvgSteps.toLocaleString()} steps and ${roundedAvgActivity} minutes of activity per day.`
      : 'Your movement signals will appear here as more data is recorded.';

  const sleepInsight =
    avgSleep !== null
      ? `Your recent sleep average is ${avgSleep.toFixed(
          1
        )} hours across ${rows.length} recorded entries.`
      : 'Your recent sleep trend will appear here.';

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
            Stage 1: Track & Understand
          </span>

          <h1 className="section-title">
            Your Wellness Snapshot
          </h1>

          <p
            className="section-subtitle"
            style={{ marginBottom: 0 }}
          >
            A personalized view of your recent wellness signals and daily patterns.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={onNavigateToSimulator}
        >
          Run What-If Simulation
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Personalized status banner */}
      <div
        className="nex-card"
        style={{
          background:
            'linear-gradient(135deg, rgba(16, 185, 129, 0.09) 0%, rgba(18, 24, 38, 0.96) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          padding: '24px 28px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2
              size={24}
              color="var(--emerald-main)"
            />
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#FFF',
                }}
              >
                Personal Snapshot Ready
              </h3>

              <span
                className="badge badge-emerald"
                style={{ fontSize: '0.7rem' }}
              >
                {rows.length} Days
              </span>
            </div>

            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                marginTop: '2px',
              }}
            >
              Latest recorded data: <strong style={{ color: '#FFF' }}>
                {latestDateStr}
              </strong>
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '16px',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '10px 18px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            fontSize: '0.85rem',
          }}
        >
          <div>
            <span
              style={{
                color: 'var(--text-subtle)',
                display: 'block',
                fontSize: '0.75rem',
              }}
            >
              Current Sleep
            </span>

            <strong
              style={{
                color: '#FFF',
                fontSize: '0.95rem',
              }}
            >
              {formatVal(latest.sleep, ' hrs')}
            </strong>
          </div>

          <div
            style={{
              borderLeft: '1px solid var(--border-color)',
              paddingLeft: '16px',
            }}
          >
            <span
              style={{
                color: 'var(--text-subtle)',
                display: 'block',
                fontSize: '0.75rem',
              }}
            >
              Current Energy
            </span>

            <strong
              style={{
                color: 'var(--emerald-main)',
                fontSize: '0.95rem',
              }}
            >
              {formatVal(latest.energy, ' / 10')}
            </strong>
          </div>
        </div>
      </div>

      {/* Main metrics */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#FFF',
            }}
          >
            Your Latest Signals
          </h3>

          <span
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-subtle)',
            }}
          >
            Latest vs personal average
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '18px',
          }}
        >
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="nex-card"
                style={{
                  padding: '20px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                      }}
                    >
                      {card.label}
                    </span>

                    <div
                      style={{
                        padding: '8px',
                        borderRadius: '10px',
                        background: `${card.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={18} color={card.color} />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '6px',
                      marginTop: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '1.85rem',
                        fontWeight: 800,
                        color: '#FFF',
                        letterSpacing: '-0.03em',
                      }}
                    >
                      {card.value}
                    </span>

                    <span
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-subtle)',
                        fontWeight: 600,
                      }}
                    >
                      {card.unit}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop:
                      '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.775rem',
                  }}
                >
                  <span style={{ color: 'var(--text-subtle)' }}>
                    {card.desc}
                  </span>

                  <span
                    className="badge"
                    style={{
                      background:
                        'rgba(255, 255, 255, 0.04)',
                      color: 'var(--text-muted)',
                      border:
                        '1px solid var(--border-color)',
                      padding: '2px 8px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {card.avg}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Personalized focus */}
      <div
        className="nex-card"
        style={{
          background:
            'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '18px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Target
              size={20}
              color="var(--indigo-main)"
            />

            <div>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#FFF',
                }}
              >
                Your Personal Focus
              </h3>

              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  marginTop: '2px',
                }}
              >
                Signals worth exploring from your recent data
              </p>
            </div>
          </div>

          <span className="badge badge-indigo">
            Personalized
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '12px',
          }}
        >
          <div
            style={{
              padding: '16px',
              background: 'rgba(255,255,255,0.025)',
              border:
                '1px solid var(--border-color)',
              borderRadius: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              <Moon size={16} color="#3B82F6" />
              <strong style={{ color: '#FFF' }}>
                Sleep
              </strong>
            </div>

            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                lineHeight: 1.5,
              }}
            >
              {sleepInsight}
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              background: 'rgba(255,255,255,0.025)',
              border:
                '1px solid var(--border-color)',
              borderRadius: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              <Monitor size={16} color="#F59E0B" />
              <strong style={{ color: '#FFF' }}>
                Screen Time & Energy
              </strong>
            </div>

            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                lineHeight: 1.5,
              }}
            >
              {screenEnergyInsight}
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              background: 'rgba(255,255,255,0.025)',
              border:
                '1px solid var(--border-color)',
              borderRadius: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              <Footprints
                size={16}
                color="#10B981"
              />
              <strong style={{ color: '#FFF' }}>
                Movement
              </strong>
            </div>

            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                lineHeight: 1.5,
              }}
            >
              {movementInsight}
            </p>
          </div>
        </div>
      </div>

      {/* What NexWell noticed */}
      <div
        className="nex-card"
        style={{
          background:
            'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)',
          border:
            '1px solid rgba(16, 185, 129, 0.2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '14px',
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
            What NexWell Noticed
          </h3>
        </div>

        <ul
          style={{
            listStyle: 'none',
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '14px',
          }}
        >
          <li
            style={{
              display: 'flex',
              gap: '10px',
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
            }}
          >
            <TrendingUp
              size={17}
              color="var(--emerald-main)"
              style={{ flexShrink: 0 }}
            />

            <span>{sleepInsight}</span>
          </li>

          <li
            style={{
              display: 'flex',
              gap: '10px',
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
            }}
          >
            <TrendingUp
              size={17}
              color="var(--indigo-main)"
              style={{ flexShrink: 0 }}
            />

            <span>{screenEnergyInsight}</span>
          </li>

          <li
            style={{
              display: 'flex',
              gap: '10px',
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
            }}
          >
            <Footprints
              size={17}
              color="var(--amber-main)"
              style={{ flexShrink: 0 }}
            />

            <span>{movementInsight}</span>
          </li>
        </ul>

        <div
          style={{
            marginTop: '16px',
            paddingTop: '14px',
            borderTop:
              '1px solid var(--border-color)',
            color: 'var(--text-subtle)',
            fontSize: '0.75rem',
          }}
        >
          These observations describe patterns in the available data;
          they do not establish cause or provide medical advice.
        </div>
      </div>

      {/* Historical log */}
      <div className="nex-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Calendar
              size={18}
              color="var(--emerald-main)"
            />

            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#FFF',
              }}
            >
              Recent Daily Log
            </h3>
          </div>

          <span
            style={{
              fontSize: '0.775rem',
              color: 'var(--text-subtle)',
            }}
          >
            Latest entry highlighted
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom:
                    '1px solid var(--border-color)',
                  color: 'var(--text-subtle)',
                }}
              >
                <th style={{ padding: '12px 14px' }}>
                  Date
                </th>
                <th style={{ padding: '12px 14px' }}>
                  Sleep
                </th>
                <th style={{ padding: '12px 14px' }}>
                  Steps
                </th>
                <th style={{ padding: '12px 14px' }}>
                  Screen Time
                </th>
                <th style={{ padding: '12px 14px' }}>
                  Activity
                </th>
                <th style={{ padding: '12px 14px' }}>
                  Heart Rate
                </th>
                <th style={{ padding: '12px 14px' }}>
                  Energy
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedRows.map((row, idx) => {
                const isLatestRow =
                  idx === sortedRows.length - 1;

                const dateStr = row.date
                  ? new Date(
                      row.date
                    ).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : `Day ${idx + 1}`;

                const screen = getValue(
                  row,
                  'screenTime',
                  'screen_time'
                );

                const hr = getValue(
                  row,
                  'heartRate',
                  'heart_rate'
                );

                return (
                  <tr
                    key={`${row.date || idx}-${idx}`}
                    style={{
                      borderBottom:
                        idx < sortedRows.length - 1
                          ? '1px solid rgba(255, 255, 255, 0.04)'
                          : 'none',
                      background: isLatestRow
                        ? 'rgba(16, 185, 129, 0.06)'
                        : 'transparent',
                      color: 'var(--text-main)',
                    }}
                  >
                    <td
                      style={{
                        padding: '12px 14px',
                        fontWeight: 600,
                        color: isLatestRow
                          ? 'var(--emerald-main)'
                          : '#FFF',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span>{dateStr}</span>

                        {isLatestRow && (
                          <span
                            className="badge badge-emerald"
                            style={{
                              fontSize: '0.65rem',
                              padding: '1px 6px',
                            }}
                          >
                            Latest
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      {formatVal(row.sleep, ' hrs')}
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      {row.steps !== null &&
                      row.steps !== undefined
                        ? Number(
                            row.steps
                          ).toLocaleString()
                        : 'N/A'}
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      {formatVal(screen, ' hrs')}
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      {formatVal(
                        row.activity,
                        ' mins'
                      )}
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      {formatVal(hr, ' bpm')}
                    </td>

                    <td
                      style={{
                        padding: '12px 14px',
                      }}
                    >
                      {row.energy !== null &&
                      row.energy !== undefined ? (
                        <span
                          className="badge badge-indigo"
                          style={{
                            padding: '2px 8px',
                          }}
                        >
                          {Number(row.energy).toFixed(1)} / 10
                        </span>
                      ) : (
                        <span
                          style={{
                            color:
                              'var(--text-subtle)',
                          }}
                        >
                          N/A
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer CTA */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: '8px',
        }}
      >
        <button
          className="btn-primary"
          onClick={onNavigateToSimulator}
          style={{
            padding: '13px 22px',
          }}
        >
          Explore a What-If Scenario
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}