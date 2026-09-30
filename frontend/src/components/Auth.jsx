import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';

function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  const isSignup = mode === 'signup';

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Frontend demo only.
    // Replace this with the real authentication API later.
    onLogin?.();
  };

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <Activity size={22} />
          </div>

          <span>NexWell</span>
        </div>

        <div className="auth-visual-content">
          <span className="section-kicker">
            PERSONAL WELLNESS
          </span>

          <h1>
            Your health data.
            <br />
            Your patterns.
            <br />
            Your next step.
          </h1>

          <p>
            NexWell helps you understand your personal wellness
            signals, explore patterns, and test small changes
            through measurable experiments.
          </p>

          <div className="auth-features">
            <div>
              <ShieldCheck size={18} />
              <span>Your data stays personal</span>
            </div>

            <div>
              <Activity size={18} />
              <span>Built around your own signals</span>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-card-header">
            <span className="section-kicker">
              {isSignup ? 'GET STARTED' : 'WELCOME BACK'}
            </span>

            <h2>
              {isSignup
                ? 'Create your NexWell account'
                : 'Welcome back'}
            </h2>

            <p>
              {isSignup
                ? 'Start building a personalized wellness picture.'
                : 'Continue exploring your personal wellness journey.'}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={!isSignup ? 'active' : ''}
              onClick={() => setMode('login')}
            >
              Log in
            </button>

            <button
              type="button"
              className={isSignup ? 'active' : ''}
              onClick={() => setMode('signup')}
            >
              Sign up
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >
            {isSignup && (
              <label>
                <span>Name</span>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                />
              </label>
            )}

            <label>
              <span>Email</span>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              <span>Password</span>

              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </label>

            <button
              type="submit"
              className="auth-submit"
            >
              {isSignup ? 'Create account' : 'Continue'}

              <ArrowRight size={17} />
            </button>
          </form>

          <p className="auth-demo-note">
            Demo mode: authentication is simulated locally.
            Real account integration can be connected later.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Auth;