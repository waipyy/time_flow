// Polyfill for Node.js v25+ localStorage compatibility
// This fixes the issue where Node.js experimental localStorage doesn't have getItem/setItem methods

if (typeof globalThis.localStorage !== 'undefined') {
    // Check if localStorage exists but is missing getItem method (Node.js v25+ issue)
    if (typeof globalThis.localStorage.getItem !== 'function') {
        const storage = new Map();
        globalThis.localStorage = {
            getItem: (key) => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, String(value)),
            removeItem: (key) => storage.delete(key),
            clear: () => storage.clear(),
            get length() { return storage.size; },
            key: (index) => Array.from(storage.keys())[index] ?? null,
        };
    }
}
