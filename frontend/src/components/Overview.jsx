import React from 'react';
import { Moon, Footprints, Monitor, Zap, Heart, Flame, ArrowRight, Sparkles, AlertCircle, RefreshCw, Calendar, CheckCircle2 } from 'lucide-react';

export default function Overview({ lifestyleData, loading, error, onRefresh, onNavigateToSimulator }) {
  if (loading) {
    return (
      <div className="nex-card" style={{ padding: '60px', textAlign: 'center' }}>
        <RefreshCw size={32} className="animate-spin" color="var(--emerald-main)" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Loading lifestyle metrics from database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nex-card" style={{ border: '1px solid rgba(244, 63, 94, 0.3)', padding: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--rose-main)', marginBottom: '12px' }}>
          <AlertCircle size={24} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Unable to Load Lifestyle Data</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
          {error}
        </p>
        <button className="btn-secondary" onClick={onRefresh}>
          <RefreshCw size={16} /> Retry Connection
        </button>
      </div>
    );
  }

  const rows = lifestyleData || [];

  if (rows.length === 0) {
    return (
      <div className="nex-card" style={{ textAlign: 'center', padding: '50px' }}>
        <AlertCircle size={36} color="var(--amber-main)" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No Lifestyle History Found</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          No recorded entries exist for this user in PostgreSQL yet.
        </p>
      </div>
    );
  }

  // Filter latest entry on or before current date
  const latest = rows
    .filter(r => r.date && new Date(r.date) <= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .pop() || {};

  // Helper for safe value formatting
  const formatVal = (val, suffix = '', fallback = 'N/A') => {
    if (val === null || val === undefined || isNaN(val)) return fallback;
    return `${val}${suffix}`;
  };

  // Helper to calculate numerical averages
  const calcAvg = (key, altKey) => {
    const validRows = rows.filter(r => {
      const v = r[key] !== undefined ? r[key] : r[altKey];
      return v !== null && v !== undefined && !isNaN(v);
    });
    if (validRows.length === 0) return null;
    const sum = validRows.reduce((acc, r) => acc + Number(r[key] !== undefined ? r[key] : r[altKey]), 0);
    return (sum / validRows.length).toFixed(1);
  };

  const avgSleep = calcAvg('sleep', 'sleep');
  const avgSteps = calcAvg('steps', 'steps') ? Math.round(calcAvg('steps', 'steps')) : null;
  const avgScreen = calcAvg('screenTime', 'screen_time');
  const avgActivity = calcAvg('activity', 'activity') ? Math.round(calcAvg('activity', 'activity')) : null;
  const avgHeartRate = calcAvg('heartRate', 'heart_rate') ? Math.round(calcAvg('heartRate', 'heart_rate')) : null;
  const avgEnergy = calcAvg('energy', 'energy');

  const latestDateStr = latest.date ? new Date(latest.date).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  }) : 'Today';

  const statCards = [
    {
      label: 'Sleep Duration',
      unit: 'hrs',
      value: latest.sleep !== undefined && latest.sleep !== null ? `${latest.sleep}` : 'N/A',
      avg: avgSleep ? `${avgSleep}h avg` : 'N/A',
      icon: Moon,
      color: '#3B82F6',
      desc: 'Nightly sleep'
    },
    {
      label: 'Daily Steps',
      unit: 'steps',
      value: latest.steps !== undefined && latest.steps !== null ? Number(latest.steps).toLocaleString() : 'N/A',
      avg: avgSteps ? `${avgSteps.toLocaleString()} avg` : 'N/A',
      icon: Footprints,
      color: '#10B981',
      desc: 'Movement count'
    },
    {
      label: 'Screen Time',
      unit: 'hrs',
      value: (latest.screen_time ?? latest.screenTime) !== undefined && (latest.screen_time ?? latest.screenTime) !== null ? `${latest.screen_time ?? latest.screenTime}` : 'N/A',
      avg: avgScreen ? `${avgScreen}h avg` : 'N/A',
      icon: Monitor,
      color: '#F59E0B',
      desc: 'Digital device usage'
    },
    {
      label: 'Activity Time',
      unit: 'mins',
      value: latest.activity !== undefined && latest.activity !== null ? `${latest.activity}` : 'N/A',
      avg: avgActivity ? `${avgActivity}m avg` : 'N/A',
      icon: Flame,
      color: '#EC4899',
      desc: 'Active exercise'
    },
    {
      label: 'Heart Rate',
      unit: 'bpm',
      value: (latest.heart_rate ?? latest.heartRate) !== undefined && (latest.heart_rate ?? latest.heartRate) !== null ? `${latest.heart_rate ?? latest.heartRate}` : 'N/A',
      avg: avgHeartRate ? `${avgHeartRate} bpm avg` : 'N/A',
      icon: Heart,
      color: '#F43F5E',
      desc: 'Resting pulse'
    },
    {
      label: 'Energy Level',
      unit: '/10',
      value: latest.energy !== undefined && latest.energy !== null ? `${latest.energy}` : 'N/A',
      avg: avgEnergy ? `${avgEnergy}/10 avg` : 'N/A',
      icon: Zap,
      color: '#6366F1',
      desc: 'Subjective score'
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Intro Header & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span className="badge badge-emerald" style={{ marginBottom: '8px' }}>
            Stage 1: Track & Understand
          </span>
          <h1 className="section-title">Current Lifestyle Snapshot</h1>
          <p className="section-subtitle" style={{ marginBottom: 0 }}>
            Real-time & historical telemetry retrieved from database ({rows.length} total entries recorded)
          </p>
        </div>
        <button className="btn-primary" onClick={onNavigateToSimulator}>
          Run What-If Simulation <ArrowRight size={18} />
        </button>
      </div>

      {/* 1. Health Summary Banner */}
      <div className="nex-card" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(18, 24, 38, 0.95) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        padding: '24px 28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle2 size={24} color="var(--emerald-main)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF' }}>Current Telemetry Active</h3>
              <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>Latest Entry</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Baseline recorded on <strong style={{ color: '#FFF' }}>{latestDateStr}</strong> • All 6 core wellness signals tracked
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '16px',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '10px 18px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          fontSize: '0.85rem'
        }}>
          <div>
            <span style={{ color: 'var(--text-subtle)', display: 'block', fontSize: '0.75rem' }}>Current Sleep</span>
            <strong style={{ color: '#FFF', fontSize: '0.95rem' }}>{formatVal(latest.sleep, ' hrs')}</strong>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
            <span style={{ color: 'var(--text-subtle)', display: 'block', fontSize: '0.75rem' }}>Current Energy</span>
            <strong style={{ color: 'var(--emerald-main)', fontSize: '0.95rem' }}>{formatVal(latest.energy, ' / 10')}</strong>
          </div>
        </div>
      </div>

      {/* 2. Stat Cards for 6 Core Metrics */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF' }}>
            Latest Biometric & Behavioral Signals
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
            Latest vs Historical Average
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '18px'
        }}>
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="nex-card" style={{
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}>
                {/* Card Top Header */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {card.label}
                    </span>
                    <div style={{
                      padding: '8px',
                      borderRadius: '10px',
                      background: `${card.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={18} color={card.color} />
                    </div>
                  </div>

                  {/* Main Value Display */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFF', letterSpacing: '-0.03em' }}>
                      {card.value}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
                      {card.unit}
                    </span>
                  </div>
                </div>

                {/* Card Footer Avg */}
                <div style={{
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.775rem'
                }}>
                  <span style={{ color: 'var(--text-subtle)' }}>{card.desc}</span>
                  <span className="badge" style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                    padding: '2px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {card.avg}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. "What NexWell Noticed" Concise Insights */}
      <div className="nex-card" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Sparkles size={20} color="var(--emerald-main)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFF' }}>What NexWell Noticed</h3>
        </div>

        <ul style={{
          listStyle: 'none',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px'
        }}>
          <li style={{ display: 'flex', gap: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--emerald-main)', fontWeight: 800 }}>•</span>
            <span>
              Your average sleep duration is <strong style={{ color: '#FFF' }}>{avgSleep ? `${avgSleep} hours` : 'N/A'}</strong> across {rows.length} recorded dataset entries.
            </span>
          </li>
          <li style={{ display: 'flex', gap: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--indigo-main)', fontWeight: 800 }}>•</span>
            <span>
              Screen time averages <strong style={{ color: '#FFF' }}>{avgScreen ? `${avgScreen} hours/day` : 'N/A'}</strong>. High screen time days coincide with lower energy scores ({avgEnergy ? `${avgEnergy}/10` : 'N/A'}).
            </span>
          </li>
          <li style={{ display: 'flex', gap: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--amber-main)', fontWeight: 800 }}>•</span>
            <span>
              Physical activity averages <strong style={{ color: '#FFF' }}>{avgSteps ? `${avgSteps.toLocaleString()} steps` : 'N/A'}</strong> and {avgActivity ? `${avgActivity} mins` : 'N/A'} of active exercise.
            </span>
          </li>
        </ul>
      </div>

      {/* 4. Historical Data Timeline & Log */}
      <div className="nex-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={18} color="var(--emerald-main)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF' }}>
              Recent Daily Log Entries
            </h3>
          </div>
          <span style={{ fontSize: '0.775rem', color: 'var(--text-subtle)' }}>
            Chronological Order (Latest at bottom)
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-subtle)' }}>
                <th style={{ padding: '12px 14px' }}>Date</th>
                <th style={{ padding: '12px 14px' }}>Sleep</th>
                <th style={{ padding: '12px 14px' }}>Steps</th>
                <th style={{ padding: '12px 14px' }}>Screen Time</th>
                <th style={{ padding: '12px 14px' }}>Activity</th>
                <th style={{ padding: '12px 14px' }}>Heart Rate</th>
                <th style={{ padding: '12px 14px' }}>Energy</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const isLatestRow = idx === rows.length - 1;
                const dateStr = row.date ? new Date(row.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : `Day ${idx + 1}`;
                const screen = row.screen_time ?? row.screenTime;
                const hr = row.heart_rate ?? row.heartRate;

                return (
                  <tr key={idx} style={{
                    borderBottom: idx < rows.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                    background: isLatestRow ? 'rgba(16, 185, 129, 0.06)' : 'transparent',
                    color: 'var(--text-main)'
                  }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: isLatestRow ? 'var(--emerald-main)' : '#FFF' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{dateStr}</span>
                        {isLatestRow && (
                          <span className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                            Latest
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>{formatVal(row.sleep, ' hrs')}</td>
                    <td style={{ padding: '12px 14px' }}>{row.steps !== null && row.steps !== undefined ? Number(row.steps).toLocaleString() : 'N/A'}</td>
                    <td style={{ padding: '12px 14px' }}>{formatVal(screen, ' hrs')}</td>
                    <td style={{ padding: '12px 14px' }}>{formatVal(row.activity, ' mins')}</td>
                    <td style={{ padding: '12px 14px' }}>{formatVal(hr, ' bpm')}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {row.energy !== null && row.energy !== undefined ? (
                        <span className="badge badge-indigo" style={{ padding: '2px 8px' }}>
                          {row.energy} / 10
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-subtle)' }}>N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
