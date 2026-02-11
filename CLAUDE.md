# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser-based GLSL fragment shader editor that provides real-time shader compilation and rendering using WebGL. The entire application is contained in a single `index.html` file with embedded CSS, JavaScript, and default shader code.

## Architecture

**Single-file application structure:**
- `index.html` - Contains the complete application (HTML structure, CSS styles, JavaScript logic, and default GLSL shader)
- No build system, package.json, or external dependencies
- Pure vanilla JavaScript with WebGL API
- Self-contained with inline syntax highlighting for GLSL

**Key components:**
- **Canvas rendering**: Full-screen WebGL canvas for shader output
- **Overlay editor**: Modal editor panel with syntax highlighting and error display
- **Shader compilation**: Real-time GLSL fragment shader compilation with error handling
- **Animation loop**: Continuous rendering with time and resolution uniforms

**WebGL pipeline:**
- Simple vertex shader creates a full-screen quad
- Fragment shader receives `time` (float) and `resolution` (vec2) uniforms
- Error handling displays compilation errors in the editor UI

## Development

**Running the application:**
```bash
# Serve locally (any HTTP server works)
python3 -m http.server 8000
# OR
npx serve .
# OR simply open index.html in a browser (file:// protocol works)
```

**Testing shaders:**
- Click "Edit Shader" button to open the editor
- Modify GLSL code in the textarea
- Click "Apply & Close" to compile and render
- Compilation errors appear in red banner above editor

**Code structure within index.html:**
- Lines 7-150: CSS styles for UI and editor
- Lines 173-217: Default fragment shader (spiral animation)
- Lines 230-235: Vertex shader source
- Lines 237-254: GLSL syntax highlighter
- Lines 256-307: Shader compilation and WebGL setup
- Lines 309-325: Render loop
- Lines 327-358: Event handlers and initialization

## Shader Development

**Available uniforms:**
- `uniform float time` - Elapsed time in seconds since shader start
- `uniform vec2 resolution` - Canvas dimensions in pixels

**GLSL conventions:**
- Fragment shader must output to `gl_FragColor`
- Use `gl_FragCoord.xy` for pixel coordinates
- Normalize coordinates: `(gl_FragCoord.xy - 0.5 * resolution.xy) / min(resolution.x, resolution.y)`

**Common patterns in default shader:**
- Distance field calculations: `length(uv)`
- Polar coordinates: `atan(uv.y, uv.x)`
- Time-based animation: `sin(pattern + time)`
- Color mixing: `mix(color1, color2, factor)`
- Vignette effects: `smoothstep(inner, outer, distance)`