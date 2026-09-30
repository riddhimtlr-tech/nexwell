import React, { useState } from 'react';

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
    setSaved(true);
  };

  return (
    <section className="profile-page">
      <div className="profile-header">
        <div>
          <span className="section-kicker">PERSONALIZATION</span>
          <h1>Your Profile</h1>
          <p>
            Customize the goals and preferences NexWell uses to personalize
            your wellness experience.
          </p>
        </div>

        <div className="profile-status">
          <span className="status-dot" />
          Demo profile
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-card profile-identity">
          <div className="profile-avatar">
            {profile.name.charAt(0).toUpperCase()}
          </div>

          <h2>{profile.name}</h2>
          <p>Personal wellness profile</p>

          <div className="profile-summary">
            <div>
              <span>Age</span>
              <strong>{profile.age}</strong>
            </div>
            <div>
              <span>Primary goal</span>
              <strong>{profile.goal}</strong>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">YOUR DETAILS</span>
              <h2>Personal information</h2>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Name
              <input
                value={profile.name}
                onChange={(e) => handleChange('name', e.target.value)}
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
                  handleChange('age', Number(e.target.value))
                }
              />
            </label>

            <label className="full-width">
              Main wellness goal
              <select
                value={profile.goal}
                onChange={(e) => handleChange('goal', e.target.value)}
              >
                <option>Improve daily energy</option>
                <option>Build a consistent sleep routine</option>
                <option>Increase daily movement</option>
                <option>Reduce screen time</option>
                <option>Understand my personal patterns</option>
              </select>
            </label>
          </div>
        </div>

        <div className="profile-card full-width">
          <div className="card-heading">
            <div>
              <span className="section-kicker">PERSONAL TARGETS</span>
              <h2>Your wellness targets</h2>
              <p>
                These are personal targets for the demo experience. They are
                not medical recommendations.
              </p>
            </div>
          </div>

          <div className="target-grid">
            <label className="target-card">
              <span>Sleep target</span>
              <div className="target-input">
                <input
                  type="number"
                  min="0"
                  max="12"
                  step="0.5"
                  value={profile.sleepTarget}
                  onChange={(e) =>
                    handleChange('sleepTarget', Number(e.target.value))
                  }
                />
                <span>hours</span>
              </div>
            </label>

            <label className="target-card">
              <span>Activity target</span>
              <div className="target-input">
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={profile.activityTarget}
                  onChange={(e) =>
                    handleChange('activityTarget', Number(e.target.value))
                  }
                />
                <span>min/day</span>
              </div>
            </label>

            <label className="target-card">
              <span>Screen time target</span>
              <div className="target-input">
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={profile.screenTimeTarget}
                  onChange={(e) =>
                    handleChange('screenTimeTarget', Number(e.target.value))
                  }
                />
                <span>hours/day</span>
              </div>
            </label>
          </div>
        </div>

        <div className="profile-card full-width connected-card">
          <div>
            <span className="section-kicker">CONNECTED DATA</span>
            <h2>Health data connection</h2>
            <p>
              Your dashboard can use connected health data to build your
              personal wellness picture.
            </p>
          </div>

          <div className="connection-status">
            <span className="status-dot" />
            Demo connection
          </div>
        </div>
      </div>

      <div className="profile-actions">
        {saved && <span className="saved-message">Profile saved locally.</span>}
        <button className="primary-button" onClick={handleSave}>
          Save Profile
        </button>
      </div>
    </section>
  );
}

export default Profile;