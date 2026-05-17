// ============================================================
// 04 · Circle (Signed Distance Field)
// ------------------------------------------------------------
// A "Signed Distance Field" (SDF) is a function that, for any
// point, returns the distance to the nearest edge of a shape.
// Positive = outside, negative = inside.
//
// For a circle at the origin, the SDF is just:
//     distance to center − radius
//
// Once you have the distance, smoothstep turns it into a clean,
// anti-aliased fill. This pattern is the foundation of almost
// all procedural shape drawing.
// ============================================================

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;

// SDF for a circle of given radius, centered at origin
float sdCircle(vec2 p, float r) {
    return length(p) - r;
}

void main() {
    // Center origin and correct for aspect ratio:
    //   p ranges from roughly -1..1 on the short axis.
    vec2 p = (gl_FragCoord.xy - 0.5 * resolution.xy)
             / min(resolution.x, resolution.y) * 2.0;

    // Animate the radius with sin(time)
    float r = 0.45 + 0.08 * sin(time * 2.0);
    float d = sdCircle(p, r);

    // d < 0 inside, d > 0 outside.
    // smoothstep gives a smooth boundary instead of jaggies.
    // The 1.5/min(res) value is roughly one pixel wide — that
    // makes the edge anti-aliased regardless of screen size.
    float aa = 1.5 / min(resolution.x, resolution.y);
    float fill = smoothstep(aa, -aa, d);

    // Outline too: a thin band where |d| is small
    float ring = smoothstep(0.012, 0.0, abs(d - 0.0));

    vec3 background = vec3(0.05, 0.06, 0.10);
    vec3 fillColor  = vec3(0.95, 0.30, 0.20);
    vec3 ringColor  = vec3(1.0,  0.85, 0.60);

    vec3 col = background;
    col = mix(col, fillColor, fill);
    col = mix(col, ringColor, ring * 0.6);

    gl_FragColor = vec4(col, 1.0);
}
