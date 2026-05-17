// ============================================================
// 03 · Mouse
// ------------------------------------------------------------
// The `mouse` uniform tells you where the cursor is, in
// normalized [0..1] screen coords. We can use that to draw
// a soft glow that follows your pointer around.
//
// The trick is `length(uv - mouse)` — the distance from the
// current pixel to the mouse. Closer pixels are brighter.
// `smoothstep` gives us a clean, anti-aliased falloff.
// ============================================================

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;
uniform vec2  mouse;       // 0..1 across the screen

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    // Aspect correction: stretch x so distances are circular
    // instead of egg-shaped on non-square displays.
    vec2 p = (uv - mouse) * vec2(resolution.x / resolution.y, 1.0);
    float dist = length(p);

    // Soft glow: 1 at the cursor, fading to 0 over `radius`.
    float radius = 0.18;
    float glow = smoothstep(radius, 0.0, dist);

    // Subtle pulse: brighten with time
    glow *= 0.7 + 0.3 * sin(time * 3.0);

    // Background grid so you can see motion
    vec2 g = fract(uv * 12.0) - 0.5;
    float grid = smoothstep(0.45, 0.50, max(abs(g.x), abs(g.y)));

    vec3 col = vec3(0.04, 0.04, 0.06) + grid * vec3(0.10, 0.10, 0.14);
    col += vec3(1.0, 0.4, 0.2) * glow;

    gl_FragColor = vec4(col, 1.0);
}
