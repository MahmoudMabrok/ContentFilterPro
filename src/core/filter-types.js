/**
 * Extensible filter type registry and matching logic.
 */

export const FilterTypes = {
    AUTHOR: 'author',
    CONTENT: 'content',
    KEYWORD_LIST: 'keyword_list',
    REGEX: 'regex',
    LINKEDIN_CONNECTION: 'linkedin_connection',
    LINKEDIN_JOB_TITLE: 'linkedin_job_title',
    REDDIT_SUBREDDIT: 'reddit_subreddit',
    FACEBOOK_SPONSORED: 'facebook_sponsored'
};

export const Operators = {
    EQUALS: 'equals',
    CONTAINS: 'contains',
    STARTS_WITH: 'starts_with',
    ENDS_WITH: 'ends_with',
    MATCHES: 'matches',
    IN_LIST: 'in_list'
};

export const Matchers = {
    [Operators.EQUALS]: (val, target) => val.toLowerCase() === target.toLowerCase(),
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
    [Operators.IN_LIST]: (val, targetList) => {
        if (!Array.isArray(targetList)) return false;
        return targetList.some(item => val.toLowerCase().includes(item.toLowerCase()));
    }
};
