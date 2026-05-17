// ============================================================
// 02 · Time
// ------------------------------------------------------------
// The `time` uniform is a number that ticks up every frame —
// it's how shaders animate. Pass it through sin() to get a
// smooth oscillation between -1 and +1; remap to 0..1 with
// the classic "* 0.5 + 0.5" trick.
//
// Mix that with the pixel's x position and you get a vertical
// stripe pattern that breathes left-to-right.
// ============================================================

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;       // seconds since the shader started
uniform vec2  resolution;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    // sin(time) wobbles between -1..+1. The "0.5 +" remap
    // maps it to 0..1 — safe to use as a color channel.
    float wave  = sin(time * 2.0) * 0.5 + 0.5;

    // Combine time-wobble with the pixel's horizontal position.
    // sin(uv.x * 10 + time) sweeps stripes across the screen.
    float stripes = sin(uv.x * 10.0 + time * 1.5) * 0.5 + 0.5;

    // Build the color: red from wave, green from stripes, blue
    // a slower complementary phase.
    vec3 color = vec3(
        wave,
        stripes,
        sin(time + uv.y * 6.0) * 0.5 + 0.5
    );

    gl_FragColor = vec4(color, 1.0);
}
