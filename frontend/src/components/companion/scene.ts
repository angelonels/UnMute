import * as THREE from 'three';
import {
  createEngine,
  type EngineHandle,
  type FrameInput,
  type StateName,
  type ShapeName,
  type ExpressionName,
} from './dotty-engine';

export type CompanionEmotion = 'auto' | 'calm' | 'curious' | 'happy';
export interface CompanionOptions {
  ceramic: boolean;
  reduced: boolean;
  visible: boolean;
  active: boolean;
  emotion: CompanionEmotion;
  state: StateName;
  shape: ShapeName;
  expression: ExpressionName | null;
  attention?: 'composer' | 'answer' | null;
}
export interface CompanionScene {
  update: (options: CompanionOptions) => void;
  poke: () => void;
  blink: () => void;
  dispose: () => void;
}

/** Dotty's actual numeric frame drives a closed, lit volume and reusable face/effect buffers. */
export function createCompanionScene(
  canvas: HTMLCanvasElement,
  initial: CompanionOptions,
  onLost: () => void,
): CompanionScene {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];
  let engine: EngineHandle | undefined;
  let resize: ResizeObserver | undefined;
  let disposed = false;
  let options = initial;
  let lastFrame: FrameInput | undefined;
  let pokeAt = -10;
  const geo = <T extends THREE.BufferGeometry>(value: T): T => {
    geometries.push(value);
    return value;
  };
  const mat = <T extends THREE.Material>(value: T): T => {
    materials.push(value);
    return value;
  };
  const lost = (event: Event) => {
    event.preventDefault();
    engine?.destroy();
    engine = undefined;
    onLost();
  };
  const release = () => {
    if (disposed) return;
    disposed = true;
    engine?.destroy();
    resize?.disconnect();
    canvas.removeEventListener('webglcontextlost', lost);
    geometries.forEach((value) => value.dispose());
    materials.forEach((value) => value.dispose());
    textures.forEach((value) => value.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
  };
  try {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1.65, 1.65, 1.65, -1.65, 0.1, 20);
    camera.position.set(0, 0, 5);
    scene.add(new THREE.HemisphereLight(0xeaf1ff, 0x706257, 2.5));
    for (const [color, intensity, x, y, z] of [
      [0xfff4df, 4, -3, 5, 5],
      [0xb3d2ff, 2.5, 4, 1, 3],
      [0xffffff, 3, 1, 3, -3],
    ] as const) {
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(x, y, z);
      scene.add(light);
    }
    const actor = new THREE.Group();
    scene.add(actor);
    const segments = 96,
      rings = 24,
      depth = 0.61;
    const angles = Array.from(
      { length: segments },
      (_, i) => (i / segments) * Math.PI * 2 - Math.PI / 2,
    );
    const outlineCos = angles.map(Math.cos),
      outlineSin = angles.map(Math.sin);
    const ringSin = Array.from({ length: rings + 1 }, (_, ring) =>
      Math.sin((ring / rings) * Math.PI),
    );
    const ringDepth = Array.from(
      { length: rings + 1 },
      (_, ring) => Math.cos((ring / rings) * Math.PI) * depth,
    );
    const outlineRadius = new Float64Array(segments);
    const vertices = new Float32Array((rings + 1) * segments * 3);
    const bodyGeometry = geo(new THREE.BufferGeometry());
    bodyGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(vertices, 3).setUsage(THREE.DynamicDrawUsage),
    );
    const indices: number[] = [];
    for (let ring = 0; ring < rings; ring++)
      for (let i = 0; i < segments; i++) {
        const a = ring * segments + i,
          next = ring * segments + ((i + 1) % segments),
          b = a + segments,
          bn = next + segments;
        indices.push(a, bn, b, a, next, bn);
      }
    bodyGeometry.setIndex(indices);
    const shell = mat(
      new THREE.MeshPhysicalMaterial({
        roughness: 0.3,
        metalness: 0.05,
        clearcoat: 0.7,
        clearcoatRoughness: 0.24,
      }),
    );
    actor.add(new THREE.Mesh(bodyGeometry, shell));
    const ink = mat(new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    const eyeBuffers = [-1, 1].map((side) => {
      const geometry = geo(new THREE.BufferGeometry());
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(37 * 3), 3).setUsage(THREE.DynamicDrawUsage),
      );
      const indices = Array.from({ length: 36 }, (_, i) => [0, i + 1, ((i + 1) % 36) + 1]).flat();
      geometry.setIndex(indices);
      const mesh = new THREE.Mesh(geometry, ink);
      mesh.frustumCulled = false;
      actor.add(mesh);
      return { side, geometry };
    });
    const effectGroup = new THREE.Group();
    scene.add(effectGroup);
    effectGroup.scale.setScalar(0.84);
    const circle = geo(new THREE.CircleGeometry(1, 24));
    const ringGeometry = geo(new THREE.RingGeometry(0.96, 1, 64));
    const arc = geo(new THREE.RingGeometry(0.95, 1, 48, 1, 0, Math.PI * 0.44));
    const star = new THREE.Shape();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const r = i % 2 ? 0.25 : 1;
      if (!i) star.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      else star.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    star.closePath();
    const sparkle = geo(new THREE.ShapeGeometry(star));
    const glyph = (text: string) => {
      const surface = document.createElement('canvas');
      surface.width = surface.height = 64;
      const context = surface.getContext('2d');
      if (!context) throw new Error('Companion glyph canvas is unavailable');
      context.fillStyle = '#fff';
      context.font = '500 52px system-ui';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, 32, 32);
      const texture = new THREE.CanvasTexture(surface);
      textures.push(texture);
      return texture;
    };
    const pool = (count: number, geometry: THREE.BufferGeometry, texture?: THREE.Texture) =>
      Array.from({ length: count }, () => {
        const material = mat(
          new THREE.MeshBasicMaterial({
            color: 0x83aaff,
            map: texture,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
        );
        const mesh = new THREE.Mesh(geometry, material);
        mesh.visible = false;
        effectGroup.add(mesh);
        return mesh;
      });
    const quad = geo(new THREE.PlaneGeometry(1, 1));
    const dots = pool(3, circle),
      ripples = pool(2, ringGeometry),
      orbit = pool(1, arc),
      sparks = pool(6, sparkle),
      zs = pool(3, quad, glyph('z')),
      bang = pool(1, quad, glyph('!'));
    const allEffects = [...dots, ...ripples, ...orbit, ...sparks, ...zs, ...bang];
    const shadowMaterial = mat(
      new THREE.MeshBasicMaterial({
        color: 0x24304a,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      }),
    );
    const shadow = new THREE.Mesh(circle, shadowMaterial);
    shadow.scale.set(0.65, 0.055, 1);
    shadow.position.set(0, -1.05, -0.8);
    scene.add(shadow);
    const recolor = () => {
      shell.color.setHex(options.ceramic ? 0xe6e5dc : 0x4569ad);
      ink.color.setHex(options.ceramic ? 0x24334b : 0xf8f3e6);
      allEffects.forEach((mesh) =>
        mesh.material.color.setHex(options.ceramic ? 0x91b8ff : 0x436fbc),
      );
      sparks.forEach((mesh, i) =>
        mesh.material.color.setHex(i % 2 ? 0xf4c87e : options.ceramic ? 0xa9c5ff : 0x4f7fca),
      );
    };
    recolor();
    const effect = (
      mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial> | undefined,
      x: number,
      y: number,
      size: number,
      opacity = 1,
      rotation = 0,
    ) => {
      if (!mesh) return;
      mesh.visible = opacity > 0.005;
      mesh.position.set(x, y, 0.15);
      mesh.scale.setScalar(size);
      mesh.rotation.z = rotation;
      mesh.material.opacity = opacity;
    };
    const renderFrame = (frame: FrameInput) => {
      const elapsed = lastFrame ? Math.max(0, Math.min(0.1, frame.time - lastFrame.time)) : 1;
      lastFrame = frame;
      if (disposed || !options.visible || document.hidden) return;
      const time = options.reduced ? 0 : frame.time;
      const pose = frame.pose;
      const sx = pose.sx * (1 + 0.7 * frame.squash),
        sy = pose.sy * (1 - frame.squash);
      const bodyPosition = bodyGeometry.getAttribute('position');
      for (let i = 0; i < segments; i++) {
        const a = angles[i]!;
        const wobble =
          1 +
          pose.wob *
            (0.6 * Math.sin(3 * a + time * pose.ws) + 0.4 * Math.sin(5 * a - time * pose.ws * 1.3));
        outlineRadius[i] = frame.radii[i]! * wobble;
      }
      for (let ring = 0; ring <= rings; ring++) {
        for (let i = 0; i < segments; i++) {
          const radius = outlineRadius[i]! * ringSin[ring]!;
          bodyPosition.setXYZ(
            ring * segments + i,
            outlineCos[i]! * radius,
            -outlineSin[i]! * radius,
            ringDepth[ring]!,
          );
        }
      }
      bodyPosition.needsUpdate = true;
      bodyGeometry.computeVertexNormals();
      // Normalize intrinsic outlines, not time-varying poses, so long ears fit without zoom pumping.
      const fit = Math.min(1, 1.1 / Math.max(...frame.radii));
      actor.scale.set(sx * fit, sy * fit, fit);
      // Attention retargets translation without snapping when typing interrupts an excursion.
      actor.position.set(
        options.reduced
          ? 0
          : THREE.MathUtils.damp(actor.position.x, (pose.ox / 54) * fit, 10, elapsed),
        ((-pose.oy / 54) * 0.5 + (sy - 1)) * fit,
        0,
      );
      const turnPhase = time % 12;
      const turn = turnPhase > 10.6 ? (turnPhase - 10.6) / 1.4 : 0;
      const spin = turn * turn * (3 - 2 * turn) * Math.PI * 2;
      const pitch =
        options.attention === 'composer'
          ? 0.24
          : options.attention === 'answer'
            ? 0.08
            : Math.sin(time * 1.5) * 0.08;
      const yaw = options.attention
        ? frame.gaze.x * 0.2
        : Math.sin(time * 1.3) * 0.3 +
          Math.sin(time * 0.55) * 0.18 +
          (options.state === 'celebrating' ? (pose.rot * Math.PI) / 180 : spin);
      const turnTo = (from: number, to: number) => THREE.MathUtils.damp(from, to, 14, elapsed);
      actor.rotation.set(
        options.reduced ? 0 : turnTo(actor.rotation.x, pitch),
        options.reduced ? 0 : turnTo(actor.rotation.y, yaw),
        options.state === 'celebrating' ? 0 : (-pose.rot * Math.PI) / 180,
      );
      for (let sideIndex = 0; sideIndex < eyeBuffers.length; sideIndex++) {
        const { side, geometry } = eyeBuffers[sideIndex]!;
        const e = frame.eyes[sideIndex]!;
        const positions = geometry.getAttribute('position');
        const w = e.w * (1 - 0.16 * Math.abs(frame.gaze.x)),
          h = e.h;
        const lt = e.lt + (1 - e.lt) * frame.blink * 0.5,
          lb = e.lb + (1 - e.lb) * frame.blink * 0.5;
        let cx = 0,
          cy = 0,
          cz = 0;
        for (let i = 0; i < 36; i++) {
          const a = (i / 36) * Math.PI * 2;
          const x = w * Math.sign(Math.cos(a)) * Math.abs(Math.cos(a)) ** (2 / e.n);
          const y0 = h * Math.sign(Math.sin(a)) * Math.abs(Math.sin(a)) ** (2 / e.n);
          let top = -h + 2 * h * lt + e.tilt * x * side,
            bottom = h - 2 * h * lb;
          if (top > bottom - 0.025) {
            const middle = (top + bottom) / 2;
            top = middle - 0.0125;
            bottom = middle + 0.0125;
          }
          const px = side * 0.27 + frame.gaze.x * 0.13 + x;
          const py = -(
            -0.04 +
            frame.gaze.y * 0.11 +
            e.dy +
            THREE.MathUtils.clamp(y0, top, bottom) -
            e.bend * (1 - (x / w) ** 2)
          );
          const angle = (Math.atan2(-py, px) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
          const outlineRadius =
            frame.radii[Math.floor((angle / (Math.PI * 2)) * segments) % segments]!;
          const radial = Math.hypot(px, py) / outlineRadius;
          const pz = depth * Math.sqrt(Math.max(0.1, 1 - radial * radial)) + 0.025;
          positions.setXYZ(i + 1, px, py, pz);
          cx += px;
          cy += py;
          cz += pz;
        }
        positions.setXYZ(0, cx / 36, cy / 36, cz / 36);
        positions.needsUpdate = true;
      }
      allEffects.forEach((mesh) => {
        mesh.visible = false;
      });
      let dotIndex = 0,
        ringIndex = 0,
        sparkIndex = 0,
        zIndex = 0;
      if (!options.reduced)
        for (const part of frame.parts) {
          if (part.k === 'dot')
            effect(dots[dotIndex++], (part.x - 100) / 54, (100 - part.y) / 54, part.r / 54, part.o);
          else if (part.k === 'ring')
            effect(ripples[ringIndex++], actor.position.x, actor.position.y, part.r / 54, part.o);
          else if (part.k === 'arc')
            effect(
              orbit[0],
              actor.position.x,
              actor.position.y,
              part.r / 54,
              0.75,
              (-part.rot * Math.PI) / 180,
            );
          else if (part.k === 'spark')
            effect(
              sparks[sparkIndex++],
              (part.x - 100) / 54,
              (100 - part.y) / 54,
              part.s / 54,
              part.o,
              (part.rot * Math.PI) / 180,
            );
          else if (part.k === 'z')
            effect(zs[zIndex++], (part.x - 100) / 54, (100 - part.y) / 54, part.s / 54, part.o);
          else if (part.k === 'bang')
            effect(bang[0], (part.x - 100) / 54, (100 - part.y) / 54, part.s / 54, part.o);
        }
      const pokeProgress = (time - pokeAt) / 0.75;
      if (!options.reduced && pokeProgress >= 0 && pokeProgress < 1)
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + 0.2;
          effect(
            sparks[i],
            Math.cos(a) * (0.8 + pokeProgress * 0.7),
            Math.sin(a) * (0.8 + pokeProgress * 0.7),
            0.09 * (1 - pokeProgress),
            Math.sin(pokeProgress * Math.PI),
            time + i,
          );
        }
      shadow.scale.x = 0.65 - Math.max(0, actor.position.y) * 0.15;
      renderer.render(scene, camera);
    };
    const engineOptions = () => ({
      state: options.state,
      shape: options.shape,
      expression: options.expression,
      attention: options.attention ?? null,
      followPointer: false,
      maxFrameRate: canvas.clientWidth >= 96 ? 60 : 30,
      reducedMotion: options.reduced || !options.visible,
      onFrame: renderFrame,
    });
    const size = () => {
      const rect = canvas.getBoundingClientRect();
      renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
      if (lastFrame) renderFrame(lastFrame);
    };
    size();
    engine = createEngine(canvas, engineOptions());
    resize = new ResizeObserver(size);
    resize.observe(canvas);
    canvas.addEventListener('webglcontextlost', lost);
    canvas.dataset.renderer = 'webgl';
    canvas.dataset.engine = 'dotty';
    return {
      update(next) {
        const greet = next.active && !options.active;
        const recolorNeeded = next.ceramic !== options.ceramic;
        options = next;
        if (recolorNeeded) recolor();
        engine?.update(engineOptions());
        if (greet) engine?.blink();
      },
      poke() {
        if (options.reduced) return;
        pokeAt = lastFrame?.time ?? 0;
        engine?.poke();
      },
      blink() {
        engine?.blink();
      },
      dispose: release,
    };
  } catch (error) {
    release();
    throw error;
  }
}
