package com.phishguard

import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class SandboxActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_sandbox)

        val url = intent.getStringExtra("URL") ?: ""

        val txtSandboxUrl = findViewById<TextView>(R.id.txtSandboxUrl)
        val btnSandboxClose = findViewById<TextView>(R.id.btnSandboxClose)
        val sandboxWebView = findViewById<WebView>(R.id.sandboxWebView)

        txtSandboxUrl.text = url

        btnSandboxClose.setOnClickListener {
            finish()
        }

        // Configure strict sandbox settings
        val settings = sandboxWebView.settings
        
        // 1. Force Disable JavaScript execution
        settings.javaScriptEnabled = false
        
        // 2. Disable DOM local storage, database cache, and indexedDB
        settings.domStorageEnabled = false
        settings.databaseEnabled = false
        settings.cacheMode = WebSettings.LOAD_NO_CACHE
        
        // 3. Prevent file access to native storage
        settings.allowFileAccess = false
        settings.allowContentAccess = false
        settings.allowFileAccessFromFileURLs = false
        settings.allowUniversalAccessFromFileURLs = false
        
        // 4. Set secure WebClient to load pages within WebView
        sandboxWebView.webViewClient = object : WebViewClient() {
            @Deprecated("Deprecated in Java")
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                if (url != null) {
                    view?.loadUrl(url)
                }
                return true
            }
        }

        // 5. Load suspicious link in sandboxed web frame
        sandboxWebView.loadUrl(url)
    }

    override fun onBackPressed() {
        val sandboxWebView = findViewById<WebView>(R.id.sandboxWebView)
        if (sandboxWebView.canGoBack()) {
            sandboxWebView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
