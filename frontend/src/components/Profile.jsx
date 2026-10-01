import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  CheckCircle2,
  Target,
  Moon,
  Activity,
  Monitor,
  User,
  Sparkles,
} from 'lucide-react';

const fromApi = (p, user) => ({
  name: p?.name ?? user?.name ?? '',
  email: p?.email ?? user?.email ?? '',
  age: p?.age ?? '',
  goal: p?.goal ?? '',
  sleepTarget: p?.sleep_target ?? '',
  activityTarget: p?.activity_target ?? '',
  screenTimeTarget: p?.screen_time_target ?? '',
});

function Profile({ user, onProfileSaved }) {
  const [profile, setProfile] = useState(() => fromApi(null, user));
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    api
      .getProfile()
      .then((res) => setProfile(fromApi(res.profile, user)))
      .catch((err) => setSaveError(err.message));
  }, []);

  const handleChange = (field, value) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      const res = await api.saveProfile(profile);
      setProfile(fromApi(res.profile, user));
      setSaved(true);
      onProfileSaved?.(res.profile);
    } catch (err) {
      setSaved(false);
      setSaveError(err.message || 'Could not save profile');
    }
  };

  return (
    <section className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div>
          <span className="section-kicker">
            PERSONALIZATION
          </span>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              marginTop: '6px',
            }}
          >
            <h1>Your Profile</h1>

            <span className="badge badge-emerald">
              Personalize
            </span>
          </div>

          <p>
            Customize the goals and preferences NexWell uses
            to personalize your wellness experience.
          </p>
        </div>

        <div className="profile-status">
          <span className="status-dot" />
          {profile.email || 'Your account'}
        </div>
      </div>

      {/* Profile content */}
      <div className="profile-grid">
        {/* Identity card */}
        <div className="profile-card profile-identity">
          <div className="profile-avatar">
            {profile.name
              ? profile.name.charAt(0).toUpperCase()
              : 'N'}
          </div>

          <h2>
            {profile.name || 'Your Profile'}
          </h2>

          <p>Personal wellness profile</p>

          <div className="profile-summary">
            <div>
              <span>Age</span>
              <strong>{profile.age || '—'}</strong>
            </div>

            <div>
              <span>Primary goal</span>
              <strong>{profile.goal || '—'}</strong>
            </div>
          </div>
        </div>

        {/* Personal information */}
        <div className="profile-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">
                YOUR DETAILS
              </span>

              <h2>Personal information</h2>

              <p>
                Keep your basic profile preferences up to
                date.
              </p>
            </div>

            <div className="profile-heading-icon">
              <User size={20} />
            </div>
          </div>

          <div className="form-grid">
            <label>
              Name

              <input
                type="text"
                value={profile.name}
                placeholder="Your name"
                onChange={(e) =>
                  handleChange(
                    'name',
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Age

              <input
                type="number"
                min="13"
                max="100"
                value={profile.age}
                onChange={(e) =>
                  handleChange(
                    'age',
                    Number(e.target.value)
                  )
                }
              />
            </label>

            <label className="full-width">
              Main wellness goal

              <select
                value={profile.goal}
                onChange={(e) =>
                  handleChange(
                    'goal',
                    e.target.value
                  )
                }
              >
                <option>
                  Improve daily energy
                </option>

                <option>
                  Build a consistent sleep routine
                </option>

                <option>
                  Increase daily movement
                </option>

                <option>
                  Reduce screen time
                </option>

                <option>
                  Understand my personal patterns
                </option>
              </select>
            </label>
          </div>
        </div>

        {/* Personal targets */}
        <div className="profile-card full-width">
          <div className="card-heading">
            <div>
              <span className="section-kicker">
                PERSONAL TARGETS
              </span>

              <h2>Your wellness targets</h2>

              <p>
                Set personal reference points that NexWell
                can use to make your dashboard more
                relevant.
              </p>
            </div>

            <div className="profile-heading-icon">
              <Target size={20} />
            </div>
          </div>

          <div className="target-grid">
            {/* Sleep */}
            <label className="target-card">
              <div className="target-card-heading">
                <div className="target-icon sleep">
                  <Moon size={18} />
                </div>

                <div>
                  <span>Sleep target</span>

                  <small>
                    Personal reference
                  </small>
                </div>
              </div>

              <div className="target-input">
                <input
                  type="number"
                  min="0"
                  max="12"
                  step="0.5"
                  value={profile.sleepTarget}
                  onChange={(e) =>
                    handleChange(
                      'sleepTarget',
                      Number(e.target.value)
                    )
                  }
                />

                <span>hours</span>
              </div>
            </label>

            {/* Activity */}
            <label className="target-card">
              <div className="target-card-heading">
                <div className="target-icon activity">
                  <Activity size={18} />
                </div>

                <div>
                  <span>Activity target</span>

                  <small>
                    Personal reference
                  </small>
                </div>
              </div>

              <div className="target-input">
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={profile.activityTarget}
                  onChange={(e) =>
                    handleChange(
                      'activityTarget',
                      Number(e.target.value)
                    )
                  }
                />

                <span>min/day</span>
              </div>
            </label>

            {/* Screen time */}
            <label className="target-card">
              <div className="target-card-heading">
                <div className="target-icon screen">
                  <Monitor size={18} />
                </div>

                <div>
                  <span>Screen time target</span>

                  <small>
                    Personal reference
                  </small>
                </div>
              </div>

              <div className="target-input">
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={profile.screenTimeTarget}
                  onChange={(e) =>
                    handleChange(
                      'screenTimeTarget',
                      Number(e.target.value)
                    )
                  }
                />

                <span>hours/day</span>
              </div>
            </label>
          </div>

          <div className="profile-target-note">
            <Sparkles size={16} />

            <span>
              These are your personal targets, saved to
              your account. They are not medical recommendations.
            </span>
          </div>
        </div>

        {/* Connected data */}
        <div className="profile-card full-width connected-card">
          <div className="connected-card-content">
            <div className="profile-heading-icon">
              <Activity size={20} />
            </div>

            <div>
              <span className="section-kicker">
                CONNECTED DATA
              </span>

              <h2>Health data connection</h2>

              <p>
                Connected wellness signals can help build
                your personal dashboard and identify
                patterns in your recent data.
              </p>
            </div>
          </div>

          <div className="connection-status">
            <CheckCircle2 size={15} />
            See Connected Devices
          </div>
        </div>
      </div>

      {/* Save actions */}
      <div className="profile-actions">
        {saveError && (
          <span className="saved-message" style={{ color: 'var(--rose-main)' }}>
            {saveError}
          </span>
        )}

        {saved && (
          <span className="saved-message">
            <CheckCircle2 size={16} />
            Profile saved to your account.
          </span>
        )}

        <button
          className="primary-button"
          onClick={handleSave}
        >
          Save Profile
        </button>
      </div>
    </section>
  );
}

export default Profile;