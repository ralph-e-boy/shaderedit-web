#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / min(resolution.x, resolution.y);

    // Center on the interesting region of the Burning Ship fractal
    float zoom = 1.5 + 0.5 * sin(time * 0.15);
    vec2 center = vec2(-0.4, -0.6) + (mouse - 0.5) * 0.5;
    vec2 c = center + uv * zoom;

    vec2 z = vec2(0.0);
    float iterations = 0.0;
    const float maxIter = 100.0;

    // Burning Ship: same as Mandelbrot but abs(z) before squaring
    for (float i = 0.0; i < maxIter; i++) {
        if (dot(z, z) > 4.0) break;
        z = abs(z);
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        iterations += 1.0;
    }

    if (iterations < maxIter) {
        float smoothIter = iterations - log2(log2(dot(z, z)));
        float t = smoothIter / maxIter;

        // Fiery color palette
        vec3 color = vec3(0.0);
        color.r = smoothstep(0.0, 0.4, t) * 1.2;
        color.g = smoothstep(0.2, 0.7, t) * 0.8;
        color.b = smoothstep(0.5, 1.0, t) * 0.6;

        // Pulsing glow
        color *= 1.0 + 0.2 * sin(t * 40.0 + time * 2.0);

        gl_FragColor = vec4(color, 1.0);
    } else {
        gl_FragColor = vec4(0.02, 0.0, 0.05, 1.0);
    }
}
