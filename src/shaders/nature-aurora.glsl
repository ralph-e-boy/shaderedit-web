#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// Simple noise via sine combinations
float noise(vec2 p) {
    return sin(p.x * 1.3 + p.y * 1.7) * sin(p.y * 2.1 - p.x * 0.9) * 0.5 + 0.5;
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p);
        p *= 2.1;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec2 centered = (gl_FragCoord.xy - 0.5 * resolution.xy) / min(resolution.x, resolution.y);

    // Sky gradient
    vec3 skyBottom = vec3(0.0, 0.02, 0.08);
    vec3 skyTop = vec3(0.0, 0.0, 0.02);
    vec3 color = mix(skyBottom, skyTop, uv.y);

    // Stars
    float stars = noise(centered * 80.0);
    stars = smoothstep(0.92, 0.95, stars) * smoothstep(0.3, 0.5, uv.y);
    color += stars * vec3(0.8, 0.9, 1.0);

    // Aurora layers
    for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float speed = 0.3 + fi * 0.1;
        float yOffset = 0.55 + fi * 0.08;

        float wave = fbm(vec2(centered.x * 2.0 + time * speed + fi * 3.0, fi * 5.0));
        float auroraY = yOffset + wave * 0.15;
        float dist = abs(centered.y - auroraY);

        float intensity = smoothstep(0.15, 0.0, dist);
        intensity *= smoothstep(0.0, 0.3, uv.y);

        // Green to blue-purple gradient
        vec3 auroraColor;
        if (i == 0) {
            auroraColor = vec3(0.1, 0.9, 0.3);
        } else if (i == 1) {
            auroraColor = vec3(0.2, 0.6, 0.9);
        } else {
            auroraColor = vec3(0.5, 0.2, 0.8);
        }

        // Curtain shimmer
        float shimmer = fbm(vec2(centered.x * 8.0 + time * 0.5, centered.y * 4.0 + fi));
        intensity *= 0.6 + 0.4 * shimmer;

        color += auroraColor * intensity * 0.7;
    }

    // Ground silhouette
    float ground = smoothstep(0.02, -0.02, centered.y + 0.35 + 0.03 * sin(centered.x * 5.0));
    color = mix(color, vec3(0.01, 0.01, 0.02), ground);

    gl_FragColor = vec4(color, 1.0);
}
