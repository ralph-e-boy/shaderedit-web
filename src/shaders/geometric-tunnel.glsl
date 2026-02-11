#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// Epic geometric tunnel with pulsing lights
void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / min(resolution.x, resolution.y);

    // Convert to polar coordinates
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);

    // Create tunnel effect
    float z = 1.0 / radius + time * 2.0;

    // Add mouse interaction for tunnel rotation
    z += (mouse.x - 0.5) * 3.0;

    // Create geometric patterns
    float segments = 12.0;
    float segmentAngle = mod(angle + time * 0.5, 6.28318 / segments);
    float segmentPattern = abs(segmentAngle - 3.14159 / segments);

    // Tunnel walls with perspective
    float wall = mod(z, 1.0);
    float wallPattern = smoothstep(0.1, 0.9, wall);

    // Create hexagonal grid pattern
    float hexPattern = sin(segmentPattern * segments * 3.0) * sin(z * 8.0);

    // Pulsing lights along the tunnel
    float lightPulse = sin(z * 4.0 - time * 8.0) * 0.5 + 0.5;
    float lightRings = smoothstep(0.8, 1.0, lightPulse);

    // Distance-based brightness (perspective)
    float brightness = 1.0 / (1.0 + radius * radius * 2.0);

    // Color based on depth and patterns
    vec3 tunnelColor = vec3(0.1, 0.3, 0.8); // Blue base
    vec3 lightColor = vec3(1.0, 0.4, 0.1); // Orange lights
    vec3 accentColor = vec3(0.0, 1.0, 0.5); // Green accents

    // Combine patterns
    vec3 color = tunnelColor * wallPattern;

    // Add geometric patterns
    color = mix(color, accentColor, hexPattern * 0.3 * brightness);

    // Add pulsing lights
    color += lightColor * lightRings * brightness * 2.0;

    // Add electric arcs (mouse interaction)
    float mouseEffect = smoothstep(0.3, 0.7, mouse.y);
    float arc = sin(angle * 6.0 + time * 10.0) * sin(z * 20.0);
    color += vec3(0.5, 0.8, 1.0) * max(0.0, arc) * mouseEffect * brightness;

    // Add depth fog
    color *= smoothstep(3.0, 0.0, radius);

    // Enhance contrast
    color = pow(color, vec3(0.8));

    // Add vignette
    float vignette = 1.0 - smoothstep(0.5, 1.5, radius);
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
}