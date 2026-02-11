// Shader library system with presets and management
export class ShaderLibrary {
    constructor() {
        this.presets = {};
        this.customShaders = [];
        this.currentCategory = 'all';
        this.init();
    }

    async init() {
        await this.loadPresets();
        this.loadCustomShaders();
    }

    async loadPresets() {
        // Define built-in shader presets
        this.presets = {
            'Spiraling Madness': {
                file: './src/shaders/default.glsl',
                category: 'trippy',
                description: 'Hypnotic spiral patterns with color cycling',
                uniforms: ['time', 'resolution']
            },
            'Mandelbrot Fractal': {
                file: './src/shaders/fractal-mandelbrot.glsl',
                category: 'fractals',
                description: 'Interactive Mandelbrot set with smooth coloring',
                uniforms: ['time', 'resolution', 'mouse']
            },
            'Ocean Waves': {
                file: './src/shaders/waves-ocean.glsl',
                category: 'nature',
                description: 'Professional Gerstner waves with raytracing and realistic water physics',
                uniforms: ['time', 'resolution', 'mouse']
            },
            'Geometric Tunnel': {
                file: './src/shaders/geometric-tunnel.glsl',
                category: 'geometric',
                description: 'Pulsing tunnel with electric arcs',
                uniforms: ['time', 'resolution', 'mouse']
            },
            'Fire Storm': {
                file: './src/shaders/noise-fire.glsl',
                category: 'nature',
                description: 'Realistic fire with embers and wind effects',
                uniforms: ['time', 'resolution', 'mouse']
            },
            'DNA Helix': {
                file: './src/shaders/trippy-dna.glsl',
                category: 'trippy',
                description: 'Electric DNA helix with particle effects',
                uniforms: ['time', 'resolution', 'mouse']
            }
        };

        // Load shader code for each preset
        for (const [name, preset] of Object.entries(this.presets)) {
            try {
                const response = await fetch(preset.file);
                preset.code = await response.text();
            } catch (error) {
                console.warn(`Failed to load shader: ${name}`, error);
                preset.code = '// Failed to load shader';
            }
        }
    }

    loadCustomShaders() {
        try {
            const stored = localStorage.getItem('customShaders');
            if (stored) {
                this.customShaders = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load custom shaders:', error);
            this.customShaders = [];
        }
    }

    saveCustomShader(name, code, description = '') {
        const shader = {
            name,
            code,
            description,
            category: 'custom',
            uniforms: this.extractUniforms(code),
            created: new Date().toISOString()
        };

        // Remove existing shader with same name
        this.customShaders = this.customShaders.filter(s => s.name !== name);

        // Add new shader
        this.customShaders.unshift(shader);

        // Limit to 50 custom shaders
        if (this.customShaders.length > 50) {
            this.customShaders = this.customShaders.slice(0, 50);
        }

        this.saveToStorage();
        return shader;
    }

    deleteCustomShader(name) {
        this.customShaders = this.customShaders.filter(s => s.name !== name);
        this.saveToStorage();
    }

    saveToStorage() {
        try {
            localStorage.setItem('customShaders', JSON.stringify(this.customShaders));
        } catch (error) {
            console.warn('Failed to save custom shaders:', error);
        }
    }

    extractUniforms(code) {
        const uniforms = [];
        const uniformRegex = /uniform\\s+(\\w+)\\s+(\\w+);/g;
        let match;

        while ((match = uniformRegex.exec(code)) !== null) {
            uniforms.push(match[2]); // uniform name
        }

        return uniforms;
    }

    getAllShaders() {
        const all = [];

        // Add presets
        for (const [name, preset] of Object.entries(this.presets)) {
            all.push({
                name,
                ...preset,
                isPreset: true
            });
        }

        // Add custom shaders
        for (const shader of this.customShaders) {
            all.push({
                ...shader,
                isPreset: false
            });
        }

        return all;
    }

    getShadersByCategory(category) {
        if (category === 'all') {
            return this.getAllShaders();
        }

        return this.getAllShaders().filter(shader => shader.category === category);
    }

    getCategories() {
        const categories = new Set(['all']);

        // Add preset categories
        for (const preset of Object.values(this.presets)) {
            categories.add(preset.category);
        }

        // Add custom category if there are custom shaders
        if (this.customShaders.length > 0) {
            categories.add('custom');
        }

        return Array.from(categories);
    }

    searchShaders(query) {
        const lowerQuery = query.toLowerCase();
        return this.getAllShaders().filter(shader =>
            shader.name.toLowerCase().includes(lowerQuery) ||
            shader.description.toLowerCase().includes(lowerQuery) ||
            shader.category.toLowerCase().includes(lowerQuery)
        );
    }

    createLibraryHTML() {
        const categories = this.getCategories();
        const shaders = this.getShadersByCategory(this.currentCategory);

        return `
            <div class="library-header">
                <h2>🔥 Epic Shader Library</h2>
                <div class="library-controls">
                    <select id="categorySelect">
                        ${categories.map(cat =>
                            `<option value="${cat}" ${cat === this.currentCategory ? 'selected' : ''}>
                                ${this.getCategoryDisplayName(cat)}
                            </option>`
                        ).join('')}
                    </select>
                    <input type="text" id="searchInput" placeholder="Search shaders..." />
                    <button id="saveCurrentShader">Save Current</button>
                </div>
            </div>
            <div class="library-grid">
                ${shaders.map(shader => this.createShaderCard(shader)).join('')}
            </div>
        `;
    }

    getCategoryDisplayName(category) {
        const displayNames = {
            'all': '🌟 All Shaders',
            'fractals': '🌀 Fractals',
            'nature': '🌊 Nature',
            'geometric': '📐 Geometric',
            'trippy': '🎆 Trippy',
            'custom': '💾 Custom'
        };
        return displayNames[category] || category;
    }

    createShaderCard(shader) {
        const uniformsList = shader.uniforms.join(', ');
        const presetBadge = shader.isPreset ? '<span class="preset-badge">Built-in</span>' : '<span class="custom-badge">Custom</span>';

        return `
            <div class="shader-card" data-shader-name="${shader.name}">
                <div class="shader-preview">
                    <!-- Canvas preview would go here -->
                    <div class="preview-placeholder">
                        ${this.getCategoryIcon(shader.category)}
                    </div>
                </div>
                <div class="shader-info">
                    <h3>${shader.name}</h3>
                    <p class="shader-description">${shader.description}</p>
                    <div class="shader-meta">
                        ${presetBadge}
                        <span class="uniforms">Uniforms: ${uniformsList}</span>
                    </div>
                    <div class="shader-actions">
                        <button class="load-btn" data-action="load" data-shader="${shader.name}">Load</button>
                        ${!shader.isPreset ? `<button class="delete-btn" data-action="delete" data-shader="${shader.name}">Delete</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    getCategoryIcon(category) {
        const icons = {
            'fractals': '🌀',
            'nature': '🌊',
            'geometric': '📐',
            'trippy': '🎆',
            'custom': '💾'
        };
        return icons[category] || '✨';
    }
}