import * as Util from "./engine/util.js";
import { vec3, vec4, mat3, mat4 } from "./engine/gl-matrix.js";

import * as fragSrc from "../assets/shaders/toon.frag";
import * as vertSrc from "../assets/shaders/basic.vert";

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2', { antialias: false });

const aspectRatio = 16/9;

const Slices = 256;
const Stacks = 64;
const VertexCount = Slices * Stacks;
const IndexCount = VertexCount * 6;

let theta = 0;

let vertexBuffer;
let indexBuffer;
let programInfo;

let projection = mat4.create();
let modelView = mat4.create();
let normalMatrix = mat3.create();

function draw() {
  gl.clearColor(0.7, 0.7, 0.7, 1.0); // Clear background with light grey color
  gl.clearDepth(1.0); // Clear the depth buffer

  // Clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(programInfo.program);

  gl.uniform3f(programInfo.locations.uniform.diffuseMaterial, 0, 0.75, 0.75);
  gl.uniform3f(programInfo.locations.uniform.ambientMaterial, 0.04, 0.04, 0.04);
  gl.uniform3f(programInfo.locations.uniform.specularMaterial, 0.5, 0.5, 0.5);
  gl.uniform1f(programInfo.locations.uniform.shininess, 80);

  gl.uniform3f(programInfo.locations.uniform.lightPosition, 0.25, 0.25, 1);

  gl.uniformMatrix4fv(programInfo.locations.uniform.projection, false, projection);
  gl.uniformMatrix4fv(programInfo.locations.uniform.modelView, false, modelView);
  gl.uniformMatrix3fv(programInfo.locations.uniform.normalMatrix, false, normalMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  gl.enableVertexAttribArray(programInfo.locations.attribute.position);
  gl.vertexAttribPointer(programInfo.locations.attribute.position, 3, gl.FLOAT, false, 6*4, 0);

  gl.enableVertexAttribArray(programInfo.locations.attribute.normal);
  gl.vertexAttribPointer(programInfo.locations.attribute.normal, 3, gl.FLOAT, false, 6*4, 3*4);

  gl.drawElements(gl.TRIANGLES, IndexCount, gl.UNSIGNED_SHORT, 0);
}

function update() {
  // TODO updating theta here
  const updateRotation = 0.015;
  theta += updateRotation;

  const rotation = mat4.create();
  mat4.fromRotation(rotation, theta, [0, 1, 0]);
  const translation = mat4.create();
  mat4.fromTranslation(translation, [0, 0, -7]);

  mat4.multiply(modelView, translation, rotation);
  mat3.fromMat4(normalMatrix, modelView);

  const S = 2.0;
  const H = S / aspectRatio;
  mat4.ortho(projection, -S, S, -H, H, 4, 10);

  draw();

  window.requestAnimationFrame(update);
}


function buildVertexBuffer() {
  // 6 floats per vert (3 pos + 3 normal)
  const verts = new Float32Array(VertexCount * 6);

  // Small delta for calculating normals
  const E = 0.01;
  // Distance between each slice and stack
  const ds = 1.0 / Slices;
  const dt = 1.0 / Stacks;

  // Normal vector of the current vert
  const n = vec3.create();

  for (let s = 0; s < Slices; s++) {
    for (let t = 0; t < Stacks; t++) {
      // Position of the current vert
      const p = evalTrefoil(s*ds, t*dt);
      // Positions slightly offset in x and y dirs
      const u = evalTrefoil(s*ds + E, t*dt);
      const v = evalTrefoil(s*ds, t*dt + E);
      // Just the difference from the position
      vec3.sub(u, u, p);
      vec3.sub(v, v, p);
      // Cross and normalize to get normal vector
      vec3.cross(n, u, v);
      vec3.normalize(n, n);

      // (s*Stacks + t) is the current vertex
      // 6 is amount of floats per vert (3 pos + 3 norm)
      verts.set([...p, ...n], (s*Stacks + t)*6);
    }
  }

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

  return vertexBuffer;
}


const evalTrefoil = (() => {
  const dv = vec3.create();
  const q = vec3.create();
  const qvn = vec3.create();
  const iww = vec3.create();

  return (s, t) => {
    const a = 0.5;
    const b = 0.3;
    const c = 0.5;
    const d = 0.1;
    const u = (1 - s) * 2 * Math.PI*2;
    const v = t * Math.PI*2;
    const r = a + b * Math.cos(1.5 * u);
    const x = r * Math.cos(u);
    const y = r * Math.sin(u);
    const z = c * Math.sin(1.5 * u);

    dv[0] = -1.5 * b * Math.sin(1.5 * u) * Math.cos(u) - (a + b * Math.cos(1.5 * u)) * Math.sin(u);
    dv[1] = -1.5 * b * Math.sin(1.5 * u) * Math.sin(u) + (a + b * Math.cos(1.5 * u)) * Math.cos(u);
    dv[2] = 1.5 * c * Math.cos(1.5 * u);

    vec3.normalize(q, dv);
    // qvn is the vector normal of q
    vec3.set(qvn, q[1], -q[0], 0);
    vec3.normalize(qvn, qvn);
    vec3.cross(iww, q, qvn);

    const range = vec3.create();

    range[0] = x + d * (qvn[0] * Math.cos(v) + iww[0] * Math.sin(v));
    range[1] = y + d * (qvn[1] * Math.cos(v) + iww[1] * Math.sin(v));
    range[2] = z + d * iww[2] * Math.sin(v);
    return range;
  }
})();


function buildIndexBuffer() {
  const indices = new Uint16Array(IndexCount);
  let currIx = 0;

  for (let i = 0; i < Slices * Stacks; i += Stacks) {
    for (let j = 0; j < Stacks; j++) {
      indices[currIx++] = i + j;
      indices[currIx++] = i + ((j + 1) % Stacks);
      indices[currIx++] = (i + j + Stacks) % VertexCount;

      indices[currIx++] = (i + j + Stacks) % VertexCount;
      indices[currIx++] = i + ((j + 1) % Stacks);
      indices[currIx++] = (i + ((j + 1) % Stacks) + Stacks) % VertexCount;
    }
  }

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indexBuffer;
}

function initGL() {

  vertexBuffer = buildVertexBuffer();
  indexBuffer = buildIndexBuffer();

  programInfo = Util.createProgram(gl, {vertex: vertSrc, fragment: fragSrc}, {
    uniform: {
      projection: "Projection",
      modelView: "Modelview",
      normalMatrix: "NormalMatrix",
      lightPosition: "LightPosition",
      ambientMaterial: "AmbientMaterial",
      diffuseMaterial: "DiffuseMaterial",
      specularMaterial: "SpecularMaterial",
      shininess: "Shininess",
    },
    attribute: {
      position: 'Position',
      normal: 'Normal',
    },
  });

  gl.enable(gl.DEPTH_TEST); // Enable depth testing, insures correct ordering
  gl.depthFunc(gl.LEQUAL); // Near obscures far
}

function init() {
  const isWebGL2 = !!gl;
  if(!isWebGL2) {
    document.querySelector('body').style.backgroundColor = 'red';
    console.error("Unable to create webgl2 context");
    return;
  }

  initGL();

  Util.resize(gl, canvas, aspectRatio);
  window.addEventListener("resize", e=>Util.resize(gl, canvas, aspectRatio));

  update();
}

init();
