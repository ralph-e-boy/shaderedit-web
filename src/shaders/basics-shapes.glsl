// ============================================================
// 05 · SDF Shapes
// ------------------------------------------------------------
// Once you understand the SDF idea (see "Circle"), you can
// build any 2D shape with a small math function. Each returns
// signed distance from a point to the shape's edge.
//
// Combining shapes is just min() (union), max() (intersection),
// and -d (negate) — the boolean operations of solid geometry.
//
// This example shows: box, rounded box, triangle, and a union.
// ============================================================

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;

float sdCircle(vec2 p, float r) {
    return length(p) - r;
}

float sdBox(vec2 p, vec2 halfSize) {
    vec2 d = abs(p) - halfSize;
    // outside: euclidean distance to nearest corner
    // inside: negative, scales with how deep
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float sdRoundedBox(vec2 p, vec2 halfSize, float radius) {
    return sdBox(p, halfSize - radius) - radius;
}

float sdEquilateralTriangle(vec2 p, float r) {
    const float k = sqrt(3.0);
    p.x = abs(p.x) - r;
    p.y = p.y + r / k;
    if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
    p.x -= clamp(p.x, -2.0 * r, 0.0);
    return -length(p) * sign(p.y);
}

// 2D rotation matrix
mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}

void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * resolution.xy)
             / min(resolution.x, resolution.y) * 2.0;

    // Place three shapes side by side. Rotate them all so it's
    // clear they're independent SDFs.
    float t = time * 0.7;

    float box  = sdRoundedBox(rot(t)        * (p - vec2(-0.55, 0.0)),
                              vec2(0.20, 0.20), 0.05);
    float tri  = sdEquilateralTriangle(rot(-t * 1.3) * (p - vec2(0.0, 0.0)),
                                       0.28);
    float circ = sdCircle(p - vec2(0.55, 0.0), 0.22);

    // Union via min() — closest surface wins
    float scene = min(min(box, tri), circ);

    float aa = 1.5 / min(resolution.x, resolution.y);
    float fill = smoothstep(aa, -aa, scene);

    // Distance bands — visualize the SDF outside the shape
    float bands = sin(scene * 60.0) * 0.05 + 0.05;
    bands *= smoothstep(0.0, 0.7, scene);  // only outside

    vec3 col = vec3(0.05, 0.06, 0.10) + bands * vec3(0.4, 0.2, 0.6);
    col = mix(col, vec3(0.95, 0.85, 0.5), fill);

    gl_FragColor = vec4(col, 1.0);
}
