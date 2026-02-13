
import { RuleEngine } from '../src/core/rule-engine.js';
import { Operators } from '../src/core/filter-types.js';

// Mock console.log
const originalLog = console.log;
let logs = [];
console.log = (...args) => {
    logs.push(args.join(' '));
};

describe('Case-Sensitive Operators', () => {
    afterAll(() => {
        console.log = originalLog;
    });

    beforeEach(() => {
        logs = [];
    });

    // Helper to create a single-condition rule
    const createRule = (operator, value) => ({
        id: 'test-rule',
        name: 'Test Rule',
        enabled: true,
        site: '*',
        action: 'hide',
        conditions: [
            { type: 'content', operator, value }
        ]
    });

    describe('CONTAINS_EXACTLY', () => {
        const rule = createRule('contains_exactly', 'Crypto');

        test('should match exact case substring', () => {
            const result = RuleEngine.evaluate([rule], { content: 'This post is about Crypto currency.' });
            expect(result).not.toBeNull();
        });

        test('should NOT match different case substring', () => {
            const result = RuleEngine.evaluate([rule], { content: 'This post is about crypto currency.' });
            expect(result).toBeNull();
        });
    });

    describe('STARTS_WITH_EXACTLY', () => {
        const rule = createRule('starts_with_exactly', 'React');

        test('should match exact case prefix', () => {
            const result = RuleEngine.evaluate([rule], { content: 'React is a library.' });
            expect(result).not.toBeNull();
        });

        test('should NOT match different case prefix', () => {
            const result = RuleEngine.evaluate([rule], { content: 'react is a library.' });
            expect(result).toBeNull();
        });
    });

    describe('ENDS_WITH_EXACTLY', () => {
        const rule = createRule('ends_with_exactly', 'End.');

        test('should match exact case suffix', () => {
            const result = RuleEngine.evaluate([rule], { content: 'This is the End.' });
            expect(result).not.toBeNull();
        });

        test('should NOT match different case suffix', () => {
            const result = RuleEngine.evaluate([rule], { content: 'This is the end.' });
            expect(result).toBeNull();
        });
    });
});
