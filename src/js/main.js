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
        const DEFAULT_NAME = 'Mandelbrot Fractal';
        const response = await fetch('./src/shaders/fractal-mandelbrot.glsl');
        const defaultShader = await response.text();

        await this.settings.init();
        this.renderer.init();
        this.editor.init(defaultShader);
        await this.ui.init();
        this.ui.setShaderTitle(DEFAULT_NAME);

        this.renderer.startRenderLoop();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.shaderApp = new ShaderApp();
});

export { ShaderApp };
