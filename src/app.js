import * as Util from "./engine/util.js";
import { vec3 } from "./engine/gl-matrix.js";

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2', { antialias: false });

const aspectRatio = 16/9;

const Slices = 16;
const Stacks = 4;
const VertexCount = Slices * Stacks;
const IndexCount = VertexCount * 6;


function draw() {
  gl.clearColor(0.7, 0.7, 0.7, 1.0); // Clear background with light grey color
  gl.clearDepth(1.0); // Clear the depth buffer
  gl.enable(gl.DEPTH_TEST); // Enable depth testing, insures correct ordering
  gl.depthFunc(gl.LEQUAL); // Near obscures far

  // Clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function update() {
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
  const ww = vec3.create();

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
    vec3.normalize(qvn, q);
    vec3.cross(ww, q, qvn);

    const range = vec3.create();

    range[0] = x + d * (qvn[0] * Math.cos(v) + ww[0] * Math.sin(v));
    range[1] = y + d * (qvn[1] * Math.cos(v) + ww[1] * Math.sin(v));
    range[2] = z + d * ww[2] * Math.sin(v);
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

function init() {
  const isWebGL2 = !!gl;
  if(!isWebGL2) {
    document.querySelector('body').style.backgroundColor = 'red';
    console.error("Unable to create webgl2 context");
    return;
  }

  Util.resize(gl, canvas, aspectRatio);
  window.addEventListener("resize", e=>Util.resize(gl, canvas, aspectRatio));

  buildVertexBuffer();
  buildIndexBuffer();


  update();
}

init();
