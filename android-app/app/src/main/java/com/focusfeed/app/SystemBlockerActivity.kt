package com.focusfeed.app

import android.content.ComponentName
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.text.TextUtils
import android.view.View
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.android.material.switchmaterial.SwitchMaterial

/**
 * Native settings screen for Android App & External Website Shield.
 * Controls the AccessibilityService protecting against the official YouTube app and mobile browsers.
 */
class SystemBlockerActivity : AppCompatActivity() {

    private lateinit var tvServiceStatus: TextView
    private lateinit var btnOpenAccessibility: Button

    private lateinit var switchBlockYoutubeApp: SwitchMaterial
    private lateinit var switchBlockYoutubeAppShorts: SwitchMaterial
    private lateinit var switchSkipYoutubeAppAds: SwitchMaterial
    private lateinit var switchBlockBrowserYoutube: SwitchMaterial

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_system_blocker)

        findViewById<View>(R.id.btnBackFromShield).setOnClickListener {
            finish()
        }

        tvServiceStatus = findViewById(R.id.tvServiceStatus)
        btnOpenAccessibility = findViewById(R.id.btnOpenAccessibility)

        switchBlockYoutubeApp = findViewById(R.id.switchBlockYoutubeApp)
        switchBlockYoutubeAppShorts = findViewById(R.id.switchBlockYoutubeAppShorts)
        switchSkipYoutubeAppAds = findViewById(R.id.switchSkipYoutubeAppAds)
        switchBlockBrowserYoutube = findViewById(R.id.switchBlockBrowserYoutube)

        btnOpenAccessibility.setOnClickListener {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            startActivity(intent)
        }

        loadSwitchStates()
        bindSwitchListeners()
    }

    override fun onResume() {
        super.onResume()
        updateAccessibilityStatusBanner()
    }

    private fun loadSwitchStates() {
        switchBlockYoutubeApp.isChecked = ConfigRepository.isBlockYoutubeAppEnabled(this)
        switchBlockYoutubeAppShorts.isChecked = ConfigRepository.isBlockYoutubeAppShortsEnabled(this)
        switchSkipYoutubeAppAds.isChecked = ConfigRepository.isSkipYoutubeAppAdsEnabled(this)
        switchBlockBrowserYoutube.isChecked = ConfigRepository.isBlockBrowserYoutubeEnabled(this)
    }

    private fun bindSwitchListeners() {
        switchBlockYoutubeApp.setOnCheckedChangeListener { _, isChecked ->
            ConfigRepository.setBlockYoutubeAppEnabled(this, isChecked)
        }
        switchBlockYoutubeAppShorts.setOnCheckedChangeListener { _, isChecked ->
            ConfigRepository.setBlockYoutubeAppShortsEnabled(this, isChecked)
        }
        switchSkipYoutubeAppAds.setOnCheckedChangeListener { _, isChecked ->
            ConfigRepository.setSkipYoutubeAppAdsEnabled(this, isChecked)
        }
        switchBlockBrowserYoutube.setOnCheckedChangeListener { _, isChecked ->
            ConfigRepository.setBlockBrowserYoutubeEnabled(this, isChecked)
        }
    }

    private fun updateAccessibilityStatusBanner() {
        val enabled = isAccessibilityServiceEnabled()
        if (enabled) {
            tvServiceStatus.text = "Shield Service: ACTIVE"
            tvServiceStatus.setTextColor(ContextCompat.getColor(this, R.color.accent_green))
            btnOpenAccessibility.text = "Accessibility Settings (Active)"
        } else {
            tvServiceStatus.text = "Shield Service: NOT ENABLED"
            tvServiceStatus.setTextColor(ContextCompat.getColor(this, R.color.accent_amber))
            btnOpenAccessibility.text = "Enable Accessibility Shield"
        }
    }

    private fun isAccessibilityServiceEnabled(): Boolean {
        val expectedComponent = ComponentName(this, YouTubeBlockerAccessibilityService::class.java)
        val enabledServices = Settings.Secure.getString(
            contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false

        val splitter = TextUtils.SimpleStringSplitter(':')
        splitter.setString(enabledServices)
        while (splitter.hasNext()) {
            val componentStr = splitter.next()
            val enabledComponent = ComponentName.unflattenFromString(componentStr)
            if (enabledComponent != null && enabledComponent == expectedComponent) {
                return true
            }
        }
        return false
    }
}
