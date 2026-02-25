// settings.js
export const SettingsManager = (() => {
    const STORAGE_KEY = 'appSettings';
    let settings = {};
    const subscribers = {};

    // Load from localStorage
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) settings = JSON.parse(stored);
    } catch {}

    function save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }

    return {
        get(key, defaultValue) {
            return key in settings ? settings[key] : defaultValue;
        },
        set(key, value) {
            settings[key] = value;
            save();
            // Notify subscribers
            if (subscribers[key]) {
                subscribers[key].forEach(cb => cb(value));
            }
        },
        subscribe(key, cb) {
            if (!subscribers[key]) subscribers[key] = [];
            subscribers[key].push(cb);
        }
    };
})();