// Main application entry point
import { ShaderEditor } from './editor.js';
import { ShaderRenderer } from './renderer.js';
import { SettingsManager } from './settings.js';
import { UIManager } from './ui.js';

class ShaderApp {
    constructor() {
        this.settings = new SettingsManager();
        this.renderer = new ShaderRenderer('canvas');
        this.editor = new ShaderEditor(this.renderer, this.settings);
        this.ui = new UIManager(this.editor, this.settings);

        this.init();
    }

    async init() {
        const DEFAULT_SHADER = {
            name: 'Mandelbrot Fractal',
            file: './src/shaders/fractal-mandelbrot.glsl',
        };

        const response = await fetch(DEFAULT_SHADER.file);
        const defaultCode = await response.text();

        await this.settings.init();
        this.renderer.init();
        this.editor.init(defaultCode);

        // Set the title BEFORE awaiting library load (which is slow).
        // Otherwise hitting Edit during library load shows the stale "Fragment" placeholder.
        this.ui.setShaderTitle(DEFAULT_SHADER.name);
        this.ui.defaultShaderName = DEFAULT_SHADER.name;

        await this.ui.init();

        this.renderer.startRenderLoop();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.shaderApp = new ShaderApp();
});

export { ShaderApp };
