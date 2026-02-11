#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
        value += amplitude * vnoise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec2 centered = (gl_FragCoord.xy - 0.5 * resolution.xy) / min(resolution.x, resolution.y);

    // Sky gradient
    vec3 skyTop = vec3(0.2, 0.4, 0.8);
    vec3 skyBottom = vec3(0.6, 0.75, 0.95);
    vec3 color = mix(skyBottom, skyTop, uv.y);

    // Sun
    vec2 sunPos = vec2(0.3, 0.4);
    float sunDist = length(centered - sunPos);
    color += vec3(1.0, 0.9, 0.7) * 0.3 * exp(-sunDist * 3.0);

    // Cloud layers
    float windSpeed = time * 0.08;

    for (int layer = 0; layer < 3; layer++) {
        float fl = float(layer);
        float scale = 3.0 + fl * 1.5;
        float height = 0.1 + fl * 0.15;

        vec2 cloudUV = centered * scale + vec2(windSpeed * (1.0 + fl * 0.3), fl * 3.0);
        float density = fbm(cloudUV);
        density = smoothstep(0.35, 0.7, density);

        // Soften at edges
        density *= smoothstep(-0.5, 0.0, centered.y + height);
        density *= smoothstep(0.8, 0.3, centered.y - height);

        // Cloud coloring: white tops, darker bottoms
        vec3 cloudLight = vec3(1.0, 0.98, 0.95);
        vec3 cloudDark = vec3(0.6, 0.65, 0.75);
        float lighting = fbm(cloudUV + vec2(0.5, 0.3));
        vec3 cloudColor = mix(cloudDark, cloudLight, lighting);

        color = mix(color, cloudColor, density * (0.7 - fl * 0.15));
    }

    gl_FragColor = vec4(color, 1.0);
}
