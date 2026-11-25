/**
 * FocusFeed Android Chrome Extension API Polyfill (android-bridge.js)
 * Bridges chrome.storage, chrome.runtime, chrome.tabs, and file exports
 * to native Android SharedPreferences and Activity hooks via window.FocusFeedAndroid.
 */
(function () {
  'use strict';

  if (window.__ffBridgeInitialized) return;
  window.__ffBridgeInitialized = true;

  const storageListeners = [];
  const runtimeListeners = [];

  function readAllStorage() {
    try {
      if (window.FocusFeedAndroid && typeof window.FocusFeedAndroid.getStorageJson === 'function') {
        const raw = window.FocusFeedAndroid.getStorageJson();
        return raw ? JSON.parse(raw) : {};
      }
    } catch (e) {
      console.warn('[FocusFeed Bridge] readAllStorage error:', e);
    }
    return {};
  }

  function writeStoragePatch(patchObj) {
    try {
      if (window.FocusFeedAndroid && typeof window.FocusFeedAndroid.setStorageJson === 'function') {
        window.FocusFeedAndroid.setStorageJson(JSON.stringify(patchObj));
      }
    } catch (e) {
      console.warn('[FocusFeed Bridge] writeStoragePatch error:', e);
    }
  }

  window.chrome = window.chrome || {};

  window.chrome.storage = {
    local: {
      get: function (keys, callback) {
        const all = readAllStorage();
        let result = {};

        if (keys === null || keys === undefined) {
          result = Object.assign({}, all);
        } else if (typeof keys === 'string') {
          if (Object.prototype.hasOwnProperty.call(all, keys)) {
            result[keys] = all[keys];
          }
        } else if (Array.isArray(keys)) {
          keys.forEach(function (k) {
            if (Object.prototype.hasOwnProperty.call(all, k)) {
              result[k] = all[k];
            }
          });
        } else if (typeof keys === 'object') {
          result = Object.assign({}, keys);
          Object.keys(keys).forEach(function (k) {
            if (Object.prototype.hasOwnProperty.call(all, k)) {
              result[k] = all[k];
            }
          });
        }

        if (typeof callback === 'function') {
          setTimeout(function () {
            callback(result);
          }, 0);
        }
      },

      set: function (items, callback) {
        if (!items || typeof items !== 'object') {
          if (typeof callback === 'function') callback();
          return;
        }
        const prev = readAllStorage();
        writeStoragePatch(items);

        const changes = {};
        Object.keys(items).forEach(function (key) {
          changes[key] = {
            oldValue: prev[key],
            newValue: items[key]
          };
        });

        storageListeners.forEach(function (listener) {
          try {
            listener(changes, 'local');
          } catch (_) {}
        });

        if (typeof callback === 'function') {
          setTimeout(callback, 0);
        }
      }
    },

    onChanged: {
      addListener: function (fn) {
        if (typeof fn === 'function' && storageListeners.indexOf(fn) === -1) {
          storageListeners.push(fn);
        }
      }
    }
  };

  window.chrome.runtime = {
    lastError: null,
    onMessage: {
      addListener: function (fn) {
        if (typeof fn === 'function' && runtimeListeners.indexOf(fn) === -1) {
          runtimeListeners.push(fn);
        }
      }
    },
    sendMessage: function (msg, callback) {
      if (typeof callback === 'function') {
        callback(null);
      }
    }
  };

  window.chrome.tabs = {
    query: function (queryInfo, callback) {
      let stats = { url: 'https://m.youtube.com/' };
      try {
        if (window.FocusFeedAndroid && typeof window.FocusFeedAndroid.getStatsJson === 'function') {
          stats = JSON.parse(window.FocusFeedAndroid.getStatsJson() || '{}');
        }
      } catch (_) {}

      if (typeof callback === 'function') {
        callback([{ id: 1, url: stats.url || 'https://m.youtube.com/' }]);
      }
    },

    sendMessage: function (tabId, message, callback) {
      if (message && message.action === 'GET_STATS') {
        let stats = { hiddenCount: 0, visibleCount: 0, totalCards: 0, url: 'https://m.youtube.com/' };
        try {
          if (window.FocusFeedAndroid && typeof window.FocusFeedAndroid.getStatsJson === 'function') {
            stats = JSON.parse(window.FocusFeedAndroid.getStatsJson() || '{}');
          }
        } catch (_) {}

        if (typeof callback === 'function') {
          callback(stats);
        }
        return;
      }
      if (typeof callback === 'function') callback(null);
    }
  };

  // Synchronous Blob + <a download> export interceptor for Android WebView Settings screen
  const OrigBlob = window.Blob;
  if (typeof OrigBlob === 'function') {
    window.Blob = function (parts, options) {
      const instance = new OrigBlob(parts, options);
      try {
        if (Array.isArray(parts)) {
          instance.__ffRawText = parts.map(function (p) {
            return typeof p === 'string' ? p : String(p);
          }).join('');
        }
      } catch (_) {}
      return instance;
    };
    window.Blob.prototype = OrigBlob.prototype;
  }

  const blobContentMap = new Map();
  if (typeof window.URL !== 'undefined' && typeof window.URL.createObjectURL === 'function') {
    const origCreateObjectURL = window.URL.createObjectURL.bind(window.URL);
    window.URL.createObjectURL = function (blob) {
      const fakeUrl = origCreateObjectURL(blob);
      if (blob && typeof blob.__ffRawText === 'string') {
        blobContentMap.set(fakeUrl, blob.__ffRawText);
      }
      return fakeUrl;
    };

    const origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (
        this.download &&
        this.href &&
        window.FocusFeedAndroid &&
        typeof window.FocusFeedAndroid.requestExportFile === 'function'
      ) {
        const filename = this.download || 'focusfeed_export.json';
        const content = blobContentMap.get(this.href);
        if (typeof content === 'string') {
          window.FocusFeedAndroid.requestExportFile(filename, content);
          return;
        }
      }
      return origClick.apply(this, arguments);
    };
  }
})();
