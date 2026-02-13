
import { RuleEngine } from '../src/core/rule-engine.js';

// Mock console.log to capture output
const originalLog = console.log;
let logs = [];
console.log = (...args) => {
    logs.push(args.join(' '));
    // originalLog(...args); // Uncomment to see logs in terminal
};

describe('Rule Engine Empty Field Optimization', () => {
    beforeEach(() => {
        logs = [];
    });

    afterAll(() => {
        console.log = originalLog;
    });

    test('should skip validation when author field is empty', () => {
        const rules = [
            {
                id: '1',
                name: 'Block John',
                enabled: true,
                site: '*',
                action: 'hide',
                conditions: [
                    { type: 'author', operator: 'equals', value: 'John Doe' }
                ]
            }
        ];

        const postData = {
            site: 'linkedin',
            author: '', // Empty author
            content: 'Some content'
        };

        const result = RuleEngine.evaluate(rules, postData);

        expect(result).toBeNull();
        // We expect NO log about "John Doe" or matching, but let's check if we can infer skipping
        // The implementation silently returns false for empty fields in core engine (to avoid noise),
        // but let's verify it didn't match.

        // If it attempted to match an empty string against "John Doe" with 'equals', 
        // it would fail anyway, but we want to ensure it fails FAST.
        // We can check this by spying on the matcher, but here we just verify correctness first.
    });

    test('should skip validation when content field is null', () => {
        const rules = [
            {
                id: '2',
                name: 'Block Spam',
                enabled: true,
                site: '*',
                action: 'hide',
                conditions: [
                    { type: 'content', operator: 'contains', value: 'spam' }
                ]
            }
        ];

        const postData = {
            site: 'linkedin',
            author: 'Jane Doe',
            content: null // Null content
        };

        const result = RuleEngine.evaluate(rules, postData);
        expect(result).toBeNull();
    });

    test('should still match when field is present', () => {
        const rules = [
            {
                id: '3',
                name: 'Block Bad Content',
                enabled: true,
                site: '*',
                action: 'hide',
                conditions: [
                    { type: 'content', operator: 'contains', value: 'bad' }
                ]
            }
        ];

        const postData = {
            site: 'linkedin',
            author: 'Jane Doe',
            content: 'This is bad content'
        };

        const result = RuleEngine.evaluate(rules, postData);
        expect(result).not.toBeNull();
        expect(result.id).toBe('3');
    });
});
