# FocusFeed Shield (Lightweight Official YouTube App Guard)

A lightweight, 100% offline Android companion app (`AccessibilityService` + `TYPE_ACCESSIBILITY_OVERLAY`) built strictly for the **official YouTube Android app (`com.google.android.youtube`)** with zero WebViews and zero external UI dependencies.

---

## Features That Reliably Work Inside the Official YouTube App

1. **Block YouTube Shorts:** Masks the Shorts bottom navigation tab and immediately exits any Shorts player opened inside YouTube.
2. **Only Search Mode (Hide Home Feed):** Covers the Home recommendation feed while keeping YouTube's Search bar, Search results, Subscriptions, and Watch playback accessible.
3. **Auto-Tap "Skip Ad":** Automatically taps visible `"Skip"` / `"Skip Ad"` buttons in the YouTube player.
4. **Auto-Mute Video Ads:** Optionally mutes media audio during ads and restores sound when playback resumes.
5. **Block Comments & Live Chat:** Auto-closes opened Comments or Live Chat drawers.
6. **Cancel "Up Next" Autoplay:** Automatically taps Cancel on the Up Next countdown overlay.
7. **Hide Watch Suggestions Below Video:** Covers the related-videos feed below the video header while watching (includes a **Peek 15s** button).
8. **1-Tap Quick Modes:** *Strict Focus*, *Clean Watch*, and *Shorts & Ads*.

---

## Which File to Install on Your Phone

Copy **only the single `.apk` file** (not the `android-app/` folder):
- **`FocusFeed-Shield.apk`** (release-signed with v1+v2+v3 schemes, `minSdk 24` / Android 7.0+)

If an older debug build (`com.focusfeed.app.debug`) was previously installed, uninstall it first before installing `FocusFeed-Shield.apk` (`com.focusfeed.shield`).

---

## Build & Test

```bash
cd android-app
gradle testDebugUnitTest assembleRelease
# Output APK: app/build/outputs/apk/release/app-release.apk
```
