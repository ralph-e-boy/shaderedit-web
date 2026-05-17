// ============================================================
// Value Noise
// ------------------------------------------------------------
// "Value noise" is the simplest kind of procedural noise:
//   1. Place a random value at every integer grid point.
//   2. For any point in between, interpolate from the nearest
//      four corners.
//
// The interpolation has to be SMOOTH or you get jagged "stairs".
// We use smoothstep() to ease in/out and you get those organic
// blobs you've seen everywhere.
//
// Animating it: feed time into the cell id, you get drifting
// clouds without any external textures.
// ============================================================

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;

// Hash a 2D integer cell to a 0..1 random scalar
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Value noise: bilinear interpolation of corner randoms
float valueNoise(vec2 p) {
    vec2 i = floor(p);                // cell origin
    vec2 f = fract(p);                // local 0..1
    vec2 u = smoothstep(0.0, 1.0, f); // smoothed weights

    // Sample the four corners of this cell
    float a = hash(i + vec2(0.0, 0.0));
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    // Bilinear interpolation
    return mix(mix(a, b, u.x),
               mix(c, d, u.x),
               u.y);
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    // Scale up so we see multiple cells; offset by time to flow
    vec2 p = uv * 8.0 + vec2(time * 0.3, 0.0);

    float n = valueNoise(p);

    // Show the raw noise as grayscale, then a colored remap
    vec3 cool = vec3(0.10, 0.30, 0.50);
    vec3 warm = vec3(0.95, 0.70, 0.30);
    vec3 col = mix(cool, warm, n);

    gl_FragColor = vec4(col, 1.0);
}
