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
        if (!rules || !Array.isArray(rules)) return null;

        for (const rule of rules) {
            if (!rule.enabled) continue;

            // Check if rule applies to this site
            if (rule.site !== '*' && rule.site !== postData.site) continue;

            // Track current rule to avoid circular dependencies
            const evaluationData = { ...postData, currentRuleId: rule.id };
            const matches = this.evaluateConditions(rule.conditions, evaluationData, rule.conditionLogic || 'AND', rules);

            if (matches) {
                return rule;
            }
        }

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

        if (postValue === undefined || postValue === null) return false;

        const matcher = Matchers[operator];
        if (!matcher) return false;

        return matcher(postValue, value);
    }
};
