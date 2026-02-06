import { LinkedInAdapter } from './linkedin-adapter.js';
import { FacebookAdapter } from './facebook-adapter.js';
import { RedditAdapter } from './reddit-adapter.js';

const adapters = [
    new LinkedInAdapter(),
    new FacebookAdapter(),
    new RedditAdapter()
];

export const getAdapterForUrl = (url) => {
    if (url.includes('linkedin.com')) return adapters.find(a => a.getSiteName() === 'linkedin');
    if (url.includes('facebook.com')) return adapters.find(a => a.getSiteName() === 'facebook');
    if (url.includes('reddit.com')) return adapters.find(a => a.getSiteName() === 'reddit');
    return null;
};

export const getAllAdapters = () => adapters;
