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

            const matches = this.evaluateConditions(rule.conditions, postData, rule.conditionLogic || 'AND');

            if (matches) {
                return rule;
            }
        }

        return null;
    },

    /**
     * Evaluates rule conditions against post data.
     */
    evaluateConditions(conditions, postData, logic) {
        if (!conditions || conditions.length === 0) return false;

        if (logic === 'AND') {
            return conditions.every(condition => this.matchCondition(condition, postData));
        } else {
            return conditions.some(condition => this.matchCondition(condition, postData));
        }
    },

    /**
     * Matches a single condition against post data.
     */
    matchCondition(condition, postData) {
        const { type, operator, value } = condition;
        const postValue = postData[type];

        if (postValue === undefined || postValue === null) return false;

        const matcher = Matchers[operator];
        if (!matcher) return false;

        return matcher(postValue, value);
    }
};
