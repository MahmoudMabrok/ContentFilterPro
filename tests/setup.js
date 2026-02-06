/**
 * Jest setup file
 * Mocks Chrome extension APIs
 */

// Mock chrome.storage API
global.chrome = {
    storage: {
        local: {
            get: jest.fn((keys, callback) => {
                const mockData = {
                    cf_rules: [],
                    cf_settings: { enabled: true, theme: 'dark' },
                    cf_stats: { filteredCount: 0 }
                };

                let result;
                if (typeof keys === 'string') {
                    result = { [keys]: mockData[keys] };
                } else if (Array.isArray(keys)) {
                    result = {};
                    keys.forEach(key => {
                        result[key] = mockData[key];
                    });
                } else {
                    result = mockData;
                }

                if (typeof callback === 'function') {
                    callback(result);
                }

                return Promise.resolve(result);
            }),
            set: jest.fn((items, callback) => {
                if (callback) callback();
                return Promise.resolve();
            })
        },
        onChanged: {
            addListener: jest.fn()
        }
    },
    runtime: {
        onInstalled: {
            addListener: jest.fn()
        },
        onMessage: {
            addListener: jest.fn()
        },
        openOptionsPage: jest.fn()
    },
    tabs: {
        query: jest.fn((queryInfo, callback) => {
            const mockTab = {
                url: 'https://www.linkedin.com/feed/',
                id: 1
            };
            if (callback) callback([mockTab]);
            return Promise.resolve([mockTab]);
        })
    }
};

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
};
