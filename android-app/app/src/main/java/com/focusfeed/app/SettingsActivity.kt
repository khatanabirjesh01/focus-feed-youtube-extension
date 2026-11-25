package com.focusfeed.app

import android.annotation.SuppressLint
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import java.io.OutputStreamWriter

/**
 * Settings Activity hosting the FocusFeed UI (Toggles, Fields, Lists, Presets)
 * backed by native Android SharedPreferences and native file Import/Export pickers.
 */
class SettingsActivity : AppCompatActivity() {

    private lateinit var settingsWebView: WebView
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private var pendingExportContent: String? = null

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.OpenDocument()
    ) { uri: Uri? ->
        val callback = fileUploadCallback
        fileUploadCallback = null
        if (callback != null) {
            if (uri != null) {
                callback.onReceiveValue(arrayOf(uri))
            } else {
                callback.onReceiveValue(null)
            }
        }
    }

    private val createDocumentLauncher = registerForActivityResult(
        ActivityResultContracts.CreateDocument("application/json")
    ) { uri: Uri? ->
        val content = pendingExportContent
        pendingExportContent = null
        if (uri != null && content != null) {
            try {
                contentResolver.openOutputStream(uri)?.use { stream ->
                    OutputStreamWriter(stream, Charsets.UTF_8).use { writer ->
                        writer.write(content)
                    }
                }
                Toast.makeText(this, "Export saved successfully", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(this, "Export failed: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        findViewById<View>(R.id.btnCloseSettings).setOnClickListener {
            finish()
        }

        settingsWebView = findViewById(R.id.settingsWebView)
        settingsWebView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
        }

        val bridge = FocusFeedJsBridge(
            context = this,
            onExportRequested = { filename, content ->
                runOnUiThread {
                    pendingExportContent = content
                    createDocumentLauncher.launch(filename)
                }
            }
        )
        settingsWebView.addJavascriptInterface(bridge, "FocusFeedAndroid")

        settingsWebView.webViewClient = object : WebViewClient() {}
        settingsWebView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback
                fileChooserLauncher.launch(arrayOf("application/json", "text/plain", "*/*"))
                return true
            }
        }

        settingsWebView.loadUrl("file:///android_asset/popup.html")
    }

    override fun onDestroy() {
        fileUploadCallback?.onReceiveValue(null)
        fileUploadCallback = null
        settingsWebView.destroy()
        super.onDestroy()
    }
}
