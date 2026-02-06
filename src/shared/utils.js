/**
 * Shared utility functions for the Content Filter extension.
 */

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const logger = {
  log: (...args) => console.log('[ContentFilter]', ...args),
  error: (...args) => console.error('[ContentFilter]', ...args),
  warn: (...args) => console.warn('[ContentFilter]', ...args)
};
