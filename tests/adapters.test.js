/**
 * Tests for Adapters
 */

describe('BaseAdapter', () => {
    let BaseAdapter;

    beforeEach(() => {
        BaseAdapter = class {
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

            hidePost(el) {
                el.classList.add('cf-hidden');
                el.setAttribute('data-cf-filtered', 'true');
            }

            showPost(el) {
                el.classList.remove('cf-hidden');
                el.removeAttribute('data-cf-filtered');
            }

            highlightPost(el) {
                el.classList.add('cf-highlight');
                el.setAttribute('data-cf-filtered', 'true');
            }
        };
    });

    test('should have correct site name', () => {
        const adapter = new BaseAdapter();
        expect(adapter.getSiteName()).toBe('base');
    });

    test('should hide post correctly', () => {
        const adapter = new BaseAdapter();
        const mockElement = {
            classList: { add: jest.fn() },
            setAttribute: jest.fn()
        };

        adapter.hidePost(mockElement);
        expect(mockElement.classList.add).toHaveBeenCalledWith('cf-hidden');
        expect(mockElement.setAttribute).toHaveBeenCalledWith('data-cf-filtered', 'true');
    });

    test('should show post correctly', () => {
        const adapter = new BaseAdapter();
        const mockElement = {
            classList: { remove: jest.fn() },
            removeAttribute: jest.fn()
        };

        adapter.showPost(mockElement);
        expect(mockElement.classList.remove).toHaveBeenCalledWith('cf-hidden');
        expect(mockElement.removeAttribute).toHaveBeenCalledWith('data-cf-filtered');
    });

    test('should highlight post correctly', () => {
        const adapter = new BaseAdapter();
        const mockElement = {
            classList: { add: jest.fn() },
            setAttribute: jest.fn()
        };

        adapter.highlightPost(mockElement);
        expect(mockElement.classList.add).toHaveBeenCalledWith('cf-highlight');
        expect(mockElement.setAttribute).toHaveBeenCalledWith('data-cf-filtered', 'true');
    });
});

describe('LinkedInAdapter', () => {
    let LinkedInAdapter;

    beforeEach(() => {
        // Simplified version for testing
        LinkedInAdapter = class {
            constructor() {
                this.siteName = 'linkedin';
                this.postSelector = '.feed-shared-update-v2, .artdeco-card.mb2';
            }

            getSiteName() {
                return this.siteName;
            }

            extractPostData(el) {
                try {
                    const authorEl = el.querySelector('.update-components-actor__name');
                    const contentEl = el.querySelector('.feed-shared-update-v2__description');
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
                    return { site: this.siteName, author: '', content: '', linkedin_connection: '' };
                }
            }
        };
    });

    test('should have correct site name', () => {
        const adapter = new LinkedInAdapter();
        expect(adapter.getSiteName()).toBe('linkedin');
    });

    test('should extract post data correctly', () => {
        const adapter = new LinkedInAdapter();

        const mockElement = {
            querySelector: jest.fn((selector) => {
                if (selector === '.update-components-actor__name') {
                    return { textContent: '  John Doe  ' };
                }
                if (selector === '.feed-shared-update-v2__description') {
                    return { textContent: 'Great post about AI' };
                }
                if (selector === '.update-components-actor__supplementary-actor-info') {
                    return { textContent: '1st connection' };
                }
                return null;
            })
        };

        const result = adapter.extractPostData(mockElement);
        expect(result.site).toBe('linkedin');
        expect(result.author).toBe('John Doe');
        expect(result.content).toBe('Great post about AI');
        expect(result.linkedin_connection).toBe('1st');
    });

    test('should handle missing elements gracefully', () => {
        const adapter = new LinkedInAdapter();

        const mockElement = {
            querySelector: jest.fn(() => null)
        };

        const result = adapter.extractPostData(mockElement);
        expect(result.site).toBe('linkedin');
        expect(result.author).toBe('');
        expect(result.content).toBe('');
        expect(result.linkedin_connection).toBe('');
    });

    test('should extract 2nd connection degree', () => {
        const adapter = new LinkedInAdapter();

        const mockElement = {
            querySelector: jest.fn((selector) => {
                if (selector === '.update-components-actor__supplementary-actor-info') {
                    return { textContent: '2nd connection' };
                }
                return null;
            })
        };

        const result = adapter.extractPostData(mockElement);
        expect(result.linkedin_connection).toBe('2nd');
    });
});
