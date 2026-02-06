import { BaseAdapter } from './base-adapter.js';

export class RedditAdapter extends BaseAdapter {
    constructor() {
        super();
        this.siteName = 'reddit';
        // Reddit post container (New Reddit)
        this.postSelector = '[data-testid="post-container"]';
    }

    extractPostData(el) {
        try {
            const authorEl = el.querySelector('[data-testid="post_author_link"]');
            const contentEl = el.querySelector('[data-click-id="text"], [data-ad-preview="message"]');
            const subredditEl = el.querySelector('[data-testid="subreddit-name"]');

            // Reddit specific: Subreddit
            const subreddit = subredditEl ? subredditEl.textContent.trim().replace('r/', '') : '';

            return {
                site: this.siteName,
                author: authorEl ? authorEl.textContent.trim().replace('u/', '') : '',
                content: contentEl ? contentEl.textContent.trim() : '',
                reddit_subreddit: subreddit
            };
        } catch (error) {
            console.error('[RedditAdapter] Error extracting post data:', error);
            return {
                site: this.siteName,
                author: '',
                content: '',
                reddit_subreddit: ''
            };
        }
    }
}
