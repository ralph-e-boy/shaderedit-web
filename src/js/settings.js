// Touch device detection — vim without a real keyboard is misery
const isTouchDevice = () =>
    typeof window !== 'undefined' &&
    (('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0);

// Settings manager with localStorage persistence
export class SettingsManager {
    constructor() {
        this.settings = {};
        this.defaults = {
            vimMode: !isTouchDevice(),
            theme: 'dark',
            fontSize: 14,
            tabSize: 4,
            autoCompile: true,
            showLineNumbers: true,
            audioEnabled: false,
            cameraEnabled: false
        };
    }

    async init() {
        this.loadSettings();
    }

    loadSettings() {
        try {
            const stored = localStorage.getItem('shaderEditorSettings');
            if (stored) {
                this.settings = { ...this.defaults, ...JSON.parse(stored) };
            } else {
                this.settings = { ...this.defaults };
            }
        } catch (error) {
            console.warn('Failed to load settings:', error);
            this.settings = { ...this.defaults };
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('shaderEditorSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save settings:', error);
        }
    }

    get(key, defaultValue = null) {
        return this.settings[key] !== undefined ? this.settings[key] : defaultValue;
    }

    set(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.notifyChange(key, value);
    }

    getAll() {
        return { ...this.settings };
    }

    reset() {
        this.settings = { ...this.defaults };
        this.saveSettings();
    }

    notifyChange(key, value) {
        // Dispatch custom event for settings changes
        document.dispatchEvent(new CustomEvent('settingsChanged', {
            detail: { key, value, settings: this.settings }
        }));
    }
}