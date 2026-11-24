/**
 * FocusFeed - Popup Script (popup.js)
 * Manages Toggles, Field Filters, Channel Lists, and Storage Backup
 */

(function () {
  'use strict';

  // In-memory state
  let config = Object.assign({}, DEFAULT_CONFIG);
  let activeTabId = null;

  // DOM Elements - Navigation
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // DOM Elements - Toggles
  const masterToggle = document.getElementById('master-toggle');
  const masterStatusCard = document.getElementById('master-status-card');
  const masterStatusText = document.getElementById('master-status-text');
  const masterStatusSub = document.getElementById('master-status-sub');
  const toggleShorts = document.getElementById('toggle-shorts');
  const toggleOnlySearch = document.getElementById('toggle-only-search');
  const toggleWatchSuggestions = document.getElementById('toggle-watch-suggestions');
  const toggleComments = document.getElementById('toggle-comments');
  const toggleAdSkip = document.getElementById('toggle-ad-skip');
  const toggleAdFastForward = document.getElementById('toggle-ad-fast-forward');
  const selectAdFfRate = document.getElementById('select-ad-ff-rate');

  // DOM Elements - Stats
  const statHiddenCount = document.getElementById('stat-hidden-count');
  const statVisibleCount = document.getElementById('stat-visible-count');
  const tabStatusDot = document.getElementById('tab-status-dot');
  const tabStatusTitle = document.getElementById('tab-status-title');
  const refreshStatsBtn = document.getElementById('refresh-stats-btn');

  // DOM Elements - Fields
  const fieldsContainer = document.getElementById('fields-container');
  const fieldSearchInput = document.getElementById('field-search-input');
  const importFieldsBtn = document.getElementById('import-fields-btn');
  const exportFieldsBtn = document.getElementById('export-fields-btn');
  const resetFieldsBtn = document.getElementById('reset-fields-btn');
  const importFieldsFile = document.getElementById('import-fields-file');
  const customFieldNameInput = document.getElementById('custom-field-name');
  const customFieldKeywordsInput = document.getElementById('custom-field-keywords');
  const customFieldStateBtns = document.querySelectorAll('#custom-field-state .seg-btn');
  const addCustomFieldBtn = document.getElementById('add-custom-field-btn');

  // DOM Elements - Lists
  const allowChannelInput = document.getElementById('allow-channel-input');
  const addAllowChannelBtn = document.getElementById('add-allow-channel-btn');
  const allowChannelsChips = document.getElementById('allow-channels-chips');
  const allowChannelsCount = document.getElementById('allow-channels-count');
  const importAllowChannelsBtn = document.getElementById('import-allow-channels-btn');
  const exportAllowChannelsBtn = document.getElementById('export-allow-channels-btn');
  const resetAllowChannelsBtn = document.getElementById('reset-allow-channels-btn');
  const importAllowChannelsFile = document.getElementById('import-allow-channels-file');

  const blockedChannelInput = document.getElementById('blocked-channel-input');
  const addBlockedChannelBtn = document.getElementById('add-blocked-channel-btn');
  const blockedChannelsChips = document.getElementById('blocked-channels-chips');
  const blockedChannelsCount = document.getElementById('blocked-channels-count');
  const importBlockedChannelsBtn = document.getElementById('import-blocked-channels-btn');
  const exportBlockedChannelsBtn = document.getElementById('export-blocked-channels-btn');
  const resetBlockedChannelsBtn = document.getElementById('reset-blocked-channels-btn');
  const importBlockedChannelsFile = document.getElementById('import-blocked-channels-file');

  const blockedKeywordInput = document.getElementById('blocked-keyword-input');
  const addBlockedKeywordBtn = document.getElementById('add-blocked-keyword-btn');
  const blockedKeywordsChips = document.getElementById('blocked-keywords-chips');
  const blockedKeywordsCount = document.getElementById('blocked-keywords-count');
  const importBlockedKeywordsBtn = document.getElementById('import-blocked-keywords-btn');
  const exportBlockedKeywordsBtn = document.getElementById('export-blocked-keywords-btn');
  const resetBlockedKeywordsBtn = document.getElementById('reset-blocked-keywords-btn');
  const importBlockedKeywordsFile = document.getElementById('import-blocked-keywords-file');

  // DOM Elements - Backup
  const exportJsonBtn = document.getElementById('export-json-btn');
  const importJsonBtn = document.getElementById('import-json-btn');
  const importFileInput = document.getElementById('import-file-input');
  const resetDefaultsBtn = document.getElementById('reset-defaults-btn');
  const toast = document.getElementById('toast');

  let customFieldSelectedState = 'off';
  let toastTimeout = null;

  // =========================================================================
  // 1. Toast Notification Utility
  // =========================================================================
  function showToast(message) {
    if (toastTimeout) clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // =========================================================================
  // 2. Storage Persistence
  // =========================================================================
  function saveConfig(updatedConfig, toastMsg = null) {
    config = updatedConfig;
    chrome.storage.local.set(config, () => {
      if (toastMsg) showToast(toastMsg);
    });
  }

  // =========================================================================
  // 3. Tab Switching
  // =========================================================================
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));

      btn.classList.add('active');
      const activePane = document.getElementById(`tab-${targetTab}`);
      if (activePane) activePane.classList.add('active');
    });
  });

  // =========================================================================
  // 4. Live Statistics & Active Tab Querying
  // =========================================================================
  function fetchTabStats() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs.length) return;
      const currentTab = tabs[0];
      activeTabId = currentTab.id;

      const isYouTube = currentTab.url && (currentTab.url.includes('youtube.com') || currentTab.url.includes('youtu.be'));

      if (!isYouTube) {
        tabStatusDot.classList.add('inactive');
        tabStatusTitle.textContent = 'Not a YouTube Tab';
        statHiddenCount.textContent = '-';
        statVisibleCount.textContent = '-';
        return;
      }

      tabStatusDot.classList.remove('inactive');
      tabStatusTitle.textContent = 'YouTube Feed Live';

      chrome.tabs.sendMessage(activeTabId, { action: 'GET_STATS' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          // Content script may still be loading
          statHiddenCount.textContent = '0';
          statVisibleCount.textContent = '0';
          return;
        }

        statHiddenCount.textContent = response.hiddenCount || 0;
        statVisibleCount.textContent = response.visibleCount || 0;
      });
    });
  }

  refreshStatsBtn.addEventListener('click', () => {
    fetchTabStats();
    showToast('Refreshed feed statistics');
  });

  // =========================================================================
  // 5. Toggles Tab Handlers
  // =========================================================================
  function updateMasterToggleUI(enabled) {
    masterToggle.checked = enabled;
    if (enabled) {
      masterStatusCard.classList.remove('disabled');
      masterStatusText.textContent = 'Active';
      masterStatusSub.textContent = 'All active Layer 1 & Layer 2 filters are enforcing rules in real time.';
    } else {
      masterStatusCard.classList.add('disabled');
      masterStatusText.textContent = 'Paused';
      masterStatusSub.textContent = 'Filters are paused. All YouTube content is currently unrestricted.';
    }
  }

  masterToggle.addEventListener('change', () => {
    config.enabled = masterToggle.checked;
    updateMasterToggleUI(config.enabled);
    saveConfig(config, config.enabled ? 'FocusFeed activated' : 'FocusFeed paused');
  });

  toggleShorts.addEventListener('change', () => {
    config.blockShorts = toggleShorts.checked;
    saveConfig(config, config.blockShorts ? 'Shorts Blocker enabled' : 'Shorts Blocker disabled');
  });

  toggleOnlySearch.addEventListener('change', () => {
    config.onlySearch = toggleOnlySearch.checked;
    saveConfig(config, config.onlySearch ? 'Only Search mode enabled' : 'Only Search mode disabled');
  });

  toggleWatchSuggestions.addEventListener('change', () => {
    config.blockWatchSuggestions = toggleWatchSuggestions.checked;
    saveConfig(config, config.blockWatchSuggestions ? 'Watch suggestions blocked' : 'Watch suggestions allowed');
  });

  toggleComments.addEventListener('change', () => {
    config.blockComments = toggleComments.checked;
    saveConfig(config, config.blockComments ? 'Comments Blocker enabled' : 'Comments Blocker disabled');
  });

  toggleAdSkip.addEventListener('change', () => {
    config.adSkip = toggleAdSkip.checked;
    saveConfig(config, config.adSkip ? 'Auto-Skip Ads enabled' : 'Auto-Skip Ads disabled');
  });

  toggleAdFastForward.addEventListener('change', () => {
    config.adFastForward = toggleAdFastForward.checked;
    saveConfig(config, config.adFastForward ? 'Ad Fast-Forward enabled' : 'Ad Fast-Forward disabled');
  });

  selectAdFfRate.addEventListener('change', () => {
    config.adFastForwardRate = parseFloat(selectAdFfRate.value) || 4;
    saveConfig(config, `Ad Fast-Forward speed set to ${config.adFastForwardRate}x`);
  });

  // =========================================================================
  // 6. Fields Tab Handlers
  // =========================================================================

  // Handle custom field initial state segmented buttons
  customFieldStateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      customFieldStateBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      customFieldSelectedState = btn.getAttribute('data-state');
    });
  });

  // Render fields list
  function renderFieldsList(filterQuery = '') {
    fieldsContainer.innerHTML = '';
    const query = filterQuery.trim().toLowerCase();
    const fieldsArray = Object.values(config.fields || {});

    fieldsArray.forEach(field => {
      // Filter by query if user is searching
      if (query) {
        const matchesName = field.name.toLowerCase().includes(query);
        const matchesKeywords = field.keywords && field.keywords.some(k => k.toLowerCase().includes(query));
        if (!matchesName && !matchesKeywords) return;
      }

      const item = document.createElement('div');
      item.className = 'field-item';
      item.dataset.fieldId = field.id;

      const kwCount = (field.keywords && field.keywords.length) || 0;

      item.innerHTML = `
        <div class="field-header">
          <div class="field-meta">
            <span class="field-name" title="${field.name}">${field.name}</span>
            <span class="keyword-count-pill">${kwCount} kw</span>
          </div>
          <div class="field-controls">
            <div class="segmented-control" data-field-id="${field.id}">
              <button type="button" class="seg-btn ${field.state === 'off' ? 'active' : ''}" data-state="off">Off</button>
              <button type="button" class="seg-btn ${field.state === 'allow' ? 'active' : ''}" data-state="allow">Allow</button>
              <button type="button" class="seg-btn ${field.state === 'block' ? 'active' : ''}" data-state="block">Block</button>
            </div>
          </div>
        </div>

        <div class="field-details" id="details-${field.id}">
          <div class="field-keywords-tags" id="tags-${field.id}"></div>
          <div class="add-kw-input-row">
            <input type="text" placeholder="Add keyword to ${field.name}" id="input-kw-${field.id}">
            <button class="btn btn-sm btn-secondary add-field-kw-btn" data-field-id="${field.id}">+ Add</button>
          </div>
          <div class="field-btn-row">
            <button class="btn-text-danger delete-field-btn" data-field-id="${field.id}" style="${field.isCustom ? '' : 'display:none;'}">
              Delete Field
            </button>
            <button class="btn btn-sm btn-secondary toggle-details-btn" data-field-id="${field.id}">
              Hide Keywords ▲
            </button>
          </div>
        </div>
      `;

      // Insert keywords editor toggle in header meta
      const meta = item.querySelector('.field-meta');
      const expandBtn = document.createElement('button');
      expandBtn.className = 'icon-btn';
      expandBtn.title = 'Edit keywords';
      expandBtn.textContent = '✏️';
      expandBtn.addEventListener('click', () => {
        const details = item.querySelector(`#details-${field.id}`);
        details.classList.toggle('open');
      });
      meta.appendChild(expandBtn);

      // Render tags inside details
      const tagsContainer = item.querySelector(`#tags-${field.id}`);
      (field.keywords || []).forEach(kw => {
        const tag = document.createElement('span');
        tag.className = 'keyword-tag';
        tag.innerHTML = `
          <span>${kw}</span>
          <button class="keyword-tag-remove" data-field-id="${field.id}" data-keyword="${kw}">&times;</button>
        `;
        tagsContainer.appendChild(tag);
      });

      // 3-Way Segmented Control Click
      const segBtns = item.querySelectorAll('.segmented-control button');
      segBtns.forEach(sb => {
        sb.addEventListener('click', () => {
          const newState = sb.getAttribute('data-state');
          config.fields[field.id].state = newState;
          segBtns.forEach(b => b.classList.remove('active'));
          sb.classList.add('active');
          saveConfig(config, `${field.name} set to ${newState.toUpperCase()}`);
        });
      });

      // Tag removal listener
      tagsContainer.querySelectorAll('.keyword-tag-remove').forEach(rmBtn => {
        rmBtn.addEventListener('click', () => {
          const kwToRemove = rmBtn.getAttribute('data-keyword');
          config.fields[field.id].keywords = config.fields[field.id].keywords.filter(k => k !== kwToRemove);
          saveConfig(config);
          renderFieldsList(fieldSearchInput.value);
        });
      });

      // Add Keyword to Field Listener
      const addKwBtn = item.querySelector(`.add-field-kw-btn[data-field-id="${field.id}"]`);
      const kwInput = item.querySelector(`#input-kw-${field.id}`);
      const handleAddKw = () => {
        const val = kwInput.value.trim().toLowerCase();
        if (!val) return;
        if (!config.fields[field.id].keywords) config.fields[field.id].keywords = [];
        if (!config.fields[field.id].keywords.includes(val)) {
          config.fields[field.id].keywords.push(val);
          saveConfig(config);
          renderFieldsList(fieldSearchInput.value);
          // Keep details open
          setTimeout(() => {
            const d = document.getElementById(`details-${field.id}`);
            if (d) d.classList.add('open');
          }, 0);
        }
      };

      addKwBtn.addEventListener('click', handleAddKw);
      kwInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAddKw();
      });

      // Hide Keywords button listener
      const toggleDetailsBtn = item.querySelector(`.toggle-details-btn[data-field-id="${field.id}"]`);
      toggleDetailsBtn.addEventListener('click', () => {
        item.querySelector(`#details-${field.id}`).classList.remove('open');
      });

      // Delete Custom Field
      const deleteFieldBtn = item.querySelector(`.delete-field-btn[data-field-id="${field.id}"]`);
      if (deleteFieldBtn && field.isCustom) {
        deleteFieldBtn.addEventListener('click', () => {
          if (confirm(`Delete custom field "${field.name}"?`)) {
            delete config.fields[field.id];
            saveConfig(config, `Deleted field "${field.name}"`);
            renderFieldsList(fieldSearchInput.value);
          }
        });
      }

      fieldsContainer.appendChild(item);
    });

    if (fieldsContainer.children.length === 0) {
      fieldsContainer.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 12px;">No matching fields found.</div>';
    }
  }

  // Field Search Box listener
  fieldSearchInput.addEventListener('input', () => {
    renderFieldsList(fieldSearchInput.value);
  });

  // Add Custom Field form listener
  addCustomFieldBtn.addEventListener('click', () => {
    const name = customFieldNameInput.value.trim();
    if (!name) {
      showToast('Please enter a field name');
      return;
    }

    const rawKeywords = customFieldKeywordsInput.value.trim();
    const keywords = rawKeywords
      ? rawKeywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0)
      : [name.toLowerCase()];

    const fieldId = 'custom_' + Date.now();
    config.fields[fieldId] = {
      id: fieldId,
      name,
      state: customFieldSelectedState,
      isCustom: true,
      keywords
    };

    saveConfig(config, `Custom field "${name}" added`);
    customFieldNameInput.value = '';
    customFieldKeywordsInput.value = '';
    renderFieldsList();
  });

  // =========================================================================
  // 6b. Field Import / Export / Reset Handlers
  // =========================================================================

  // Export Fields JSON
  exportFieldsBtn.addEventListener('click', () => {
    const jsonStr = JSON.stringify(config.fields, null, 2);
    downloadFile(jsonStr, 'focusfeed-fields.json');
    showToast('Exported topic fields JSON');
  });

  // Import Fields Trigger & Handler
  importFieldsBtn.addEventListener('click', () => {
    importFieldsFile.value = '';
    importFieldsFile.click();
  });

  importFieldsFile.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target.result);
        if (typeof imported !== 'object' || imported === null) throw new Error('Invalid format');
        config.fields = Object.assign({}, config.fields, imported);
        saveConfig(config, 'Imported and merged topic fields');
        renderFieldsList();
      } catch (_) {
        showToast('Error: Invalid JSON for topic fields');
      }
    };
    reader.readAsText(file);
  });

  // Reset Fields to Defaults
  resetFieldsBtn.addEventListener('click', () => {
    if (confirm('Reset all topic fields to default categories and turn them OFF?')) {
      config.fields = JSON.parse(JSON.stringify(DEFAULT_FIELDS));
      saveConfig(config, 'Reset all topic fields to defaults');
      renderFieldsList();
    }
  });

  // =========================================================================
  // 7. Lists Tab Handlers, Checkbox Toggles & Import/Export/Reset
  // =========================================================================

  /**
   * Helper to normalize a rule item into { name: string, enabled: boolean }.
   */
  function normalizeRuleItem(item) {
    if (typeof item === 'string') {
      return { name: item, enabled: true };
    }
    return {
      name: (item && (item.name || item.value)) || '',
      enabled: item ? item.enabled !== false : true
    };
  }

  /**
   * Helper to trigger a file download from string content.
   */
  function downloadFile(content, fileName, mimeType = 'application/json') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Universal text/JSON parser for channels and keywords.
   * Accepts JSON array (strings or objects) or plain text line-by-line.
   */
  function parseImportedItems(rawText, isChannel = true) {
    const trimmed = rawText.trim();
    let parsedList = [];

    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const json = JSON.parse(trimmed);
        const array = Array.isArray(json) ? json : Object.values(json);
        array.forEach(entry => {
          if (typeof entry === 'string' && entry.trim()) {
            parsedList.push({ name: entry.trim(), enabled: true });
          } else if (entry && typeof entry === 'object' && (entry.name || entry.value)) {
            parsedList.push({
              name: String(entry.name || entry.value).trim(),
              enabled: entry.enabled !== false
            });
          }
        });
      } catch (_) {
        // Fallback to text lines
      }
    }

    if (parsedList.length === 0) {
      const lines = rawText.split(/[\r\n,]+/);
      lines.forEach(line => {
        const t = line.trim();
        if (t && !t.startsWith('#')) {
          parsedList.push({ name: t, enabled: true });
        }
      });
    }

    if (isChannel) {
      return parsedList.map(item => ({
        name: normalizeChannelInput(item.name),
        enabled: item.enabled
      })).filter(item => Boolean(item.name));
    } else {
      return parsedList.map(item => ({
        name: item.name.toLowerCase().trim(),
        enabled: item.enabled
      })).filter(item => Boolean(item.name));
    }
  }

  /**
   * Renders rule item rows with individual checkboxes, swap actions, and delete buttons.
   */
  function renderRuleItems(containerEl, items, options = {}) {
    containerEl.innerHTML = '';
    if (!items || !items.length) {
      containerEl.innerHTML = '<span style="font-size: 11.5px; color: var(--text-muted); padding: 8px 4px; display: block;">No items in this list.</span>';
      return;
    }

    items.forEach((rawItem, index) => {
      const item = normalizeRuleItem(rawItem);
      items[index] = item; // Store normalized representation

      const row = document.createElement('div');
      row.className = `rule-item-row ${!item.enabled ? 'is-disabled' : ''}`;

      const leftLabel = document.createElement('label');
      leftLabel.className = 'rule-item-left';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'rule-item-checkbox';
      checkbox.checked = Boolean(item.enabled);
      checkbox.title = item.enabled ? 'Uncheck to temporarily disable' : 'Check to enable';
      checkbox.addEventListener('change', () => {
        item.enabled = checkbox.checked;
        items[index] = item;
        row.classList.toggle('is-disabled', !item.enabled);
        saveConfig(config, `Rule "${item.name}" is now ${item.enabled ? 'active' : 'disabled'}`);
      });

      const nameSpan = document.createElement('span');
      nameSpan.className = 'rule-item-label';
      nameSpan.textContent = item.name;
      nameSpan.title = item.name;

      leftLabel.appendChild(checkbox);
      leftLabel.appendChild(nameSpan);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'rule-item-actions';

      // Swap button (Move between Allow and Block lists)
      if (options.swapLabel && options.onSwap) {
        const swapBtn = document.createElement('button');
        swapBtn.type = 'button';
        swapBtn.className = 'rule-swap-btn';
        swapBtn.textContent = options.swapLabel;
        swapBtn.title = options.swapTitle || 'Move rule';
        swapBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          options.onSwap(index, item);
        });
        actionsDiv.appendChild(swapBtn);
      }

      // Delete button
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'rule-delete-btn';
      delBtn.innerHTML = '&times;';
      delBtn.title = 'Remove item';
      delBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        options.onDelete(index, item);
      });
      actionsDiv.appendChild(delBtn);

      row.appendChild(leftLabel);
      row.appendChild(actionsDiv);
      containerEl.appendChild(row);
    });
  }

  function renderAllLists() {
    // 1. Always-Allow Channels
    if (!config.alwaysAllowChannels) config.alwaysAllowChannels = [];
    allowChannelsCount.textContent = config.alwaysAllowChannels.length;
    renderRuleItems(allowChannelsChips, config.alwaysAllowChannels, {
      swapLabel: '⇄ Block',
      swapTitle: 'Move to Blocked Channels',
      onSwap: (idx, item) => {
        config.alwaysAllowChannels.splice(idx, 1);
        if (!config.blockedChannels) config.blockedChannels = [];
        config.blockedChannels = config.blockedChannels.filter(c => !isSameChannel(c, item.name));
        config.blockedChannels.push(item);
        saveConfig(config, `Moved ${item.name} to Blocked Channels`);
        renderAllLists();
      },
      onDelete: (idx, item) => {
        config.alwaysAllowChannels.splice(idx, 1);
        saveConfig(config, `Removed ${item.name} from Always-Allow`);
        renderAllLists();
      }
    });

    // 2. Blocked Channels
    if (!config.blockedChannels) config.blockedChannels = [];
    blockedChannelsCount.textContent = config.blockedChannels.length;
    renderRuleItems(blockedChannelsChips, config.blockedChannels, {
      swapLabel: '⇄ Allow',
      swapTitle: 'Move to Always-Allow Channels',
      onSwap: (idx, item) => {
        config.blockedChannels.splice(idx, 1);
        if (!config.alwaysAllowChannels) config.alwaysAllowChannels = [];
        config.alwaysAllowChannels = config.alwaysAllowChannels.filter(c => !isSameChannel(c, item.name));
        config.alwaysAllowChannels.push(item);
        saveConfig(config, `Moved ${item.name} to Always-Allow`);
        renderAllLists();
      },
      onDelete: (idx, item) => {
        config.blockedChannels.splice(idx, 1);
        saveConfig(config, `Removed ${item.name} from Blocked Channels`);
        renderAllLists();
      }
    });

    // 3. Blocked Keywords
    if (!config.blockedKeywords) config.blockedKeywords = [];
    blockedKeywordsCount.textContent = config.blockedKeywords.length;
    renderRuleItems(blockedKeywordsChips, config.blockedKeywords, {
      onDelete: (idx, item) => {
        config.blockedKeywords.splice(idx, 1);
        saveConfig(config, `Removed "${item.name}" from Blocked Keywords`);
        renderAllLists();
      }
    });
  }

  // Add Always-Allow Channel (Enforce Mutual Exclusion: Cannot add if present in Blocked Channels)
  function handleAddAllowChannel() {
    const inputVal = allowChannelInput.value.trim();
    if (!inputVal) return;

    const normalized = normalizeChannelInput(inputVal);
    if (!normalized) return;

    if (!config.alwaysAllowChannels) config.alwaysAllowChannels = [];
    if (!config.blockedChannels) config.blockedChannels = [];

    // Mutual Exclusion Check: If channel is in Blocked Channels, PREVENT addition!
    const inBlockList = config.blockedChannels.some(c => isSameChannel(c, normalized));
    if (inBlockList) {
      showToast(`Cannot add "${normalized}": Already in Blocked list. Remove it from Blocked list first.`);
      return;
    }

    // Check if already in Always-Allow
    const alreadyAllowed = config.alwaysAllowChannels.some(c => isSameChannel(c, normalized));
    if (alreadyAllowed) {
      showToast(`"${normalized}" is already in Always-Allow Channels.`);
      return;
    }

    config.alwaysAllowChannels.push({ name: normalized, enabled: true });
    allowChannelInput.value = '';
    saveConfig(config, `Added ${normalized} to Always-Allow`);
    renderAllLists();
  }

  addAllowChannelBtn.addEventListener('click', handleAddAllowChannel);
  allowChannelInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddAllowChannel();
  });

  // Add Blocked Channel (Enforce Mutual Exclusion: Cannot add if present in Always-Allow)
  function handleAddBlockedChannel() {
    const inputVal = blockedChannelInput.value.trim();
    if (!inputVal) return;

    const normalized = normalizeChannelInput(inputVal);
    if (!normalized) return;

    if (!config.alwaysAllowChannels) config.alwaysAllowChannels = [];
    if (!config.blockedChannels) config.blockedChannels = [];

    // Mutual Exclusion Check: If channel is in Always-Allow list, PREVENT addition!
    const inAllowList = config.alwaysAllowChannels.some(c => isSameChannel(c, normalized));
    if (inAllowList) {
      showToast(`Cannot add "${normalized}": Already in Always-Allow list. Remove it from Always-Allow first.`);
      return;
    }

    // Check if already in Blocked Channels
    const alreadyBlocked = config.blockedChannels.some(c => isSameChannel(c, normalized));
    if (alreadyBlocked) {
      showToast(`"${normalized}" is already in Blocked Channels.`);
      return;
    }

    config.blockedChannels.push({ name: normalized, enabled: true });
    blockedChannelInput.value = '';
    saveConfig(config, `Added ${normalized} to Blocked Channels`);
    renderAllLists();
  }

  addBlockedChannelBtn.addEventListener('click', handleAddBlockedChannel);
  blockedChannelInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddBlockedChannel();
  });

  // Add Custom Blocked Keyword
  function handleAddBlockedKeyword() {
    const inputVal = blockedKeywordInput.value.trim().toLowerCase();
    if (!inputVal) return;

    if (!config.blockedKeywords) config.blockedKeywords = [];

    const exists = config.blockedKeywords.some(k => getRuleTarget(k).toLowerCase() === inputVal);
    if (!exists) {
      config.blockedKeywords.push({ name: inputVal, enabled: true });
      saveConfig(config, `Added "${inputVal}" to Blocked Keywords`);
      blockedKeywordInput.value = '';
      renderAllLists();
    } else {
      showToast('Keyword already in list');
    }
  }

  addBlockedKeywordBtn.addEventListener('click', handleAddBlockedKeyword);
  blockedKeywordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddBlockedKeyword();
  });

  // -------------------------------------------------------------------------
  // Always-Allow Channels: Import / Export / Reset
  // -------------------------------------------------------------------------
  exportAllowChannelsBtn.addEventListener('click', () => {
    const jsonStr = JSON.stringify(config.alwaysAllowChannels || [], null, 2);
    downloadFile(jsonStr, 'focusfeed-allow-channels.json');
    showToast('Exported Always-Allow channels');
  });

  importAllowChannelsBtn.addEventListener('click', () => {
    importAllowChannelsFile.value = '';
    importAllowChannelsFile.click();
  });

  importAllowChannelsFile.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const items = parseImportedItems(evt.target.result, true);
      if (!items.length) {
        showToast('No valid channels found in file');
        return;
      }
      if (!config.alwaysAllowChannels) config.alwaysAllowChannels = [];
      if (!config.blockedChannels) config.blockedChannels = [];

      let addedCount = 0;
      let skippedConflictCount = 0;
      items.forEach(newItem => {
        // Mutual exclusion: If channel is already in Blocked Channels, DO NOT import it
        if (config.blockedChannels.some(c => isSameChannel(c, newItem.name))) {
          skippedConflictCount++;
          return;
        }
        if (!config.alwaysAllowChannels.some(c => isSameChannel(c, newItem.name))) {
          config.alwaysAllowChannels.push(newItem);
          addedCount++;
        }
      });
      let msg = `Imported ${addedCount} channels to Always-Allow`;
      if (skippedConflictCount > 0) {
        msg += ` (${skippedConflictCount} skipped: present in Blocked list)`;
      }
      saveConfig(config, msg);
      renderAllLists();
    };
    reader.readAsText(file);
  });

  resetAllowChannelsBtn.addEventListener('click', () => {
    if (confirm('Clear all Always-Allow channels?')) {
      config.alwaysAllowChannels = [];
      saveConfig(config, 'Cleared Always-Allow channels');
      renderAllLists();
    }
  });

  // -------------------------------------------------------------------------
  // Blocked Channels: Import / Export / Reset
  // -------------------------------------------------------------------------
  exportBlockedChannelsBtn.addEventListener('click', () => {
    const jsonStr = JSON.stringify(config.blockedChannels || [], null, 2);
    downloadFile(jsonStr, 'focusfeed-blocked-channels.json');
    showToast('Exported Blocked channels');
  });

  importBlockedChannelsBtn.addEventListener('click', () => {
    importBlockedChannelsFile.value = '';
    importBlockedChannelsFile.click();
  });

  importBlockedChannelsFile.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const items = parseImportedItems(evt.target.result, true);
      if (!items.length) {
        showToast('No valid channels found in file');
        return;
      }
      if (!config.alwaysAllowChannels) config.alwaysAllowChannels = [];
      if (!config.blockedChannels) config.blockedChannels = [];

      let addedCount = 0;
      let skippedConflictCount = 0;
      items.forEach(newItem => {
        // Mutual exclusion: If channel is already in Always-Allow Channels, DO NOT import it
        if (config.alwaysAllowChannels.some(c => isSameChannel(c, newItem.name))) {
          skippedConflictCount++;
          return;
        }
        if (!config.blockedChannels.some(c => isSameChannel(c, newItem.name))) {
          config.blockedChannels.push(newItem);
          addedCount++;
        }
      });
      let msg = `Imported ${addedCount} channels to Blocked Channels`;
      if (skippedConflictCount > 0) {
        msg += ` (${skippedConflictCount} skipped: present in Always-Allow)`;
      }
      saveConfig(config, msg);
      renderAllLists();
    };
    reader.readAsText(file);
  });

  resetBlockedChannelsBtn.addEventListener('click', () => {
    if (confirm('Clear all Blocked channels?')) {
      config.blockedChannels = [];
      saveConfig(config, 'Cleared Blocked channels');
      renderAllLists();
    }
  });

  // -------------------------------------------------------------------------
  // Custom Blocked Keywords: Import / Export / Reset
  // -------------------------------------------------------------------------
  exportBlockedKeywordsBtn.addEventListener('click', () => {
    const jsonStr = JSON.stringify(config.blockedKeywords || [], null, 2);
    downloadFile(jsonStr, 'focusfeed-blocked-keywords.json');
    showToast('Exported Blocked keywords');
  });

  importBlockedKeywordsBtn.addEventListener('click', () => {
    importBlockedKeywordsFile.value = '';
    importBlockedKeywordsFile.click();
  });

  importBlockedKeywordsFile.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const items = parseImportedItems(evt.target.result, false);
      if (!items.length) {
        showToast('No valid keywords found in file');
        return;
      }
      if (!config.blockedKeywords) config.blockedKeywords = [];

      let addedCount = 0;
      items.forEach(newItem => {
        if (!config.blockedKeywords.some(k => getRuleTarget(k).toLowerCase() === newItem.name.toLowerCase())) {
          config.blockedKeywords.push(newItem);
          addedCount++;
        }
      });
      saveConfig(config, `Imported ${addedCount} keywords`);
      renderAllLists();
    };
    reader.readAsText(file);
  });

  resetBlockedKeywordsBtn.addEventListener('click', () => {
    if (confirm('Clear all Custom Blocked keywords?')) {
      config.blockedKeywords = [];
      saveConfig(config, 'Cleared Blocked keywords');
      renderAllLists();
    }
  });

  // =========================================================================
  // 8. Backup & Restore (JSON Export / Import)
  // =========================================================================

  // Export JSON
  exportJsonBtn.addEventListener('click', () => {
    const jsonStr = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focusfeed-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Configuration exported as JSON');
  });

  // Import JSON Trigger
  importJsonBtn.addEventListener('click', () => {
    importFileInput.value = '';
    importFileInput.click();
  });

  // Import JSON Handler
  importFileInput.addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (typeof imported !== 'object' || imported === null) {
          throw new Error('Invalid format');
        }

        // Validate and merge with defaults to ensure complete config structure
        const validatedConfig = {
          enabled: typeof imported.enabled === 'boolean' ? imported.enabled : DEFAULT_CONFIG.enabled,
          blockShorts: typeof imported.blockShorts === 'boolean' ? imported.blockShorts : DEFAULT_CONFIG.blockShorts,
          onlySearch: typeof imported.onlySearch === 'boolean' ? imported.onlySearch : DEFAULT_CONFIG.onlySearch,
          blockWatchSuggestions: typeof imported.blockWatchSuggestions === 'boolean' ? imported.blockWatchSuggestions : DEFAULT_CONFIG.blockWatchSuggestions,
          blockComments: typeof imported.blockComments === 'boolean' ? imported.blockComments : DEFAULT_CONFIG.blockComments,
          adSkip: typeof imported.adSkip === 'boolean' ? imported.adSkip : DEFAULT_CONFIG.adSkip,
          adFastForward: typeof imported.adFastForward === 'boolean' ? imported.adFastForward : DEFAULT_CONFIG.adFastForward,
          adFastForwardRate: typeof imported.adFastForwardRate === 'number' ? imported.adFastForwardRate : DEFAULT_CONFIG.adFastForwardRate,
          alwaysAllowChannels: Array.isArray(imported.alwaysAllowChannels) ? imported.alwaysAllowChannels : [],
          blockedChannels: Array.isArray(imported.blockedChannels) ? imported.blockedChannels : [],
          blockedKeywords: Array.isArray(imported.blockedKeywords) ? imported.blockedKeywords : [],
          fields: (imported.fields && typeof imported.fields === 'object') ? imported.fields : DEFAULT_FIELDS
        };

        saveConfig(validatedConfig, 'Backup restored successfully!');
        applyConfigToUI();
      } catch (err) {
        showToast('Error importing file: Invalid JSON format');
      }
    };
    reader.readAsText(file);
  });

  // Reset to Factory Defaults
  resetDefaultsBtn.addEventListener('click', () => {
    if (confirm('Reset all FocusFeed settings and rules to factory defaults?')) {
      config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      saveConfig(config, 'Reset to factory defaults');
      applyConfigToUI();
    }
  });

  // =========================================================================
  // 9. Initial Load & UI Population
  // =========================================================================
  function applyConfigToUI() {
    updateMasterToggleUI(config.enabled);
    toggleShorts.checked = Boolean(config.blockShorts);
    toggleOnlySearch.checked = Boolean(config.onlySearch);
    toggleWatchSuggestions.checked = Boolean(config.blockWatchSuggestions);
    toggleComments.checked = Boolean(config.blockComments);
    toggleAdSkip.checked = Boolean(config.adSkip);
    toggleAdFastForward.checked = Boolean(config.adFastForward);
    selectAdFfRate.value = String(config.adFastForwardRate || 4);

    renderFieldsList();
    renderAllLists();
    fetchTabStats();
  }

  function initPopup() {
    chrome.storage.local.get(DEFAULT_CONFIG, (stored) => {
      config = Object.assign({}, DEFAULT_CONFIG, stored);
      // Ensure fields exist and include any newly added default categories
      if (!config.fields || typeof config.fields !== 'object') {
        config.fields = JSON.parse(JSON.stringify(DEFAULT_FIELDS));
      } else {
        for (const [id, defaultField] of Object.entries(DEFAULT_FIELDS)) {
          if (!config.fields[id]) {
            config.fields[id] = JSON.parse(JSON.stringify(defaultField));
          }
        }
      }
      applyConfigToUI();
    });
  }

  // Run on popup open
  initPopup();

})();
