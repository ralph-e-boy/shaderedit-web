// UI manager for the shader editor
import { ShaderLibrary } from './shader-library.js';

export class UIManager {
    constructor(editor, settings) {
        this.editor = editor;
        this.settings = settings;
        this.isEditorOpen = false;
        this.isFullscreen = false;
        this.shaderLibrary = new ShaderLibrary();
    }

    async init() {
        await this.shaderLibrary.init();
        this.setupEventListeners();
        this.createMenuBar();
        this.createSettingsPanel();
        this.createShaderLibraryPanel();
        this.updateUI();
    }

    setupEventListeners() {
        // Edit button
        const editBtn = document.getElementById('editBtn');
        editBtn.addEventListener('click', () => {
            this.toggleEditor();
        });

        // Apply button (we'll remove this later for auto-compile)
        const applyBtn = document.getElementById('applyBtn');
        applyBtn.addEventListener('click', () => {
            this.closeEditor();
        });

        // Settings changes
        document.addEventListener('settingsChanged', (e) => {
            this.handleSettingsChange(e.detail);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });

        // Fullscreen change
        document.addEventListener('fullscreenchange', () => {
            this.isFullscreen = !!document.fullscreenElement;
            this.updateUI();
        });
    }

    createMenuBar() {
        const menuBar = document.createElement('div');
        menuBar.id = 'menuBar';
        menuBar.className = 'menu-bar';
        menuBar.innerHTML = `
            <div class="menu-item" data-menu="file">
                <span>File</span>
                <div class="dropdown">
                    <div class="menu-option" data-action="new">New</div>
                    <div class="menu-option" data-action="open">Open</div>
                    <div class="menu-option" data-action="save">Save</div>
                    <div class="separator"></div>
                    <div class="menu-option" data-action="export-png">Export PNG</div>
                    <div class="menu-option" data-action="export-gif">Export GIF</div>
                </div>
            </div>
            <div class="menu-item" data-menu="edit">
                <span>Edit</span>
                <div class="dropdown">
                    <div class="menu-option" data-action="copy">Copy</div>
                    <div class="menu-option" data-action="paste">Paste</div>
                    <div class="menu-option" data-action="select-all">Select All</div>
                    <div class="separator"></div>
                    <div class="menu-option" data-action="settings">Settings</div>
                </div>
            </div>
            <div class="menu-item" data-menu="view">
                <span>View</span>
                <div class="dropdown">
                    <div class="menu-option" data-action="fullscreen">Fullscreen</div>
                    <div class="menu-option" data-action="toggle-ui">Hide UI</div>
                </div>
            </div>
            <div class="menu-item" data-menu="shader">
                <span>Shader</span>
                <div class="dropdown">
                    <div class="menu-option" data-action="library">Library</div>
                    <div class="menu-option" data-action="examples">Examples</div>
                </div>
            </div>
            <div class="menu-edit-button">
                <button id="menuEditBtn" data-action="toggle-editor">✏️ Edit Shader</button>
            </div>
        `;

        // Insert before canvas
        const canvas = document.getElementById('canvas');
        canvas.parentNode.insertBefore(menuBar, canvas);

        // Add event listeners for menu
        this.setupMenuEventListeners(menuBar);
    }

    setupMenuEventListeners(menuBar) {
        // Remove any existing listeners to prevent duplicates
        const existingMenuBar = document.querySelector('.menu-bar');
        if (existingMenuBar && existingMenuBar !== menuBar) {
            existingMenuBar.remove();
        }

        menuBar.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling

            const action = e.target.dataset.action;
            if (action) {
                this.handleMenuAction(action);
                this.closeAllDropdowns();
                return;
            }

            // Only handle clicks on menu item headers, not dropdowns
            const menuItem = e.target.closest('.menu-item');
            const isDropdownClick = e.target.closest('.dropdown');

            if (menuItem && !isDropdownClick) {
                const dropdown = menuItem.querySelector('.dropdown');
                if (dropdown) {
                    const wasOpen = dropdown.classList.contains('show');

                    // Always close all dropdowns first
                    this.closeAllDropdowns();

                    // Then open this one only if it wasn't already open
                    if (!wasOpen) {
                        setTimeout(() => {
                            dropdown.classList.add('show');
                        }, 10); // Small delay to ensure close happens first
                    }
                }
            }
        });

        // Close dropdowns when clicking outside (but only add this listener once)
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
                this.editor.setCode('// New shader\\nvoid main() {\\n    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\\n}');
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
            case 'toggle-editor':
                this.toggleEditor();
                break;
            default:
                console.log('Menu action not yet implemented:', action);
        }
    }

    createSettingsPanel() {
        const settingsPanel = document.createElement('div');
        settingsPanel.id = 'settingsPanel';
        settingsPanel.className = 'settings-panel';
        settingsPanel.innerHTML = `
            <div class="settings-content">
                <div class="settings-header">
                    <h2>Settings</h2>
                    <button class="close-btn" data-action="close-settings">×</button>
                </div>
                <div class="settings-body">
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="vimMode" ${this.settings.get('vimMode') ? 'checked' : ''}>
                            Enable Vim/Vi keybindings
                        </label>
                    </div>
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="autoCompile" ${this.settings.get('autoCompile') ? 'checked' : ''}>
                            Auto-compile on edit
                        </label>
                    </div>
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="showLineNumbers" ${this.settings.get('showLineNumbers') ? 'checked' : ''}>
                            Show line numbers
                        </label>
                    </div>
                    <div class="setting-group">
                        <label>Font Size:</label>
                        <input type="range" id="fontSize" min="10" max="24" value="${this.settings.get('fontSize')}" />
                        <span class="value">${this.settings.get('fontSize')}px</span>
                    </div>
                    <div class="setting-group">
                        <label>
                            <select id="theme">
                                <option value="dark" ${this.settings.get('theme') === 'dark' ? 'selected' : ''}>Dark</option>
                                <option value="light" ${this.settings.get('theme') === 'light' ? 'selected' : ''}>Light</option>
                            </select>
                            Theme
                        </label>
                    </div>
                </div>
            </div>
        `;

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

                // Update value display for range inputs
                if (e.target.type === 'range') {
                    const valueSpan = e.target.nextElementSibling;
                    if (valueSpan) {
                        valueSpan.textContent = value + (id === 'fontSize' ? 'px' : '');
                    }
                }
            }
        });

        // Close on outside click
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
            editBtn.textContent = 'Close Editor';
        } else {
            overlay.classList.remove('open');
            editBtn.textContent = 'Edit Shader';
        }
    }

    closeEditor() {
        const overlay = document.getElementById('editorOverlay');
        const editBtn = document.getElementById('editBtn');

        this.isEditorOpen = false;
        overlay.classList.remove('open');
        editBtn.textContent = 'Edit Shader';
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
        // Don't close the editor - let them both be open
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
        libraryPanel.innerHTML = `
            <div class="library-panel-content">
                <div class="library-panel-header">
                    <button class="close-btn" data-action="close-library">×</button>
                </div>
                <div id="libraryContent" class="library-content">
                    <!-- Library content will be inserted here -->
                </div>
            </div>
        `;

        document.body.appendChild(libraryPanel);

        // Setup close functionality
        libraryPanel.addEventListener('click', (e) => {
            if (e.target.dataset.action === 'close-library' || e.target === libraryPanel) {
                this.hideShaderLibrary();
            }
        });
    }

    setupLibraryEventListeners() {
        const libraryContent = document.getElementById('libraryContent');

        // Category selection
        const categorySelect = libraryContent.querySelector('#categorySelect');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.shaderLibrary.currentCategory = e.target.value;
                this.updateLibraryContent();
            });
        }

        // Search functionality
        const searchInput = libraryContent.querySelector('#searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleShaderSearch(e.target.value);
            });
        }

        // Shader actions
        libraryContent.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const shaderName = e.target.dataset.shader;

            switch (action) {
                case 'load':
                    this.loadShader(shaderName);
                    break;
                case 'delete':
                    this.deleteShader(shaderName);
                    break;
            }
        });

        // Save current shader
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
            this.hideShaderLibrary();
            // Keep editor open so user can see the loaded code
            if (!this.isEditorOpen) {
                this.toggleEditor();
            }
            console.log(`🚀 Loaded shader: ${shaderName}`);
        }
    }

    deleteShader(shaderName) {
        if (confirm(`Are you sure you want to delete "${shaderName}"?`)) {
            this.shaderLibrary.deleteCustomShader(shaderName);
            this.updateLibraryContent();
        }
    }

    saveCurrentShader() {
        const name = prompt('Enter a name for this shader:');
        if (name) {
            const description = prompt('Enter a description (optional):') || '';
            const code = this.editor.getCode();
            this.shaderLibrary.saveCustomShader(name, code, description);
            this.updateLibraryContent();
            console.log(`💾 Saved shader: ${name}`);
        }
    }

    handleShaderSearch(query) {
        const libraryGrid = document.querySelector('.library-grid');
        if (!libraryGrid) return;

        if (query.trim() === '') {
            // Show all shaders in current category
            const shaders = this.shaderLibrary.getShadersByCategory(this.shaderLibrary.currentCategory);
            libraryGrid.innerHTML = shaders.map(shader => this.shaderLibrary.createShaderCard(shader)).join('');
        } else {
            // Show search results
            const results = this.shaderLibrary.searchShaders(query);
            libraryGrid.innerHTML = results.map(shader => this.shaderLibrary.createShaderCard(shader)).join('');
        }

        this.setupLibraryEventListeners();
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    handleKeyboard(e) {
        // Keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'e':
                    e.preventDefault();
                    this.toggleEditor();
                    break;
                case 's':
                    e.preventDefault();
                    // Save functionality
                    break;
                case ',':
                    e.preventDefault();
                    this.showSettings();
                    break;
            }
        }

        // Escape key
        if (e.key === 'Escape') {
            if (document.getElementById('settingsPanel').classList.contains('show')) {
                this.hideSettings();
            } else if (this.isEditorOpen) {
                this.closeEditor();
            } else if (document.fullscreenElement) {
                document.exitFullscreen();
            }
        }
    }

    handleSettingsChange(detail) {
        const { key, value } = detail;

        switch (key) {
            case 'vimMode':
                if (value) {
                    this.editor.enableVimMode();
                }
                break;
            case 'fontSize':
                this.updateFontSize(value);
                break;
            case 'theme':
                this.updateTheme(value);
                break;
        }
    }

    updateFontSize(size) {
        const editor = document.getElementById('codeEditor');
        const highlighted = document.getElementById('highlighted');

        if (editor) editor.style.fontSize = size + 'px';
        if (highlighted) highlighted.style.fontSize = size + 'px';
    }

    updateTheme(theme) {
        document.body.className = theme + '-theme';
    }

    updateUI() {
        // Update UI based on current state
        const editBtn = document.getElementById('editBtn');
        const menuBar = document.getElementById('menuBar');

        if (this.isFullscreen) {
            editBtn.style.display = 'none';
            menuBar.style.display = 'none';
        } else {
            editBtn.style.display = 'block';
            menuBar.style.display = 'flex';
        }
    }
}