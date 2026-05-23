// ============================================================
// Composition — after Piet Mondrian
// ------------------------------------------------------------
// De Stijl: black grid lines on cream, with a handful of
// rectangles filled in primary red, blue, or yellow.
//
// We pick a small set of horizontal and vertical "cuts" that
// divide the canvas into a rectangular grid. The cuts shift
// slightly over time (very slowly) so it doesn't feel static.
// Each resulting rectangle is keyed by hash → one of the four
// fills (cream / red / blue / yellow).
// ============================================================

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Smooth-step over a single value at threshold t
float band(float x, float t, float w) {
    return smoothstep(t - w, t + w, x);
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    // Aspect-correct so cuts look "right" on widescreens
    float ar = resolution.x / resolution.y;
    vec2 p = vec2(uv.x * ar, uv.y);

    float thickness = 0.012;   // grid line half-width
    float t = time * 0.04;     // slow drift

    // Vertical cuts (x positions in aspect-corrected space)
    float vc[4];
    vc[0] = 0.30 * ar + 0.015 * sin(t * 1.1);
    vc[1] = 0.55 * ar + 0.013 * sin(t * 1.6 + 1.4);
    vc[2] = 0.78 * ar + 0.010 * sin(t * 0.8 + 2.7);
    vc[3] = 0.92 * ar;

    // Horizontal cuts (y positions)
    float hc[3];
    hc[0] = 0.28 + 0.012 * sin(t * 1.3);
    hc[1] = 0.55 + 0.010 * sin(t * 0.7 + 0.6);
    hc[2] = 0.82 + 0.009 * sin(t * 1.5 + 2.0);

    // Which column / row are we in? Encode as an integer 0..N
    float ci = 0.0;
    if (p.x > vc[0]) ci += 1.0;
    if (p.x > vc[1]) ci += 1.0;
    if (p.x > vc[2]) ci += 1.0;
    if (p.x > vc[3]) ci += 1.0;

    float ri = 0.0;
    if (p.y > hc[0]) ri += 1.0;
    if (p.y > hc[1]) ri += 1.0;
    if (p.y > hc[2]) ri += 1.0;

    // Per-rectangle hash → pick a fill from {cream, red, blue, yellow}
    float h = hash(vec2(ci, ri) + 0.3);

    // Cream dominates; primaries are rarer (Mondrian-ish weighting)
    vec3 col;
    if      (h < 0.62) col = vec3(0.94, 0.92, 0.86);   // cream
    else if (h < 0.74) col = vec3(0.85, 0.18, 0.14);   // cadmium red
    else if (h < 0.86) col = vec3(0.10, 0.22, 0.62);   // cobalt blue
    else if (h < 0.96) col = vec3(0.95, 0.82, 0.12);   // yellow
    else               col = vec3(0.08, 0.08, 0.10);   // occasional black

    // ---- BLACK GRID LINES -----------------------------------
    // Closeness to any cut line; if very close, paint black.
    float line = 0.0;
    line = max(line, 1.0 - band(abs(p.x - vc[0]), thickness, 0.001));
    line = max(line, 1.0 - band(abs(p.x - vc[1]), thickness, 0.001));
    line = max(line, 1.0 - band(abs(p.x - vc[2]), thickness, 0.001));
    line = max(line, 1.0 - band(abs(p.x - vc[3]), thickness, 0.001));
    line = max(line, 1.0 - band(abs(p.y - hc[0]), thickness, 0.001));
    line = max(line, 1.0 - band(abs(p.y - hc[1]), thickness, 0.001));
    line = max(line, 1.0 - band(abs(p.y - hc[2]), thickness, 0.001));

    // Outer frame
    line = max(line, 1.0 - band(p.x, thickness * 0.6, 0.001));
    line = max(line, 1.0 - band(ar - p.x, thickness * 0.6, 0.001));
    line = max(line, 1.0 - band(p.y, thickness * 0.6, 0.001));
    line = max(line, 1.0 - band(1.0 - p.y, thickness * 0.6, 0.001));

    col = mix(col, vec3(0.06, 0.06, 0.07), line);

    gl_FragColor = vec4(col, 1.0);
}
