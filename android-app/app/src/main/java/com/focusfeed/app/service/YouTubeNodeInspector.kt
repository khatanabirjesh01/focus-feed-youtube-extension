package com.focusfeed.app.service

import android.graphics.Rect
import android.view.accessibility.AccessibilityNodeInfo

/**
 * Lightweight, defensive accessibility inspector strictly for com.google.android.youtube.
 */
object YouTubeNodeInspector {

    const val YOUTUBE_PACKAGE = "com.google.android.youtube"

    private val SHORTS_PLAYER_IDS = listOf(
        "$YOUTUBE_PACKAGE:id/reel_recycler",
        "$YOUTUBE_PACKAGE:id/reel_watch_fragment_root",
        "$YOUTUBE_PACKAGE:id/reel_player_page_container",
        "$YOUTUBE_PACKAGE:id/reel_player_underlay",
        "$YOUTUBE_PACKAGE:id/reel_dyn_share",
        "$YOUTUBE_PACKAGE:id/reel_progress_bar",
        "$YOUTUBE_PACKAGE:id/reel_watch_player"
    )

    private val SKIP_AD_IDS = listOf(
        "$YOUTUBE_PACKAGE:id/skip_ad_button",
        "$YOUTUBE_PACKAGE:id/skip_ad_button_text",
        "$YOUTUBE_PACKAGE:id/modern_skip_ad_text",
        "$YOUTUBE_PACKAGE:id/skip_ad_button_container"
    )

    private val AD_INDICATOR_IDS = listOf(
        "$YOUTUBE_PACKAGE:id/ad_progress_text",
        "$YOUTUBE_PACKAGE:id/ad_countdown",
        "$YOUTUBE_PACKAGE:id/ad_overlay",
        "$YOUTUBE_PACKAGE:id/player_ad_overlay",
        "$YOUTUBE_PACKAGE:id/ad_cta_button"
    ) + SKIP_AD_IDS

    private val WATCH_PLAYER_IDS = listOf(
        "$YOUTUBE_PACKAGE:id/watch_player",
        "$YOUTUBE_PACKAGE:id/player_fragment_container",
        "$YOUTUBE_PACKAGE:id/player_view",
        "$YOUTUBE_PACKAGE:id/next_gen_watch_container"
    )

    private val TOOLBAR_IDS = listOf(
        "$YOUTUBE_PACKAGE:id/toolbar",
        "$YOUTUBE_PACKAGE:id/action_bar",
        "$YOUTUBE_PACKAGE:id/toolbar_container"
    )

    private val SEARCH_ACTIVE_IDS = listOf(
        "$YOUTUBE_PACKAGE:id/search_edit_text",
        "$YOUTUBE_PACKAGE:id/search_query",
        "$YOUTUBE_PACKAGE:id/search_box"
    )

    private val MODAL_SHEET_IDS = listOf(
        "$YOUTUBE_PACKAGE:id/engagement_panel_wrapper",
        "$YOUTUBE_PACKAGE:id/engagement_panel_content",
        "$YOUTUBE_PACKAGE:id/bottom_sheet_container",
        "$YOUTUBE_PACKAGE:id/design_bottom_sheet"
    )

    private val ENGAGEMENT_PANEL_IDS = listOf(
        "$YOUTUBE_PACKAGE:id/engagement_panel_wrapper",
        "$YOUTUBE_PACKAGE:id/engagement_panel_content"
    )

    private val COMMENTS_COMPOSER_IDS = listOf(
        "$YOUTUBE_PACKAGE:id/comment_composer",
        "$YOUTUBE_PACKAGE:id/comments_composer"
    )

    private val SUGGESTIONS_ANCHOR_IDS = listOf(
        "$YOUTUBE_PACKAGE:id/related_chip_cloud",
        "$YOUTUBE_PACKAGE:id/watch_next_feed"
    )

    fun isShortsPlayerActive(root: AccessibilityNodeInfo): Boolean {
        return SHORTS_PLAYER_IDS.any { id -> hasVisibleNodeById(root, id) }
    }

    fun isAdOverlayVisible(root: AccessibilityNodeInfo): Boolean {
        return AD_INDICATOR_IDS.any { id -> hasVisibleNodeById(root, id) }
    }

    fun tryClickSkipAd(root: AccessibilityNodeInfo, screenHeightPx: Int): Boolean {
        for (id in SKIP_AD_IDS) {
            val nodes = safeFindById(root, id)
            for (node in nodes) {
                if (safeIsVisible(node) && clickUpTree(node, 4)) return true
            }
        }

        val maxTop = (screenHeightPx * 0.62f).toInt()
        for (query in listOf("Skip Ad", "Skip Ads", "Skip")) {
            val nodes = safeFindByText(root, query)
            for (node in nodes) {
                if (!safeIsVisible(node)) continue
                val txt = node.text?.toString()?.trim()?.lowercase() ?: ""
                val desc = node.contentDescription?.toString()?.trim()?.lowercase() ?: ""
                val matched = txt in setOf("skip", "skip ad", "skip ads") ||
                    desc in setOf("skip", "skip ad", "skip ads")
                if (!matched) continue

                val resId = node.viewIdResourceName?.lowercase() ?: ""
                val bounds = safeGetBounds(node) ?: continue
                val isPlayerButton = resId.contains("skip") ||
                    resId.contains("ad") ||
                    (bounds.top in 0..maxTop && bounds.height() <= (screenHeightPx * 0.14f))

                if (isPlayerButton && clickUpTree(node, 4)) return true
            }
        }
        return false
    }

    fun isCommentsPanelOpen(root: AccessibilityNodeInfo, screenHeightPx: Int): Boolean {
        for (id in ENGAGEMENT_PANEL_IDS) {
            val panels = safeFindById(root, id)
            for (panel in panels) {
                if (!safeIsVisible(panel)) continue
                val bounds = safeGetBounds(panel) ?: continue
                if (bounds.height() >= (screenHeightPx * 0.18f) && containsCommentsHeader(panel)) {
                    return true
                }
            }
        }
        return COMMENTS_COMPOSER_IDS.any { id -> hasVisibleNodeById(root, id) }
    }

    fun tryCloseOpenCommentsPanel(root: AccessibilityNodeInfo, screenHeightPx: Int): Boolean {
        for (id in ENGAGEMENT_PANEL_IDS) {
            val panels = safeFindById(root, id)
            for (panel in panels) {
                if (!safeIsVisible(panel)) continue
                val bounds = safeGetBounds(panel) ?: continue
                if (bounds.height() >= (screenHeightPx * 0.18f) && containsCommentsHeader(panel)) {
                    val closeBtn = findCloseButtonInSubtree(panel)
                    if (closeBtn != null && clickUpTree(closeBtn, 3)) return true
                }
            }
        }

        val closeNodes = safeFindById(root, "$YOUTUBE_PACKAGE:id/engagement_panel_close_button")
        for (btn in closeNodes) {
            if (safeIsVisible(btn) && clickUpTree(btn, 3)) return true
        }
        return false
    }

    fun tryCancelAutoplay(root: AccessibilityNodeInfo): Boolean {
        val cancelNodes = safeFindById(root, "$YOUTUBE_PACKAGE:id/autonav_cancel_button")
        for (node in cancelNodes) {
            if (safeIsVisible(node) && clickUpTree(node, 3)) return true
        }
        return false
    }

    fun findWatchPlayerBounds(root: AccessibilityNodeInfo, screenWidthPx: Int, minHeightPx: Int): Rect? {
        val minWidth = (screenWidthPx * 0.6f).toInt()
        for (id in WATCH_PLAYER_IDS) {
            val nodes = safeFindById(root, id)
            for (node in nodes) {
                if (!safeIsVisible(node)) continue
                val rect = safeGetBounds(node) ?: continue
                if (rect.width() >= minWidth && rect.height() >= minHeightPx) return rect
            }
        }
        return null
    }

    fun isAnyModalSheetOpen(root: AccessibilityNodeInfo, minHeightPx: Int): Boolean {
        for (id in MODAL_SHEET_IDS) {
            val nodes = safeFindById(root, id)
            for (n in nodes) {
                if (!safeIsVisible(n)) continue
                val b = safeGetBounds(n) ?: continue
                if (b.height() >= minHeightPx) return true
            }
        }
        return false
    }

    fun findWatchSuggestionsTop(root: AccessibilityNodeInfo, playerBottomPx: Int, defaultHeaderOffsetPx: Int): Int {
        for (id in SUGGESTIONS_ANCHOR_IDS) {
            val nodes = safeFindById(root, id)
            for (n in nodes) {
                if (!safeIsVisible(n)) continue
                val rect = safeGetBounds(n) ?: continue
                if (rect.top >= playerBottomPx) return rect.top
            }
        }
        return playerBottomPx + defaultHeaderOffsetPx
    }

    fun isOnHomeFeed(root: AccessibilityNodeInfo): Boolean {
        if (SEARCH_ACTIVE_IDS.any { id -> hasVisibleNodeById(root, id) }) return false
        if (hasNavigateUpButton(root)) return false

        val pivotBar = findVisiblePivotBar(root) ?: return false
        val tabs = collectPivotTabInfo(pivotBar)
        if (tabs.isNotEmpty()) {
            if (tabs.any { it.label == "home" && it.selected }) return true
            if (tabs.any { it.label != "home" && it.selected }) return false
        }

        return hasVisibleNodeById(root, "$YOUTUBE_PACKAGE:id/youtube_logo") ||
            hasVisibleNodeById(root, "$YOUTUBE_PACKAGE:id/feed_filter_bar") ||
            hasVisibleNodeById(root, "$YOUTUBE_PACKAGE:id/chip_bar")
    }

    fun findHomeFeedOverlayBounds(
        root: AccessibilityNodeInfo,
        screenWidthPx: Int,
        screenHeightPx: Int,
        fallbackTopPx: Int,
        fallbackBottomPx: Int
    ): Rect? {
        var topY = fallbackTopPx
        var foundToolbar = false

        for (id in TOOLBAR_IDS) {
            val nodes = safeFindById(root, id)
            for (n in nodes) {
                if (!safeIsVisible(n)) continue
                val rect = safeGetBounds(n) ?: continue
                if (rect.bottom in 1 until (screenHeightPx / 3)) {
                    topY = rect.bottom
                    foundToolbar = true
                    break
                }
            }
            if (foundToolbar) break
        }

        if (!foundToolbar) {
            val searchRect = findSearchButton(root)?.let { safeGetBounds(it) }
            if (searchRect != null && searchRect.bottom in 1 until (screenHeightPx / 3)) {
                topY = searchRect.bottom + 8
            }
        }

        val pivotRect = findVisiblePivotBar(root)?.let { safeGetBounds(it) }
        val bottomY = if (pivotRect != null && pivotRect.top > topY) pivotRect.top else fallbackBottomPx

        if (bottomY - topY < 160) return null
        return Rect(0, topY, screenWidthPx, bottomY)
    }

    fun findShortsPivotTabBounds(root: AccessibilityNodeInfo, screenHeightPx: Int): Rect? {
        val pivotBar = findVisiblePivotBar(root) ?: return null
        val tabs = collectPivotTabInfo(pivotBar)
        val shortsTab = tabs.firstOrNull { it.label == "shorts" } ?: return null
        val rect = shortsTab.bounds
        if (rect.width() < 20 || rect.height() < 20 || rect.top < (screenHeightPx * 0.6f)) {
            return null
        }
        return rect
    }

    fun clickSearchButton(root: AccessibilityNodeInfo): Boolean {
        val btn = findSearchButton(root) ?: return false
        return clickUpTree(btn, 4)
    }

    private fun findSearchButton(root: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        for (n in safeFindById(root, "$YOUTUBE_PACKAGE:id/menu_search")) {
            if (safeIsVisible(n)) return n
        }
        for (n in safeFindByText(root, "Search")) {
            if (!safeIsVisible(n)) continue
            val desc = n.contentDescription?.toString()?.trim()?.lowercase() ?: ""
            if (desc == "search" || desc == "search youtube") return n
        }
        return null
    }

    private fun hasNavigateUpButton(root: AccessibilityNodeInfo): Boolean {
        for (n in safeFindByText(root, "Navigate up")) {
            if (!safeIsVisible(n)) continue
            val desc = n.contentDescription?.toString()?.trim()?.lowercase() ?: ""
            if (desc == "navigate up") return true
        }
        return false
    }

    private data class PivotTab(val label: String, val selected: Boolean, val bounds: Rect)

    private fun findVisiblePivotBar(root: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        for (bar in safeFindById(root, "$YOUTUBE_PACKAGE:id/pivot_bar")) {
            if (safeIsVisible(bar)) return bar
        }
        return null
    }

    private fun collectPivotTabInfo(pivotBar: AccessibilityNodeInfo): List<PivotTab> {
        val result = ArrayList<PivotTab>()
        try {
            val container = if (pivotBar.childCount == 1) pivotBar.getChild(0) ?: pivotBar else pivotBar
            val count = container.childCount.coerceAtMost(8)
            for (i in 0 until count) {
                val tab = container.getChild(i) ?: continue
                if (!safeIsVisible(tab)) continue
                val bounds = safeGetBounds(tab) ?: continue
                val label = extractTabLabel(tab).lowercase()
                if (label.isNotEmpty()) {
                    result.add(PivotTab(label, isNodeOrChildSelected(tab), bounds))
                }
            }
        } catch (_: Exception) {
        }
        return result
    }

    private fun extractTabLabel(node: AccessibilityNodeInfo, depth: Int = 0): String {
        if (depth > 3) return ""
        try {
            val desc = node.contentDescription?.toString()?.trim()
            if (!desc.isNullOrEmpty()) return desc.substringBefore('\n').trim()
            val text = node.text?.toString()?.trim()
            if (!text.isNullOrEmpty()) return text
            for (i in 0 until node.childCount.coerceAtMost(6)) {
                val child = node.getChild(i) ?: continue
                val found = extractTabLabel(child, depth + 1)
                if (found.isNotEmpty()) return found
            }
        } catch (_: Exception) {
        }
        return ""
    }

    private fun isNodeOrChildSelected(node: AccessibilityNodeInfo, depth: Int = 0): Boolean {
        if (depth > 3) return false
        try {
            if (node.isSelected) return true
            for (i in 0 until node.childCount.coerceAtMost(6)) {
                val child = node.getChild(i) ?: continue
                if (isNodeOrChildSelected(child, depth + 1)) return true
            }
        } catch (_: Exception) {
        }
        return false
    }

    private fun containsCommentsHeader(panel: AccessibilityNodeInfo, depth: Int = 0): Boolean {
        if (depth > 5) return false
        try {
            val res = panel.viewIdResourceName?.lowercase() ?: ""
            if (res.contains("comment_composer") || res.contains("comments_composer")) return true
            val t = panel.text?.toString()?.trim()?.lowercase() ?: ""
            val d = panel.contentDescription?.toString()?.trim()?.lowercase() ?: ""
            if (t == "comments" || t == "live chat" || d == "comments" || d == "live chat") return true
            for (i in 0 until panel.childCount.coerceAtMost(12)) {
                val child = panel.getChild(i) ?: continue
                if (containsCommentsHeader(child, depth + 1)) return true
            }
        } catch (_: Exception) {
        }
        return false
    }

    private fun findCloseButtonInSubtree(node: AccessibilityNodeInfo, depth: Int = 0): AccessibilityNodeInfo? {
        if (depth > 6) return null
        try {
            val res = node.viewIdResourceName?.lowercase() ?: ""
            val desc = node.contentDescription?.toString()?.trim()?.lowercase() ?: ""
            if ((res.contains("close") || desc == "close" || desc == "close panel" || desc == "close comments") && safeIsVisible(node)) {
                return node
            }
            for (i in 0 until node.childCount.coerceAtMost(12)) {
                val child = node.getChild(i) ?: continue
                val found = findCloseButtonInSubtree(child, depth + 1)
                if (found != null) return found
            }
        } catch (_: Exception) {
        }
        return null
    }

    private fun hasVisibleNodeById(root: AccessibilityNodeInfo, fullId: String): Boolean {
        return safeFindById(root, fullId).any { safeIsVisible(it) }
    }

    private fun safeFindById(root: AccessibilityNodeInfo, fullId: String): List<AccessibilityNodeInfo> {
        return try {
            root.findAccessibilityNodeInfosByViewId(fullId) ?: emptyList()
        } catch (_: Exception) {
            emptyList()
        }
    }

    private fun safeFindByText(root: AccessibilityNodeInfo, text: String): List<AccessibilityNodeInfo> {
        return try {
            root.findAccessibilityNodeInfosByText(text) ?: emptyList()
        } catch (_: Exception) {
            emptyList()
        }
    }

    private fun safeIsVisible(node: AccessibilityNodeInfo): Boolean {
        return try {
            node.isVisibleToUser
        } catch (_: Exception) {
            false
        }
    }

    private fun safeGetBounds(node: AccessibilityNodeInfo): Rect? {
        return try {
            val r = Rect()
            node.getBoundsInScreen(r)
            if (r.width() > 0 && r.height() > 0) r else null
        } catch (_: Exception) {
            null
        }
    }

    private fun clickUpTree(node: AccessibilityNodeInfo, maxDepth: Int): Boolean {
        return try {
            var current: AccessibilityNodeInfo? = node
            var depth = 0
            while (current != null && depth < maxDepth) {
                if (current.isClickable && current.isEnabled) {
                    return current.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                }
                current = current.parent
                depth++
            }
            false
        } catch (_: Exception) {
            false
        }
    }
}
