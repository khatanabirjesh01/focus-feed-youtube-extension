package com.focusfeed.app

import android.app.Activity
import android.content.ComponentName
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.text.TextUtils
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.Switch
import android.widget.TextView
import android.widget.Toast
import com.focusfeed.app.service.YouTubeNodeInspector

/**
 * Lightweight, zero-bloat single-screen dashboard for FocusFeed YouTube App Shield.
 */
class MainActivity : Activity() {

    private lateinit var tvHeaderStatus: TextView
    private lateinit var cardSetup: LinearLayout
    private lateinit var tvServiceTitle: TextView
    private lateinit var tvServiceDesc: TextView
    private lateinit var tvRestrictedHint: TextView
    private lateinit var btnAccessibility: Button

    private lateinit var switchMaster: Switch
    private lateinit var tvMasterSub: TextView

    private lateinit var tvStatShorts: TextView
    private lateinit var tvStatAds: TextView
    private lateinit var tvStatComments: TextView
    private lateinit var tvStatAutoplay: TextView

    private lateinit var switchBlockShorts: Switch
    private lateinit var switchOnlySearch: Switch
    private lateinit var switchAdSkip: Switch
    private lateinit var switchAdMute: Switch
    private lateinit var switchBlockComments: Switch
    private lateinit var switchCancelAutoplay: Switch
    private lateinit var switchHideWatchSuggestions: Switch

    private var isBindingUi = false

    private val repoListener: () -> Unit = {
        runOnUiThread { bindState() }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        tvHeaderStatus = findViewById(R.id.tvHeaderStatus)
        cardSetup = findViewById(R.id.cardSetup)
        tvServiceTitle = findViewById(R.id.tvServiceTitle)
        tvServiceDesc = findViewById(R.id.tvServiceDesc)
        tvRestrictedHint = findViewById(R.id.tvRestrictedHint)
        btnAccessibility = findViewById(R.id.btnAccessibilitySettings)

        switchMaster = findViewById(R.id.switchMaster)
        tvMasterSub = findViewById(R.id.tvMasterSub)

        tvStatShorts = findViewById(R.id.tvStatShorts)
        tvStatAds = findViewById(R.id.tvStatAds)
        tvStatComments = findViewById(R.id.tvStatComments)
        tvStatAutoplay = findViewById(R.id.tvStatAutoplay)

        switchBlockShorts = findViewById(R.id.switchBlockShorts)
        switchOnlySearch = findViewById(R.id.switchOnlySearch)
        switchAdSkip = findViewById(R.id.switchAdSkip)
        switchAdMute = findViewById(R.id.switchAdMute)
        switchBlockComments = findViewById(R.id.switchBlockComments)
        switchCancelAutoplay = findViewById(R.id.switchCancelAutoplay)
        switchHideWatchSuggestions = findViewById(R.id.switchHideWatchSuggestions)

        findViewById<Button>(R.id.btnOpenYouTube).setOnClickListener { openOfficialYouTubeApp() }
        btnAccessibility.setOnClickListener { openAccessibilitySettings() }
        findViewById<Button>(R.id.btnAppInfo).setOnClickListener { openAppInfoSettings() }

        findViewById<View>(R.id.btnResetStats).setOnClickListener {
            ConfigRepository.resetStats(this)
            Toast.makeText(this, "Counters reset", Toast.LENGTH_SHORT).show()
        }

        setupQuickModes()
        setupSwitchListeners()

        ConfigRepository.addChangeListener(repoListener)
        bindState()
    }

    override fun onResume() {
        super.onResume()
        bindState()
    }

    override fun onDestroy() {
        ConfigRepository.removeChangeListener(repoListener)
        super.onDestroy()
    }

    private fun setupQuickModes() {
        findViewById<Button>(R.id.btnModeStrict).setOnClickListener {
            ConfigRepository.clearSnooze()
            ConfigRepository.saveConfig(
                this,
                ShieldConfig(
                    enabled = true,
                    blockShorts = true,
                    onlySearch = true,
                    adSkip = true,
                    adMute = true,
                    blockComments = true,
                    cancelAutoplay = true,
                    hideWatchSuggestions = true
                )
            )
            Toast.makeText(this, "Strict Focus mode applied", Toast.LENGTH_SHORT).show()
        }

        findViewById<Button>(R.id.btnModeClean).setOnClickListener {
            ConfigRepository.clearSnooze()
            ConfigRepository.saveConfig(
                this,
                ShieldConfig(
                    enabled = true,
                    blockShorts = true,
                    onlySearch = false,
                    adSkip = true,
                    adMute = false,
                    blockComments = true,
                    cancelAutoplay = true,
                    hideWatchSuggestions = false
                )
            )
            Toast.makeText(this, "Clean Watch mode applied", Toast.LENGTH_SHORT).show()
        }

        findViewById<Button>(R.id.btnModeLite).setOnClickListener {
            ConfigRepository.clearSnooze()
            ConfigRepository.saveConfig(
                this,
                ShieldConfig(
                    enabled = true,
                    blockShorts = true,
                    onlySearch = false,
                    adSkip = true,
                    adMute = false,
                    blockComments = false,
                    cancelAutoplay = false,
                    hideWatchSuggestions = false
                )
            )
            Toast.makeText(this, "Shorts & Ads Only mode applied", Toast.LENGTH_SHORT).show()
        }
    }

    private fun setupSwitchListeners() {
        switchMaster.setOnCheckedChangeListener { _, checked ->
            if (isBindingUi) return@setOnCheckedChangeListener
            if (checked) ConfigRepository.clearSnooze()
            ConfigRepository.saveConfig(this, ConfigRepository.getConfig(this).copy(enabled = checked))
        }
        switchBlockShorts.setOnCheckedChangeListener { _, checked ->
            if (isBindingUi) return@setOnCheckedChangeListener
            ConfigRepository.saveConfig(this, ConfigRepository.getConfig(this).copy(blockShorts = checked))
        }
        switchOnlySearch.setOnCheckedChangeListener { _, checked ->
            if (isBindingUi) return@setOnCheckedChangeListener
            ConfigRepository.saveConfig(this, ConfigRepository.getConfig(this).copy(onlySearch = checked))
        }
        switchAdSkip.setOnCheckedChangeListener { _, checked ->
            if (isBindingUi) return@setOnCheckedChangeListener
            ConfigRepository.saveConfig(this, ConfigRepository.getConfig(this).copy(adSkip = checked))
        }
        switchAdMute.setOnCheckedChangeListener { _, checked ->
            if (isBindingUi) return@setOnCheckedChangeListener
            ConfigRepository.saveConfig(this, ConfigRepository.getConfig(this).copy(adMute = checked))
        }
        switchBlockComments.setOnCheckedChangeListener { _, checked ->
            if (isBindingUi) return@setOnCheckedChangeListener
            ConfigRepository.saveConfig(this, ConfigRepository.getConfig(this).copy(blockComments = checked))
        }
        switchCancelAutoplay.setOnCheckedChangeListener { _, checked ->
            if (isBindingUi) return@setOnCheckedChangeListener
            ConfigRepository.saveConfig(this, ConfigRepository.getConfig(this).copy(cancelAutoplay = checked))
        }
        switchHideWatchSuggestions.setOnCheckedChangeListener { _, checked ->
            if (isBindingUi) return@setOnCheckedChangeListener
            ConfigRepository.saveConfig(this, ConfigRepository.getConfig(this).copy(hideWatchSuggestions = checked))
        }
    }

    private fun bindState() {
        isBindingUi = true
        try {
            val serviceEnabled = isAccessibilityServiceEnabled()
            val cfg = ConfigRepository.getConfig(this)
            val snoozed = ConfigRepository.isSnoozed()

            val green = Color.parseColor("#22C55E")
            val amber = Color.parseColor("#F59E0B")

            if (serviceEnabled) {
                tvServiceTitle.text = "Accessibility Shield: ACTIVE"
                tvServiceTitle.setTextColor(green)
                tvServiceDesc.text = "FocusFeed Shield is active on the official YouTube app."
                btnAccessibility.text = "Accessibility Settings"
                tvRestrictedHint.visibility = View.GONE
            } else {
                tvServiceTitle.text = "Accessibility Shield: SETUP REQUIRED"
                tvServiceTitle.setTextColor(amber)
                tvServiceDesc.text = "Turn on 'FocusFeed YouTube App Shield' in Android Accessibility Settings."
                btnAccessibility.text = "Enable Shield"
                tvRestrictedHint.visibility = View.VISIBLE
            }

            when {
                !serviceEnabled -> {
                    tvHeaderStatus.text = "Accessibility Shield disabled"
                    tvHeaderStatus.setTextColor(amber)
                }
                !cfg.enabled || snoozed -> {
                    tvHeaderStatus.text = "Shield paused"
                    tvHeaderStatus.setTextColor(amber)
                }
                else -> {
                    tvHeaderStatus.text = "Guarding YouTube App"
                    tvHeaderStatus.setTextColor(green)
                }
            }

            switchMaster.isChecked = cfg.enabled && !snoozed
            when {
                !cfg.enabled -> {
                    tvMasterSub.text = "Paused — YouTube app is unrestricted"
                    tvMasterSub.setTextColor(amber)
                }
                snoozed -> {
                    tvMasterSub.text = "Snoozed — toggle ON to resume now"
                    tvMasterSub.setTextColor(amber)
                }
                else -> {
                    tvMasterSub.text = "Active on Official YouTube App"
                    tvMasterSub.setTextColor(green)
                }
            }

            switchBlockShorts.isChecked = cfg.blockShorts
            switchOnlySearch.isChecked = cfg.onlySearch
            switchAdSkip.isChecked = cfg.adSkip
            switchAdMute.isChecked = cfg.adMute
            switchBlockComments.isChecked = cfg.blockComments
            switchCancelAutoplay.isChecked = cfg.cancelAutoplay
            switchHideWatchSuggestions.isChecked = cfg.hideWatchSuggestions

            val stats = ConfigRepository.getStats(this)
            tvStatShorts.text = stats.shortsBlocked.toString()
            tvStatAds.text = stats.adsSkipped.toString()
            tvStatComments.text = stats.commentsClosed.toString()
            tvStatAutoplay.text = stats.autoplayCancelled.toString()
        } finally {
            isBindingUi = false
        }
    }

    private fun isAccessibilityServiceEnabled(): Boolean {
        return try {
            val expected = ComponentName(this, YouTubeBlockerAccessibilityService::class.java)
            val enabled = Settings.Secure.getString(
                contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: return false

            val splitter = TextUtils.SimpleStringSplitter(':')
            splitter.setString(enabled)
            while (splitter.hasNext()) {
                val component = ComponentName.unflattenFromString(splitter.next())
                if (component == expected) return true
            }
            false
        } catch (_: Exception) {
            false
        }
    }

    private fun openAccessibilitySettings() {
        try {
            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        } catch (_: Exception) {
        }
    }

    private fun openAppInfoSettings() {
        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.fromParts("package", packageName, null)
            }
            startActivity(intent)
        } catch (_: Exception) {
        }
    }

    private fun openOfficialYouTubeApp() {
        val launchIntent = packageManager.getLaunchIntentForPackage(YouTubeNodeInspector.YOUTUBE_PACKAGE)
        if (launchIntent != null) {
            try {
                startActivity(launchIntent)
            } catch (e: Exception) {
                Toast.makeText(this, "Could not launch YouTube: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        } else {
            Toast.makeText(this, "Official YouTube app is not installed", Toast.LENGTH_SHORT).show()
        }
    }
}
