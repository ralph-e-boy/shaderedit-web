#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

void main(void) {
    // Normalize coordinates to center
    vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / min(resolution.x, resolution.y);

    // Calculate distance from center and angle
    float dist = length(uv);
    float angle = atan(uv.y, uv.x);

    // Create the spiral effect
    float spiral = angle / (3.14159 * 2.0) + log(dist) * 2.0 - time * 0.5;

    // Add rotating bands
    float bands = sin(spiral * 10.0) * 0.5 + 0.5;

    // Add pulsing effect from center
    float pulse = sin(dist * 8.0 - time * 3.0) * 0.5 + 0.5;

    // Combine effects
    float pattern = bands * pulse;

    // Create color cycling effect
    vec3 color1 = vec3(1.0, 0.2, 0.8); // Hot pink
    vec3 color2 = vec3(0.2, 0.8, 1.0); // Cyan
    vec3 color3 = vec3(1.0, 1.0, 0.2); // Yellow

    // Mix colors based on pattern and time
    vec3 color = mix(color1, color2, sin(pattern * 3.14159 + time) * 0.5 + 0.5);
    color = mix(color, color3, sin(pattern * 3.14159 + time * 0.7) * 0.5 + 0.5);

    // Add vignette effect (darker at edges)
    float vignette = 1.0 - smoothstep(0.5, 1.5, dist);

    // Intensify center glow
    float glow = exp(-dist * 2.0);

    gl_FragColor = vec4(color * pattern * vignette + glow * 0.3, 1.0);
}