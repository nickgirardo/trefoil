import * as Util from "./engine/util.js";
import { vec3 } from "./engine/gl-matrix.js";

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2', { antialias: false });

const aspectRatio = 16/9;

const Slices = 16;
const Stacks = 4;
const VertexCount = Slices * Stacks;

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

function init() {
  const isWebGL2 = !!gl;
  if(!isWebGL2) {
    document.querySelector('body').style.backgroundColor = 'red';
    console.error("Unable to create webgl2 context");
    return;
  }

  Util.resize(gl, canvas, aspectRatio);
  window.addEventListener("resize", e=>Util.resize(gl, canvas, aspectRatio));


  CreateVertexBuffer();


  update();
}

function CreateVertexBuffer() {
  // 3 floats pos, 3 floats normal
  const verts = new Float32Array(VertexCount * 6);

  let currentVert = 0;
  // Small delta for calculating normals
  const E = 0.01;
  const ds = 1.0 / Slices;
  const dt = 1.0 / Stacks;

  // Normal vector of the current vert
  const n = vec3.create();

  // The upper bounds in these loops are tweaked to reduce the
  // chance of precision error causing an incorrect # of iterations.

  for (let s = 0; s < 1 - ds / 2; s += ds)
  {
    for (let t = 0; t < 1 - dt / 2; t += dt)
    {
      // Position of the current vert
      const p = evalTrefoil(s, t);
      // Positions slightly offset in x and y dirs
      const u = evalTrefoil(s + E, t);
      const v = evalTrefoil(s, t + E);
      // Just the difference from the position
      vec3.sub(u, u, p);
      vec3.sub(v, v, p);
      // Cross and normalize to get normal vector
      vec3.cross(n, u, v);
      vec3.normalize(n, n);

      verts.set([...p, ...n], currentVert*6);
      currentVert++;
    }
  }

  if(currentVert !== VertexCount) {
    console.error("Tessellation error");
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


init();
