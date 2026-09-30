import React, { useState } from 'react';
import {
  CheckCircle2,
  Target,
  Moon,
  Activity,
  Monitor,
  User,
  Sparkles,
} from 'lucide-react';

const demoProfile = {
  name: 'Subhiksha',
  age: 17,
  goal: 'Improve daily energy',
  sleepTarget: 8,
  activityTarget: 45,
  screenTimeTarget: 5,
};

function Profile() {
  const [profile, setProfile] = useState(demoProfile);
  const [saved, setSaved] = useState(false);

  const handleChange = (field, value) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  };

  const handleSave = () => {
    // Frontend demo only.
    // These preferences can be connected to the backend later.
    setSaved(true);
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
          Demo profile
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
              <strong>{profile.goal}</strong>
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
              These are personal targets for the demo
              experience, not medical recommendations.
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
            Demo connection
          </div>
        </div>
      </div>

      {/* Save actions */}
      <div className="profile-actions">
        {saved && (
          <span className="saved-message">
            <CheckCircle2 size={16} />
            Profile saved locally.
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