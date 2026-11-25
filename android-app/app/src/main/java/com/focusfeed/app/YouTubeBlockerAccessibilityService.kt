package com.focusfeed.app

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.os.SystemClock
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.Toast
import org.json.JSONObject

/**
 * Android AccessibilityService providing system-level protection outside the FocusFeed app:
 * 1. Block or redirect the official Android YouTube app (com.google.android.youtube)
 * 2. Block Shorts playback inside the official YouTube app
 * 3. Auto-tap visible "Skip Ad" buttons inside the official YouTube app
 * 4. Intercept YouTube URLs in external mobile browsers (Chrome, Brave, Firefox, Edge, etc.)
 */
class YouTubeBlockerAccessibilityService : AccessibilityService() {

    companion object {
        private const val YOUTUBE_PACKAGE = "com.google.android.youtube"

        private val BROWSER_PACKAGES = setOf(
            "com.android.chrome",
            "com.chrome.beta",
            "com.chrome.dev",
            "com.brave.browser",
            "org.mozilla.firefox",
            "com.microsoft.emmx",
            "com.sec.android.app.sbrowser",
            "com.opera.browser",
            "com.duckduckgo.mobile.android"
        )

        private val URL_BAR_IDS = listOf(
            "url_bar",
            "mozac_browser_toolbar_url_view",
            "location_bar_edit_text",
            "search_box_text",
            "addressbarEdit",
            "omnibox_text_field"
        )

        private const val ACTION_COOLDOWN_MS = 1400L
        private const val AD_CLICK_COOLDOWN_MS = 600L
    }

    private var lastRedirectActionMs = 0L
    private var lastAdClickMs = 0L

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        val pkg = event.packageName?.toString() ?: return

        // Never interfere with our own FocusFeed app
        if (pkg == packageName) return

        // Respect Master Switch: if FocusFeed is globally paused, stand down
        if (!isMasterEnabled()) return

        when {
            pkg == YOUTUBE_PACKAGE -> handleOfficialYouTubeApp()
            pkg in BROWSER_PACKAGES -> handleExternalBrowser(pkg)
        }
    }

    override fun onInterrupt() {
        // Required override; no state needs cleanup
    }

    private fun isMasterEnabled(): Boolean {
        return try {
            val obj = JSONObject(ConfigRepository.getStorageJson(this))
            obj.optBoolean("enabled", true)
        } catch (_: Exception) {
            true
        }
    }

    private fun handleOfficialYouTubeApp() {
        val now = SystemClock.elapsedRealtime()
        val root = rootInActiveWindow ?: return

        // 1. Block Official YouTube App Completely -> Close & open FocusFeed
        if (ConfigRepository.isBlockYoutubeAppEnabled(this)) {
            if (now - lastRedirectActionMs > ACTION_COOLDOWN_MS) {
                lastRedirectActionMs = now
                performGlobalAction(GLOBAL_ACTION_BACK)
                launchFocusFeed(null, "YouTube App redirected to FocusFeed")
            }
            return
        }

        // 2. Auto-Tap "Skip Ad" inside YouTube App
        if (ConfigRepository.isSkipYoutubeAppAdsEnabled(this)) {
            if (now - lastAdClickMs > AD_CLICK_COOLDOWN_MS) {
                if (tryClickYouTubeSkipAd(root)) {
                    lastAdClickMs = now
                    return
                }
            }
        }

        // 3. Block Shorts Player inside Official YouTube App
        if (ConfigRepository.isBlockYoutubeAppShortsEnabled(this)) {
            if (now - lastRedirectActionMs > ACTION_COOLDOWN_MS) {
                if (isInsideYouTubeShortsPlayer(root)) {
                    lastRedirectActionMs = now
                    performGlobalAction(GLOBAL_ACTION_BACK)
                    Toast.makeText(this, "FocusFeed: YouTube Shorts blocked", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun handleExternalBrowser(browserPackage: String) {
        if (!ConfigRepository.isBlockBrowserYoutubeEnabled(this)) return

        val now = SystemClock.elapsedRealtime()
        if (now - lastRedirectActionMs <= ACTION_COOLDOWN_MS) return

        val root = rootInActiveWindow ?: return
        val detectedUrl = findYouTubeUrlInBrowser(root, browserPackage) ?: return

        lastRedirectActionMs = now
        performGlobalAction(GLOBAL_ACTION_BACK)
        launchFocusFeed(detectedUrl, "Opening filtered YouTube in FocusFeed")
    }

    private fun launchFocusFeed(targetUrl: String?, toastMessage: String) {
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            if (!targetUrl.isNullOrBlank()) {
                putExtra(MainActivity.EXTRA_TARGET_URL, targetUrl)
            }
        }
        startActivity(intent)
        Toast.makeText(this, toastMessage, Toast.LENGTH_SHORT).show()
    }

    private fun tryClickYouTubeSkipAd(root: AccessibilityNodeInfo): Boolean {
        // Strategy A: Known YouTube skip ad resource IDs
        val skipByIds = listOf(
            "com.google.android.youtube:id/skip_ad_button",
            "com.google.android.youtube:id/skip_ad_button_text",
            "com.google.android.youtube:id/modern_skip_ad_text"
        )
        for (resId in skipByIds) {
            val nodes = root.findAccessibilityNodeInfosByViewId(resId)
            if (!nodes.isNullOrEmpty()) {
                for (node in nodes) {
                    if (performClickUpTree(node)) return true
                }
            }
        }

        // Strategy B: Exact button text match ("Skip", "Skip Ad", "Skip Ads")
        for (label in listOf("Skip", "Skip Ad", "Skip Ads")) {
            val nodes = root.findAccessibilityNodeInfosByText(label)
            if (!nodes.isNullOrEmpty()) {
                for (node in nodes) {
                    val txt = node.text?.toString()?.trim()?.lowercase() ?: ""
                    if (txt == "skip" || txt == "skip ad" || txt == "skip ads") {
                        if (performClickUpTree(node)) return true
                    }
                }
            }
        }
        return false
    }

    private fun performClickUpTree(node: AccessibilityNodeInfo): Boolean {
        var current: AccessibilityNodeInfo? = node
        var depth = 0
        while (current != null && depth < 4) {
            if (current.isClickable && current.isEnabled) {
                return current.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            }
            current = current.parent
            depth++
        }
        return false
    }

    private fun isInsideYouTubeShortsPlayer(root: AccessibilityNodeInfo): Boolean {
        // Check known Shorts reel player view IDs in com.google.android.youtube
        val shortsViewIds = listOf(
            "com.google.android.youtube:id/reel_recycler",
            "com.google.android.youtube:id/reel_watch_fragment_root",
            "com.google.android.youtube:id/reel_player_page_container",
            "com.google.android.youtube:id/reel_dyn_share"
        )
        for (resId in shortsViewIds) {
            val nodes = root.findAccessibilityNodeInfosByViewId(resId)
            if (!nodes.isNullOrEmpty()) {
                return true
            }
        }
        return false
    }

    private fun findYouTubeUrlInBrowser(root: AccessibilityNodeInfo, pkg: String): String? {
        for (shortId in URL_BAR_IDS) {
            val fullId = "$pkg:id/$shortId"
            val nodes = root.findAccessibilityNodeInfosByViewId(fullId)
            if (!nodes.isNullOrEmpty()) {
                for (node in nodes) {
                    // Don't interrupt while the user is actively typing inside the focused address bar
                    if (node.isFocused) continue
                    val text = node.text?.toString()?.trim() ?: continue
                    val lower = text.lowercase()
                    if (
                        lower.contains("youtube.com") ||
                        lower.contains("youtu.be")
                    ) {
                        return if (lower.startsWith("http://") || lower.startsWith("https://")) {
                            text
                        } else {
                            "https://$text"
                        }
                    }
                }
            }
        }
        return null
    }
}
