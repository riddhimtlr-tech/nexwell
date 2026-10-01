import React from 'react';

import {
  Activity,
  FlaskConical,
  LineChart,
  Sparkles,
  UserCheck,
  Layers,
  User,
  Smartphone
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  onLogout
}) {
  const tabs = [
    {
      id: 'overview',
      label: '1. Overview',
      subLabel: 'Track',
      icon: LineChart
    },
    {
      id: 'patterns',
      label: '2. Patterns',
      subLabel: 'Discover',
      icon: Sparkles
    },
    {
      id: 'simulator',
      label: '3. What-If Simulator',
      subLabel: 'Simulate',
      icon: FlaskConical,
      isHero: true
    },
    {
      id: 'experiments',
      label: '4. 7-Day Experiments',
      subLabel: 'Measure',
      icon: Layers
    },
    {
      id: 'profile',
      label: 'Profile',
      subLabel: 'Personalize',
      icon: User
    },
    {
      id: 'devices',
      label: 'Devices',
      subLabel: 'Connect',
      icon: Smartphone
    }
  ];

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'rgba(9, 13, 22, 0.85)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        marginBottom: '32px'
      }}
    >
      <div
        className="app-container"
        style={{ paddingBottom: 0 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 0',
            borderBottom:
              '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background:
                  'linear-gradient(135deg, #10B981 0%, #6366F1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow:
                  '0 4px 14px rgba(16, 185, 129, 0.25)'
              }}
            >
              <Activity
                size={22}
                color="#FFFFFF"
                strokeWidth={2.5}
              />
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    tracking: '-0.03em',
                    color: '#FFF'
                  }}
                >
                  Nex
                  <span
                    style={{
                      color: 'var(--emerald-main)'
                    }}
                  >
                    Well
                  </span>
                </span>

                <span
                  className="badge badge-indigo"
                  style={{
                    fontSize: '0.65rem'
                  }}
                >
                  Experiment Engine
                </span>
              </div>

              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-subtle)',
                  marginTop: '2px'
                }}
              >
                Track → Discover → Simulate → Experiment → Measure
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'var(--bg-card)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)'
            }}
          >
            <UserCheck
              size={16}
              color="var(--emerald-main)"
            />

            <span
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-main)',
                fontWeight: 600
              }}
              title={user?.email || ''}
            >
              {user?.name || user?.email || 'Signed in'}
              {user?.id ? ` · #${user.id}` : ''}
            </span>
            {user?.email && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                {user.email}
              </span>
            )}
            <button
              className="btn-secondary"
              onClick={onLogout}
              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
            >
              Logout
            </button>
          </div>
        </div>

        <nav
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 0 0 0',
            overflowX: 'auto'
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(tab.id)
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 18px',
                  borderRadius:
                    'var(--radius-sm) var(--radius-sm) 0 0',
                  borderBottom: isActive
                    ? '2px solid var(--emerald-main)'
                    : '2px solid transparent',
                  background: isActive
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'transparent',
                  color: isActive
                    ? 'var(--text-main)'
                    : 'var(--text-muted)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <Icon
                  size={18}
                  color={
                    isActive
                      ? 'var(--emerald-main)'
                      : 'var(--text-subtle)'
                  }
                />

                <span>{tab.label}</span>

                {tab.isHero && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      background:
                        'var(--emerald-main)',
                      color: '#000',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    Hero
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}