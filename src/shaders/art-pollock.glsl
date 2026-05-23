// ============================================================
// Drip — after Jackson Pollock
// ------------------------------------------------------------
// Action painting on a dark canvas. We build up multiple
// "throws" of paint, each in a different color and at a
// different scale. Each throw uses FBM noise thresholded into
// blobs — the noise gives the organic, splattery quality you
// can't get from clean geometry.
//
// A finer "spatter" layer adds little dots and dribbles that
// sell the gestural look.
// ============================================================

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = smoothstep(0.0, 1.0, f);
    float a = hash(i);
    float b = hash(i + vec2(1, 0));
    float c = hash(i + vec2(0, 1));
    float d = hash(i + vec2(1, 1));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 6; i++) {
        v += a * vnoise(p);
        p *= 2.07;
        a *= 0.5;
    }
    return v;
}

// One "throw" of paint: noise-warped, thresholded into blobs
//   seed     — RNG offset so each throw is different
//   scale    — how big the splatter is
//   density  — how thick the coverage is (higher = more paint)
float throwPaint(vec2 p, float seed, float scale, float density) {
    // Warp the lookup so blobs aren't perfectly round
    vec2 q = p * scale + vec2(seed * 17.3, seed * 31.7);
    vec2 w = vec2(fbm(q), fbm(q + vec2(5.2, 1.3)));
    float n = fbm(q + w * 1.8);

    // Threshold: higher density = more area passes
    return smoothstep(0.55 - density, 0.45 - density, n);
}

// Fine spatter of small dots. Sparse (~1.5% of cells), each
// dot gets a random size so the layer doesn't feel mechanical.
float spatter(vec2 p, float seed) {
    float scale = 70.0;
    vec2 g  = floor(p * scale);
    float h = hash(g + seed);

    // ~1.5% of cells become a speck
    float isDot = step(0.985, h);

    // Per-dot size variation
    float sz = 0.18 + 0.22 * hash(g + seed + 19.0);

    vec2 cellP = fract(p * scale) - 0.5;
    return isDot * smoothstep(sz, sz * 0.5, length(cellP));
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    // Centered, square-correct coords; range ~ -1..1
    vec2 p = (uv - 0.5) * vec2(resolution.x / resolution.y, 1.0);

    // Bone-colored canvas with a warm wash
    vec3 col = vec3(0.92, 0.88, 0.80);
    col -= 0.04 * length(p);

    // Layer 1: black — the dominant Pollock "skeleton"
    float l1 = throwPaint(p, 1.1 + time * 0.02, 3.0, 0.18);
    col = mix(col, vec3(0.05, 0.04, 0.03), l1);

    // Layer 2: cadmium red, slightly bigger scale (smaller splatters)
    float l2 = throwPaint(p, 4.7 + time * 0.03, 5.0, 0.08);
    col = mix(col, vec3(0.78, 0.18, 0.12), l2);

    // Layer 3: titanium white, finer
    float l3 = throwPaint(p, 8.3 + time * 0.04, 7.0, 0.06);
    col = mix(col, vec3(0.94, 0.92, 0.86), l3);

    // Layer 4: chrome yellow, very fine
    float l4 = throwPaint(p, 12.5 + time * 0.05, 9.0, 0.05);
    col = mix(col, vec3(0.96, 0.78, 0.18), l4);

    // Fine spatter dots — drift in the same direction as the
    // paint pattern (toward lower-left, opposite of the noise
    // lookup offset), but slower → parallax.
    // The paint's noise lookup translates along ~(17.3, 31.7),
    // so the visible pattern moves opposite. Dots ride that
    // same direction at ~half the rate.
    vec2 paintDir = -normalize(vec2(17.3, 31.7));
    vec2 d1 = paintDir * time * 0.035;        // black layer
    vec2 d2 = paintDir * time * 0.022;        // white layer, slower depth
    col = mix(col, vec3(0.05),               spatter(p - d1, 1.0));
    col = mix(col, vec3(0.92, 0.92, 0.86),   spatter(p - d2 + 11.0, 7.0));

    // Subtle canvas grain
    col += (hash(floor(gl_FragCoord.xy)) - 0.5) * 0.04;

    gl_FragColor = vec4(col, 1.0);
}
