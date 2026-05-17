import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, HighlightStyle, bracketMatching, indentOnInput, foldGutter, foldKeymap } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { tags as t } from '@lezer/highlight';
import { vim } from '@replit/codemirror-vim';
import { glslLanguage } from './glsl-mode.js';

const PAPER = '#e8dcc1';
const PAPER_DIM = '#a89779';
const PAPER_MUTED = '#74684f';
const INK = '#0a0907';
const RULE = '#3a3122';
const VERMILLION = '#d9532a';
const VERMILLION_DIM = '#a8401f';
const GOLD = '#c79b3f';
const WINE = '#5a1f1f';

const almanacTheme = EditorView.theme({
    '&': {
        color: PAPER,
        backgroundColor: 'transparent',
        height: '100%',
    },
    '.cm-content': {
        caretColor: VERMILLION,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontFeatureSettings: '"calt", "ss01", "ss02", "tnum"',
        padding: '20px 8px',
    },
    '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: VERMILLION,
        borderLeftWidth: '1.5px',
    },
    '&.cm-focused .cm-cursor': { borderLeftColor: VERMILLION },
    '.cm-line': { padding: '0 4px' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
        backgroundColor: 'rgba(217, 83, 42, 0.22)',
    },
    '.cm-activeLine': { backgroundColor: 'rgba(232, 220, 193, 0.025)' },
    '.cm-activeLineGutter': {
        backgroundColor: 'transparent',
        color: VERMILLION,
    },
    '.cm-gutters': {
        backgroundColor: 'transparent',
        color: PAPER_MUTED,
        border: 'none',
        borderRight: `1px solid ${RULE}`,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: '11px',
        fontWeight: '300',
    },
    '.cm-lineNumbers .cm-gutterElement': {
        padding: '0 12px 0 18px',
        minWidth: '36px',
        fontVariantNumeric: 'tabular-nums oldstyle-nums',
        letterSpacing: '0.02em',
    },
    '.cm-foldGutter .cm-gutterElement': { color: PAPER_MUTED, padding: '0 4px' },
    '.cm-scroller': {
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        lineHeight: '1.6',
    },
    '.cm-tooltip': {
        backgroundColor: '#16120c',
        border: `1px solid ${RULE}`,
        color: PAPER,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    },
    '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
        padding: '4px 10px',
    },
    '.cm-tooltip-autocomplete ul li[aria-selected]': {
        backgroundColor: 'rgba(217, 83, 42, 0.18)',
        color: PAPER,
    },
    '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
        backgroundColor: 'transparent',
        outline: `1px solid ${VERMILLION_DIM}`,
        color: PAPER,
    },
    '.cm-searchMatch': { backgroundColor: 'rgba(199, 155, 63, 0.25)' },
    '.cm-searchMatch.cm-searchMatch-selected': { backgroundColor: 'rgba(217, 83, 42, 0.35)' },
    '.cm-panels': { backgroundColor: '#15110a', color: PAPER, borderTop: `1px solid ${RULE}` },
    '.cm-panel input': {
        backgroundColor: 'transparent',
        color: PAPER,
        border: `1px solid ${RULE}`,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    },
}, { dark: true });

const almanacHighlight = HighlightStyle.define([
    { tag: t.comment, color: PAPER_MUTED, fontStyle: 'italic' },
    { tag: t.lineComment, color: PAPER_MUTED, fontStyle: 'italic' },
    { tag: t.blockComment, color: PAPER_MUTED, fontStyle: 'italic' },
    { tag: t.meta, color: VERMILLION, fontWeight: '500' },
    { tag: t.processingInstruction, color: VERMILLION, fontWeight: '500' },
    { tag: t.keyword, color: PAPER, fontWeight: '600' },
    { tag: t.controlKeyword, color: PAPER, fontWeight: '600' },
    { tag: t.operatorKeyword, color: PAPER, fontWeight: '600' },
    { tag: t.modifier, color: PAPER, fontWeight: '600' },
    { tag: t.typeName, color: PAPER, fontStyle: 'normal', fontWeight: '500', textDecoration: 'none' },
    { tag: t.standard(t.variableName), color: PAPER_DIM, fontStyle: 'italic' },
    { tag: t.function(t.variableName), color: PAPER, fontWeight: '400' },
    { tag: t.atom, color: GOLD, fontWeight: '500' },
    { tag: t.bool, color: GOLD, fontWeight: '500' },
    { tag: t.number, color: VERMILLION_DIM },
    { tag: t.integer, color: VERMILLION_DIM },
    { tag: t.float, color: VERMILLION_DIM },
    { tag: t.string, color: GOLD },
    { tag: t.operator, color: PAPER_DIM },
    { tag: t.punctuation, color: PAPER_DIM },
    { tag: t.bracket, color: PAPER_DIM },
    { tag: t.variableName, color: PAPER },
    { tag: t.propertyName, color: PAPER },
    { tag: t.invalid, color: VERMILLION, textDecoration: 'underline wavy' },
]);

const almanacExtensions = [almanacTheme, syntaxHighlighting(almanacHighlight)];

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
                bracketMatching(),
                closeBrackets(),
                autocompletion(),
                highlightActiveLine(),
                highlightSelectionMatches(),
                glslLanguage,
                almanacExtensions,
                this.fontSizeCompartment.of(EditorView.theme({
                    '&': { fontSize: `${fontSize}px` },
                })),
                keymap.of([
                    {
                        key: 'Mod-s',
                        preventDefault: true,
                        run: () => {
                            document.dispatchEvent(new CustomEvent('shader-save-requested'));
                            return true;
                        },
                    },
                    {
                        key: 'Mod-Shift-Enter',
                        preventDefault: true,
                        run: () => {
                            document.dispatchEvent(new CustomEvent('shader-commit-requested'));
                            return true;
                        },
                    },
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

        this.setFontSize(fontSize);
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
        if (this.view && this.view.dom) {
            this.view.dom.style.fontSize = `${px}px`;
            this.view.requestMeasure();
        }
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
