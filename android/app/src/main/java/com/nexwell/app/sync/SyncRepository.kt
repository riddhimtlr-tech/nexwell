package com.nexwell.app.sync

import android.content.Context
import com.nexwell.app.health.DaySummary
import com.nexwell.app.health.HealthConnectManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.util.concurrent.TimeUnit

object ApiConfig {
    // With the phone on USB + `adb reverse tcp:5000 tcp:5000`, localhost on the phone = your laptop.
    // Change the port to whatever the NexWell backend actually uses.
    const val BASE_URL = "http://localhost:5000"
    const val SYNC_PATH = "/api/health/sync"

    // TODO (Phase 2, with Riddhi): replace with the logged-in user's id / token.
    var userId: Int = 1
    var authToken: String? = null
}

data class SyncResult(val syncedAtMillis: Long, val days: List<DaySummary>)

class SyncRepository(context: Context, private val hc: HealthConnectManager) {

    private val prefs = context.getSharedPreferences("nexwell_sync", Context.MODE_PRIVATE)
    private val http = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    fun lastSyncMillis(): Long? = prefs.getLong("last_sync", 0L).takeIf { it > 0 }

    suspend fun syncNow(days: Int = 7): SyncResult = withContext(Dispatchers.IO) {
        val granted = hc.grantedPermissions()
        check(granted.any { it in HealthConnectManager.READ }) {
            "No health permissions granted"
        }

        val summaries = hc.readLastDays(days)
        val body = buildPayload(summaries).toString()
            .toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url(ApiConfig.BASE_URL + ApiConfig.SYNC_PATH)
            .post(body)
            .apply { ApiConfig.authToken?.let { header("Authorization", "Bearer $it") } }
            .build()

        http.newCall(request).execute().use { resp ->
            if (!resp.isSuccessful) {
                error("Server returned ${resp.code}: ${resp.body?.string()?.take(200)}")
            }
        }

        val now = System.currentTimeMillis()
        prefs.edit().putLong("last_sync", now).apply()
        SyncResult(now, summaries)
    }

    private fun buildPayload(days: List<DaySummary>): JSONObject {
        val arr = JSONArray()
        days.forEach { d ->
            arr.put(JSONObject().apply {
                put("date", d.date.toString())                       // "2026-09-30"
                put("steps", d.steps ?: JSONObject.NULL)
                put("sleepHours", d.sleepMinutes?.let { Math.round(it / 6.0) / 10.0 } ?: JSONObject.NULL)
                put("avgHeartRate", d.avgHeartRate ?: JSONObject.NULL)
                put("minHeartRate", d.minHeartRate ?: JSONObject.NULL)
                put("maxHeartRate", d.maxHeartRate ?: JSONObject.NULL)
                put("exerciseMinutes", d.exerciseMinutes ?: JSONObject.NULL)
            })
        }
        return JSONObject().apply {
            put("userId", ApiConfig.userId)
            put("source", "health_connect")
            put("syncedAt", Instant.now().toString())
            put("days", arr)
        }
    }
}
