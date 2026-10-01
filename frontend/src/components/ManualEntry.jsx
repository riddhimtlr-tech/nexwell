import React, { useState } from 'react';
import { PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

// Local date as YYYY-MM-DD (not UTC, so India users get the right day)
const todayLocal = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const FIELDS = [
  { key: 'sleep', label: 'Sleep (hrs)', step: '0.1', min: 0, max: 24 },
  { key: 'screenTime', label: 'Screen time (hrs)', step: '0.1', min: 0, max: 24 },
  { key: 'activity', label: 'Activity (mins)', step: '1', min: 0, max: 1440 },
  { key: 'energy', label: 'Energy (1-10)', step: '1', min: 1, max: 10 },
  { key: 'heartRate', label: 'Resting HR (bpm)', step: '1', min: 25, max: 250 },
  { key: 'steps', label: 'Steps (optional)', step: '1', min: 0, max: 100000 },
];

const empty = () => ({
  date: todayLocal(),
  sleep: '',
  screenTime: '',
  activity: '',
  energy: '',
  heartRate: '',
  steps: '',
});

export default function ManualEntry({ onSaved }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    const filled = FIELDS.some((f) => String(form[f.key]).trim() !== '');
    if (!filled) {
      setMessage({ type: 'error', text: 'Enter at least one value.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      // Blank fields are sent as '' and stored as NULL — never as fake values.
      // If Android already synced steps today, leaving Steps blank keeps them.
      await api.addManualEntry(form);
      setMessage({ type: 'ok', text: `Saved your entry for ${form.date}.` });
      setForm(empty());
      onSaved?.();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not save entry' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="nex-card" style={{ marginBottom: '24px', padding: '18px 22px' }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}
      >
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF' }}>Log your day</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Steps sync from the NexWell Android app. Add sleep, energy and the rest here.
          </p>
        </div>
        <button className="btn-secondary" onClick={() => setOpen((o) => !o)}>
          <PlusCircle size={16} /> {open ? 'Close' : 'Add entry'}
        </button>
      </div>

      {open && (
        <div style={{ marginTop: '16px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '12px',
            }}
          >
            <label style={labelStyle}>
              Date
              <input
                type="date"
                value={form.date}
                max={todayLocal()}
                onChange={(e) => update('date', e.target.value)}
                style={inputStyle}
              />
            </label>
            {FIELDS.map((f) => (
              <label key={f.key} style={labelStyle}>
                {f.label}
                <input
                  type="number"
                  step={f.step}
                  min={f.min}
                  max={f.max}
                  value={form[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                  style={inputStyle}
                />
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save entry'}
            </button>
            {message && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  color: message.type === 'ok' ? 'var(--emerald-main)' : 'var(--rose-main)',
                }}
              >
                {message.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {message.text}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontSize: '0.8rem',
  color: 'var(--text-muted)',
};

const inputStyle = {
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-main)',
  padding: '8px 10px',
  fontSize: '0.9rem',
};
