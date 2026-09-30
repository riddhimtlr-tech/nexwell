import React, { useEffect, useState } from 'react';

import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  Info,
  HelpCircle,
  FlaskConical
} from 'lucide-react';

export default function Patterns({
  userId,
  onSelectPatternForSimulation
}) {
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);

  const generatePatterns = () => {
    setLoading(true);

    // Temporary demo patterns for frontend development.
    // Backend analysis can replace this later.
    setTimeout(() => {
      const demoPatterns = [
        {
          factor: 'screenTime',
          outcome: 'sleep',
          relationship: -0.82,
          description:
            'Higher screen time tends to co-occur with lower sleep duration in this demo dataset.'
        },
        {
          factor: 'activity',
          outcome: 'energy',
          relationship: 0.91,
          description:
            'Higher activity levels tend to co-occur with higher energy scores in this demo dataset.'
        },
        {
          factor: 'steps',
          outcome: 'energy',
          relationship: 0.78,
          description:
            'Higher daily step counts tend to co-occur with higher energy scores in this demo dataset.'
        },
        {
          factor: 'screenTime',
          outcome: 'energy',
          relationship: -0.76,
          description:
            'Higher screen time tends to co-occur with lower energy scores in this demo dataset.'
        }
      ];

      setPatterns(demoPatterns);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    generatePatterns();
  }, [userId]);

  const formatLabel = (field) => {
    const labels = {
      screenTime: 'Screen Time',
      sleep: 'Sleep',
      steps: 'Steps',
      activity: 'Activity',
      energy: 'Energy',
      heartRate: 'Heart Rate'
    };

    return (
      labels[field] ||
      field.charAt(0).toUpperCase() + field.slice(1)
    );
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
      {/* Header */}
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
            className="badge badge-indigo"
            style={{ marginBottom: '8px' }}
          >
            Stage 2: Discover
          </span>

          <h1 className="section-title">Patterns</h1>

          <p
            className="section-subtitle"
            style={{ marginBottom: 0 }}
          >
            NexWell analyzes relationships across your lifestyle
            data to discover how different habits co-occur.
          </p>
        </div>

        <button
          className="btn-secondary"
          onClick={generatePatterns}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? 'animate-spin' : ''}
          />

          {loading ? 'Analyzing...' : 'Re-run Analysis'}
        </button>
      </div>

      {/* Explanation */}
      <div
        className="nex-card"
        style={{
          background: 'rgba(99, 102, 241, 0.06)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          padding: '20px 24px'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px'
          }}
        >
          <Info
            size={18}
            color="var(--indigo-main)"
          />

          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#FFF'
            }}
          >
            Understanding Lifestyle Relationships
          </h3>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            fontSize: '0.875rem',
            color: 'var(--text-muted)'
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }}
          >
            <div
              style={{
                padding: '4px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--emerald-main)',
                flexShrink: 0
              }}
            >
              <TrendingUp size={16} />
            </div>

            <div>
              <strong
                style={{
                  color: '#FFF',
                  display: 'block',
                  marginBottom: '2px'
                }}
              >
                Positive Relationship (+)
              </strong>

              Both factors tend to move together.
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }}
          >
            <div
              style={{
                padding: '4px',
                borderRadius: '6px',
                background: 'rgba(244, 63, 94, 0.15)',
                color: 'var(--rose-main)',
                flexShrink: 0
              }}
            >
              <TrendingDown size={16} />
            </div>

            <div>
              <strong
                style={{
                  color: '#FFF',
                  display: 'block',
                  marginBottom: '2px'
                }}
              >
                Negative Relationship (-)
              </strong>

              One factor tends to increase as the
              other decreases.
            </div>
          </div>
        </div>

        <p
          style={{
            fontSize: '0.775rem',
            color: 'var(--text-subtle)',
            marginTop: '14px',
            borderTop:
              '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: '10px'
          }}
        >
          <strong>Note:</strong> These relationships reflect
          observed patterns in the demo dataset. They do not
          establish causation or provide medical advice.
        </p>
      </div>

      {/* Loading */}
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
            color="var(--indigo-main)"
          />

          <p
            style={{
              marginTop: '16px',
              color: 'var(--text-muted)'
            }}
          >
            Calculating lifestyle relationships...
          </p>
        </div>
      )}

      {/* Pattern Cards */}
      {!loading && patterns.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}
        >
          {patterns.map((item, idx) => {
            const rel = Number(item.relationship);
            const isNegative = rel < 0;
            const absRel = Math.abs(rel);

            const badgeBg = isNegative
              ? 'rgba(244, 63, 94, 0.15)'
              : 'rgba(16, 185, 129, 0.15)';

            const badgeColor = isNegative
              ? 'var(--rose-main)'
              : 'var(--emerald-main)';

            const badgeBorder = isNegative
              ? 'rgba(244, 63, 94, 0.3)'
              : 'rgba(16, 185, 129, 0.3)';

            const relationshipStrength =
              absRel > 0.7
                ? 'Strong Relationship'
                : absRel > 0.4
                  ? 'Moderate Relationship'
                  : 'Mild Association';

            return (
              <div
                key={idx}
                className="nex-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '20px'
                }}
              >
                <div>
                  {/* Card Header */}
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
                        fontSize: '0.775rem',
                        color: 'var(--text-subtle)',
                        fontWeight: 700,
                        letterSpacing: '0.05em'
                      }}
                    >
                      PATTERN #{idx + 1}
                    </span>

                    <span
                      style={{
                        background: badgeBg,
                        color: badgeColor,
                        border:
                          `1px solid ${badgeBorder}`,
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isNegative ? (
                        <TrendingDown size={14} />
                      ) : (
                        <TrendingUp size={14} />
                      )}

                      r = {rel > 0 ? `+${rel}` : rel}
                    </span>
                  </div>

                  {/* Factor / Outcome */}
                  <h3
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: '#FFF',
                      marginBottom: '8px'
                    }}
                  >
                    {formatLabel(item.factor)}

                    <span
                      style={{
                        color: 'var(--text-subtle)',
                        fontWeight: 400,
                        margin: '0 6px'
                      }}
                    >
                      ↔
                    </span>

                    {formatLabel(item.outcome)}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: '0.925rem',
                      color: 'var(--text-muted)',
                      lineHeight: '1.5'
                    }}
                  >
                    {item.description}
                  </p>

                  {/* Relationship Meter */}
                  <div style={{ marginTop: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: 'var(--text-subtle)',
                        marginBottom: '6px'
                      }}
                    >
                      <span>Inverse (-)</span>

                      <span
                        style={{
                          fontWeight: 600,
                          color: badgeColor
                        }}
                      >
                        {relationshipStrength}
                      </span>

                      <span>Direct (+)</span>
                    </div>

                    <div
                      style={{
                        height: '6px',
                        background:
                          'rgba(255, 255, 255, 0.08)',
                        borderRadius: '3px',
                        position: 'relative'
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: isNegative
                            ? `${50 - absRel * 50}%`
                            : '50%',
                          width: `${absRel * 50}%`,
                          height: '100%',
                          background: badgeColor,
                          borderRadius: '3px'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Simulator Button */}
                <button
                  className="btn-secondary"
                  onClick={() =>
                    onSelectPatternForSimulation(
                      item.factor
                    )
                  }
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    background:
                      'rgba(16, 185, 129, 0.08)',
                    borderColor:
                      'rgba(16, 185, 129, 0.25)',
                    color: 'var(--emerald-main)',
                    fontWeight: 600
                  }}
                >
                  Test in What-If Simulator
                  <ArrowRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* What-If CTA */}
      {!loading && patterns.length > 0 && (
        <div
          className="nex-card"
          style={{
            background:
              'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(18, 24, 38, 0.95) 100%)',
            border:
              '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
            padding: '24px 28px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background:
                  'rgba(16, 185, 129, 0.15)',
                border:
                  '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <FlaskConical
                size={24}
                color="var(--emerald-main)"
              />
            </div>

            <div>
              <h3
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: '#FFF'
                }}
              >
                Try a What-If Scenario
              </h3>

              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-muted)',
                  marginTop: '2px',
                  maxWidth: '580px'
                }}
              >
                Found a pattern? Test a hypothetical
                adjustment and explore an estimated
                impact on sleep and energy.
              </p>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={() =>
              onSelectPatternForSimulation(
                patterns[0]?.factor || 'screenTime'
              )
            }
          >
            Open What-If Simulator
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && patterns.length === 0 && (
        <div
          className="nex-card"
          style={{
            textAlign: 'center',
            padding: '50px'
          }}
        >
          <HelpCircle
            size={38}
            color="var(--amber-main)"
            style={{ margin: '0 auto 12px' }}
          />

          <h3
            style={{
              fontSize: '1.2rem',
              fontWeight: 700
            }}
          >
            Not Enough Data for Pattern Analysis
          </h3>

          <p
            style={{
              color: 'var(--text-muted)',
              marginTop: '8px'
            }}
          >
            At least 2 days of lifestyle entries are
            required to calculate historical relationships.
          </p>
        </div>
      )}
    </div>
  );
}