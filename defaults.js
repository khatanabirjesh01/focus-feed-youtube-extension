/**
 * FocusFeed - Defaults & Utility Engine
 * Shared across Content Scripts (content.js) and Popup (popup.js)
 */

// 1. Predefined Topic Fields with Rich Built-in Keywords
const DEFAULT_FIELDS = {
  science: {
    id: 'science',
    name: 'Science',
    state: 'off', // 'off' | 'allow' | 'block'
    isCustom: false,
    keywords: [
      'science', 'physics', 'quantum', 'biology', 'chemistry', 'astronomy',
      'astrophysics', 'nasa', 'spacex', 'genetics', 'evolution', 'neuroscience',
      'laboratory', 'microbiology', 'geology', 'paleontology', 'scientific',
      'cosmos', 'black hole', 'relativity', 'scientist', 'scientific research'
    ]
  },
  technology: {
    id: 'technology',
    name: 'Technology',
    state: 'off',
    isCustom: false,
    keywords: [
      'technology', 'tech', 'programming', 'software', 'hardware', 'coding',
      'developer', 'python', 'javascript', 'ai', 'artificial intelligence',
      'machine learning', 'cybersecurity', 'linux', 'apple', 'android',
      'gadget', 'computer', 'web development', 'cloud computing', 'devops',
      'robotics', 'frontend', 'backend', 'chatgpt', 'software engineer'
    ]
  },
  finance: {
    id: 'finance',
    name: 'Finance',
    state: 'off',
    isCustom: false,
    keywords: [
      'finance', 'investing', 'stocks', 'stock market', 'crypto',
      'cryptocurrency', 'bitcoin', 'ethereum', 'personal finance', 'real estate',
      'economy', 'economics', 'trading', 'passive income', 'dividend',
      'wealth', 'portfolio', 'banking', 'inflation', 'index fund', 'money management'
    ]
  },
  education: {
    id: 'education',
    name: 'Education',
    state: 'off',
    isCustom: false,
    keywords: [
      'education', 'tutorial', 'how to', 'lecture', 'lesson', 'course',
      'learn', 'academy', 'university', 'math', 'mathematics', 'history',
      'philosophy', 'psychology', 'guide', 'crash course', 'documentary',
      'explaining', 'explained', 'study', 'student', 'educational'
    ]
  },
  news_politics: {
    id: 'news_politics',
    name: 'News & Politics',
    state: 'off',
    isCustom: false,
    keywords: [
      'news', 'politics', 'election', 'government', 'president', 'parliament',
      'congress', 'geopolitics', 'democracy', 'policy', 'senate', 'diplomacy',
      'breaking news', 'current affairs', 'journalism', 'press', 'white house',
      'prime minister', 'geopolitical', 'foreign policy'
    ]
  },
  gaming: {
    id: 'gaming',
    name: 'Gaming',
    state: 'off',
    isCustom: false,
    keywords: [
      'gaming', 'gameplay', 'walkthrough', 'playthrough', 'lets play',
      'twitch', 'esports', 'minecraft', 'roblox', 'gta', 'fortnite',
      'valorant', 'playstation', 'xbox', 'nintendo', 'steam', 'speedrun',
      'boss fight', 'gamer', 'rpg', 'fps', 'video game'
    ]
  },
  entertainment: {
    id: 'entertainment',
    name: 'Entertainment',
    state: 'off',
    isCustom: false,
    keywords: [
      'entertainment', 'movie', 'film', 'cinema', 'trailer', 'celebrity',
      'hollywood', 'actor', 'actress', 'drama', 'comedy', 'standup',
      'tv show', 'series', 'interview', 'parody', 'reaction', 'vlog',
      'marvel', 'netflix', 'pop culture'
    ]
  },
  sports: {
    id: 'sports',
    name: 'Sports',
    state: 'off',
    isCustom: false,
    keywords: [
      'sports', 'football', 'soccer', 'basketball', 'nba', 'nfl',
      'premier league', 'champions league', 'tennis', 'cricket', 'baseball',
      'formula 1', 'f1', 'ufc', 'mma', 'boxing', 'athlete', 'highlights',
      'world cup', 'olympics', 'fifa'
    ]
  },
  music: {
    id: 'music',
    name: 'Music',
    state: 'off',
    isCustom: false,
    keywords: [
      'music', 'song', 'track', 'album', 'official audio', 'music video',
      'lyrics', 'remix', 'live concert', 'acoustic', 'guitar', 'piano',
      'hip hop', 'rap', 'rock', 'pop music', 'orchestra', 'beats',
      'singer', 'band', 'soundtrack'
    ]
  },
  fitness: {
    id: 'fitness',
    name: 'Fitness',
    state: 'off',
    isCustom: false,
    keywords: [
      'fitness', 'workout', 'gym', 'bodybuilding', 'exercise', 'muscle',
      'weight loss', 'calisthenics', 'crossfit', 'cardio', 'training',
      'diet', 'nutrition', 'yoga', 'stretching', 'physique', 'hiit',
      'weightlifting', 'abs'
    ]
  },
  motivation_bluff: {
    id: 'motivation_bluff',
    name: 'Motivation Bluff',
    state: 'off',
    isCustom: false,
    keywords: [
      'motivation', 'motivational', 'mindset', 'sigma', 'grind', 'grindset',
      'discipline', 'morning routine', 'success story', 'hustle', 'hustling',
      'millionaire mindset', 'billionaire', 'alpha male', 'motivational speech',
      'manifestation', 'rules for success', 'wake up at 5am', 'andrew tate',
      'david goggins', 'sigma male', 'hard work beats talent', 'motivate yourself'
    ]
  },
  edits: {
    id: 'edits',
    name: 'Edit Videos / Edits',
    state: 'off',
    isCustom: false,
    keywords: [
      'edit', 'edits', 'amv', 'phonk', 'capcut', 'alight motion', 'velocity edit',
      'tiktok edit', 'reels edit', 'after effects', 'anime edit', 'sigma edit',
      'badass edit', 'status video', 'whatsapp status', 'attitude status',
      '4k edit', 'cc edit', 'smooth transition', 'music video edit'
    ]
  },
  vlogs: {
    id: 'vlogs',
    name: 'Vlogs',
    state: 'off',
    isCustom: false,
    keywords: [
      'vlog', 'vlogs', 'vlogging', 'daily vlog', 'day in the life', 'travel vlog',
      'family vlog', 'lifestyle vlog', 'vlogger', 'vlogmas', 'week in my life',
      'couples vlog', 'spend the day with me', 'morning routine vlog', 'grwm vlog'
    ]
  },
  pranks_comedy: {
    id: 'pranks_comedy',
    name: 'Pranks & Comedy',
    state: 'off',
    isCustom: false,
    keywords: [
      'prank', 'pranks', 'pranked', 'comedy', 'funny', 'skit', 'skits',
      'hilarious', 'parody', 'joke', 'jokes', 'stand up', 'standup',
      'laugh', 'meme', 'memes', 'try not to laugh', 'bloopers', 'roast',
      'humor', 'cringe', 'funny moments', 'funny video', 'comedy video'
    ]
  },
  gameplays: {
    id: 'gameplays',
    name: 'Gameplays & Streams',
    state: 'off',
    isCustom: false,
    keywords: [
      'gameplay', 'walkthrough', 'playthrough', 'lets play', 'gaming stream',
      'twitch stream', 'speedrun', 'no commentary', 'boss fight', 'longplay',
      'game review', 'esports', 'live stream', 'streamer', 'full gameplay'
    ]
  },
  food_vlogs: {
    id: 'food_vlogs',
    name: 'Food Vlogs & Mukbang',
    state: 'off',
    isCustom: false,
    keywords: [
      'food vlog', 'food vlogger', 'street food', 'mukbang', 'food review',
      'eating show', 'food challenge', 'restaurant review', 'food tasting',
      'eating challenge', 'asmr eating', 'what i eat in a day', 'recipe vlog',
      'food tour', 'eating food', 'fast food feast', 'foodie vlog'
    ]
  },
  drama_gossip: {
    id: 'drama_gossip',
    name: 'Drama & Gossip',
    state: 'off',
    isCustom: false,
    keywords: [
      'drama', 'exposed', 'cancelling', 'cancelled', 'tea', 'gossip',
      'response video', 'apology video', 'call out', 'beef', 'confronting',
      'drama channel', 'drama alert', 'speaking out', 'the truth about'
    ]
  },
  clickbait_speculation: {
    id: 'clickbait_speculation',
    name: 'Clickbait & Speculation',
    state: 'off',
    isCustom: false,
    keywords: [
      'they dont want you to know', 'they don\'t want you to know', 'secret',
      'conspiracy', 'illuminati', 'shocking truth', 'simulation theory',
      'flat earth', 'ancient aliens', 'hidden truth', 'unsolved mystery',
      'creepy mystery', 'disturbing secret', 'conspiracy theory'
    ]
  },
  reactions: {
    id: 'reactions',
    name: 'Reactions',
    state: 'off',
    isCustom: false,
    keywords: [
      'reaction', 'reacting', 'reacts to', 'reacting to', 'first time hearing',
      'first time watching', 'vocal coach reacts', 'expert reacts', 'non native reacts',
      'parents react', 'streamer reacts', 'shocking reaction', 'reaction video'
    ]
  },
  hauls_consumerism: {
    id: 'hauls_consumerism',
    name: 'Hauls & Unboxing',
    state: 'off',
    isCustom: false,
    keywords: [
      'haul', 'shein haul', 'unboxing', 'shopping haul', 'amazon finds',
      'what i bought', 'pr package', 'spending spree', 'temu haul',
      'zara haul', 'clothing haul', 'tech unboxing', 'product review'
    ]
  }
};

// 2. Default Configuration
const DEFAULT_CONFIG = {
  enabled: true,
  blockShorts: true,
  onlySearch: false,
  blockWatchSuggestions: false,
  blockComments: false,
  adSkip: true,
  adFastForward: false,
  adFastForwardRate: 4,
  activePresetId: null,      // null = Custom / Free Changes mode (not saved to any preset)
  autoSaveToPreset: true,    // auto-save changes to the active preset when one is selected
  alwaysAllowChannels: [],
  blockedChannels: [],
  blockedKeywords: [],
  fields: DEFAULT_FIELDS
};

// 3. Default Presets Library
const DEFAULT_PRESETS = {
  'preset_focus': {
    id: 'preset_focus',
    name: 'Deep Focus & Study',
    description: 'Blocks Shorts, comments, watch suggestions, entertainment, gaming, vlogs, and gossip. Focus on education and science.',
    isBuiltIn: true,
    createdAt: 1700000000000,
    config: {
      enabled: true,
      blockShorts: true,
      onlySearch: false,
      blockWatchSuggestions: true,
      blockComments: true,
      adSkip: true,
      adFastForward: false,
      adFastForwardRate: 4,
      alwaysAllowChannels: [],
      blockedChannels: [],
      blockedKeywords: ['reaction', 'drama', 'gossip', 'tiktok'],
      fields: (() => {
        const fields = JSON.parse(JSON.stringify(DEFAULT_FIELDS));
        if (fields.entertainment) fields.entertainment.state = 'block';
        if (fields.vlogs) fields.vlogs.state = 'block';
        if (fields.pranks_comedy) fields.pranks_comedy.state = 'block';
        if (fields.gaming) fields.gaming.state = 'block';
        if (fields.gameplays) fields.gameplays.state = 'block';
        if (fields.drama_gossip) fields.drama_gossip.state = 'block';
        if (fields.reactions) fields.reactions.state = 'block';
        if (fields.clickbait_speculation) fields.clickbait_speculation.state = 'block';
        if (fields.hauls_consumerism) fields.hauls_consumerism.state = 'block';
        if (fields.education) fields.education.state = 'allow';
        if (fields.science) fields.science.state = 'allow';
        return fields;
      })()
    }
  },
  'preset_minimal_search': {
    id: 'preset_minimal_search',
    name: 'Minimal Search Only',
    description: 'Pure utility: Hides the entire home page feed, watch suggestions, and comments. Distraction-free search bar only.',
    isBuiltIn: true,
    createdAt: 1700000000000,
    config: {
      enabled: true,
      blockShorts: true,
      onlySearch: true,
      blockWatchSuggestions: true,
      blockComments: true,
      adSkip: true,
      adFastForward: false,
      adFastForwardRate: 4,
      alwaysAllowChannels: [],
      blockedChannels: [],
      blockedKeywords: [],
      fields: JSON.parse(JSON.stringify(DEFAULT_FIELDS))
    }
  },
  'preset_casual': {
    id: 'preset_casual',
    name: 'Casual & Balanced',
    description: 'Comfortable browsing: Skips video ads and blocks Shorts, while keeping recommendations, comments, and topics open.',
    isBuiltIn: true,
    createdAt: 1700000000000,
    config: {
      enabled: true,
      blockShorts: true,
      onlySearch: false,
      blockWatchSuggestions: false,
      blockComments: false,
      adSkip: true,
      adFastForward: false,
      adFastForwardRate: 4,
      alwaysAllowChannels: [],
      blockedChannels: [],
      blockedKeywords: [],
      fields: JSON.parse(JSON.stringify(DEFAULT_FIELDS))
    }
  }
};

/**
 * Creates a clean snapshot of configuration properties suitable for a preset.
 */
function extractPresetConfig(cfg) {
  if (!cfg || typeof cfg !== 'object') cfg = DEFAULT_CONFIG;
  return {
    enabled: typeof cfg.enabled === 'boolean' ? cfg.enabled : true,
    blockShorts: typeof cfg.blockShorts === 'boolean' ? cfg.blockShorts : true,
    onlySearch: typeof cfg.onlySearch === 'boolean' ? cfg.onlySearch : false,
    blockWatchSuggestions: typeof cfg.blockWatchSuggestions === 'boolean' ? cfg.blockWatchSuggestions : false,
    blockComments: typeof cfg.blockComments === 'boolean' ? cfg.blockComments : false,
    adSkip: typeof cfg.adSkip === 'boolean' ? cfg.adSkip : true,
    adFastForward: typeof cfg.adFastForward === 'boolean' ? cfg.adFastForward : false,
    adFastForwardRate: parseFloat(cfg.adFastForwardRate) || 4,
    alwaysAllowChannels: Array.isArray(cfg.alwaysAllowChannels) ? JSON.parse(JSON.stringify(cfg.alwaysAllowChannels)) : [],
    blockedChannels: Array.isArray(cfg.blockedChannels) ? JSON.parse(JSON.stringify(cfg.blockedChannels)) : [],
    blockedKeywords: Array.isArray(cfg.blockedKeywords) ? JSON.parse(JSON.stringify(cfg.blockedKeywords)) : [],
    fields: cfg.fields && typeof cfg.fields === 'object' ? JSON.parse(JSON.stringify(cfg.fields)) : JSON.parse(JSON.stringify(DEFAULT_FIELDS))
  };
}

// 4. Utility Functions

/**
 * Escapes regex special characters.
 */
function escapeRegExp(string) {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * In-memory regex cache for high performance during fast DOM scanning.
 */
const _wordRegexCache = new Map();

/**
 * Generates or retrieves a cached word-boundary RegExp for a keyword.
 * Uses intelligent boundary matching so short words (like "ass") don't match "class",
 * while preserving words with punctuation like "C++".
 */
function getWordBoundaryRegex(keyword) {
  const normalized = (keyword || '').trim().toLowerCase();
  if (!normalized) return null;

  if (_wordRegexCache.has(normalized)) {
    return _wordRegexCache.get(normalized);
  }

  const escaped = escapeRegExp(normalized);
  const prefix = /^\w/.test(normalized) ? '\\b' : '';
  const suffix = /\w$/.test(normalized) ? '\\b' : '';
  const regex = new RegExp(`${prefix}${escaped}${suffix}`, 'i');

  _wordRegexCache.set(normalized, regex);
  return regex;
}

/**
 * Normalizes user input for YouTube channels.
 * Supports:
 * - Full URLs: https://www.youtube.com/@handle, https://www.youtube.com/channel/UC..., https://www.youtube.com/c/Name
 * - Handles: @handle or handle
 * - Display Names: Veritasium
 * Returns a standardized lowercase identifier without trailing paths or query params.
 */
function normalizeChannelInput(input) {
  if (!input || typeof input !== 'string') return '';
  let str = input.trim().toLowerCase();

  // Strip protocol and domain if present
  str = str.replace(/^https?:\/\//, '').replace(/^www\./, '');
  str = str.replace(/^(m\.)?youtube\.com\//, '').replace(/^youtu\.be\//, '');
  // Strip query parameters, hashes, and trailing slashes
  str = str.split('?')[0].split('#')[0].replace(/\/+$/, '');

  // If path contains /@handle
  if (str.includes('/@')) {
    str = str.substring(str.indexOf('/@') + 1);
  }
  if (str.startsWith('@')) {
    // If there are subpaths like @handle/videos, strip them
    return str.split('/')[0];
  }

  // If path contains /channel/uc...
  if (str.includes('/channel/')) {
    str = str.substring(str.indexOf('/channel/'));
  }
  if (str.startsWith('channel/')) {
    str = '/' + str;
  }
  if (str.startsWith('/channel/')) {
    const parts = str.split('/');
    return '/' + parts[1] + (parts[2] ? '/' + parts[2] : '');
  }

  // If path contains /c/name
  if (str.includes('/c/')) {
    str = str.substring(str.indexOf('/c/'));
  }
  if (str.startsWith('c/')) {
    str = '/' + str;
  }
  if (str.startsWith('/c/')) {
    const parts = str.split('/');
    return '/' + parts[1] + (parts[2] ? '/' + parts[2] : '');
  }

  // If path contains /user/name
  if (str.includes('/user/')) {
    str = str.substring(str.indexOf('/user/'));
  }
  if (str.startsWith('user/')) {
    str = '/' + str;
  }
  if (str.startsWith('/user/')) {
    const parts = str.split('/');
    return '/' + parts[1] + (parts[2] ? '/' + parts[2] : '');
  }

  // Strip leading slash if any remaining
  str = str.replace(/^\/+/, '');
  // Take first segment if user entered something like veritasium/videos
  str = str.split('/')[0];

  return str;
}

/**
 * Extracts target string from a rule that may be a string or an object { name, enabled }.
 */
function getRuleTarget(rule) {
  if (!rule) return '';
  if (typeof rule === 'string') return rule;
  return (rule.name || rule.value || '');
}

/**
 * Checks whether a rule item is currently enabled (default true).
 */
function isRuleEnabled(rule) {
  if (!rule) return false;
  if (typeof rule === 'string') return true;
  return rule.enabled !== false;
}

/**
 * Checks if two channel inputs refer to the same channel entity,
 * regardless of whether one was entered as @handle, full URL, or plain name.
 */
function isSameChannel(a, b) {
  const normA = normalizeChannelInput(getRuleTarget(a));
  const normB = normalizeChannelInput(getRuleTarget(b));
  if (!normA || !normB) return false;
  if (normA === normB) return true;

  const cleanA = normA.replace(/^@/, '').replace(/^\/channel\//, '').replace(/^\/c\//, '').replace(/^\/user\//, '');
  const cleanB = normB.replace(/^@/, '').replace(/^\/channel\//, '').replace(/^\/c\//, '').replace(/^\/user\//, '');
  return cleanA === cleanB;
}

/**
 * Matches a card's channel metadata against a stored channel rule.
 * Tests against channel name, channel href, and channel handle.
 */
function matchesChannelRule(channelRule, cardChannelInfo) {
  if (!channelRule || !cardChannelInfo) return false;
  if (!isRuleEnabled(channelRule)) return false;
  const target = normalizeChannelInput(getRuleTarget(channelRule));
  if (!target) return false;

  const cardName = (cardChannelInfo.name || '').trim().toLowerCase();
  const cardHref = (cardChannelInfo.href || '').trim().toLowerCase();
  const cardHandle = (cardChannelInfo.handle || '').trim().toLowerCase();

  const isHandle = target.startsWith('@');
  const cleanTarget = target.replace(/^@/, '').replace(/^\/channel\//, '').replace(/^\/c\//, '').replace(/^\/user\//, '').trim();
  const spacelessTarget = cleanTarget.replace(/\s+/g, '');
  const handleTarget = '@' + spacelessTarget;

  // 1. Direct Handle match (@handle)
  if (isHandle) {
    if (cardHandle === target || cardHandle === handleTarget) return true;
    if (cardHref.includes(target) || cardHref.includes('/@' + spacelessTarget)) return true;
    if (cardName === cleanTarget || cardName === spacelessTarget) return true;
  }

  // 2. Channel ID / Path match (/channel/UC... or /c/...)
  if (target.startsWith('/channel/') || target.startsWith('/c/') || target.startsWith('/user/')) {
    if (cardHref.includes(target)) return true;
  }

  // 3. Plain name or handle without @
  if (cardName === cleanTarget || cardName === spacelessTarget) return true;
  if (cardHandle === handleTarget || cardHandle === '@' + cleanTarget) return true;
  if (cardHref.includes('/@' + spacelessTarget) || cardHref.includes('/@' + cleanTarget)) return true;
  if (cardHref.includes('/' + cleanTarget) || cardHref.includes('/' + spacelessTarget)) return true;

  // Exact word boundary test on channel name for plain target
  const nameRegex = getWordBoundaryRegex(cleanTarget);
  if (nameRegex && nameRegex.test(cardName)) {
    return true;
  }

  return false;
}

/**
 * Checks if a channel rule matches a video card across all locations:
 * - Primary channel
 * - Any collaborating creator links/elements
 * - Joint byline / subtitle text (e.g. "PJ Explained and PJ", "Creator A & Creator B")
 * - Video title (e.g. "@handle", "ft. Channel", "with Channel", or multi-word channel name)
 * - Video description / snippet text
 * - All nested channel links / handles on the card
 *
 * @param {string|Object} channelRule - Stored channel rule (string or {name, enabled})
 * @param {Object} cardMetadata - Full metadata extracted by extractCardMetadata(card)
 * @returns {{matched: boolean, location: string}}
 */
function matchesChannelOrCollab(channelRule, cardMetadata) {
  if (!channelRule || !cardMetadata) return { matched: false, location: '' };
  if (!isRuleEnabled(channelRule)) return { matched: false, location: '' };

  const rawTarget = getRuleTarget(channelRule);
  const target = normalizeChannelInput(rawTarget);
  if (!target) return { matched: false, location: '' };

  const isHandle = target.startsWith('@');
  const cleanTarget = target
    .replace(/^@/, '')
    .replace(/^\/channel\//, '')
    .replace(/^\/c\//, '')
    .replace(/^\/user\//, '')
    .trim()
    .toLowerCase();

  if (!cleanTarget) return { matched: false, location: '' };

  const spacelessTarget = cleanTarget.replace(/\s+/g, '');
  const handleTarget = '@' + spacelessTarget;

  // 1. Check Primary Channel
  if (cardMetadata.channel && matchesChannelRule(channelRule, cardMetadata.channel)) {
    return { matched: true, location: 'Primary Channel' };
  }

  // 2. Check All Collaborator Links / Channel Elements
  if (cardMetadata.collaborators && Array.isArray(cardMetadata.collaborators)) {
    for (const collab of cardMetadata.collaborators) {
      if (matchesChannelRule(channelRule, collab)) {
        return { matched: true, location: `Collaborator (${collab.name || collab.handle || 'link'})` };
      }
      const cName = (collab.name || '').trim().toLowerCase();
      const cHandle = (collab.handle || '').trim().toLowerCase();
      const cHref = (collab.href || '').trim().toLowerCase();

      if (cName === cleanTarget || cName === spacelessTarget) {
        return { matched: true, location: `Collaborator (${collab.name})` };
      }
      if (cHandle === handleTarget || (isHandle && cHandle === target)) {
        return { matched: true, location: `Collaborator Handle (${cHandle})` };
      }
      if (cHref.includes('/@' + spacelessTarget) || cHref.includes('/' + cleanTarget)) {
        return { matched: true, location: 'Collaborator Link' };
      }
    }
  }

  // 3. Check All Card Channel Links & Hrefs
  if (cardMetadata.allHrefs && Array.isArray(cardMetadata.allHrefs)) {
    for (const href of cardMetadata.allHrefs) {
      const h = href.toLowerCase();
      if (
        h.includes('/@' + spacelessTarget) ||
        h.includes('/@' + cleanTarget) ||
        h.includes('/channel/' + cleanTarget) ||
        h.includes('/c/' + cleanTarget) ||
        h.includes('/user/' + cleanTarget) ||
        (target.startsWith('/channel/') && h.includes(target))
      ) {
        return { matched: true, location: 'Channel Link' };
      }
    }
  }

  // 4. Check All Extracted Handles
  if (cardMetadata.allHandles && Array.isArray(cardMetadata.allHandles)) {
    for (const handle of cardMetadata.allHandles) {
      const h = handle.toLowerCase();
      if (h === handleTarget || h === '@' + cleanTarget) {
        return { matched: true, location: `Channel Handle (${handle})` };
      }
    }
  }

  // 5. Check Byline / Subtitle Text (e.g. "PJ Explained and PJ", "Creator A & Creator B")
  const byline = (cardMetadata.bylineText || '').toLowerCase();
  if (byline) {
    const bylineRegex = getWordBoundaryRegex(cleanTarget);
    if (bylineRegex && bylineRegex.test(byline)) {
      return { matched: true, location: 'Byline Text' };
    }
    if (byline.includes(handleTarget) || (spacelessTarget.length >= 4 && byline.replace(/\s+/g, '').includes(spacelessTarget))) {
      return { matched: true, location: 'Byline Handle/Name' };
    }
    if (cardMetadata.bylineTokens && Array.isArray(cardMetadata.bylineTokens)) {
      for (const token of cardMetadata.bylineTokens) {
        if (
          token === cleanTarget ||
          token === spacelessTarget ||
          token.replace(/\s+/g, '') === spacelessTarget
        ) {
          return { matched: true, location: `Byline Collab (${token})` };
        }
      }
    }
  }

  // 6. Check Video Title ("also check if a channel is somewhere else")
  const title = (cardMetadata.title || '').toLowerCase();
  if (title) {
    // 6a. Direct handle mention in title (e.g. "@pjexplained")
    if (title.includes(handleTarget) || title.includes('@' + cleanTarget)) {
      return { matched: true, location: 'Title Handle Mention' };
    }

    // 6b. Collaboration indicators in title: ft, feat, with, w/, x, collab
    // e.g. "ft. PJ Explained", "w/ PJ Explained", "with PJ Explained", "PJ Explained x "
    const collabTitleRegex = new RegExp(
      '(?:\\b(?:ft\\.?|feat\\.?|featuring|with|w\\/|collab(?:oration)?(?:\\s+with)?|x)\\s+|(?:^|\\s))' +
      escapeRegExp(cleanTarget) +
      '(?:\\s+(?:x|ft\\.?|feat\\.?)\\b|\\b)',
      'i'
    );
    if (collabTitleRegex.test(title)) {
      return { matched: true, location: 'Title Collaboration Mention' };
    }

    // Also test spaceless target with collab indicators if user entered a handle without spaces
    if (spacelessTarget.length >= 4) {
      const collabSpacelessRegex = new RegExp(
        '(?:\\b(?:ft\\.?|feat\\.?|featuring|with|w\\/|collab(?:oration)?(?:\\s+with)?|x)\\s+)' +
        escapeRegExp(spacelessTarget) + '\\b',
        'i'
      );
      if (collabSpacelessRegex.test(title)) {
        return { matched: true, location: 'Title Collaboration Mention' };
      }
    }

    // 6c. Multi-word or distinctive channel names anywhere in title
    // Avoid single common words like "why" or "up" from triggering title matches
    if (cleanTarget.includes(' ') || cleanTarget.length >= 6) {
      const titleRegex = getWordBoundaryRegex(cleanTarget);
      if (titleRegex && titleRegex.test(title)) {
        return { matched: true, location: 'Title Mention' };
      }
      // If user entered handle (@pjexplained), check if spaced title contains spaceless match
      if (spacelessTarget.length >= 6 && title.replace(/\s+/g, '').includes(spacelessTarget)) {
        return { matched: true, location: 'Title Mention' };
      }
    }
  }

  // 7. Check Description Snippet or Secondary Metadata ("somewhere else")
  const snippet = (cardMetadata.snippet || '').toLowerCase();
  if (snippet) {
    if (snippet.includes(handleTarget) || snippet.includes('@' + cleanTarget)) {
      return { matched: true, location: 'Snippet Handle Mention' };
    }
    if (cleanTarget.includes(' ') || cleanTarget.length >= 6) {
      const snippetRegex = getWordBoundaryRegex(cleanTarget);
      if (snippetRegex && snippetRegex.test(snippet)) {
        return { matched: true, location: 'Snippet Mention' };
      }
    }
  }

  return { matched: false, location: '' };
}

/**
 * Standalone classifier function for video cards.
 * Decoupled from DOM logic.
 *
 * Evaluation Rule:
 * - If one or more fields are set to 'allow':
 *     SHOW only if video matches >= 1 'allow' field AND matches 0 'block' fields.
 *     Otherwise HIDE.
 * - If zero fields are set to 'allow':
 *     HIDE if video matches any 'block' field.
 *     Otherwise SHOW.
 *
 * @param {string} title - Video title
 * @param {string} channelName - Channel name
 * @param {Object} fields - Map of topic fields with .state and .keywords
 * @returns {{action: 'SHOW'|'HIDE', reason: string, matchedAllow: string[], matchedBlock: string[]}}
 */
function classifyVideo(title, channelName, fields) {
  const cleanTitle = (title || '').trim();
  const cleanChannel = (channelName || '').trim();

  // Guard: If card metadata has not been populated by YouTube yet, do not evaluate
  if (!cleanTitle && !cleanChannel) {
    return {
      action: 'SHOW',
      reason: 'Pending hydration',
      matchedAllow: [],
      matchedBlock: []
    };
  }

  const text = `${cleanTitle} ${cleanChannel}`.toLowerCase();
  const fieldList = Object.values(fields || {});

  const allowFields = [];
  const blockFields = [];

  for (const f of fieldList) {
    if (!f || !f.state) continue;
    if (f.state === 'allow') {
      allowFields.push(f);
    } else if (f.state === 'block') {
      blockFields.push(f);
    }
  }

  // Helper to test if text matches any keyword of a given field
  function testFieldMatch(field) {
    if (!field.keywords || !Array.isArray(field.keywords)) return false;
    for (const kw of field.keywords) {
      if (!kw) continue;
      const regex = getWordBoundaryRegex(kw);
      if (regex && regex.test(text)) {
        return true;
      }
    }
    return false;
  }

  const matchedAllow = allowFields.filter(f => testFieldMatch(f)).map(f => f.name);
  const matchedBlock = blockFields.filter(f => testFieldMatch(f)).map(f => f.name);

  // Exact rule evaluation
  if (allowFields.length > 0) {
    // One or more fields are set to Allow:
    // SHOW only if matches >= 1 Allow field AND matches 0 Block fields. Otherwise HIDE.
    if (matchedAllow.length > 0 && matchedBlock.length === 0) {
      return {
        action: 'SHOW',
        reason: `Matched allowed field(s): ${matchedAllow.join(', ')}`,
        matchedAllow,
        matchedBlock
      };
    } else {
      let reason = '';
      if (matchedBlock.length > 0) {
        reason = `Blocked by field(s): ${matchedBlock.join(', ')}`;
      } else {
        reason = `Did not match any required allowed fields (${allowFields.map(f => f.name).join(', ')})`;
      }
      return {
        action: 'HIDE',
        reason,
        matchedAllow,
        matchedBlock
      };
    }
  } else {
    // Zero fields are set to Allow:
    // HIDE if video matches any Block field. Otherwise SHOW.
    if (matchedBlock.length > 0) {
      return {
        action: 'HIDE',
        reason: `Blocked by field(s): ${matchedBlock.join(', ')}`,
        matchedAllow,
        matchedBlock
      };
    } else {
      return {
        action: 'SHOW',
        reason: 'No blocked fields matched',
        matchedAllow,
        matchedBlock
      };
    }
  }
}

// Ensure definitions are accessible in window/global scope for popup and content script
if (typeof window !== 'undefined') {
  window.DEFAULT_FIELDS = DEFAULT_FIELDS;
  window.DEFAULT_CONFIG = DEFAULT_CONFIG;
  window.escapeRegExp = escapeRegExp;
  window.getWordBoundaryRegex = getWordBoundaryRegex;
  window.normalizeChannelInput = normalizeChannelInput;
  window.getRuleTarget = getRuleTarget;
  window.isRuleEnabled = isRuleEnabled;
  window.isSameChannel = isSameChannel;
  window.matchesChannelRule = matchesChannelRule;
  window.matchesChannelOrCollab = matchesChannelOrCollab;
  window.classifyVideo = classifyVideo;
}
