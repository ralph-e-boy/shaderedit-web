// ============================================================
// 07 · Repeating Grid
// ------------------------------------------------------------
// fract() throws away the integer part of a number, keeping
// only the fractional part. That means fract(x) tiles a 0..1
// pattern infinitely along x — repetition for free.
//
// We use fract(uv * N) to repeat a unit cell N times across
// the screen, then put a circle inside each cell. Each cell
// also gets a unique "id" from floor(uv * N), which we hash
// into a color so they're all different.
// ============================================================

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;

// Cheap deterministic random from a 2D cell id
float hash(vec2 c) {
    return fract(sin(dot(c, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
    // Aspect-correct, large enough to see lots of cells
    vec2 uv = (gl_FragCoord.xy / resolution.xy - 0.5)
              * vec2(resolution.x / resolution.y, 1.0) * 8.0;

    // Slide the grid sideways with time
    uv.x += time * 0.4;

    // Split (x,y) into a CELL ID and a LOCAL coord inside the cell
    vec2 cellId = floor(uv);
    vec2 cellUV = fract(uv) - 0.5;   // -0.5..+0.5 inside the cell

    // Unique random per cell, used for color and animation phase
    float seed = hash(cellId);

    // Pulsing radius per-cell
    float radius = 0.30 + 0.12 * sin(time * 2.0 + seed * 6.28);

    // SDF circle inside the cell
    float d = length(cellUV) - radius;
    float aa = 1.5 / min(resolution.x, resolution.y) * 8.0;
    float fill = smoothstep(aa, -aa, d);

    // Color the circle from its cell seed (color-wheel trick)
    vec3 dotColor = 0.5 + 0.5 *
        cos(seed * 6.28 + vec3(0.0, 2.094, 4.188));

    // Grid lines at cell boundaries
    vec2 g = abs(cellUV);
    float gridLine = smoothstep(0.49, 0.50, max(g.x, g.y));

    vec3 col = vec3(0.04, 0.05, 0.08);
    col += gridLine * vec3(0.10, 0.10, 0.14);
    col = mix(col, dotColor, fill);

    gl_FragColor = vec4(col, 1.0);
}
