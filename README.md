# FocusFeed — Distraction-Free YouTube Suite (Browser Extension & Android App)

**FocusFeed** is a 100% local, zero-API, privacy-first distraction filter for YouTube. It blocks YouTube Shorts, hides home and watch-page recommendation feeds, skips/fast-forwards ads, blocks specific channels (including collaborations), filters by keyword, and enforces 3-state topic categories—all with **zero external servers** and **zero data collection**.

This repository contains **two separate versions**:
1. **Desktop Browser Extension** (Chrome / Brave / Edge / Chromium Manifest V3) — located in [`extension/`](./extension/).
2. **Android Application** (Filtered In-App Browser + System App/Browser Shield) — located in [`android-app/`](./android-app/).

---

## Repository Structure

```text
youtube-extension/
├── README.md                  # This documentation
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
└── android-app/               # Standalone Android Gradle/Kotlin Project
    ├── README.md
    ├── build.gradle.kts
    ├── settings.gradle.kts
    ├── gradle.properties
    └── app/
        ├── build.gradle.kts
        └── src/main/
            ├── AndroidManifest.xml
            ├── assets/        # Android-adapted filter engine & settings UI
            ├── java/com/focusfeed/app/
            └── res/
```

---

## Compatibility Matrix (OS & Browsers)

### 1. Desktop Browser Extension
| Component | Compatibility |
| :--- | :--- |
| **Operating Systems** | **Windows** (10/11), **macOS**, **Linux**, **ChromeOS** |
| **Supported Browsers** | **Google Chrome**, **Brave**, **Microsoft Edge**, **Vivaldi**, **Opera**, **Arc**, and other Chromium-based desktop browsers supporting **Manifest V3** |
| **Incognito / Private Mode** | Supported (`"incognito": "spanning"`) once enabled per browser instructions |
| **Not Supported** | Mobile Chrome/Safari, iOS browsers, Desktop Safari, Mozilla Firefox (uses MV3 Chromium APIs) |

### 2. Android Application (`android-app/`)
| Component | Compatibility |
| :--- | :--- |
| **Operating System** | **Android 8.0 Oreo (API 26)** through **Android 15 (API 34+)** |
| **In-App Filtered Player** | Built-in Chromium-based Android `WebView` (`m.youtube.com` & desktop `youtube.com`) |
| **Official YouTube App Shield** | Official YouTube Android App (`com.google.android.youtube`) via Android `AccessibilityService` |
| **External Mobile Browsers Guarded** | **Chrome**, **Brave**, **Firefox**, **Microsoft Edge**, **Samsung Internet**, **Opera**, **DuckDuckGo** on Android |
| **Not Supported** | iOS / iPadOS |

---

## Exact Capabilities: What Each Version Can Do

| Feature | Desktop Extension | Android App (In-App Player) | Android Accessibility Shield (External YouTube App / Browsers) |
| :--- | :---: | :---: | :---: |
| **Shorts Blocker** (Shelves, Cards, Nav Tabs, `/shorts/` Redirect) | Full | Full | Closes Shorts player in YouTube app |
| **Only Search Mode** (Clear Home Recommendation Feed) | Full | Full | N/A *(use In-App Player)* |
| **Block Watch Suggestions** (Sidebar, Related Feed, End-Screens) | Full | Full | N/A *(use In-App Player)* |
| **Comments & Live Chat Blocker** | Full | Full | N/A *(use In-App Player)* |
| **Auto-Skip Video Ads** | Full (Button + Unskippable Seek) | Full (Button + Unskippable Seek) | Auto-taps visible "Skip / Skip Ad" buttons |
| **Ad Fast-Forward & Auto-Mute** (2x, 4x, 8x, 16x) | Full | Full | N/A *(use In-App Player)* |
| **Blocked Channels & Collaboration Detection** | Full (Byline, Avatar, `@handle`, Title, Snippet) | Full | N/A *(use In-App Player)* |
| **Always-Allow Channels (Supreme Override)** | Full (Overrides Categories, Keywords & Shorts) | Full | N/A *(use In-App Player)* |
| **Custom Blocked Keywords** (Word-Boundary Safe) | Full | Full | N/A *(use In-App Player)* |
| **3-State Topic Fields** (`Off` \| `Allow` \| `Block` + `@handle` match) | Full | Full | N/A *(use In-App Player)* |
| **Named Presets, Auto-Save & Custom Unsaved Mode** | Full | Full | N/A *(use In-App Player)* |
| **Import / Export (`.json` & `.txt` Cross-Compatible)** | Full | Full (via Android Document Picker) | N/A |
| **Block Official YouTube App Completely** | N/A | N/A | Full (Closes YouTube app & opens FocusFeed) |
| **Intercept YouTube Links in Mobile Browsers** | N/A | Full (Deep Links) | Full (Redirects browser `youtube.com` to FocusFeed) |

> **Why Android Uses Both an In-App Player and an Accessibility Shield:**  
> On unrooted Android devices, security sandboxing prevents any third-party app from injecting CSS/JavaScript into the official YouTube APK (`com.google.android.youtube`) or external mobile browser tabs. Therefore, **full feed/channel/keyword/topic filtering** runs inside FocusFeed's integrated `WebView` player, while the **Accessibility Shield** blocks or redirects the official YouTube app and mobile browser tabs so you cannot accidentally bypass your filters.

---

## How to Use FocusFeed (Both Versions)

### 1. Precedence Order (What Overrides What)
Video cards are evaluated strictly from top to bottom:
1. **Blocked Channels & Collaborations (Highest Channel Block):** Hides any video by a blocked creator, including joint collaborations (e.g., `"Creator A and Creator B"`), avatar/channel links, title mentions (`ft.`, `with`, `@handle`), and description snippets.
2. **Always-Allow Channels (Supreme Override):** Overrides **Blocked Categories**, **Blocked Keywords**, and the **Shorts Blocker**. Creators here always appear and can even play Shorts while the Shorts Blocker is active. *(Mutually exclusive with Blocked Channels—a channel cannot be in both lists at the same time.)*
3. **Shorts Blocker:** Hides Shorts cards, shelves, navigation tabs, and redirects `/shorts/*` URLs for non-allowed channels.
4. **Custom Blocked Keywords:** Hides videos containing exact whole words (`\b` boundary safe, so blocking `"ass"` never blocks `"class"`).
5. **Topic Categories (3-State Fields):**
   - **Off:** Neutral—no filtering for this category.
   - **Allow:** Strict whitelist mode—only videos matching at least one `Allow` topic (and zero `Block` topics) are shown.
   - **Block:** Hides any video matching this topic.
   - **Tip:** Expand any field (✏️) to add `@channel` handles or creator names directly into that category.

### 2. Multi-Preset Profiles & Custom Mode
- **Switch Presets:** Use the top **🎛️ Preset** bar or the **Presets** tab to switch between built-in profiles (*Deep Focus & Study*, *Minimal Search Only*, *Casual & Balanced*) or your own saved profiles.
- **Auto-Save:** While a preset is active, any change you make in Toggles, Fields, or Lists automatically saves to that preset locally.
- **Custom / Unsaved Mode:** Select **"✨ Custom (Unsaved Changes)"** or tap **Detach to Custom** to experiment freely—your changes apply live to YouTube without modifying or overwriting any saved preset.

### 3. Sharing Rules Between Desktop & Android
- Open **Lists**, **Fields**, or **Presets** -> tap **Export** to save a `.json` file.
- Transfer that `.json` file to your other device and tap **Import** to sync your exact setup offline.

---

## Desktop Browser Extension: Install, Update & Uninstall

### Install (Unpacked in Chrome / Brave / Edge)
1. Open **Brave** (`brave://extensions/`), **Chrome** (`chrome://extensions/`), or **Edge** (`edge://extensions/`).
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `extension/` folder containing `manifest.json` (`/Users/birjeshkhatana/PROJECTS/youtube-extension/extension`).
5. Pin the **FocusFeed** icon in your toolbar.

### Enable in Private / Incognito Mode
1. On the extensions page, click **Details** on the **FocusFeed** card.
2. Toggle **Allow in Private** (Brave) / **Allow in Incognito** (Chrome) **ON**.

### Uninstall (Browser Extension)
1. Go to `brave://extensions/` (or `chrome://extensions/`).
2. Find **FocusFeed - YouTube Feed & Distraction Filter**.
3. Click **Remove** and confirm. All local extension settings are deleted automatically.

---

## Android App (`android-app/`): Build, Install, Setup & Uninstall

### Build & Install the APK
1. Open **Android Studio** -> **Open** -> choose `/Users/birjeshkhatana/PROJECTS/youtube-extension/android-app`.
   *(Or from a terminal with Android SDK & Gradle installed: `cd android-app && gradle assembleDebug`.)*
2. Click **Build -> Build Bundle(s) / APK(s) -> Build APK(s)** to generate `app/build/outputs/apk/debug/app-debug.apk`.
3. Transfer `app-debug.apk` to your Android phone and tap it to install (grant **Install unknown apps** permission if prompted).

### Setup In-App Filters & Accessibility Shield
1. Open **FocusFeed** on your Android phone—YouTube (`m.youtube.com`) loads immediately with filtering active.
2. Tap **⚙️ Rules** in the top bar to configure Toggles, Topic Fields, Channel Lists, and Presets.
3. Tap **🛡️ Shield** in the top bar to configure system-wide blocking:
   - Tap **Enable Accessibility Shield** -> find **FocusFeed YouTube App & Browser Shield** in Android's Installed Services -> turn **ON**.
   - Choose your preferred protections:
     - **Block Official YouTube App (Redirect)**
     - **Block Shorts Inside YouTube App**
     - **Auto-Tap 'Skip Ad' in YouTube App**
     - **Block YouTube Website in Mobile Browsers**
4. *(Optional)* In Android **Settings -> Apps -> Default apps -> Opening links**, set **FocusFeed** to open `youtube.com` and `youtu.be` links automatically.

### Uninstall (Android App)
1. *(If Shield was enabled)* Open Android **Settings -> Accessibility** and turn **FocusFeed** **OFF** (optional; uninstalling also disables it).
2. Long-press the **FocusFeed** app icon on your Android home screen/app drawer -> tap **Uninstall** (or go to **Settings -> Apps -> FocusFeed -> Uninstall**).
