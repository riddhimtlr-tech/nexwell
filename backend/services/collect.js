// Builds NexWell daily records for the last N days:
//   1) try the Google Health API (if the user connected their Google account)
//   2) return normalized records + diagnostic call report
const env = require('./env');
const gh = require('./googleHealth');
const n = require('./normalize');

function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: env.TIMEZONE }).format(new Date());
}

function dateList(days) {
  const end = today();
  const start = gh.addDays(end, -(days - 1));
  const list = [];
  for (let i = 0; i < days; i++) list.push(gh.addDays(start, i));
  return { start, end, list };
}

// Returns { records, report } — report lists the HTTP status of each API call.
async function fromApi(userId, days = 7) {
  const { start, end, list } = dateList(days);
  const report = { connected: gh.isConnected(), calls: {} };
  const maps = { steps: {}, heartRate: {}, sleep: {}, activity: {} };

  if (report.connected) {
    const safe = async (name, fn, parse, key) => {
      try {
        const r = await fn();
        report.calls[name] = r.status;
        if (r.ok) maps[key] = parse(r);
      } catch (e) {
        report.calls[name] = e.message === 'NOT_CONNECTED' ? 'not connected' : `error: ${e.message}`;
      }
    };
    await safe('steps', () => gh.api.stepsDaily(start, end), (r) => n.stepsByDate(r.body), 'steps');
    await safe('heart-rate', () => gh.api.heartRateDaily(start, end), (r) => n.heartRateByDate(r.body), 'heartRate');
    await safe('sleep', () => gh.api.sleepSessions(start), (r) => n.sleepByDate(r.points), 'sleep');
    await safe('exercise', () => gh.api.exerciseSessions(start), (r) => n.activityByDate(r.points), 'activity');
  }

  const records = list.map((date) => {
    const rec = n.emptyRecord(userId, date);
    for (const f of Object.keys(maps)) if (maps[f][date] !== undefined) rec[f] = maps[f][date];
    return rec;
  });
  return { records, report };
}

module.exports = { fromApi, today };
