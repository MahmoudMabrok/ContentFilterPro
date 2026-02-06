import { BaseAdapter } from './base-adapter.js';

export class LinkedInAdapter extends BaseAdapter {
    constructor() {
        super();
        this.siteName = 'linkedin';
        // Selector for LinkedIn feed posts
        this.postSelector = '.feed-shared-update-v2, .artdeco-card.mb2';
    }

    extractPostData(el) {
        try {
            const authorEl = el.querySelector('.update-components-actor__name, .feed-shared-actor__name');
            const contentEl = el.querySelector('.feed-shared-update-v2__description, .update-components-text');

            // LinkedIn specific: Connection degree
            const connectionEl = el.querySelector('.update-components-actor__supplementary-actor-info');
            let connectionDegree = '';
            if (connectionEl) {
                const text = connectionEl.textContent.toLowerCase();
                if (text.includes('1st')) connectionDegree = '1st';
                else if (text.includes('2nd')) connectionDegree = '2nd';
                else if (text.includes('3rd')) connectionDegree = '3rd';
            }

            return {
                site: this.siteName,
                author: authorEl ? authorEl.textContent.trim() : '',
                content: contentEl ? contentEl.textContent.trim() : '',
                linkedin_connection: connectionDegree
            };
        } catch (error) {
            console.error('[LinkedInAdapter] Error extracting post data:', error);
            return {
                site: this.siteName,
                author: '',
                content: '',
                linkedin_connection: ''
            };
        }
    }
}
