const express = require("express");
const { Pool } = require("pg");
const { spawn } = require("child_process");

const app = express();
const PORT = process.env.PORT || 5001;
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
    user: "riddhi",
    host: "localhost",
    database: "nexwell",
    port: 5432
});

// Test database connection
pool.query("SELECT NOW()", (err, result) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("PostgreSQL connected successfully!");
        console.log("Database time:", result.rows[0].now);
    }
});

// Home route
app.get("/", (req, res) => {
    res.json({
        message: "NexWell backend is running!"
    });
});

// Get lifestyle data
app.get("/api/lifestyle/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(
            `SELECT * FROM lifestyle_data
             WHERE user_id = $1
             ORDER BY date ASC`,
            [userId]
        );

        res.json({
            userId: userId,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching lifestyle data:", error.message);

        res.status(500).json({
            message: "Failed to fetch lifestyle data",
            error: error.message
        });
    }
});

// Analyze lifestyle data using Python
app.post("/api/analyze", async (req, res) => {
    try {
        const { userId } = req.body;

        // Get lifestyle data from PostgreSQL
        const result = await pool.query(
            `SELECT date, sleep, steps, screen_time, activity, heart_rate, energy
             FROM lifestyle_data
             WHERE user_id = $1
             ORDER BY date ASC`,
            [userId]
        );

        if (result.rows.length < 2) {
            return res.status(400).json({
                message: "Not enough lifestyle data for analysis"
            });
        }

        // Convert database data to Python format
        const lifestyleData = result.rows.map(row => ({
            date: row.date,
            sleep: Number(row.sleep),
            steps: Number(row.steps),
            screenTime: Number(row.screen_time),
            activity: Number(row.activity),
            heartRate: Number(row.heart_rate),
            energy: Number(row.energy)
        }));

        // Start Python pattern analysis
        const pythonProcess = spawn("python3", [
            "../analysis/pattern_analysis.py"
        ]);

        let pythonOutput = "";
        let pythonError = "";

        // Send lifestyle data to Python
        pythonProcess.stdin.write(JSON.stringify(lifestyleData));
        pythonProcess.stdin.end();

        // Receive Python output
        pythonProcess.stdout.on("data", (data) => {
            pythonOutput += data.toString();
        });

        // Receive Python errors
        pythonProcess.stderr.on("data", (data) => {
            pythonError += data.toString();
        });

        // Python process finished
        pythonProcess.on("close", (code) => {

            if (code !== 0) {
                console.error("Python error:", pythonError);

                return res.status(500).json({
                    message: "Pattern analysis failed",
                    error: pythonError
                });
            }

            try {
                const patterns = JSON.parse(pythonOutput);

                res.json({
                    userId: userId,
                    patterns: patterns.patterns
                });

            } catch (error) {
                console.error("Invalid Python output:", pythonOutput);

                res.status(500).json({
                    message: "Could not read pattern analysis result",
                    error: error.message
                });
            }
        });

    } catch (error) {
        console.error("Error analyzing lifestyle data:", error.message);

        res.status(500).json({
            message: "Failed to analyze lifestyle data",
            error: error.message
        });
    }
});
// What-If Simulator
app.post("/api/simulate", async (req, res) => {
    try {
        const { userId, field, delta } = req.body;

        // Get user's lifestyle history up to today
        const result = await pool.query(
            `SELECT date, sleep, steps, screen_time, activity, heart_rate, energy
             FROM lifestyle_data
             WHERE user_id = $1
             AND date <= CURRENT_DATE
             ORDER BY date ASC`,
            [userId]
        );

        if (result.rows.length < 2) {
            return res.status(400).json({
                message: "Not enough lifestyle data for simulation"
            });
        }

        // Convert database data to Python format
        const lifestyleData = result.rows.map(row => ({
            date: row.date,
            sleep: Number(row.sleep),
            steps: Number(row.steps),
            screenTime: Number(row.screen_time),
            activity: Number(row.activity),
            heartRate: Number(row.heart_rate),
            energy: Number(row.energy)
        }));

        // Send data to Python simulator
        const pythonProcess = spawn("python3", [
            "../simulator/what_if.py"
        ]);

        let pythonOutput = "";
        let pythonError = "";

        pythonProcess.stdin.write(
            JSON.stringify({
                data: lifestyleData,
                change: {
                    field: field,
                    delta: Number(delta)
                }
            })
        );

        pythonProcess.stdin.end();

        // Receive Python output
        pythonProcess.stdout.on("data", (data) => {
            pythonOutput += data.toString();
        });

        // Receive Python errors
        pythonProcess.stderr.on("data", (data) => {
            pythonError += data.toString();
        });

        // Python process finished
        pythonProcess.on("close", (code) => {

            if (code !== 0) {
                console.error("Python simulator error:", pythonError);

                return res.status(500).json({
                    message: "What-If simulation failed",
                    error: pythonError
                });
            }

            try {
                const simulation = JSON.parse(pythonOutput);

                res.json({
                    userId: userId,
                    simulation: simulation
                });

            } catch (error) {
                console.error("Invalid simulator output:", pythonOutput);

                res.status(500).json({
                    message: "Could not read simulator result",
                    error: error.message
                });
            }
        });

    } catch (error) {
        console.error("Error running simulation:", error.message);

        res.status(500).json({
            message: "Failed to run simulation",
            error: error.message
        });
    }
});
// Start a 7-day experiment
app.post("/api/experiments", async (req, res) => {
    try {
        const { userId, goalField, targetChange } = req.body;

        const result = await pool.query(
            `INSERT INTO experiments
             (user_id, goal_field, target_change, start_date, end_date, status)
             VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'active')
             RETURNING *`,
            [userId, goalField, targetChange]
        );

        res.json({
            message: "7-day experiment started successfully",
            experiment: result.rows[0]
        });

    } catch (error) {
        console.error("Error starting experiment:", error.message);

        res.status(500).json({
            message: "Failed to start experiment",
            error: error.message
        });
    }
});
// Get user's experiments
app.get("/api/experiments/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(
            `SELECT *
             FROM experiments
             WHERE user_id = $1
             ORDER BY start_date DESC`,
            [userId]
        );

        res.json({
            userId: userId,
            count: result.rows.length,
            experiments: result.rows
        });

    } catch (error) {
        console.error("Error fetching experiments:", error.message);

        res.status(500).json({
            message: "Failed to fetch experiments",
            error: error.message
        });
    }
});
// Compare before vs after experiment
app.get("/api/compare/:experimentId", async (req, res) => {
    try {
        const { experimentId } = req.params;

        // Get experiment details
        const experimentResult = await pool.query(
            `SELECT *
             FROM experiments
             WHERE id = $1`,
            [experimentId]
        );

        if (experimentResult.rows.length === 0) {
            return res.status(404).json({
                message: "Experiment not found"
            });
        }

        const experiment = experimentResult.rows[0];

        // Get data from before the experiment
        const beforeResult = await pool.query(
            `SELECT
                AVG(sleep) AS sleep,
                AVG(steps) AS steps,
                AVG(screen_time) AS screen_time,
                AVG(activity) AS activity,
                AVG(heart_rate) AS heart_rate,
                AVG(energy) AS energy
             FROM lifestyle_data
             WHERE user_id = $1
             AND date < $2`,
            [experiment.user_id, experiment.start_date]
        );

        // Get data during the experiment
        const afterResult = await pool.query(
            `SELECT
                AVG(sleep) AS sleep,
                AVG(steps) AS steps,
                AVG(screen_time) AS screen_time,
                AVG(activity) AS activity,
                AVG(heart_rate) AS heart_rate,
                AVG(energy) AS energy
             FROM lifestyle_data
             WHERE user_id = $1
             AND date >= $2
             AND date <= $3`,
            [
                experiment.user_id,
                experiment.start_date,
                experiment.end_date
            ]
        );

        const before = beforeResult.rows[0];
        const after = afterResult.rows[0];
        const round = (value) =>
            value === null ? null : Number(Number(value).toFixed(2));

        res.json({
            experimentId: experiment.id,
            status: experiment.status,

            before: {
                sleep: round(before.sleep),
                steps: round(before.steps),
                screenTime: round(before.screen_time),
                activity: round(before.activity),
                heartRate: round(before.heart_rate),
                energy: round(before.energy)
            },

            after: {
                sleep: round(after.sleep),
                steps: round(after.steps),
                screenTime: round(after.screen_time),
                activity: round(after.activity),
                heartRate: round(after.heart_rate),
                energy: round(after.energy)
            }
        });

    } catch (error) {
        console.error("Error comparing experiment:", error.message);

        res.status(500).json({
            message: "Failed to compare experiment",
            error: error.message
        });
    }
});

// ---------- Google Health Integration ----------
require("./services/env");

const gh = require('./services/googleHealth');
const normalize = require('./services/normalize');
const collect = require('./services/collect');

// Helper to save or update lifestyle_data records in PostgreSQL
async function saveOrUpdateLifestyleRecord(pool, record) {
    const { userId, date, sleep, steps, screenTime, activity, heartRate, energy } = record;

    const checkResult = await pool.query(
        `SELECT id FROM lifestyle_data WHERE user_id = $1 AND date = $2`,
        [userId, date]
    );

    if (checkResult.rows.length > 0) {
        const fieldsToUpdate = [];
        const values = [userId, date];
        let paramIdx = 3;

        if (sleep !== null) { fieldsToUpdate.push(`sleep = $${paramIdx++}`); values.push(sleep); }
        if (steps !== null) { fieldsToUpdate.push(`steps = $${paramIdx++}`); values.push(steps); }
        if (screenTime !== null) { fieldsToUpdate.push(`screen_time = $${paramIdx++}`); values.push(screenTime); }
        if (activity !== null) { fieldsToUpdate.push(`activity = $${paramIdx++}`); values.push(activity); }
        if (heartRate !== null) { fieldsToUpdate.push(`heart_rate = $${paramIdx++}`); values.push(heartRate); }
        if (energy !== null) { fieldsToUpdate.push(`energy = $${paramIdx++}`); values.push(energy); }

        if (fieldsToUpdate.length > 0) {
            const query = `UPDATE lifestyle_data SET ${fieldsToUpdate.join(', ')} WHERE user_id = $1 AND date = $2 RETURNING *`;
            const updateRes = await pool.query(query, values);
            return updateRes.rows[0];
        }
        return checkResult.rows[0];
    } else {
        const insertRes = await pool.query(
            `INSERT INTO lifestyle_data (user_id, date, sleep, steps, screen_time, activity, heart_rate, energy)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [userId, date, sleep || 0, steps || 0, screenTime || 0, activity || 0, heartRate || 70, energy || 5]
        );
        return insertRes.rows[0];
    }
}

// Get Google Health OAuth authorization URL
app.get("/api/health/auth-url", (req, res) => {
    try {
        const url = gh.getAuthUrl();
        res.json({ url });
    } catch (error) {
        res.status(500).json({ message: "Failed to generate auth URL", error: error.message });
    }
});

// OAuth Callback handler
app.get("/api/health/oauth2callback", async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            return res.status(400).json({ message: "Missing authorization code" });
        }
        await gh.exchangeCode(code);
        res.json({
            message: "Google Health account connected successfully!",
            connected: true
        });
    } catch (error) {
        res.status(500).json({ message: "OAuth token exchange failed", error: error.message });
    }
});

// Check connection status
app.get("/api/health/status", (req, res) => {
    res.json({ connected: gh.isConnected() });
});

// Sync Google Health data to PostgreSQL lifestyle_data
app.post("/api/health/sync", async (req, res) => {
    try {
        const { userId, days = 7 } = req.body;
        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const { records, report } = await collect.fromApi(userId, days);
        const saved = [];

        for (const record of records) {
            const hasData = Object.keys(record).some(k => k !== 'userId' && k !== 'date' && record[k] !== null);
            if (hasData) {
                const savedRow = await saveOrUpdateLifestyleRecord(pool, record);
                saved.push(savedRow);
            }
        }

        res.json({
            message: `Synced ${saved.length} daily entries from Google Health API to PostgreSQL`,
            userId,
            count: saved.length,
            records: saved,
            report
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to sync Google Health data", error: error.message });
    }
});

// Validate & save manual entry to PostgreSQL lifestyle_data
app.post("/api/health/manual", async (req, res) => {
    try {
        const { record, errors } = normalize.validateManual(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ message: "Validation failed", errors });
        }

        const savedRow = await saveOrUpdateLifestyleRecord(pool, record);
        res.json({
            message: "Manual lifestyle entry saved successfully to PostgreSQL",
            record: savedRow
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to save manual entry", error: error.message });
    }
});

// ---------- Simulated Wearable API ----------
const wearableSimulator = require('./services/wearableSimulator');

// Generate & ingest simulated wearable daily records into PostgreSQL
app.post("/api/wearable/simulate", async (req, res) => {
    try {
        const { userId, days = 1, date } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: "userId is required" });
        }

        const numDays = parseInt(days, 10);
        if (isNaN(numDays) || numDays < 1 || numDays > 7) {
            return res.status(400).json({ success: false, message: "days must be an integer between 1 and 7" });
        }

        const simulatedData = wearableSimulator.generateWearableData(numDays, date);
        const saved = [];

        for (const dataPoint of simulatedData) {
            const record = {
                userId,
                ...dataPoint
            };
            const savedRow = await saveOrUpdateLifestyleRecord(pool, record);
            saved.push(savedRow);
        }

        res.json({
            success: true,
            userId: Number(userId),
            count: saved.length,
            records: saved
        });

    } catch (error) {
        console.error("Error simulating wearable data:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to simulate wearable data",
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`NexWell server running on http://0.0.0.0:${PORT}`);
});
