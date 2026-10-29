import * as THREE from 'three';
import { createSculpture } from './sculpture';
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
  reduced: boolean;
  visible: boolean;
  active: boolean;
  emotion: CompanionEmotion;
  state: StateName;
  shape: ShapeName;
  expression: ExpressionName | null;
  attention?: 'composer' | 'answer' | null;
  stage?: 'sculpture';
  dark?: boolean;
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
  const sculptureMode = initial.stage === 'sculpture';
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
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, sculptureMode && canvas.clientWidth < 400 ? 1.25 : 1.5),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const extent = sculptureMode ? 2.18 : 1.65;
    const camera = new THREE.OrthographicCamera(-extent, extent, extent, -extent, 0.1, 20);
    camera.position.set(0, sculptureMode ? 0.9 : 0, sculptureMode ? 6 : 5);
    if (sculptureMode) camera.lookAt(0, 0.08, 0);
    renderer.shadowMap.enabled = sculptureMode;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    const world = new THREE.Group();
    scene.add(world);
    const companion = new THREE.Group();
    world.add(companion);
    if (sculptureMode) {
      companion.scale.setScalar(0.36);
      companion.position.set(0.03, 0, 0.2);
      const sculpture = createSculpture(geo, mat);
      companion.position.y = sculpture.supportY;
      world.add(sculpture.group);
      canvas.dataset.sculptureVertices = String(sculpture.vertices);
      canvas.dataset.sculptureDepth = String(sculpture.depth);
      world.rotation.set(0.04, -0.2, 0);
      const floor = new THREE.Mesh(
        geo(new THREE.PlaneGeometry(12, 12)),
        mat(new THREE.ShadowMaterial({ opacity: 0.045 })),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = sculpture.floorY - 0.002;
      floor.receiveShadow = true;
      world.add(floor);
    }
    let shadowLight: THREE.DirectionalLight | undefined;
    const hemisphere = new THREE.HemisphereLight(0xeaf1ff, 0x706257, sculptureMode ? 1.5 : 2.5);
    scene.add(hemisphere);
    const studioLights: THREE.DirectionalLight[] = [];
    for (const [color, intensity, x, y, z] of [
      [0xfff4df, 4, -3, 5, 5],
      [0xb3d2ff, 2.5, 4, 1, 3],
      [0xffffff, 3, 1, 3, -3],
    ] as const) {
      const light = new THREE.DirectionalLight(color, sculptureMode ? intensity * 0.5 : intensity);
      light.position.set(x, y, z);
      if (sculptureMode && x === -3) {
        shadowLight = light;
        light.position.set(-1.5, 9, 5);
        light.castShadow = true;
        const shadowSize = canvas.clientWidth < 400 ? 512 : 1024;
        light.shadow.mapSize.set(shadowSize, shadowSize);
        Object.assign(light.shadow.camera, {
          left: -3,
          right: 3,
          top: 3,
          bottom: -3,
          near: 0.5,
          far: 14,
        });
        light.shadow.radius = shadowSize / 64;
        light.shadow.bias = -0.0003;
        light.shadow.normalBias = 0.015;
      }
      scene.add(light);
      studioLights.push(light);
    }
    const applyLighting = () => {
      if (!sculptureMode) return;
      const dark = options.dark === true;
      renderer.toneMappingExposure = dark ? 0.82 : 1;
      hemisphere.intensity = dark ? 1.05 : 1.5;
      hemisphere.color.setHex(dark ? 0xd9d1ff : 0xeaf1ff);
      studioLights.forEach((light, index) => {
        light.intensity = [2, 1.25, 1.5][index]! * (dark ? 0.7 : 1);
        if (index === 1) light.color.setHex(dark ? 0xc4b8ff : 0xb3d2ff);
      });
      canvas.dataset.lighting = dark ? 'night-studio' : 'day-studio';
    };
    applyLighting();
    const actor = new THREE.Group();
    companion.add(actor);
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
    const bodyMesh = new THREE.Mesh(bodyGeometry, shell);
    bodyMesh.castShadow = sculptureMode;
    bodyMesh.receiveShadow = sculptureMode;
    actor.add(bodyMesh);
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
    companion.add(effectGroup);
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
            color: 0xffffff,
            ...(texture ? { map: texture } : {}),
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
    companion.add(shadow);
    shadow.visible = !sculptureMode;
    const paletteSurface = document.createElement('canvas');
    paletteSurface.width = paletteSurface.height = 1;
    const paletteContext = paletteSurface.getContext('2d', { willReadFrequently: true });
    if (!paletteContext) throw new Error('Companion palette canvas is unavailable');
    const brandColor = (styles: CSSStyleDeclaration, token: string) => {
      paletteContext.fillStyle = styles.getPropertyValue(token).trim();
      paletteContext.fillRect(0, 0, 1, 1);
      const [red, green, blue] = paletteContext.getImageData(0, 0, 1, 1).data;
      return new THREE.Color().setRGB(red! / 255, green! / 255, blue! / 255, THREE.SRGBColorSpace);
    };
    const recolor = () => {
      // Mumo has one ceramic identity; themes change its surroundings, never its finish.
      const styles = getComputedStyle(canvas);
      shell.color.copy(brandColor(styles, '--companion-body'));
      ink.color.copy(brandColor(styles, '--companion-face'));
      const primary = brandColor(styles, '--primary');
      const secondary = brandColor(styles, '--secondary');
      allEffects.forEach((mesh) => mesh.material.color.copy(primary));
      sparks.forEach((mesh, i) => mesh.material.color.copy(i % 2 ? secondary : primary));
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
      if (sculptureMode) canvas.dataset.sculptureYaw = '-0.200';
      const time = options.reduced ? 0 : frame.time;
      const pose = frame.pose;
      // Short, separated beats read as personality rather than a looping dance.
      // Deform the actor transform, keeping the cached shell and its seat contact.
      const stageTime = time % 9;
      const delight =
        sculptureMode && !options.reduced && stageTime > 1.2 && stageTime < 3
          ? Math.sin(((stageTime - 1.2) / 1.8) * Math.PI) ** 2
          : 0;
      const surprise =
        sculptureMode && !options.reduced && !options.active && options.expression === 'happy'
          ? THREE.MathUtils.smoothstep(stageTime, 4.1, 4.45) *
            (1 - THREE.MathUtils.smoothstep(stageTime, 5.15, 5.6))
          : 0;
      const spring = Math.sin(time * 10) * delight;
      const stretch = 1 + spring * 0.09;
      const widen = 1 / Math.sqrt(stretch);
      const sx = pose.sx * (1 + 0.7 * frame.squash) * widen,
        sy = pose.sy * (1 - frame.squash) * stretch;
      let bodyChanged = false,
        maxRadius = 0;
      for (let i = 0; i < segments; i++) {
        const a = angles[i]!;
        const wobble =
          1 +
          pose.wob *
            (0.6 * Math.sin(3 * a + time * pose.ws) + 0.4 * Math.sin(5 * a - time * pose.ws * 1.3));
        const radius = frame.radii[i]! * wobble;
        if (radius !== outlineRadius[i]) bodyChanged = true;
        outlineRadius[i] = radius;
        maxRadius = Math.max(maxRadius, frame.radii[i]!);
      }
      // Idle breathing, gaze and pokes use object transforms; keep their shell buffers on the GPU.
      if (bodyChanged) {
        const bodyPosition = bodyGeometry.getAttribute('position');
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
        bodyGeometry.computeBoundingSphere();
      }
      // Normalize intrinsic outlines, not time-varying poses, so long ears fit without zoom pumping.
      const fit = Math.min(1, 1.1 / maxRadius);
      actor.scale.set(sx * fit, sy * fit, fit * widen);
      // Attention retargets translation without snapping when typing interrupts an excursion.
      actor.position.set(
        options.reduced || sculptureMode
          ? 0
          : THREE.MathUtils.damp(actor.position.x, (pose.ox / 54) * fit, 10, elapsed),
        ((-pose.oy / 54) * 0.5 + (sy - 1)) * fit,
        0,
      );
      const turnPhase = time % 12;
      const turn = turnPhase > 10.6 ? (turnPhase - 10.6) / 1.4 : 0;
      const spin = turn * turn * (3 - 2 * turn) * Math.PI * 2;
      const pitch = sculptureMode
        ? -0.035 + Math.sin(time * 1.7) * 0.09 + delight * Math.sin(time * 8) * 0.08
        : options.attention === 'composer'
          ? 0.24
          : options.attention === 'answer'
            ? 0.08
            : Math.sin(time * 1.5) * 0.08;
      const yaw = sculptureMode
        ? Math.sin(time * 0.85) * 0.27 + Math.sin(time * 1.65) * 0.11
        : options.attention
          ? frame.gaze.x * 0.2
          : Math.sin(time * 1.3) * 0.3 +
            Math.sin(time * 0.55) * 0.18 +
            (options.state === 'celebrating' ? (pose.rot * Math.PI) / 180 : spin);
      const turnTo = (from: number, to: number) => THREE.MathUtils.damp(from, to, 14, elapsed);
      actor.rotation.set(
        options.reduced ? 0 : turnTo(actor.rotation.x, pitch),
        options.reduced ? 0 : turnTo(actor.rotation.y, yaw),
        options.reduced
          ? 0
          : sculptureMode
            ? Math.sin(time * 1.8) * 0.045 + spring * 0.07
            : options.state === 'celebrating'
              ? 0
              : (-pose.rot * Math.PI) / 180,
      );
      if (sculptureMode) {
        // Seat the current deformed pose on the ceramic counter. Removing idle
        // translation while retaining gaze/squash keeps a resting body in contact.
        actor.updateMatrix();
        const matrix = actor.matrix.elements;
        const position = bodyGeometry.getAttribute('position');
        let bottom = Infinity;
        for (let index = 0; index < position.count; index++) {
          bottom = Math.min(
            bottom,
            matrix[1]! * position.getX(index) +
              matrix[5]! * position.getY(index) +
              matrix[9]! * position.getZ(index),
          );
        }
        actor.position.y = -bottom;
        canvas.dataset.supportGap = (actor.position.y + bottom).toFixed(3);
        canvas.dataset.mumoYaw = actor.rotation.y.toFixed(3);
        canvas.dataset.personality = options.reduced
          ? 'resting'
          : surprise > 0.1
            ? 'surprised'
            : delight > 0.1
              ? 'delighted'
              : 'content';
      }
      for (let sideIndex = 0; sideIndex < eyeBuffers.length; sideIndex++) {
        const { side, geometry } = eyeBuffers[sideIndex]!;
        const e = frame.eyes[sideIndex]!;
        const positions = geometry.getAttribute('position');
        const w = e.w * (1 - 0.16 * Math.abs(frame.gaze.x)),
          h = THREE.MathUtils.lerp(e.h, 0.23, surprise);
        const lt = e.lt + (1 - e.lt) * frame.blink * 0.5,
          eyeLower = THREE.MathUtils.lerp(e.lb, 0, surprise),
          lb = eyeLower + (1 - eyeLower) * frame.blink * 0.5;
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
            e.bend * (1 - surprise) * (1 - (x / w) ** 2)
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
      maxFrameRate: sculptureMode
        ? canvas.clientWidth < 400
          ? 24
          : 30
        : canvas.clientWidth >= 96
          ? 60
          : 30,
      reducedMotion: options.reduced || !options.visible,
      onFrame: renderFrame,
    });
    let width = 0,
      height = 0;
    const size = () => {
      const rect = canvas.getBoundingClientRect();
      const nextWidth = Math.max(1, rect.width),
        nextHeight = Math.max(1, rect.height);
      if (nextWidth === width && nextHeight === height) return;
      width = nextWidth;
      height = nextHeight;
      const compact = sculptureMode && width < 400;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, compact ? 1.25 : 1.5));
      if (shadowLight) {
        const shadowSize = compact ? 512 : 1024;
        if (shadowLight.shadow.mapSize.x !== shadowSize) {
          shadowLight.shadow.map?.dispose();
          shadowLight.shadow.map = null;
          shadowLight.shadow.mapSize.set(shadowSize, shadowSize);
          shadowLight.shadow.radius = shadowSize / 64;
          shadowLight.shadow.needsUpdate = true;
        }
        canvas.dataset.shadowSize = String(shadowSize);
      }
      canvas.dataset.qualityTier = compact ? 'compact' : 'wide';
      renderer.setSize(width, height, false);
      engine?.update(engineOptions());
      if (lastFrame) renderFrame(lastFrame);
    };
    size();
    engine = createEngine(canvas, engineOptions());
    resize = new ResizeObserver(size);
    resize.observe(canvas);
    canvas.addEventListener('webglcontextlost', lost);
    if (sculptureMode) {
      canvas.dataset.stage = 'sculpture';
    }
    canvas.dataset.renderer = 'webgl';
    canvas.dataset.engine = 'dotty';
    return {
      update(next) {
        const greet = next.active && !options.active;
        const becameVisible = next.visible && !options.visible;
        const lightingChanged = next.dark !== options.dark;
        options = next;
        if (lightingChanged) {
          recolor();
          applyLighting();
        }
        engine?.update(engineOptions());
        if ((becameVisible || lightingChanged) && lastFrame) renderFrame(lastFrame);
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
