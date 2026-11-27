package com.focusfeed.app

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ShieldConfigTest {

    @Test
    fun defaultConfigHasSafePracticalDefaults() {
        val cfg = ShieldConfig()
        assertTrue(cfg.enabled)
        assertTrue(cfg.blockShorts)
        assertTrue(cfg.adSkip)
        assertTrue(cfg.cancelAutoplay)
        assertFalse(cfg.onlySearch)
        assertFalse(cfg.adMute)
        assertFalse(cfg.blockComments)
        assertFalse(cfg.hideWatchSuggestions)
    }
}
