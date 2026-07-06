package com.phishguard

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class WarningActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_warning)

        val url = intent.getStringExtra("URL") ?: ""
        val rating = intent.getStringExtra("RATING") ?: "DANGEROUS"
        val score = intent.getIntExtra("SCORE", 0)
        val warnings = intent.getStringArrayListExtra("WARNINGS") ?: ArrayList<String>()

        val txtUrlBlocked = findViewById<TextView>(R.id.txtUrlBlocked)
        val txtWarningReasons = findViewById<TextView>(R.id.txtWarningReasons)
        val btnGoBack = findViewById<Button>(R.id.btnGoBack)
        val btnOpenSandbox = findViewById<Button>(R.id.btnOpenSandbox)
        val txtAdvancedToggle = findViewById<TextView>(R.id.txtAdvancedToggle)
        val btnIgnoreAndOpen = findViewById<Button>(R.id.btnIgnoreAndOpen)

        txtUrlBlocked.text = url

        // Build bullet-pointed text for warning reasons
        if (warnings.isNotEmpty()) {
            val sb = StringBuilder()
            for (w in warnings) {
                sb.append(w).append("\n\n")
            }
            txtWarningReasons.text = sb.toString().trim()
        } else {
            txtWarningReasons.text = "• Phishing Score: $score/100 safety score.\n• Potential social engineering or malicious content."
        }

        btnGoBack.setOnClickListener {
            // Close app and return to safety
            finish()
        }

        btnOpenSandbox.setOnClickListener {
            // Open WebView in secure isolated sandbox
            val sandboxIntent = Intent(this, SandboxActivity::class.java).apply {
                putExtra("URL", url)
            }
            startActivity(sandboxIntent)
        }

        txtAdvancedToggle.setOnClickListener {
            if (btnIgnoreAndOpen.visibility == View.GONE) {
                btnIgnoreAndOpen.visibility = View.VISIBLE
                txtAdvancedToggle.text = "Advanced Options ▴"
            } else {
                btnIgnoreAndOpen.visibility = View.GONE
                txtAdvancedToggle.text = "Advanced Options ▾"
            }
        }

        btnIgnoreAndOpen.setOnClickListener {
            // Override and force open in Chrome
            openInChrome(url)
        }
    }

    private fun openInChrome(url: String) {
        try {
            val chromeIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                setPackage("com.android.chrome")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startActivity(chromeIntent)
        } catch (e: Exception) {
            try {
                val genericIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                val chooser = Intent.createChooser(genericIntent, "Open anyway in Browser")
                startActivity(chooser)
            } catch (ex: Exception) {
                Toast.makeText(this, "No browser found.", Toast.LENGTH_SHORT).show()
            }
        }
        finish()
    }
}
