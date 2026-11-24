# FocusFeed - Real-Time YouTube Filter (Chrome Extension Manifest V3)

FocusFeed is a production-ready, client-side Chrome Extension for YouTube.com that filters Shorts, comments, channels, keywords, and topic fields in real-time with **zero external APIs** and zero network requests.

---

## Features

1. **Layer 1: Hard UI & Format Toggles (CSS-First at `document_start`)**
   - Injected before first paint on `document.documentElement` (`<html>`) so blocked elements never flash or shift.
   - **Master Extension Toggle:** Instant global pause / activate.
   - **Shorts Blocker:** Hides Shorts shelves (`ytd-reel-shelf-renderer`, `ytd-rich-section-renderer`), individual Shorts cards, and sidebar links. Client-side and SPA navigations to `youtube.com/shorts/*` are immediately redirected to `https://www.youtube.com/` (unless from an Always-Allow channel).
   - **Only Search (Hide Home Feed):** Placed right under Shorts Blocker. Completely hides the home page feed on `youtube.com/` so you only use intentional search, eliminating mindless home feed scrolling.
   - **Block Watch Suggestions:** When playing a video on watch pages (`youtube.com/watch?v=...`), completely hides recommendation feeds at the bottom and sidebar, as well as player end-screen cards. The video playing, title, channel, description, and controls remain 100% visible and untouched.
   - **Comments & Live Chat Blocker:** Hides `#comments`, `ytd-comments`, `ytd-live-chat-frame`, and `#chatframe`.
   - **Auto-Skip Video Ads:** Automatically clicks the native "Skip Ad" button and fast-seeks unskippable video ads to completion as soon as they begin.
   - **Ad Fast-Forward & Auto-Mute:** Selectable acceleration speed (2x, 4x, 8x, 16x) that accelerates ad playback and mutes audio when ads play, seamlessly restoring normal 1x speed and audio when the video resumes.

2. **Layer 2: Video Card Filtering (Strict Top-Down Precedence)**
   - Operates strictly on video cards in Home, Subscriptions, Search, and Watch sidebar (`ytd-rich-item-renderer`, `ytd-video-renderer`, `ytd-compact-video-renderer`, `ytd-grid-video-renderer`, `yt-lockup-view-model`). Main video player is never hidden.
   - Evaluation order:
     1. **Blocked Channels & Collaborations (High Priority):**
        - If a channel is blocked, ANY video it collaborates on, co-authors, or is featured in is immediately hidden!
        - Scans joint bylines (`"PJ Explained and PJ"`, `"Creator A & Creator B"`, `"A x B"`), multiple channel links/elements on the card, video titles (`"ft. Channel"`, `"feat. Channel"`, `"with Channel"`, `"w/ Channel"`, `"@handle"`, or distinctive channel names in the title), and card snippets.
     2. **Always-Allow Channels (Primitive / Supreme Override):**
        - Videos from these channels are shown immediately. Overrides Shorts blocker, custom blocked keywords, and topic fields.
        - Allowed channels' Shorts are permitted to play on `youtube.com/shorts/*` even when the background Shorts Blocker is active.
     3. **Shorts Blocker (for non-allowed channels):** Hides Shorts cards and shelves.
     4. **Custom Blocked Keywords:** Word-boundary matching (`\b`) ensures short words like `"ass"` do not match `"class"`, `"bass"`, or `"classic"`.
     5. **Field Filter (3-State per Field: `Off` | `Allow` | `Block`):**
        - Predefined: Science, Technology, Finance, Education, News & Politics, Gaming, Entertainment, Sports, Music, Fitness, Motivation Bluff, Edit Videos, Vlogs, Pranks & Comedy, Gameplays & Streams, Food Vlogs & Mukbang, Drama & Gossip, Clickbait & Speculation, Reactions, Hauls & Unboxing, True Crime & Horror (+ custom fields).
        - Non-contradictory logic:
          - If &ge;1 field is `Allow`: SHOW only if video matches at least one `Allow` field AND zero `Block` fields.
          - If 0 fields are `Allow`: HIDE if video matches any `Block` field; otherwise SHOW.
        - Standalone `classifyVideo(title, channelName, fields)` function.
        - **Import, Export & Reset:** Export and import fields as JSON, or reset to factory defaults at any time.

3. **Channel & Keyword Management (Mutual Exclusion & Granular Control)**
   - Supports handles (`@veritasium`), full URLs (`https://youtube.com/@veritasium/videos`), channel IDs (`/channel/UC...`), and display names (`Veritasium`).
   - **Strict Mutual Exclusion:** A channel cannot exist in both Always-Allow and Blocked lists simultaneously. You cannot add a channel to Blocked if it is in Always-Allow (and vice versa) unless removed from the other list first.
   - **Conflict-Safe Importing:** Importing channels skips any that already exist in the opposing list and notifies you of skipped conflicts.
   - **1-Click Swap (`⇄`):** Safely moves an existing channel between Always-Allow and Blocked lists with a single click.
   - **Individual Checkbox Toggles:** Temporarily disable or re-enable any allowed channel, blocked channel, or keyword with a single checkbox click without deleting it.
   - **Granular Import & Export:** Dedicated import and export for Always-Allow Channels, Blocked Channels, and Custom Blocked Keywords supporting both `.json` and plain `.txt` (one per line) formats, plus individual list Reset buttons.

4. **Performance, SPA Support & Guardrails**
   - Centralized `SELECTORS` constant.
   - Debounced `MutationObserver` (150ms) to filter infinite-scroll cards without scroll lag.
   - `data-ff-checked` attribute prevents redundant re-scans. Immediate re-evaluation on `chrome.storage.onChanged` and `yt-navigate-finish`.
   - **Empty Feed Guard:** If 20+ cards are hidden on Home while fewer than 4 remain visible, shows a dismissible top banner.
   - **Backup & Restore:** Full configuration export/import via JSON in `chrome.storage.local`.

---

## Installation Steps (Brave / Chrome)

1. Open Brave (or Chrome).
2. Navigate to `brave://extensions/` (or `chrome://extensions/`) in the address bar.
3. Enable **Developer mode** using the toggle switch in the top right corner.
4. Click the **Load unpacked** button in the top left corner.
5. Select the project folder:
   ```
   /Users/birjeshkhatana/PROJECTS/youtube_extension
   ```
6. The **FocusFeed** icon will appear in your browser toolbar. Pin it for quick access.
7. **To Use in Private / Incognito Mode:**
   - In `brave://extensions/`, click **Details** on the FocusFeed extension card.
   - Scroll down to **"Allow in Private"** (or **"Allow in Incognito"**) and flip the switch **ON**.
   - With `"incognito": "spanning"` enabled, FocusFeed seamlessly filters feeds, skips ads, and enforces your rules in private browsing!
8. Open [https://www.youtube.com](https://www.youtube.com) and test the filter toggles, channel lists, and topic fields!
