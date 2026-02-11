#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// Epic DNA helix with electric energy
void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / min(resolution.x, resolution.y);

    // Convert to cylindrical coordinates for helix
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);

    // Create DNA helix structure
    float helixSpeed = time * 2.0 + (mouse.x - 0.5) * 5.0;
    float helixHeight = uv.y * 3.0 + helixSpeed;

    // Two strands of DNA
    float strand1 = sin(helixHeight + angle * 2.0) * 0.3;
    float strand2 = sin(helixHeight + angle * 2.0 + 3.14159) * 0.3;

    // Distance to each strand
    float dist1 = abs(radius - (0.5 + strand1));
    float dist2 = abs(radius - (0.5 + strand2));

    // Create glowing strands
    float glow1 = exp(-dist1 * 15.0);
    float glow2 = exp(-dist2 * 15.0);

    // Base pairs connecting the strands
    float basePairFreq = 8.0;
    float basePairPhase = mod(helixHeight, 6.28318 / basePairFreq);
    float basePairGate = smoothstep(0.8, 1.0, sin(basePairPhase * basePairFreq));

    // Connection lines between strands
    float connectionLine = 0.0;
    if (basePairGate > 0.5) {
        float lineAngle = angle + sin(helixHeight * 0.5) * 0.1;
        float lineRadius = 0.5 + (strand1 + strand2) * 0.5;
        float lineDist = abs(radius * cos(lineAngle - atan(uv.y, uv.x)) - lineRadius);
        connectionLine = exp(-lineDist * 25.0) * basePairGate;
    }

    // Electric energy arcs
    float energy = 0.0;
    for (int i = 0; i < 6; i++) {
        float fi = float(i);
        float energyAngle = angle + fi * 1.047 + time * (2.0 + fi * 0.5);
        float energyRadius = 0.3 + 0.4 * sin(helixHeight * 2.0 + fi * 2.0);
        float energyDist = abs(radius - energyRadius);

        // Only show energy near the strands
        float energyGate = smoothstep(0.2, 0.0, min(dist1, dist2));
        energy += exp(-energyDist * 20.0) * energyGate * (0.5 + 0.5 * sin(time * 10.0 + fi));
    }

    // Particle system around DNA
    float particles = 0.0;
    for (int i = 0; i < 12; i++) {
        float fi = float(i);
        vec2 particlePos = vec2(
            sin(fi * 0.523 + time * 1.3) * (0.8 + 0.3 * sin(time * 0.7 + fi)),
            cos(fi * 0.717 + time * 0.9) * (0.8 + 0.3 * cos(time * 0.5 + fi))
        );
        float particleDist = length(uv - particlePos * 0.7);
        particles += exp(-particleDist * 30.0) * (0.5 + 0.5 * sin(time * 8.0 + fi * 3.0));
    }

    // Mouse interaction - energy boost
    float mouseBoost = smoothstep(0.5, 1.0, mouse.y) * 2.0;

    // Color mapping
    vec3 strand1Color = vec3(0.0, 0.8, 1.0); // Cyan
    vec3 strand2Color = vec3(1.0, 0.2, 0.8); // Magenta
    vec3 basePairColor = vec3(0.8, 1.0, 0.2); // Yellow-green
    vec3 energyColor = vec3(1.0, 0.4, 0.0); // Orange
    vec3 particleColor = vec3(0.5, 0.0, 1.0); // Purple

    // Combine all elements
    vec3 color = vec3(0.0);

    // Add strands with pulsing
    float pulseFactor = 1.0 + 0.3 * sin(time * 4.0);
    color += strand1Color * glow1 * pulseFactor;
    color += strand2Color * glow2 * pulseFactor;

    // Add base pairs
    color += basePairColor * connectionLine * 1.5;

    // Add energy arcs
    color += energyColor * energy * (1.0 + mouseBoost);

    // Add particles
    color += particleColor * particles * 0.8;

    // Add overall glow and atmosphere
    float atmosphere = exp(-radius * 2.0) * 0.2;
    color += vec3(0.1, 0.2, 0.4) * atmosphere;

    // Add chromatic aberration for that sci-fi look
    float aberration = radius * 0.1;
    color.r *= 1.0 + aberration;
    color.b *= 1.0 - aberration;

    // Add scanlines for retro effect
    float scanlines = sin(gl_FragCoord.y * 0.5) * 0.1;
    color *= 1.0 + scanlines;

    // Enhance contrast and saturation
    color = pow(color, vec3(0.8));
    color *= 1.2;

    gl_FragColor = vec4(color, 1.0);
}