import { Matchers } from './filter-types.js';

/**
 * Core engine for evaluating rules against post data.
 */
export const RuleEngine = {
    /**
     * Evaluates a list of rules against a post's data.
     * @param {Array} rules - List of rules to evaluate.
     * @param {Object} postData - Data extracted from a post (author, content, etc.).
     * @returns {Object|null} - The first matching rule or null.
     */
    evaluate(rules, postData) {
        if (!rules || !Array.isArray(rules)) {
            console.log('[RuleEngine] No rules provided or invalid rules array');
            return null;
        }

        console.log(`[RuleEngine] Evaluating ${rules.length} rules against post by "${postData.author || 'unknown'}"`);

        for (const rule of rules) {
            if (!rule.enabled) {
                console.log(`[RuleEngine] Rule "${rule.name}" (${rule.id}) is disabled, skipping`);
                continue;
            }

            // Check if rule applies to this site
            if (rule.site !== '*' && rule.site !== postData.site) {
                console.log(`[RuleEngine] Rule "${rule.name}" (${rule.id}) site "${rule.site}" doesn't match post site "${postData.site}", skipping`);
                continue;
            }

            // Track current rule to avoid circular dependencies
            const evaluationData = { ...postData, currentRuleId: rule.id };
            const matches = this.evaluateConditions(rule.conditions, evaluationData, rule.conditionLogic || 'AND', rules);

            if (matches) {
                console.log(`[RuleEngine] ✅ Rule "${rule.name}" (${rule.id}) MATCHED — action: ${rule.action || 'hide'}`);
                return rule;
            } else {
                console.log(`[RuleEngine] Rule "${rule.name}" (${rule.id}) did not match`);
            }
        }

        console.log('[RuleEngine] No rules matched for this post');
        return null;
    },

    /**
     * Evaluates rule conditions against post data.
     */
    evaluateConditions(conditions, postData, logic, allRules = []) {
        if (!conditions || conditions.length === 0) return false;

        if (logic === 'AND') {
            return conditions.every(condition => this.matchCondition(condition, postData, allRules));
        } else {
            return conditions.some(condition => this.matchCondition(condition, postData, allRules));
        }
    },

    /**
     * Matches a single condition against post data.
     */
    matchCondition(condition, postData, allRules = []) {
        const { type, operator, value } = condition;

        // Handle rule composability
        if (type === 'rule') {
            const subRule = allRules.find(r => r.id === value || r.name === value);
            if (!subRule || subRule.id === postData.currentRuleId) return false; // Avoid infinite loops

            // Evaluate sub-rule
            const matches = this.evaluateConditions(subRule.conditions, postData, subRule.conditionLogic || 'AND', allRules);
            return matches;
        }

        // Handle nested groups
        if (type === 'group') {
            return this.evaluateConditions(condition.conditions, postData, condition.logic || 'AND', allRules);
        }

        const postValue = postData[type];

        // Skip validation if the field is empty (null, undefined, or empty string)
        if (postValue === undefined || postValue === null || postValue === '') {
            // Only log if we have a logging mechanism, otherwise silently skip
            // Console logging might be too verbose here for the core engine if called frequently
            return false;
        }

        const matcher = Matchers[operator];
        if (!matcher) return false;

        return matcher(postValue, value);
    }
};
