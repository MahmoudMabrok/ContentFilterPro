import { RuleEngine } from '../src/core/rule-engine.js';

/**
 * Tests for Rule Engine
 */

describe('RuleEngine', () => {

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

    describe('Multiple Rules', () => {
        test('should return the first matching rule', () => {
            const rules = [
                {
                    id: '1',
                    enabled: true,
                    site: '*',
                    conditions: [{ type: 'content', operator: 'contains', value: 'first' }]
                },
                {
                    id: '2',
                    enabled: true,
                    site: '*',
                    conditions: [{ type: 'content', operator: 'contains', value: 'second' }]
                }
            ];
            const postData = { site: 'linkedin', content: 'this is the first and second' };
            const result = RuleEngine.evaluate(rules, postData);
            expect(result).not.toBeNull();
            expect(result.id).toBe('1');
        });

        test('should skip non-matching and return the first matching rule', () => {
            const rules = [
                {
                    id: '1',
                    enabled: true,
                    site: '*',
                    conditions: [{ type: 'content', operator: 'contains', value: 'not-matching' }]
                },
                {
                    id: '2',
                    enabled: true,
                    site: '*',
                    conditions: [{ type: 'content', operator: 'contains', value: 'matching' }]
                }
            ];
            const postData = { site: 'linkedin', content: 'this is matching' };
            const result = RuleEngine.evaluate(rules, postData);
            expect(result).not.toBeNull();
            expect(result.id).toBe('2');
        });

        test('should return null if no rules match', () => {
            const rules = [
                {
                    id: '1',
                    enabled: true,
                    site: '*',
                    conditions: [{ type: 'content', operator: 'contains', value: 'a' }]
                },
                {
                    id: '2',
                    enabled: true,
                    site: '*',
                    conditions: [{ type: 'content', operator: 'contains', value: 'b' }]
                }
            ];
            const postData = { site: 'linkedin', content: 'c' };
            expect(RuleEngine.evaluate(rules, postData)).toBeNull();
        });

        test('should skip disabled matching rules', () => {
            const rules = [
                {
                    id: '1',
                    enabled: false,
                    site: '*',
                    conditions: [{ type: 'content', operator: 'contains', value: 'test' }]
                },
                {
                    id: '2',
                    enabled: true,
                    site: '*',
                    conditions: [{ type: 'content', operator: 'contains', value: 'test' }]
                }
            ];
            const postData = { site: 'linkedin', content: 'test content' };
            const result = RuleEngine.evaluate(rules, postData);
            expect(result).not.toBeNull();
            expect(result.id).toBe('2');
        });

        test('should respect site field when evaluating multiple rules', () => {
            const rules = [
                {
                    id: 'linkedin-only',
                    enabled: true,
                    site: 'linkedin',
                    conditions: [{ type: 'content', operator: 'contains', value: 'test' }]
                },
                {
                    id: 'any-site',
                    enabled: true,
                    site: '*',
                    conditions: [{ type: 'content', operator: 'contains', value: 'test' }]
                }
            ];

            const facebookPost = { site: 'facebook', content: 'test content' };
            const fbResult = RuleEngine.evaluate(rules, facebookPost);
            expect(fbResult.id).toBe('any-site');

            const linkedinPost = { site: 'linkedin', content: 'test content' };
            const liResult = RuleEngine.evaluate(rules, linkedinPost);
            expect(liResult.id).toBe('linkedin-only');
        });
    });

    describe('evaluateConditions', () => {
        test('should match when all conditions are met (AND)', () => {
            const conditions = [
                { type: 'author', operator: 'equals', value: 'John Doe' },
                { type: 'content', operator: 'contains', value: 'crypto' }
            ];
            const postData = { site: 'linkedin', author: 'John Doe', content: 'crypto news' };
            expect(RuleEngine.evaluateConditions(conditions, postData, 'AND')).toBe(true);
        });

        test('should not match when one condition fails (AND)', () => {
            const conditions = [
                { type: 'author', operator: 'equals', value: 'John Doe' },
                { type: 'content', operator: 'contains', value: 'crypto' }
            ];
            const postData = { site: 'linkedin', author: 'Jane Smith', content: 'crypto news' };
            expect(RuleEngine.evaluateConditions(conditions, postData, 'AND')).toBe(false);
        });

        test('should match when at least one condition is met (OR)', () => {
            const conditions = [
                { type: 'author', operator: 'equals', value: 'John Doe' },
                { type: 'content', operator: 'contains', value: 'crypto' }
            ];
            const postData = { site: 'linkedin', author: 'Jane Smith', content: 'crypto news' };
            expect(RuleEngine.evaluateConditions(conditions, postData, 'OR')).toBe(true);
        });
    });

    describe('matchCondition', () => {
        test('should match with various operators', () => {
            expect(RuleEngine.matchCondition({ type: 'author', operator: 'equals', value: 'John Doe' }, { author: 'John Doe' })).toBe(true);
            expect(RuleEngine.matchCondition({ type: 'content', operator: 'contains', value: 'crypto' }, { content: 'Check out this crypto' })).toBe(true);
            expect(RuleEngine.matchCondition({ type: 'content', operator: 'starts_with', value: 'Ad:' }, { content: 'ad: Special offer' })).toBe(true);
            expect(RuleEngine.matchCondition({ type: 'content', operator: 'ends_with', value: 'sponsored' }, { content: 'This post is SPONSORED' })).toBe(true);
            expect(RuleEngine.matchCondition({ type: 'content', operator: 'matches', value: 'hiring.*AI' }, { content: 'We are hiring for AI positions' })).toBe(true);
        });

        test('should return false for missing field', () => {
            const condition = { type: 'author', operator: 'equals', value: 'John Doe' };
            const postData = { content: 'some content' };
            expect(RuleEngine.matchCondition(condition, postData)).toBe(false);
        });
    });
});

