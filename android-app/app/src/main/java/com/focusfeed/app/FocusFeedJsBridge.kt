package com.focusfeed.app

import android.content.Context
import android.webkit.JavascriptInterface

/**
 * JavaScript Bridge injected into both the YouTube WebView and the Settings WebView.
 * Emulates Chrome Extension storage, live tab statistics, and native Android file exports.
 */
class FocusFeedJsBridge(
    private val context: Context,
    private val onStorageUpdated: (() -> Unit)? = null,
    private val onStatsUpdated: ((hiddenCount: Int, visibleCount: Int) -> Unit)? = null,
    private val onExportRequested: ((filename: String, content: String) -> Unit)? = null
) {

    @JavascriptInterface
    fun getStorageJson(): String {
        return ConfigRepository.getStorageJson(context)
    }

    @JavascriptInterface
    fun setStorageJson(patchJson: String) {
        ConfigRepository.mergeStorageJson(context, patchJson)
        onStorageUpdated?.invoke()
    }

    @JavascriptInterface
    fun updateStats(hiddenCount: Int, visibleCount: Int, totalCards: Int, url: String) {
        ConfigRepository.lastHiddenCount = hiddenCount
        ConfigRepository.lastVisibleCount = visibleCount
        ConfigRepository.lastTotalCards = totalCards
        ConfigRepository.lastUrl = url
        onStatsUpdated?.invoke(hiddenCount, visibleCount)
    }

    @JavascriptInterface
    fun getStatsJson(): String {
        return ConfigRepository.getStatsJson()
    }

    @JavascriptInterface
    fun requestExportFile(filename: String, content: String) {
        onExportRequested?.invoke(filename, content)
    }
}
