// Google Health API client (successor of the Fitbit Web API).
// Docs: https://developers.google.com/health
// Uses Node 18+ built-in fetch. No external SDK needed.

const fs = require('fs');
const path = require('path');
const env = require('./env');

const BASE = 'https://health.googleapis.com/v4/users/me';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const TOKEN_FILE = path.join(__dirname, '..', 'data', 'tokens.json'); // git-ignored

const SCOPES = [
  'https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly', // steps, exercise
  'https://www.googleapis.com/auth/googlehealth.sleep.readonly', // sleep
  'https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly', // heart rate
];

// ---------- OAuth ----------

function getAuthUrl(state = 'nexwell') {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline', // gives a refresh_token
    prompt: 'consent',
    state,
  });
  return `${AUTH_URL}?${params}`;
}

function saveTokens(tokens) {
  fs.mkdirSync(path.dirname(TOKEN_FILE), { recursive: true });
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

function loadTokens() {
  if (!fs.existsSync(TOKEN_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  } catch (e) {
    return null;
  }
}

function isConnected() {
  return Boolean(loadTokens());
}

async function tokenRequest(form) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(form),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Token request failed (${res.status}): ${JSON.stringify(body)}`);
  return body;
}

async function exchangeCode(code) {
  const t = await tokenRequest({
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code',
  });
  const tokens = { ...t, expires_at: Date.now() + t.expires_in * 1000 };
  saveTokens(tokens);
  return tokens;
}

async function getAccessToken() {
  const tokens = loadTokens();
  if (!tokens) throw new Error('NOT_CONNECTED');
  if (Date.now() < tokens.expires_at - 60_000) return tokens.access_token;
  if (!tokens.refresh_token) throw new Error('NOT_CONNECTED'); // must log in again
  const t = await tokenRequest({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: tokens.refresh_token,
    grant_type: 'refresh_token',
  });
  const updated = { ...tokens, ...t, expires_at: Date.now() + t.expires_in * 1000 };
  saveTokens(updated);
  return updated.access_token;
}

// ---------- HTTP helpers ----------

async function call(method, urlPath, { query, body } = {}) {
  const token = await getAccessToken();
  const url = new URL(BASE + urlPath);
  if (query) for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, ok: res.ok, url: url.toString(), body: data };
}

// Follows nextPageToken (sleep/exercise pages are capped at 25 items).
async function listAll(dataType, filter) {
  const points = [];
  let pageToken = '';
  let last;
  do {
    const query = { filter };
    if (pageToken) query.pageToken = pageToken;
    last = await call('GET', `/dataTypes/${dataType}/dataPoints`, { query });
    if (!last.ok) return { ...last, points };
    points.push(...(last.body?.dataPoints || []));
    pageToken = last.body?.nextPageToken || '';
  } while (pageToken);
  return { ...last, points };
}

// "2026-09-24" -> civil DateTime object used by dailyRollUp
function civil(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { date: { year, month, day }, time: { hours: 0, minutes: 0, seconds: 0, nanos: 0 } };
}

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// dailyRollUp: range is closed-open, so end = the day AFTER the last day you want.
function dailyRollUp(dataType, startDate, endDateInclusive) {
  return call('POST', `/dataTypes/${dataType}/dataPoints:dailyRollUp`, {
    body: {
      range: { start: civil(startDate), end: civil(addDays(endDateInclusive, 1)) },
      windowSizeDays: 1,
    },
  });
}

// ---------- Data calls used by NexWell ----------

const api = {
  identity: () => call('GET', '/identity'),
  pairedDevices: () => call('GET', '/pairedDevices'),

  // Steps: phone step counting (Health Connect / Fitbit MobileTrack) + manual logs count here.
  stepsDaily: (start, end) => dailyRollUp('steps', start, end),

  // Heart rate: max 14-day range per request. Usually needs a wearable.
  heartRateDaily: (start, end) => dailyRollUp('heart-rate', start, end),

  // Sleep sessions that ENDED on/after start date (manual sleep logs work too).
  sleepSessions: (start) => listAll('sleep', `sleep.interval.civil_end_time >= "${start}T00:00:00"`),

  // Exercise sessions (manual "Walk 15 min" logs in the Google Health app appear here).
  exerciseSessions: (start) =>
    listAll('exercise', `exercise.interval.civil_start_time >= "${start}T00:00:00"`),
};

module.exports = { SCOPES, getAuthUrl, exchangeCode, isConnected, api, addDays };
