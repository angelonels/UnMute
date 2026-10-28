import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export type CompanionEmotion = 'auto' | 'calm' | 'curious' | 'happy';
export interface CompanionOptions {
  ceramic: boolean;
  reduced: boolean;
  visible: boolean;
  active: boolean;
  emotion: CompanionEmotion;
}
export interface CompanionScene {
  update: (options: CompanionOptions) => void;
  dispose: () => void;
}

/** A complete, sculpted object. No image planes, external models, textures or HDR downloads. */
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
  let environment: THREE.WebGLRenderTarget | undefined;
  const geometry = <T extends THREE.BufferGeometry>(value: T): T => {
    geometries.push(value);
    return value;
  };
  const material = <T extends THREE.Material>(value: T): T => {
    materials.push(value);
    return value;
  };
  let frame = 0;
  let disposed = false;
  let options = initial;
  let elapsed = 0;
  let previousTime = 0;
  let lastRender = 0;
  let greeting = -10;
  let nextBlink = 1.4;
  let blinkAt = -10;
  let seed = 17;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const release = () => {
    cancelAnimationFrame(frame);
    geometries.forEach((value) => value.dispose());
    materials.forEach((value) => value.dispose());
    environment?.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
  try {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1.32, 1.32, 1.32, -1.32, 0.1, 20);
    camera.position.set(0, 0.05, 5);
    camera.lookAt(0, 0, 0);
    const room = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(renderer);
    try {
      environment = generator.fromScene(room, 0.04);
      scene.environment = environment.texture;
    } finally {
      generator.dispose();
      room.dispose();
    }
    scene.environmentIntensity = 0.7;
    const key = new THREE.DirectionalLight(0xfff9ef, 3.3);
    key.position.set(-3, 5, 5);
    const fill = new THREE.DirectionalLight(0xe5edff, 1.2);
    fill.position.set(4, 1, 3);
    const rim = new THREE.DirectionalLight(0xd6e1ff, 1.8);
    rim.position.set(1, 3, -3);
    scene.add(key, fill, rim);

    const actor = new THREE.Group();
    const expression = new THREE.Group();
    actor.add(expression);
    scene.add(actor);
    const bodyGeometry = geometry(new THREE.SphereGeometry(1, 64, 48));
    const position = bodyGeometry.getAttribute('position');
    function sculpt(x: number, y: number, z: number): THREE.Vector3 {
      const groove = Math.exp(-((x + 0.33) ** 2) / 0.022 - (y - 0.84) ** 2 / 0.11);
      const radius = 1 - groove * 0.16;
      const lowerWeight = 0.88 + 0.09 * Math.exp(-((y + 0.24) ** 2) / 0.35);
      return new THREE.Vector3(
        x * lowerWeight * radius + y * 0.065,
        y * 0.91 * radius,
        z * 0.65 * radius,
      );
    }
    for (let i = 0; i < position.count; i++) {
      const point = sculpt(position.getX(i), position.getY(i), position.getZ(i));
      position.setXYZ(i, point.x, point.y, point.z);
    }
    position.needsUpdate = true;
    bodyGeometry.computeVertexNormals();
    const shell = material(
      new THREE.MeshPhysicalMaterial({
        roughness: 0.57,
        metalness: 0,
        clearcoat: 0.12,
        clearcoatRoughness: 0.35,
        envMapIntensity: 0.85,
      }),
    );
    const body = new THREE.Mesh(bodyGeometry, shell);
    expression.add(body);

    const foldPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 14; i++) {
      const z = -0.36 + (i * 0.72) / 14;
      const x = -0.33;
      const point = sculpt(x, Math.sqrt(1 - x * x - z * z), z);
      point.y += 0.006;
      foldPoints.push(point);
    }
    const foldMaterial = material(
      new THREE.MeshStandardMaterial({ color: 0x7d91ad, roughness: 0.65 }),
    );
    expression.add(
      new THREE.Mesh(
        geometry(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(foldPoints), 28, 0.009, 6, false),
        ),
        foldMaterial,
      ),
    );

    const eyeMaterial = material(new THREE.MeshBasicMaterial({ transparent: true }));
    const happyMaterial = material(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
    const mouthMaterial = material(
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9 }),
    );
    const face = new THREE.Group();
    expression.add(face);
    const eyeGeometry = geometry(new THREE.CapsuleGeometry(0.044, 0.082, 8, 16));
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.14, 0.035, 0.643);
    rightEye.position.set(0.14, 0.047, 0.643);
    leftEye.scale.z = rightEye.scale.z = 0.42;
    leftEye.rotation.y = -0.12;
    rightEye.rotation.y = 0.12;
    face.add(leftEye, rightEye);
    const smileEyes: THREE.Mesh[] = [];
    for (const x of [-0.14, 0.14]) {
      const points = [
        new THREE.Vector3(x - 0.065, 0.02, 0.644),
        new THREE.Vector3(x, 0.07, 0.654),
        new THREE.Vector3(x + 0.065, 0.02, 0.644),
      ];
      const eye = new THREE.Mesh(
        geometry(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 16, 0.014, 8, false)),
        happyMaterial,
      );
      smileEyes.push(eye);
      face.add(eye);
    }
    const mouthPoints = [
      new THREE.Vector3(-0.105, -0.18, 0.63),
      new THREE.Vector3(0, -0.245, 0.636),
      new THREE.Vector3(0.105, -0.18, 0.63),
    ];
    const mouth = new THREE.Mesh(
      geometry(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mouthPoints), 16, 0.01, 8, false)),
      mouthMaterial,
    );
    face.add(mouth);
    const shadowMaterial = material(
      new THREE.MeshBasicMaterial({
        color: 0x101722,
        transparent: true,
        opacity: 0.11,
        depthWrite: false,
      }),
    );
    const shadow = new THREE.Mesh(geometry(new THREE.CircleGeometry(1, 48)), shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(0.64, 0.16, 1);
    shadow.position.set(0, -0.98, 0);
    scene.add(shadow);

    function palette() {
      shell.color.setHex(options.ceramic ? 0xdedbd1 : 0x283344);
      const ink = options.ceramic ? 0x202c39 : 0xf0ede3;
      eyeMaterial.color.setHex(ink);
      happyMaterial.color.setHex(ink);
      mouthMaterial.color.setHex(ink);
      foldMaterial.color.setHex(options.ceramic ? 0x8190a1 : 0x647fa4);
    }
    palette();
    const smooth = (value: number) => {
      const t = THREE.MathUtils.clamp(value, 0, 1);
      return t * t * (3 - 2 * t);
    };
    const poses = [
      { yaw: 0.12, tilt: -0.07, gaze: 0.018, curious: 0.3, happy: 0.72 },
      { yaw: -0.45, tilt: 0.075, gaze: -0.035, curious: 1, happy: 0.25 },
      { yaw: 0.48, tilt: -0.065, gaze: 0.035, curious: 0.8, happy: 0.4 },
      { yaw: 0.05, tilt: 0.025, gaze: 0, curious: 0, happy: 1 },
      { yaw: 0.15, tilt: -0.025, gaze: 0.01, curious: 0.3, happy: 0.85 },
    ];
    let poseIndex = 0;
    let poseAt = 0;
    let poseDuration = 1.4;
    let from = poses[0]!;
    let target = poses[0]!;
    let turns = 0;
    let turnAt = -10;
    let nextTurn = 3.8;
    let happy = 0.72;
    let curiosity = 0;
    let yaw = 0;
    let tilt = 0;
    let gaze = 0;
    function pose(delta: number) {
      const moving = !options.reduced;
      if (moving) {
        elapsed += delta;
        if (elapsed - poseAt > poseDuration) {
          from = { yaw, tilt, gaze, curious: curiosity, happy };
          poseIndex = (poseIndex + 1) % poses.length;
          target = poses[poseIndex]!;
          poseAt = elapsed;
          poseDuration = 1.2 + random() * 1.6;
          if (elapsed >= nextTurn) {
            turnAt = elapsed;
            nextTurn = elapsed + 9 + random() * 7;
          }
        }
        const progress = smooth((elapsed - poseAt) / 0.36);
        yaw = THREE.MathUtils.lerp(from.yaw, target.yaw, progress);
        tilt = THREE.MathUtils.lerp(from.tilt, target.tilt, progress);
        gaze = THREE.MathUtils.lerp(from.gaze, target.gaze, progress);
        happy = THREE.MathUtils.lerp(from.happy, target.happy, progress);
        curiosity = THREE.MathUtils.lerp(from.curious, target.curious, progress);
        if (elapsed >= nextBlink) {
          blinkAt = elapsed;
          nextBlink = elapsed + 2.8 + random() * 3;
        }
      }
      const emotionHappy = options.emotion === 'auto' ? happy : options.emotion === 'happy' ? 1 : 0;
      const emotionCurious =
        options.emotion === 'auto' ? curiosity : options.emotion === 'curious' ? 1 : 0;
      const blinkProgress = (elapsed - blinkAt) / 0.16;
      const blink =
        moving && blinkProgress >= 0 && blinkProgress < 1
          ? Math.max(0.09, 1 - Math.sin(blinkProgress * Math.PI))
          : 1;
      const turnProgress = smooth((elapsed - turnAt) / 0.95);
      if (turnProgress === 1 && turnAt > 0) {
        turns++;
        turnAt = -10;
      }
      const turn = turns * Math.PI * 2 + (turnAt > 0 ? turnProgress * Math.PI * 2 : 0);
      const hello = moving ? Math.max(0, 1 - (elapsed - greeting) / 0.8) : 0;
      actor.rotation.set(
        moving ? Math.sin(elapsed * 2.2) * 0.065 : 0,
        moving ? yaw + turn : yaw + turns * Math.PI * 2,
        0,
      );
      actor.position.set(
        moving ? Math.sin(elapsed * 1.8) * 0.065 : 0,
        moving ? Math.abs(Math.sin(elapsed * 2.8)) * 0.085 + Math.sin(hello * Math.PI) * 0.1 : 0,
        0,
      );
      expression.rotation.z = moving ? tilt - emotionCurious * 0.07 : -emotionCurious * 0.07;
      expression.scale.set(1, moving ? 1 + Math.sin(elapsed * 5.6) * 0.018 : 1, 1);
      face.position.x = moving ? gaze : 0;
      face.rotation.y = moving ? gaze * 0.6 : 0;
      leftEye.scale.y = blink * (1 - emotionHappy * 0.45 + emotionCurious * 0.08);
      rightEye.scale.y = blink * (1 - emotionHappy * 0.45 + emotionCurious * 0.3);
      eyeMaterial.opacity = 1 - emotionHappy;
      happyMaterial.opacity = emotionHappy;
      smileEyes.forEach((eye) => {
        eye.scale.y = blink;
      });
      mouth.scale.x = 1 + emotionHappy * 0.3;
      mouth.position.y = -emotionHappy * 0.015;
      shadowMaterial.opacity = options.ceramic ? 0.1 : 0.07;
    }
    function render(time: number) {
      if (disposed || !options.visible || document.hidden) {
        frame = 0;
        previousTime = 0;
        return;
      }
      if (time - lastRender >= 1000 / 30 || options.reduced) {
        const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.08) : 0;
        previousTime = time;
        lastRender = time;
        pose(delta);
        renderer.render(scene, camera);
      }
      if (!options.reduced) frame = requestAnimationFrame(render);
      else frame = 0;
    }
    function request() {
      if (!frame && options.visible && !document.hidden && !disposed)
        frame = requestAnimationFrame(render);
    }
    const resize = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        renderer.setSize(rect.width, rect.height, false);
        request();
      }
    });
    resize.observe(canvas);
    const visibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
        previousTime = 0;
      } else request();
    };
    const lost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      frame = 0;
      onLost();
    };
    document.addEventListener('visibilitychange', visibility);
    canvas.addEventListener('webglcontextlost', lost);
    canvas.dataset.renderer = 'webgl';
    const rect = canvas.getBoundingClientRect();
    renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
    pose(0);
    renderer.render(scene, camera);
    request();
    return {
      update(next) {
        if (next.active && !options.active) greeting = elapsed;
        const recolor = next.ceramic !== options.ceramic;
        options = next;
        if (recolor) palette();
        cancelAnimationFrame(frame);
        frame = 0;
        previousTime = 0;
        request();
      },
      dispose() {
        disposed = true;
        resize.disconnect();
        document.removeEventListener('visibilitychange', visibility);
        canvas.removeEventListener('webglcontextlost', lost);
        release();
      },
    };
  } catch (error) {
    release();
    throw error;
  }
}
