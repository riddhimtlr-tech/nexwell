/**
 * Simulated Wearable Telemetry Generator
 * Generates plausible daily health metrics for NexWell
 */

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const round1 = (val) => Math.round(val * 10) / 10;

/**
 * Generate simulated wearable telemetry records
 * @param {number} days - Number of days to generate (1 to 7)
 * @param {string} [endDateStr] - Ending date string (YYYY-MM-DD), defaults to today
 * @returns {Array} Array of generated daily record objects
 */
function generateWearableData(days = 1, endDateStr = null) {
  const end = endDateStr && /^\d{4}-\d{2}-\d{2}$/.test(endDateStr) ? endDateStr : getTodayString();
  const numDays = Math.max(1, Math.min(7, parseInt(days, 10) || 1));

  const records = [];

  for (let i = numDays - 1; i >= 0; i--) {
    const recordDate = addDays(end, -i);

    // Realistic variation bounded logic
    const sleep = round1(6.0 + Math.random() * 2.5); // 6.0h - 8.5h
    const steps = Math.floor(4500 + Math.random() * 6500); // 4,500 - 11,000 steps
    const screenTime = round1(3.5 + Math.random() * 4.5); // 3.5h - 8.0h
    const activity = Math.floor(25 + Math.random() * 40); // 25m - 65m
    const heartRate = Math.floor(62 + Math.random() * 18); // 62 - 80 bpm
    const energy = Math.floor(4 + Math.random() * 5); // 4 - 8 score

    records.push({
      date: recordDate,
      sleep,
      steps,
      screenTime,
      activity,
      heartRate,
      energy,
    });
  }

  return records;
}

module.exports = { generateWearableData };
