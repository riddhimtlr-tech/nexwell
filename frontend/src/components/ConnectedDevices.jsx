
import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Smartphone,
  Watch,
  RefreshCw
} from 'lucide-react';

const demoDevices = [
  {
    id: 'health-connect',
    name: 'Health Connect',
    description:
      'Sync activity, sleep, steps, and heart-rate signals.',
    icon: Activity,
    status: 'Connected',
    lastSync: 'Just now'
  },
  {
    id: 'smartphone',
    name: 'Phone Activity',
    description:
      'Use your phone to capture daily movement and screen-time signals.',
    icon: Smartphone,
    status: 'Connected',
    lastSync: '2 min ago'
  },
  {
    id: 'wearable',
    name: 'Wearable Device',
    description:
      'Optional wearable data for additional wellness signals.',
    icon: Watch,
    status: 'Not connected',
    lastSync: '—'
  }
];

function ConnectedDevices() {
  const [devices, setDevices] = useState(demoDevices);

  const handleToggle = (deviceId) => {
    setDevices((current) =>
      current.map((device) => {
        if (device.id !== deviceId) {
          return device;
        }

        const connected = device.status === 'Connected';

        return {
          ...device,
          status: connected ? 'Not connected' : 'Connected',
          lastSync: connected ? '—' : 'Just now'
        };
      })
    );
  };

  const handleRefresh = () => {
    setDevices((current) =>
      current.map((device) =>
        device.status === 'Connected'
          ? {
              ...device,
              lastSync: 'Just now'
            }
          : device
      )
    );
  };

  const connectedCount = devices.filter(
    (device) => device.status === 'Connected'
  ).length;

  return (
    <section className="devices-page">
      <div className="devices-header">
        <div>
          <span className="section-kicker">CONNECTED DATA</span>

          <h1>Your Connected Devices</h1>

          <p>
            Choose which data sources NexWell can use to build
            your personalized wellness picture.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={handleRefresh}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="devices-summary">
        <div>
          <span className="summary-number">
            {connectedCount}
          </span>

          <span className="summary-label">
            Connected sources
          </span>
        </div>

        <div className="sync-summary">
          <span className="status-dot" />
          Demo sync active
        </div>
      </div>

      <div className="device-list">
        {devices.map((device) => {
          const Icon = device.icon;
          const connected = device.status === 'Connected';

          return (
            <article
              className="device-card"
              key={device.id}
            >
              <div className="device-icon">
                <Icon size={24} />
              </div>

              <div className="device-info">
                <div className="device-title-row">
                  <h2>{device.name}</h2>

                  <span
                    className={
                      connected
                        ? 'device-status connected'
                        : 'device-status'
                    }
                  >
                    {connected && (
                      <CheckCircle2 size={14} />
                    )}

                    {device.status}
                  </span>
                </div>

                <p>{device.description}</p>

                <span className="last-sync">
                  Last sync: {device.lastSync}
                </span>
              </div>

              <button
                className={
                  connected
                    ? 'device-button connected'
                    : 'device-button'
                }
                onClick={() => handleToggle(device.id)}
              >
                {connected ? 'Disconnect' : 'Connect'}
              </button>
            </article>
          );
        })}
      </div>

      <div className="devices-note">
        <div className="devices-note-icon">
          <Activity size={18} />
        </div>

        <div>
          <h3>How NexWell uses connected data</h3>

          <p>
            Connected signals can appear in your dashboard,
            help identify personal patterns, and support
            What-If simulations. This demo uses sample data
            while the real data connection is integrated.
          </p>
        </div>
      </div>
    </section>
  );
}

export default ConnectedDevices;