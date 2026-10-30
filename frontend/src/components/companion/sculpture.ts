import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

/** A closed ceramic volume with a sloping glazed end, built once per scene. */
export function createSculpture(
  geometry: <T extends THREE.BufferGeometry>(value: T) => T,
  material: <T extends THREE.Material>(value: T) => T,
) {
  const shape = new THREE.Shape();
  shape.moveTo(-1.4, 1.44);
  shape.lineTo(-1.4, -0.22);
  shape.bezierCurveTo(-1.4, -2.04, 1.4, -2.04, 1.4, -0.22);
  shape.lineTo(1.4, 0.7);
  shape.quadraticCurveTo(1.4, 0.96, 1.16, 0.884);
  shape.lineTo(0.98, 0.826);
  shape.quadraticCurveTo(0.74, 0.75, 0.74, 0.51);
  shape.lineTo(0.74, -0.22);
  shape.bezierCurveTo(0.74, -1.4, -0.74, -1.4, -0.74, -0.22);
  shape.lineTo(-0.74, 1.26);
  shape.quadraticCurveTo(-0.74, 1.54, -1.02, 1.616);
  shape.lineTo(-1.14, 1.649);
  shape.quadraticCurveTo(-1.4, 1.72, -1.4, 1.44);
  shape.closePath();
  const extruded = new THREE.ExtrudeGeometry(shape, {
    depth: 0.56,
    bevelEnabled: true,
    bevelSegments: 12,
    steps: 1,
    bevelSize: 0.3,
    bevelThickness: 0.3,
    bevelOffset: -0.14,
    curveSegments: 48,
  });
  extruded.translate(0, 0, -0.28);
  // ExtrudeGeometry duplicates seam vertices. Welding once keeps the broad ceramic
  // bevel smooth without rebuilding its static geometry during pointer movement.
  extruded.deleteAttribute('normal');
  extruded.deleteAttribute('uv');
  const body = geometry(mergeVertices(extruded));
  extruded.dispose();
  body.computeVertexNormals();
  const positions = body.getAttribute('position');
  const normals = body.getAttribute('normal');
  const colors = new Float32Array(positions.count * 3);
  const ivory = new THREE.Color(0xf3eef0);
  const rose = new THREE.Color(0xe7a5bf);
  const color = new THREE.Color();
  for (let index = 0; index < positions.count; index++) {
    const x = positions.getX(index);
    const distance = positions.getY(index) - (0.75 + (x - 0.74) * (0.21 / 0.66));
    const glaze =
      x > 0.5
        ? THREE.MathUtils.smoothstep(distance, -0.06, 0.04) *
          THREE.MathUtils.smoothstep(normals.getY(index), 0.5, 0.8)
        : 0;
    color.copy(ivory).lerp(rose, glaze);
    color.toArray(colors, index * 3);
  }
  body.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const ceramic = material(
    new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.5,
      metalness: 0,
      clearcoat: 0.15,
      clearcoatRoughness: 0.5,
    }),
  );
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(body, ceramic);
  mesh.castShadow = mesh.receiveShadow = true;
  group.add(mesh);
  body.computeBoundingBox();
  return {
    group,
    vertices: positions.count,
    depth: 1.16,
    floorY: body.boundingBox!.min.y,
    // The cubic counter reaches its low point at t=.5. Its middle depth
    // contour receives the full bevel offset and supports the seated companion.
    supportY: -0.22 * 0.25 - 1.4 * 0.75 + 0.3 - 0.14,
  };
}
