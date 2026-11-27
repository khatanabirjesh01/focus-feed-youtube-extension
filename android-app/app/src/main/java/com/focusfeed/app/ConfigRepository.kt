package com.focusfeed.app

import android.content.Context
import android.content.SharedPreferences
import android.os.SystemClock
import java.util.concurrent.CopyOnWriteArraySet

data class ShieldConfig(
    val enabled: Boolean = true,
    val blockShorts: Boolean = true,
    val onlySearch: Boolean = false,
    val adSkip: Boolean = true,
    val adMute: Boolean = false,
    val blockComments: Boolean = false,
    val cancelAutoplay: Boolean = true,
    val hideWatchSuggestions: Boolean = false
)

data class ShieldStats(
    val shortsBlocked: Int = 0,
    val adsSkipped: Int = 0,
    val commentsClosed: Int = 0,
    val autoplayCancelled: Int = 0
)

/**
 * Lightweight, memory-cached SharedPreferences repository for YouTube Shield controls.
 */
object ConfigRepository {

    private const val PREFS_NAME = "focusfeed_shield_lite"
    private const val KEY_ENABLED = "enabled"
    private const val KEY_BLOCK_SHORTS = "block_shorts"
    private const val KEY_ONLY_SEARCH = "only_search"
    private const val KEY_AD_SKIP = "ad_skip"
    private const val KEY_AD_MUTE = "ad_mute"
    private const val KEY_BLOCK_COMMENTS = "block_comments"
    private const val KEY_CANCEL_AUTOPLAY = "cancel_autoplay"
    private const val KEY_HIDE_SUGGESTIONS = "hide_watch_suggestions"

    private const val KEY_STAT_SHORTS = "stat_shorts"
    private const val KEY_STAT_ADS = "stat_ads"
    private const val KEY_STAT_COMMENTS = "stat_comments"
    private const val KEY_STAT_AUTOPLAY = "stat_autoplay"

    @Volatile
    private var cachedConfig: ShieldConfig? = null

    @Volatile
    private var snoozeUntilElapsedMs: Long = 0L

    @Volatile
    private var suggestionsPeekUntilElapsedMs: Long = 0L

    private val listeners = CopyOnWriteArraySet<() -> Unit>()

    fun addChangeListener(listener: () -> Unit) {
        listeners.add(listener)
    }

    fun removeChangeListener(listener: () -> Unit) {
        listeners.remove(listener)
    }

    private fun notifyListeners() {
        for (l in listeners) {
            try {
                l()
            } catch (_: Exception) {
            }
        }
    }

    private fun prefs(context: Context): SharedPreferences {
        return context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    @Synchronized
    fun getConfig(context: Context): ShieldConfig {
        cachedConfig?.let { return it }
        val p = prefs(context)
        val loaded = ShieldConfig(
            enabled = p.getBoolean(KEY_ENABLED, true),
            blockShorts = p.getBoolean(KEY_BLOCK_SHORTS, true),
            onlySearch = p.getBoolean(KEY_ONLY_SEARCH, false),
            adSkip = p.getBoolean(KEY_AD_SKIP, true),
            adMute = p.getBoolean(KEY_AD_MUTE, false),
            blockComments = p.getBoolean(KEY_BLOCK_COMMENTS, false),
            cancelAutoplay = p.getBoolean(KEY_CANCEL_AUTOPLAY, true),
            hideWatchSuggestions = p.getBoolean(KEY_HIDE_SUGGESTIONS, false)
        )
        cachedConfig = loaded
        return loaded
    }

    @Synchronized
    fun saveConfig(context: Context, cfg: ShieldConfig) {
        cachedConfig = cfg
        prefs(context).edit()
            .putBoolean(KEY_ENABLED, cfg.enabled)
            .putBoolean(KEY_BLOCK_SHORTS, cfg.blockShorts)
            .putBoolean(KEY_ONLY_SEARCH, cfg.onlySearch)
            .putBoolean(KEY_AD_SKIP, cfg.adSkip)
            .putBoolean(KEY_AD_MUTE, cfg.adMute)
            .putBoolean(KEY_BLOCK_COMMENTS, cfg.blockComments)
            .putBoolean(KEY_CANCEL_AUTOPLAY, cfg.cancelAutoplay)
            .putBoolean(KEY_HIDE_SUGGESTIONS, cfg.hideWatchSuggestions)
            .apply()
        notifyListeners()
    }

    fun snoozeShieldFor(durationMs: Long) {
        snoozeUntilElapsedMs = SystemClock.elapsedRealtime() + durationMs
    }

    fun clearSnooze() {
        snoozeUntilElapsedMs = 0L
    }

    fun isSnoozed(): Boolean {
        return snoozeUntilElapsedMs > SystemClock.elapsedRealtime()
    }

    fun snoozeSuggestionsFor(durationMs: Long) {
        suggestionsPeekUntilElapsedMs = SystemClock.elapsedRealtime() + durationMs
    }

    fun isSuggestionsSnoozed(): Boolean {
        return suggestionsPeekUntilElapsedMs > SystemClock.elapsedRealtime()
    }

    fun getStats(context: Context): ShieldStats {
        val p = prefs(context)
        return ShieldStats(
            shortsBlocked = p.getInt(KEY_STAT_SHORTS, 0),
            adsSkipped = p.getInt(KEY_STAT_ADS, 0),
            commentsClosed = p.getInt(KEY_STAT_COMMENTS, 0),
            autoplayCancelled = p.getInt(KEY_STAT_AUTOPLAY, 0)
        )
    }

    fun incrementStat(context: Context, stat: StatField) {
        val p = prefs(context)
        val key = when (stat) {
            StatField.SHORTS_BLOCKED -> KEY_STAT_SHORTS
            StatField.AD_SKIPPED -> KEY_STAT_ADS
            StatField.COMMENT_CLOSED -> KEY_STAT_COMMENTS
            StatField.AUTOPLAY_CANCELLED -> KEY_STAT_AUTOPLAY
        }
        p.edit().putInt(key, p.getInt(key, 0) + 1).apply()
        notifyListeners()
    }

    fun resetStats(context: Context) {
        prefs(context).edit()
            .putInt(KEY_STAT_SHORTS, 0)
            .putInt(KEY_STAT_ADS, 0)
            .putInt(KEY_STAT_COMMENTS, 0)
            .putInt(KEY_STAT_AUTOPLAY, 0)
            .apply()
        notifyListeners()
    }

    enum class StatField {
        SHORTS_BLOCKED,
        AD_SKIPPED,
        COMMENT_CLOSED,
        AUTOPLAY_CANCELLED
    }
}
