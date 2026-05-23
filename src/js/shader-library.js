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
            // ---------- BASICS ----------
            '01 · UV Coordinates': {
                file: './src/shaders/basics-uv.glsl',
                category: 'basics',
                description: 'Hello world: visualize the pixel\'s position as color',
                uniforms: ['resolution']
            },
            '02 · Time': {
                file: './src/shaders/basics-time.glsl',
                category: 'basics',
                description: 'Animating with the time uniform and sin()',
                uniforms: ['time', 'resolution']
            },
            '03 · Mouse': {
                file: './src/shaders/basics-mouse.glsl',
                category: 'basics',
                description: 'Soft glow that follows the cursor; intro to distance fields',
                uniforms: ['time', 'resolution', 'mouse']
            },
            '04 · Circle SDF': {
                file: './src/shaders/basics-circle.glsl',
                category: 'basics',
                description: 'Signed distance field for a circle, with anti-aliasing',
                uniforms: ['time', 'resolution']
            },
            '05 · SDF Shapes': {
                file: './src/shaders/basics-shapes.glsl',
                category: 'basics',
                description: 'Box, rounded box, triangle, and circle composed via min()',
                uniforms: ['time', 'resolution']
            },
            '06 · Polar Coordinates': {
                file: './src/shaders/basics-polar.glsl',
                category: 'basics',
                description: 'Rays and rings using (radius, angle) instead of (x, y)',
                uniforms: ['time', 'resolution']
            },
            '07 · Repeating Grid': {
                file: './src/shaders/basics-grid.glsl',
                category: 'basics',
                description: 'fract() + hash() to tile a unique-per-cell pattern infinitely',
                uniforms: ['time', 'resolution']
            },
            // ---------- NOISE ----------
            'Value Noise': {
                file: './src/shaders/noise-value.glsl',
                category: 'noise',
                description: 'The simplest procedural noise: random per grid cell, smoothly interpolated',
                uniforms: ['time', 'resolution']
            },
            'Fractal Brownian Motion': {
                file: './src/shaders/noise-fbm.glsl',
                category: 'noise',
                description: 'Layered noise octaves with domain warping — the texture of clouds & terrain',
                uniforms: ['time', 'resolution']
            },
            // ---------- FRACTALS ----------
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
                description: 'Vertical curtains of light over a dark horizon, properly green-to-magenta',
                uniforms: ['time', 'resolution', 'mouse']
            },
            'Clouds': {
                file: './src/shaders/nature-clouds.glsl',
                category: 'nature',
                description: 'Volumetric cloud layers drifting across a sunny sky',
                uniforms: ['time', 'resolution', 'mouse']
            },
            'Rain Storm': {
                file: './src/shaders/nature-rain.glsl',
                category: 'nature',
                description: 'Wet afternoon: parallax rain streaks, rippling puddles, occasional lightning',
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
            },
            // ---------- ART ----------
            'Boomerang': {
                file: './src/shaders/art-boomerang.glsl',
                category: 'art',
                description: 'After Raymond Loewy — scribble-loops on pale teal, two ink weights overlapping',
                uniforms: ['time', 'resolution']
            },
            'Drip': {
                file: './src/shaders/art-pollock.glsl',
                category: 'art',
                description: 'After Jackson Pollock — layered FBM splatters on canvas',
                uniforms: ['time', 'resolution']
            },
            'Op Art': {
                file: './src/shaders/art-opart.glsl',
                category: 'art',
                description: 'After Bridget Riley — high-contrast bands warped into 3D folds',
                uniforms: ['time', 'resolution']
            },
            'Vega': {
                file: './src/shaders/art-vasarely.glsl',
                category: 'art',
                description: 'After Victor Vasarely — square grid bulged into illusion of spheres',
                uniforms: ['time', 'resolution']
            },
            'Composition': {
                file: './src/shaders/art-mondrian.glsl',
                category: 'art',
                description: 'After Piet Mondrian — primary rectangles inside a black grid',
                uniforms: ['time', 'resolution']
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
        return ['basics', 'noise', 'fractals', 'nature', 'geometric', 'trippy', 'art', 'custom'];
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

        const sectionsHTML = sortedCategories.map((cat, idx) => {
            const items = grouped[cat];
            const isCollapsed = this.collapsedCategories.has(cat);
            const chevron = isCollapsed ? '▸' : '▾';
            const num = String(idx + 1).padStart(2, '0');

            return `
                <div class="library-category${isCollapsed ? ' is-collapsed' : ''}" data-category="${cat}">
                    <div class="category-header" data-toggle-category="${cat}">
                        <span class="category-num">${num}</span>
                        <span class="category-name">${this.getCategoryLabel(cat)}</span>
                        <span class="category-rule"></span>
                        <span class="category-count">${items.length}<small>${items.length === 1 ? ' shader' : ' shaders'}</small></span>
                        <span class="category-chevron">${chevron}</span>
                    </div>
                    <div class="category-items"${isCollapsed ? ' style="display:none"' : ''}>
                        ${items.map((shader, i) => this.createShaderRow(shader, i)).join('')}
                    </div>
                </div>
            `;
        }).join('');

        const currentLabel = this.getCategoryDisplayName(this.currentCategory);

        return `
            <div class="library-header">
                <div class="library-controls">
                    <div class="lib-field">
                        <span class="lib-field-label">filter</span>
                        <div class="custom-select" data-custom-select>
                            <button type="button" class="cs-button" data-cs-toggle aria-haspopup="listbox" aria-expanded="false">
                                <span class="cs-value" data-cs-value>${currentLabel}</span>
                                <span class="cs-chevron" aria-hidden="true">▾</span>
                            </button>
                            <select id="categorySelect" class="cs-native" hidden>
                                ${categories.map(cat =>
                                    `<option value="${cat}" ${cat === this.currentCategory ? 'selected' : ''}>${this.getCategoryDisplayName(cat)}</option>`
                                ).join('')}
                            </select>
                            <ul class="cs-popup" role="listbox" data-cs-popup>
                                ${categories.map((cat, i) => `
                                    <li class="cs-option${cat === this.currentCategory ? ' is-selected' : ''}" role="option" data-cs-option="${cat}" tabindex="-1">
                                        <span class="opt-num">${String(i + 1).padStart(2, '0')}</span>
                                        <span class="opt-name">${this.getCategoryDisplayName(cat)}</span>
                                        ${cat === this.currentCategory ? '<span class="opt-shortcut">selected</span>' : '<span class="opt-shortcut"></span>'}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                    <label class="lib-field lib-field-search">
                        <span class="lib-field-label">find</span>
                        <input type="text" id="searchInput" placeholder="by name, kind, description…" />
                    </label>
                    <button id="saveCurrentShader" type="button"><span>save current</span><span class="b-meta">↓</span></button>
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
            'basics': 'Basics — start here',
            'noise': 'Noise',
            'fractals': 'Fractals',
            'nature': 'Nature',
            'geometric': 'Geometric',
            'trippy': 'Trippy',
            'art': 'Art History',
            'custom': 'Custom'
        };
        return displayNames[category] || category;
    }

    getCategoryLabel(category) {
        const labels = {
            'basics': 'Basics',
            'noise': 'Noise',
            'fractals': 'Fractals',
            'nature': 'Nature',
            'geometric': 'Geometric',
            'trippy': 'Trippy',
            'art': 'Art History',
            'custom': 'Custom'
        };
        return labels[category] || category;
    }

    createShaderRow(shader, index = 0) {
        const num = String(index + 1).padStart(2, '0');
        const deleteBtn = !shader.isPreset
            ? `<button class="delete-btn" data-action="delete" data-shader="${shader.name}" aria-label="Delete">delete</button>`
            : '';

        return `
            <div class="shader-row${shader.isPreset ? '' : ' is-custom'}" data-shader-name="${shader.name}">
                <span class="row-num">${num}</span>
                <div class="shader-row-info">
                    <span class="shader-row-name">${shader.name}</span>
                    <span class="shader-row-desc">${shader.description}</span>
                </div>
                <div class="shader-row-actions">
                    ${deleteBtn}
                    <button class="load-btn" data-action="load" data-shader="${shader.name}"><span>load</span><span class="b-meta">→</span></button>
                </div>
            </div>
        `;
    }

    getCategoryIcon(category) {
        return '';
    }
}
