// Shader editor with syntax highlighting and vim support
export class ShaderEditor {
    constructor(renderer, settings) {
        this.renderer = renderer;
        this.settings = settings;
        this.textarea = document.getElementById('codeEditor');
        this.highlighted = document.getElementById('highlighted');
        this.errorDisplay = document.getElementById('errorMsg');
        this.currentShader = '';
        this.compileTimeout = null;
        this.vimMode = null;
    }

    init(defaultShader) {
        this.currentShader = defaultShader;
        this.textarea.value = defaultShader;
        this.updateHighlighting();
        this.compileShader();

        // Setup event listeners
        this.setupEventListeners();

        // Initialize vim mode if enabled
        if (this.settings.get('vimMode', true)) {
            this.enableVimMode();
        }

        // Show initial vim indicator
        this.updateVimIndicator();
    }

    setupEventListeners() {
        // Auto-compile on input with debouncing
        this.textarea.addEventListener('input', (e) => {
            this.updateHighlighting();
            this.scheduleCompile();
        });

        // Sync scrolling
        this.textarea.addEventListener('scroll', () => {
            this.highlighted.scrollTop = this.textarea.scrollTop;
            this.highlighted.scrollLeft = this.textarea.scrollLeft;
        });

        // Handle tab key properly
        this.textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.textarea.selectionStart;
                const end = this.textarea.selectionEnd;
                const value = this.textarea.value;

                if (e.shiftKey) {
                    // Unindent
                    const lineStart = value.lastIndexOf('\\n', start - 1) + 1;
                    if (value.substring(lineStart, lineStart + 4) === '    ') {
                        this.textarea.value = value.substring(0, lineStart) + value.substring(lineStart + 4);
                        this.textarea.selectionStart = this.textarea.selectionEnd = start - 4;
                    }
                } else {
                    // Indent
                    this.textarea.value = value.substring(0, start) + '    ' + value.substring(end);
                    this.textarea.selectionStart = this.textarea.selectionEnd = start + 4;
                }
                this.updateHighlighting();
                this.scheduleCompile();
            }
        });
    }

    scheduleCompile() {
        if (this.compileTimeout) {
            clearTimeout(this.compileTimeout);
        }
        this.compileTimeout = setTimeout(() => {
            this.compileShader();
        }, 300); // 300ms debounce
    }

    compileShader() {
        const code = this.textarea.value;
        const result = this.renderer.setFragmentShader(code);

        if (result.success) {
            this.hideError();
            this.currentShader = code;
        } else {
            this.showError(result.error);
        }
    }

    showError(error) {
        this.errorDisplay.textContent = error;
        this.errorDisplay.classList.add('show');
    }

    hideError() {
        this.errorDisplay.classList.remove('show');
        this.errorDisplay.textContent = '';
    }

    updateHighlighting() {
        this.highlighted.innerHTML = this.highlightGLSL(this.textarea.value);
    }

    highlightGLSL(code) {
        const keywords = /\\b(void|float|int|bool|vec2|vec3|vec4|mat2|mat3|mat4|sampler2D|if|else|for|while|return|break|continue|discard|attribute|uniform|varying|const|in|out|inout|precision|lowp|mediump|highp|struct|main)\\b/g;
        const types = /\\b(gl_Position|gl_FragCoord|gl_FragColor|gl_PointSize)\\b/g;
        const functions = /\\b(sin|cos|tan|asin|acos|atan|pow|exp|log|sqrt|abs|sign|floor|ceil|fract|mod|min|max|clamp|mix|step|smoothstep|length|distance|dot|cross|normalize|reflect|refract|texture2D)\\b/g;
        const numbers = /\\b(\\d+\\.?\\d*|\\.\\d+)\\b/g;
        const comments = /(\/\/[^\\n]*|\/\\*[\\s\\S]*?\\*\/)/g;
        const preprocessor = /^(#.*$)/gm;

        return code
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(comments, '<span style="color: #6A9955">$1</span>')
            .replace(preprocessor, '<span style="color: #C586C0">$1</span>')
            .replace(keywords, '<span style="color: #569CD6">$1</span>')
            .replace(types, '<span style="color: #4EC9B0">$1</span>')
            .replace(functions, '<span style="color: #DCDCAA">$1</span>')
            .replace(numbers, '<span style="color: #B5CEA8">$1</span>');
    }

    enableVimMode() {
        // Basic vim mode implementation
        // This is a simplified version - we'll enhance it later
        this.vimMode = {
            mode: 'insert', // 'normal', 'insert', 'visual'
            keyBuffer: ''
        };

        this.textarea.addEventListener('keydown', (e) => {
            if (this.settings.get('vimMode', true)) {
                this.handleVimKey(e);
            }
        });
    }

    handleVimKey(e) {
        if (!this.vimMode) return;

        // ESC always goes to normal mode - prevent it from closing editor
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            this.vimMode.mode = 'normal';
            this.vimMode.keyBuffer = '';
            this.updateVimIndicator();
            return;
        }

        // In insert mode, only handle ESC
        if (this.vimMode.mode === 'insert') {
            return;
        }

        // Normal mode key handling
        if (this.vimMode.mode === 'normal') {
            e.preventDefault();
            this.handleNormalModeKey(e.key);
        }
    }

    handleNormalModeKey(key) {
        const textarea = this.textarea;
        const pos = textarea.selectionStart;
        const lines = textarea.value.split('\\n');
        const currentLineIndex = textarea.value.substring(0, pos).split('\\n').length - 1;
        const currentLine = lines[currentLineIndex];
        const posInLine = pos - textarea.value.split('\\n').slice(0, currentLineIndex).join('\\n').length - (currentLineIndex > 0 ? 1 : 0);

        switch (key) {
            case 'i':
                this.vimMode.mode = 'insert';
                break;
            case 'h':
                if (pos > 0) textarea.selectionStart = textarea.selectionEnd = pos - 1;
                break;
            case 'l':
                if (pos < textarea.value.length) textarea.selectionStart = textarea.selectionEnd = pos + 1;
                break;
            case 'j':
                if (currentLineIndex < lines.length - 1) {
                    const nextLineStart = textarea.value.split('\\n').slice(0, currentLineIndex + 1).join('\\n').length + 1;
                    const nextLine = lines[currentLineIndex + 1];
                    const newPos = nextLineStart + Math.min(posInLine, nextLine.length);
                    textarea.selectionStart = textarea.selectionEnd = newPos;
                }
                break;
            case 'k':
                if (currentLineIndex > 0) {
                    const prevLineStart = textarea.value.split('\\n').slice(0, currentLineIndex - 1).join('\\n').length + (currentLineIndex > 1 ? 1 : 0);
                    const prevLine = lines[currentLineIndex - 1];
                    const newPos = prevLineStart + Math.min(posInLine, prevLine.length);
                    textarea.selectionStart = textarea.selectionEnd = newPos;
                }
                break;
        }

        this.updateVimIndicator();
    }

    updateVimIndicator() {
        // Create or update vim indicator
        let indicator = document.getElementById('vimIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'vimIndicator';
            indicator.className = 'vim-indicator';
            document.body.appendChild(indicator);
        }

        if (this.vimMode && this.settings.get('vimMode', true)) {
            indicator.textContent = `VIM: ${this.vimMode.mode.toUpperCase()}`;
            indicator.style.display = 'block';
        } else {
            indicator.style.display = 'none';
        }
    }

    getCode() {
        return this.textarea.value;
    }

    setCode(code) {
        this.textarea.value = code;
        this.updateHighlighting();
        this.compileShader();
    }

    selectAll() {
        this.textarea.select();
    }

    copy() {
        navigator.clipboard.writeText(this.textarea.value);
    }

    paste() {
        navigator.clipboard.readText().then(text => {
            const start = this.textarea.selectionStart;
            const end = this.textarea.selectionEnd;
            const value = this.textarea.value;

            this.textarea.value = value.substring(0, start) + text + value.substring(end);
            this.textarea.selectionStart = this.textarea.selectionEnd = start + text.length;

            this.updateHighlighting();
            this.scheduleCompile();
        });
    }
}