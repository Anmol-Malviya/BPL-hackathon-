package com.phishguard

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions
import com.google.mlkit.vision.barcode.common.Barcode

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val intentData: Uri? = intent.data
        val action: String? = intent.action

        if (Intent.ACTION_VIEW == action && intentData != null) {
            val url = intentData.toString()
            handleIncomingUrl(url)
        } else {
            // Opened from launcher icon
            setContentView(R.layout.activity_main)

            // Setup QR code scanner trigger
            val cardScanQr = findViewById<View>(R.id.cardScanQr)
            cardScanQr.setOnClickListener {
                val options = GmsBarcodeScannerOptions.Builder()
                    .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
                    .enableAutoZoom()
                    .build()

                val scanner = GmsBarcodeScanning.getClient(this, options)

                scanner.startScan()
                    .addOnSuccessListener { barcode ->
                        val rawValue = barcode.rawValue
                        if (!rawValue.isNullOrBlank()) {
                            handleIncomingUrl(rawValue)
                        } else {
                            Toast.makeText(this, "Empty QR code detected.", Toast.LENGTH_SHORT).show()
                        }
                    }
                    .addOnFailureListener { e ->
                        Toast.makeText(this, "Scan failed: ${e.message}", Toast.LENGTH_SHORT).show()
                    }
            }

            val btnSettings = findViewById<Button>(R.id.btnSettings)
            btnSettings.setOnClickListener {
                try {
                    // Open default apps settings page (Android 7.0+)
                    val settingsIntent = Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS)
                    startActivity(settingsIntent)
                } catch (e: Exception) {
                    try {
                        // Fallback to normal settings
                        val settingsIntent = Intent(Settings.ACTION_SETTINGS)
                        startActivity(settingsIntent)
                    } catch (ex: Exception) {
                        Toast.makeText(this, "Could not open settings. Please go to Settings -> Apps -> Default Apps manually.", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }
    }

    private fun handleIncomingUrl(url: String) {
        val result = PhishingEngine.verifyUrl(url)

        if (result.isSafe) {
            // Link is safe! Open in Chrome browser
            openInChrome(url)
        } else {
            // Link is suspicious or dangerous! Route to Warning Screen
            val warningIntent = Intent(this, WarningActivity::class.java).apply {
                putExtra("URL", url)
                putExtra("RATING", result.rating)
                putExtra("SCORE", result.score)
                putStringArrayListExtra("WARNINGS", ArrayList(result.warnings))
            }
            startActivity(warningIntent)
            finish()
        }
    }

    private fun openInChrome(url: String) {
        try {
            val chromeIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                // Force open in Chrome package
                setPackage("com.android.chrome")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startActivity(chromeIntent)
        } catch (e: Exception) {
            // Chrome not installed, fall back to generic browser selection
            try {
                val genericIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                // Exclude ourselves from the choice to prevent infinite loops
                val chooser = Intent.createChooser(genericIntent, "Open Safe Link in Browser")
                startActivity(chooser)
            } catch (ex: Exception) {
                Toast.makeText(this, "No browser found to open link.", Toast.LENGTH_SHORT).show()
            }
        }
        finish()
    }
}
