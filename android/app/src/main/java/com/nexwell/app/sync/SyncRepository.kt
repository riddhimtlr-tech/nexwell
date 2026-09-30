package com.nexwell.app.sync

import android.content.Context
import com.nexwell.app.auth.SessionStore
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
    // Phone on USB + `adb reverse tcp:5000 tcp:5000` -> localhost on the phone = the laptop.
    const val BASE_URL = "http://localhost:5000"
    const val LOGIN_PATH = "/api/auth/login"
    const val SYNC_PATH = "/api/health/sync"
}

object Http {
    val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()
}

class NoPermissionException : Exception("No health permissions granted")
class AuthExpiredException : Exception("Your session expired. Please log in again.")

data class SyncResult(val syncedAtMillis: Long, val days: List<DaySummary>)

class SyncRepository(
    context: Context,
    private val hc: HealthConnectManager,
    private val session: SessionStore,
) {
    private val prefs = context.getSharedPreferences("nexwell_sync", Context.MODE_PRIVATE)

    fun lastSyncMillis(): Long? = prefs.getLong("last_sync", 0L).takeIf { it > 0 }

    suspend fun syncNow(days: Int = 7): SyncResult = withContext(Dispatchers.IO) {
        val token = session.token ?: throw AuthExpiredException()
        if (hc.grantedPermissions().none { it in HealthConnectManager.READ }) throw NoPermissionException()

        val summaries = hc.readLastDays(days)
        val body = buildPayload(summaries).toString().toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url(ApiConfig.BASE_URL + ApiConfig.SYNC_PATH)
            .header("Authorization", "Bearer $token")   // backend identifies the user from this
            .post(body)
            .build()

        Http.client.newCall(request).execute().use { resp ->
            if (resp.code == 401 || resp.code == 403) {
                session.clear()
                throw AuthExpiredException()
            }
            if (!resp.isSuccessful) {
                throw Exception("Server returned ${resp.code}: ${resp.body?.string()?.take(200)}")
            }
        }

        val now = System.currentTimeMillis()
        prefs.edit().putLong("last_sync", now).apply()
        SyncResult(now, summaries)
    }

    /** No userId in the body: the backend takes the user from the JWT. */
    private fun buildPayload(days: List<DaySummary>): JSONObject {
        val arr = JSONArray()
        days.forEach { d ->
            arr.put(JSONObject().apply {
                put("date", d.date.toString())
                put("steps", d.steps ?: JSONObject.NULL)
                put("sleepHours", d.sleepMinutes?.let { Math.round(it / 6.0) / 10.0 } ?: JSONObject.NULL)
                put("avgHeartRate", d.avgHeartRate ?: JSONObject.NULL)
                put("minHeartRate", d.minHeartRate ?: JSONObject.NULL)
                put("maxHeartRate", d.maxHeartRate ?: JSONObject.NULL)
                put("exerciseMinutes", d.exerciseMinutes ?: JSONObject.NULL)
            })
        }
        return JSONObject().apply {
            put("source", "health_connect")
            put("syncedAt", Instant.now().toString())
            put("days", arr)
        }
    }
}
