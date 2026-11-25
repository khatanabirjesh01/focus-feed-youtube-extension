package com.focusfeed.app

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject

/**
 * SharedPreferences-backed repository storing both:
 * 1. FocusFeed Chrome-compatible storage JSON (toggles, fields, lists, presets)
 * 2. Native Android System Shield preferences (YouTube app / Shorts / Browser blocking)
 */
object ConfigRepository {
    private const val PREFS_NAME = "focusfeed_prefs"
    private const val KEY_STORAGE_JSON = "focusfeed_storage_json"

    private const val KEY_SHIELD_BLOCK_YT_APP = "shield_block_youtube_app"
    private const val KEY_SHIELD_BLOCK_YT_SHORTS = "shield_block_youtube_app_shorts"
    private const val KEY_SHIELD_SKIP_YT_ADS = "shield_skip_youtube_app_ads"
    private const val KEY_SHIELD_BLOCK_BROWSER_YT = "shield_block_browser_youtube"

    @Volatile
    var lastHiddenCount: Int = 0
    @Volatile
    var lastVisibleCount: Int = 0
    @Volatile
    var lastTotalCards: Int = 0
    @Volatile
    var lastUrl: String = "https://m.youtube.com/"

    private fun prefs(context: Context): SharedPreferences {
        return context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    @Synchronized
    fun getStorageJson(context: Context): String {
        return prefs(context).getString(KEY_STORAGE_JSON, "{}") ?: "{}"
    }

    @Synchronized
    fun mergeStorageJson(context: Context, patchJsonString: String): String {
        val currentRaw = getStorageJson(context)
        val currentObj = try {
            JSONObject(currentRaw)
        } catch (_: Exception) {
            JSONObject()
        }

        val patchObj = try {
            JSONObject(patchJsonString)
        } catch (_: Exception) {
            JSONObject()
        }

        val keys = patchObj.keys()
        while (keys.hasNext()) {
            val key = keys.next()
            currentObj.put(key, patchObj.get(key))
        }

        val updated = currentObj.toString()
        prefs(context).edit().putString(KEY_STORAGE_JSON, updated).apply()
        return updated
    }

    fun getStatsJson(): String {
        return JSONObject().apply {
            put("hiddenCount", lastHiddenCount)
            put("visibleCount", lastVisibleCount)
            put("totalCards", lastTotalCards)
            put("url", lastUrl)
        }.toString()
    }

    // --- Android System Shield Toggles ---

    fun isBlockYoutubeAppEnabled(context: Context): Boolean =
        prefs(context).getBoolean(KEY_SHIELD_BLOCK_YT_APP, false)

    fun setBlockYoutubeAppEnabled(context: Context, enabled: Boolean) {
        prefs(context).edit().putBoolean(KEY_SHIELD_BLOCK_YT_APP, enabled).apply()
    }

    fun isBlockYoutubeAppShortsEnabled(context: Context): Boolean =
        prefs(context).getBoolean(KEY_SHIELD_BLOCK_YT_SHORTS, true)

    fun setBlockYoutubeAppShortsEnabled(context: Context, enabled: Boolean) {
        prefs(context).edit().putBoolean(KEY_SHIELD_BLOCK_YT_SHORTS, enabled).apply()
    }

    fun isSkipYoutubeAppAdsEnabled(context: Context): Boolean =
        prefs(context).getBoolean(KEY_SHIELD_SKIP_YT_ADS, true)

    fun setSkipYoutubeAppAdsEnabled(context: Context, enabled: Boolean) {
        prefs(context).edit().putBoolean(KEY_SHIELD_SKIP_YT_ADS, enabled).apply()
    }

    fun isBlockBrowserYoutubeEnabled(context: Context): Boolean =
        prefs(context).getBoolean(KEY_SHIELD_BLOCK_BROWSER_YT, true)

    fun setBlockBrowserYoutubeEnabled(context: Context, enabled: Boolean) {
        prefs(context).edit().putBoolean(KEY_SHIELD_BLOCK_BROWSER_YT, enabled).apply()
    }
}
