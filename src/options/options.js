/**
 * Options page script - bundled version without ES6 imports
 */

(function () {
    'use strict';

    // ============================================================================
    // UTILITIES
    // ============================================================================
    const generateId = () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };

    // ============================================================================
    // STORAGE
    // ============================================================================
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
        },

        async getStats() {
            const result = await chrome.storage.local.get(STORAGE_KEYS.STATS);
            return result[STORAGE_KEYS.STATS] || { filteredCount: 0 };
        }
    };

    // ============================================================================
    // MAIN OPTIONS LOGIC
    // ============================================================================
    document.addEventListener('DOMContentLoaded', async () => {
        const rulesTbody = document.getElementById('rules-tbody');
        const noRulesMsg = document.getElementById('no-rules-msg');
        const addRuleBtn = document.getElementById('add-rule-btn');
        const ruleModal = document.getElementById('rule-modal');
        const ruleForm = document.getElementById('rule-form');
        const conditionsList = document.getElementById('conditions-list');
        const addConditionBtn = document.getElementById('add-condition-btn');
        const globalEnable = document.getElementById('global-enable');
        const totalFilteredStat = document.getElementById('total-filtered-stat');

        // Tab switching
        const navItems = document.querySelectorAll('.nav-item');
        const tabContents = document.querySelectorAll('.tab-content');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.getAttribute('data-tab');
                navItems.forEach(i => i.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                item.classList.add('active');
                document.getElementById(`${tab}-tab`).classList.add('active');
            });
        });

        // Load Rules
        const renderRules = async () => {
            const rules = await Storage.getRules();
            rulesTbody.innerHTML = '';

            if (rules.length === 0) {
                noRulesMsg.classList.remove('hidden');
            } else {
                noRulesMsg.classList.add('hidden');
                rules.forEach(rule => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
            <td>
              <label class="switch">
                <input type="checkbox" class="rule-toggle" data-id="${rule.id}" ${rule.enabled ? 'checked' : ''}>
                <span class="slider round"></span>
              </label>
            </td>
            <td>${rule.name}</td>
            <td><span class="badge">${rule.site === '*' ? 'All' : rule.site}</span></td>
            <td>${(rule.action === 'see_first' || rule.action === 'highlight') ? 'Highlight' : (rule.action || 'hide')}</td>
            <td>
              <button class="btn btn-secondary btn-sm edit-rule" data-id="${rule.id}">Edit</button>
              <button class="btn btn-secondary btn-sm share-rule" data-id="${rule.id}">Share</button>
              <button class="btn btn-danger btn-sm delete-rule" data-id="${rule.id}">Delete</button>
            </td>
          `;
                    rulesTbody.appendChild(tr);
                });
            }
        };

        // Rule Modal Logic
        const openModal = (rule = null) => {
            ruleModal.classList.add('active');
            if (rule) {
                document.getElementById('modal-title').textContent = 'Edit Rule';
                document.getElementById('rule-id').value = rule.id;
                document.getElementById('rule-name').value = rule.name;
                document.getElementById('rule-site').value = rule.site;
                document.getElementById('rule-action').value = (rule.action === 'see_first' ? 'highlight' : (rule.action || 'hide'));
                document.getElementById('rule-logic').value = rule.conditionLogic || 'AND';

                conditionsList.innerHTML = '';
                rule.conditions.forEach(cond => {
                    if (cond.type === 'group') {
                        addGroupRow(conditionsList, cond);
                    } else {
                        addConditionRow(conditionsList, cond);
                    }
                });
            } else {
                document.getElementById('modal-title').textContent = 'Create New Rule';
                ruleForm.reset();
                document.getElementById('rule-id').value = '';
                document.getElementById('rule-logic').value = 'AND';
                conditionsList.innerHTML = '';
                addConditionRow(conditionsList);
            }
        };

        const updateRulesDatalist = async () => {
            let datalist = document.getElementById('rules-datalist');
            if (!datalist) {
                datalist = document.createElement('datalist');
                datalist.id = 'rules-datalist';
                document.body.appendChild(datalist);
            }

            const rules = await Storage.getRules();
            datalist.innerHTML = '';
            rules.forEach(r => {
                const opt = document.createElement('option');
                opt.value = r.name;
                datalist.appendChild(opt);
            });
        };

        const addGroupRow = (parent, groupData = { logic: 'AND', conditions: [] }) => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'condition-group glass';
            groupDiv.dataset.type = 'group';

            groupDiv.innerHTML = `
                <div class="group-header">
                    <select class="group-logic glass-select">
                        <option value="AND" ${groupData.logic === 'AND' ? 'selected' : ''}>Match ALL (AND)</option>
                        <option value="OR" ${groupData.logic === 'OR' ? 'selected' : ''}>Match ANY (OR)</option>
                    </select>
                    <div class="group-actions">
                        <button type="button" class="btn btn-secondary btn-sm add-cond-to-group">+ Condition</button>
                        <button type="button" class="btn btn-danger btn-sm remove-group">&times;</button>
                    </div>
                </div>
                <div class="group-conditions-list"></div>
            `;

            const subConditionsList = groupDiv.querySelector('.group-conditions-list');

            // Add initial conditions if any
            if (groupData.conditions && groupData.conditions.length > 0) {
                groupData.conditions.forEach(cond => {
                    if (cond.type === 'group') {
                        addGroupRow(subConditionsList, cond);
                    } else {
                        addConditionRow(subConditionsList, cond);
                    }
                });
            } else {
                addConditionRow(subConditionsList);
            }

            parent.appendChild(groupDiv);

            // Group event listeners
            groupDiv.querySelector('.add-cond-to-group').addEventListener('click', () => addConditionRow(subConditionsList));
            groupDiv.querySelector('.remove-group').addEventListener('click', () => groupDiv.remove());

            updateRulesDatalist();
        };

        const addConditionRow = (parent, cond = { type: 'content', operator: 'contains', value: '' }) => {
            const row = document.createElement('div');
            row.className = 'condition-row';
            row.dataset.type = 'condition';
            row.innerHTML = `
        <select class="cond-type">
          <option value="author" ${cond.type === 'author' ? 'selected' : ''}>Author</option>
          <option value="content" ${cond.type === 'content' ? 'selected' : ''}>Content</option>
          <option value="linkedin_connection" ${cond.type === 'linkedin_connection' ? 'selected' : ''}>LinkedIn Connection</option>
          <option value="linkedin_job_title" ${cond.type === 'linkedin_job_title' ? 'selected' : ''}>LinkedIn Job Title</option>
          <option value="linkedin_promoted" ${cond.type === 'linkedin_promoted' ? 'selected' : ''}>LinkedIn Promoted</option>
          <option value="linkedin_feed_update" ${cond.type === 'linkedin_feed_update' ? 'selected' : ''}>LinkedIn Feed Update</option>
          <option value="reddit_subreddit" ${cond.type === 'reddit_subreddit' ? 'selected' : ''}>Reddit Subreddit</option>
          <option value="facebook_sponsored" ${cond.type === 'facebook_sponsored' ? 'selected' : ''}>Facebook Sponsored</option>
          <option value="rule" ${cond.type === 'rule' ? 'selected' : ''}>Rule (Compose)</option>
        </select>
        <select class="cond-operator">
          <option value="equals" ${cond.operator === 'equals' ? 'selected' : ''}>Equals</option>
          <option value="contains" ${cond.operator === 'contains' ? 'selected' : ''}>Contains</option>
          <option value="contains_exactly" ${cond.operator === 'contains_exactly' ? 'selected' : ''}>Contains (Exact Case)</option>
          <option value="starts_with" ${cond.operator === 'starts_with' ? 'selected' : ''}>Starts With</option>
          <option value="starts_with_exactly" ${cond.operator === 'starts_with_exactly' ? 'selected' : ''}>Starts With (Exact Case)</option>
          <option value="ends_with" ${cond.operator === 'ends_with' ? 'selected' : ''}>Ends With</option>
          <option value="ends_with_exactly" ${cond.operator === 'ends_with_exactly' ? 'selected' : ''}>Ends With (Exact Case)</option>
          <option value="not_equal" ${cond.operator === 'not_equal' ? 'selected' : ''}>Not Equals</option>
          <option value="not_contains" ${cond.operator === 'not_contains' ? 'selected' : ''}>Not Contains</option>
          <option value="matches" ${cond.operator === 'matches' ? 'selected' : ''}>Regex</option>
        </select>
        <input type="text" class="cond-value" value="${cond.value}" placeholder="Value" list="rules-datalist" required>
        <button type="button" class="btn btn-danger btn-sm remove-cond">&times;</button>
      `;
            parent.appendChild(row);
            updateRulesDatalist();
        };

        const collectConditions = (container) => {
            const items = Array.from(container.children);
            return items.map(item => {
                if (item.classList.contains('condition-group')) {
                    return {
                        type: 'group',
                        logic: item.querySelector('.group-logic').value,
                        conditions: collectConditions(item.querySelector('.group-conditions-list'))
                    };
                } else if (item.classList.contains('condition-row')) {
                    return {
                        type: item.querySelector('.cond-type').value,
                        operator: item.querySelector('.cond-operator').value,
                        value: item.querySelector('.cond-value').value
                    };
                }
            }).filter(i => i !== undefined);
        };

        // Event Listeners
        addRuleBtn.addEventListener('click', () => openModal());
        addConditionBtn.addEventListener('click', () => addConditionRow(conditionsList));

        // Add "Add Group" button to modal
        const addGroupBtn = document.createElement('button');
        addGroupBtn.type = 'button';
        addGroupBtn.id = 'add-group-btn';
        addGroupBtn.className = 'btn btn-secondary btn-sm';
        addGroupBtn.style.marginLeft = '8px';
        addGroupBtn.textContent = '+ Add Group';
        addConditionBtn.parentNode.insertBefore(addGroupBtn, addConditionBtn.nextSibling);

        addGroupBtn.addEventListener('click', () => addGroupRow(conditionsList));

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => ruleModal.classList.remove('active'));
        });

        conditionsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-cond')) {
                e.target.closest('.condition-row').remove();
            }
        });

        ruleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('rule-id').value || generateId();
            const name = document.getElementById('rule-name').value;
            const site = document.getElementById('rule-site').value;
            const action = document.getElementById('rule-action').value;
            const conditionLogic = document.getElementById('rule-logic').value;

            const conditions = collectConditions(conditionsList);

            const rule = { id, name, site, action, conditions, conditionLogic, enabled: true };

            if (document.getElementById('rule-id').value) {
                await Storage.updateRule(rule);
            } else {
                await Storage.addRule(rule);
            }

            ruleModal.classList.remove('active');
            renderRules();
        });

        rulesTbody.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (e.target.classList.contains('delete-rule')) {
                if (confirm('Are you sure you want to delete this rule?')) {
                    await Storage.deleteRule(id);
                    renderRules();
                }
            } else if (e.target.classList.contains('edit-rule')) {
                const rules = await Storage.getRules();
                const rule = rules.find(r => r.id === id);
                openModal(rule);
            } else if (e.target.classList.contains('share-rule')) {
                const rules = await Storage.getRules();
                const rule = rules.find(r => r.id === id);
                exportRule(rule);
            } else if (e.target.classList.contains('rule-toggle')) {
                const rules = await Storage.getRules();
                const rule = rules.find(r => r.id === id);
                rule.enabled = e.target.checked;
                await Storage.updateRule(rule);
            }
        });

        // Settings
        const settings = await Storage.getSettings();
        globalEnable.checked = settings.enabled;
        globalEnable.addEventListener('change', async () => {
            settings.enabled = globalEnable.checked;
            await Storage.saveSettings(settings);
        });

        const hidePromoted = document.getElementById('hide-promoted');
        hidePromoted.checked = settings.hidePromoted || false;
        hidePromoted.addEventListener('change', async () => {
            settings.hidePromoted = hidePromoted.checked;
            await Storage.saveSettings(settings);
        });

        const hideFeedUpdates = document.getElementById('hide-feed-updates');
        hideFeedUpdates.checked = settings.hideFeedUpdates || false;
        hideFeedUpdates.addEventListener('change', async () => {
            settings.hideFeedUpdates = hideFeedUpdates.checked;
            await Storage.saveSettings(settings);
        });



        // Stats
        const stats = await Storage.getStats();
        totalFilteredStat.textContent = stats.filteredCount || 0;
        document.getElementById('linkedin-stat').textContent = stats.linkedin || 0;
        document.getElementById('facebook-stat').textContent = stats.facebook || 0;
        document.getElementById('reddit-stat').textContent = stats.reddit || 0;

        // Maintenance Logic
        const exportBackupBtn = document.getElementById('export-backup-btn');
        const importBackupBtn = document.getElementById('import-backup-btn');
        const backupFileInput = document.getElementById('backup-file-input');
        const importRuleBtn = document.getElementById('import-rule-btn');
        const ruleFileInput = document.getElementById('rule-file-input');

        const downloadJson = (data, filename) => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        };

        const exportRule = (rule) => {
            downloadJson(rule, `rule-${rule.name.replace(/\s+/g, '-').toLowerCase()}.json`);
        };

        exportBackupBtn.addEventListener('click', async () => {
            const rules = await Storage.getRules();
            const settings = await Storage.getSettings();
            const stats = await Storage.getStats();
            const backup = {
                version: '1.2.1',
                timestamp: new Date().toISOString(),
                [STORAGE_KEYS.RULES]: rules,
                [STORAGE_KEYS.SETTINGS]: settings,
                [STORAGE_KEYS.STATS]: stats
            };
            downloadJson(backup, `content-filter-pro-backup-${new Date().toISOString().split('T')[0]}.json`);
        });

        importBackupBtn.addEventListener('click', () => backupFileInput.click());

        backupFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const backup = JSON.parse(event.target.result);
                    if (confirm('This will overwrite all your current rules and settings. Are you sure?')) {
                        if (backup[STORAGE_KEYS.RULES]) await Storage.saveRules(backup[STORAGE_KEYS.RULES]);
                        if (backup[STORAGE_KEYS.SETTINGS]) await Storage.saveSettings(backup[STORAGE_KEYS.SETTINGS]);
                        // Optionally update stats too
                        if (backup[STORAGE_KEYS.STATS]) {
                            await chrome.storage.local.set({ [STORAGE_KEYS.STATS]: backup[STORAGE_KEYS.STATS] });
                        }
                        alert('Backup restored successfully!');
                        window.location.reload();
                    }
                } catch (err) {
                    alert('Failed to restore backup: Invalid file format.');
                    console.error(err);
                }
            };
            reader.readAsText(file);
        });

        importRuleBtn.addEventListener('click', () => ruleFileInput.click());

        ruleFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const rule = JSON.parse(event.target.result);
                    // Basic validation
                    if (!rule.name || !rule.conditions) {
                        throw new Error('Invalid rule format');
                    }

                    // Assign new ID to avoid conflicts
                    rule.id = generateId();
                    await Storage.addRule(rule);
                    alert(`Rule "${rule.name}" imported successfully!`);
                    renderRules();
                } catch (err) {
                    alert('Failed to import rule: Invalid file format.');
                    console.error(err);
                }
            };
            reader.readAsText(file);
        });

        // Initial Render
        renderRules();
    });

})();
