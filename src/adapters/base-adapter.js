/**
 * Abstract base class for site-specific adapters.
 */
export class BaseAdapter {
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

    /**
     * Extracts data from a post element.
     * Should return an object with keys matching FilterTypes.
     */
    extractPostData(el) {
        throw new Error('extractPostData not implemented');
    }

    /**
     * Hides a post element.
     */
    hidePost(el) {
        el.classList.add('cf-hidden');
        el.setAttribute('data-cf-filtered', 'true');
    }

    /**
     * Shows a post element (if previously hidden).
     */
    showPost(el) {
        el.classList.remove('cf-hidden');
        el.removeAttribute('data-cf-filtered');
    }

    /**
     * Highlights a post element.
     */
    highlightPost(el) {
        el.classList.add('cf-highlight');
    }

    /**
     * Sets up a MutationObserver to detect new posts.
     */
    observeFeed(callback) {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    callback();
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return observer;
    }
}
