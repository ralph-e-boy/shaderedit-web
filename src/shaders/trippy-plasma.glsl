#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / min(resolution.x, resolution.y);

    // Classic plasma: sum of sines at different scales and angles
    float v = 0.0;
    v += sin(uv.x * 10.0 + time);
    v += sin(uv.y * 10.0 + time * 0.7);
    v += sin((uv.x + uv.y) * 7.0 + time * 1.3);
    v += sin(length(uv * 8.0 - vec2(sin(time * 0.5), cos(time * 0.3)) * 3.0));

    // Second layer
    vec2 uv2 = uv + vec2(sin(time * 0.4), cos(time * 0.3)) * 0.3;
    v += sin(length(uv2) * 12.0 - time * 2.0) * 0.5;
    v += sin(uv2.x * 5.0 + uv2.y * 8.0 + time * 1.5) * 0.5;

    v *= 0.5;

    // Mouse influence
    vec2 mousePos = (mouse - 0.5) * 2.0;
    float mouseDist = length(uv - mousePos);
    v += sin(mouseDist * 15.0 - time * 3.0) * 0.3 * exp(-mouseDist);

    // Color mapping with shifting palette
    vec3 color;
    color.r = sin(v * 3.14159 + time * 0.5) * 0.5 + 0.5;
    color.g = sin(v * 3.14159 + time * 0.5 + 2.094) * 0.5 + 0.5;
    color.b = sin(v * 3.14159 + time * 0.5 + 4.189) * 0.5 + 0.5;

    // Boost saturation
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(gray), color, 1.5);

    gl_FragColor = vec4(color, 1.0);
}
