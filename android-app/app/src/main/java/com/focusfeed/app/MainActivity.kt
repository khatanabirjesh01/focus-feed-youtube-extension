package com.focusfeed.app

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.util.Base64
import android.view.View
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity

/**
 * Main Activity hosting the distraction-free FocusFeed YouTube WebView browser.
 * Injects CSS-first Layer 1 rules and the real-time Layer 2 JS engine at document start & finish.
 */
class MainActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_TARGET_URL = "extra_target_url"
        private const val HOME_URL = "https://m.youtube.com/"
    }

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var tvFilterStats: TextView
    private lateinit var fullscreenContainer: FrameLayout

    private var customView: View? = null
    private var customViewCallback: WebChromeClient.CustomViewCallback? = null

    private val settingsLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) {
        // Instantly apply any changed rules/presets to the live WebView without reloading video
        reloadRulesInWebView()
    }

    private val cachedCssBase64: String by lazy {
        val cssText = assets.open("styles-android.css").bufferedReader().use { it.readText() }
        Base64.encodeToString(cssText.toByteArray(Charsets.UTF_8), Base64.NO_WRAP)
    }

    private val cachedBridgeJs: String by lazy {
        assets.open("android-bridge.js").bufferedReader().use { it.readText() }
    }

    private val cachedDefaultsJs: String by lazy {
        assets.open("defaults.js").bufferedReader().use { it.readText() }
    }

    private val cachedContentJs: String by lazy {
        assets.open("content-android.js").bufferedReader().use { it.readText() }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.youtubeWebView)
        progressBar = findViewById(R.id.pageProgressBar)
        tvFilterStats = findViewById(R.id.tvFilterStats)
        fullscreenContainer = findViewById(R.id.fullscreenContainer)

        setupToolbarButtons()
        setupWebView()
        setupBackNavigation()

        val initialUrl = extractTargetUrl(intent) ?: HOME_URL
        webView.loadUrl(initialUrl)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        val newUrl = extractTargetUrl(intent)
        if (!newUrl.isNullOrBlank()) {
            webView.loadUrl(newUrl)
        }
    }

    override fun onResume() {
        super.onResume()
        reloadRulesInWebView()
    }

    private fun extractTargetUrl(intent: Intent?): String? {
        if (intent == null) return null
        val extra = intent.getStringExtra(EXTRA_TARGET_URL)
        if (!extra.isNullOrBlank()) return normalizeYouTubeUrl(extra)
        val data = intent.data
        if (data != null && isYouTubeUri(data)) {
            return normalizeYouTubeUrl(data.toString())
        }
        return null
    }

    private fun normalizeYouTubeUrl(rawUrl: String): String {
        val trimmed = rawUrl.trim()
        return if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            trimmed
        } else {
            "https://$trimmed"
        }
    }

    private fun isYouTubeUri(uri: Uri): Boolean {
        val host = (uri.host ?: "").lowercase()
        return host == "youtube.com" ||
            host.endsWith(".youtube.com") ||
            host == "youtu.be"
    }

    private fun isAllowedInAppUri(uri: Uri): Boolean {
        val host = (uri.host ?: "").lowercase()
        return isYouTubeUri(uri) ||
            host == "accounts.google.com" ||
            host.endsWith(".google.com") ||
            host == "accounts.youtube.com"
    }

    private fun setupToolbarButtons() {
        findViewById<View>(R.id.btnBack).setOnClickListener {
            if (webView.canGoBack()) {
                webView.goBack()
            }
        }

        findViewById<View>(R.id.btnHome).setOnClickListener {
            webView.loadUrl(HOME_URL)
        }

        findViewById<View>(R.id.btnShield).setOnClickListener {
            startActivity(Intent(this, SystemBlockerActivity::class.java))
        }

        findViewById<View>(R.id.btnSettings).setOnClickListener {
            settingsLauncher.launch(Intent(this, SettingsActivity::class.java))
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.setSupportZoom(true)
        settings.builtInZoomControls = true
        settings.displayZoomControls = false

        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, true)
        }

        val bridge = FocusFeedJsBridge(
            context = this,
            onStatsUpdated = { hidden, _ ->
                runOnUiThread {
                    tvFilterStats.text = "Active • $hidden filtered"
                }
            }
        )
        webView.addJavascriptInterface(bridge, "FocusFeedAndroid")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val uri = request?.url ?: return false
                if (isAllowedInAppUri(uri)) {
                    return false
                }
                // External links open in system browser
                return try {
                    startActivity(Intent(Intent.ACTION_VIEW, uri))
                    true
                } catch (_: Exception) {
                    false
                }
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                if (url != null && url.contains("youtube.com", ignoreCase = true)) {
                    injectFocusFeedEngine(view)
                }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
                if (url != null && url.contains("youtube.com", ignoreCase = true)) {
                    injectFocusFeedEngine(view)
                    reloadRulesInWebView()
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress < 100) {
                    progressBar.visibility = View.VISIBLE
                    progressBar.progress = newProgress
                } else {
                    progressBar.visibility = View.GONE
                }
                if (newProgress in 15..85) {
                    val url = view?.url ?: ""
                    if (url.contains("youtube.com", ignoreCase = true)) {
                        injectFocusFeedEngine(view)
                    }
                }
            }

            override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
                if (customView != null) {
                    callback?.onCustomViewHidden()
                    return
                }
                customView = view
                customViewCallback = callback
                fullscreenContainer.addView(view)
                fullscreenContainer.visibility = View.VISIBLE
                webView.visibility = View.GONE
            }

            override fun onHideCustomView() {
                if (customView == null) return
                fullscreenContainer.removeView(customView)
                fullscreenContainer.visibility = View.GONE
                webView.visibility = View.VISIBLE
                customView = null
                customViewCallback?.onCustomViewHidden()
                customViewCallback = null
            }
        }
    }

    private fun injectFocusFeedEngine(targetWebView: WebView?) {
        val wv = targetWebView ?: return

        // 1. Inject CSS-first stylesheet synchronously if not yet inserted
        val cssScript = """
            (function() {
              if (!document.documentElement) return;
              if (!document.getElementById('focusfeed-injected-css')) {
                var style = document.createElement('style');
                style.id = 'focusfeed-injected-css';
                style.textContent = decodeURIComponent(escape(window.atob('$cachedCssBase64')));
                (document.head || document.documentElement).appendChild(style);
              }
            })();
        """.trimIndent()
        wv.evaluateJavascript(cssScript, null)

        // 2. Inject Chrome Storage/Runtime Polyfill + Defaults + Content Engine once per document
        val jsBundle = """
            (function() {
              if (window.__ffEngineBootstrapped) return;
              window.__ffEngineBootstrapped = true;
              $cachedBridgeJs
              $cachedDefaultsJs
              $cachedContentJs
            })();
        """.trimIndent()
        wv.evaluateJavascript(jsBundle, null)
    }

    private fun reloadRulesInWebView() {
        webView.evaluateJavascript(
            "if (window.__ffReloadConfig) { window.__ffReloadConfig(); }",
            null
        )
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (customView != null) {
                    webView.webChromeClient?.onHideCustomView()
                } else if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
