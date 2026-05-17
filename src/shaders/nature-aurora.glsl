// ============================================================
// Aurora Borealis — Northern Lights
// ------------------------------------------------------------
// Real aurora hang as VERTICAL CURTAINS of ionized gas.
// They're brightest at the bottom (where particles hit O₂),
// fade to red at the top (where they hit thinner air),
// and ripple horizontally like a wind-blown drape.
//
// Strategy:
//   1. For each pixel's x, sample a noisy 1D "curtain mask"
//      that tells us where curtains exist (vertical strips).
//   2. Within each strip, draw a vertical gradient:
//        green low → cyan mid → magenta top.
//   3. Add brightness that flickers with another noise
//      so the curtains shimmer.
// ============================================================

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// ---- noise (cheap, hash-based) ---------------------------------
float hash(float n) { return fract(sin(n) * 43758.5453); }

float noise1(float x) {
    float i = floor(x);
    float f = fract(x);
    return mix(hash(i), hash(i + 1.0), smoothstep(0.0, 1.0, f));
}

// Layered noise (fractal Brownian motion) — gives natural detail
float fbm1(float x) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
        v += a * noise1(x);
        x *= 2.0;
        a *= 0.5;
    }
    return v;
}

void main() {
    // Centered, aspect-correct coords; y∈[-1..1], 0 = horizon
    vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / min(resolution.x, resolution.y);

    // ---- sky background: deep navy → black ---------------------
    vec3 col = mix(vec3(0.03, 0.04, 0.10),
                   vec3(0.00, 0.00, 0.02),
                   smoothstep(-0.2, 0.9, uv.y));

    // ---- stars: pinpoints in the upper sky ---------------------
    vec2 starGrid = floor(uv * 120.0);
    float starSeed = hash(starGrid.x + starGrid.y * 57.0);
    float star = step(0.985, starSeed) * step(0.0, uv.y);
    col += vec3(0.9, 0.95, 1.0) * star;

    // ---- THE AURORA --------------------------------------------
    // We build it from 3 layered curtains, each drifting at a
    // different speed so they cross and overlap like real aurora.
    for (int layer = 0; layer < 3; layer++) {
        float fi = float(layer);

        // Each layer's curtain mask: a horizontal noise pattern
        // that says "how bright should a curtain be at this x?"
        float drift = time * (0.05 + fi * 0.04);
        float curtainShape = fbm1(uv.x * (2.0 + fi * 0.7) + drift + fi * 17.0);

        // Squeeze the noise to make ribbons (peaks become curtains)
        float ribbon = smoothstep(0.45, 0.85, curtainShape);

        // Vertical extent: bottom anchored, fading upward
        float vBase = -0.15 + fi * 0.05;
        float vTop  =  0.55 - fi * 0.05;
        float vMask = smoothstep(vBase - 0.05, vBase + 0.10, uv.y) *
                      smoothstep(vTop, vTop - 0.55, uv.y);

        // Edge wobble — gives the curtain its waving look
        float wobble = 0.04 * sin(uv.y * 8.0 + time * 0.8 + fi * 2.0);
        float edge = fbm1(uv.x * 6.0 + uv.y * 1.5 + time * 0.4 + fi);
        ribbon *= smoothstep(0.35, 0.55, edge + wobble);

        // Intensity falls off as we go up the curtain
        float intensity = ribbon * vMask;
        intensity *= 1.2 - smoothstep(0.0, 0.4, uv.y) * 0.5;

        // Color gradient up the curtain:
        //   green at base, cyan middle, magenta tip
        float vGrad = smoothstep(vBase, vTop, uv.y);
        vec3 hueLow  = vec3(0.10, 0.95, 0.45);   // emerald
        vec3 hueMid  = vec3(0.20, 0.70, 0.95);   // cyan
        vec3 hueHigh = vec3(0.85, 0.25, 0.70);   // magenta
        vec3 hue = mix(hueLow, hueMid, smoothstep(0.0, 0.5, vGrad));
        hue = mix(hue, hueHigh, smoothstep(0.55, 1.0, vGrad));

        // Add a fine flicker so the curtain isn't static
        float flicker = 0.7 + 0.3 *
            fbm1(uv.x * 12.0 + time * 1.4 + fi * 3.0);

        col += hue * intensity * flicker * 0.9;
    }

    // ---- distant ground silhouette -----------------------------
    float horizon = smoothstep(-0.35, -0.40, uv.y + 0.04 *
                               sin(uv.x * 3.2) +
                               0.02 * sin(uv.x * 11.0));
    col = mix(col, vec3(0.01, 0.012, 0.02), horizon);

    // Slight bottom haze from aurora reflecting on snow
    col += vec3(0.05, 0.20, 0.10) * horizon * 0.3 *
           smoothstep(-0.6, -0.4, uv.y);

    gl_FragColor = vec4(col, 1.0);
}
