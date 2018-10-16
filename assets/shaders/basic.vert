#version 300 es
precision highp float;
precision highp int;

in vec4 Position;
in vec3 Normal;

uniform mat4 Projection;
uniform mat4 Modelview;
uniform mat3 NormalMatrix;

out vec3 EyespaceNormal;

void main() {
    EyespaceNormal = NormalMatrix * Normal;
    gl_Position = Projection * Modelview * Position;
}
