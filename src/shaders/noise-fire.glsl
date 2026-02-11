#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// Simplex noise function for organic fire patterns
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

// Epic fire effect with realistic flames
void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec2 p = uv - vec2(0.5, 0.0);
    p.x *= resolution.x / resolution.y;

    // Time variables for animation
    float t = time * 1.5;

    // Mouse interaction - wind effect
    vec2 wind = (mouse - 0.5) * 2.0;
    p += wind * 0.3;

    // Multi-octave noise for flame turbulence
    float noise1 = snoise(p * 4.0 + vec2(0.0, t));
    float noise2 = snoise(p * 8.0 + vec2(0.0, t * 1.3)) * 0.5;
    float noise3 = snoise(p * 16.0 + vec2(0.0, t * 1.7)) * 0.25;
    float noise4 = snoise(p * 32.0 + vec2(0.0, t * 2.1)) * 0.125;

    float totalNoise = noise1 + noise2 + noise3 + noise4;

    // Create flame shape - taller in center, tapering at edges
    float flameHeight = 1.0 - smoothstep(0.0, 0.3, abs(p.x));
    flameHeight *= 0.8 + 0.4 * sin(p.x * 8.0 + t * 2.0);

    // Distort flame with noise
    float flameY = p.y + totalNoise * 0.1;
    float flame = smoothstep(0.0, flameHeight, -flameY);

    // Add inner flame core
    float coreHeight = flameHeight * 0.6;
    float core = smoothstep(0.0, coreHeight, -flameY + 0.1);

    // Create embers and sparks
    float embers = 0.0;
    for (int i = 0; i < 8; i++) {
        float fi = float(i);
        vec2 emberPos = vec2(
            sin(fi * 2.3 + t * 0.8) * 0.4,
            fract(fi * 0.71 + t * 0.3 + totalNoise * 0.1) * 1.5 - 0.2
        );
        float emberDist = length(p - emberPos);
        embers += smoothstep(0.02, 0.005, emberDist) * (0.5 + 0.5 * sin(fi + t * 5.0));
    }

    // Color mapping - realistic fire colors
    vec3 fireColor1 = vec3(1.0, 0.1, 0.0); // Deep red
    vec3 fireColor2 = vec3(1.0, 0.4, 0.0); // Orange
    vec3 fireColor3 = vec3(1.0, 0.8, 0.2); // Yellow
    vec3 fireColor4 = vec3(1.0, 1.0, 0.8); // White hot

    // Color based on flame intensity and height
    float intensity = flame * (1.0 + totalNoise * 0.3);
    vec3 color = vec3(0.0);

    if (intensity > 0.0) {
        // Map intensity to fire colors
        if (intensity < 0.3) {
            color = mix(vec3(0.0), fireColor1, intensity / 0.3);
        } else if (intensity < 0.6) {
            color = mix(fireColor1, fireColor2, (intensity - 0.3) / 0.3);
        } else if (intensity < 0.8) {
            color = mix(fireColor2, fireColor3, (intensity - 0.6) / 0.2);
        } else {
            color = mix(fireColor3, fireColor4, (intensity - 0.8) / 0.2);
        }

        // Add core brightness
        color = mix(color, fireColor4, core * 0.8);

        // Add flickering
        float flicker = 0.9 + 0.1 * sin(t * 20.0 + totalNoise * 10.0);
        color *= flicker;

        // Add upward color gradient (flames are hotter at bottom)
        float heightGradient = 1.0 - smoothstep(-0.3, 0.5, p.y);
        color = mix(color * 0.7, color, heightGradient);
    }

    // Add embers
    color += vec3(1.0, 0.6, 0.2) * embers;

    // Add glow around flame
    float glow = smoothstep(0.3, 0.0, abs(p.x)) * smoothstep(0.5, -0.2, p.y);
    color += vec3(1.0, 0.3, 0.1) * glow * 0.3;

    // Add smoke (very subtle)
    if (p.y > 0.3) {
        float smoke = smoothstep(0.3, 0.8, p.y) * smoothstep(0.5, 0.0, abs(p.x));
        smoke *= 0.1 * (1.0 + totalNoise);
        color = mix(color, vec3(0.2, 0.2, 0.25), smoke);
    }

    gl_FragColor = vec4(color, 1.0);
}