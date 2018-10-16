#version 300 es
precision highp float;
precision highp int;

in vec3 EyespaceNormal;
out vec4 FragColor;

uniform vec3 LightPosition;
uniform vec3 DiffuseMaterial;
uniform vec3 AmbientMaterial;
uniform vec3 SpecularMaterial;
uniform float Shininess;

float stepmix(float edge0, float edge1, float E, float x) {
    float T = clamp(0.5 * (x - edge0 + E) / E, 0.0, 1.0);
    return mix(edge0, edge1, T);
}

void main() {
    vec3 N = normalize(EyespaceNormal);
    vec3 L = normalize(LightPosition);
    vec3 Eye = vec3(0, 0, 1);
    vec3 H = normalize(L + Eye);

    float df = max(0.0, dot(N, L));
    float sf = max(0.0, dot(N, H));
    sf = pow(sf, Shininess);

    const float A = 0.1;
    const float B = 0.2;
    const float C = 0.5;
    const float D = 1.0;
    float E = fwidth(df);

    if (df > A - E && df < A + E) df = stepmix(A, B, E, df);
    else if (df > B - E && df < B + E) df = stepmix(B, C, E, df);
    else if (df > C - E && df < C + E) df = stepmix(C, D, E, df);
    else if (df < A) df = 0.0;
    else if (df < B) df = B;
    else if (df < C) df = C;
    else df = D;

    const float SpecularPass = 0.6f;
    E = fwidth(sf);
    if (sf > SpecularPass - E && sf < SpecularPass + E) {
        sf = smoothstep(SpecularPass - E, SpecularPass + E, sf);
    } else {
        sf = step(SpecularPass, sf);
    }

    vec3 color = AmbientMaterial + df * DiffuseMaterial + sf * SpecularMaterial;
    FragColor = vec4(color, 1.0);
}
