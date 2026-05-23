// ============================================================
// Vega — after Victor Vasarely
// ------------------------------------------------------------
// Vasarely's signature trick: a regular grid of squares whose
// individual sizes are modulated by a smooth scalar field. The
// brain reads the bulge as a 3D sphere pushing out of the plane.
//
// We compute distance from screen center, feed it through a
// smooth falloff, and use that to (a) shrink the squares as
// they approach the apex and (b) lighten the color toward a
// highlight color — strengthening the illusion of light.
// ============================================================

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy)
              / min(resolution.x, resolution.y) * 2.0;

    // Slowly orbit two "spheres" — one big in the center, one
    // smaller off to the side. Distance from each is the
    // displacement field that warps the cell sizes.
    vec2 c1 = vec2(0.0, 0.0);
    vec2 c2 = vec2(0.85 * cos(time * 0.3),
                   0.55 * sin(time * 0.4));

    float d1 = length(uv - c1);
    float d2 = length(uv - c2);

    // Smooth radial falloff. Closer to a sphere center → bigger value.
    float bulge1 = smoothstep(0.85, 0.0, d1);
    float bulge2 = smoothstep(0.45, 0.0, d2) * 0.7;
    float bulge  = max(bulge1, bulge2);

    // ---- the grid --------------------------------------------
    // Choose how many cells across the screen
    float gridN = 22.0;
    vec2 cellP   = fract(uv * gridN * 0.5) - 0.5;  // local coord in cell
    vec2 cellId  = floor(uv * gridN * 0.5);

    // Cell square half-size: shrink heavily where bulge is high
    float baseHalf = 0.42;
    float half_ = baseHalf - bulge * 0.32;

    float d   = sdBox(cellP, vec2(half_));
    float aa  = 1.5 / min(resolution.x, resolution.y) * gridN * 0.5;
    float fill = smoothstep(aa, -aa, d);

    // ---- color: deep navy → magenta → cream highlight --------
    vec3 cBase = vec3(0.04, 0.06, 0.18);   // canvas blue
    vec3 cMid  = vec3(0.78, 0.20, 0.45);   // magenta
    vec3 cHi   = vec3(0.98, 0.92, 0.75);   // cream highlight

    vec3 squareColor = mix(cMid, cHi, smoothstep(0.3, 0.95, bulge));
    squareColor      = mix(cBase, squareColor, smoothstep(0.0, 0.15, bulge));

    // Inside-square color, outside-square color
    vec3 col = mix(cBase * 1.1, squareColor, fill);

    // Slight vignette to anchor the spheres on the plane
    col *= 1.0 - 0.25 * length(uv) * 0.3;

    gl_FragColor = vec4(col, 1.0);
}
