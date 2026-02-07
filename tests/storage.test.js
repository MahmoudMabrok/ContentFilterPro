/**
 * Tests for Storage utilities
 */
import { jest } from '@jest/globals';

describe('Storage', () => {
    let Storage;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Define Storage
        const STORAGE_KEYS = {
            RULES: 'cf_rules',
            SETTINGS: 'cf_settings',
            STATS: 'cf_stats'
        };

        Storage = {
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
                return result[STORAGE_KEYS.SETTINGS] || { enabled: true, theme: 'dark' };
            },

            async saveSettings(settings) {
                await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
            }
        };
    });

    describe('getRules', () => {
        test('should return empty array when no rules exist', async () => {
            const rules = await Storage.getRules();
            expect(rules).toEqual([]);
        });

        test('should call chrome.storage.local.get', async () => {
            await Storage.getRules();
            expect(chrome.storage.local.get).toHaveBeenCalled();
        });
    });

    describe('saveRules', () => {
        test('should save rules to storage', async () => {
            const testRules = [{ id: '1', name: 'Test Rule' }];
            await Storage.saveRules(testRules);
            expect(chrome.storage.local.set).toHaveBeenCalledWith({ cf_rules: testRules });
        });
    });

    describe('addRule', () => {
        test('should add a new rule', async () => {
            const newRule = { id: '1', name: 'New Rule', enabled: true };
            const result = await Storage.addRule(newRule);

            expect(result).toEqual(newRule);
            expect(chrome.storage.local.set).toHaveBeenCalled();
        });
    });

    describe('getSettings', () => {
        test('should return default settings when none exist', async () => {
            const settings = await Storage.getSettings();
            expect(settings).toEqual({ enabled: true, theme: 'dark' });
        });
    });

    describe('saveSettings', () => {
        test('should save settings to storage', async () => {
            const testSettings = { enabled: false, theme: 'light' };
            await Storage.saveSettings(testSettings);
            expect(chrome.storage.local.set).toHaveBeenCalledWith({ cf_settings: testSettings });
        });
    });
});
