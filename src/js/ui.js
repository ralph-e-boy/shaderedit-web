import { ShaderLibrary } from './shader-library.js';
import { THEME_LIST, DEFAULT_THEME } from './editor-themes.js';

const MENU_BAR_HTML = `
    <div class="masthead">
        <span class="masthead-mark">se.fragment</span>
        <span class="masthead-rev">v0.4 · GLSL editor</span>
    </div>
    <nav class="menu-rail" aria-label="Application menu">
        <div class="menu-item" data-menu="file">
            <span class="menu-label">file</span>
            <div class="dropdown">
                <div class="menu-option" data-action="new"><span class="opt-num">01</span><span class="opt-name">new</span><span class="opt-shortcut">draft</span></div>
                <div class="menu-option" data-action="open"><span class="opt-num">02</span><span class="opt-name">open</span><span class="opt-shortcut">disk</span></div>
                <div class="menu-option" data-action="save"><span class="opt-num">03</span><span class="opt-name">save</span><span class="opt-shortcut">⌘S</span></div>
                <div class="separator"></div>
                <div class="menu-option" data-action="export-png"><span class="opt-num">04</span><span class="opt-name">export png</span><span class="opt-shortcut">image</span></div>
            </div>
        </div>
        <span class="menu-sep" aria-hidden="true">·</span>
        <div class="menu-item" data-menu="edit">
            <span class="menu-label">edit</span>
            <div class="dropdown">
                <div class="menu-option" data-action="copy"><span class="opt-num">01</span><span class="opt-name">copy</span><span class="opt-shortcut">⌘C</span></div>
                <div class="menu-option" data-action="paste"><span class="opt-num">02</span><span class="opt-name">paste</span><span class="opt-shortcut">⌘V</span></div>
                <div class="menu-option" data-action="select-all"><span class="opt-num">03</span><span class="opt-name">select all</span><span class="opt-shortcut">⌘A</span></div>
                <div class="separator"></div>
                <div class="menu-option" data-action="settings"><span class="opt-num">04</span><span class="opt-name">prefs</span><span class="opt-shortcut">⇧⌘,</span></div>
            </div>
        </div>
        <span class="menu-sep" aria-hidden="true">·</span>
        <div class="menu-item" data-menu="view">
            <span class="menu-label">view</span>
            <div class="dropdown">
                <div class="menu-option" data-action="fullscreen"><span class="opt-num">01</span><span class="opt-name">fullscreen</span><span class="opt-shortcut">f11</span></div>
                <div class="menu-option" data-action="toggle-ui"><span class="opt-num">02</span><span class="opt-name">hide ui</span><span class="opt-shortcut">solo</span></div>
            </div>
        </div>
        <span class="menu-sep" aria-hidden="true">·</span>
        <div class="menu-item" data-menu="shader">
            <span class="menu-label">shader</span>
            <div class="dropdown">
                <div class="menu-option" data-action="library"><span class="opt-num">01</span><span class="opt-name">library</span><span class="opt-shortcut">presets</span></div>
            </div>
        </div>
    </nav>
    <nav class="menu-mobile" aria-label="Mobile menu">
        <button class="mm-btn mm-primary" data-action="library" type="button">
            <span class="mm-stamp">library</span>
            <span class="mm-meta">shaders</span>
        </button>
        <button class="mm-btn" data-action="fullscreen" type="button" aria-label="Fullscreen">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>
            </svg>
        </button>
    </nav>
    <div class="menu-edit-button">
        <button id="editBtn" data-action="toggle-editor" type="button"><span class="ed-stamp">edit</span><span class="ed-meta">⌘E</span></button>
    </div>
`;

const settingsPanelHTML = (s) => `
    <div class="settings-content">
        <span class="bracket br-tl" aria-hidden="true"></span>
        <span class="bracket br-tr" aria-hidden="true"></span>
        <span class="bracket br-bl" aria-hidden="true"></span>
        <span class="bracket br-br" aria-hidden="true"></span>
        <div class="settings-header">
            <div class="path-mark">
                <span class="path-prefix">se</span>
                <span class="path-slash">/</span>
                <span class="path-name">prefs</span>
            </div>
            <h2>Preferences</h2>
            <button class="close-btn" data-action="close-settings" aria-label="Close">×</button>
        </div>
        <div class="settings-body">
            <div class="setting-row">
                <span class="setting-num">01</span>
                <span class="setting-label">vim keybindings</span>
                <span class="setting-meta">modal editing; esc for normal, i for insert</span>
                <label class="toggle"><input type="checkbox" id="vimMode" ${s.get('vimMode') ? 'checked' : ''}><span class="toggle-track"></span></label>
            </div>
            <div class="setting-row">
                <span class="setting-num">02</span>
                <span class="setting-label">auto-compile</span>
                <span class="setting-meta">recompile on edit, 300ms debounce</span>
                <label class="toggle"><input type="checkbox" id="autoCompile" ${s.get('autoCompile') ? 'checked' : ''}><span class="toggle-track"></span></label>
            </div>
            <div class="setting-row">
                <span class="setting-num">03</span>
                <span class="setting-label">line numbers</span>
                <span class="setting-meta">gutter row indices</span>
                <label class="toggle"><input type="checkbox" id="showLineNumbers" ${s.get('showLineNumbers') ? 'checked' : ''}><span class="toggle-track"></span></label>
            </div>
            <div class="setting-row range-row">
                <span class="setting-num">04</span>
                <span class="setting-label">type size</span>
                <span class="setting-meta">editor body, 10–24 pt</span>
                <div class="range-control">
                    <input type="range" id="fontSize" min="10" max="24" value="${s.get('fontSize')}" />
                    <span class="value">${s.get('fontSize')}<small>pt</small></span>
                </div>
            </div>
            <div class="setting-row select-row">
                <span class="setting-num">05</span>
                <span class="setting-label">syntax theme</span>
                <span class="setting-meta">editor colors; choose what's easiest to read</span>
                <div class="select-control">
                    <select id="editorTheme">
                        ${THEME_LIST.map(({ id, name }) => {
                            const sel = s.get('editorTheme', DEFAULT_THEME) === id ? 'selected' : '';
                            return `<option value="${id}" ${sel}>${name}</option>`;
                        }).join('')}
                    </select>
                </div>
            </div>
            <div class="setting-row range-row">
                <span class="setting-num">06</span>
                <span class="setting-label">panel opacity</span>
                <span class="setting-meta">see the shader through the editor; 10–100%</span>
                <div class="range-control">
                    <input type="range" id="editorOpacity" min="10" max="100" value="${s.get('editorOpacity', 95)}" />
                    <span class="value">${s.get('editorOpacity', 95)}<small>%</small></span>
                </div>
            </div>
        </div>
    </div>
`;

const libraryPanelHTML = `
    <div class="library-panel-content">
        <span class="bracket br-tl" aria-hidden="true"></span>
        <span class="bracket br-tr" aria-hidden="true"></span>
        <span class="bracket br-bl" aria-hidden="true"></span>
        <span class="bracket br-br" aria-hidden="true"></span>
        <div class="library-panel-header">
            <div class="path-mark">
                <span class="path-prefix">se</span>
                <span class="path-slash">/</span>
                <span class="path-name">library</span>
            </div>
            <h2>Library</h2>
            <button class="close-btn" data-action="close-library" aria-label="Close">×</button>
        </div>
        <div id="libraryContent" class="library-content"></div>
    </div>
`;

export class UIManager {
    constructor(editor, settings) {
        this.editor = editor;
        this.settings = settings;
        this.isEditorOpen = false;
        this.isFullscreen = false;
        this.isUIHidden = false;
        this.shaderLibrary = new ShaderLibrary();
        this.currentShaderName = 'Fragment';
        this.defaultShaderName = 'Fragment';
    }

    setShaderTitle(name) {
        this.currentShaderName = name || this.defaultShaderName || 'Fragment';
        const h2 = document.getElementById('editorTitle');
        if (h2) h2.textContent = this.currentShaderName;
        const pathName = document.querySelector('.path-mark .path-name');
        if (pathName) {
            const slug = (name || 'editor').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            pathName.textContent = slug;
        }
    }

    async init() {
        await this.shaderLibrary.init();
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.createMenuBar();
        this.createSettingsPanel();
        this.createShaderLibraryPanel();
        this.updateUI();
        this.scheduleWelcomeOverlay();
    }

    scheduleWelcomeOverlay() {
        const overlay = document.getElementById('welcomeOverlay');
        if (!overlay) return;
        let shown = false;
        let dismissed = false;

        const show = () => {
            if (dismissed) return;
            shown = true;
            overlay.classList.add('is-visible');
            overlay.setAttribute('aria-hidden', 'false');
        };

        const dismiss = () => {
            if (dismissed) return;
            dismissed = true;
            if (!shown) {
                overlay.remove();
                return;
            }
            overlay.classList.remove('is-visible');
            overlay.classList.add('is-dismissed');
            overlay.setAttribute('aria-hidden', 'true');
            setTimeout(() => overlay.remove(), 400);
            document.removeEventListener('click', onClick, true);
        };

        const onClick = (e) => {
            const action = e.target.closest('[data-welcome-action]')?.dataset.welcomeAction;
            if (action === 'open-basics') {
                e.preventDefault();
                e.stopPropagation();
                this.openLibraryAtCategory('basics');
            }
            dismiss();
        };

        setTimeout(show, 500);
        document.addEventListener('click', onClick, true);
    }

    openLibraryAtCategory(category) {
        this.shaderLibrary.currentCategory = category;
        const order = this.shaderLibrary.getCategoryOrder();
        for (const cat of order) {
            if (cat === category) {
                this.shaderLibrary.collapsedCategories.delete(cat);
            } else {
                this.shaderLibrary.collapsedCategories.add(cat);
            }
        }
        this.showShaderLibrary();
    }

    setupEventListeners() {
        const applyBtn = document.getElementById('applyBtn');
        applyBtn.addEventListener('click', () => {
            this.closeEditor();
        });

        const editorHeader = document.getElementById('editorHeader');
        editorHeader && editorHeader.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            if (action === 'font-inc') this.bumpFontSize(+1);
            else if (action === 'font-dec') this.bumpFontSize(-1);
            else if (action === 'dock-left' || action === 'dock-right') {
                const target = action === 'dock-left' ? 'left' : 'right';
                const current = this.settings.get('editorDock', 'center');
                this.setEditorDock(current === target ? 'center' : target);
            }
            else if (action === 'settings') this.showSettings();
        });

        this.setupDockResize();
        this.applyDockWidth(this.settings.get('editorDockWidth', 640));
        this.applyEditorOpacity(this.settings.get('editorOpacity', 95));

        this.syncFontSizeReadout(this.settings.get('fontSize', 14));

        document.addEventListener('settingsChanged', (e) => {
            this.handleSettingsChange(e.detail);
        });

        document.addEventListener('shader-save-requested', () => {
            this.saveFile();
        });

        document.addEventListener('shader-commit-requested', () => {
            if (this.isEditorOpen) this.closeEditor();
        });

        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        }, true);

        document.addEventListener('fullscreenchange', () => {
            this.isFullscreen = !!document.fullscreenElement;
            this.updateUI();
        });
    }

    createMenuBar() {
        const menuBar = document.createElement('div');
        menuBar.id = 'menuBar';
        menuBar.className = 'menu-bar';
        menuBar.innerHTML = MENU_BAR_HTML;

        const canvas = document.getElementById('canvas');
        canvas.parentNode.insertBefore(menuBar, canvas);

        this.setupMenuEventListeners(menuBar);
    }

    setupMenuEventListeners(menuBar) {
        const existingMenuBar = document.querySelector('.menu-bar');
        if (existingMenuBar && existingMenuBar !== menuBar) {
            existingMenuBar.remove();
        }

        menuBar.addEventListener('click', (e) => {
            e.stopPropagation();

            const action = e.target.dataset.action || e.target.closest('[data-action]')?.dataset.action;
            if (action) {
                this.handleMenuAction(action);
                this.closeAllDropdowns();
                return;
            }

            const menuItem = e.target.closest('.menu-item');
            const isDropdownClick = e.target.closest('.dropdown');

            if (menuItem && !isDropdownClick) {
                const dropdown = menuItem.querySelector('.dropdown');
                if (dropdown) {
                    const wasOpen = dropdown.classList.contains('show');
                    this.closeAllDropdowns();
                    if (!wasOpen) {
                        setTimeout(() => {
                            dropdown.classList.add('show');
                        }, 10);
                    }
                }
            }
        });

        if (!document._menuClickListenerAdded) {
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.menu-bar')) {
                    this.closeAllDropdowns();
                }
            });
            document._menuClickListenerAdded = true;
        }
    }

    closeAllDropdowns() {
        const dropdowns = document.querySelectorAll('.menu-bar .dropdown');
        dropdowns.forEach(dropdown => dropdown.classList.remove('show'));
    }

    handleMenuAction(action) {
        switch (action) {
            case 'new':
                this.editor.setCode('// new fragment\nvoid main() {\n    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n}\n');
                this.setShaderTitle('Untitled');
                break;
            case 'copy':
                this.editor.copy();
                break;
            case 'paste':
                this.editor.paste();
                break;
            case 'select-all':
                this.editor.selectAll();
                break;
            case 'settings':
                this.showSettings();
                break;
            case 'fullscreen':
                this.toggleFullscreen();
                break;
            case 'library':
                this.showShaderLibrary();
                break;
            case 'open':
                this.openFile();
                break;
            case 'save':
                this.saveFile();
                break;
            case 'export-png':
                this.exportPNG();
                break;
            case 'toggle-ui':
                this.toggleUIVisibility();
                break;
            case 'toggle-editor':
                this.toggleEditor();
                break;
        }
    }

    createSettingsPanel() {
        const settingsPanel = document.createElement('div');
        settingsPanel.id = 'settingsPanel';
        settingsPanel.className = 'settings-panel';
        settingsPanel.innerHTML = settingsPanelHTML(this.settings);

        document.body.appendChild(settingsPanel);
        this.setupSettingsEventListeners(settingsPanel);
    }

    setupSettingsEventListeners(panel) {
        panel.addEventListener('click', (e) => {
            if (e.target.dataset.action === 'close-settings') {
                this.hideSettings();
            }
        });

        panel.addEventListener('change', (e) => {
            const id = e.target.id;
            const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;

            if (id) {
                this.settings.set(id, e.target.type === 'range' ? parseInt(value) : value);

                if (e.target.type === 'range') {
                    const wrap = e.target.closest('.range-control');
                    const valueSpan = wrap && wrap.querySelector('.value');
                    if (valueSpan) {
                        const unit = id === 'fontSize' ? 'pt' : id === 'editorOpacity' ? '%' : '';
                        valueSpan.textContent = value;
                        if (unit) {
                            const small = document.createElement('small');
                            small.textContent = unit;
                            valueSpan.appendChild(small);
                        }
                    }
                }
            }
        });

        panel.addEventListener('click', (e) => {
            if (e.target === panel) {
                this.hideSettings();
            }
        });
    }

    toggleEditor() {
        const overlay = document.getElementById('editorOverlay');
        const editBtn = document.getElementById('editBtn');

        this.isEditorOpen = !this.isEditorOpen;

        if (this.isEditorOpen) {
            overlay.classList.add('open');
            editBtn && editBtn.classList.add('is-active');
            this.setEditorDock(this.settings.get('editorDock', 'center'));
        } else {
            overlay.classList.remove('open');
            editBtn && editBtn.classList.remove('is-active');
        }
    }

    closeEditor() {
        const overlay = document.getElementById('editorOverlay');
        const editBtn = document.getElementById('editBtn');

        this.isEditorOpen = false;
        overlay.classList.remove('open');
        editBtn && editBtn.classList.remove('is-active');
    }

    setEditorDock(mode) {
        const overlay = document.getElementById('editorOverlay');
        overlay.classList.remove('dock-left', 'dock-right');
        if (mode === 'left')  overlay.classList.add('dock-left');
        if (mode === 'right') overlay.classList.add('dock-right');
        this.settings.set('editorDock', mode);
        this.updateDockButtons(mode);
        requestAnimationFrame(() => this.editor.focus());
    }

    updateDockButtons(mode) {
        const left = document.querySelector('[data-action="dock-left"]');
        const right = document.querySelector('[data-action="dock-right"]');
        left && left.classList.toggle('is-active', mode === 'left');
        right && right.classList.toggle('is-active', mode === 'right');
    }

    applyDockWidth(px) {
        const w = Math.round(px);
        document.documentElement.style.setProperty('--dock-width', `${w}px`);
        return w;
    }

    applyEditorOpacity(pct) {
        const v = Math.max(0, Math.min(100, Math.round(pct))) / 100;
        document.documentElement.style.setProperty('--editor-panel-opacity', String(v));
    }

    setupDockResize() {
        const handle = document.getElementById('dockResizeHandle');
        if (!handle) return;
        let dragging = false;
        let mode = 'center';
        let pointerId = null;
        const vw = () => document.documentElement.clientWidth;

        handle.addEventListener('pointerdown', (e) => {
            mode = this.settings.get('editorDock', 'center');
            if (mode !== 'left' && mode !== 'right') return;
            dragging = true;
            pointerId = e.pointerId;
            handle.setPointerCapture(pointerId);
            handle.classList.add('is-dragging');
            document.body.classList.add('dock-resizing');
            e.preventDefault();
        });

        handle.addEventListener('pointermove', (e) => {
            if (!dragging || e.pointerId !== pointerId) return;
            const target = mode === 'left'
                ? e.clientX - 16
                : vw() - e.clientX - 16;
            this.applyDockWidth(target);
        });

        const stop = (e) => {
            if (!dragging) return;
            if (e && e.pointerId !== undefined && e.pointerId !== pointerId) return;
            dragging = false;
            if (pointerId !== null && handle.hasPointerCapture(pointerId)) {
                handle.releasePointerCapture(pointerId);
            }
            pointerId = null;
            handle.classList.remove('is-dragging');
            document.body.classList.remove('dock-resizing');
            const current = parseInt(
                getComputedStyle(document.documentElement).getPropertyValue('--dock-width'),
                10
            );
            if (!Number.isNaN(current)) this.settings.set('editorDockWidth', current);
        };
        handle.addEventListener('pointerup', stop);
        handle.addEventListener('pointercancel', stop);
        handle.addEventListener('lostpointercapture', stop);
    }

    showSettings() {
        document.getElementById('settingsPanel').classList.add('show');
    }

    hideSettings() {
        document.getElementById('settingsPanel').classList.remove('show');
    }

    showShaderLibrary() {
        document.getElementById('shaderLibraryPanel').classList.add('show');
        this.updateLibraryContent();
    }

    hideShaderLibrary() {
        document.getElementById('shaderLibraryPanel').classList.remove('show');
    }

    updateLibraryContent() {
        const libraryContent = document.getElementById('libraryContent');
        libraryContent.innerHTML = this.shaderLibrary.createLibraryHTML();
        this.setupLibraryEventListeners();
    }

    createShaderLibraryPanel() {
        const libraryPanel = document.createElement('div');
        libraryPanel.id = 'shaderLibraryPanel';
        libraryPanel.className = 'shader-library-panel';
        libraryPanel.innerHTML = libraryPanelHTML;

        document.body.appendChild(libraryPanel);

        libraryPanel.addEventListener('click', (e) => {
            if (e.target.dataset.action === 'close-library' || e.target === libraryPanel) {
                this.hideShaderLibrary();
            }
        });
    }

    setupLibraryEventListeners() {
        const libraryContent = document.getElementById('libraryContent');

        const categorySelect = libraryContent.querySelector('#categorySelect');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.shaderLibrary.currentCategory = e.target.value;
                this.updateLibraryContent();
            });
        }

        this.wireCustomSelects(libraryContent);

        const searchInput = libraryContent.querySelector('#searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleShaderSearch(e.target.value);
            });
        }

        libraryContent.addEventListener('click', (e) => {
            const categoryHeader = e.target.closest('[data-toggle-category]');
            if (categoryHeader) {
                const cat = categoryHeader.dataset.toggleCategory;
                this.shaderLibrary.toggleCategory(cat);
                this.updateLibraryContent();
                return;
            }

            const action = e.target.dataset.action || e.target.closest('[data-action]')?.dataset.action;
            const shaderName = e.target.dataset.shader || e.target.closest('[data-shader]')?.dataset.shader;

            switch (action) {
                case 'load':
                    this.loadShader(shaderName);
                    return;
                case 'delete':
                    this.deleteShader(shaderName);
                    return;
            }

            const row = e.target.closest('.shader-row');
            if (row && row.dataset.shaderName) {
                this.loadShader(row.dataset.shaderName);
            }
        });

        const saveBtn = libraryContent.querySelector('#saveCurrentShader');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveCurrentShader();
            });
        }
    }

    loadShader(shaderName) {
        const shaders = this.shaderLibrary.getAllShaders();
        const shader = shaders.find(s => s.name === shaderName);

        if (shader) {
            this.editor.setCode(shader.code);
            this.setShaderTitle(shaderName);
            this.hideShaderLibrary();
            // Don't auto-open the editor — let the user see the shader first.
            // They can hit ⌘E or the Edit button if they want to look at the code.
        }
    }

    deleteShader(shaderName) {
        if (confirm(`Delete "${shaderName}"?`)) {
            this.shaderLibrary.deleteCustomShader(shaderName);
            this.updateLibraryContent();
        }
    }

    saveCurrentShader() {
        const name = prompt('Name this shader:');
        if (name) {
            const description = prompt('Brief description (optional):') || '';
            const code = this.editor.getCode();
            this.shaderLibrary.saveCustomShader(name, code, description);
            this.setShaderTitle(name);
            this.updateLibraryContent();
        }
    }

    wireCustomSelects(root) {
        const selects = root.querySelectorAll('[data-custom-select]');
        selects.forEach(wrap => {
            const toggle = wrap.querySelector('[data-cs-toggle]');
            const popup = wrap.querySelector('[data-cs-popup]');
            const native = wrap.querySelector('.cs-native');
            if (!toggle || !popup || !native) return;

            const close = () => {
                wrap.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            };
            const open = () => {
                document.querySelectorAll('[data-custom-select].is-open').forEach(w => {
                    if (w !== wrap) w.classList.remove('is-open');
                });
                wrap.classList.add('is-open');
                toggle.setAttribute('aria-expanded', 'true');
            };

            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                wrap.classList.contains('is-open') ? close() : open();
            });

            popup.addEventListener('click', (e) => {
                const opt = e.target.closest('[data-cs-option]');
                if (!opt) return;
                const value = opt.dataset.csOption;
                native.value = value;
                native.dispatchEvent(new Event('change', { bubbles: true }));
                close();
            });

            if (!document._customSelectCloseAdded) {
                document.addEventListener('click', () => {
                    document.querySelectorAll('[data-custom-select].is-open').forEach(w => {
                        w.classList.remove('is-open');
                        const t = w.querySelector('[data-cs-toggle]');
                        if (t) t.setAttribute('aria-expanded', 'false');
                    });
                });
                document._customSelectCloseAdded = true;
            }
        });
    }

    handleShaderSearch(query) {
        const librarySections = document.querySelector('.library-sections');
        if (!librarySections) return;

        if (query.trim() === '') {
            this.updateLibraryContent();
        } else {
            const results = this.shaderLibrary.searchShaders(query);
            librarySections.innerHTML = results.map(shader => this.shaderLibrary.createShaderRow(shader)).join('');
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    handleKeyboard(e) {
        if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey && e.code === 'Comma') {
                e.preventDefault();
                this.showSettings();
                return;
            }
            switch (e.key) {
                case 'e':
                    e.preventDefault();
                    this.toggleEditor();
                    break;
                case 's':
                    e.preventDefault();
                    this.saveFile();
                    break;
            }
        }

        if (e.key === 'Escape') {
            if (this.isUIHidden) {
                this.showUI();
            } else if (document.getElementById('shaderLibraryPanel').classList.contains('show')) {
                this.hideShaderLibrary();
            } else if (document.getElementById('settingsPanel').classList.contains('show')) {
                this.hideSettings();
            } else if (this.isEditorOpen) {
                if (this.settings.get('vimMode', true) && this.editor.isFocused()) {
                    return;
                }
                this.closeEditor();
            } else if (document.fullscreenElement) {
                document.exitFullscreen();
            }
        }
    }

    openFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.glsl,.frag,.vert,.txt';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 1024 * 1024) {
                alert('File is too large. Shader files should be under 1MB.');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                this.editor.setCode(event.target.result);
                this.setShaderTitle(file.name.replace(/\.[^.]+$/, ''));
                if (!this.isEditorOpen) {
                    this.toggleEditor();
                }
            };
            reader.onerror = () => alert('Failed to read file.');
            reader.readAsText(file);
        });
        input.click();
    }

    saveFile() {
        const code = this.editor.getCode();
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'shader.glsl';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    exportPNG() {
        const canvas = this.editor.renderer.canvas;
        this.editor.renderer.render();
        const dataURL = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = 'shader-export.png';
        a.click();
    }

    toggleUIVisibility() {
        this.isUIHidden = true;
        document.getElementById('menuBar').style.display = 'none';
        if (this.isEditorOpen) {
            this.closeEditor();
        }
        this.showRestoreHint();
    }

    showRestoreHint() {
        let hint = document.getElementById('uiRestoreHint');
        if (!hint) {
            hint = document.createElement('div');
            hint.id = 'uiRestoreHint';
            hint.className = 'ui-restore-hint';
            hint.textContent = 'esc · restore chrome';
            hint.addEventListener('click', () => this.showUI());
            document.body.appendChild(hint);
        }
        hint.style.display = 'block';
        hint.style.opacity = '1';
        setTimeout(() => { hint.style.opacity = '0.18'; }, 3000);
    }

    showUI() {
        this.isUIHidden = false;
        document.getElementById('menuBar').style.display = 'flex';
        const hint = document.getElementById('uiRestoreHint');
        if (hint) hint.style.display = 'none';
    }

    setupDragAndDrop() {
        const body = document.body;
        body.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            body.classList.add('drag-over');
        });
        body.addEventListener('dragleave', (e) => {
            if (e.relatedTarget === null) {
                body.classList.remove('drag-over');
            }
        });
        body.addEventListener('drop', (e) => {
            e.preventDefault();
            body.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (!file) return;
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            if (!['.glsl', '.frag', '.vert', '.txt'].includes(ext)) {
                alert('Drop a shader file (.glsl, .frag, .vert, .txt)');
                return;
            }
            if (file.size > 1024 * 1024) {
                alert('File too large; under 1MB please.');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                this.editor.setCode(event.target.result);
                this.setShaderTitle(file.name.replace(/\.[^.]+$/, ''));
                if (!this.isEditorOpen) {
                    this.toggleEditor();
                }
            };
            reader.onerror = () => alert('Failed to read file.');
            reader.readAsText(file);
        });
    }

    handleSettingsChange(detail) {
        const { key, value } = detail;

        switch (key) {
            case 'vimMode':
                this.editor.setVimMode(value);
                break;
            case 'fontSize':
                this.editor.setFontSize(value);
                this.syncFontSizeReadout(value);
                break;
            case 'editorTheme':
                this.editor.setTheme(value);
                break;
            case 'editorOpacity':
                this.applyEditorOpacity(value);
                break;
        }
    }

    bumpFontSize(delta) {
        const cur = this.settings.get('fontSize', 14);
        const next = Math.max(8, Math.min(32, cur + delta));
        if (next === cur) return;
        this.settings.set('fontSize', next);
        const slider = document.getElementById('fontSize');
        if (slider) slider.value = next;
    }

    syncFontSizeReadout(value) {
        const readout = document.getElementById('fontSizeReadout');
        if (readout) readout.innerHTML = `${value}<small>pt</small>`;
    }

    updateUI() {
        const menuBar = document.getElementById('menuBar');
        if (!menuBar) return;
        if (this.isFullscreen || this.isUIHidden) {
            menuBar.style.display = 'none';
        } else {
            menuBar.style.display = 'flex';
        }
    }
}
