// ============================================================
// Rain Storm — A wet, moody afternoon
// ------------------------------------------------------------
// Three layers of falling streaks build parallax depth.
// The lower band of the screen is a perspective-warped puddle
// where each impact spawns an expanding ripple. Stormy fbm
// clouds drift overhead and rare lightning lights it all up.
//
// Mouse:
//   X  — wind direction & streak slant
//   Y  — storm intensity (top = light drizzle, bottom = deluge)
// ============================================================

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;
uniform vec2  mouse;

// ---- cheap hashes & value noise -----------------------------
float hash1(float n) { return fract(sin(n) * 43758.5453123); }
float hash2(vec2  p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash2(i),               hash2(i + vec2(1.0, 0.0)), f.x),
               mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x), f.y);
}

float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; }
    return v;
}

// ---- one parallax layer of falling streaks ------------------
// scale    : how many cells across screen (smaller = bigger drops)
// speed    : fall rate
// slant    : how diagonal the streaks lean (wind)
// thick    : streak width
float rainLayer(vec2 uv, float scale, float speed, float slant, float thick) {
    uv.x += uv.y * slant;                       // diagonal fall (wind)
    vec2 gv = uv * vec2(scale, scale * 0.16);   // tall, narrow cells
    gv.y += time * speed;                       // scroll downward (cells move +y → world appears to fall)

    vec2 id = floor(gv);
    vec2 f  = fract(gv);

    // jitter each column horizontally so streaks don't align in rows
    float jx  = hash1(id.x * 31.13) - 0.5;
    float dx  = f.x - 0.5 - jx * 0.6;
    float bar = smoothstep(thick, 0.0, abs(dx));

    // only ~half the cells contain a drop (sparseness)
    float exists = step(0.55, hash2(id + 7.0));

    // head Y position within the cell, trail extends upward (higher y)
    float head = 0.15 + 0.7 * hash2(id + 1.0);
    float dy   = f.y - head;
    float trail = smoothstep(0.35, 0.0, dy) * step(0.0, dy);

    return bar * trail * exists;
}

// ---- expanding ripple rings on the puddle -------------------
// sampled in perspective-warped floor coords, summed across 3x3 cells
float ripples(vec2 puv) {
    vec2 gv = puv * 3.0;
    vec2 id = floor(gv);
    vec2 f  = fract(gv) - 0.5;
    float acc = 0.0;
    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2  o    = vec2(float(i), float(j));
            vec2  cid  = id + o;
            float seed = hash2(cid * 1.7);
            // jittered impact center inside each cell
            vec2  c    = o + vec2(hash2(cid + 11.0), hash2(cid + 19.0)) - 0.5;
            float per  = 1.2 + seed * 1.6;
            float t    = mod(time + seed * per * 7.0, per) / per;   // 0..1 lifecycle
            float r    = t * 0.45;
            float d    = length(f - c);
            float ring = smoothstep(0.06, 0.0, abs(d - r));
            // fade as the ring ages & also as radius grows large
            ring *= (1.0 - t) * (1.0 - smoothstep(0.0, 0.45, r));
            acc += ring;
        }
    }
    return acc;
}

void main() {
    // centered, aspect-correct coords; y=0 is screen middle, +y = up
    vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / min(resolution.x, resolution.y);

    // mouse → wind & intensity (normalized 0..1, default ≈ centered)
    vec2  m         = (resolution.x > 0.0) ? mouse / resolution.xy : vec2(0.5);
    float windSlant = (m.x - 0.5) * 0.7 + 0.18;        // default gentle right-lean
    float intensity = 0.65 + (1.0 - clamp(m.y, 0.0, 1.0)) * 0.8;

    // ---------- stormy sky gradient ----------
    vec3 skyTop = vec3(0.08, 0.11, 0.16);
    vec3 skyMid = vec3(0.20, 0.26, 0.32);
    vec3 skyLow = vec3(0.32, 0.40, 0.48);
    vec3 col = mix(skyMid, skyTop, smoothstep(0.0, 0.65, uv.y));
    col      = mix(col, skyLow, smoothstep(0.0, -0.3, uv.y));

    // dense low cloud cover, drifting with the wind
    float clouds = fbm(uv * vec2(1.4, 2.2) + vec2(time * 0.04, 0.0));
    clouds = smoothstep(0.42, 0.88, clouds);
    col = mix(col, vec3(0.13, 0.17, 0.22), clouds * 0.55);

    // thin atmospheric haze cuts contrast slightly
    float haze = fbm(uv * 7.0 + vec2(0.0, time * 0.5));
    col = mix(col, vec3(0.30, 0.36, 0.44), haze * 0.08);

    // ---------- puddle / wet ground ----------
    float horizonY  = -0.05;
    float depthRaw  = horizonY - uv.y;             // > 0 below horizon
    float puddleMix = smoothstep(0.0, 0.04, depthRaw);

    if (puddleMix > 0.0) {
        // mirrored sky reflection (slightly compressed vertically)
        vec2  reflUV    = vec2(uv.x, -uv.y - 0.10);
        float reflCloud = fbm(reflUV * vec2(1.4, 2.2) + vec2(time * 0.04, 0.0));
        vec3  wet       = mix(vec3(0.08, 0.11, 0.16), vec3(0.20, 0.27, 0.33), reflCloud);

        // darker pavement closer to the viewer
        float closeness = clamp(depthRaw * 4.0, 0.0, 1.0);
        wet = mix(wet, vec3(0.035, 0.05, 0.075), closeness * 0.65);
        col = mix(col, wet, puddleMix);

        // perspective-warped floor coords for ripple field
        float persp = 1.0 / max(depthRaw + 0.02, 0.02);
        vec2  puv   = vec2(uv.x * persp, persp * 0.6);
        float ring  = ripples(puv);
        // dim ripples right at the horizon where they'd be sub-pixel
        ring *= smoothstep(0.0, 0.35, closeness);
        col += vec3(0.45, 0.58, 0.72) * ring * 0.55 * puddleMix;
    }

    // ---------- rain streaks: far → near parallax ----------
    float r1 = rainLayer(uv,             40.0, 0.9, windSlant * 0.7, 0.018);
    float r2 = rainLayer(uv * 1.25 + 7.0, 22.0, 1.4, windSlant * 0.95, 0.025);
    float r3 = rainLayer(uv * 0.8  - 3.0, 12.0, 2.1, windSlant * 1.15, 0.040);

    // suppress streaks in the bottom puddle so they don't visually float on water
    float skyMask = 1.0 - puddleMix * 0.85;
    vec3  rainTint = vec3(0.68, 0.80, 0.94);
    col += rainTint * (r1 * 0.25 + r2 * 0.45 + r3 * 0.70) * intensity * skyMask;

    // ---------- occasional lightning flash ----------
    // rare: only when this slow fbm peaks; then a short double-blink
    float flashEnv  = smoothstep(0.93, 1.0, fbm(vec2(time * 0.18, 7.3)));
    float flashBlink = 0.55 + 0.45 * sin(time * 28.0);
    float flash      = flashEnv * flashBlink * flashBlink;
    col += vec3(0.72, 0.80, 0.95) * flash * 0.28;

    // ---------- vignette ----------
    float vig = 1.0 - dot(uv, uv) * 0.35;
    col *= vig;

    gl_FragColor = vec4(col, 1.0);
}
