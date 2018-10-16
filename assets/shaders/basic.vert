#version 300 es
precision highp float;
precision highp int;

in vec3 Position;
in vec3 Normal;

uniform mat4 Projection;
uniform mat4 Modelview;
uniform mat3 NormalMatrix;

out vec3 EyespaceNormal;

void main() {
    EyespaceNormal = Normal * NormalMatrix;
    gl_Position = Projection * Modelview * vec4(Position, 1.0);
}
