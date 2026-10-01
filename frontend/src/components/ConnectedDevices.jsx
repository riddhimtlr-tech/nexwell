import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Smartphone,
  PenLine,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

// Real, per-user sources. Status comes from what this user has actually synced.
const SOURCES = [
  {
    id: 'health_connect',
    name: 'Health Connect (Android app)',
    description:
      'Steps read from Health Connect on your phone and synced by the NexWell Android app. Currently syncs steps only.',
    icon: Smartphone
  },
  {
    id: 'manual',
    name: 'Manual entries',
    description:
      'Sleep, screen time, activity, heart rate and energy you log on the dashboard.',
    icon: PenLine
  }
];

const formatWhen = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d) ? String(value) : d.toLocaleString();
};

function ConnectedDevices() {
  const [sources, setSources] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSyncStatus();
      setSources(res.sources || {});
    } catch (err) {
      setError(err.message || 'Could not load sync status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const connectedCount = SOURCES.filter((s) => sources[s.id]).length;

  return (
    <section className="devices-page">
      <div className="devices-header">
        <div>
          <span className="section-kicker">CONNECTED DATA</span>
          <h1>Your Data Sources</h1>
          <p>Where the data on your dashboard comes from. Only your own account’s data is shown.</p>
        </div>

        <button className="secondary-button" onClick={load} disabled={loading}>
          <RefreshCw size={16} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="devices-summary">
        <div>
          <span className="summary-number">{connectedCount}</span>
          <span className="summary-label">Sources with data</span>
        </div>
        <div className="sync-summary">
          <span className="status-dot" />
          {error ? error : 'Live from your account'}
        </div>
      </div>

      <div className="device-list">
        {SOURCES.map((source) => {
          const Icon = source.icon;
          const info = sources[source.id];
          const active = Boolean(info);

          return (
            <article className="device-card" key={source.id}>
              <div className="device-icon">
                <Icon size={24} />
              </div>

              <div className="device-info">
                <div className="device-title-row">
                  <h2>{source.name}</h2>
                  <span className={active ? 'device-status connected' : 'device-status'}>
                    {active && <CheckCircle2 size={14} />}
                    {active ? `${info.days} day${info.days === 1 ? '' : 's'} synced` : 'No data yet'}
                  </span>
                </div>

                <p>{source.description}</p>

                <span className="last-sync">
                  Last synced: {active ? formatWhen(info.last_synced_at) : '—'}
                  {active && info.last_date ? ` • latest day: ${info.last_date}` : ''}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="devices-note">
        <div className="devices-note-icon">
          <Activity size={18} />
        </div>
        <div>
          <h3>How to connect your phone</h3>
          <p>
            Install the NexWell Android app, log in with the same email you use here, tap
            “Connect Health Data”, then “Sync Steps to NexWell”. Your dashboard refreshes
            automatically within 30 seconds.
          </p>
        </div>
      </div>
    </section>
  );
}

export default ConnectedDevices;
