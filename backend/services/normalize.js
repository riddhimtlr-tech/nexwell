// Converts Google Health API responses + manual entries into the NexWell contract:
// { userId, date, sleep, steps, screenTime, activity, heartRate, energy }
// Missing values are ALWAYS null. Nothing is invented.

const FIELDS = ['sleep', 'steps', 'screenTime', 'activity', 'heartRate', 'energy'];

function emptyRecord(userId, date) {
  return { userId, date, sleep: null, steps: null, screenTime: null, activity: null, heartRate: null, energy: null };
}

const round1 = (n) => Math.round(n * 10) / 10;

// "-18000s" -> -18000
const offsetSeconds = (s) => (s ? parseInt(String(s).replace('s', ''), 10) || 0 : 0);

// Local calendar date of a UTC timestamp, using the offset the API stores with it.
function localDate(isoTime, utcOffset) {
  const ms = new Date(isoTime).getTime() + offsetSeconds(utcOffset) * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

const civilToDate = (c) =>
  c?.date ? `${c.date.year}-${String(c.date.month).padStart(2, '0')}-${String(c.date.day).padStart(2, '0')}` : null;

// --- Steps: dailyRollUp -> { "2026-09-24": 6200 }
function stepsByDate(rollupBody) {
  const out = {};
  for (const p of rollupBody?.rollupDataPoints || []) {
    const date = civilToDate(p.civilStartTime);
    const count = p.steps?.countSum;
    if (date && count !== undefined) out[date] = parseInt(count, 10);
  }
  return out;
}

// --- Heart rate: dailyRollUp -> average BPM per day.
function heartRateByDate(rollupBody) {
  const out = {};
  for (const p of rollupBody?.rollupDataPoints || []) {
    const date = civilToDate(p.civilStartTime);
    const hr = p.heartRate || p.heart_rate || {};
    const key = Object.keys(hr).find((k) => /avg|average|mean/i.test(k));
    const value = key ? Number(hr[key]) : NaN;
    if (date && Number.isFinite(value)) out[date] = Math.round(value);
  }
  return out;
}

// --- Sleep: sessions -> hours asleep, attributed to the WAKE-UP date.
function sleepByDate(points) {
  const minutes = {};
  for (const p of points || []) {
    const s = p.sleep;
    if (!s?.interval?.endTime) continue;
    const date = localDate(s.interval.endTime, s.interval.endUtcOffset);
    let mins = s.summary?.minutesAsleep !== undefined ? Number(s.summary.minutesAsleep) : NaN;
    if (!Number.isFinite(mins)) {
      // Fallback for manual logs without a summary: session length
      mins = (new Date(s.interval.endTime) - new Date(s.interval.startTime)) / 60000;
    }
    minutes[date] = (minutes[date] || 0) + mins;
  }
  const out = {};
  for (const [d, m] of Object.entries(minutes)) out[d] = round1(m / 60);
  return out;
}

// --- Activity: total exercise minutes per day (NexWell definition of "activity").
function activityByDate(points) {
  const out = {};
  for (const p of points || []) {
    const e = p.exercise;
    if (!e?.interval?.startTime) continue;
    const date = localDate(e.interval.startTime, e.interval.startUtcOffset);
    let secs = e.activeDuration ? parseFloat(e.activeDuration) : NaN; // "900s"
    if (!Number.isFinite(secs)) secs = (new Date(e.interval.endTime) - new Date(e.interval.startTime)) / 1000;
    out[date] = (out[date] || 0) + secs / 60;
  }
  for (const d of Object.keys(out)) out[d] = Math.round(out[d]);
  return out;
}

// --- Manual entry validation. Blank -> null. Returns { record, errors }.
const RULES = {
  sleep: { min: 0, max: 24, int: false, label: 'Sleep (hours)' },
  steps: { min: 0, max: 100000, int: true, label: 'Steps' },
  screenTime: { min: 0, max: 24, int: false, label: 'Screen time (hours)' },
  activity: { min: 0, max: 1440, int: false, label: 'Activity (minutes)' },
  heartRate: { min: 25, max: 250, int: false, label: 'Heart rate (BPM)' },
  energy: { min: 1, max: 10, int: true, label: 'Energy (1-10)' },
};

function validateManual(input) {
  const errors = [];
  const userId = String(input.userId || '').trim();
  const date = String(input.date || '').trim();
  if (!userId) errors.push('userId is required');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date))) errors.push('date must be YYYY-MM-DD');

  const record = emptyRecord(userId, date);
  for (const f of FIELDS) {
    const raw = input[f];
    if (raw === undefined || raw === null || String(raw).trim() === '') continue;
    const n = Number(raw);
    const r = RULES[f];
    if (!Number.isFinite(n)) { errors.push(`${r.label} must be a number`); continue; }
    if (r.int && !Number.isInteger(n)) { errors.push(`${r.label} must be a whole number`); continue; }
    if (n < r.min || n > r.max) { errors.push(`${r.label} must be between ${r.min} and ${r.max}`); continue; }
    record[f] = r.int ? n : round1(n);
  }
  return { record, errors };
}

// Merge rule: a value measured by the API wins; manual input fills the gaps.
function merge(apiRecord, manualRecord) {
  const out = { ...apiRecord };
  for (const f of FIELDS) if (out[f] === null && manualRecord && manualRecord[f] !== null) out[f] = manualRecord[f];
  return out;
}

module.exports = {
  FIELDS, emptyRecord, validateManual, merge,
  stepsByDate, heartRateByDate, sleepByDate, activityByDate,
};
