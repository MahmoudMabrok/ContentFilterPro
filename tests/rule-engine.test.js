/**
 * Tests for Rule Engine
 */

describe('RuleEngine', () => {
    let RuleEngine, Matchers;

    beforeEach(() => {
        // Define Matchers
        const Operators = {
            EQUALS: 'equals',
            CONTAINS: 'contains',
            STARTS_WITH: 'starts_with',
            ENDS_WITH: 'ends_with',
            MATCHES: 'matches'
        };

        Matchers = {
            [Operators.EQUALS]: (val, target) => val.toLowerCase() === target.toLowerCase(),
            [Operators.CONTAINS]: (val, target) => val.toLowerCase().includes(target.toLowerCase()),
            [Operators.STARTS_WITH]: (val, target) => val.toLowerCase().startsWith(target.toLowerCase()),
            [Operators.ENDS_WITH]: (val, target) => val.toLowerCase().endsWith(target.toLowerCase()),
            [Operators.MATCHES]: (val, target) => {
                try {
                    const regex = new RegExp(target, 'i');
                    return regex.test(val);
                } catch (e) {
                    return false;
                }
            }
        };

        // Define RuleEngine
        RuleEngine = {
            evaluate(rules, postData) {
                if (!rules || !Array.isArray(rules)) return null;

                for (const rule of rules) {
                    if (!rule.enabled) continue;
                    if (rule.site !== '*' && rule.site !== postData.site) continue;

                    const matches = this.evaluateConditions(rule.conditions, postData, rule.conditionLogic || 'AND');
                    if (matches) return rule;
                }
                return null;
            },

            evaluateConditions(conditions, postData, logic) {
                if (!conditions || conditions.length === 0) return false;

                if (logic === 'AND') {
                    return conditions.every(condition => this.matchCondition(condition, postData));
                } else {
                    return conditions.some(condition => this.matchCondition(condition, postData));
                }
            },

            matchCondition(condition, postData) {
                const { type, operator, value } = condition;
                const postValue = postData[type];

                if (postValue === undefined || postValue === null) return false;

                const matcher = Matchers[operator];
                if (!matcher) return false;

                return matcher(String(postValue), String(value));
            }
        };
    });

    describe('evaluate', () => {
        test('should return null for empty rules', () => {
            const postData = { site: 'linkedin', content: 'test' };
            expect(RuleEngine.evaluate([], postData)).toBeNull();
        });

        test('should return null for disabled rules', () => {
            const rules = [{
                id: '1',
                enabled: false,
                site: '*',
                conditions: [{ type: 'content', operator: 'contains', value: 'test' }]
            }];
            const postData = { site: 'linkedin', content: 'test content' };
            expect(RuleEngine.evaluate(rules, postData)).toBeNull();
        });

        test('should match rule with contains operator', () => {
            const rules = [{
                id: '1',
                enabled: true,
                site: '*',
                action: 'hide',
                conditions: [{ type: 'content', operator: 'contains', value: 'crypto' }],
                conditionLogic: 'AND'
            }];
            const postData = { site: 'linkedin', content: 'Check out this crypto opportunity!' };
            const result = RuleEngine.evaluate(rules, postData);
            expect(result).not.toBeNull();
            expect(result.id).toBe('1');
        });

        test('should not match when content does not contain keyword', () => {
            const rules = [{
                id: '1',
                enabled: true,
                site: '*',
                conditions: [{ type: 'content', operator: 'contains', value: 'crypto' }]
            }];
            const postData = { site: 'linkedin', content: 'Regular post content' };
            expect(RuleEngine.evaluate(rules, postData)).toBeNull();
        });

        test('should match site-specific rule', () => {
            const rules = [{
                id: '1',
                enabled: true,
                site: 'linkedin',
                conditions: [{ type: 'author', operator: 'equals', value: 'John Doe' }]
            }];
            const postData = { site: 'linkedin', author: 'John Doe' };
            expect(RuleEngine.evaluate(rules, postData)).not.toBeNull();
        });

        test('should not match rule for different site', () => {
            const rules = [{
                id: '1',
                enabled: true,
                site: 'facebook',
                conditions: [{ type: 'author', operator: 'equals', value: 'John Doe' }]
            }];
            const postData = { site: 'linkedin', author: 'John Doe' };
            expect(RuleEngine.evaluate(rules, postData)).toBeNull();
        });
    });

    describe('evaluateConditions with AND logic', () => {
        test('should match when all conditions are met', () => {
            const conditions = [
                { type: 'author', operator: 'equals', value: 'John Doe' },
                { type: 'content', operator: 'contains', value: 'crypto' }
            ];
            const postData = { site: 'linkedin', author: 'John Doe', content: 'crypto news' };
            expect(RuleEngine.evaluateConditions(conditions, postData, 'AND')).toBe(true);
        });

        test('should not match when one condition fails', () => {
            const conditions = [
                { type: 'author', operator: 'equals', value: 'John Doe' },
                { type: 'content', operator: 'contains', value: 'crypto' }
            ];
            const postData = { site: 'linkedin', author: 'Jane Smith', content: 'crypto news' };
            expect(RuleEngine.evaluateConditions(conditions, postData, 'AND')).toBe(false);
        });
    });

    describe('evaluateConditions with OR logic', () => {
        test('should match when at least one condition is met', () => {
            const conditions = [
                { type: 'author', operator: 'equals', value: 'John Doe' },
                { type: 'content', operator: 'contains', value: 'crypto' }
            ];
            const postData = { site: 'linkedin', author: 'Jane Smith', content: 'crypto news' };
            expect(RuleEngine.evaluateConditions(conditions, postData, 'OR')).toBe(true);
        });

        test('should not match when all conditions fail', () => {
            const conditions = [
                { type: 'author', operator: 'equals', value: 'John Doe' },
                { type: 'content', operator: 'contains', value: 'crypto' }
            ];
            const postData = { site: 'linkedin', author: 'Jane Smith', content: 'regular post' };
            expect(RuleEngine.evaluateConditions(conditions, postData, 'OR')).toBe(false);
        });
    });

    describe('matchCondition', () => {
        test('should match with equals operator', () => {
            const condition = { type: 'author', operator: 'equals', value: 'John Doe' };
            const postData = { author: 'John Doe' };
            expect(RuleEngine.matchCondition(condition, postData)).toBe(true);
        });

        test('should match with contains operator', () => {
            const condition = { type: 'content', operator: 'contains', value: 'crypto' };
            const postData = { content: 'Check out this crypto opportunity!' };
            expect(RuleEngine.matchCondition(condition, postData)).toBe(true);
        });

        test('should match with starts_with operator', () => {
            const condition = { type: 'content', operator: 'starts_with', value: 'AD:' };
            const postData = { content: 'AD: Special offer' };
            expect(RuleEngine.matchCondition(condition, postData)).toBe(true);
        });

        test('should match with ends_with operator', () => {
            const condition = { type: 'content', operator: 'ends_with', value: 'sponsored' };
            const postData = { content: 'This post is sponsored' };
            expect(RuleEngine.matchCondition(condition, postData)).toBe(true);
        });

        test('should match with regex operator', () => {
            const condition = { type: 'content', operator: 'matches', value: 'hiring.*AI' };
            const postData = { content: 'We are hiring for AI positions' };
            expect(RuleEngine.matchCondition(condition, postData)).toBe(true);
        });

        test('should be case insensitive', () => {
            const condition = { type: 'author', operator: 'equals', value: 'john doe' };
            const postData = { author: 'JOHN DOE' };
            expect(RuleEngine.matchCondition(condition, postData)).toBe(true);
        });

        test('should return false for missing field', () => {
            const condition = { type: 'author', operator: 'equals', value: 'John Doe' };
            const postData = { content: 'some content' };
            expect(RuleEngine.matchCondition(condition, postData)).toBe(false);
        });
    });
});
