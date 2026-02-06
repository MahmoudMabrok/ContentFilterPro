/**
 * Background service worker for the Content Filter extension.
 */

chrome.runtime.onInstalled.addListener(() => {
    console.log('Content Filter Pro installed');

    // Initialize default settings if not present
    chrome.storage.local.get(['cf_settings', 'cf_rules'], (result) => {
        if (!result.cf_settings) {
            chrome.storage.local.set({
                cf_settings: { enabled: true, theme: 'dark' }
            });
        }
        if (!result.cf_rules) {
            chrome.storage.local.set({ cf_rules: [] });
        }
    });
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getStats') {
        chrome.storage.local.get('cf_stats', (result) => {
            sendResponse(result.cf_stats || { filteredCount: 0 });
        });
        return true; // Keep channel open for async response
    }
});
