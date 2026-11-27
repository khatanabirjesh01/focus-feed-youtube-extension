package com.focusfeed.app.service

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Rect
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Manages lightweight TYPE_ACCESSIBILITY_OVERLAY views over com.google.android.youtube.
 */
class ShieldOverlayManager(private val service: AccessibilityService) {

    private val windowManager: WindowManager? =
        service.getSystemService(Context.WINDOW_SERVICE) as? WindowManager

    private var homeOverlay: OverlaySlot? = null
    private var shortsTabOverlay: OverlaySlot? = null
    private var suggestionsOverlay: OverlaySlot? = null

    private data class OverlaySlot(
        val view: View,
        val params: WindowManager.LayoutParams,
        var lastRect: Rect
    )

    val hasAnyVisibleOverlay: Boolean
        get() = homeOverlay != null || shortsTabOverlay != null || suggestionsOverlay != null

    fun showHomeSearchOnlyCover(
        rect: Rect,
        onSearchClicked: () -> Unit,
        onSnoozeClicked: () -> Unit
    ) {
        val current = homeOverlay
        if (current != null) {
            if (current.lastRect != rect) updateSlotBounds(current, rect)
            return
        }

        val container = LinearLayout(service).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#0F0F11"))
            setPadding(dp(28), dp(24), dp(28), dp(24))
            isClickable = true
            isFocusable = false
        }

        val title = TextView(service).apply {
            text = "Only Search Mode"
            setTextColor(Color.parseColor("#F4F4F5"))
            textSize = 20f
            setTypeface(null, Typeface.BOLD)
            gravity = Gravity.CENTER
        }

        val subtitle = TextView(service).apply {
            text = "Home feed is hidden by FocusFeed Shield. Use Search to watch intentionally."
            setTextColor(Color.parseColor("#A1A1AA"))
            textSize = 14f
            gravity = Gravity.CENTER
            setPadding(0, dp(8), 0, dp(22))
        }

        val btnSearch = Button(service).apply {
            text = "Search YouTube"
            setTextColor(Color.WHITE)
            textSize = 14.5f
            isAllCaps = false
            background = roundedDrawable("#FF4E45", dp(10).toFloat())
            setPadding(dp(22), dp(12), dp(22), dp(12))
            setOnClickListener { onSearchClicked() }
        }

        val btnSnooze = Button(service).apply {
            text = "Pause Shield for 5 min"
            setTextColor(Color.parseColor("#A1A1AA"))
            textSize = 13f
            isAllCaps = false
            setBackgroundColor(Color.TRANSPARENT)
            setPadding(dp(16), dp(14), dp(16), dp(8))
            setOnClickListener { onSnoozeClicked() }
        }

        container.addView(title)
        container.addView(subtitle)
        container.addView(btnSearch)
        container.addView(btnSnooze)

        homeOverlay = addSlot(container, rect)
    }

    fun hideHomeSearchOnlyCover() {
        removeSlot(homeOverlay)
        homeOverlay = null
    }

    fun showShortsTabBlocker(rect: Rect, onTapBlocked: () -> Unit) {
        val current = shortsTabOverlay
        if (current != null) {
            if (current.lastRect != rect) updateSlotBounds(current, rect)
            return
        }

        val view = LinearLayout(service).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#0F0F0F"))
            isClickable = true
            isFocusable = false
            setOnClickListener { onTapBlocked() }
        }

        val label = TextView(service).apply {
            text = "Blocked"
            setTextColor(Color.parseColor("#71717A"))
            textSize = 10f
            gravity = Gravity.CENTER
        }
        view.addView(label)

        shortsTabOverlay = addSlot(view, rect)
    }

    fun hideShortsTabBlocker() {
        removeSlot(shortsTabOverlay)
        shortsTabOverlay = null
    }

    fun showWatchSuggestionsCover(rect: Rect, onPeekClicked: () -> Unit) {
        val current = suggestionsOverlay
        if (current != null) {
            if (current.lastRect != rect) updateSlotBounds(current, rect)
            return
        }

        val container = LinearLayout(service).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#0F0F11"))
            setPadding(dp(24), dp(18), dp(24), dp(18))
            isClickable = true
            isFocusable = false
        }

        val title = TextView(service).apply {
            text = "Watch Suggestions Hidden"
            setTextColor(Color.parseColor("#E4E4E7"))
            textSize = 15f
            setTypeface(null, Typeface.BOLD)
            gravity = Gravity.CENTER
        }

        val desc = TextView(service).apply {
            text = "Related videos below the player are hidden."
            setTextColor(Color.parseColor("#A1A1AA"))
            textSize = 12.5f
            gravity = Gravity.CENTER
            setPadding(0, dp(6), 0, dp(14))
        }

        val btnPeek = Button(service).apply {
            text = "Peek for 15s"
            setTextColor(Color.parseColor("#F4F4F5"))
            textSize = 12.5f
            isAllCaps = false
            background = roundedDrawable("#222226", dp(10).toFloat())
            setPadding(dp(16), dp(8), dp(16), dp(8))
            setOnClickListener { onPeekClicked() }
        }

        container.addView(title)
        container.addView(desc)
        container.addView(btnPeek)

        suggestionsOverlay = addSlot(container, rect)
    }

    fun hideWatchSuggestionsCover() {
        removeSlot(suggestionsOverlay)
        suggestionsOverlay = null
    }

    fun hideAll() {
        hideHomeSearchOnlyCover()
        hideShortsTabBlocker()
        hideWatchSuggestionsCover()
    }

    private fun addSlot(view: View, rect: Rect): OverlaySlot? {
        val wm = windowManager ?: return null
        if (rect.width() <= 0 || rect.height() <= 0) return null

        val params = WindowManager.LayoutParams(
            rect.width(),
            rect.height(),
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = rect.left.coerceAtLeast(0)
            y = rect.top.coerceAtLeast(0)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
        }

        return try {
            wm.addView(view, params)
            OverlaySlot(view, params, Rect(rect))
        } catch (_: Exception) {
            null
        }
    }

    private fun updateSlotBounds(slot: OverlaySlot, rect: Rect) {
        val wm = windowManager ?: return
        if (rect.width() <= 0 || rect.height() <= 0) return
        slot.params.width = rect.width()
        slot.params.height = rect.height()
        slot.params.x = rect.left.coerceAtLeast(0)
        slot.params.y = rect.top.coerceAtLeast(0)
        slot.lastRect = Rect(rect)
        try {
            wm.updateViewLayout(slot.view, slot.params)
        } catch (_: Exception) {
        }
    }

    private fun removeSlot(slot: OverlaySlot?) {
        if (slot == null) return
        val wm = windowManager ?: return
        try {
            wm.removeViewImmediate(slot.view)
        } catch (_: Exception) {
            try {
                wm.removeView(slot.view)
            } catch (_: Exception) {
            }
        }
    }

    private fun roundedDrawable(hexColor: String, radiusPx: Float): GradientDrawable {
        return GradientDrawable().apply {
            setColor(Color.parseColor(hexColor))
            cornerRadius = radiusPx
        }
    }

    private fun dp(value: Int): Int {
        return (value * service.resources.displayMetrics.density).toInt()
    }
}
