// Shader library system with presets and management
export class ShaderLibrary {
    constructor() {
        this.presets = {};
        this.customShaders = [];
        this.currentCategory = 'all';
        this.collapsedCategories = new Set();
        this.init();
    }

    async init() {
        await this.loadPresets();
        this.loadCustomShaders();
    }

    async loadPresets() {
        // Define built-in shader presets
        this.presets = {
            'Mandelbrot Fractal': {
                file: './src/shaders/fractal-mandelbrot.glsl',
                category: 'fractals',
                description: 'Interactive Mandelbrot set with smooth coloring',
                uniforms: ['time', 'resolution', 'mouse']
            },
            'Julia Set': {
                file: './src/shaders/fractal-julia.glsl',
                category: 'fractals',
                description: 'Animated Julia set with shifting constants',
                uniforms: ['time', 'resolution', 'mouse']
            },
            'Sierpinski Triangle': {
                file: './src/shaders/fractal-sierpinski.glsl',
                category: 'fractals',
                description: 'Iterated function system Sierpinski with rainbow edges',
                uniforms: ['time', 'resolution', 'mouse']
            },
            'Burning Ship': {
                file: './src/shaders/fractal-burning-ship.glsl',
                category: 'fractals',
                description: 'Burning Ship fractal variant with fiery palette',
                uniforms: ['time', 'resolution', 'mouse']
            },
            'Ocean Waves': {
                file: './src/shaders/waves-ocean.glsl',
                category: 'nature',
                description: 'Professional Gerstner waves with raytracing and realistic water physics',
                uniforms: ['time', 'resolution', 'mouse']
            },
            'Fire Storm': {
                file: './src/shaders/noise-fire.glsl',
                category: 'nature',
                description: 'Realistic fire with embers and wind effects',
                uniforms: ['time', 'resolution', 'mouse']
            },
            'Aurora Borealis': {
                file: './src/shaders/nature-aurora.glsl',
                category: 'nature',
                description: 'Northern lights with layered curtains and starfield',
                uniforms: ['time', 'resolution', 'mouse']
            },
            'Clouds': {
                file: './src/shaders/nature-clouds.glsl',
                category: 'nature',
                description: 'Volumetric cloud layers drifting across a sunny sky',
                uniforms: ['time', 'resolution', 'mouse']
            },
            'Geometric Tunnel': {
                file: './src/shaders/geometric-tunnel.glsl',
                category: 'geometric',
                description: 'Pulsing tunnel with electric arcs',
                uniforms: ['time', 'resolution', 'mouse']
            },
            'Kaleidoscope': {
                file: './src/shaders/geometric-kaleidoscope.glsl',
                category: 'geometric',
                description: 'Mirrored kaleidoscope with adjustable segments',
                uniforms: ['time', 'resolution', 'mouse']
            },
            'Voronoi Cells': {
                file: './src/shaders/geometric-voronoi.glsl',
                category: 'geometric',
                description: 'Animated Voronoi diagram with glowing edges',
                uniforms: ['time', 'resolution', 'mouse']
            },
            'Truchet Tiles': {
                file: './src/shaders/geometric-truchet.glsl',
                category: 'geometric',
                description: 'Interlocking quarter-circle arcs forming maze patterns',
                uniforms: ['time', 'resolution', 'mouse']
            },
            'Spiraling Madness': {
                file: './src/shaders/default.glsl',
                category: 'trippy',
                description: 'Hypnotic spiral patterns with color cycling',
                uniforms: ['time', 'resolution']
            },
            'DNA Helix': {
                file: './src/shaders/trippy-dna.glsl',
                category: 'trippy',
                description: 'Electric DNA helix with particle effects',
                uniforms: ['time', 'resolution', 'mouse']
            },
            'Plasma': {
                file: './src/shaders/trippy-plasma.glsl',
                category: 'trippy',
                description: 'Classic plasma effect with layered sine waves',
                uniforms: ['time', 'resolution', 'mouse']
            },
            'Warp Speed': {
                file: './src/shaders/trippy-warp.glsl',
                category: 'trippy',
                description: 'Hyperspace star tunnel with radial streaks',
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
        const uniformRegex = /uniform\s+(\w+)\s+(\w+);/g;
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

    getCategoryOrder() {
        return ['fractals', 'nature', 'geometric', 'trippy', 'custom'];
    }

    searchShaders(query) {
        const lowerQuery = query.toLowerCase();
        return this.getAllShaders().filter(shader =>
            shader.name.toLowerCase().includes(lowerQuery) ||
            shader.description.toLowerCase().includes(lowerQuery) ||
            shader.category.toLowerCase().includes(lowerQuery)
        );
    }

    toggleCategory(category) {
        if (this.collapsedCategories.has(category)) {
            this.collapsedCategories.delete(category);
        } else {
            this.collapsedCategories.add(category);
        }
    }

    createLibraryHTML() {
        const categories = this.getCategories();
        const shaders = this.getShadersByCategory(this.currentCategory);

        // Group shaders by category
        const grouped = {};
        for (const shader of shaders) {
            if (!grouped[shader.category]) {
                grouped[shader.category] = [];
            }
            grouped[shader.category].push(shader);
        }

        // Build accordion sections in defined order
        const order = this.getCategoryOrder();
        const sortedCategories = Object.keys(grouped).sort((a, b) => {
            const ai = order.indexOf(a);
            const bi = order.indexOf(b);
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });

        const sectionsHTML = sortedCategories.map(cat => {
            const items = grouped[cat];
            const isCollapsed = this.collapsedCategories.has(cat);
            const chevron = isCollapsed ? '&#9654;' : '&#9660;';

            return `
                <div class="library-category" data-category="${cat}">
                    <div class="category-header" data-toggle-category="${cat}">
                        <span class="category-chevron">${chevron}</span>
                        <span class="category-icon">${this.getCategoryIcon(cat)}</span>
                        <span class="category-name">${this.getCategoryLabel(cat)}</span>
                        <span class="category-count">${items.length}</span>
                    </div>
                    <div class="category-items" style="${isCollapsed ? 'display:none' : ''}">
                        ${items.map(shader => this.createShaderRow(shader)).join('')}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="library-header">
                <h2>Shader Library</h2>
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
            <div class="library-sections">
                ${sectionsHTML}
            </div>
        `;
    }

    getCategoryDisplayName(category) {
        const displayNames = {
            'all': 'All Shaders',
            'fractals': 'Fractals',
            'nature': 'Nature',
            'geometric': 'Geometric',
            'trippy': 'Trippy',
            'custom': 'Custom'
        };
        return displayNames[category] || category;
    }

    getCategoryLabel(category) {
        const labels = {
            'fractals': 'Fractals',
            'nature': 'Nature',
            'geometric': 'Geometric',
            'trippy': 'Trippy',
            'custom': 'Custom'
        };
        return labels[category] || category;
    }

    createShaderRow(shader) {
        const deleteBtn = !shader.isPreset
            ? `<button class="delete-btn" data-action="delete" data-shader="${shader.name}">Delete</button>`
            : '';

        return `
            <div class="shader-row" data-shader-name="${shader.name}">
                <div class="shader-row-info">
                    <span class="shader-row-name">${shader.name}</span>
                    <span class="shader-row-desc">${shader.description}</span>
                </div>
                <div class="shader-row-actions">
                    ${deleteBtn}
                    <button class="load-btn" data-action="load" data-shader="${shader.name}">Load</button>
                </div>
            </div>
        `;
    }

    getCategoryIcon(category) {
        const icons = {
            'fractals': '\u{1F300}',
            'nature': '\u{1F30A}',
            'geometric': '\u{1F4D0}',
            'trippy': '\u{1F386}',
            'custom': '\u{1F4BE}'
        };
        return icons[category] || '\u{2728}';
    }
}
