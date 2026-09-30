package com.nexwell.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import com.nexwell.app.auth.AuthRepository
import com.nexwell.app.auth.SessionStore
import com.nexwell.app.health.DaySummary
import com.nexwell.app.health.HealthConnectManager
import com.nexwell.app.sync.AuthExpiredException
import com.nexwell.app.sync.NoPermissionException
import com.nexwell.app.sync.SyncRepository
import kotlinx.coroutines.launch
import java.text.DateFormat
import java.util.Date

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val session = SessionStore(this)
        val auth = AuthRepository(session)
        val hc = HealthConnectManager(this)
        val repo = SyncRepository(this, hc, session)
        setContent {
            MaterialTheme { Surface(Modifier.fillMaxSize()) { NexWellApp(session, auth, hc, repo) } }
        }
    }
}

@Composable
fun NexWellApp(session: SessionStore, auth: AuthRepository, hc: HealthConnectManager, repo: SyncRepository) {
    var loggedIn by remember { mutableStateOf(session.isLoggedIn()) }
    var notice by remember { mutableStateOf("") }

    if (!loggedIn) {
        LoginScreen(auth, notice) { notice = ""; loggedIn = true }
    } else {
        ConnectedHealthScreen(hc, repo, session) { message ->
            session.clear(); notice = message; loggedIn = false
        }
    }
}

@Composable
fun LoginScreen(auth: AuthRepository, notice: String, onLoggedIn: () -> Unit) {
    val scope = rememberCoroutineScope()
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf(notice) }

    Column(
        Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Spacer(Modifier.height(40.dp))
        Text("NEXWELL", fontSize = 28.sp, fontWeight = FontWeight.Bold)
        Text("Welcome back 👋")
        OutlinedTextField(
            value = email, onValueChange = { email = it.trim() }, label = { Text("Email") },
            singleLine = true, modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
        )
        OutlinedTextField(
            value = password, onValueChange = { password = it }, label = { Text("Password") },
            singleLine = true, modifier = Modifier.fillMaxWidth(),
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
        )
        Button(
            onClick = {
                loading = true; error = ""
                scope.launch {
                    try { auth.login(email, password); onLoggedIn() }
                    catch (e: Exception) {
                        error = (e.message ?: "Login failed") +
                            if (e is java.io.IOException) ". Is the backend running, and did you run adb reverse?" else ""
                    } finally { loading = false }
                }
            },
            enabled = !loading && email.isNotBlank() && password.isNotBlank(),
            modifier = Modifier.fillMaxWidth()
        ) {
            if (loading) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp) else Text("LOGIN")
        }
        if (error.isNotBlank()) Text(error, color = MaterialTheme.colorScheme.error)
    }
}

@Composable
fun ConnectedHealthScreen(
    hc: HealthConnectManager,
    repo: SyncRepository,
    session: SessionStore,
    onLoggedOut: (String) -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val sdkStatus = remember { hc.sdkStatus() }

    var granted by remember { mutableStateOf<Set<String>>(emptySet()) }
    var lastSync by remember { mutableStateOf(repo.lastSyncMillis()) }
    var syncing by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf("") }
    var today by remember { mutableStateOf<DaySummary?>(null) }

    fun refreshPermissions() = scope.launch {
        granted = try { hc.grantedPermissions() } catch (e: Exception) { emptySet() }
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        PermissionController.createRequestPermissionResultContract()
    ) {
        scope.launch {
            granted = hc.grantedPermissions()
            val readGranted = granted.intersect(HealthConnectManager.READ)
            status = when {
                readGranted.size == HealthConnectManager.READ.size -> "All permissions granted ✓"
                readGranted.isEmpty() -> "No access granted. NexWell can't read your health data until you allow it."
                else -> "Some permissions were denied. NexWell will sync only what you allowed."
            }
        }
    }

    LaunchedEffect(Unit) { if (sdkStatus == HealthConnectClient.SDK_AVAILABLE) refreshPermissions() }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text("NEXWELL", fontSize = 26.sp, fontWeight = FontWeight.Bold)
        Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
            Text("Signed in as ${session.email ?: "user"}", Modifier.weight(1f))
            TextButton(onClick = { onLoggedOut("") }) { Text("Sign out") }
        }
        Text("CONNECTED HEALTH", fontWeight = FontWeight.SemiBold)

        if (sdkStatus != HealthConnectClient.SDK_AVAILABLE) {
            val needsUpdate = sdkStatus == HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
            Text("📱 Health Connect\n✗ " +
                if (needsUpdate) "Health Connect needs to be installed or updated." else "Health Connect isn't supported on this device.")
            if (needsUpdate) {
                Button(onClick = {
                    runCatching {
                        context.startActivity(Intent(Intent.ACTION_VIEW,
                            Uri.parse("market://details?id=com.google.android.apps.healthdata&url=healthconnect%3A%2F%2Fonboarding"))
                            .setPackage("com.android.vending"))
                    }
                }) { Text("Get Health Connect") }
            }
            return@Column
        }

        val readGranted = granted.intersect(HealthConnectManager.READ)
        Card(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("📱 Health Connect  " + if (readGranted.isNotEmpty()) "✓ Connected" else "✗ Not connected",
                    fontWeight = FontWeight.SemiBold)
                HealthConnectManager.LABELS.forEach { (perm, label) ->
                    Text((if (perm in granted) "✓ " else "✗ ") + label)
                }
                if (readGranted.size < HealthConnectManager.READ.size) {
                    Button(onClick = { permissionLauncher.launch(HealthConnectManager.ALL) }) { Text("Grant permissions") }
                    TextButton(onClick = {
                        runCatching { context.startActivity(Intent(HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS)) }
                    }) { Text("Open Health Connect settings") }
                    TextButton(onClick = { refreshPermissions() }) { Text("I've changed it, refresh") }
                }
            }
        }

        Text("Last synced: " + (lastSync?.let { DateFormat.getTimeInstance(DateFormat.SHORT).format(Date(it)) } ?: "Never"))

        Button(
            onClick = {
                syncing = true; status = "Syncing…"
                scope.launch {
                    try {
                        val result = repo.syncNow()
                        lastSync = result.syncedAtMillis
                        today = result.days.lastOrNull()
                        status = "Synced ${result.days.size} days ✓"
                    } catch (e: AuthExpiredException) {
                        onLoggedOut(e.message ?: "Please log in again.")
                    } catch (e: NoPermissionException) {
                        status = "Can't sync: no health permissions. Tap Grant permissions first."
                    } catch (e: Exception) {
                        status = "Sync failed: ${e.message ?: e.javaClass.simpleName}. " +
                            "Is the backend running, and did you run adb reverse?"
                    } finally { syncing = false }
                }
            },
            enabled = !syncing && readGranted.isNotEmpty(),
            modifier = Modifier.fillMaxWidth()
        ) {
            if (syncing) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp) else Text("SYNC NOW")
        }
        if (status.isNotBlank()) Text(status)

        today?.let { d ->
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Today (${d.date})", fontWeight = FontWeight.SemiBold)
                    Text("Steps:  ${d.steps ?: "—"}")
                    Text("Sleep:  ${d.sleepMinutes?.let { "%.1f h".format(it / 60.0) } ?: "—"}")
                    Text("Heart rate:  ${d.avgHeartRate?.let { "$it bpm avg (${d.minHeartRate}–${d.maxHeartRate})" } ?: "—"}")
                    Text("Exercise:  ${d.exerciseMinutes?.let { "$it min" } ?: "—"}")
                }
            }
        }

        if (HealthConnectManager.WRITE_STEPS in granted) {
            OutlinedButton(onClick = {
                scope.launch {
                    status = try { hc.addTestSteps(500); "Added 500 test steps. Now tap SYNC NOW." }
                             catch (e: Exception) { "Couldn't add steps: ${e.message}" }
                }
            }) { Text("🧪 Add 500 test steps") }
        }
    }
}
