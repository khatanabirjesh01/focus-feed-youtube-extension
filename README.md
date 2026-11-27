# FocusFeed — Distraction-Free YouTube Suite (Browser Extension & Android Shield)

**FocusFeed** is a 100% local, privacy-first distraction filter for YouTube with **zero external servers** and **zero data collection**.

This repository contains **two versions** tailored to what each platform supports natively:
1. **Desktop Browser Extension** (Chrome / Brave / Edge / Chromium Manifest V3) — located in [`extension/`](./extension/).
2. **Android Shield App (`FocusFeed Shield`)** (Lightweight Native Companion Guard for the Official YouTube Android App) — located in [`android-app/`](./android-app/), with prebuilt APK [`FocusFeed-Shield.apk`](./FocusFeed-Shield.apk).

---

## Repository Structure

```text
focus-feed-youtube-extension/
├── README.md                  # This documentation
├── FocusFeed-Shield.apk       # Signed lightweight Android APK (~70 KB, Android 7.0+)
│
├── extension/                 # Manifest V3 Desktop Browser Extension
│   ├── manifest.json
│   ├── defaults.js
│   ├── content.js
│   ├── styles.css
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   └── icons/
│       ├── icon16.png
│       ├── icon32.png
│       ├── icon48.png
│       └── icon128.png
│
└── android-app/               # Standalone Lightweight Kotlin Android Project
    ├── README.md
    ├── build.gradle.kts
    ├── settings.gradle.kts
    ├── gradle.properties
    └── app/
        ├── build.gradle.kts
        └── src/main/
            ├── AndroidManifest.xml
            ├── java/com/focusfeed/app/
            │   ├── ConfigRepository.kt
            │   ├── MainActivity.kt
            │   ├── YouTubeBlockerAccessibilityService.kt
            │   └── service/
            │       ├── ShieldOverlayManager.kt
            │       └── YouTubeNodeInspector.kt
            └── res/
```

---

## Compatibility & Capabilities

### 1. Desktop Browser Extension (`extension/`)
- **Supported Browsers:** Google Chrome, Brave, Microsoft Edge, Vivaldi, Opera, Arc, and other Chromium Manifest V3 desktop browsers (including Incognito/Private mode once allowed).
- **Full Feature Set:**
  - **Shorts Blocker:** Hides Shorts shelves, cards, nav tabs, and redirects `/shorts/*` (except Always-Allow creators).
  - **Only Search Mode:** Clears the YouTube home recommendation feed.
  - **Block Watch Suggestions:** Hides watch-page recommendation feeds and end-screen overlays.
  - **Comments & Live Chat Blocker:** Hides comment sections and live chat frames.
  - **Auto-Skip & Fast-Forward Ads:** Auto-clicks Skip Ad, seeks unskippable ads, or speeds them up (`2x–16x`) with auto-mute.
  - **Blocked Channels & Collaboration Detection:** Blocks channels across bylines, avatars, `@handle`s, joint collaborations, and title mentions.
  - **Always-Allow Channels:** Supreme override over categories, keywords, and Shorts Blocker.
  - **Custom Blocked Keywords:** Word-boundary safe (`\b`) filtering.
  - **3-State Topic Fields:** `Off` | `Allow` | `Block` across 20 built-in categories + custom topics.
  - **Multi-Preset Profiles & JSON Import/Export:** Built-in & custom presets with auto-save and `.json` / `.txt` backup.

### 2. Android App (`android-app/` — `FocusFeed Shield`)
- **Compatibility:** Android **7.0 (API 24)** through **Android 14+ (API 34+)** protecting the official YouTube Android app (`com.google.android.youtube`).
- **Lightweight Native Design:** Pure Android platform UI (no WebViews, no third-party UI libraries, zero internet permissions, ~70 KB release APK).
- **Features Inside the Official YouTube App:**
  - **Block YouTube Shorts:** Masks the Shorts bottom navigation tab and immediately exits opened Shorts videos.
  - **Only Search Mode:** Covers the Home recommendation feed with a clean Search screen while keeping Search, Search Results, Subscriptions, and Watch playback accessible.
  - **Auto-Tap "Skip Ad":** Automatically clicks `"Skip"` / `"Skip Ad"` buttons in the YouTube player.
  - **Auto-Mute Video Ads:** Optionally mutes media audio during ad overlays and restores volume when playback resumes.
  - **Block Comments & Live Chat:** Auto-closes Comments and Live Chat drawers when opened.
  - **Cancel "Up Next" Autoplay:** Automatically taps Cancel on Up Next countdowns.
  - **Hide Watch Suggestions Below Video:** Covers related-videos suggestions below the video header while watching (with a **Peek for 15s** button).
  - **1-Tap Quick Modes:** *Strict Focus*, *Clean Watch*, and *Shorts & Ads*.

> **Android Platform Note:** On unrooted Android devices, app sandboxing prevents third-party apps from removing individual video cards inside `com.google.android.youtube`'s scrolling feed. Therefore, the Android app focuses strictly on the controls that work reliably inside the official YouTube app via `AccessibilityService` and `TYPE_ACCESSIBILITY_OVERLAY`.

---

## Desktop Browser Extension: Install, Update & Uninstall

### Install (Unpacked in Chrome / Brave / Edge)
1. Open **Brave** (`brave://extensions/`), **Chrome** (`chrome://extensions/`), or **Edge** (`edge://extensions/`).
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select the [`extension/`](./extension/) folder.
4. *(Optional)* Under **Details**, enable **Allow in Private / Incognito**.

### Uninstall (Browser Extension)
1. Open `brave://extensions/` (or `chrome://extensions/`).
2. Click **Remove** on **FocusFeed - YouTube Feed & Distraction Filter**.

---

## Android App (`FocusFeed Shield`): Install, Setup & Build

### Install the Prebuilt APK
1. Download [`FocusFeed-Shield.apk`](./FocusFeed-Shield.apk) (or from **GitHub Releases**) directly onto your Android phone.
   *(If an older FocusFeed build is installed, uninstall it first.)*
2. Tap `FocusFeed-Shield.apk` to install (enable **Allow from this source / Install unknown apps** if prompted).
   - **If Google Play Protect blocks or warns during scan:** Sideloaded apps declaring `AccessibilityService` (`BIND_ACCESSIBILITY_SERVICE`) trigger Play Protect checks on Android 13–16 when not installed from the Play Store. You can either:
     - Tap **More details -> Install anyway**, **or**
     - Temporarily turn off **Scan apps with Play Protect** in **Play Store -> Profile -> Play Protect -> ⚙️**, install `FocusFeed-Shield.apk`, then turn it back on, **or**
     - Install via USB from your computer (`adb install FocusFeed-Shield.apk`), which also enables the Accessibility Service cleanly on Android 13+.

### Enable the Shield on Your Phone
1. Open **FocusFeed Shield** -> tap **Enable Shield** -> turn **ON** **FocusFeed YouTube App Shield** in Android Accessibility Settings.
   - *Android 13+ sideload note:* If Android blocks the toggle as a *"Restricted setting"*, tap **App Info** inside FocusFeed Shield -> tap **`⋮`** (top-right) -> **Allow restricted settings**, then return and turn it **ON**.
2. Choose a Quick Mode (*Strict Focus*, *Clean Watch*, or *Shorts & Ads*) or customize individual switches, then tap **Open YouTube**.

### Build from Source
```bash
cd android-app
gradle testDebugUnitTest assembleRelease
# Signed APK output: app/build/outputs/apk/release/app-release.apk
```
