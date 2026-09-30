package com.example.nexwellhealth

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.Text
import com.example.nexwellhealth.ui.theme.NexWellHealthTheme

class PermissionsRationaleActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            NexWellHealthTheme {
                Text(
                    "NexWell uses Health Connect to read your step count and show it in the NexWell dashboard."
                )
            }
        }
    }
}
