import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FlaskConical, Sliders, ArrowRight, Sparkles, RefreshCw, Moon, Zap, Play, ShieldAlert, Info, CheckCircle2 } from 'lucide-react';

export default function WhatIfSimulator({ userId, selectedFactor, onStartExperimentFromSimulation }) {
  const [field, setField] = useState(selectedFactor || 'screenTime');
  const [delta, setDelta] = useState(field === 'screenTime' ? -2 : field === 'steps' ? 2000 : 30);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync field if selectedFactor changes externally
  useEffect(() => {
    if (selectedFactor) {
      setField(selectedFactor);
      if (selectedFactor === 'screenTime') setDelta(-2);
      else if (selectedFactor === 'steps') setDelta(2000);
      else if (selectedFactor === 'activity') setDelta(30);
    }
  }, [selectedFactor]);

  // Run simulation API call
  const handleSimulate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.runSimulation(userId, field, delta);
      setSimulationResult(res.simulation || res);
    } catch (err) {
      setError(err.message || 'Unable to run simulation. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  // Run initial simulation on component mount or field change
  useEffect(() => {
    handleSimulate();
  }, [userId, field]);

  // Adjust default delta when factor dropdown changes
  const handleFieldChange = (newField) => {
    setField(newField);
    if (newField === 'screenTime') setDelta(-2);
    else if (newField === 'steps') setDelta(2000);
    else if (newField === 'activity') setDelta(30);
  };

  // Human-readable labels
  const formatLabel = (f) => {
    const labels = {
      screenTime: 'Screen Time',
      sleep: 'Sleep',
      steps: 'Steps',
      activity: 'Activity',
      heartRate: 'Heart Rate',
      energy: 'Energy',
    };
    return labels[f] || f;
  };

  const getDeltaUnit = (f) => {
    if (f === 'screenTime') return 'hrs';
    if (f === 'steps') return 'steps';
    if (f === 'activity') return 'mins';
    return '';
  };

  const current = simulationResult?.current || {};
  const estimated = simulationResult?.estimated || {};
  const confidence = simulationResult?.confidence || 'estimate';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* 1. Clear Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span className="badge badge-emerald" style={{ marginBottom: '8px' }}>
            Stage 3: Simulate
          </span>
          <h1 className="section-title">What-If Simulator</h1>
          <p className="section-subtitle" style={{ marginBottom: 0 }}>
            Estimate how a proposed lifestyle adjustment might impact your sleep and energy based on your historical data model.
          </p>
        </div>

        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '8px 14px',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem',
          color: 'var(--emerald-main)',
          fontWeight: 600
        }}>
          <FlaskConical size={16} /> Interactive Predictive Sandbox
        </div>
      </div>

      {/* 2. Example / Helper Text Callout */}
      <div className="nex-card" style={{
        background: 'rgba(99, 102, 241, 0.06)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px'
      }}>
        <Info size={20} color="var(--indigo-main)" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
          <strong style={{ color: '#FFF' }}>How it works:</strong> Choose a habit to modify (e.g. <em>"What if I decrease screen time by 2 hours?"</em>) and adjust the delta slider. The simulator calculates projected sleep and energy outcomes using simple linear regression trained on your historical logs.
        </p>
      </div>

      {/* 3. Simulator Layout Grid (Controls Left, Results Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(300px, 1fr) minmax(340px, 1.2fr)',
        gap: '24px'
      }}>
        
        {/* Left Column: Configure Scenario */}
        <div className="nex-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
            <Sliders size={20} color="var(--emerald-main)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFF' }}>1. Configure Proposed Scenario</h3>
          </div>

          {/* Factor Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Lifestyle Factor to Adjust
            </label>
            <select
              value={field}
              onChange={(e) => handleFieldChange(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: '#FFF',
                fontWeight: 600,
                fontSize: '0.95rem',
                outline: 'none'
              }}
            >
              <option value="screenTime">Screen Time (hours)</option>
              <option value="steps">Steps (daily count)</option>
              <option value="activity">Activity (minutes)</option>
            </select>
          </div>

          {/* Proposed Change / Delta Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Proposed Change (Delta)
              </label>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--emerald-main)' }}>
                {delta > 0 ? `+${delta}` : delta} {getDeltaUnit(field)}
              </span>
            </div>

            {/* Sliders for each field type */}
            {field === 'screenTime' && (
              <input
                type="range"
                min="-5"
                max="5"
                step="0.5"
                value={delta}
                onChange={(e) => setDelta(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--emerald-main)', cursor: 'pointer' }}
              />
            )}

            {field === 'steps' && (
              <input
                type="range"
                min="-5000"
                max="10000"
                step="500"
                value={delta}
                onChange={(e) => setDelta(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--emerald-main)', cursor: 'pointer' }}
              />
            )}

            {field === 'activity' && (
              <input
                type="range"
                min="-60"
                max="90"
                step="5"
                value={delta}
                onChange={(e) => setDelta(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--emerald-main)', cursor: 'pointer' }}
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
              <span>Decrease (-)</span>
              <span>Increase (+)</span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 700, display: 'block', marginBottom: '8px', letterSpacing: '0.05em' }}>
              POPULAR PRESET SCENARIOS
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                onClick={() => { setField('screenTime'); setDelta(-2); }}
              >
                -2h Screen Time
              </button>
              <button
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                onClick={() => { setField('steps'); setDelta(3000); }}
              >
                +3,000 Steps
              </button>
              <button
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                onClick={() => { setField('activity'); setDelta(30); }}
              >
                +30m Activity
              </button>
            </div>
          </div>

          {/* Recalculate Button */}
          <button
            className="btn-primary"
            onClick={handleSimulate}
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '6px' }}
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} />}
            {loading ? 'Calculating Model...' : 'Recalculate Simulation'}
          </button>
        </div>

        {/* Right Column: Results Section */}
        <div className="nex-card" style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #121826 0%, #161F30 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)'
        }}>
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={20} color="var(--emerald-main)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFF' }}>2. Simulation Output</h3>
              </div>
              <span className="badge badge-emerald">
                Confidence: {confidence}
              </span>
            </div>

            {/* Loading & Error States */}
            {loading && (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <RefreshCw size={28} className="animate-spin" color="var(--emerald-main)" />
                <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Computing regression model from database...</p>
              </div>
            )}

            {error && (
              <div style={{ padding: '16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--rose-main)', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            {/* Results Grid */}
            {!loading && !error && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Proposed Change Summary Pill */}
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.875rem'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>Proposed Change:</span>
                  <strong style={{ color: 'var(--emerald-main)', fontSize: '0.95rem' }}>
                    {formatLabel(field)} {delta > 0 ? `+${delta}` : delta} {getDeltaUnit(field)}
                  </strong>
                </div>

                {/* Side-by-side Current vs Estimated */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}>
                  
                  {/* Current Baseline */}
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 700, letterSpacing: '0.05em' }}>
                      CURRENT BASELINE
                    </span>

                    <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Moon size={16} color="#3B82F6" />
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Sleep:</span>
                        <strong style={{ fontSize: '1.1rem', color: '#FFF' }}>
                          {current.sleep !== undefined && current.sleep !== null ? `${current.sleep} hrs` : 'N/A'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={16} color="#6366F1" />
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Energy:</span>
                        <strong style={{ fontSize: '1.1rem', color: '#FFF' }}>
                          {current.energy !== undefined && current.energy !== null ? `${current.energy} / 10` : 'N/A'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Estimated Result */}
                  <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--emerald-main)', fontWeight: 700, letterSpacing: '0.05em' }}>
                      ESTIMATED RESULT
                    </span>

                    <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Moon size={16} color="#3B82F6" />
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Sleep:</span>
                        <strong style={{ fontSize: '1.2rem', color: 'var(--emerald-main)', fontWeight: 800 }}>
                          {estimated.sleep !== undefined && estimated.sleep !== null ? `${estimated.sleep} hrs` : 'N/A'}
                        </strong>
                        {estimated.sleep !== undefined && current.sleep !== undefined && (
                          <span style={{ fontSize: '0.75rem', color: estimated.sleep >= current.sleep ? 'var(--emerald-main)' : 'var(--amber-main)', fontWeight: 700 }}>
                            ({estimated.sleep >= current.sleep ? '+' : ''}{(estimated.sleep - current.sleep).toFixed(1)}h)
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={16} color="#6366F1" />
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Energy:</span>
                        <strong style={{ fontSize: '1.2rem', color: 'var(--emerald-main)', fontWeight: 800 }}>
                          {estimated.energy !== undefined && estimated.energy !== null ? `${estimated.energy} / 10` : 'N/A'}
                        </strong>
                        {estimated.energy !== undefined && current.energy !== undefined && (
                          <span style={{ fontSize: '0.75rem', color: estimated.energy >= current.energy ? 'var(--emerald-main)' : 'var(--amber-main)', fontWeight: 700 }}>
                            ({estimated.energy >= current.energy ? '+' : ''}{(estimated.energy - current.energy).toFixed(1)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Neutral Disclaimer Note */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  fontSize: '0.775rem',
                  color: 'var(--text-subtle)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)'
                }}>
                  <ShieldAlert size={16} color="var(--amber-main)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    This is a model-based estimate derived from historical data, not a guaranteed outcome or medical prediction.
                  </span>
                </div>

              </div>
            )}
          </div>

          {/* CTA: Turn Scenario into 7-Day Experiment */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
            <button
              className="btn-primary"
              onClick={() => onStartExperimentFromSimulation({ goalField: field, targetChange: delta })}
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '14px 20px',
                fontSize: '0.95rem'
              }}
            >
              Turn Scenario into 7-Day Experiment <ArrowRight size={18} />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
