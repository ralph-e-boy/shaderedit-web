// ============================================================
// Boomerang — after Raymond Loewy
// ------------------------------------------------------------
// Loewy's textile is a DENSE field of wandering scribble-lines
// in two ink weights over pale teal.
//
// Implementation trick: instead of trying to *trace* parametric
// curves (which always shows polygon segments at low sample
// counts, and only covers wherever the curve goes), we draw
// the ISOLINES of a chaotic 2D scalar field. Pick a field f(x,y)
// whose contour lines look like wandering scribbles, then draw
// a line wherever f equals an integer level. Domain warping
// (feeding low-frequency sinusoids back into higher-frequency
// ones) gives the field its hand-drawn, looping character.
//
// For each pixel:
//   d = distance from f to the nearest integer level
//   w = fwidth(f) = how fast f changes per screen pixel
//   ink = smoothstep over (d / w) → crisp 1-pixel-ish line
//
// fwidth() lets us draw lines of constant SCREEN-SPACE width
// regardless of how steep the field is locally. No segments,
// no aliasing, no gaps.
// ============================================================

#ifdef GL_ES
#extension GL_OES_standard_derivatives : enable
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

// Two-stage domain-warped sinusoidal field. The inner warp
// bends the inputs to the outer waves, which creates loops,
// cusps, and the "drawn by hand" wandering quality.
float field(vec2 p, float seed) {
    vec2 w1 = vec2(
        sin(p.y * 1.30 + seed * 0.70),
        sin(p.x * 1.45 - seed * 0.50)
    );
    vec2 w2 = vec2(
        sin((p.x + w1.x * 1.4) * 1.9 + seed * 1.10),
        sin((p.y + w1.y * 1.4) * 2.1 - seed * 0.90)
    );

    return  sin((p.x + w2.x * 1.0) * 1.30 + seed * 0.30)
          + sin((p.y + w2.y * 1.0) * 1.40 - seed * 0.50)
          + 0.65 * sin((p.x + p.y) * 1.55 + w2.x * 1.8)
          + 0.65 * sin((p.x - p.y) * 1.50 - w2.y * 1.6);
}

// Draw a line where `f` crosses any integer multiple of `gap`.
// `pxWidth` is the desired line thickness in screen pixels.
float drawContour(float f, float gap, float pxWidth) {
    float d = abs(mod(f + gap * 0.5, gap) - gap * 0.5);
    float w = fwidth(f);
    return 1.0 - smoothstep(w * (pxWidth - 0.5),
                            w * (pxWidth + 0.5),
                            d);
}

void main() {
    // Aspect-correct centered coords; scale picks how many
    // scribbles fit on screen.
    vec2 p = (gl_FragCoord.xy / resolution.xy - 0.5)
             * vec2(resolution.x / resolution.y, 1.0) * 4.8;

    // ---- pale teal ground -------------------------------------
    vec3 col = vec3(0.62, 0.79, 0.77);
    col += 0.018 * sin(p.x * 0.7 + p.y * 0.5);  // very subtle wash
    col += (fract(sin(dot(floor(gl_FragCoord.xy), vec2(127.1, 311.7)))
                  * 43758.5453) - 0.5) * 0.020; // paper grain

    float gap = 1.45;  // spacing between contour lines

    // ---- darker slate-blue scribbles (underneath) -------------
    float fA = field(p + vec2(time * 0.030, 0.0), 1.7);
    float darkLine = drawContour(fA, gap, 1.7);
    col = mix(col, vec3(0.30, 0.42, 0.55), darkLine);

    // ---- cream scribbles (on top, different seed & drift) -----
    float fB = field(p * 1.06 + vec2(37.7, 19.3)
                     - vec2(time * 0.024, 0.0), 5.3);
    float lightLine = drawContour(fB, gap, 1.3);
    col = mix(col, vec3(0.95, 0.94, 0.86), lightLine);

    gl_FragColor = vec4(col, 1.0);
}
