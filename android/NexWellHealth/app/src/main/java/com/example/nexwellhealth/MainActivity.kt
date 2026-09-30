package com.example.nexwellhealth

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
import java.net.HttpURLConnection
import java.net.URL
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

class MainActivity : ComponentActivity() {

    private lateinit var healthConnectClient: HealthConnectClient

    private val steps = mutableStateOf(0L)
    private val syncStatus = mutableStateOf("Not synced")

    private val permissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class)
    )

    private val permissionLauncher =
        registerForActivityResult(
            PermissionController.createRequestPermissionResultContract()
        ) { granted ->
            if (granted.containsAll(permissions)) {
                readSteps()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        healthConnectClient = HealthConnectClient.getOrCreate(this)

        setContent {
            NexWellHealthTheme {
                HealthScreen(
                    steps = steps.value,
                    syncStatus = syncStatus.value,
                    onConnect = {
                        requestHealthPermissions()
                    },
                    onSync = {
                        syncStepsToBackend()
                    }
                )
            }
        }
    }

    private fun requestHealthPermissions() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val granted =
                    healthConnectClient.permissionController.getGrantedPermissions()

                runOnUiThread {
                    if (granted.containsAll(permissions)) {
                        readSteps()
                    } else {
                        permissionLauncher.launch(permissions)
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun readSteps() {
        val today = LocalDate.now()

        val startOfDay =
            today.atStartOfDay(ZoneId.systemDefault()).toInstant()

        val now = Instant.now()

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = healthConnectClient.aggregate(
                    AggregateRequest(
                        metrics = setOf(StepsRecord.COUNT_TOTAL),
                        timeRangeFilter = TimeRangeFilter.between(
                            startOfDay,
                            now
                        )
                    )
                )

                val totalSteps =
                    response[StepsRecord.COUNT_TOTAL] ?: 0L

                runOnUiThread {
                    steps.value = totalSteps
                    syncStatus.value = "Steps read from Health Connect"
                }

                println("NexWell TODAY STEPS: $totalSteps")

            } catch (e: Exception) {
                e.printStackTrace()

                runOnUiThread {
                    syncStatus.value = "Failed to read Health Connect"
                }
            }
        }
    }

    private fun syncStepsToBackend() {
        val currentSteps = steps.value

        if (currentSteps == 0L) {
            runOnUiThread {
                syncStatus.value = "No steps available to sync"
            }
            return
        }

        runOnUiThread {
            syncStatus.value = "Syncing..."
        }

        CoroutineScope(Dispatchers.IO).launch {
            var connection: HttpURLConnection? = null

            try {
                val url = URL(
                    "http://192.168.1.15:5001/api/health/manual"
                )

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
                connection.connectTimeout = 5000
                connection.readTimeout = 5000

                val today = LocalDate.now().toString()

                val json = """
                    {
                        "userId": "1",
                        "date": "$today",
                        "steps": $currentSteps
                    }
                """.trimIndent()

                connection.outputStream.use { output ->
                    output.write(json.toByteArray(Charsets.UTF_8))
                }

                val responseCode = connection.responseCode

                if (responseCode in 200..299) {
                    runOnUiThread {
                        syncStatus.value =
                            "Synced $currentSteps steps to NexWell"
                    }

                    println(
                        "NexWell BACKEND SYNC SUCCESS: $currentSteps steps"
                    )
                } else {
                    runOnUiThread {
                        syncStatus.value =
                            "Backend error: HTTP $responseCode"
                    }

                    println(
                        "NexWell BACKEND SYNC FAILED: HTTP $responseCode"
                    )
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
}

@Composable
fun HealthScreen(
    steps: Long,
    syncStatus: String,
    onConnect: () -> Unit,
    onSync: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("NexWell Health")
        Text("Today's Steps: $steps")
        Text(syncStatus)

        Button(onClick = onConnect) {
            Text("Connect Health Data")
        }

        Button(onClick = onSync) {
            Text("Sync Steps to NexWell")
        }
    }
}
