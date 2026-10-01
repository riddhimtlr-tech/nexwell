require("./services/env"); // load .env BEFORE anything reads process.env
const path = require("path");
const authenticateToken = require("./middleware/auth");
const express = require("express");
const cors = require("cors");
const { Pool, types } = require("pg");

// Return Postgres DATE columns as "YYYY-MM-DD" strings (no timezone shifting).
types.setTypeParser(1082, (value) => value);

// Convert DB numerics to numbers but KEEP null as null (never turn missing data into 0).
const num = (v) => (v === null || v === undefined ? null : Number(v));
const PYTHON_BIN = process.env.PYTHON_BIN || "python3";
const ANALYSIS_SCRIPT = path.join(__dirname, "..", "analysis", "pattern_analysis.py");
const SIMULATOR_SCRIPT = path.join(__dirname, "..", "simulator", "what_if.py");
const { spawn } = require("child_process");
const authRoutes = require("./routes/auth");
const app = express();
const PORT = process.env.PORT || 5001;
// CORS: localhost for dev + the URLs in FRONTEND_URL (comma-separated) for production.
// Android requests have no Origin header, so they are always allowed.
const allowedOrigins = [
    "http://localhost:5173",
    ...(process.env.FRONTEND_URL || "").split(",").map((u) => u.trim().replace(/\/$/, "")).filter(Boolean)
];
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked: ${origin}`));
    }
}));
app.use(express.json());
app.use("/api/auth", authRoutes);
// PostgreSQL connection
const pool = new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            // Render's *internal* URL needs no SSL; the *external* URL does.
            ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false
        }
        : {
            user: "riddhi",
            host: "localhost",
            database: "nexwell",
            port: 5432
        }
);
app.locals.pool = pool;

// Test database connection + run small, idempotent migrations
pool.query("SELECT NOW()", async (err, result) => {
    if (err) {
        console.error("Database connection failed:", err.message);
        return;
    }
    console.log("PostgreSQL connected successfully!");
    console.log("Database time:", result.rows[0].now);
    try {
        const migrations = [
            `CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `ALTER TABLE users
                ADD COLUMN IF NOT EXISTS email VARCHAR(255),
                ADD COLUMN IF NOT EXISTS password_hash TEXT`,
            `CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email)`,
            `CREATE TABLE IF NOT EXISTS lifestyle_data (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                date DATE NOT NULL,
                sleep NUMERIC(4,2),
                steps INTEGER,
                screen_time NUMERIC(4,2),
                activity NUMERIC(6,2),
                heart_rate NUMERIC(5,2),
                energy INTEGER CHECK (energy >= 1 AND energy <= 10),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS experiments (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                goal_field VARCHAR(50),
                target_change NUMERIC(6,2),
                start_date DATE,
                end_date DATE,
                status VARCHAR(20) DEFAULT 'active'
            )`,
            `ALTER TABLE lifestyle_data
                ADD COLUMN IF NOT EXISTS source VARCHAR(30),
                ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
            `ALTER TABLE users
                ADD COLUMN IF NOT EXISTS age INTEGER,
                ADD COLUMN IF NOT EXISTS goal TEXT,
                ADD COLUMN IF NOT EXISTS sleep_target NUMERIC(4,2),
                ADD COLUMN IF NOT EXISTS activity_target INTEGER,
                ADD COLUMN IF NOT EXISTS screen_time_target NUMERIC(4,2)`
        ];
        for (const sql of migrations) {
            try {
                await pool.query(sql);
            } catch (e) {
                console.error("Migration step failed:", e.message, "\n", sql.split("\n")[0]);
            }
        }
        console.log("Database tables ready");
    } catch (e) {
        console.error("Migration failed:", e.message);
    }
});

// Who am I? Used by Android + web to confirm they are logged into the SAME account.
app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email FROM users WHERE id = $1`,
            [req.user.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: "Failed to load user", error: error.message });
    }
});

// ---------- Per-user dashboard endpoints (user comes from the JWT, never from the URL) ----------

// My lifestyle data
app.get("/api/me/lifestyle", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM lifestyle_data WHERE user_id = $1 ORDER BY date ASC`,
            [req.user.userId]
        );
        res.json({ userId: req.user.userId, count: result.rows.length, data: result.rows });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch lifestyle data", error: error.message });
    }
});

// My sync status per source (used by Connected Devices + dashboard banner)
app.get("/api/me/sync-status", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT COALESCE(source, 'unknown') AS source,
                    COUNT(*)::int AS days,
                    MAX(date) AS last_date,
                    MAX(updated_at) AS last_synced_at
             FROM lifestyle_data
             WHERE user_id = $1
             GROUP BY COALESCE(source, 'unknown')`,
            [req.user.userId]
        );
        const sources = {};
        for (const row of result.rows) sources[row.source] = row;
        res.json({ userId: req.user.userId, sources });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch sync status", error: error.message });
    }
});

// My profile + goals
app.get("/api/me/profile", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, age, goal, sleep_target, activity_target, screen_time_target
             FROM users WHERE id = $1`,
            [req.user.userId]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: "User not found" });
        res.json({ profile: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: "Failed to load profile", error: error.message });
    }
});

app.put("/api/me/profile", authenticateToken, async (req, res) => {
    try {
        const clean = (v) => (v === "" || v === undefined ? null : v);
        const { name, age, goal, sleepTarget, activityTarget, screenTimeTarget } = req.body;
        if (name !== undefined && !String(name).trim()) {
            return res.status(400).json({ message: "Name cannot be empty" });
        }
        const result = await pool.query(
            `UPDATE users SET
                name = COALESCE($2, name),
                age = $3,
                goal = $4,
                sleep_target = $5,
                activity_target = $6,
                screen_time_target = $7
             WHERE id = $1
             RETURNING id, name, email, age, goal, sleep_target, activity_target, screen_time_target`,
            [
                req.user.userId,
                name ? String(name).trim() : null,
                clean(age), clean(goal), clean(sleepTarget), clean(activityTarget), clean(screenTimeTarget)
            ]
        );
        res.json({ message: "Profile saved", profile: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: "Failed to save profile", error: error.message });
    }
});

// Deployment health check: open https://<your-app>.onrender.com/api/health-check
app.get("/api/health-check", async (req, res) => {
    const status = { server: "ok", database: "unknown", python: "unknown" };
    try {
        await pool.query("SELECT 1");
        status.database = "ok";
    } catch (e) {
        status.database = `error: ${e.message}`;
    }
    await new Promise((resolve) => {
        const p = spawn(PYTHON_BIN, ["--version"]);
        p.on("error", (e) => { status.python = `missing: ${e.message}`; resolve(); });
        p.on("close", (code) => { if (status.python === "unknown") status.python = code === 0 ? "ok" : `exit ${code}`; resolve(); });
    });
    res.json(status);
});

// Home route
app.get("/", (req, res) => {
    res.json({
        message: "NexWell backend is running!"
    });
});

// Get lifestyle data
app.get("/api/lifestyle/:userId", authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        if (Number(userId) !== Number(req.user.userId)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }
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
app.post("/api/analyze", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
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
            sleep: num(row.sleep),
            steps: num(row.steps),
            screenTime: num(row.screen_time),
            activity: num(row.activity),
            heartRate: num(row.heart_rate),
            energy: num(row.energy)
        }));

        // Start Python pattern analysis
        const pythonProcess = spawn(PYTHON_BIN, [ANALYSIS_SCRIPT]);

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
app.post("/api/simulate", authenticateToken, async (req, res) => {
    try {
        const { field, delta } = req.body;
        const userId = req.user.userId;
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
            sleep: num(row.sleep),
            steps: num(row.steps),
            screenTime: num(row.screen_time),
            activity: num(row.activity),
            heartRate: num(row.heart_rate),
            energy: num(row.energy)
        }));

        // Send data to Python simulator
        const pythonProcess = spawn(PYTHON_BIN, [SIMULATOR_SCRIPT]);

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

                if (simulation.error) {
                    return res.status(400).json({ message: simulation.error, simulation });
                }

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
app.post("/api/experiments", authenticateToken, async (req, res) => {
    try {
        const { goalField, targetChange } = req.body;
        const userId = req.user.userId;
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
app.get("/api/experiments/:userId", authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        if (Number(userId) !== Number(req.user.userId)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

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
app.get("/api/compare/:experimentId", authenticateToken, async (req, res) => {
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
        if (Number(experiment.user_id) !== Number(req.user.userId)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }
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

const gh = require('./services/googleHealth');
const normalize = require('./services/normalize');
const collect = require('./services/collect');

// Helper to save or update lifestyle_data records in PostgreSQL
async function saveOrUpdateLifestyleRecord(pool, record) {
    const { userId, date, sleep, steps, screenTime, activity, heartRate, energy } = record;
    const source = record.source || null;

    const checkResult = await pool.query(
        `SELECT id FROM lifestyle_data WHERE user_id = $1 AND date = $2`,
        [userId, date]
    );

    if (checkResult.rows.length > 0) {
        const fieldsToUpdate = [];
        const values = [userId, date];
        let paramIdx = 3;

        if (sleep !== null && sleep !== undefined) { fieldsToUpdate.push(`sleep = $${paramIdx++}`); values.push(sleep); }
        if (steps !== null && steps !== undefined) { fieldsToUpdate.push(`steps = $${paramIdx++}`); values.push(steps); }
        if (screenTime !== null && screenTime !== undefined) { fieldsToUpdate.push(`screen_time = $${paramIdx++}`); values.push(screenTime); }
        if (activity !== null && activity !== undefined) { fieldsToUpdate.push(`activity = $${paramIdx++}`); values.push(activity); }
        if (heartRate !== null && heartRate !== undefined) { fieldsToUpdate.push(`heart_rate = $${paramIdx++}`); values.push(heartRate); }
        if (energy !== null && energy !== undefined) { fieldsToUpdate.push(`energy = $${paramIdx++}`); values.push(energy); }

        if (fieldsToUpdate.length > 0) {
            fieldsToUpdate.push(`updated_at = CURRENT_TIMESTAMP`);
            if (source) { fieldsToUpdate.push(`source = $${paramIdx++}`); values.push(source); }
            const query = `UPDATE lifestyle_data SET ${fieldsToUpdate.join(', ')} WHERE user_id = $1 AND date = $2 RETURNING *`;
            const updateRes = await pool.query(query, values);
            return updateRes.rows[0];
        }
        return checkResult.rows[0];
    } else {
        const insertRes = await pool.query(
            `INSERT INTO lifestyle_data (user_id, date, sleep, steps, screen_time, activity, heart_rate, energy, source, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
             RETURNING *`,
            [userId, date, sleep ?? null, steps ?? null, screenTime ?? null, activity ?? null, heartRate ?? null, energy ?? null, source]
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
app.post("/api/health/sync", authenticateToken, async (req, res) => {
    try {
        const { days = 7 } = req.body;
        const userId = req.user.userId;
    
        const { records, report } = await collect.fromApi(userId, days);
        const saved = [];

        for (const record of records) {
            const hasData = Object.keys(record).some(k => k !== 'userId' && k !== 'date' && record[k] !== null);
            if (hasData) {
                const savedRow = await saveOrUpdateLifestyleRecord(pool, { ...record, source: "google_health" });
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
app.post("/api/health/manual", authenticateToken, async (req, res) => {
    try {
        const manualData = {
        ...req.body,
        userId: req.user.userId
        };
        const { record, errors } = normalize.validateManual(manualData);
        if (errors.length > 0) {
            return res.status(400).json({ message: errors.join(", "), errors });
        }
        const ALLOWED_SOURCES = ["manual", "health_connect"];
        record.source = ALLOWED_SOURCES.includes(req.body.source) ? req.body.source : "manual";

        const savedRow = await saveOrUpdateLifestyleRecord(pool, record);
        console.log(`[sync] user ${req.user.userId} (${req.user.email}) saved ${record.date}:`, record);
        res.json({
            message: "Manual lifestyle entry saved successfully to PostgreSQL",
            userId: req.user.userId,
            email: req.user.email,
            record: savedRow
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to save manual entry", error: error.message });
    }
});

// ---------- Simulated Wearable API ----------
const wearableSimulator = require('./services/wearableSimulator');

// Generate & ingest simulated wearable daily records into PostgreSQL
app.post("/api/wearable/simulate", authenticateToken, async (req, res) => {
    try {
        const { days = 1, date } = req.body;
        const userId = req.user.userId;

        const numDays = parseInt(days, 10);
        if (isNaN(numDays) || numDays < 1 || numDays > 7) {
            return res.status(400).json({ success: false, message: "days must be an integer between 1 and 7" });
        }

        const simulatedData = wearableSimulator.generateWearableData(numDays, date);
        const saved = [];

        for (const dataPoint of simulatedData) {
            const record = {
                userId,
                ...dataPoint,
                source: "simulated"
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
