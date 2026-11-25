/**
 * FocusFeed Android - Content Engine (content-android.js)
 * Real-time YouTube filter engine supporting both m.youtube.com (mobile) & youtube.com (desktop).
 */

(function () {
  'use strict';

  if (window.__ffContentEngineLoaded) return;
  window.__ffContentEngineLoaded = true;

  // =========================================================================
  // 1. Centralized YouTube DOM Selectors (Mobile ytm-* & Desktop ytd-*)
  // =========================================================================
  const SELECTORS = {
    feedContainer: [
      'ytd-rich-grid-renderer #contents',
      '#contents.ytd-rich-grid-renderer',
      '#contents.ytd-section-list-renderer',
      'ytd-rich-grid-renderer',
      'ytm-rich-grid-renderer .rich-grid-renderer-contents',
      'ytm-section-list-renderer > .section-list-renderer-contents',
      'ytm-rich-grid-renderer'
    ].join(', '),

    primaryContent: '#primary, #content, ytd-page-manager, ytm-browse, ytm-app',

    videoCards: [
      'ytd-rich-item-renderer',
      'ytd-video-renderer',
      'ytd-compact-video-renderer',
      'ytd-grid-video-renderer',
      'yt-lockup-view-model',
      'ytm-rich-item-renderer',
      'ytm-video-with-context-renderer',
      'ytm-compact-video-renderer',
      'ytm-grid-video-renderer',
      'ytm-reel-item-renderer',
      'ytm-shorts-lockup-view-model',
      'ytm-shorts-lockup-view-model-v2'
    ].join(', '),

    shortsShelves: [
      'ytd-reel-shelf-renderer',
      'ytd-rich-shelf-renderer[is-shorts]',
      'ytd-reel-item-renderer',
      'ytm-reel-shelf-renderer',
      'ytm-rich-section-renderer:has(ytm-reel-shelf-renderer)',
      'ytm-reel-item-renderer',
      'ytm-shorts-lockup-view-model',
      'ytm-shorts-lockup-view-model-v2'
    ].join(', '),

    shortsLink: 'a[href*="/shorts/"]',

    cardTitle: [
      '#video-title',
      '#video-title-link',
      'a#video-title',
      'span#video-title',
      'yt-formatted-string#video-title',
      'h3.ytd-compact-video-renderer #video-title',
      '.yt-lockup-metadata-view-model__title',
      '.yt-lockup-view-model__title',
      '.media-item-headline',
      'h3.media-item-headline',
      'h4.compact-media-item-headline',
      '.compact-media-item-headline',
      'h3 a#video-title',
      'h3 a',
      'h3',
      'h4'
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
      'a.yt-core-attributed-string__link',
      'ytm-badge-and-byline-renderer .ytm-badge-and-byline-item-byline:first-child',
      '.subhead .ytm-badge-and-byline-item-byline:first-child',
      '.compact-media-item-byline'
    ].join(', '),

    mainPlayer: [
      '#movie_player',
      '#player',
      '#player-container',
      'ytd-watch-flexy #player-container',
      '#player-container-outer',
      'ytd-player',
      'ytm-player',
      '#player-control-overlay'
    ].join(', ')
  };

  // =========================================================================
  // 2. State & Configuration
  // =========================================================================
  let config = Object.assign({}, DEFAULT_CONFIG);
  let mutationTimeout = null;
  let feedBannerDismissed = false;
  let lastEvaluatedStats = {
    hiddenCount: 0,
    visibleCount: 0,
    totalCards: 0
  };

  function reportStatsToAndroid() {
    try {
      if (window.FocusFeedAndroid && typeof window.FocusFeedAndroid.updateStats === 'function') {
        window.FocusFeedAndroid.updateStats(
          lastEvaluatedStats.hiddenCount,
          lastEvaluatedStats.visibleCount,
          lastEvaluatedStats.totalCards,
          window.location.href
        );
      }
    } catch (_) {}
  }

  // =========================================================================
  // 3. Layer 1: Hard UI & Format Toggles (CSS-First)
  // =========================================================================
  function applyLayer1Classes(cfg) {
    const docEl = document.documentElement;
    if (!docEl) return;

    if (cfg.enabled) {
      docEl.classList.add('ff-enabled');
      docEl.classList.toggle('ff-block-shorts', Boolean(cfg.blockShorts));
      docEl.classList.toggle('ff-only-search', Boolean(cfg.onlySearch));
      docEl.classList.toggle('ff-block-watch-suggestions', Boolean(cfg.blockWatchSuggestions));
      docEl.classList.toggle('ff-block-comments', Boolean(cfg.blockComments));
    } else {
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

  function updatePageContextClasses() {
    const docEl = document.documentElement;
    if (!docEl) return;
    const isHomePage = (window.location.pathname === '/' || window.location.pathname === '') &&
                       !window.location.search.includes('v=');
    const isWatchPage = window.location.pathname === '/watch' || window.location.search.includes('v=');

    docEl.classList.toggle('ff-is-home-page', isHomePage);
    docEl.classList.toggle('ff-is-watch-page', isWatchPage);
  }

  function updateSearchOnlyPlaceholder(cfg) {
    const existing = document.getElementById('ff-only-search-container');
    const isHomePage = (window.location.pathname === '/' || window.location.pathname === '') &&
                       !window.location.search.includes('v=');

    if (cfg && cfg.enabled && cfg.onlySearch && isHomePage) {
      if (!existing) {
        const homeContainer = document.querySelector(
          'ytm-browse[tab-identifier="FEwhat_to_watch"], ytm-browse, ytd-browse[page-subtype="home"] #primary, ytd-browse[page-subtype="home"], #primary'
        );
        if (homeContainer) {
          const box = document.createElement('div');
          box.id = 'ff-only-search-container';
          box.className = 'ff-only-search-container';
          box.innerHTML = `
            <div class="ff-only-search-icon">🔍</div>
            <h2 class="ff-only-search-title">Search Only Mode</h2>
            <p class="ff-only-search-desc">Home feed is hidden to eliminate mindless browsing. Use the search icon above to find content with intention.</p>
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

  function isCurrentShortAllowed(cfg) {
    if (!cfg || !cfg.alwaysAllowChannels || !cfg.alwaysAllowChannels.length) return false;

    const channelSelectors = [
      'ytd-reel-video-renderer[is-active] ytd-reel-player-header-renderer ytd-channel-name a',
      'ytd-reel-video-renderer[is-active] a.yt-simple-endpoint[href*="/@"]',
      'ytm-reel-player-overlay-renderer a[href*="/@"]',
      'ytm-reel-player-header-renderer a[href*="/@"]',
      '.reel-player-header-renderer a[href*="/@"]',
      '.reel-player-header-renderer a[href*="/channel/"]',
      'reel-player-header-renderer a'
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

    if (cfg.blockedChannels && cfg.blockedChannels.length) {
      for (const blocked of cfg.blockedChannels) {
        if (matchesChannelRule(blocked, foundChannel)) return false;
      }
    }

    for (const allowed of cfg.alwaysAllowChannels) {
      if (matchesChannelRule(allowed, foundChannel)) return true;
    }

    return false;
  }

  let shortsRedirectTimer = null;

  function checkShortsRedirect(cfg) {
    if (!cfg.enabled || !cfg.blockShorts) return;

    const pathname = window.location.pathname || '';
    if (!pathname.startsWith('/shorts/') && pathname !== '/shorts') {
      if (shortsRedirectTimer) clearInterval(shortsRedirectTimer);
      return;
    }

    const baseHome = window.location.origin + '/';
    if (pathname === '/shorts' || pathname === '/shorts/') {
      window.location.replace(baseHome);
      return;
    }

    if (isCurrentShortAllowed(cfg)) return;

    let checks = 0;
    if (shortsRedirectTimer) clearInterval(shortsRedirectTimer);

    shortsRedirectTimer = setInterval(() => {
      checks++;
      if (isCurrentShortAllowed(cfg)) {
        clearInterval(shortsRedirectTimer);
        return;
      }

      const reelHeader = document.querySelector(
        'ytd-reel-video-renderer[is-active] ytd-reel-player-header-renderer, ytm-reel-player-header-renderer, .reel-player-header-renderer'
      );

      if (reelHeader || checks >= 8) {
        clearInterval(shortsRedirectTimer);
        if (!isCurrentShortAllowed(cfg)) {
          window.location.replace(baseHome);
        }
      }
    }, 100);
  }

  // =========================================================================
  // 4. Metadata Extraction from Mobile & Desktop Video Cards
  // =========================================================================
  function isMetricText(str) {
    const s = (str || '').trim().toLowerCase();
    return /^[\d.,]+[kmb]?\s+views?$/i.test(s) ||
      /^\d+\s+(second|minute|hour|day|week|month|year)s?\s+ago$/i.test(s) ||
      /^\d+:\d+$/.test(s);
  }

  function extractCardMetadata(card) {
    const titleEl = card.querySelector(SELECTORS.cardTitle);
    const title = (
      (titleEl && (titleEl.textContent || titleEl.getAttribute('title') || titleEl.getAttribute('aria-label'))) ||
      ''
    ).trim();

    // Mobile & Desktop Byline extraction
    const bylineEls = card.querySelectorAll(
      'ytd-channel-name, #channel-name, #byline-container, .yt-lockup-metadata-view-model__subtitle, .yt-lockup-view-model__subtitles, ytm-badge-and-byline-renderer .ytm-badge-and-byline-item-byline:first-child, .subhead .ytm-badge-and-byline-item-byline:first-child'
    );
    let bylineText = '';
    bylineEls.forEach(el => {
      const t = (el.textContent || '').trim();
      if (t && !isMetricText(t) && !bylineText.includes(t)) {
        bylineText += (bylineText ? ' ' : '') + t;
      }
    });

    const channelLinks = card.querySelectorAll(
      'ytd-channel-name a, #channel-name a, #byline-container a, .yt-lockup-metadata-view-model__subtitle a, ytm-channel-thumbnail-with-link-renderer a, a.channel-thumbnail-icon, a.yt-core-attributed-string__link, a[href*="/@"], a[href*="/channel/"], a[href*="/c/"], a[href*="/user/"], a#avatar-link'
    );

    const collaborators = [];
    const allHrefs = [];
    const allHandles = [];

    channelLinks.forEach(linkEl => {
      const href = (linkEl.getAttribute('href') || linkEl.href || '').trim();
      let name = (linkEl.textContent || linkEl.getAttribute('title') || linkEl.getAttribute('aria-label') || '').trim();
      if (isMetricText(name)) name = '';

      let handle = '';
      if (href.includes('/@')) {
        const idx = href.indexOf('/@');
        handle = href.substring(idx + 1).split('/')[0].split('?')[0].toLowerCase();
        if (!handle.startsWith('@')) handle = '@' + handle;
      }

      if (!name && handle) {
        name = handle.replace(/^@/, '');
      }

      if (href && !allHrefs.includes(href)) allHrefs.push(href);
      if (handle && !allHandles.includes(handle)) allHandles.push(handle);

      if (name || href || handle) {
        const exists = collaborators.some(c => (c.name === name && c.href === href) || (c.handle && c.handle === handle));
        if (!exists) {
          collaborators.push({ name, href, handle });
        }
      }
    });

    const namedCollab = collaborators.find(c => c.name && c.name.trim() && !c.name.startsWith('@'));
    const handledCollab = collaborators.find(c => c.handle && c.handle.trim());
    const hrefCollab = collaborators.find(c => c.href && c.href.trim());
    const fallbackChannelEl = card.querySelector(SELECTORS.channelName);
    const rawFallback = (fallbackChannelEl ? fallbackChannelEl.textContent || '' : '').trim();
    const fallbackName = isMetricText(rawFallback) ? '' : rawFallback;

    const primaryName = (namedCollab ? namedCollab.name : (fallbackName || (handledCollab ? handledCollab.handle.replace(/^@/, '') : (bylineText || '')))).trim();
    const primaryHandle = (handledCollab ? handledCollab.handle : (primaryName ? '@' + primaryName.replace(/\s+/g, '').toLowerCase() : ''));
    const primaryHref = (hrefCollab ? hrefCollab.href : (primaryHandle ? '/' + primaryHandle : ''));

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

    const snippetEl = card.querySelector('#description-text, .yt-lockup-metadata-view-model__description, .metadata-snippet-container, ytd-video-meta-block');
    const snippet = (snippetEl ? snippetEl.textContent || '' : '').trim();

    let isShort = false;
    try {
      const shortsAnchor = card.querySelector(SELECTORS.shortsLink);
      const isShortUrl = shortsAnchor && (
        (shortsAnchor.getAttribute('href') || '').includes('/shorts/') ||
        (shortsAnchor.href || '').includes('/shorts/')
      );
      const isReelShelf = Boolean(
        card.closest('ytd-reel-shelf-renderer, ytm-reel-shelf-renderer') ||
        card.closest('ytd-rich-shelf-renderer[is-shorts]') ||
        card.closest('ytd-reel-item-renderer, ytm-reel-item-renderer, ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2')
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

  function isMainPlayerElement(el) {
    if (!el) return false;
    return Boolean(el.closest(SELECTORS.mainPlayer));
  }

  // =========================================================================
  // 5. Layer 2: Video Card Filtering (Strict Top-Down Precedence)
  // =========================================================================
  function evaluateCard(card, passedMetadata = null) {
    if (isMainPlayerElement(card)) {
      return { action: 'SHOW', reason: 'Main player' };
    }

    const metadata = passedMetadata || extractCardMetadata(card);
    const { title, channel, isShort } = metadata;

    if (!title && !channel.name && !metadata.bylineText) {
      return { action: 'SHOW', reason: 'Unhydrated card' };
    }

    // RULE 1: Blocked Channels & Collaborations
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

    // RULE 2: Always-Allow Channels (Supreme Override)
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

    // RULE 3: Shorts Blocker
    if (config.blockShorts && isShort) {
      card.setAttribute('data-ff-is-short', 'true');
      card.removeAttribute('data-ff-allow');
      return { action: 'HIDE', reason: 'Shorts content' };
    } else {
      card.removeAttribute('data-ff-is-short');
    }

    const combinedText = `${title} ${channel.name} ${metadata.bylineText || ''} ${metadata.snippet || ''}`.toLowerCase();

    // RULE 4: Custom Blocked Keywords
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

    // RULE 5: Field Filter (3-State per Field with full card metadata)
    if (config.fields) {
      const classification = classifyVideo(title, channel.name, config.fields, metadata);
      return {
        action: classification.action,
        reason: classification.reason
      };
    }

    return { action: 'SHOW', reason: 'Default show' };
  }

  function filterAllCards(forceRecheck = false) {
    if (!config.enabled) {
      const hiddenCards = document.querySelectorAll('[data-ff-hidden="true"], [data-ff-is-short="true"], [data-ff-allow="true"]');
      hiddenCards.forEach(c => {
        c.removeAttribute('data-ff-hidden');
        c.removeAttribute('data-ff-is-short');
        c.removeAttribute('data-ff-allow');
      });
      removeEmptyFeedGuard();
      lastEvaluatedStats = { hiddenCount: 0, visibleCount: 0, totalCards: 0 };
      reportStatsToAndroid();
      return;
    }

    const cards = document.querySelectorAll(SELECTORS.videoCards);
    let hiddenCount = 0;
    let visibleCount = 0;
    let totalCards = 0;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (isMainPlayerElement(card)) continue;

      if (
        card.tagName.toLowerCase() === 'yt-lockup-view-model' &&
        card.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytm-rich-item-renderer, ytm-video-with-context-renderer')
      ) {
        continue;
      }

      totalCards++;

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

      const hasChannelInfo = Boolean(
        (channel && channel.name && channel.name.trim()) ||
        (channel && channel.handle && channel.handle.trim()) ||
        (metadata.bylineText && metadata.bylineText.trim()) ||
        (metadata.allHandles && metadata.allHandles.length > 0) ||
        (metadata.allHrefs && metadata.allHrefs.length > 0)
      );

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

      card.setAttribute('data-ff-checked', 'true');

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
    reportStatsToAndroid();
    checkEmptyFeedGuard(hiddenCount, visibleCount);
  }

  // =========================================================================
  // 6. Empty Feed Guard Banner
  // =========================================================================
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

  function renderEmptyFeedGuard(hiddenCount, visibleCount) {
    if (document.getElementById('focusfeed-empty-guard')) {
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
          <strong>FocusFeed:</strong> Filtered <span class="ff-count-highlight ff-hidden-count">${hiddenCount}</span> videos (<span class="ff-visible-count">${visibleCount}</span> visible).
        </div>
      </div>
      <div class="ff-guard-actions">
        <button id="ff-guard-dismiss-btn" class="ff-guard-dismiss-btn">Dismiss</button>
        <button id="ff-guard-close-btn" class="ff-guard-close-btn">&times;</button>
      </div>
    `;

    banner.querySelector('#ff-guard-dismiss-btn').addEventListener('click', () => {
      feedBannerDismissed = true;
      removeEmptyFeedGuard();
    });
    banner.querySelector('#ff-guard-close-btn').addEventListener('click', () => {
      feedBannerDismissed = true;
      removeEmptyFeedGuard();
    });

    const container = document.querySelector(SELECTORS.feedContainer) ||
                      document.querySelector(SELECTORS.primaryContent) ||
                      document.body;
    if (container) {
      container.insertBefore(banner, container.firstChild);
    }
  }

  function removeEmptyFeedGuard() {
    const existing = document.getElementById('focusfeed-empty-guard');
    if (existing) existing.remove();
  }

  // =========================================================================
  // 7. Debounced MutationObserver & Mobile/Desktop SPA Navigation
  // =========================================================================
  function scheduleCardFilter(forceRecheck = false) {
    if (mutationTimeout) clearTimeout(mutationTimeout);
    mutationTimeout = setTimeout(() => {
      filterAllCards(forceRecheck);
    }, 150);
  }

  const observer = new MutationObserver((mutations) => {
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
               node.matches('ytd-channel-name, #channel-name, #byline-container, ytm-badge-and-byline-renderer, yt-formatted-string, a[href*="/@"], a[href*="/channel/"], a#avatar-link') ||
               node.querySelector(SELECTORS.videoCards) ||
               node.querySelector('ytd-channel-name, #channel-name, ytm-badge-and-byline-renderer, a[href*="/@"], a#avatar-link'))
            ) {
              hasRelevantNodes = true;
              break;
            }
          } else if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim()) {
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

  function handleSpaNavigation() {
    checkShortsRedirect(config);
    updatePageContextClasses();
    updateSearchOnlyPlaceholder(config);
    feedBannerDismissed = false;
    scheduleCardFilter(true);
  }

  // Wrap history methods to reliably catch mobile YouTube (m.youtube.com) SPA route transitions
  const origPushState = history.pushState;
  history.pushState = function () {
    const ret = origPushState.apply(this, arguments);
    handleSpaNavigation();
    return ret;
  };
  const origReplaceState = history.replaceState;
  history.replaceState = function () {
    const ret = origReplaceState.apply(this, arguments);
    handleSpaNavigation();
    return ret;
  };

  // =========================================================================
  // 8. YouTube Video Ad Skip & Fast-Forward Engine
  // =========================================================================
  let wasMutedByAdEngine = false;

  function processAdPlayback() {
    if (!config.enabled) return;
    try {
      const player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
      const video = player ? player.querySelector('video') : document.querySelector('video.html5-main-video, video');
      if (!player || !video) return;

      const isAdShowing = player.classList.contains('ad-showing') ||
                          player.classList.contains('ad-interrupting') ||
                          Boolean(document.querySelector('.video-ads.ytp-ad-module:not(:empty)'));

      if (isAdShowing) {
        if (config.adSkip) {
          const skipBtn = document.querySelector(
            '.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button, button.ytp-ad-skip-button-text, [id^="skip-button:"] button, .ytp-ad-skip-button-slot button'
          );
          if (skipBtn) {
            skipBtn.click();
          } else if (isFinite(video.duration) && video.duration > 0 && video.currentTime < video.duration - 0.1) {
            video.currentTime = video.duration - 0.05;
          }
        }

        if (config.adFastForward) {
          const targetRate = parseFloat(config.adFastForwardRate) || 4;
          if (video.playbackRate !== targetRate) {
            if (!wasMutedByAdEngine) {
              wasMutedByAdEngine = !video.muted;
              video.muted = true;
            }
            video.playbackRate = targetRate;
          }
        }
      } else {
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
  // 9. Config Sync & Android Reload Hook
  // =========================================================================
  function loadAndApplyConfig(forceRecheckCards) {
    chrome.storage.local.get(DEFAULT_CONFIG, (stored) => {
      config = Object.assign({}, DEFAULT_CONFIG, stored || {});
      if (config.fields && typeof config.fields === 'object') {
        for (const [id, defaultField] of Object.entries(DEFAULT_FIELDS)) {
          if (!config.fields[id]) config.fields[id] = defaultField;
        }
      }
      applyLayer1Classes(config);
      checkShortsRedirect(config);
      filterAllCards(Boolean(forceRecheckCards));
    });
  }

  window.__ffReloadConfig = function () {
    loadAndApplyConfig(true);
  };

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    loadAndApplyConfig(true);
  });

  function initialize() {
    loadAndApplyConfig(true);

    if (document.documentElement) {
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        applyLayer1Classes(config);
        filterAllCards(true);
      });
    }

    setInterval(processAdPlayback, 250);

    window.addEventListener('yt-navigate-start', () => checkShortsRedirect(config));
    window.addEventListener('state-navigatestart', () => checkShortsRedirect(config));
    window.addEventListener('yt-navigate-finish', handleSpaNavigation);
    window.addEventListener('state-navigatefinish', handleSpaNavigation);
    window.addEventListener('popstate', handleSpaNavigation);
  }

  initialize();

})();
