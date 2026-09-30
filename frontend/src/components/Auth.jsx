import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError('');

    try {
      const response = isSignup
        ? await api.signup(
            form.name,
            form.email,
            form.password
          )
        : await api.login(
            form.email,
            form.password
          );

      localStorage.setItem(
        'nexwell_token',
        response.token
      );

      const user = response.user || {
        id: response.userId,
        name: form.name,
        email: form.email
      };

      localStorage.setItem(
        'nexwell_user',
        JSON.stringify(user)
      );

      onLogin?.(user);
    } catch (err) {
      setError(
        err.message || 'Authentication failed'
      );
    } finally {
      setLoading(false);
    }
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
            Understand your lifestyle, discover patterns,
            and experiment with healthier habits.
          </p>
        </div>

        <div className="auth-visual-footer">
          <ShieldCheck size={18} />
          <span>Your data stays private and secure.</span>
        </div>
      </section>

      <section className="auth-card-wrap">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>
              {isSignup
                ? 'Create your account'
                : 'Welcome back'}
            </h2>

            <p>
              {isSignup
                ? 'Start your personal wellness journey.'
                : 'Continue your wellness journey.'}
            </p>
          </div>

          <div className="auth-toggle">
            <button
              type="button"
              className={!isSignup ? 'active' : ''}
              onClick={() => {
                setMode('login');
                setError('');
              }}
            >
              Login
            </button>

            <button
              type="button"
              className={isSignup ? 'active' : ''}
              onClick={() => {
                setMode('signup');
                setError('');
              }}
            >
              Sign up
            </button>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
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

              <div className="auth-password-field">
                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            {error && (
              <p
                className="auth-demo-note"
                style={{ color: '#b42318' }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              <span>
                {loading
                  ? 'Please wait...'
                  : isSignup
                    ? 'Create account'
                    : 'Continue'}
              </span>

              {!loading && (
                <ArrowRight size={18} />
              )}
            </button>
          </form>

          <p className="auth-footer-text">
            {isSignup
              ? 'Already have an account?'
              : "Don't have an account?"}{' '}

            <button
              type="button"
              onClick={() => {
                setMode(
                  isSignup
                    ? 'login'
                    : 'signup'
                );
                setError('');
              }}
            >
              {isSignup ? 'Login' : 'Sign up'}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Auth;
