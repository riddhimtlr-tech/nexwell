package com.example.nexwellhealth

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.example.nexwellhealth.ui.theme.NexWellHealthTheme
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

class MainActivity : ComponentActivity() {

    private lateinit var healthConnectClient: HealthConnectClient

    private val steps = mutableStateOf(0L)
    private val syncStatus = mutableStateOf("Not connected")
    private val loggedIn = mutableStateOf(false)
    private val email = mutableStateOf("")
    private val password = mutableStateOf("")
    private val accountLabel = mutableStateOf("")

    /*
     * Development backend.
     *
     * IMPORTANT:
     * This is only for testing while your backend is running
     * on your Mac. Later this becomes your public HTTPS API URL.
     */
    // LOCAL testing (phone + Mac on same Wi-Fi):
    // private val apiBaseUrl = "http://192.168.1.12:5001"
    // DEPLOYED (Render) — replace with your real Render URL, no trailing slash:
    private val apiBaseUrl = "https://YOUR-RENDER-APP.onrender.com"

    private val permissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class)
    )

    private val permissionLauncher =
        registerForActivityResult(
            PermissionController.createRequestPermissionResultContract()
        ) { granted ->
            if (granted.containsAll(permissions)) {
                readSteps()
            } else {
                syncStatus.value = "Health Connect permission not granted"
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        enableEdgeToEdge()

        healthConnectClient = HealthConnectClient.getOrCreate(this)

        val savedToken = getSharedPreferences(
            "nexwell_auth",
            Context.MODE_PRIVATE
        ).getString("token", null)

        loggedIn.value = !savedToken.isNullOrBlank()

        val prefs = getSharedPreferences("nexwell_auth", Context.MODE_PRIVATE)
        accountLabel.value = prefs.getString("account", "") ?: ""

        setContent {
            NexWellHealthTheme {
                if (loggedIn.value) {
                    HealthScreen(
                        account = accountLabel.value,
                        steps = steps.value,
                        syncStatus = syncStatus.value,
                        onConnect = {
                            requestHealthPermissions()
                        },
                        onSync = {
                            syncStepsToBackend()
                        },
                        onLogout = {
                            logout()
                        }
                    )
                } else {
                    LoginScreen(
                        email = email.value,
                        password = password.value,
                        status = syncStatus.value,
                        onEmailChange = {
                            email.value = it
                        },
                        onPasswordChange = {
                            password.value = it
                        },
                        onLogin = {
                            login()
                        }
                    )
                }
            }
        }
    }

    private fun login() {
        if (email.value.isBlank() || password.value.isBlank()) {
            syncStatus.value = "Enter email and password"
            return
        }

        syncStatus.value = "Logging in..."

        CoroutineScope(Dispatchers.IO).launch {
            var connection: HttpURLConnection? = null

            try {
                val url = URL("$apiBaseUrl/api/auth/login")
                connection = url.openConnection() as HttpURLConnection

                connection.requestMethod = "POST"
                connection.setRequestProperty(
                    "Content-Type",
                    "application/json"
                )
                connection.setRequestProperty(
                    "Accept",
                    "application/json"
                )

                connection.doOutput = true
                connection.connectTimeout = 60000
                connection.readTimeout = 60000

                val json = JSONObject().apply {
                    put("email", email.value.trim())
                    put("password", password.value)
                }

                connection.outputStream.use { output ->
                    output.write(
                        json.toString().toByteArray(Charsets.UTF_8)
                    )
                }

                val responseCode = connection.responseCode

                if (responseCode in 200..299) {
                    val response = connection.inputStream
                        .bufferedReader()
                        .use { it.readText() }

                    val responseJson = JSONObject(response)
                    val token = responseJson.getString("token")
                    val user = responseJson.optJSONObject("user")
                    val account = if (user != null)
                        "${user.optString("email")} (user #${user.optInt("id")})"
                    else email.value.trim()

                    getSharedPreferences(
                        "nexwell_auth",
                        Context.MODE_PRIVATE
                    )
                        .edit()
                        .putString("token", token)
                        .putString("account", account)
                        .apply()

                    runOnUiThread {
                        accountLabel.value = account
                        loggedIn.value = true
                        syncStatus.value =
                            "Logged in. Connect Health Data."
                    }
                } else {
                    runOnUiThread {
                        syncStatus.value =
                            "Login failed: HTTP $responseCode"
                    }
                }

            } catch (e: Exception) {
                e.printStackTrace()

                runOnUiThread {
                    syncStatus.value =
                        "Login failed: ${e.message}"
                }
            } finally {
                connection?.disconnect()
            }
        }
    }

    private fun requestHealthPermissions() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val granted =
                    healthConnectClient.permissionController
                        .getGrantedPermissions()

                runOnUiThread {
                    if (granted.containsAll(permissions)) {
                        readSteps()
                    } else {
                        permissionLauncher.launch(permissions)
                    }
                }

            } catch (e: Exception) {
                e.printStackTrace()

                runOnUiThread {
                    syncStatus.value =
                        "Unable to access Health Connect"
                }
            }
        }
    }

    private fun readSteps() {
        val today = LocalDate.now()

        val startOfDay =
            today
                .atStartOfDay(ZoneId.systemDefault())
                .toInstant()

        val now = Instant.now()

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response =
                    healthConnectClient.aggregate(
                        AggregateRequest(
                            metrics = setOf(
                                StepsRecord.COUNT_TOTAL
                            ),
                            timeRangeFilter =
                                TimeRangeFilter.between(
                                    startOfDay,
                                    now
                                )
                        )
                    )

                val totalSteps =
                    response[StepsRecord.COUNT_TOTAL] ?: 0L

                runOnUiThread {
                    steps.value = totalSteps
                    syncStatus.value =
                        "Real Health Connect data loaded"
                }

            } catch (e: Exception) {
                e.printStackTrace()

                runOnUiThread {
                    syncStatus.value =
                        "Failed to read Health Connect"
                }
            }
        }
    }

    private fun syncStepsToBackend() {
        val currentSteps = steps.value

        if (currentSteps == 0L) {
            syncStatus.value =
                "No steps available to sync"
            return
        }

        val token = getSharedPreferences(
            "nexwell_auth",
            Context.MODE_PRIVATE
        ).getString("token", null)

        if (token.isNullOrBlank()) {
            loggedIn.value = false
            syncStatus.value =
                "Please log in again"
            return
        }

        syncStatus.value = "Syncing real health data..."

        CoroutineScope(Dispatchers.IO).launch {
            var connection: HttpURLConnection? = null

            try {
                val url =
                    URL("$apiBaseUrl/api/health/manual")

                connection =
                    url.openConnection() as HttpURLConnection

                connection.requestMethod = "POST"

                connection.setRequestProperty(
                    "Content-Type",
                    "application/json"
                )

                connection.setRequestProperty(
                    "Accept",
                    "application/json"
                )

                connection.setRequestProperty(
                    "Authorization",
                    "Bearer $token"
                )

                connection.doOutput = true
                connection.connectTimeout = 60000
                connection.readTimeout = 60000

                val today = LocalDate.now().toString()

                /*
                 * IMPORTANT:
                 * No userId is sent here.
                 *
                 * The backend gets the user ID from
                 * the JWT Authorization header.
                 */
                val json = JSONObject().apply {
                    put("date", today)
                    put("steps", currentSteps)
                    put("source", "health_connect")
                }

                connection.outputStream.use { output ->
                    output.write(
                        json.toString()
                            .toByteArray(Charsets.UTF_8)
                    )
                }

                val responseCode =
                    connection.responseCode

                if (responseCode in 200..299) {
                    val body = connection.inputStream
                        .bufferedReader().use { it.readText() }
                    val savedFor = JSONObject(body).optInt("userId", -1)

                    runOnUiThread {
                        syncStatus.value =
                            "Synced $currentSteps steps for $today to user #$savedFor"
                    }

                } else if (responseCode == 401) {
                    runOnUiThread {
                        loggedIn.value = false
                        syncStatus.value = "Session expired. Please log in again."
                    }
                } else {
                    val err = connection.errorStream
                        ?.bufferedReader()?.use { it.readText() } ?: ""

                    runOnUiThread {
                        syncStatus.value =
                            "Backend error: HTTP $responseCode $err"
                    }
                }

            } catch (e: Exception) {
                e.printStackTrace()

                runOnUiThread {
                    syncStatus.value =
                        "Sync failed: ${e.message}"
                }

            } finally {
                connection?.disconnect()
            }
        }
    }

    private fun logout() {
        getSharedPreferences(
            "nexwell_auth",
            Context.MODE_PRIVATE
        )
            .edit()
            .clear()
            .apply()

        loggedIn.value = false
        accountLabel.value = ""
        email.value = ""
        password.value = ""
        steps.value = 0L
        syncStatus.value = "Logged out"
    }
}

@Composable
fun LoginScreen(
    email: String,
    password: String,
    status: String,
    onEmailChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onLogin: () -> Unit
) {
    Column(
        modifier = Modifier.padding(32.dp),
        verticalArrangement = Arrangement.Center
    ) {

        Text("NexWell")

        Spacer(modifier = Modifier.height(12.dp))

        Text("Connect your personal health data")

        Spacer(modifier = Modifier.height(24.dp))

        OutlinedTextField(
            value = email,
            onValueChange = onEmailChange,
            label = {
                Text("Email")
            }
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = password,
            onValueChange = onPasswordChange,
            visualTransformation = androidx.compose.ui.text.input.PasswordVisualTransformation(),
            label = {
                Text("Password")
            }
        )

        Spacer(modifier = Modifier.height(16.dp))

        Button(
            onClick = onLogin
        ) {
            Text("Login")
        }

        Spacer(modifier = Modifier.height(12.dp))

        Text(status)
    }
}

@Composable
fun HealthScreen(
    account: String,
    steps: Long,
    syncStatus: String,
    onConnect: () -> Unit,
    onSync: () -> Unit,
    onLogout: () -> Unit
) {
    Column(
        modifier = Modifier.padding(32.dp),
        verticalArrangement = Arrangement.Center
    ) {

        Text("NexWell Health")

        Spacer(modifier = Modifier.height(4.dp))

        Text("Signed in as: ${account.ifBlank { "unknown" }}")

        Spacer(modifier = Modifier.height(12.dp))

        Text("Today's Steps: $steps")

        Spacer(modifier = Modifier.height(8.dp))

        Text(syncStatus)

        Spacer(modifier = Modifier.height(20.dp))

        Button(
            onClick = onConnect
        ) {
            Text("Connect Health Data")
        }

        Spacer(modifier = Modifier.height(12.dp))

        Button(
            onClick = onSync
        ) {
            Text("Sync Steps to NexWell")
        }

        Spacer(modifier = Modifier.height(12.dp))

        Button(
            onClick = onLogout
        ) {
            Text("Logout")
        }
    }
}
