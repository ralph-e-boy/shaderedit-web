// ============================================================
// 06 · Polar Coordinates
// ------------------------------------------------------------
// Most shaders use (x, y) — but for anything ROUND or RADIAL,
// it's much easier to use polar coordinates: (radius, angle).
//
//     r = distance to center      = length(p)
//     a = angle around center     = atan(y, x)   // -π .. +π
//
// Once you have (r, a), you can paint patterns that radiate
// outward or sweep around in circles. Here's a "starburst":
// the angle picks a color band, the radius makes rings.
// ============================================================

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;

void main() {
    // Center origin, aspect-corrected, range ~[-1..1]
    vec2 p = (gl_FragCoord.xy - 0.5 * resolution.xy)
             / min(resolution.x, resolution.y) * 2.0;

    // Convert to polar
    float r = length(p);             // distance from center
    float a = atan(p.y, p.x);        // angle, -π..+π

    // Number of "spokes" around the circle
    float spokes = 12.0;
    float spoke = sin(a * spokes + time * 1.5);

    // Concentric rings as a function of radius
    float rings = sin(r * 20.0 - time * 2.0);

    // Combine; smoothstep to clean it up
    float pattern = smoothstep(0.2, 0.8, spoke * 0.5 + 0.5) *
                    smoothstep(0.1, 0.9, rings  * 0.5 + 0.5);

    // Fade out at the edges so it looks like a disc
    float vignette = smoothstep(1.0, 0.2, r);

    // Color from the angle — like a color wheel
    vec3 hue = 0.5 + 0.5 * cos(a + vec3(0.0, 2.094, 4.188));

    vec3 col = hue * pattern * vignette;
    col += vec3(0.02);  // ambient floor

    gl_FragColor = vec4(col, 1.0);
}
