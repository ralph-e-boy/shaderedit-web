// ============================================================
// Fractal Brownian Motion (FBM)
// ------------------------------------------------------------
// One layer of noise is smooth & boring. Real-world textures
// (clouds, mountains, marble, smoke) are noisy at MANY scales
// at once.
//
// FBM = sum several layers ("octaves") of the same noise:
//     each octave is twice as small,
//     half as strong as the previous.
//
//     result = noise(p)*0.5 + noise(p*2)*0.25 + noise(p*4)*0.125 + ...
//
// That gives you the rich, self-similar texture that says
// "natural." Almost every cloud / terrain shader uses it.
// ============================================================

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = smoothstep(0.0, 1.0, f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Six octaves is usually plenty
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;        // amplitude — halves each octave
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);   // rotate+scale each octave
    for (int i = 0; i < 6; i++) {
        v += a * vnoise(p);
        p = m * p;        // each octave is rotated and scaled up
        a *= 0.5;         // and contributes less
    }
    return v;
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    // Domain warping for richness: feed FBM through itself
    vec2 q = vec2(fbm(uv * 3.0 + time * 0.1),
                  fbm(uv * 3.0 + vec2(5.2, 1.3) + time * 0.1));
    float n = fbm(uv * 3.0 + q * 1.6);

    // Color ramp: deep navy → teal → cream
    vec3 a = vec3(0.05, 0.08, 0.18);
    vec3 b = vec3(0.10, 0.45, 0.55);
    vec3 c = vec3(0.95, 0.90, 0.75);
    vec3 col = mix(a, b, smoothstep(0.2, 0.55, n));
    col = mix(col, c, smoothstep(0.55, 0.85, n));

    gl_FragColor = vec4(col, 1.0);
}
