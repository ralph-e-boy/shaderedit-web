#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / min(resolution.x, resolution.y);

    // Warp speed tunnel
    float r = length(uv);
    float a = atan(uv.y, uv.x);

    // Tunnel mapping
    float tunnel_z = 0.5 / (r + 0.01);
    float tunnel_a = a / 3.14159;

    // Warp speed scrolling
    float speed = time * 3.0;
    tunnel_z += speed;

    // Star field layers
    vec3 color = vec3(0.0);

    for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float scale = 1.0 + fi * 2.0;

        vec2 starUV = vec2(tunnel_a * scale, tunnel_z * (0.5 + fi * 0.3));

        // Grid-based stars
        vec2 grid = fract(starUV) - 0.5;
        vec2 id = floor(starUV);

        // Pseudo-random per cell
        float rnd = fract(sin(dot(id, vec2(127.1, 311.7))) * 43758.5453);
        float rnd2 = fract(sin(dot(id, vec2(269.5, 183.3))) * 43758.5453);

        // Star position within cell
        vec2 offset = vec2(rnd - 0.5, rnd2 - 0.5) * 0.7;
        float starDist = length(grid - offset);

        // Star brightness
        float star = exp(-starDist * 30.0);
        star *= smoothstep(0.0, 0.3, r); // Fade near center

        // Color variation per star
        vec3 starColor = vec3(
            0.8 + 0.2 * sin(rnd * 6.28),
            0.8 + 0.2 * sin(rnd * 6.28 + 2.0),
            0.9 + 0.1 * sin(rnd * 6.28 + 4.0)
        );

        color += starColor * star * (0.4 + fi * 0.2);
    }

    // Radial streaks (motion blur effect)
    float streak = exp(-r * 2.0) * 0.5;
    float streakAngle = sin(a * 20.0 + time * 0.5);
    streak *= smoothstep(0.0, 0.3, abs(streakAngle));

    // Central glow
    float glow = exp(-r * 5.0) * 0.8;
    vec3 glowColor = vec3(0.5, 0.7, 1.0);

    color += glowColor * glow;
    color += vec3(0.3, 0.4, 0.8) * streak;

    // Vignette
    color *= smoothstep(1.5, 0.3, r);

    gl_FragColor = vec4(color, 1.0);
}
