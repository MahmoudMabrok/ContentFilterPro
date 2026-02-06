/**
 * Popup script - bundled version without ES6 imports
 */

(function () {
    'use strict';

    // Storage utilities
    const STORAGE_KEYS = {
        RULES: 'cf_rules',
        SETTINGS: 'cf_settings',
        STATS: 'cf_stats'
    };

    const Storage = {
        async getRules() {
            const result = await chrome.storage.local.get(STORAGE_KEYS.RULES);
            return result[STORAGE_KEYS.RULES] || [];
        },

        async getSettings() {
            const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
            return result[STORAGE_KEYS.SETTINGS] || { enabled: true, theme: 'dark' };
        },

        async saveSettings(settings) {
            await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
        },

        async getStats() {
            const result = await chrome.storage.local.get(STORAGE_KEYS.STATS);
            return result[STORAGE_KEYS.STATS] || { filteredCount: 0 };
        }
    };

    // Main popup logic
    document.addEventListener('DOMContentLoaded', async () => {
        const extensionToggle = document.getElementById('extension-toggle');
        const filteredCountEl = document.getElementById('filtered-count');
        const currentSiteEl = document.getElementById('current-site');
        const addRuleBtn = document.getElementById('add-rule-btn');
        const openOptionsBtn = document.getElementById('open-options-btn');

        // Load initial state
        const settings = await Storage.getSettings();
        const stats = await Storage.getStats();

        extensionToggle.checked = settings.enabled;
        filteredCountEl.textContent = stats.filteredCount;



        // Detect current site
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
            const url = new URL(tab.url);
            const hostname = url.hostname.replace('www.', '');
            currentSiteEl.textContent = hostname;
        }

        // Event Listeners
        extensionToggle.addEventListener('change', async () => {
            settings.enabled = extensionToggle.checked;
            await Storage.saveSettings(settings);
        });

        addRuleBtn.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });

        openOptionsBtn.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });
    });

})();
