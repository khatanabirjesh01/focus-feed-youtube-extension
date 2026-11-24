/**
 * FocusFeed - Content Script (content.js)
 * Production-ready real-time YouTube filter engine (Manifest V3)
 * Runs at document_start
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. Centralized YouTube DOM Selectors
  // =========================================================================
  const SELECTORS = {
    // Primary Feed & Content Containers
    feedContainer: 'ytd-rich-grid-renderer #contents, #contents.ytd-rich-grid-renderer, #contents.ytd-section-list-renderer, ytd-rich-grid-renderer',
    richGridRenderer: 'ytd-rich-grid-renderer',
    primaryContent: '#primary, #content, ytd-page-manager',

    // Targeted Video Cards (Home, Subscriptions, Search, Watch Next Sidebar)
    videoCards: [
      'ytd-rich-item-renderer',
      'ytd-video-renderer',
      'ytd-compact-video-renderer',
      'ytd-grid-video-renderer',
      'yt-lockup-view-model'
    ].join(', '),

    // Shorts Elements (strictly valid element names for closest() lookups)
    shortsShelves: [
      'ytd-reel-shelf-renderer',
      'ytd-rich-shelf-renderer[is-shorts]',
      'ytd-reel-item-renderer'
    ].join(', '),
    shortsLink: 'a[href*="/shorts/"]',
    shortsSidebar: [
      'ytd-guide-entry-renderer:has(a[title="Shorts"])',
      'ytd-guide-entry-renderer:has(a[href^="/shorts"])',
      'ytd-mini-guide-entry-renderer[aria-label="Shorts"]',
      'ytd-mini-guide-entry-renderer:has(a[href^="/shorts"])'
    ].join(', '),

    // Comments & Live Chat Elements
    comments: '#comments, ytd-comments, ytd-live-chat-frame, #chat, #chatframe, ytd-live-chat-renderer',

    // Inner Card Metadata Extractors (includes modern 2024-2026 YouTube view models)
    cardTitle: [
      '#video-title',
      '#video-title-link',
      'a#video-title',
      'span#video-title',
      'yt-formatted-string#video-title',
      'h3.ytd-compact-video-renderer #video-title',
      '.yt-lockup-metadata-view-model__title',
      '.yt-lockup-view-model__title',
      'h3 a#video-title',
      'h3 a',
      'a[aria-label][href*="watch"]',
      'h3'
    ].join(', '),

    channelName: [
      'ytd-channel-name #text',
      'ytd-channel-name yt-formatted-string',
      '#channel-name #text',
      '#byline-container #text',
      'ytd-channel-name a',
      '#channel-name a',
      '.yt-lockup-metadata-view-model__subtitle',
      '.yt-lockup-view-model__subtitles',
      'a.yt-core-attributed-string__link'
    ].join(', '),

    channelLink: [
      'ytd-channel-name a[href]',
      '#channel-name a[href]',
      '#byline-container a[href]',
      'a.yt-simple-endpoint[href*="/@"]',
      'a.yt-simple-endpoint[href*="/channel/"]',
      'a.yt-simple-endpoint[href*="/c/"]',
      'a.yt-simple-endpoint[href*="/user/"]',
      'a.yt-core-attributed-string__link[href*="/@"]',
      'a.yt-core-attributed-string__link[href*="/channel/"]'
    ].join(', '),

    // Watch Page Main Video Player (NEVER HIDE)
    mainPlayer: [
      '#movie_player',
      '#player',
      '#player-container',
      'ytd-watch-flexy #player-container',
      '#player-container-outer',
      'ytd-player'
    ].join(', ')
  };

  // =========================================================================
  // 2. State & In-Memory Configuration
  // =========================================================================
  let config = Object.assign({}, DEFAULT_CONFIG);
  let mutationTimeout = null;
  let feedBannerDismissed = false;
  let lastEvaluatedStats = {
    hiddenCount: 0,
    visibleCount: 0,
    totalCards: 0
  };

  // =========================================================================
  // 3. Layer 1: Hard UI & Format Toggles (CSS-First at document_start)
  // =========================================================================

  /**
   * Applies or removes classes on document.documentElement (<html>)
   * before first paint so blocked UI elements never flash.
   */
  function applyLayer1Classes(cfg) {
    const docEl = document.documentElement;
    if (!docEl) return;

    if (cfg.enabled) {
      docEl.classList.add('ff-enabled');

      if (cfg.blockShorts) {
        docEl.classList.add('ff-block-shorts');
      } else {
        docEl.classList.remove('ff-block-shorts');
      }

      if (cfg.onlySearch) {
        docEl.classList.add('ff-only-search');
      } else {
        docEl.classList.remove('ff-only-search');
      }

      if (cfg.blockWatchSuggestions) {
        docEl.classList.add('ff-block-watch-suggestions');
      } else {
        docEl.classList.remove('ff-block-watch-suggestions');
      }

      if (cfg.blockComments) {
        docEl.classList.add('ff-block-comments');
      } else {
        docEl.classList.remove('ff-block-comments');
      }
    } else {
      // Master toggle OFF: remove all classes
      docEl.classList.remove(
        'ff-enabled',
        'ff-block-shorts',
        'ff-only-search',
        'ff-block-watch-suggestions',
        'ff-block-comments'
      );
    }

    updatePageContextClasses();
    updateSearchOnlyPlaceholder(cfg);
  }

  /**
   * Updates contextual page classes on documentElement:
   * - ff-is-home-page when on youtube.com/ (path === '/' and no v= query)
   * - ff-is-watch-page when on youtube.com/watch (path === '/watch' or has v= query)
   */
  function updatePageContextClasses() {
    const docEl = document.documentElement;
    if (!docEl) return;
    const isHomePage = (window.location.pathname === '/' || window.location.pathname === '') &&
                       !window.location.search.includes('v=');
    const isWatchPage = window.location.pathname === '/watch' || window.location.search.includes('v=');

    if (isHomePage) {
      docEl.classList.add('ff-is-home-page');
    } else {
      docEl.classList.remove('ff-is-home-page');
    }

    if (isWatchPage) {
      docEl.classList.add('ff-is-watch-page');
    } else {
      docEl.classList.remove('ff-is-watch-page');
    }
  }

  /**
   * Manages the clean distraction-free "Search Only" placeholder on the home page.
   */
  function updateSearchOnlyPlaceholder(cfg) {
    const existing = document.getElementById('ff-only-search-container');
    const isHomePage = (window.location.pathname === '/' || window.location.pathname === '') &&
                       !window.location.search.includes('v=');

    if (cfg && cfg.enabled && cfg.onlySearch && isHomePage) {
      if (!existing) {
        const homeContainer = document.querySelector('ytd-browse[page-subtype="home"] #primary, ytd-browse[page-subtype="home"], #primary');
        if (homeContainer) {
          const box = document.createElement('div');
          box.id = 'ff-only-search-container';
          box.className = 'ff-only-search-container';
          box.innerHTML = `
            <div class="ff-only-search-icon">🔍</div>
            <h2 class="ff-only-search-title">Search Only Mode</h2>
            <p class="ff-only-search-desc">Home feed is hidden to eliminate mindless browsing. Use the search bar above to find content with intention.</p>
          `;
          homeContainer.prepend(box);
        }
      }
    } else {
      if (existing) {
        existing.remove();
      }
    }
  }

  /**
   * Checks if the active Short on a /shorts/ page belongs to an Always-Allow channel.
   */
  function isCurrentShortAllowed(cfg) {
    if (!cfg || !cfg.alwaysAllowChannels || !cfg.alwaysAllowChannels.length) return false;

    const channelSelectors = [
      'ytd-reel-video-renderer[is-active] ytd-reel-player-header-renderer ytd-channel-name a',
      'ytd-reel-video-renderer[is-active] ytd-reel-player-header-renderer #channel-name a',
      'ytd-reel-video-renderer[is-active] a.yt-simple-endpoint[href*="/@"]',
      'ytd-reel-video-renderer[is-active] a[href*="/channel/"]',
      'ytd-reel-player-header-renderer a.yt-simple-endpoint[href*="/@"]',
      'yt-reel-channel-bar-renderer a[href*="/@"]',
      '#shorts-container ytd-channel-name a'
    ];

    let foundChannel = null;
    for (const sel of channelSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const name = (el.textContent || '').trim();
        const href = (el.getAttribute('href') || el.href || '').trim();
        let handle = '';
        if (href.includes('/@')) {
          const idx = href.indexOf('/@');
          handle = href.substring(idx + 1).split('/')[0].split('?')[0].toLowerCase();
        }
        foundChannel = {
          name,
          href,
          handle: handle.startsWith('@') ? handle : (handle ? '@' + handle : '')
        };
        break;
      }
    }

    if (!foundChannel) return false;

    // Check if channel is blocked
    if (cfg.blockedChannels && cfg.blockedChannels.length) {
      for (const blocked of cfg.blockedChannels) {
        if (matchesChannelRule(blocked, foundChannel)) {
          return false;
        }
      }
    }

    // Check if channel is in Always-Allow
    for (const allowed of cfg.alwaysAllowChannels) {
      if (matchesChannelRule(allowed, foundChannel)) {
        return true;
      }
    }

    return false;
  }

  let shortsRedirectTimer = null;

  /**
   * If Shorts blocker is enabled and user is on a /shorts/* URL:
   * Checks if the short belongs to an Always-Allow channel.
   * If allowlisted, lets it play! If not, redirects to home.
   */
  function checkShortsRedirect(cfg) {
    if (!cfg.enabled || !cfg.blockShorts) return;

    const pathname = window.location.pathname || '';
    if (!pathname.startsWith('/shorts/') && pathname !== '/shorts') {
      if (shortsRedirectTimer) clearInterval(shortsRedirectTimer);
      return;
    }

    // Generic /shorts directory without specific video: redirect
    if (pathname === '/shorts' || pathname === '/shorts/') {
      window.location.replace('https://www.youtube.com/');
      return;
    }

    // If channel is already verified as allowed, let it play
    if (isCurrentShortAllowed(cfg)) {
      return;
    }

    // Allow a short window (up to 800ms) for YouTube to hydrate the reel header
    let checks = 0;
    if (shortsRedirectTimer) clearInterval(shortsRedirectTimer);

    shortsRedirectTimer = setInterval(() => {
      checks++;
      if (isCurrentShortAllowed(cfg)) {
        clearInterval(shortsRedirectTimer);
        return; // Always-Allow channel: permit playback!
      }

      const reelHeader = document.querySelector(
        'ytd-reel-video-renderer[is-active] ytd-reel-player-header-renderer, ytd-reel-player-header-renderer'
      );

      if (reelHeader || checks >= 8) {
        clearInterval(shortsRedirectTimer);
        if (!isCurrentShortAllowed(cfg)) {
          window.location.replace('https://www.youtube.com/');
        }
      }
    }, 100);
  }

  // =========================================================================
  // 4. Metadata Extraction from Video Cards
  // =========================================================================

  /**
   * Extracts metadata (title, channelName, channelHref, channelHandle, isShort)
   * from a target video card element.
   */
  function extractCardMetadata(card) {
    // 1. Title
    const titleEl = card.querySelector(SELECTORS.cardTitle);
    const title = (
      (titleEl && (titleEl.textContent || titleEl.getAttribute('title') || titleEl.getAttribute('aria-label'))) ||
      ''
    ).trim();

    // 2. Byline Text & Containers
    const bylineEls = card.querySelectorAll(
      'ytd-channel-name, #channel-name, #byline-container, .yt-lockup-metadata-view-model__subtitle, .yt-lockup-view-model__subtitles'
    );
    let bylineText = '';
    bylineEls.forEach(el => {
      const t = (el.textContent || '').trim();
      if (t && !bylineText.includes(t)) {
        bylineText += (bylineText ? ' ' : '') + t;
      }
    });

    // 3. Extract All Channel Links & Collaborators
    const channelLinks = card.querySelectorAll(
      'ytd-channel-name a, #channel-name a, #byline-container a, .yt-lockup-metadata-view-model__subtitle a, a.yt-core-attributed-string__link, a[href*="/@"], a[href*="/channel/"], a[href*="/c/"], a[href*="/user/"], a#avatar-link'
    );

    const collaborators = [];
    const allHrefs = [];
    const allHandles = [];

    channelLinks.forEach(linkEl => {
      const href = (linkEl.getAttribute('href') || linkEl.href || '').trim();
      let name = (linkEl.textContent || linkEl.getAttribute('title') || linkEl.getAttribute('aria-label') || '').trim();
      let handle = '';

      if (href.includes('/@')) {
        const idx = href.indexOf('/@');
        handle = href.substring(idx + 1).split('/')[0].split('?')[0].toLowerCase();
        if (!handle.startsWith('@')) handle = '@' + handle;
      }

      if (!name && handle) {
        name = handle.replace(/^@/, '');
      }

      if (href && !allHrefs.includes(href)) {
        allHrefs.push(href);
      }
      if (handle && !allHandles.includes(handle)) {
        allHandles.push(handle);
      }

      if (name || href || handle) {
        const exists = collaborators.some(c => (c.name === name && c.href === href) || (c.handle && c.handle === handle));
        if (!exists) {
          collaborators.push({ name, href, handle });
        }
      }
    });

    // 4. Primary Channel (Prioritize named collaborator, then byline/channel-name container)
    const namedCollab = collaborators.find(c => c.name && c.name.trim() && !c.name.startsWith('@'));
    const handledCollab = collaborators.find(c => c.handle && c.handle.trim());
    const hrefCollab = collaborators.find(c => c.href && c.href.trim());
    const fallbackChannelEl = card.querySelector(SELECTORS.channelName);
    const fallbackName = (fallbackChannelEl ? fallbackChannelEl.textContent || '' : '').trim();

    const primaryName = (namedCollab ? namedCollab.name : (fallbackName || (handledCollab ? handledCollab.handle.replace(/^@/, '') : (bylineText || '')))).trim();
    const primaryHandle = (handledCollab ? handledCollab.handle : (primaryName ? '@' + primaryName.replace(/\s+/g, '').toLowerCase() : ''));
    const primaryHref = (hrefCollab ? hrefCollab.href : (primaryHandle ? '/' + primaryHandle : ''));

    // 5. Byline Tokens (Split by collaboration delimiters)
    const bylineTokens = [];
    if (bylineText) {
      const parts = bylineText.split(/\s*(?:,|&|\band\b|\bwith\b|\bfeat\.?\b|\bft\.?\b|\bx\b|\+)\s*/i);
      parts.forEach(p => {
        const clean = p.trim().toLowerCase();
        if (clean && clean.length >= 2 && !bylineTokens.includes(clean)) {
          bylineTokens.push(clean);
        }
      });
    }

    // 6. Snippet / Description
    const snippetEl = card.querySelector('#description-text, .yt-lockup-metadata-view-model__description, .metadata-snippet-container, ytd-video-meta-block');
    const snippet = (snippetEl ? snippetEl.textContent || '' : '').trim();

    // 7. Is Shorts video?
    let isShort = false;
    try {
      const shortsAnchor = card.querySelector(SELECTORS.shortsLink);
      const isShortUrl = shortsAnchor && (
        (shortsAnchor.getAttribute('href') || '').includes('/shorts/') ||
        (shortsAnchor.href || '').includes('/shorts/')
      );
      const isReelShelf = Boolean(
        card.closest('ytd-reel-shelf-renderer') ||
        card.closest('ytd-rich-shelf-renderer[is-shorts]') ||
        card.closest('ytd-reel-item-renderer')
      );
      isShort = Boolean(isShortUrl || isReelShelf);
    } catch (_) {
      isShort = false;
    }

    return {
      title,
      channel: {
        name: primaryName,
        href: primaryHref,
        handle: primaryHandle
      },
      bylineText,
      bylineTokens,
      collaborators,
      allHrefs,
      allHandles,
      snippet,
      isShort
    };
  }

  /**
   * Verifies whether an element is inside or part of the main video player.
   * Safety guard to guarantee the watch player is NEVER hidden.
   */
  function isMainPlayerElement(el) {
    if (!el) return false;
    return Boolean(el.closest(SELECTORS.mainPlayer));
  }

  // =========================================================================
  // 5. Layer 2: Video Card Filtering (Strict Top-Down Precedence)
  // =========================================================================

  /**
   * Evaluates a single card in strict top-down precedence order:
   * 1. Blocked Channels & Collaborations -> HIDE
   *    (Checks primary channel, collaborators, joint bylines, title mentions, and snippets)
   * 2. Always-Allow Channels (PRIMITIVE / SUPREME OVERRIDE) -> SHOW
   *    (Overrides Shorts blocker, blocked keywords, and field filters)
   * 3. Shorts Blocker -> HIDE (for non-allowed channels)
   * 4. Custom Blocked Keywords -> HIDE
   * 5. Field Filter (3-State) -> SHOW / HIDE via classifyVideo
   *
   * @param {Element} card
   * @param {Object} [passedMetadata]
   * @returns {{action: 'SHOW'|'HIDE', reason: string, isAlwaysAllow?: boolean}}
   */
  function evaluateCard(card, passedMetadata = null) {
    // Never hide main player
    if (isMainPlayerElement(card)) {
      return { action: 'SHOW', reason: 'Main player' };
    }

    const metadata = passedMetadata || extractCardMetadata(card);
    const { title, channel, isShort } = metadata;

    // Guard: If card is an unhydrated skeleton, do not hide it
    if (!title && !channel.name && !metadata.bylineText) {
      return { action: 'SHOW', reason: 'Unhydrated card' };
    }

    // -----------------------------------------------------------------------
    // RULE 1: Blocked Channels & Collaborations (runs first for channels)
    // "when a channel is collaborating with other channel block it too then :
    // for example if pj explained is blocked channel and under some video this
    // channel has collaborated with some other channel : like pj explained and pj ,
    // still block that channel. because it is in block list , also check if a
    // channel is somewhere else :"
    // -----------------------------------------------------------------------
    if (config.blockedChannels && config.blockedChannels.length > 0) {
      for (const blockedChannel of config.blockedChannels) {
        const matchResult = matchesChannelOrCollab(blockedChannel, metadata);
        if (matchResult && matchResult.matched) {
          const displayTarget = getRuleTarget(blockedChannel);
          card.removeAttribute('data-ff-allow');
          card.removeAttribute('data-ff-is-short');
          return {
            action: 'HIDE',
            reason: `Blocked Channel (${matchResult.location}): ${displayTarget}`
          };
        }
      }
    }

    // -----------------------------------------------------------------------
    // RULE 2: Always-Allow Channels (PRIMITIVE / SUPREME OVERRIDE)
    // If not blocked by a collaborating channel, Always-Allow channels SHOW immediately!
    // Overrides Shorts blocker, custom blocked keywords, and field filters!
    // -----------------------------------------------------------------------
    if (config.alwaysAllowChannels && config.alwaysAllowChannels.length > 0) {
      for (const allowedChannel of config.alwaysAllowChannels) {
        if (
          matchesChannelRule(allowedChannel, channel) ||
          (metadata.collaborators && metadata.collaborators.some(c => matchesChannelRule(allowedChannel, c)))
        ) {
          const displayTarget = getRuleTarget(allowedChannel);
          card.setAttribute('data-ff-allow', 'true');
          card.removeAttribute('data-ff-is-short');
          card.removeAttribute('data-ff-hidden');
          return {
            action: 'SHOW',
            reason: `Always-Allow Channel: ${displayTarget}`,
            isAlwaysAllow: true
          };
        }
      }
    }

    // -----------------------------------------------------------------------
    // RULE 3: Shorts check (For non-allowed channels)
    // If Shorts Blocker is ON, shorts are hidden
    // -----------------------------------------------------------------------
    if (config.blockShorts && isShort) {
      card.setAttribute('data-ff-is-short', 'true');
      card.removeAttribute('data-ff-allow');
      return { action: 'HIDE', reason: 'Shorts content' };
    } else {
      card.removeAttribute('data-ff-is-short');
    }

    // Title and Channel text for keyword evaluation
    const combinedText = `${title} ${channel.name} ${metadata.bylineText || ''} ${metadata.snippet || ''}`.toLowerCase();

    // -----------------------------------------------------------------------
    // RULE 4: Custom Blocked Keywords
    // HIDE if title or channel matches user-added keyword
    // (case-insensitive, word-boundary regex \b).
    // -----------------------------------------------------------------------
    if (config.blockedKeywords && config.blockedKeywords.length > 0) {
      for (const item of config.blockedKeywords) {
        if (!isRuleEnabled(item)) continue;
        const kw = getRuleTarget(item);
        if (!kw || !kw.trim()) continue;
        const regex = getWordBoundaryRegex(kw.trim());
        if (regex && regex.test(combinedText)) {
          return { action: 'HIDE', reason: `Custom Blocked Keyword: "${kw}"` };
        }
      }
    }

    // -----------------------------------------------------------------------
    // RULE 5: Field Filter (3-State per Field: Off | Allow | Block)
    // Evaluated via standalone classifyVideo function (with full card metadata)
    // -----------------------------------------------------------------------
    if (config.fields) {
      const classification = classifyVideo(title, channel.name, config.fields, metadata);
      return {
        action: classification.action,
        reason: classification.reason
      };
    }

    // Default: Show
    return { action: 'SHOW', reason: 'Default show' };
  }

  /**
   * Scans and filters video cards on the page.
   * Uses data-ff-checked attribute to avoid redundant re-processing during scrolling.
   *
   * @param {boolean} forceRecheck - If true, re-evaluates all cards regardless of data-ff-checked
   */
  function filterAllCards(forceRecheck = false) {
    if (!config.enabled) {
      // If disabled, reveal any previously hidden cards
      const hiddenCards = document.querySelectorAll('[data-ff-hidden="true"], [data-ff-is-short="true"], [data-ff-allow="true"]');
      hiddenCards.forEach(c => {
        c.removeAttribute('data-ff-hidden');
        c.removeAttribute('data-ff-is-short');
        c.removeAttribute('data-ff-allow');
      });
      removeEmptyFeedGuard();
      lastEvaluatedStats = { hiddenCount: 0, visibleCount: 0, totalCards: 0 };
      return;
    }

    // Select candidate cards
    const cards = document.querySelectorAll(SELECTORS.videoCards);
    let hiddenCount = 0;
    let visibleCount = 0;
    let totalCards = 0;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];

      // Never touch main player
      if (isMainPlayerElement(card)) continue;

      // Avoid double-processing inner view models when an outer container exists
      if (
        card.tagName.toLowerCase() === 'yt-lockup-view-model' &&
        card.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer')
      ) {
        continue;
      }

      totalCards++;

      // If already evaluated and not forced, count existing state and skip
      if (!forceRecheck && card.dataset.ffChecked === 'true') {
        if (card.dataset.ffHidden === 'true' || card.dataset.ffIsShort === 'true') {
          hiddenCount++;
        } else {
          visibleCount++;
        }
        continue;
      }

      const metadata = extractCardMetadata(card);
      const { title, channel } = metadata;

      // Has YouTube populated the card's channel / byline / handle info?
      const hasChannelInfo = Boolean(
        (channel && channel.name && channel.name.trim()) ||
        (channel && channel.handle && channel.handle.trim()) ||
        (metadata.bylineText && metadata.bylineText.trim()) ||
        (metadata.allHandles && metadata.allHandles.length > 0) ||
        (metadata.allHrefs && metadata.allHrefs.length > 0)
      );

      // CRITICAL HYDRATION GUARD: If neither title nor channel info is ready yet,
      // the card is still hydrating in YouTube's Polymer/DOM.
      // Do NOT mark as permanently checked, so that as soon as YouTube injects the
      // channel/byline/handle, the card will be evaluated with full channel metadata!
      if (!title || !hasChannelInfo) {
        if (title || metadata.isShort) {
          const prelimDecision = evaluateCard(card, metadata);
          if (prelimDecision.action === 'HIDE') {
            card.setAttribute('data-ff-hidden', 'true');
            card.setAttribute('data-ff-filter-reason', prelimDecision.reason);
            hiddenCount++;
          }
        }
        continue;
      }

      // Mark as fully checked only when BOTH title and channel metadata are present!
      card.setAttribute('data-ff-checked', 'true');

      // Evaluate card against strict precedence
      const decision = evaluateCard(card, metadata);

      if (decision.action === 'HIDE') {
        card.setAttribute('data-ff-hidden', 'true');
        card.setAttribute('data-ff-filter-reason', decision.reason);
        card.removeAttribute('data-ff-allow');
        hiddenCount++;
      } else {
        card.removeAttribute('data-ff-hidden');
        card.removeAttribute('data-ff-filter-reason');
        if (decision.isAlwaysAllow) {
          card.setAttribute('data-ff-allow', 'true');
          card.removeAttribute('data-ff-is-short');
        } else {
          card.removeAttribute('data-ff-allow');
        }
        visibleCount++;
      }
    }

    lastEvaluatedStats = {
      hiddenCount,
      visibleCount,
      totalCards
    };

    // Check Empty Feed Guard
    checkEmptyFeedGuard(hiddenCount, visibleCount);
  }

  // =========================================================================
  // 6. Empty Feed Guard Banner (Home Page Notification)
  // =========================================================================

  /**
   * If 20+ cards are hidden on Home while fewer than 4 remain visible,
   * shows a dismissible top banner so the page does not look broken.
   */
  function checkEmptyFeedGuard(hiddenCount, visibleCount) {
    const isHome = window.location.pathname === '/' || window.location.pathname === '';
    if (!isHome || feedBannerDismissed) {
      removeEmptyFeedGuard();
      return;
    }

    if (hiddenCount >= 20 && visibleCount < 4) {
      renderEmptyFeedGuard(hiddenCount, visibleCount);
    } else {
      removeEmptyFeedGuard();
    }
  }

  /**
   * Renders the Empty Feed Guard banner at the top of the feed.
   */
  function renderEmptyFeedGuard(hiddenCount, visibleCount) {
    if (document.getElementById('focusfeed-empty-guard')) {
      // Update counts if banner already exists
      const countEl = document.querySelector('#focusfeed-empty-guard .ff-hidden-count');
      if (countEl) countEl.textContent = hiddenCount;
      const visEl = document.querySelector('#focusfeed-empty-guard .ff-visible-count');
      if (visEl) visEl.textContent = visibleCount;
      return;
    }

    const banner = document.createElement('div');
    banner.id = 'focusfeed-empty-guard';
    banner.innerHTML = `
      <div class="ff-guard-content">
        <div class="ff-guard-icon">🎯</div>
        <div class="ff-guard-text">
          <strong>FocusFeed:</strong> Filtered <span class="ff-count-highlight ff-hidden-count">${hiddenCount}</span> videos on your Home feed based on active rules (<span class="ff-visible-count">${visibleCount}</span> visible).
        </div>
      </div>
      <div class="ff-guard-actions">
        <button id="ff-guard-dismiss-btn" class="ff-guard-dismiss-btn">Dismiss</button>
        <button id="ff-guard-close-btn" class="ff-guard-close-btn" title="Close banner">&times;</button>
      </div>
    `;

    // Attach dismissal listeners
    banner.querySelector('#ff-guard-dismiss-btn').addEventListener('click', () => {
      feedBannerDismissed = true;
      removeEmptyFeedGuard();
    });

    banner.querySelector('#ff-guard-close-btn').addEventListener('click', () => {
      feedBannerDismissed = true;
      removeEmptyFeedGuard();
    });

    // Insertion target: rich-grid contents or primary feed
    const container = document.querySelector(SELECTORS.feedContainer) ||
                      document.querySelector(SELECTORS.primaryContent) ||
                      document.body;

    if (container) {
      container.insertBefore(banner, container.firstChild);
    }
  }

  function removeEmptyFeedGuard() {
    const existing = document.getElementById('focusfeed-empty-guard');
    if (existing) {
      existing.remove();
    }
  }

  // =========================================================================
  // 7. Debounced MutationObserver & SPA Event Handlers
  // =========================================================================

  /**
   * Schedules a debounced filtering run (150ms) to process dynamically appended
   * cards without scroll lag.
   */
  function scheduleCardFilter(forceRecheck = false) {
    if (mutationTimeout) {
      clearTimeout(mutationTimeout);
    }
    mutationTimeout = setTimeout(() => {
      filterAllCards(forceRecheck);
    }, 150);
  }

  /**
   * Observes dynamic DOM mutations as user scrolls or navigates.
   */
  const observer = new MutationObserver((mutations) => {
    // Check if new cards were added OR if cards were hydrated with channel/byline/titles
    let hasRelevantNodes = false;
    for (let i = 0; i < mutations.length; i++) {
      const added = mutations[i].addedNodes;
      if (added && added.length > 0) {
        for (let j = 0; j < added.length; j++) {
          const node = added[j];
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (
              node.matches &&
              (node.matches(SELECTORS.videoCards) ||
               node.matches(SELECTORS.shortsShelves) ||
               node.matches('ytd-channel-name, #channel-name, #byline-container, yt-formatted-string, a[href*="/@"], a[href*="/channel/"], a#avatar-link') ||
               node.querySelector(SELECTORS.videoCards) ||
               node.querySelector('ytd-channel-name, #channel-name, a[href*="/@"], a#avatar-link'))
            ) {
              hasRelevantNodes = true;
              break;
            }
          } else if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim()) {
            // Text node inserted (e.g. channel name text populated inside ytd-channel-name)
            hasRelevantNodes = true;
            break;
          }
        }
      }
      if (hasRelevantNodes) break;
    }

    if (hasRelevantNodes) {
      scheduleCardFilter(false);
    }
  });

  /**
   * Handles YouTube SPA Navigation lifecycle.
   */
  function handleSpaNavigation() {
    checkShortsRedirect(config);
    updatePageContextClasses();
    updateSearchOnlyPlaceholder(config);
    // Reset banner dismissal when navigating to new page
    feedBannerDismissed = false;
    // Force recheck on new page navigation
    scheduleCardFilter(true);
  }

  // =========================================================================
  // 8. YouTube Video Ad Skip & Fast-Forward Engine
  // =========================================================================
  let wasMutedByAdEngine = false;

  function processAdPlayback() {
    if (!config.enabled) return;
    try {
      // Detect player and active video element
      const player = document.getElementById('movie_player');
      const video = player ? player.querySelector('video') : document.querySelector('video.html5-main-video');
      if (!player || !video) return;

      // Check if an ad is currently playing on YouTube
      const isAdShowing = player.classList.contains('ad-showing') ||
                          player.classList.contains('ad-interrupting') ||
                          Boolean(document.querySelector('.video-ads.ytp-ad-module:not(:empty)'));

      if (isAdShowing) {
        // 1. Auto-Skip Feature
        if (config.adSkip) {
          // Try clicking YouTube's native skip button if available
          const skipBtn = document.querySelector(
            '.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button, button.ytp-ad-skip-button-text, [id^="skip-button:"] button, .ytp-ad-skip-button-slot button'
          );
          if (skipBtn) {
            skipBtn.click();
          } else if (isFinite(video.duration) && video.duration > 0 && video.currentTime < video.duration - 0.1) {
            // Seek to completion to trigger YouTube's ad completion event
            video.currentTime = video.duration - 0.05;
          }
        }

        // 2. Fast-Forward Acceleration Fallback Feature
        if (config.adFastForward) {
          const targetRate = parseFloat(config.adFastForwardRate) || 4;
          if (video.playbackRate !== targetRate) {
            if (!wasMutedByAdEngine) {
              wasMutedByAdEngine = !video.muted;
              video.muted = true; // Mute high-speed ad audio
            }
            video.playbackRate = targetRate;
          }
        }
      } else {
        // Ad is no longer playing: restore audio and normal playback rate
        if (wasMutedByAdEngine) {
          video.muted = false;
          wasMutedByAdEngine = false;
        }
        if (video.playbackRate > 2.0 && config.adFastForward) {
          video.playbackRate = 1.0;
        }
      }
    } catch (_) {}
  }

  // =========================================================================
  // 9. Storage & Runtime Messaging Listeners
  // =========================================================================

  // Listen to storage changes to re-evaluate immediately without reloading
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;

    chrome.storage.local.get(DEFAULT_CONFIG, (stored) => {
      config = Object.assign({}, DEFAULT_CONFIG, stored);
      if (config.fields && typeof config.fields === 'object') {
        for (const [id, defaultField] of Object.entries(DEFAULT_FIELDS)) {
          if (!config.fields[id]) config.fields[id] = defaultField;
        }
      }
      applyLayer1Classes(config);
      checkShortsRedirect(config);
      // Re-evaluate all visible/checked cards immediately
      filterAllCards(true);
    });
  });

  // Listen for messages from popup (e.g. requesting live statistics)
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request && request.action === 'GET_STATS') {
      sendResponse({
        hiddenCount: lastEvaluatedStats.hiddenCount,
        visibleCount: lastEvaluatedStats.visibleCount,
        totalCards: lastEvaluatedStats.totalCards,
        url: window.location.href
      });
    }
    return true;
  });

  // =========================================================================
  // 9. Initialization (Runs at document_start)
  // =========================================================================

  function initialize() {
    // 1. Initial Storage Retrieval
    chrome.storage.local.get(DEFAULT_CONFIG, (stored) => {
      config = Object.assign({}, DEFAULT_CONFIG, stored);
      if (config.fields && typeof config.fields === 'object') {
        for (const [id, defaultField] of Object.entries(DEFAULT_FIELDS)) {
          if (!config.fields[id]) config.fields[id] = defaultField;
        }
      }

      // Apply Layer 1 toggles immediately on document.documentElement
      applyLayer1Classes(config);

      // Check Shorts URL redirect
      checkShortsRedirect(config);

      // Start observing DOM mutations
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });

      // Filter cards when DOM content is loaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => filterAllCards(true));
      } else {
        filterAllCards(true);
      }

      // Start continuous background ad detection and skip/fast-forward processing
      setInterval(processAdPlayback, 250);
    });

    // 2. Attach SPA Navigation Listeners (YouTube Custom Events)
    window.addEventListener('yt-navigate-start', () => {
      checkShortsRedirect(config);
    });
    window.addEventListener('yt-navigate-finish', handleSpaNavigation);
    window.addEventListener('popstate', handleSpaNavigation);
  }

  // Execute initialization
  initialize();

})();
