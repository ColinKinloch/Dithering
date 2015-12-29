precision mediump float;

uniform sampler2D bayer;

float bayerer(in float order, in vec2 coord) {
    vec2 c = vec2(mod(coord, order));
    return texture2D(bayer, c / 8.).a;
}
vec4 deres(vec4 v, float detail) {
  ivec4 iv = ivec4(v*detail);
  return vec4(iv)/detail;
}
vec3 deres(vec3 v, float detail) {
  ivec3 iv = ivec3(v*detail);
  return vec3(iv)/detail;
}
vec2 deres(vec2 v, float detail) {
  ivec2 iv = ivec2(v*detail);
  return vec2(iv)/detail;
}

uniform sampler2D frame;
uniform ivec2 destSize;
varying vec2 screenCoord;

void main() {
  float b = bayerer(8., vec2(destSize) * screenCoord);
  vec4 pixel = 1. * texture2D(frame, screenCoord);
  vec4 colour = deres(b * pixel, 4.);
  gl_FragColor = vec4(colour.rgb, pixel.a);
}
