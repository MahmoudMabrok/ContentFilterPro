import { BaseAdapter } from './base-adapter.js';

export class FacebookAdapter extends BaseAdapter {
    constructor() {
        super();
        this.siteName = 'facebook';
        // Facebook uses complex nested structures, this is a common top-level container
        this.postSelector = '[data-pagelet^="FeedUnit_"], [role="article"]';
    }

    extractPostData(el) {
        try {
            // Facebook obfuscates classes, so we look for common patterns
            const authorEl = el.querySelector('h3 a, strong a, [role="link"] strong');
            const contentEl = el.querySelector('[data-ad-preview="message"], [data-ad-comet-preview="message"]');

            // Sponsored check
            const isSponsored = el.textContent.toLowerCase().includes('sponsored') ||
                !!el.querySelector('a[href*="/ads/"]');

            return {
                site: this.siteName,
                author: authorEl ? authorEl.textContent.trim() : '',
                content: contentEl ? contentEl.textContent.trim() : '',
                facebook_sponsored: isSponsored ? 'true' : 'false'
            };
        } catch (error) {
            console.error('[FacebookAdapter] Error extracting post data:', error);
            return {
                site: this.siteName,
                author: '',
                content: '',
                facebook_sponsored: 'false'
            };
        }
    }
}
