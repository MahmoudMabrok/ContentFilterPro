/**
 * E2E Tests — LinkedIn HTML → Adapter extraction → Rule Engine evaluation
 *
 * These tests inject real LinkedIn HTML into jsdom, run the actual
 * LinkedInAdapter.extractPostData logic and the real RuleEngine.evaluate
 * to verify the full pipeline from DOM → post data → rule result.
 */
import { jest } from '@jest/globals';
import { RuleEngine } from '../src/core/rule-engine.js';

// ---------------------------------------------------------------------------
// Replicate the LinkedInAdapter extraction logic from content-script.js
// so we can test it against real HTML fragments.
// ---------------------------------------------------------------------------
class LinkedInAdapter {
    constructor() {
        this.siteName = 'linkedin';
        this.postSelector =
            '.feed-shared-update-v2, [data-id^="urn:li:activity:"], .update-components-definition-list';
    }

    extractPostData(el) {
        try {
            // Primary: target the visible author name span inside the actor title link
            const authorEl =
                el.querySelector(
                    '.update-components-actor__title .hoverable-link-text span[dir="ltr"] span[aria-hidden="true"]'
                ) ||
                el.querySelector('.update-components-actor__name') ||
                el.querySelector('.feed-shared-actor__name');

            const contentEl =
                el.querySelector('.feed-shared-update-v2__description') ||
                el.querySelector('.update-components-text');

            // Connection degree
            const connectionEl = el.querySelector(
                '.update-components-actor__supplementary-actor-info'
            );
            let connectionDegree = '';
            if (connectionEl) {
                const text = connectionEl.textContent.toLowerCase();
                if (text.includes('1st')) connectionDegree = '1st';
                else if (text.includes('2nd')) connectionDegree = '2nd';
                else if (text.includes('3rd')) connectionDegree = '3rd';
            }

            // Promoted / Sponsored detection
            let isPromoted = false;
            try {
                const lowerText = el.textContent.toLowerCase();
                isPromoted =
                    lowerText.includes('promoted') || lowerText.includes('sponsored');
            } catch (_) {
                /* ignore */
            }

            // Job title / headline
            let jobTitle = '';
            try {
                const jobTitleEl =
                    el.querySelector('.update-components-actor__description') ||
                    el.querySelector('.feed-shared-actor__description');
                if (jobTitleEl) jobTitle = jobTitleEl.textContent.trim();
            } catch (_) {
                /* ignore */
            }

            return {
                site: this.siteName,
                author: authorEl ? authorEl.textContent.trim() : '',
                content: contentEl ? contentEl.textContent.trim() : '',
                linkedin_connection: connectionDegree,
                linkedin_promoted: isPromoted ? 'true' : 'false',
                linkedin_job_title: jobTitle,
            };
        } catch (error) {
            return {
                site: this.siteName,
                author: '',
                content: '',
                linkedin_connection: '',
                linkedin_promoted: 'false',
                linkedin_job_title: '',
            };
        }
    }
}

// ---------------------------------------------------------------------------
// Realistic LinkedIn post HTML fixtures
// ---------------------------------------------------------------------------

/** A standard LinkedIn post with the current DOM structure (Feb 2026). */
const LINKEDIN_POST_HTML = `
<div class="feed-shared-update-v2" data-id="urn:li:activity:7295040709174571009">
  <div class="update-components-actor">
    <a class="update-components-actor__meta-link"
       aria-label="View: Daniil Shykhov Premium • 1st I help engineers become tech leads | Engineer @ WiX"
       target="_self"
       href="https://www.linkedin.com/in/daniil-shykhov?miniProfileUrn=urn%3Ali%3Afsd_profile%3AACoAAByTEzkBjDc4phbwoGbU8clFQ4z78XWyoTY">
      <span class="update-components-actor__title">
        <span class="hoverable-link-text t-14 t-bold text-body-medium-bold t-black update-components-actor__single-line-truncate">
          <span dir="ltr">
            <span aria-hidden="true">Daniil Shykhov</span>
            <span class="visually-hidden">Daniil Shykhov</span>
          </span>
        </span>
        <span class="update-components-actor__supplementary-actor-info t-black--light">
          <span aria-hidden="true">
            <span class="white-space-pre"> </span>
            <svg role="none" aria-hidden="true" class="text-view-model__linkedin-bug-premium-v2" width="14" height="14"></svg>
            <span class="white-space-pre"> </span>• 1st
          </span>
          <span class="visually-hidden">Premium • 1st</span>
        </span>
      </span>
      <span class="update-components-actor__description text-body-xsmall t-black--light">
        <span aria-hidden="true">I help engineers become tech leads | Engineer @ WiX</span>
        <span class="visually-hidden">I help engineers become tech leads | Engineer @ WiX</span>
      </span>
    </a>
  </div>
  <div class="update-components-text">
    <span dir="ltr">
      Leadership is not about being in charge. It is about taking care of those in your charge.
      As engineers, we often focus on technical excellence, but true leadership goes beyond code.
    </span>
  </div>
</div>
`;

/** A promoted / sponsored post. */
const LINKEDIN_PROMOTED_POST_HTML = `
<div class="feed-shared-update-v2" data-id="urn:li:activity:sponsored-001">
  <div class="update-components-actor">
    <a class="update-components-actor__meta-link" target="_self" href="#">
      <span class="update-components-actor__title">
        <span class="hoverable-link-text t-14 t-bold text-body-medium-bold t-black">
          <span dir="ltr">
            <span aria-hidden="true">Acme Corp</span>
            <span class="visually-hidden">Acme Corp</span>
          </span>
        </span>
      </span>
      <span class="update-components-actor__sub-description text-body-xsmall t-black--light">
        <span aria-hidden="true">Promoted</span>
      </span>
    </a>
  </div>
  <div class="update-components-text">
    <span dir="ltr">Try our new product today! Special offer for LinkedIn users. Sponsored content.</span>
  </div>
</div>
`;

/** A second-degree connection post with different author. */
const LINKEDIN_2ND_CONNECTION_POST_HTML = `
<div class="feed-shared-update-v2" data-id="urn:li:activity:7295040709174571010">
  <div class="update-components-actor">
    <a class="update-components-actor__meta-link" target="_self" href="#">
      <span class="update-components-actor__title">
        <span class="hoverable-link-text t-14 t-bold text-body-medium-bold t-black">
          <span dir="ltr">
            <span aria-hidden="true">Ahmed Hassan</span>
            <span class="visually-hidden">Ahmed Hassan</span>
          </span>
        </span>
        <span class="update-components-actor__supplementary-actor-info t-black--light">
          <span aria-hidden="true"> • 2nd</span>
        </span>
      </span>
      <span class="update-components-actor__description text-body-xsmall t-black--light">
        <span aria-hidden="true">Mobile Engineer @ Google</span>
      </span>
    </a>
  </div>
  <div class="update-components-text">
    <span dir="ltr">Excited to share my latest article about Kotlin Multiplatform!</span>
  </div>
</div>
`;

/** A post using older LinkedIn markup (feed-shared-actor__name). */
const LINKEDIN_LEGACY_POST_HTML = `
<div class="feed-shared-update-v2" data-id="urn:li:activity:legacy-post-001">
  <div class="feed-shared-actor">
    <span class="feed-shared-actor__name">
      <span dir="ltr">Jane Smith</span>
    </span>
    <span class="feed-shared-actor__description">Product Manager @ Stripe</span>
  </div>
  <div class="feed-shared-update-v2__description">
    We just shipped something amazing. Here is the crypto behind our payment infra.
  </div>
</div>
`;

// ---------------------------------------------------------------------------
// Helper: create a DOM container and inject HTML
// ---------------------------------------------------------------------------
function createPostElement(html) {
    const container = document.createElement('div');
    container.innerHTML = html.trim();
    return container.querySelector('.feed-shared-update-v2');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('LinkedIn E2E — Real HTML → Adapter → RuleEngine', () => {
    let adapter;

    beforeEach(() => {
        adapter = new LinkedInAdapter();
    });

    // =======================================================================
    // 1. Author extraction from real HTML
    // =======================================================================
    describe('Author extraction from real HTML', () => {
        test('should extract "Daniil Shykhov" from current LinkedIn markup', () => {
            const post = createPostElement(LINKEDIN_POST_HTML);
            const data = adapter.extractPostData(post);
            expect(data.author).toBe('Daniil Shykhov');
        });

        test('should extract "Ahmed Hassan" from 2nd-degree post', () => {
            const post = createPostElement(LINKEDIN_2ND_CONNECTION_POST_HTML);
            const data = adapter.extractPostData(post);
            expect(data.author).toBe('Ahmed Hassan');
        });

        test('should extract "Jane Smith" from legacy markup via fallback selector', () => {
            const post = createPostElement(LINKEDIN_LEGACY_POST_HTML);
            const data = adapter.extractPostData(post);
            expect(data.author).toBe('Jane Smith');
        });

        test('should extract "Acme Corp" from promoted post', () => {
            const post = createPostElement(LINKEDIN_PROMOTED_POST_HTML);
            const data = adapter.extractPostData(post);
            expect(data.author).toBe('Acme Corp');
        });
    });

    // =======================================================================
    // 2. Connection degree extraction
    // =======================================================================
    describe('Connection degree extraction', () => {
        test('should detect 1st degree connection', () => {
            const post = createPostElement(LINKEDIN_POST_HTML);
            const data = adapter.extractPostData(post);
            expect(data.linkedin_connection).toBe('1st');
        });

        test('should detect 2nd degree connection', () => {
            const post = createPostElement(LINKEDIN_2ND_CONNECTION_POST_HTML);
            const data = adapter.extractPostData(post);
            expect(data.linkedin_connection).toBe('2nd');
        });
    });

    // =======================================================================
    // 3. Content extraction
    // =======================================================================
    describe('Content extraction', () => {
        test('should extract post content text', () => {
            const post = createPostElement(LINKEDIN_POST_HTML);
            const data = adapter.extractPostData(post);
            expect(data.content).toContain('Leadership is not about being in charge');
        });

        test('should extract content from legacy markup', () => {
            const post = createPostElement(LINKEDIN_LEGACY_POST_HTML);
            const data = adapter.extractPostData(post);
            expect(data.content).toContain('crypto behind our payment infra');
        });
    });

    // =======================================================================
    // 4. Job title / headline extraction
    // =======================================================================
    describe('Job title extraction', () => {
        test('should extract job title from description element', () => {
            const post = createPostElement(LINKEDIN_POST_HTML);
            const data = adapter.extractPostData(post);
            expect(data.linkedin_job_title).toContain('Engineer @ WiX');
        });
    });

    // =======================================================================
    // 5. Promoted post detection
    // =======================================================================
    describe('Promoted post detection', () => {
        test('should flag promoted post', () => {
            const post = createPostElement(LINKEDIN_PROMOTED_POST_HTML);
            const data = adapter.extractPostData(post);
            expect(data.linkedin_promoted).toBe('true');
        });

        test('should NOT flag non-promoted post', () => {
            const post = createPostElement(LINKEDIN_POST_HTML);
            const data = adapter.extractPostData(post);
            expect(data.linkedin_promoted).toBe('false');
        });
    });

    // =======================================================================
    // 6. Full pipeline: HTML → extractPostData → RuleEngine.evaluate
    // =======================================================================
    describe('Full pipeline — rule evaluation on real HTML', () => {
        test('hide rule matching author "Daniil" via contains', () => {
            const rules = [
                {
                    id: 'rule-hide-daniil',
                    name: 'Hide Daniil',
                    enabled: true,
                    site: 'linkedin',
                    action: 'hide',
                    conditions: [
                        { type: 'author', operator: 'contains', value: 'Daniil' },
                    ],
                    conditionLogic: 'AND',
                },
            ];

            const post = createPostElement(LINKEDIN_POST_HTML);
            const data = adapter.extractPostData(post);
            const result = RuleEngine.evaluate(rules, data);

            expect(result).not.toBeNull();
            expect(result.id).toBe('rule-hide-daniil');
            expect(result.action).toBe('hide');
        });

        test('see_first rule matching author "Daniil Shykhov" via equals', () => {
            const rules = [
                {
                    id: 'rule-see-first-daniil',
                    name: 'See First Daniil',
                    enabled: true,
                    site: 'linkedin',
                    action: 'see_first',
                    conditions: [
                        { type: 'author', operator: 'equals', value: 'Daniil Shykhov' },
                    ],
                    conditionLogic: 'AND',
                },
            ];

            const post = createPostElement(LINKEDIN_POST_HTML);
            const data = adapter.extractPostData(post);
            const result = RuleEngine.evaluate(rules, data);

            expect(result).not.toBeNull();
            expect(result.action).toBe('see_first');
        });

        test('hide rule matching author starting with "A" should match Ahmed but not Daniil', () => {
            const rules = [
                {
                    id: 'rule-hide-a',
                    name: 'Hide authors starting with A',
                    enabled: true,
                    site: '*',
                    action: 'hide',
                    conditions: [
                        { type: 'author', operator: 'starts_with', value: 'A' },
                    ],
                    conditionLogic: 'AND',
                },
            ];

            // Ahmed should match
            const ahmedPost = createPostElement(LINKEDIN_2ND_CONNECTION_POST_HTML);
            const ahmedData = adapter.extractPostData(ahmedPost);
            expect(RuleEngine.evaluate(rules, ahmedData)).not.toBeNull();

            // Daniil should NOT match
            const daniilPost = createPostElement(LINKEDIN_POST_HTML);
            const daniilData = adapter.extractPostData(daniilPost);
            expect(RuleEngine.evaluate(rules, daniilData)).toBeNull();
        });

        test('content-based hide rule should match post containing "crypto"', () => {
            const rules = [
                {
                    id: 'rule-hide-crypto',
                    name: 'Hide crypto posts',
                    enabled: true,
                    site: '*',
                    action: 'hide',
                    conditions: [
                        { type: 'content', operator: 'contains', value: 'crypto' },
                    ],
                    conditionLogic: 'AND',
                },
            ];

            // Legacy post contains "crypto"
            const post = createPostElement(LINKEDIN_LEGACY_POST_HTML);
            const data = adapter.extractPostData(post);
            const result = RuleEngine.evaluate(rules, data);

            expect(result).not.toBeNull();
            expect(result.id).toBe('rule-hide-crypto');
        });

        test('compound rule with AND logic: author + content', () => {
            const rules = [
                {
                    id: 'compound-rule',
                    name: 'Daniil writes about leadership',
                    enabled: true,
                    site: 'linkedin',
                    action: 'see_first',
                    conditions: [
                        { type: 'author', operator: 'contains', value: 'Daniil' },
                        { type: 'content', operator: 'contains', value: 'leadership' },
                    ],
                    conditionLogic: 'AND',
                },
            ];

            const post = createPostElement(LINKEDIN_POST_HTML);
            const data = adapter.extractPostData(post);
            const result = RuleEngine.evaluate(rules, data);

            expect(result).not.toBeNull();
            expect(result.id).toBe('compound-rule');
        });

        test('compound rule with AND logic should NOT match when one condition fails', () => {
            const rules = [
                {
                    id: 'compound-rule',
                    name: 'Ahmed writes about leadership',
                    enabled: true,
                    site: 'linkedin',
                    action: 'see_first',
                    conditions: [
                        { type: 'author', operator: 'contains', value: 'Ahmed' },
                        { type: 'content', operator: 'contains', value: 'leadership' },
                    ],
                    conditionLogic: 'AND',
                },
            ];

            // Daniil's post mentions leadership but author is not Ahmed
            const post = createPostElement(LINKEDIN_POST_HTML);
            const data = adapter.extractPostData(post);
            expect(RuleEngine.evaluate(rules, data)).toBeNull();
        });

        test('job title based rule should match', () => {
            const rules = [
                {
                    id: 'rule-wix',
                    name: 'See engineers at WiX',
                    enabled: true,
                    site: 'linkedin',
                    action: 'see_first',
                    conditions: [
                        { type: 'linkedin_job_title', operator: 'contains', value: 'WiX' },
                    ],
                    conditionLogic: 'AND',
                },
            ];

            const post = createPostElement(LINKEDIN_POST_HTML);
            const data = adapter.extractPostData(post);
            const result = RuleEngine.evaluate(rules, data);

            expect(result).not.toBeNull();
            expect(result.id).toBe('rule-wix');
        });

        test('multiple rules — first match wins', () => {
            const rules = [
                {
                    id: 'rule-1',
                    name: 'See First Daniil',
                    enabled: true,
                    site: 'linkedin',
                    action: 'see_first',
                    conditions: [
                        { type: 'author', operator: 'equals', value: 'Daniil Shykhov' },
                    ],
                    conditionLogic: 'AND',
                },
                {
                    id: 'rule-2',
                    name: 'Hide leadership posts',
                    enabled: true,
                    site: '*',
                    action: 'hide',
                    conditions: [
                        { type: 'content', operator: 'contains', value: 'leadership' },
                    ],
                    conditionLogic: 'AND',
                },
            ];

            const post = createPostElement(LINKEDIN_POST_HTML);
            const data = adapter.extractPostData(post);
            const result = RuleEngine.evaluate(rules, data);

            // Rule 1 should win (first match)
            expect(result).not.toBeNull();
            expect(result.id).toBe('rule-1');
            expect(result.action).toBe('see_first');
        });

        test('no rules match returns null', () => {
            const rules = [
                {
                    id: 'rule-nomatch',
                    name: 'Nobody matches',
                    enabled: true,
                    site: 'linkedin',
                    action: 'hide',
                    conditions: [
                        { type: 'author', operator: 'equals', value: 'NONEXISTENT PERSON' },
                    ],
                    conditionLogic: 'AND',
                },
            ];

            const post = createPostElement(LINKEDIN_POST_HTML);
            const data = adapter.extractPostData(post);
            expect(RuleEngine.evaluate(rules, data)).toBeNull();
        });

        test('disabled rule should not match even if conditions match', () => {
            const rules = [
                {
                    id: 'disabled-rule',
                    name: 'Disabled',
                    enabled: false,
                    site: 'linkedin',
                    action: 'hide',
                    conditions: [
                        { type: 'author', operator: 'equals', value: 'Daniil Shykhov' },
                    ],
                    conditionLogic: 'AND',
                },
            ];

            const post = createPostElement(LINKEDIN_POST_HTML);
            const data = adapter.extractPostData(post);
            expect(RuleEngine.evaluate(rules, data)).toBeNull();
        });

        test('site mismatch — facebook rule should not match linkedin post', () => {
            const rules = [
                {
                    id: 'fb-rule',
                    name: 'Facebook only',
                    enabled: true,
                    site: 'facebook',
                    action: 'hide',
                    conditions: [
                        { type: 'author', operator: 'equals', value: 'Daniil Shykhov' },
                    ],
                    conditionLogic: 'AND',
                },
            ];

            const post = createPostElement(LINKEDIN_POST_HTML);
            const data = adapter.extractPostData(post);
            expect(RuleEngine.evaluate(rules, data)).toBeNull();
        });
    });
});
