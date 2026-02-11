# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Browser-based GLSL fragment shader editor with real-time WebGL rendering. Pure vanilla JavaScript with ES6 modules — no build system, no dependencies.

## Architecture

```
index.html              # Minimal shell: canvas, editor overlay, script module entry
src/
  css/styles.css        # All UI styling (dark/light themes, responsive)
  js/
    main.js             # Entry point — initializes and coordinates all modules
    renderer.js         # WebGL context, shader compilation, render loop, mouse tracking
    editor.js           # Code editor: syntax highlighting, vim mode, auto-compile, tab handling
    ui.js               # Menu bar, settings panel, shader library panel, keyboard shortcuts
    settings.js         # Persistent settings via localStorage (dispatches settingsChanged events)
    shader-library.js   # Built-in shader presets + custom shader save/load/delete
  shaders/              # GLSL fragment shader files (default.glsl, fractal-mandelbrot.glsl, etc.)
.llm/todo.md            # Implementation roadmap (7 phases)
```

**Module coordination:** `main.js` creates `ShaderApp` which instantiates ShaderRenderer, ShaderEditor, SettingsManager, and UIManager. Settings changes propagate via custom `settingsChanged` DOM events.

**WebGL pipeline:** Full-screen quad via triangle strip (4 vertices). Simple passthrough vertex shader. Fragment shaders compiled on-the-fly with error reporting back to the editor UI.

**State persistence:** `localStorage` keys: `shaderEditorSettings` (user prefs), `customShaders` (saved shader library, max 50).

## Development

Requires an HTTP server (ES6 modules don't work over file://):
```bash
python3 -m http.server 8000
# or
npx serve .
```

No tests, no linter, no build step. Manual testing by editing shaders in the browser.

## Shader Uniforms

All uniforms are optional — shaders can declare any subset:

| Uniform | Type | Description |
|---------|------|-------------|
| `time` | `float` | Elapsed seconds since shader start |
| `resolution` | `vec2` | Canvas dimensions in pixels |
| `mouse` | `vec2` | Normalized mouse position [0,1], Y-flipped |
| `mouseClick` | `vec2` | Last click position (normalized) |
| `mouseDown` | `float` | Mouse button state (0.0 or 1.0) |

**GLSL conventions:** Output to `gl_FragColor`. Normalize coordinates with `(gl_FragCoord.xy - 0.5 * resolution.xy) / min(resolution.x, resolution.y)`.

## Key UI Features

- **Auto-compilation**: Debounced (300ms) recompilation on every edit; errors shown in red banner
- **Vim mode**: Basic normal/insert mode (toggled in settings, default ON)
- **Shader library**: 6 built-in presets across categories (fractals, nature, geometric, trippy); users can save custom shaders
- **Keyboard shortcuts**: Ctrl+E (toggle editor), Ctrl+S (save), Ctrl+, (settings), ESC (close/exit fullscreen)
