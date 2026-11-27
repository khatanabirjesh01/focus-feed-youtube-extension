package com.focusfeed.app

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.graphics.Rect
import android.media.AudioManager
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.Toast
import com.focusfeed.app.service.ShieldOverlayManager
import com.focusfeed.app.service.YouTubeNodeInspector

/**
 * Lightweight AccessibilityService guarding com.google.android.youtube:
 * - Shorts Blocker (exits Shorts player & masks Shorts tab)
 * - Only Search Mode (covers Home feed while keeping Search accessible)
 * - Auto-Tap Skip Ad + Optional Auto-Mute Ads
 * - Comments & Live Chat Drawer Blocker
 * - Up Next Autoplay Cancel + Optional Below-Player Suggestions Cover
 */
class YouTubeBlockerAccessibilityService : AccessibilityService() {

    companion object {
        private const val EVENT_THROTTLE_MS = 120L
        private const val ACTION_COOLDOWN_MS = 1500L
        private const val AD_SKIP_COOLDOWN_MS = 500L
        private const val COMMENTS_COOLDOWN_MS = 800L
        private const val TOAST_COOLDOWN_MS = 2200L
        private const val WATCHDOG_INTERVAL_MS = 550L
    }

    private val mainHandler = Handler(Looper.getMainLooper())
    private var overlayManager: ShieldOverlayManager? = null

    private var lastProcessedMs = 0L
    private var lastShortsBackMs = 0L
    private var lastAdClickMs = 0L
    private var lastCommentsCloseMs = 0L
    private var lastAutoplayCancelMs = 0L
    private var lastToastMs = 0L

    private var mutedByAdEngine = false
    private var watchdogRunning = false

    private val configListener: () -> Unit = {
        mainHandler.post {
            val cfg = ConfigRepository.getConfig(this)
            if (!cfg.enabled || ConfigRepository.isSnoozed()) {
                clearAllActiveProtections()
            } else {
                val root = safeRoot()
                if (root != null && root.packageName?.toString() == YouTubeNodeInspector.YOUTUBE_PACKAGE) {
                    evaluateYouTubeWindow(root, cfg)
                }
            }
        }
    }

    private val watchdogRunnable = object : Runnable {
        override fun run() {
            val hasWork = (overlayManager?.hasAnyVisibleOverlay == true) || mutedByAdEngine
            if (!hasWork) {
                watchdogRunning = false
                return
            }
            if (safeRoot()?.packageName?.toString() != YouTubeNodeInspector.YOUTUBE_PACKAGE) {
                clearAllActiveProtections()
                watchdogRunning = false
                return
            }
            mainHandler.postDelayed(this, WATCHDOG_INTERVAL_MS)
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        overlayManager = ShieldOverlayManager(this)
        ConfigRepository.addChangeListener(configListener)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        val pkg = event.packageName?.toString() ?: return

        if (pkg != YouTubeNodeInspector.YOUTUBE_PACKAGE) {
            if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED && pkg != packageName) {
                if (safeRoot()?.packageName?.toString() != YouTubeNodeInspector.YOUTUBE_PACKAGE) {
                    clearAllActiveProtections()
                }
            }
            return
        }

        val now = SystemClock.elapsedRealtime()
        val isWindowChange = event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
        if (!isWindowChange && (now - lastProcessedMs) < EVENT_THROTTLE_MS) {
            return
        }
        lastProcessedMs = now

        val cfg = ConfigRepository.getConfig(this)
        if (!cfg.enabled || ConfigRepository.isSnoozed()) {
            clearAllActiveProtections()
            return
        }

        val root = safeRoot() ?: return
        if (root.packageName?.toString() != YouTubeNodeInspector.YOUTUBE_PACKAGE) {
            clearAllActiveProtections()
            return
        }

        evaluateYouTubeWindow(root, cfg)
    }

    private fun evaluateYouTubeWindow(root: AccessibilityNodeInfo, cfg: ShieldConfig) {
        val now = SystemClock.elapsedRealtime()
        val metrics = resources.displayMetrics
        val screenW = metrics.widthPixels
        val screenH = metrics.heightPixels
        val om = overlayManager ?: return

        // 1. Shorts Player Blocker
        if (cfg.blockShorts && YouTubeNodeInspector.isShortsPlayerActive(root)) {
            om.hideAll()
            restoreAudioIfMuted()
            if ((now - lastShortsBackMs) > ACTION_COOLDOWN_MS) {
                lastShortsBackMs = now
                performGlobalAction(GLOBAL_ACTION_BACK)
                ConfigRepository.incrementStat(this, ConfigRepository.StatField.SHORTS_BLOCKED)
                showDebouncedToast("FocusFeed: Shorts blocked")
            }
            return
        }

        // 2. Ad Detection: Auto-Tap Skip Ad & Optional Auto-Mute
        if (YouTubeNodeInspector.isAdOverlayVisible(root)) {
            if (cfg.adSkip && (now - lastAdClickMs) > AD_SKIP_COOLDOWN_MS) {
                if (YouTubeNodeInspector.tryClickSkipAd(root, screenH)) {
                    lastAdClickMs = now
                    ConfigRepository.incrementStat(this, ConfigRepository.StatField.AD_SKIPPED)
                }
            }
            if (cfg.adMute) {
                muteAudioForAd()
            } else {
                restoreAudioIfMuted()
            }
        } else {
            restoreAudioIfMuted()
        }

        // 3. Comments & Live Chat Panel Blocker
        if (cfg.blockComments && (now - lastCommentsCloseMs) > COMMENTS_COOLDOWN_MS) {
            if (YouTubeNodeInspector.isCommentsPanelOpen(root, screenH)) {
                lastCommentsCloseMs = now
                if (!YouTubeNodeInspector.tryCloseOpenCommentsPanel(root, screenH)) {
                    performGlobalAction(GLOBAL_ACTION_BACK)
                }
                ConfigRepository.incrementStat(this, ConfigRepository.StatField.COMMENT_CLOSED)
                showDebouncedToast("FocusFeed: Comments closed")
            }
        }

        // 4. Watch Screen Check
        val playerBounds = YouTubeNodeInspector.findWatchPlayerBounds(root, screenW, dp(140))
        if (playerBounds != null) {
            om.hideHomeSearchOnlyCover()
            om.hideShortsTabBlocker()

            if (cfg.cancelAutoplay && (now - lastAutoplayCancelMs) > ACTION_COOLDOWN_MS) {
                if (YouTubeNodeInspector.tryCancelAutoplay(root)) {
                    lastAutoplayCancelMs = now
                    ConfigRepository.incrementStat(this, ConfigRepository.StatField.AUTOPLAY_CANCELLED)
                }
            }

            val isFullscreen = playerBounds.height() >= (screenH * 0.78f)
            val sheetOpen = YouTubeNodeInspector.isAnyModalSheetOpen(root, dp(160))

            if (cfg.hideWatchSuggestions && !isFullscreen && !sheetOpen && !ConfigRepository.isSuggestionsSnoozed()) {
                val suggestionsTop = YouTubeNodeInspector.findWatchSuggestionsTop(
                    root = root,
                    playerBottomPx = playerBounds.bottom,
                    defaultHeaderOffsetPx = dp(185)
                ).coerceIn(playerBounds.bottom + dp(60), screenH)

                if (screenH - suggestionsTop >= dp(140)) {
                    om.showWatchSuggestionsCover(
                        rect = Rect(0, suggestionsTop, screenW, screenH),
                        onPeekClicked = {
                            ConfigRepository.snoozeSuggestionsFor(15_000L)
                            om.hideWatchSuggestionsCover()
                        }
                    )
                    ensureWatchdogRunning()
                } else {
                    om.hideWatchSuggestionsCover()
                }
            } else {
                om.hideWatchSuggestionsCover()
            }
            return
        }

        om.hideWatchSuggestionsCover()

        // 5. Shorts Bottom Tab Blocker
        if (cfg.blockShorts) {
            val shortsTabRect = YouTubeNodeInspector.findShortsPivotTabBounds(root, screenH)
            if (shortsTabRect != null) {
                om.showShortsTabBlocker(shortsTabRect) {
                    showDebouncedToast("Shorts blocked by FocusFeed")
                }
                ensureWatchdogRunning()
            } else {
                om.hideShortsTabBlocker()
            }
        } else {
            om.hideShortsTabBlocker()
        }

        // 6. Only Search Home Feed Cover
        if (cfg.onlySearch && YouTubeNodeInspector.isOnHomeFeed(root)) {
            val homeRect = YouTubeNodeInspector.findHomeFeedOverlayBounds(
                root = root,
                screenWidthPx = screenW,
                screenHeightPx = screenH,
                fallbackTopPx = dp(84),
                fallbackBottomPx = screenH - dp(60)
            )
            if (homeRect != null) {
                om.showHomeSearchOnlyCover(
                    rect = homeRect,
                    onSearchClicked = {
                        val latest = safeRoot()
                        if (latest != null && YouTubeNodeInspector.clickSearchButton(latest)) {
                            om.hideHomeSearchOnlyCover()
                        } else {
                            showDebouncedToast("Tap the Search icon at the top")
                        }
                    },
                    onSnoozeClicked = {
                        ConfigRepository.snoozeShieldFor(5 * 60_000L)
                        clearAllActiveProtections()
                        showDebouncedToast("FocusFeed Shield paused for 5 min")
                    }
                )
                ensureWatchdogRunning()
            } else {
                om.hideHomeSearchOnlyCover()
            }
        } else {
            om.hideHomeSearchOnlyCover()
        }
    }

    private fun muteAudioForAd() {
        if (mutedByAdEngine) return
        try {
            val am = getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return
            if (!am.isStreamMute(AudioManager.STREAM_MUSIC)) {
                am.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_MUTE, 0)
                mutedByAdEngine = true
                ensureWatchdogRunning()
            }
        } catch (_: Exception) {
        }
    }

    private fun restoreAudioIfMuted() {
        if (!mutedByAdEngine) return
        mutedByAdEngine = false
        try {
            val am = getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return
            if (am.isStreamMute(AudioManager.STREAM_MUSIC)) {
                am.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_UNMUTE, 0)
            }
        } catch (_: Exception) {
        }
    }

    private fun clearAllActiveProtections() {
        overlayManager?.hideAll()
        restoreAudioIfMuted()
    }

    private fun ensureWatchdogRunning() {
        if (!watchdogRunning) {
            watchdogRunning = true
            mainHandler.postDelayed(watchdogRunnable, WATCHDOG_INTERVAL_MS)
        }
    }

    private fun showDebouncedToast(msg: String) {
        val now = SystemClock.elapsedRealtime()
        if ((now - lastToastMs) < TOAST_COOLDOWN_MS) return
        lastToastMs = now
        mainHandler.post {
            try {
                Toast.makeText(applicationContext, msg, Toast.LENGTH_SHORT).show()
            } catch (_: Exception) {
            }
        }
    }

    private fun safeRoot(): AccessibilityNodeInfo? {
        return try {
            rootInActiveWindow
        } catch (_: Exception) {
            null
        }
    }

    private fun dp(value: Int): Int {
        return (value * resources.displayMetrics.density).toInt()
    }

    override fun onInterrupt() {
        clearAllActiveProtections()
    }

    override fun onUnbind(intent: Intent?): Boolean {
        ConfigRepository.removeChangeListener(configListener)
        mainHandler.removeCallbacks(watchdogRunnable)
        watchdogRunning = false
        clearAllActiveProtections()
        return super.onUnbind(intent)
    }

    override fun onDestroy() {
        ConfigRepository.removeChangeListener(configListener)
        mainHandler.removeCallbacks(watchdogRunnable)
        watchdogRunning = false
        clearAllActiveProtections()
        overlayManager = null
        super.onDestroy()
    }
}
