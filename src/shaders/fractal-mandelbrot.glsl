#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// Epic Mandelbrot Set with smooth coloring
void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / min(resolution.x, resolution.y);

    // Zoom and pan based on mouse and time
    float zoom = 0.5 + 2.0 * pow(sin(time * 0.1), 2.0);
    vec2 center = mix(vec2(-0.5, 0.0), vec2(-0.8, 0.156), mouse);
    vec2 c = center + uv * zoom;

    vec2 z = vec2(0.0);
    float iterations = 0.0;
    const float maxIter = 100.0;

    // Mandelbrot iteration with smooth escape
    for (float i = 0.0; i < maxIter; i++) {
        if (dot(z, z) > 4.0) break;
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        iterations += 1.0;
    }

    // Smooth coloring
    if (iterations < maxIter) {
        float smoothIter = iterations - log2(log2(dot(z, z)));
        float colorIndex = smoothIter / maxIter;

        // Epic rainbow coloring
        vec3 color1 = vec3(0.2, 0.1, 0.4); // Deep purple
        vec3 color2 = vec3(1.0, 0.3, 0.1); // Orange
        vec3 color3 = vec3(1.0, 1.0, 0.2); // Yellow
        vec3 color4 = vec3(0.1, 0.8, 1.0); // Cyan

        float t = fract(colorIndex * 4.0 + time * 0.5);
        vec3 color;

        if (t < 0.33) {
            color = mix(color1, color2, t * 3.0);
        } else if (t < 0.66) {
            color = mix(color2, color3, (t - 0.33) * 3.0);
        } else {
            color = mix(color3, color4, (t - 0.66) * 3.0);
        }

        // Add some glow
        color *= 1.0 + 0.5 * sin(colorIndex * 20.0 + time * 2.0);

        gl_FragColor = vec4(color, 1.0);
    } else {
        // Inside the set - deep black with subtle patterns
        float pattern = sin(uv.x * 50.0) * sin(uv.y * 50.0) * 0.1;
        gl_FragColor = vec4(pattern, pattern * 0.5, pattern * 0.2, 1.0);
    }
}