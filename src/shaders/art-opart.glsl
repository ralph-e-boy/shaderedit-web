// ============================================================
// Op Art — after Bridget Riley
// ------------------------------------------------------------
// Strict black-and-white parallel lines, warped so they create
// the illusion of three-dimensional folds. Riley's eye-vibrating
// trick: regular high-contrast pattern + a non-linear distortion.
//
// We take the y-coordinate, push it through several sin() waves
// (that themselves drift with time), and use the warped y to
// pick line bands. The result is a writhing, vibrating field
// that makes your retinas complain — in the best way.
// ============================================================

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

void main() {
    // Centered, aspect-correct coords
    vec2 p = (gl_FragCoord.xy - 0.5 * resolution.xy)
             / min(resolution.x, resolution.y) * 2.0;

    // ---- DISTORTION ------------------------------------------
    // Stack several sine waves with different frequencies and
    // phases. Each one bends the lines differently.
    float warp =
          0.40 * sin(p.x * 1.2 + time * 0.50)
        + 0.20 * sin(p.x * 2.7 - time * 0.30)
        + 0.12 * sin(p.x * 6.1 + time * 0.20)
        + 0.06 * sin(p.x * 13.0 - time * 0.10);

    // Add a slow vertical pulse so the whole field "breathes"
    float pulse = 0.10 * sin(time * 0.4 + p.y * 0.6);

    // Apply to y
    float y = p.y + warp + pulse;

    // ---- LINE PATTERN ----------------------------------------
    // Frequency = how many lines per unit. We want lots → high contrast.
    float freq = 28.0;

    // The bands: a wave that oscillates between -1 and +1
    float band = sin(y * freq);

    // smoothstep around 0 gives crisp lines with one-pixel AA
    float aa = 1.5 / min(resolution.x, resolution.y) * freq;
    float ink = smoothstep(-aa, aa, band);

    // ---- COMPOSITE -------------------------------------------
    vec3 white = vec3(0.96, 0.95, 0.92);
    vec3 black = vec3(0.04, 0.04, 0.05);
    vec3 col = mix(black, white, ink);

    // A whisper of warm hue at the very brightest peaks — keeps
    // the image from looking like pure CRT.
    col += vec3(0.04, 0.02, 0.0) * smoothstep(0.85, 1.0, ink);

    gl_FragColor = vec4(col, 1.0);
}
