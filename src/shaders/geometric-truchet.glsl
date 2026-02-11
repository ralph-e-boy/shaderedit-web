#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / min(resolution.x, resolution.y);

    float scale = 6.0 + mouse.x * 6.0;
    vec2 p = uv * scale;

    // Slowly shift the pattern
    p += time * 0.2;

    vec2 ip = floor(p);
    vec2 fp = fract(p);

    // Random tile rotation
    float rnd = hash(ip + floor(time * 0.3) * 0.01);
    if (rnd > 0.5) fp = vec2(1.0 - fp.x, fp.y);

    // Two quarter-circle arcs per tile
    float d1 = abs(length(fp) - 0.5);
    float d2 = abs(length(fp - 1.0) - 0.5);
    float d = min(d1, d2);

    // Line thickness
    float lineWidth = 0.06 + 0.02 * sin(time);
    float line = smoothstep(lineWidth, lineWidth - 0.02, d);

    // Coloring
    float hue = fract(hash(ip) * 0.5 + time * 0.1);
    vec3 lineColor = vec3(
        0.5 + 0.5 * cos(6.2832 * (hue + 0.0)),
        0.5 + 0.5 * cos(6.2832 * (hue + 0.33)),
        0.5 + 0.5 * cos(6.2832 * (hue + 0.67))
    );

    // Background
    vec3 bgColor = vec3(0.05, 0.05, 0.1);

    // Glow around lines
    float glow = exp(-d * 20.0) * 0.3;
    vec3 glowColor = lineColor * glow;

    vec3 color = mix(bgColor, lineColor, line) + glowColor;

    gl_FragColor = vec4(color, 1.0);
}
