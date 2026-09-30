package com.nexwell.app.auth

import android.content.Context
import com.nexwell.app.sync.ApiConfig
import com.nexwell.app.sync.Http
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

/** Keeps the logged-in user's JWT on the phone so they stay signed in. */
class SessionStore(context: Context) {
    private val prefs = context.getSharedPreferences("nexwell_session", Context.MODE_PRIVATE)

    val token: String? get() = prefs.getString("jwt", null)
    val userId: String? get() = prefs.getString("user_id", null)
    val email: String? get() = prefs.getString("email", null)
    fun isLoggedIn() = !token.isNullOrBlank()

    fun save(token: String, userId: String?, email: String) {
        prefs.edit().putString("jwt", token).putString("user_id", userId).putString("email", email).apply()
    }

    fun clear() = prefs.edit().clear().apply()
}

class AuthRepository(private val session: SessionStore) {

    /** POST /api/auth/login {email, password} -> saves the JWT + userId from the response. */
    suspend fun login(email: String, password: String) = withContext(Dispatchers.IO) {
        val body = JSONObject().put("email", email).put("password", password).toString()
            .toRequestBody("application/json".toMediaType())
        val request = Request.Builder().url(ApiConfig.BASE_URL + ApiConfig.LOGIN_PATH).post(body).build()

        Http.client.newCall(request).execute().use { resp ->
            val text = resp.body?.string().orEmpty()
            val json = runCatching { JSONObject(text) }.getOrNull()
            if (!resp.isSuccessful) {
                val msg = json?.optString("message")?.takeIf { it.isNotBlank() }
                    ?: json?.optString("error")?.takeIf { it.isNotBlank() }
                    ?: "Login failed (${resp.code})"
                throw Exception(msg)
            }
            // Accepts {token, userId}, {accessToken, ...}, {jwt, ...} or {..., user: {id}}
            val data = json?.optJSONObject("data") ?: json
            val token = listOf("token", "accessToken", "jwt")
                .firstNotNullOfOrNull { data?.optString(it)?.takeIf { v -> v.isNotBlank() } }
                ?: throw Exception("Login response had no token")
            val userId = data?.opt("userId")?.toString()
                ?: data?.optJSONObject("user")?.opt("id")?.toString()
            session.save(token, userId, email)
        }
    }
}
