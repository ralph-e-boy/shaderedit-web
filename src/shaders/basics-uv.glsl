// ============================================================
// 01 · UV Coordinates
// ------------------------------------------------------------
// The fundamental thing every shader does first: figure out
// "where am I?" Every pixel runs main() independently, and
// gl_FragCoord.xy tells us the pixel's screen position.
//
// Dividing by resolution normalizes to 0..1 — those are UVs.
// We can VISUALIZE them by using uv.x for red, uv.y for green.
//   • Bottom-left pixel → uv = (0,0) → black
//   • Bottom-right     → uv = (1,0) → red
//   • Top-left         → uv = (0,1) → green
//   • Top-right        → uv = (1,1) → yellow
//
// Try it: move your eye around the screen and predict the color.
// ============================================================

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;  // screen size in pixels, e.g. (1920, 1080)

void main() {
    // gl_FragCoord.xy is in PIXELS. Divide by resolution to
    // get normalized [0..1] coordinates ("UV space").
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    // Show the UVs as color. Red along x, green along y, blue 0.
    gl_FragColor = vec4(uv.x, uv.y, 0.0, 1.0);
}
