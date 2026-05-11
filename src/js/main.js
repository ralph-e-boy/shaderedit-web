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
        // Load default shader
        const response = await fetch('./src/shaders/fractal-mandelbrot.glsl');
        const defaultShader = await response.text();

        // Initialize components
        await this.settings.init();
        this.renderer.init();
        this.editor.init(defaultShader);
        this.ui.init();

        // Start rendering
        this.renderer.startRenderLoop();

        console.log('🚀 Epic Shader Editor initialized!');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.shaderApp = new ShaderApp();
});

export { ShaderApp };
