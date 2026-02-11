#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / min(resolution.x, resolution.y);

    // Convert to polar
    float r = length(uv);
    float a = atan(uv.y, uv.x);

    // Number of mirror segments
    float segments = 6.0 + 2.0 * floor(mouse.x * 4.0);
    float segAngle = 3.14159 * 2.0 / segments;

    // Mirror the angle
    a = mod(a, segAngle);
    if (a > segAngle * 0.5) a = segAngle - a;

    // Back to cartesian
    vec2 p = vec2(cos(a), sin(a)) * r;

    // Animate the pattern
    p += time * 0.1;

    // Create layered patterns
    vec3 color = vec3(0.0);

    for (int i = 0; i < 4; i++) {
        float fi = float(i);
        vec2 q = p * (2.0 + fi * 1.5);
        q += vec2(sin(time * 0.3 + fi), cos(time * 0.4 + fi));

        float pattern = sin(q.x * 3.0) * sin(q.y * 3.0);
        pattern += sin(length(q) * 5.0 - time * 2.0) * 0.5;
        pattern = abs(pattern);

        vec3 layerColor = vec3(
            0.5 + 0.5 * sin(fi * 1.5 + time * 0.5),
            0.5 + 0.5 * sin(fi * 1.5 + time * 0.5 + 2.094),
            0.5 + 0.5 * sin(fi * 1.5 + time * 0.5 + 4.189)
        );

        color += layerColor * pattern * 0.3;
    }

    // Vignette
    color *= 1.0 - smoothstep(0.4, 1.2, r);

    // Brighten
    color = pow(color, vec3(0.8));

    gl_FragColor = vec4(color, 1.0);
}
