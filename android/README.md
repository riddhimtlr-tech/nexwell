# NexWell Android (Health Connect sync) — branch poshika/health-connect

## Riddhi: how to run this
1. `git fetch && git checkout poshika/health-connect`
2. Android Studio → **Open** → select this `android/` folder (not the repo root).
3. Wait for Gradle sync. If Android Studio asks to create the Gradle wrapper or to
   upgrade the Android Gradle Plugin, click **OK / Upgrade**.
4. Plug in an Android phone (USB debugging on) → Run ▶.
5. Start the backend on port 5000, then in a terminal:
   `adb reverse tcp:5000 tcp:5000`
6. In the app: Grant permissions → SYNC NOW.

## What the app sends
`POST /api/health/sync`
```json
{ "source": "health_connect", "syncedAt": "2026-09-30T06:30:00Z",
  "days": [ { "date": "2026-09-30", "steps": 9850, "sleepHours": 7.2,
              "avgHeartRate": 72, "minHeartRate": 58, "maxHeartRate": 131,
              "exerciseMinutes": 35 } ] }
```
Header: `Authorization: Bearer <JWT>` (from `POST /api/auth/login` with `{email, password}`).
No userId in the body; the backend takes the user from the JWT.
Last 7 days every sync; any value may be null. Please upsert by (user, date).
Return 200 `{ "ok": true }`.

Backend URL / port and endpoint paths are in
`app/src/main/java/com/nexwell/app/sync/SyncRepository.kt` → `ApiConfig`.
