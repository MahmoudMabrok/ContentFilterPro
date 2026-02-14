/**
 * Content Filter Pro - Bundled Content Script
 * All dependencies bundled into a single file for Chrome compatibility
 */

(function () {
    'use strict';

    // ============================================================================
    // SHARED UTILS
    // ============================================================================
    const generateId = () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };

    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    const logger = {
        log: (...args) => console.log('[ContentFilter]', ...args),
        error: (...args) => console.error('[ContentFilter]', ...args),
        warn: (...args) => console.warn('[ContentFilter]', ...args)
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

        async getSettings() {
            const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
            return result[STORAGE_KEYS.SETTINGS] || {
                enabled: true,
                theme: 'dark'
            };
        },

        async updateStats(counts) {
            if (!counts || Object.keys(counts).length === 0) return;
            const result = await chrome.storage.local.get(STORAGE_KEYS.STATS);
            const stats = result[STORAGE_KEYS.STATS] || { filteredCount: 0, linkedin: 0, facebook: 0, reddit: 0 };

            let totalAdded = 0;
            for (const [site, count] of Object.entries(counts)) {
                stats[site] = (stats[site] || 0) + count;
                totalAdded += count;
            }
            stats.filteredCount += totalAdded;
            await chrome.storage.local.set({ [STORAGE_KEYS.STATS]: stats });
        }
    };

    // ============================================================================
    // FILTER TYPES
    // ============================================================================
    const Operators = {
        EQUALS: 'equals',
        CONTAINS: 'contains',
        STARTS_WITH: 'starts_with',
        ENDS_WITH: 'ends_with',
        MATCHES: 'matches',
        CONTAINS_EXACTLY: 'contains_exactly',
        STARTS_WITH_EXACTLY: 'starts_with_exactly',
        ENDS_WITH_EXACTLY: 'ends_with_exactly',
        NOT_EQUAL: 'not_equal',
        NOT_CONTAINS: 'not_contains'
    };

    const Matchers = {
        [Operators.EQUALS]: (val, target) => val === target,
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
        },
        [Operators.CONTAINS_EXACTLY]: (val, target) => val.includes(target),
        [Operators.STARTS_WITH_EXACTLY]: (val, target) => val.startsWith(target),
        [Operators.ENDS_WITH_EXACTLY]: (val, target) => val.endsWith(target),
        [Operators.NOT_EQUAL]: (val, target) => val.toLowerCase() !== target.toLowerCase(),
        [Operators.NOT_CONTAINS]: (val, target) => !val.toLowerCase().includes(target.toLowerCase())
    };

    // ============================================================================
    // RULE ENGINE
    // ============================================================================
    const RuleEngine = {
        evaluate(rules, postData) {
            if (!rules || !Array.isArray(rules)) {
                logger.log('[RuleEngine] No rules provided or invalid rules array');
                return null;
            }

            logger.log(`[RuleEngine] Evaluating ${rules.length} rules against post by "${postData.author || 'unknown'}"`);

            for (const rule of rules) {
                if (!rule.enabled) {
                    logger.log(`[RuleEngine] Rule "${rule.name}" (${rule.id}) is disabled, skipping`);
                    continue;
                }
                if (rule.site !== '*' && rule.site !== postData.site) {
                    logger.log(`[RuleEngine] Rule "${rule.name}" (${rule.id}) site "${rule.site}" doesn't match post site "${postData.site}", skipping`);
                    continue;
                }

                const matches = this.evaluateConditions(rule.conditions, postData, rule.conditionLogic || 'AND');
                if (matches) {
                    logger.log(`[RuleEngine] ✅ Rule "${rule.name}" (${rule.id}) MATCHED — action: ${rule.action || 'hide'}`);
                    return rule;
                } else {
                    logger.log(`[RuleEngine] Rule "${rule.name}" (${rule.id}) did not match`);
                }
            }
            logger.log('[RuleEngine] No rules matched for this post');
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

            // Skip validation if the field is empty (null, undefined, or empty string)
            if (postValue === undefined || postValue === null || postValue === '') {
                // logger.log(`[Match] Field "${type}" is empty, skipping validation`);
                return false;
            }

            const matcher = Matchers[operator];
            if (!matcher) {
                logger.warn(`[Match] Unknown operator: ${operator}`);
                return false;
            }

            const result = matcher(String(postValue), String(value));
            logger.log(`[Match] ${type} (${postValue}) ${operator} ${value} => ${result}`);
            return result;
        }
    };

    // ============================================================================
    // BASE ADAPTER
    // ============================================================================
    class BaseAdapter {
        constructor() {
            this.siteName = 'base';
            this.postSelector = '';
        }

        getSiteName() {
            return this.siteName;
        }

        getPostSelector() {
            return this.postSelector;
        }

        extractPostData(el) {
            throw new Error('extractPostData not implemented');
        }

        hidePost(el, ruleName = 'Content Filter') {
            // Check if placeholder already exists
            const existingPlaceholder = el.previousElementSibling;
            if (existingPlaceholder && existingPlaceholder.classList.contains('cf-placeholder')) {
                return; // Already has placeholder
            }

            // Create placeholder element
            const placeholder = document.createElement('div');
            placeholder.className = 'cf-placeholder';
            placeholder.setAttribute('data-cf-placeholder', 'true');
            placeholder.setAttribute('data-cf-original-id', el.getAttribute('data-id') || generateId());

            placeholder.innerHTML = `
                <div class="cf-placeholder-content">
                    <div class="cf-placeholder-info">
                        <div class="cf-placeholder-title">Content Filtered</div>
                        <div class="cf-placeholder-reason">Filtered by: ${this.escapeHtml(ruleName)}</div>
                    </div>
                    <button class="cf-reveal-button" data-action="reveal">Show Content</button>
                </div>
            `;

            // Insert placeholder before the post
            el.parentElement.insertBefore(placeholder, el);

            // Hide the original post
            el.classList.add('cf-collapsed');
            el.setAttribute('data-cf-filtered', 'true');

            // Add click event to reveal button
            const revealButton = placeholder.querySelector('.cf-reveal-button');
            revealButton.addEventListener('click', () => {
                this.revealPost(el, placeholder);
            });
        }

        revealPost(el, placeholder) {
            // Remove placeholder
            if (placeholder && placeholder.parentElement) {
                placeholder.remove();
            }

            // Show the original post
            el.classList.remove('cf-collapsed');
            el.setAttribute('data-cf-filtered', 'false');
            el.setAttribute('data-cf-revealed', 'true'); // Mark as revealed to prevent re-filtering
        }

        showPost(el) {
            // Remove any existing placeholder
            const existingPlaceholder = el.previousElementSibling;
            if (existingPlaceholder && existingPlaceholder.classList.contains('cf-placeholder')) {
                existingPlaceholder.remove();
            }

            el.classList.remove('cf-hidden', 'cf-collapsed');
            el.setAttribute('data-cf-filtered', 'false');
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        highlightPost(el, ruleName = 'Highlight') {
            this.highlight(el, ruleName);
        }

        highlight(el, ruleName = 'Highlight') {
            logger.log('[Highlight] Starting highlight evaluation...');
            logger.log('[Highlight] Element:', el?.tagName, el?.className?.substring(0, 50));

            if (!el) {
                logger.warn('[Highlight] Element is null or undefined, skipping');
                return;
            }

            if (el.getAttribute('data-cf-filtered') === 'true') {
                logger.log('[Highlight] Post already filtered, skipping');
                return;
            }

            if (el.getAttribute('data-cf-highlight') === 'true') {
                logger.log('[Highlight] Post already marked as highlight, skipping');
                return;
            }

            const parent = el.parentElement;
            logger.log('[Highlight] Parent element:', parent?.tagName, parent?.className?.substring(0, 50));

            if (!parent) {
                logger.warn('[Highlight] No parent element found, cannot move post');
                return;
            }

            // Ensure parent relative positioning for banner placement if needed
            // But usually we want the POST itself to be relative so the absolute banner is inside it
            if (getComputedStyle(el).position === 'static') {
                el.style.position = 'relative';
            }

            // Add banner if not already present
            if (!el.querySelector('.cf-highlight-banner')) {
                const banner = document.createElement('div');
                banner.className = 'cf-highlight-banner';
                banner.innerHTML = `<span class="cf-highlight-banner-text">Highlight</span><span class="cf-highlight-banner-rule">• ${this.escapeHtml(ruleName)}</span>`;
                el.appendChild(banner); // Append instead of insertBefore to sit on top of everything
                logger.log('[Highlight] Added Highlight banner with rule:', ruleName);
            }

            el.setAttribute('data-cf-filtered', 'true');
            el.setAttribute('data-cf-highlight', 'true');
            el.classList.add('cf-highlight');

            logger.log('[Highlight] Completed processing for post');
        }

        observeFeed(callback) {
            const observer = new MutationObserver((mutations) => {
                let shouldTrigger = false;
                for (const mutation of mutations) {
                    if (mutation.addedNodes.length) {
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType === 1) {
                                shouldTrigger = true;
                                break;
                            }
                        }
                    }
                    if (shouldTrigger) break;
                }
                if (shouldTrigger) {
                    callback();
                }
            });

            // Reverting to document.body for maximum stability as requested
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            return observer;
        }

        getFeedContainer() {
            return null;
        }
    }

    // ============================================================================
    // LINKEDIN ADAPTER
    // ============================================================================
    class LinkedInAdapter extends BaseAdapter {
        constructor() {
            super();
            this.siteName = 'linkedin';
            // Specific selectors for LinkedIn posts to avoid hitting system containers
            this.postSelector = '.feed-shared-update-v2, [data-id^="urn:li:activity:"], .update-components-definition-list';
        }

        extractPostData(el) {
            try {
                // Get the main author (could be the person who shared/liked)
                // Primary: target the visible author name span inside the actor title link
                const authorEl = el.querySelector('.update-components-actor__title .hoverable-link-text span[dir="ltr"] span[aria-hidden="true"]')
                    || el.querySelector('.update-components-actor__name')
                    || el.querySelector('.feed-shared-actor__name');
                console.log('authorEl', authorEl);

                const contentEl = el.querySelector('.feed-shared-update-v2__description, .update-components-text');

                // Check for connection degree - look in multiple places
                const connectionEl = el.querySelector('.update-components-actor__supplementary-actor-info');
                let connectionDegree = '';

                if (connectionEl) {
                    const text = connectionEl.textContent.toLowerCase();
                    if (text.includes('1st')) connectionDegree = '1st';
                    else if (text.includes('2nd')) connectionDegree = '2nd';
                    else if (text.includes('3rd')) connectionDegree = '3rd';
                }

                // For shared/liked posts, check the ORIGINAL post author's connection
                // Look for "X liked this" or "X shared this" patterns
                const feedUpdateHeader = el.querySelector('.update-components-header__text-view, .feed-shared-update-v2__description-wrapper');
                if (feedUpdateHeader && !connectionDegree) {
                    const originalAuthorConnection = el.querySelector('.feed-shared-actor__sub-description, .feed-shared-inline-show-more-text');
                    if (originalAuthorConnection) {
                        const text = originalAuthorConnection.textContent.toLowerCase();
                        if (text.includes('1st')) connectionDegree = '1st';
                        else if (text.includes('2nd')) connectionDegree = '2nd';
                        else if (text.includes('3rd')) connectionDegree = '3rd';
                    }
                }

                // Detect if this is a feed update (friend liked/shared/commented)
                // Look for the control menu container which appears on feed updates
                let isFeedUpdate = false;
                try {
                    const controlMenu = el.querySelector('.feed-shared-update-v2__control-menu-container');
                    if (controlMenu) {
                        // Check if there's text indicating friend activity
                        const updateText = el.textContent.toLowerCase();
                        isFeedUpdate = updateText.includes('liked this') ||
                            updateText.includes('shared this') ||
                            updateText.includes('commented on this') ||
                            updateText.includes('reposted this') ||
                            updateText.includes('reacted to this');
                    }

                    isFeedUpdate = isFeedUpdate || feedUpdateHeader;
                } catch (e) {
                    // Silently fail if selector doesn't work
                    logger.warn('Error checking feed update status:', e);
                }

                // Detect promoted/sponsored content
                let isPromoted = false;
                try {
                    // 1. Check textContent (fallback)
                    const lowerText = el.textContent.toLowerCase();
                    isPromoted = lowerText.includes('promoted') || lowerText.includes('sponsored');

                    // 2. Check for common promoted indicator elements
                    if (!isPromoted) {
                        const promotedSelectors = [
                            '[data-test-id*="promoted"]',
                            '.feed-shared-actor__sub-description',
                            '.update-components-actor__sub-description',
                            '.feed-shared-update-v2__sub-description'
                        ];

                        for (const selector of promotedSelectors) {
                            const indicator = el.querySelector(selector);
                            if (indicator && (
                                indicator.textContent.toLowerCase().includes('promoted') ||
                                indicator.textContent.toLowerCase().includes('sponsored') ||
                                indicator.getAttribute('aria-label')?.toLowerCase().includes('promoted')
                            )) {
                                isPromoted = true;
                                break;
                            }
                        }
                    }

                    // 3. Special case: LinkedIn sometimes hides "Promoted" in a span with specific styles
                    if (!isPromoted) {
                        const spans = el.querySelectorAll('span');
                        for (const span of spans) {
                            if (span.textContent.trim().toLowerCase() === 'promoted' ||
                                span.textContent.trim().toLowerCase() === 'sponsored') {
                                isPromoted = true;
                                break;
                            }
                        }
                    }
                } catch (e) {
                    logger.warn('Error checking promoted status:', e);
                }

                // Extract Job Title (Headline)
                let jobTitle = '';
                try {
                    const jobTitleEl = el.querySelector('.update-components-actor__description, .feed-shared-actor__description');
                    if (jobTitleEl) {
                        jobTitle = jobTitleEl.textContent.trim();
                    }
                } catch (e) {
                    logger.warn('Error extracting job title:', e);
                }

                return {
                    site: this.siteName,
                    author: authorEl ? authorEl.textContent.trim() : '',
                    content: contentEl ? contentEl.textContent.trim() : '',
                    linkedin_connection: connectionDegree,
                    linkedin_promoted: isPromoted ? 'true' : 'false',
                    linkedin_feed_update: isFeedUpdate ? 'true' : 'false',
                    linkedin_job_title: jobTitle
                };
            } catch (error) {
                logger.error('[LinkedInAdapter] Error extracting post data:', error);
                return {
                    site: this.siteName,
                    author: '',
                    content: '',
                    linkedin_connection: '',
                    linkedin_promoted: 'false',
                    linkedin_feed_update: 'false',
                    linkedin_job_title: ''
                };
            }
        }

        getFeedContainer() {
            return document.querySelector('.scaffold-layout__main') ||
                document.querySelector('#main') ||
                document.querySelector('main');
        }
    }

    // ============================================================================
    // FACEBOOK ADAPTER
    // ============================================================================
    class FacebookAdapter extends BaseAdapter {
        constructor() {
            super();
            this.siteName = 'facebook';
            this.postSelector = '[data-pagelet^="FeedUnit_"], [role="article"]';
        }

        extractPostData(el) {
            try {
                const authorEl = el.querySelector('h3 a, strong a, [role="link"] strong');
                const contentEl = el.querySelector('[data-ad-preview="message"], [data-ad-comet-preview="message"]');

                const isSponsored = el.textContent.toLowerCase().includes('sponsored') ||
                    !!el.querySelector('a[href*="/ads/"]');

                return {
                    site: this.siteName,
                    author: authorEl ? authorEl.textContent.trim() : '',
                    content: contentEl ? contentEl.textContent.trim() : '',
                    facebook_sponsored: isSponsored ? 'true' : 'false'
                };
            } catch (error) {
                logger.error('[FacebookAdapter] Error extracting post data:', error);
                return { site: this.siteName, author: '', content: '', facebook_sponsored: 'false' };
            }
        }

        getFeedContainer() {
            return document.querySelector('[role="main"]') ||
                document.querySelector('[data-pagelet="FeedUnit_Main"]') ||
                document.querySelector('.x1hc1f6w'); // Common FB main class
        }
    }

    // ============================================================================
    // REDDIT ADAPTER
    // ============================================================================
    class RedditAdapter extends BaseAdapter {
        constructor() {
            super();
            this.siteName = 'reddit';
            this.postSelector = '[data-testid="post-container"]';
        }

        extractPostData(el) {
            try {
                const authorEl = el.querySelector('[data-testid="post_author_link"]');
                const contentEl = el.querySelector('[data-click-id="text"], [data-ad-preview="message"]');
                const subredditEl = el.querySelector('[data-testid="subreddit-name"]');

                const subreddit = subredditEl ? subredditEl.textContent.trim().replace('r/', '') : '';

                return {
                    site: this.siteName,
                    author: authorEl ? authorEl.textContent.trim().replace('u/', '') : '',
                    content: contentEl ? contentEl.textContent.trim() : '',
                    reddit_subreddit: subreddit
                };
            } catch (error) {
                logger.error('[RedditAdapter] Error extracting post data:', error);
                return { site: this.siteName, author: '', content: '', reddit_subreddit: '' };
            }
        }

        getFeedContainer() {
            return document.querySelector('#main-content') ||
                document.querySelector('.rpZ_vv6GM6isG_SkaYf8G') || // Newer Reddit
                document.querySelector('main');
        }
    }

    // ============================================================================
    // ADAPTER REGISTRY
    // ============================================================================
    const adapters = [
        new LinkedInAdapter(),
        new FacebookAdapter(),
        new RedditAdapter()
    ];

    const getAdapterForUrl = (url) => {
        if (url.includes('linkedin.com')) return adapters.find(a => a.getSiteName() === 'linkedin');
        if (url.includes('facebook.com')) return adapters.find(a => a.getSiteName() === 'facebook');
        if (url.includes('reddit.com')) return adapters.find(a => a.getSiteName() === 'reddit');
        return null;
    };

    // ============================================================================
    // MAIN CONTENT SCRIPT LOGIC
    // ============================================================================
    let currentAdapter = null;
    let rules = [];
    let settings = { enabled: true };

    const init = async () => {
        currentAdapter = getAdapterForUrl(window.location.href);
        if (!currentAdapter) {
            logger.log('No adapter found for this site');
            return;
        }

        logger.log(`Adapter loaded for ${currentAdapter.getSiteName()}`);

        // Load rules and settings
        rules = await Storage.getRules();
        settings = await Storage.getSettings();

        logger.log(`Loaded ${rules.length} rules, filtering enabled: ${settings.enabled}`);

        if (!settings.enabled) return;

        // Initial filter
        const debouncedApplyFilters = debounce(() => {
            applyFilters();
        }, 1000); // Increased debounce for stability

        debouncedApplyFilters();

        // Observe for new posts
        currentAdapter.observeFeed(() => {
            debouncedApplyFilters();
        });

        // Listen for storage changes
        chrome.storage.onChanged.addListener(async (changes) => {
            if (changes.cf_rules) {
                rules = changes.cf_rules.newValue || [];
                logger.log(`Rules updated: ${rules.length} rules`);
                debouncedApplyFilters();
            }
            if (changes.cf_settings) {
                settings = changes.cf_settings.newValue || { enabled: true };
                if (settings.enabled) {
                    debouncedApplyFilters();
                } else {
                    showAllPosts();
                }
            }
        });
    };

    const applyFilters = () => {
        if (!currentAdapter || !settings.enabled) return;

        const posts = document.querySelectorAll(currentAdapter.getPostSelector());
        let filteredCount = 0;
        let highlightCount = 0;
        const siteCounts = {};

        logger.log(`[applyFilters] Processing ${posts.length} posts with ${rules.length} rules`);

        posts.forEach(post => {
            // Skip if already successfully filtered (hidden or highlighted) or revealed by user
            if (post.getAttribute('data-cf-filtered') === 'true' || post.hasAttribute('data-cf-revealed')) {
                logger.log('[applyFilters] Skipping already-processed post (data-cf-filtered="true" or revealed)');
                return;
            }

            const postData = currentAdapter.extractPostData(post);
            logger.log('--- Evaluating Post ---');
            logger.log('Author:', postData.author);
            logger.log('Content (first 50 chars):', postData.content?.substring(0, 50));
            logger.log('Post Data Keys:', Object.keys(postData).join(', '));

            const matchingRule = RuleEngine.evaluate(rules, postData);

            if (matchingRule) {
                const identifier = postData.author || postData.content?.substring(0, 30) || 'Unknown Post';
                logger.log(`[applyFilters] Match: "${matchingRule.name}" on "${identifier}" (Action: ${matchingRule.action || 'hide'})`);

                if (matchingRule.action === 'see_first' || matchingRule.action === 'highlight') {
                    logger.log(`[applyFilters] Applying HIGHLIGHT for post by "${identifier}"`);
                    currentAdapter.highlight(post, matchingRule.name);
                    highlightCount++;
                } else {
                    logger.log(`[applyFilters] Applying HIDE for post by "${identifier}"`);
                    currentAdapter.hidePost(post, matchingRule.name);
                    const site = postData.site || 'unknown';
                    siteCounts[site] = (siteCounts[site] || 0) + 1;
                    filteredCount++;
                }
            } else {
                // Check global "hide" settings
                if (settings.hidePromoted && (postData.linkedin_promoted === 'true' || postData.facebook_sponsored === 'true')) {
                    currentAdapter.hidePost(post, 'Promoted Content');
                    const site = postData.site || 'unknown';
                    siteCounts[site] = (siteCounts[site] || 0) + 1;
                    filteredCount++;
                    return;
                }
                if (settings.hideFeedUpdates && postData.linkedin_feed_update === 'true') {
                    currentAdapter.hidePost(post, 'Feed Update');
                    const site = postData.site || 'unknown';
                    siteCounts[site] = (siteCounts[site] || 0) + 1;
                    filteredCount++;
                    return;
                }
            }
        });

        logger.log(`[applyFilters] Summary: ${filteredCount} hidden, ${highlightCount} highlighted`);
        if (filteredCount > 0) {
            Storage.updateStats(siteCounts);
        }
    };

    const showAllPosts = () => {
        if (!currentAdapter) return;
        const posts = document.querySelectorAll(currentAdapter.getPostSelector());
        posts.forEach(post => {
            currentAdapter.showPost(post);
        });

        // Also remove all placeholders
        const placeholders = document.querySelectorAll('.cf-placeholder');
        placeholders.forEach(placeholder => placeholder.remove());
    };

    const handleReorder = () => {
        if (!currentAdapter) return;

        const highlightedPosts = Array.from(document.querySelectorAll('.cf-highlight'));
        if (highlightedPosts.length === 0) {
            logger.log('[Reorder] No "Highlight" posts found to reorder');
            return;
        }

        const feedContainer = currentAdapter.getFeedContainer();
        if (!feedContainer) {
            logger.warn('[Reorder] Feed container not found');
            return;
        }

        logger.log(`[Reorder] Moving ${highlightedPosts.length} posts to top of feed`);

        for (let i = highlightedPosts.length - 1; i >= 0; i--) {
            const post = highlightedPosts[i];
            feedContainer.prepend(post);
        }
    };

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'reorder_highlighted') {
            handleReorder();
            sendResponse({ status: 'done' });
        }
    });

    // Start the extension logic
    init().catch(err => logger.error('Initialization failed', err));

})();
