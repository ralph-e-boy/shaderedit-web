#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / min(resolution.x, resolution.y);
    uv *= 1.5;

    // Animate the Julia constant based on time and mouse
    vec2 c = vec2(
        mix(-0.8, 0.37, 0.5 + 0.5 * sin(time * 0.3)) + (mouse.x - 0.5) * 0.5,
        mix(0.156, -0.5, 0.5 + 0.5 * cos(time * 0.23)) + (mouse.y - 0.5) * 0.5
    );

    vec2 z = uv;
    float iterations = 0.0;
    const float maxIter = 128.0;

    for (float i = 0.0; i < maxIter; i++) {
        if (dot(z, z) > 4.0) break;
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        iterations += 1.0;
    }

    if (iterations < maxIter) {
        float smoothIter = iterations - log2(log2(dot(z, z)));
        float t = smoothIter / maxIter;

        vec3 colA = vec3(0.05, 0.0, 0.2);
        vec3 colB = vec3(0.9, 0.1, 0.3);
        vec3 colC = vec3(1.0, 0.8, 0.1);
        vec3 colD = vec3(0.1, 0.6, 0.9);

        float s = fract(t * 5.0 + time * 0.2);
        vec3 color;
        if (s < 0.33) {
            color = mix(colA, colB, s * 3.0);
        } else if (s < 0.66) {
            color = mix(colB, colC, (s - 0.33) * 3.0);
        } else {
            color = mix(colC, colD, (s - 0.66) * 3.0);
        }

        gl_FragColor = vec4(color, 1.0);
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}
