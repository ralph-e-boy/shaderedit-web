// ============================================================
// Rain Storm — A wet, moody afternoon
// ------------------------------------------------------------
// What makes rain *read* as rain (and not as falling meteors):
//   1. Streaks are short, uniform-brightness motion blurs —
//      no bright head + dim tail. A drop falling at terminal
//      velocity in one camera frame paints a roughly even line.
//   2. There are LOTS of them, varying in depth, never just a
//      few foreground hero streaks.
//   3. The whole curtain *gusts* — squalls of heavier and
//      lighter rain rolling through over a few seconds.
//
// The puddle on the lower band is more than ripple stamps:
//   - mirrored sky reflection, distorted by ripple height
//   - a constant fine surface "tremor" from background drops
//   - concentric wave ripples (a real ring is a damped sine,
//     not a single line) with bright crests
//   - splash points where new drops just landed
//
// Mouse:
//   X  — wind / streak slant
//   Y  — bias on the storm's average intensity
// ============================================================

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;
uniform vec2  mouse;

// ---------- hashes & noise ----------------------------------
float hash1(float n) { return fract(sin(n) * 43758.5453123); }
float hash2(vec2  p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash2(i),                 hash2(i + vec2(1.0, 0.0)), f.x),
               mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x), f.y);
}

float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; }
    return v;
}

// ---------- one parallax layer of streaks -------------------
// Each cell is wide-and-thin; we paint at most one short dash
// inside it. Dash brightness is flat through the middle with
// soft fade at both ends — a motion blur, not a comet.
float rainLayer(vec2 uv, float scale, float speed, float slant,
                float thick, float density) {
    uv.x += uv.y * slant;
    vec2 gv = uv * vec2(scale, scale * 0.15);
    gv.y += time * speed;
    vec2 id = floor(gv);
    vec2 f  = fract(gv);

    // jitter the streak horizontally per column
    float jx = hash1(id.x * 31.13 + id.y * 0.073) - 0.5;
    float dx = f.x - 0.5 - jx * 0.7;
    float bar = 1.0 - smoothstep(0.0, thick, abs(dx));

    // sparse: some cells empty (density drives the storm strength)
    float exists = step(1.0 - density, hash2(id + 7.0));

    // dash center & half-length within the cell
    float yc   = 0.30 + 0.40 * hash2(id + 1.0);
    float yLen = 0.18 + 0.10 * hash2(id + 5.0);
    float dy   = f.y - yc;

    // flat top with soft ends — uniform-brightness motion blur
    float dash = 1.0 - smoothstep(yLen * 0.55, yLen, abs(dy));

    return bar * dash * exists;
}

// ---------- puddle ripples ----------------------------------
// Returns (brightness, surface-height) so the caller can use
// the height field to distort the reflection.
//
// Each cell hosts at most one impact. Within its lifetime t∈[0,1]
// we paint:
//   - an initial splash dot at t≈0
//   - an expanding damped sine wave (the actual ring + secondary)
vec2 ripples(vec2 puv, float gust) {
    vec2 gv = puv * 4.0;
    vec2 id = floor(gv);
    vec2 f  = fract(gv) - 0.5;
    float bright = 0.0;
    float height = 0.0;

    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2  o    = vec2(float(i), float(j));
            vec2  cid  = id + o;
            float seed = hash2(cid * 1.7);

            // jittered impact center
            vec2  c = o + vec2(hash2(cid + 11.0), hash2(cid + 19.0)) - 0.5;

            // gust controls how many cells are "live"
            float live = step(0.30 + (1.0 - gust) * 0.45, hash2(cid * 3.1));

            float per  = 1.4 + seed * 1.8;
            float t    = mod(time + seed * per * 7.0, per) / per;   // 0..1
            float r    = t * 0.45;
            float d    = length(f - c);

            // damped sine wave radiating from impact — gives 2-3
            // concentric crests inside the ring envelope
            float phase = (d - r) * 55.0;
            float env   = exp(-pow((d - r) * 8.0, 2.0));            // bell around d=r
            float wave  = sin(phase) * env;
            float life  = (1.0 - t) * smoothstep(0.5, 0.05, r);

            // bright crests (positive lobes of the sine)
            float crest = max(0.0, wave) * life * live;

            // splash dot at impact — bright but very short-lived
            float splash = smoothstep(0.05, 0.0, d) *
                           smoothstep(0.10, 0.0, t) * live;

            bright += crest * 0.9 + splash * 1.8;
            height += wave * life * live * 0.06;
        }
    }
    return vec2(bright, height);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / min(resolution.x, resolution.y);
    vec2 m  = (resolution.x > 0.0) ? mouse / resolution.xy : vec2(0.5);

    // ----- storm intensity pulses over seconds ----------------
    // Slow fbm of time gives squalls and lulls; pow biases toward
    // calmer baseline punctuated by bursts.
    float gustRaw  = fbm(vec2(time * 0.10, 1.7));
    float gust     = pow(clamp(gustRaw * 1.15, 0.0, 1.0), 1.6);
    gust = 0.30 + 0.70 * gust;                 // remap to [0.30, 1.00]

    float intensityBias = 0.55 + (1.0 - clamp(m.y, 0.0, 1.0)) * 0.7;
    float intensity     = gust * intensityBias;

    float windSlant = (m.x - 0.5) * 0.6 + 0.20;

    // ---------- stormy sky ---------------------------------
    vec3 skyTop = vec3(0.07, 0.10, 0.15);
    vec3 skyMid = vec3(0.19, 0.25, 0.32);
    vec3 skyLow = vec3(0.34, 0.42, 0.50);
    vec3 col = mix(skyMid, skyTop, smoothstep(0.0, 0.65, uv.y));
    col      = mix(col, skyLow, smoothstep(0.0, -0.30, uv.y));

    // low broken clouds, drifting
    float clouds = fbm(uv * vec2(1.4, 2.2) + vec2(time * 0.04, 0.0));
    clouds = smoothstep(0.42, 0.88, clouds);
    col = mix(col, vec3(0.12, 0.16, 0.21), clouds * 0.55);

    // soft pale band right above the horizon — light bleeding
    // under the cloud deck. Pulses gently with the gust.
    float horizonGlow = exp(-pow((uv.y + 0.02) * 14.0, 2.0));
    col += vec3(0.10, 0.13, 0.18) * horizonGlow * (0.4 + 0.4 * gust);

    // distant rain veil — a thin sheet across the far field that
    // densifies with the gust so you SEE the storm get heavier
    float veil = fbm(uv * vec2(2.0, 14.0) + vec2(time * 0.30, time * 0.9));
    col = mix(col, vec3(0.32, 0.38, 0.46), veil * 0.14 * intensity);

    // ---------- puddle / wet ground ------------------------
    float horizonY  = -0.05;
    float depthRaw  = horizonY - uv.y;
    float puddleMix = smoothstep(0.0, 0.04, depthRaw);

    if (puddleMix > 0.0) {
        float closeness = clamp(depthRaw * 4.0, 0.0, 1.0);

        // perspective floor coords
        float persp = 1.0 / max(depthRaw + 0.025, 0.025);
        vec2  puv   = vec2(uv.x * persp, persp * 0.55);

        // ripple field — brightness + a tiny height for refraction
        vec2  ripVH  = ripples(puv, gust);
        float ripple = ripVH.x;
        float disp   = ripVH.y;

        // mirrored sky, refracted by ripple displacement so the
        // reflection wobbles where the water is disturbed
        vec2  reflUV    = vec2(uv.x + disp * 1.2, -uv.y - 0.10);
        float reflCloud = fbm(reflUV * vec2(1.4, 2.2) + vec2(time * 0.04, 0.0));
        vec3  wet       = mix(vec3(0.06, 0.09, 0.13),
                              vec3(0.22, 0.30, 0.36),
                              reflCloud);
        wet = mix(wet, vec3(0.04, 0.06, 0.09),
                  smoothstep(0.50, 0.85, reflCloud) * 0.4);

        // constant fine "tremor" from background drops we don't
        // resolve individually — keeps the puddle from looking
        // glassy between major ripples
        float tremor = fbm(puv * 9.0 + vec2(0.0, time * 1.2)) - 0.5;
        wet += vec3(0.04, 0.06, 0.09) * tremor * (0.4 + 0.6 * gust);

        // low-frequency sheen — broken reflection look
        float sheen = fbm(puv * 0.8 + vec2(time * 0.05, 0.0));
        wet += vec3(0.05, 0.07, 0.10) * sheen * 0.45;

        // pavement darkens toward the viewer (less reflection at
        // grazing-to-overhead angle)
        wet = mix(wet, vec3(0.025, 0.040, 0.060), closeness * 0.70);

        col = mix(col, wet, puddleMix);

        // ripple highlights, faded in the deep distance to avoid aliasing
        ripple *= smoothstep(0.0, 0.30, closeness);
        col += vec3(0.55, 0.70, 0.85) * ripple * 0.50 * puddleMix;
    }

    // ---------- rain streaks: four parallax layers ---------
    // All layers stay thin — the closest one is only slightly
    // thicker, never "comet-sized".
    float skyMask = 1.0 - puddleMix * 0.92;

    float r1 = rainLayer(uv,              70.0, 0.7,  windSlant * 0.55, 0.012, 0.30 + 0.40 * gust);
    float r2 = rainLayer(uv * 1.2 +  7.0, 45.0, 1.1,  windSlant * 0.80, 0.015, 0.28 + 0.38 * gust);
    float r3 = rainLayer(uv * 0.95 - 3.0, 30.0, 1.6,  windSlant * 1.00, 0.018, 0.22 + 0.34 * gust);
    float r4 = rainLayer(uv * 0.75 + 11.0, 22.0, 2.2, windSlant * 1.15, 0.022, 0.14 + 0.26 * gust);

    vec3 rainTint = vec3(0.66, 0.78, 0.92);
    float streaks = r1 * 0.30 + r2 * 0.42 + r3 * 0.52 + r4 * 0.55;
    col += rainTint * streaks * intensity * skyMask;

    // ---------- lightning ----------------------------------
    // Slightly more likely during gust peaks; sharp double-blink
    float flashTrigger = fbm(vec2(time * 0.18, 7.3));
    float flashEnv     = smoothstep(0.92, 1.0, flashTrigger) * (0.4 + gust * 0.8);
    float flashBlink   = 0.55 + 0.45 * sin(time * 28.0);
    float flash        = flashEnv * flashBlink * flashBlink;
    col += vec3(0.72, 0.80, 0.95) * flash * 0.30;

    // ---------- vignette -----------------------------------
    float vig = 1.0 - dot(uv, uv) * 0.32;
    col *= vig;

    gl_FragColor = vec4(col, 1.0);
}
