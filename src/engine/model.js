
import { glMatrix as glm } from "./gl-matrix.js";

/*
 * @function build
 *
 * @param Array(Float) verts Input vertices, can be Typed Array
 * @param Function comparator Predicate function testing for equality
 * @param Boolean flatten (default true) should the resulting vertex array be flattened?
 *
 * @returns {indices: Array(Int), vertices: Array(Array(Float))|Float32Array}
 *
 */
export function build(verts, comparator, flatten=true) {
  const indices = [];
  const vertices = [];

  verts.forEach(v=> {
    // TODO this is awful
    const reducer = (acc, val, ix) => {
      if(acc !== -1) return acc;
      if(comparator(v,val)) return ix;
      return -1;
    };
    const match = vertices.reduce(reducer, -1);
    if(match !== -1) {
      indices.push(match);
    } else {
      indices.push(vertices.length);
      vertices.push(v);
    }
  });

  if(!flatten)
    return { indices, vertices }

  // Flatten vertices to single Float32Array
  const elementsEach = vertices[0].length;
  const vertBuffer = new Float32Array(vertices.length * elementsEach);
  vertices.forEach((v,ix) => vertBuffer.set(v, ix * elementsEach));

  return { indices, vertices: vertBuffer };

}

export function fromObj(obj) {
  let ret = [];
  const stride = obj.textureStride;
  for(let i=0; i<obj.textures.length/stride; i++) {
    ret.push(...obj.vertices.slice(i*3,i*3+3), ...obj.textures.slice(i*stride, i*stride+stride));
  }
  return ret;
}

export function fromCollada(dae) {
  // glm.equals checks with an epsilon
  const equals = (a, b) => {
    return (glm.equals(a[0], b[0]) &&
      glm.equals(a[1], b[1]) &&
      glm.equals(a[2], b[2]) &&
      glm.equals(a[3], b[3]) &&
      glm.equals(a[4], b[4]));
  }

  const countVerts = dae.vertexPositionIndices.length;
  // Putting the positions and uvs together to be able to index correctly
  const combined = [];
  // This basically de-indexes what collada provides us with so that we can
  // have our indices the way we want them
  // TODO may be able to offload this to build-time if I modify collada loader
  for(let i=0; i<countVerts; i++) {
    combined[i] = [];
    //TODO maybe deal with normals in the future, not using them now
    const posIndex = dae.vertexPositionIndices[i];
    combined[i].push(...dae.vertexPositions.slice(posIndex*3, posIndex*3+3));
    const uvIndex = dae.vertexUVIndices[i];
    combined[i].push(...dae.vertexUVs.slice(uvIndex*2, uvIndex*2+2));
  }

  return build(combined, equals);

}
