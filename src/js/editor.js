import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, indentOnInput, foldGutter, foldKeymap } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { oneDark } from '@codemirror/theme-one-dark';
import { vim } from '@replit/codemirror-vim';
import { glslLanguage } from './glsl-mode.js';

const COMPILE_DEBOUNCE_MS = 300;

export class ShaderEditor {
    constructor(renderer, settings) {
        this.renderer = renderer;
        this.settings = settings;
        this.container = document.getElementById('codeContainer');
        this.errorDisplay = document.getElementById('errorMsg');
        this.currentShader = '';
        this.compileTimeout = null;
        this.view = null;
        this.vimCompartment = new Compartment();
        this.fontSizeCompartment = new Compartment();
    }

    init(defaultShader) {
        this.currentShader = defaultShader;

        const vimEnabled = this.settings.get('vimMode', true);
        const fontSize = this.settings.get('fontSize', 14);

        const state = EditorState.create({
            doc: defaultShader,
            extensions: [
                this.vimCompartment.of(vimEnabled ? vim() : []),
                lineNumbers(),
                highlightActiveLineGutter(),
                history(),
                foldGutter(),
                drawSelection(),
                EditorState.allowMultipleSelections.of(true),
                indentOnInput(),
                syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
                bracketMatching(),
                closeBrackets(),
                autocompletion(),
                highlightActiveLine(),
                highlightSelectionMatches(),
                glslLanguage,
                oneDark,
                this.fontSizeCompartment.of(EditorView.theme({
                    '&': { fontSize: `${fontSize}px` },
                    '.cm-scroller': { fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace" },
                })),
                keymap.of([
                    ...closeBracketsKeymap,
                    ...defaultKeymap,
                    ...searchKeymap,
                    ...historyKeymap,
                    ...foldKeymap,
                    ...completionKeymap,
                    indentWithTab,
                ]),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        this.scheduleCompile();
                    }
                    this.refreshVimIndicator();
                }),
            ],
        });

        this.view = new EditorView({
            state,
            parent: this.container,
        });

        this.compileShader();
        this.updateVimIndicator();
    }

    isFocused() {
        return this.view && this.view.hasFocus;
    }

    scheduleCompile() {
        if (this.compileTimeout) {
            clearTimeout(this.compileTimeout);
        }
        this.compileTimeout = setTimeout(() => this.compileShader(), COMPILE_DEBOUNCE_MS);
    }

    compileShader() {
        const code = this.getCode();
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

    enableVimMode() {
        this.view.dispatch({
            effects: this.vimCompartment.reconfigure(vim()),
        });
        this.updateVimIndicator();
    }

    disableVimMode() {
        this.view.dispatch({
            effects: this.vimCompartment.reconfigure([]),
        });
        this.updateVimIndicator();
    }

    setVimMode(enabled) {
        if (enabled) this.enableVimMode();
        else this.disableVimMode();
    }

    updateVimIndicator() {
        let indicator = document.getElementById('vimIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'vimIndicator';
            indicator.className = 'vim-indicator';
            document.body.appendChild(indicator);
        }
        this._vimIndicator = indicator;
        this.refreshVimIndicator();
    }

    refreshVimIndicator() {
        const indicator = this._vimIndicator || document.getElementById('vimIndicator');
        if (!indicator) return;

        const vimEnabled = this.settings.get('vimMode', true);
        if (!vimEnabled) {
            indicator.style.display = 'none';
            return;
        }

        const cm = this.view && this.view.cm;
        const vimState = cm && cm.state && cm.state.vim;
        let mode = 'NORMAL';
        if (vimState) {
            if (vimState.insertMode) mode = 'INSERT';
            else if (vimState.visualMode) mode = 'VISUAL';
        }
        const text = `VIM: ${mode}`;
        if (indicator.textContent !== text) indicator.textContent = text;
        indicator.style.display = 'block';
    }

    setFontSize(px) {
        this.view.dispatch({
            effects: this.fontSizeCompartment.reconfigure(EditorView.theme({
                '&': { fontSize: `${px}px` },
                '.cm-scroller': { fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace" },
            })),
        });
    }

    getCode() {
        return this.view.state.doc.toString();
    }

    setCode(code) {
        this.view.dispatch({
            changes: { from: 0, to: this.view.state.doc.length, insert: code },
        });
        this.compileShader();
    }

    focus() {
        this.view.focus();
    }

    selectAll() {
        const len = this.view.state.doc.length;
        this.view.dispatch({ selection: { anchor: 0, head: len } });
        this.focus();
    }

    copy() {
        const sel = this.view.state.selection.main;
        const text = sel.empty ? this.getCode() : this.view.state.sliceDoc(sel.from, sel.to);
        navigator.clipboard.writeText(text);
    }

    paste() {
        navigator.clipboard.readText().then((text) => {
            const sel = this.view.state.selection.main;
            this.view.dispatch({
                changes: { from: sel.from, to: sel.to, insert: text },
                selection: { anchor: sel.from + text.length },
            });
        });
    }
}
