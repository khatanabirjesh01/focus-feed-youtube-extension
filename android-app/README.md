# FocusFeed Android (YouTube App, Website & Mobile Browser Blocker)

An Android application bringing the complete **FocusFeed** Chrome Extension filtering engine to Android devices, paired with a native Android **App & Website Shield (`AccessibilityService`)**.

---

## What This App Does

### 1. Filtered YouTube Experience (Full Feature Parity)
Built into `MainActivity` (`WebView` targeting `m.youtube.com` with full fullscreen video playback & SPA navigation support):
- **Shorts Blocker:** Hides mobile `ytm-*` & desktop `ytd-*` Shorts shelves, pivot tabs, cards, and redirects `/shorts/*` (except creators in **Always-Allow**).
- **Only Search Mode:** Clears the YouTube home recommendation feed to show a clean search-focused view.
- **Block Watch Suggestions:** Hides sidebar, bottom related videos, chip bars, and player end-screen recommendations while keeping the playing video, title, channel, and description untouched.
- **Comments & Live Chat Blocker:** Hides comments sections and live chat frames.
- **Auto-Skip & Fast-Forward Ads:** Auto-taps "Skip Ad", seeks unskippable video ads to completion, or accelerates ad playback (2x–16x) with auto-mute.
- **Channel & Collaboration Blocking:** Blocks primary channels, avatars, handles (`@creator`), joint bylines, title mentions, and snippets.
- **Always-Allow Supreme Override:** Overrides category blocks, keywords, and Shorts blocker (mutually exclusive with Blocked Channels).
- **3-State Topic Fields:** `Off` | `Allow` | `Block` across 20+ built-in categories + custom fields, supporting `@handle` and channel name keywords.
- **Multi-Preset Auto-Save & Custom Mode:** Save named presets locally, auto-save tweaks to the active preset, detach to Custom Mode, and Import/Export `.json` & `.txt` backups via Android's native document picker.

### 2. App & Website Shield (`YouTubeBlockerAccessibilityService`)
Configurable inside **🛡️ Shield** (`SystemBlockerActivity`) once enabled in Android Accessibility Settings:
- **Block Official YouTube App Completely:** Closes `com.google.android.youtube` immediately and opens FocusFeed's filtered YouTube browser instead.
- **Block Shorts Inside Official YouTube App:** If you leave the YouTube app enabled, automatically detects when a Shorts player opens inside `com.google.android.youtube` and closes it (`GLOBAL_ACTION_BACK`).
- **Auto-Tap "Skip Ad" Inside Official YouTube App:** Automatically clicks visible "Skip" / "Skip Ad" buttons inside `com.google.android.youtube`.
- **Block & Redirect YouTube in Mobile Browsers:** Intercepts `youtube.com` / `youtu.be` URLs in Chrome, Brave, Firefox, Edge, Samsung Internet, Opera, and DuckDuckGo, redirecting them straight into FocusFeed's filtered player.
- **Deep Link Handler:** Lets you choose **FocusFeed** when tapping any `youtube.com` or `youtu.be` link on Android.

> **Important Android Platform Note:** Unrooted Android does not allow external apps to inject CSS/JS into the official YouTube binary (`com.google.android.youtube`). Therefore, granular per-channel, keyword, and topic-field feed filtering operates inside FocusFeed's filtered player (`MainActivity`), while the Accessibility Shield protects you from bypassing it via the official YouTube app or mobile browsers.

---

## Project Structure

- `app/src/main/java/com/focusfeed/app/`
  - `MainActivity.kt` — Filtered YouTube `WebView` player, fullscreen video support, deep link handling, and early CSS/JS injection.
  - `SettingsActivity.kt` — Hosts the full FocusFeed UI (`popup.html`) with Android file Import/Export pickers.
  - `SystemBlockerActivity.kt` — Native controls for YouTube App & External Browser blocking.
  - `YouTubeBlockerAccessibilityService.kt` — On-device Accessibility Guard.
  - `ConfigRepository.kt` & `FocusFeedJsBridge.kt` — Local `SharedPreferences` JSON storage and WebView bridge.
- `app/src/main/assets/`
  - `android-bridge.js`, `defaults.js`, `styles-android.css`, `content-android.js`, `popup.html`, `popup.css`, `popup.js`

---

## How to Build the Downloadable APK

### Option 1: Android Studio (Recommended)
1. Open **Android Studio** -> **Open** -> select `/Users/birjeshkhatana/PROJECTS/youtube-extension/android-app`.
2. Let Gradle sync download dependencies (`compileSdk 34`, `minSdk 26`).
3. Click **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.
4. Copy the generated APK from:
   `app/build/outputs/apk/debug/app-debug.apk`
   to your Android phone and install it (allow "Install unknown apps" when prompted).

### Option 2: Command Line (with Android SDK & Gradle installed)
```bash
cd /Users/birjeshkhatana/PROJECTS/youtube-extension/android-app
gradle assembleDebug
# Output APK: app/build/outputs/apk/debug/app-debug.apk
```
