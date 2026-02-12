/**
 * Tests for See First functionality
 */
import { jest } from '@jest/globals';

describe('See First Functionality', () => {
    let mockElement, mockParent, adapter, logger, generateId;

    beforeEach(() => {
        // Mock logging
        logger = {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        generateId = () => 'test-id';

        // Mock DOM structure
        mockParent = {
            tagName: 'DIV',
            className: 'feed-container',
            children: [],
            firstChild: null,
            firstElementChild: null,
            prepend: jest.fn(function (el) {
                this.children.unshift(el);
                this.firstChild = el;
                this.firstElementChild = el;
            }),
            insertBefore: jest.fn()
        };

        mockElement = {
            tagName: 'DIV',
            className: 'post',
            parentElement: mockParent,
            getAttribute: jest.fn(),
            setAttribute: jest.fn(),
            classList: {
                add: jest.fn(),
                contains: jest.fn()
            },
            querySelector: jest.fn(() => null),
            insertBefore: jest.fn(),
            firstChild: null
        };

        mockParent.children = [{}, {}, mockElement];
        mockParent.firstChild = mockParent.children[0];
        mockParent.firstElementChild = mockParent.children[0];

        // Define a minimal adapter with seeFirst
        adapter = {
            logger,
            escapeHtml: (text) => text,
            seeFirst(el, ruleName = 'See First') {
                logger.log('[SeeFirst] Starting seeFirst evaluation...');
                if (!el) return;
                if (el.getAttribute('data-cf-filtered') === 'true') return;

                const parent = el.parentElement;
                if (!parent) return;

                const isFirstChild = parent.firstChild === el || parent.firstElementChild === el;

                if (!isFirstChild) {
                    parent.prepend(el);
                }

                if (!el.querySelector('.cf-see-first-banner')) {
                    const banner = { className: 'cf-see-first-banner' };
                    el.insertBefore(banner, el.firstChild);
                }

                el.setAttribute('data-cf-filtered', 'true');
                el.setAttribute('data-cf-see-first', 'true');
                el.classList.add('cf-see-first');
            }
        };
    });

    test('should move element to top if not already there', () => {
        adapter.seeFirst(mockElement);
        expect(mockParent.prepend).toHaveBeenCalledWith(mockElement);
        expect(mockElement.setAttribute).toHaveBeenCalledWith('data-cf-filtered', 'true');
        expect(mockElement.classList.add).toHaveBeenCalledWith('cf-see-first');
    });

    test('should not move element if already at top', () => {
        mockParent.firstChild = mockElement;
        mockParent.firstElementChild = mockElement;

        adapter.seeFirst(mockElement);
        expect(mockParent.prepend).not.toHaveBeenCalled();
    });

    test('should add banner if not present', () => {
        adapter.seeFirst(mockElement);
        expect(mockElement.insertBefore).toHaveBeenCalled();
    });

    test('should skip if already filtered', () => {
        mockElement.getAttribute.mockReturnValue('true');
        adapter.seeFirst(mockElement);
        expect(mockParent.prepend).not.toHaveBeenCalled();
    });
});
