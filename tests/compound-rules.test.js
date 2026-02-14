/**
 * Tests for Compound Rules and LinkedIn Job Title extraction
 */
import { jest } from '@jest/globals';
import { LinkedInAdapter } from '../src/adapters/linkedin-adapter.js';
import { RuleEngine } from '../src/core/rule-engine.js';
import { Matchers } from '../src/core/filter-types.js';

describe('Compound Rules and LinkedIn Job Title', () => {
    describe('LinkedInAdapter Job Title Extraction', () => {
        test('should extract job title from LinkedIn post', () => {
            const adapter = new LinkedInAdapter();
            const mockEl = {
                querySelector: (selector) => {
                    if (selector.includes('actor__name')) return { textContent: 'Ahmed' };
                    if (selector.includes('actor__description')) return { textContent: 'HR Manager at Google' };
                    if (selector.includes('update-v2__description')) return { textContent: 'Hiring now!' };
                    return null;
                }
            };
            const data = adapter.extractPostData(mockEl);
            expect(data.linkedin_job_title).toBe('HR Manager at Google');
            expect(data.author).toBe('Ahmed');
        });
    });

    describe('RuleEngine Composability', () => {
        const rules = [
            {
                id: '1',
                name: 'HR Role',
                enabled: true,
                site: 'facebook', // Set to facebook so it doesn't match linkedin posts
                conditions: [{ type: 'linkedin_job_title', operator: 'contains', value: 'HR' }]
            },
            {
                id: '2',
                name: 'Ahmed',
                enabled: true,
                site: '*',
                conditions: [{ type: 'author', operator: 'equals', value: 'Ahmed' }]
            },
            {
                id: '3',
                name: 'Ahmed as HR',
                enabled: true,
                site: '*',
                conditionLogic: 'AND',
                conditions: [
                    { type: 'rule', value: 'HR Role' },
                    { type: 'rule', value: 'Ahmed' }
                ]
            }
        ];

        test('should match compound rule with AND logic', () => {
            const postData = {
                site: 'linkedin',
                author: 'Ahmed',
                linkedin_job_title: 'HR Manager',
                content: 'Test content'
            };
            // Ahmed matches rule 2, and HR matches rule 1 (but rule 1 is site:facebook).
            // So only rule 2 and rule 3 are candidates. Rule 2 is before rule 3.
            // Let's swap them or make rule 2 more specific.
            const swappedRules = [rules[0], rules[2], rules[1]];
            const result = RuleEngine.evaluate(swappedRules, postData);
            expect(result).not.toBeNull();
            expect(result.id).toBe('3');
        });

        test('should match sub-rule when compound rule fails', () => {
            const postData = {
                site: 'facebook', // Matches rule 1
                author: 'Jane',
                linkedin_job_title: 'HR Manager',
                content: 'Test content'
            };
            const result = RuleEngine.evaluate(rules, postData);
            expect(result).not.toBeNull();
            expect(result.id).toBe('1');
        });

        test('should avoid infinite loops in circular rules', () => {
            const circularRules = [
                {
                    id: 'loop-1',
                    name: 'Loop 1',
                    enabled: true,
                    site: '*',
                    conditions: [{ type: 'rule', value: 'Loop 2' }]
                },
                {
                    id: 'loop-2',
                    name: 'Loop 2',
                    enabled: true,
                    site: '*',
                    conditions: [{ type: 'rule', value: 'Loop 1' }]
                }
            ];
            const postData = { site: 'linkedin', author: 'Ahmed' };
            const result = RuleEngine.evaluate(circularRules, postData);
            expect(result).toBeNull(); // Should break loop and return null
        });
    });

    describe('RuleEngine Nested Groups', () => {
        const rules = [
            {
                id: 'group-rule-1',
                name: 'Group Rule',
                enabled: true,
                site: '*',
                conditionLogic: 'OR',
                conditions: [
                    {
                        type: 'group',
                        logic: 'AND',
                        conditions: [
                            { type: 'linkedin_job_title', operator: 'contains', value: 'HR' },
                            { type: 'author', operator: 'equals', value: 'Ahmed' }
                        ]
                    },
                    {
                        type: 'group',
                        logic: 'AND',
                        conditions: [
                            { type: 'linkedin_job_title', operator: 'contains', value: 'CEO' },
                            { type: 'author', operator: 'equals', value: 'Mahmoud' }
                        ]
                    }
                ]
            }
        ];

        test('should match first group (HR Ahmed)', () => {
            const postData = {
                site: 'linkedin',
                author: 'Ahmed',
                linkedin_job_title: '​Transforming Child Healthcare through Media & Medicine | Pediatric Consultant | 15 Years in ER | 1M+ YouTube Subscribers | Future Talk Show Host​Transforming Child Healthcare through Media & Medicine | Pediatric Consultant | 15 Years in ER | 1M+ YouTube Subscribers | Future Talk Show Host'
            };
            const result = RuleEngine.evaluate(rules, postData);
            expect(result).not.toBeNull();
            expect(result.id).toBe('group-rule-1');
        });

        test('should match second group (CEO Mahmoud)', () => {
            const postData = {
                site: 'linkedin',
                author: 'Mahmoud',
                linkedin_job_title: 'CEO at Tech'
            };
            const result = RuleEngine.evaluate(rules, postData);
            expect(result).not.toBeNull();
            expect(result.id).toBe('group-rule-1');
        });

        test('should not match if neither group matches', () => {
            const postData = {
                site: 'linkedin',
                author: 'Ahmed',
                linkedin_job_title: 'CEO' // Ahmed is not CEO in our rules
            };
            const result = RuleEngine.evaluate(rules, postData);
            expect(result).toBeNull();
        });
    });
});
