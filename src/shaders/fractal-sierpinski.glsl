#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / min(resolution.x, resolution.y);
    uv = uv * 2.0 + vec2(0.5, 0.5);

    // Rotate slowly
    float angle = time * 0.15;
    float ca = cos(angle), sa = sin(angle);
    uv = vec2(ca * uv.x - sa * uv.y, sa * uv.x + ca * uv.y);

    float scale = 1.0;
    float dist = 1e10;

    // Sierpinski triangle via IFS
    for (int i = 0; i < 8; i++) {
        // Fold into triangle
        uv *= 2.0;
        scale *= 2.0;

        uv.x = abs(uv.x);

        if (uv.x + uv.y > 1.0) {
            uv = vec2(1.0 - uv.y, 1.0 - uv.x);
        }

        uv -= vec2(0.5, 0.5);

        float d = length(uv) / scale;
        dist = min(dist, d);
    }

    float brightness = smoothstep(0.0, 0.02, dist);
    float edge = 1.0 - smoothstep(0.0, 0.005, dist);

    // Coloring
    float hue = fract(dist * 30.0 + time * 0.3);
    vec3 color = vec3(
        0.5 + 0.5 * cos(6.2832 * (hue + 0.0)),
        0.5 + 0.5 * cos(6.2832 * (hue + 0.33)),
        0.5 + 0.5 * cos(6.2832 * (hue + 0.67))
    );

    color = mix(color * 0.3, color, brightness);
    color += edge * vec3(0.8, 0.9, 1.0);

    gl_FragColor = vec4(color, 1.0);
}
