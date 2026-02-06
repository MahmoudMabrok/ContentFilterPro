/**
 * Chrome storage wrapper for rule management.
 */

const STORAGE_KEYS = {
    RULES: 'cf_rules',
    SETTINGS: 'cf_settings',
    STATS: 'cf_stats'
};

export const Storage = {
    async getRules() {
        const result = await chrome.storage.local.get(STORAGE_KEYS.RULES);
        return result[STORAGE_KEYS.RULES] || [];
    },

    async saveRules(rules) {
        await chrome.storage.local.set({ [STORAGE_KEYS.RULES]: rules });
    },

    async addRule(rule) {
        const rules = await this.getRules();
        rules.push(rule);
        await this.saveRules(rules);
        return rule;
    },

    async updateRule(updatedRule) {
        const rules = await this.getRules();
        const index = rules.findIndex(r => r.id === updatedRule.id);
        if (index !== -1) {
            rules[index] = updatedRule;
            await this.saveRules(rules);
        }
    },

    async deleteRule(ruleId) {
        const rules = await this.getRules();
        const filteredRules = rules.filter(r => r.id !== ruleId);
        await this.saveRules(filteredRules);
    },

    async getSettings() {
        const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return result[STORAGE_KEYS.SETTINGS] || {
            enabled: true,
            theme: 'dark'
        };
    },

    async saveSettings(settings) {
        await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
    },

    async getStats() {
        const result = await chrome.storage.local.get(STORAGE_KEYS.STATS);
        return result[STORAGE_KEYS.STATS] || {
            filteredCount: 0,
            linkedin: 0,
            facebook: 0,
            reddit: 0
        };
    },

    async updateStats(counts) {
        if (!counts || Object.keys(counts).length === 0) return;

        const stats = await this.getStats();
        let totalIncrement = 0;

        for (const [site, count] of Object.entries(counts)) {
            stats[site] = (stats[site] || 0) + count;
            totalIncrement += count;
        }

        stats.filteredCount = (stats.filteredCount || 0) + totalIncrement;
        await chrome.storage.local.set({ [STORAGE_KEYS.STATS]: stats });
    },

    async incrementFilteredCount() {
        // Legacy support, but we should use updateStats
        const stats = await this.getStats();
        stats.filteredCount += 1;
        await chrome.storage.local.set({ [STORAGE_KEYS.STATS]: stats });
    }
};
