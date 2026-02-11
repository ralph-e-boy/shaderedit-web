#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / min(resolution.x, resolution.y);

    float scale = 4.0 + mouse.x * 4.0;
    vec2 p = uv * scale;
    vec2 ip = floor(p);
    vec2 fp = fract(p);

    float minDist = 1e10;
    float secondDist = 1e10;
    vec2 closestPoint = vec2(0.0);

    // Search 3x3 neighborhood
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = hash2(ip + neighbor);

            // Animate points
            point = 0.5 + 0.5 * sin(time * 0.5 + 6.2832 * point);

            vec2 diff = neighbor + point - fp;
            float dist = length(diff);

            if (dist < minDist) {
                secondDist = minDist;
                minDist = dist;
                closestPoint = point;
            } else if (dist < secondDist) {
                secondDist = dist;
            }
        }
    }

    // Edge detection
    float edge = secondDist - minDist;
    float edgeLine = 1.0 - smoothstep(0.0, 0.05, edge);

    // Cell coloring
    float hue = fract(closestPoint.x * 3.7 + closestPoint.y * 7.3 + time * 0.1);
    vec3 cellColor = vec3(
        0.5 + 0.5 * cos(6.2832 * (hue + 0.0)),
        0.5 + 0.5 * cos(6.2832 * (hue + 0.33)),
        0.5 + 0.5 * cos(6.2832 * (hue + 0.67))
    );

    // Shade by distance to center
    cellColor *= 0.5 + 0.5 * (1.0 - minDist);

    // Add bright edges
    vec3 color = mix(cellColor, vec3(1.0), edgeLine * 0.8);

    gl_FragColor = vec4(color, 1.0);
}
