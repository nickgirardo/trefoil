
import { quat } from "./gl-matrix.js";

/*
 * @function loadImage
 *
 * @param string src Source of image to be loaded
 *
 * @returns Promise(Image) Promise completed when image element loaded
 *
 */
export function loadImage(src) {
	return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onerror = function(error) {
      reject(error);
    }
    img.onload = function() {
      resolve(img);
    };
  })
};

/*
 * @function createShader
 *
 * @param WebGL2RenderingContext gl
 * @param WebGLProgram program
 * @param string src Raw source of shader
 * @param GLenum type Must be either gl.FRAGMENT_SHADER or gl.VERTEX_SHADER
 *
 * Impure, modifies program argument by attaching to it compiled shader
 *
 */
export function createShader(gl, program, src, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  gl.attachShader(program, shader);

  const shaderLog = gl.getShaderInfoLog(shader);
  if(shaderLog)
    console.error(shaderLog);

  // Cleanup
  // The shader is attached to the program at this point so we don't need to keep it around
  gl.deleteShader(shader);
}

/*
 * @function createProgram
 *
 * @param WebGL2RenderingContext gl
 * @param {vertex: string, fragment:string} shaders Raw sources of shaders
 * @param Object names
 *
 * @returns {program: WebGLProgram, locations: Object}
 */
export function createProgram(gl, shaders, names) {
  const program = gl.createProgram();

  createShader(gl, program, shaders.vertex, gl.VERTEX_SHADER);
  createShader(gl, program, shaders.fragment, gl.FRAGMENT_SHADER);

  gl.linkProgram(program);
  const linkLog = gl.getProgramInfoLog(program);
  if(linkLog)
    console.error(linkLog);

  //Get locations of program's uniforms and attributes by name
  const locations = getLocations(gl, program, names.uniform, names.attribute);

  return {program, locations};
}

/*
 * @function getLocations
 *
 * @param WebGL2RenderingContext gl
 * @param WebGLProgram program
 * @param Object uniformNames Key represents where location will be stored in result, value is the name of the uniform in shader program
 * @param Object attribNames Key represents where location will be stored in result, value is the name of the attribute in shader program
 */
export function getLocations(gl, program, uniformNames, attribNames) {
  const uniformKV = Object.entries(uniformNames);
  let uniform = {}
  uniformKV.forEach(([k, v]) => {
    uniform[k] = gl.getUniformLocation(program, v)
  });

  const attribKV = Object.entries(attribNames);
  let attribute = {}
  attribKV.forEach(([k, v]) => {
    attribute[k] = gl.getAttribLocation(program, v)
  });

  return {uniform, attribute};
}

/*
 * @function resize
 *
 * @param WebGL2RenderingContext gl
 * @param HTMLCanvasElement canvas
 * @param Number aspectRatio
 *
 * @returns void
 *
 * Handler for window resize
 */
export function resize(gl, canvas, aspectRatio) {
  // Among other things, this method makes sure the game is always 16/9
  const scaleFactor = 0.9;

  let wWidth = window.innerWidth;
  let wHeight = window.innerHeight;

  let windowAspectRatio = wWidth/ wHeight;

  if(windowAspectRatio > aspectRatio) {
    canvas.width = wHeight * aspectRatio * scaleFactor;
    canvas.height = wHeight * scaleFactor;
  } else {
    canvas.width = wWidth * scaleFactor;
    canvas.height = wWidth / aspectRatio * scaleFactor;
  };

  gl.viewport(0, 0, canvas.width, canvas.height);
}

/*
 * @function rotate
 *
 * @param vec3 out Destination vector
 * @param vec3 vec Target vector to be rotated
 * @param quat q Quaternion to rotate vector about
 *
 * @returns vec3 out
 *
 * Rotate a vec3 about a quaternion
 */
export const rotate = (function() {
  // Temp wouldn't be required if input was vec4
  const temp = quat.create();
  const conj = quat.create();

  return function(out, vec, q) {
      temp[0] = vec[0];
      temp[1] = vec[1];
      temp[2] = vec[2];

      quat.conjugate(conj, q);

      quat.multiply(temp, q, temp);
      quat.multiply(temp, temp, conj);

      out[0] = temp[0];
      out[1] = temp[1];
      out[2] = temp[2];
      return out;
    }
})();
