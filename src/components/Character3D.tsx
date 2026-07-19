import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PLYExporter } from 'three/examples/jsm/exporters/PLYExporter.js';
import { getItem, type Slot } from '../data/items';

export type CharacterExporter = {
  /** Download the current character as a coloured PLY (3D-printer friendly). */
  exportPLY: (filename?: string) => void;
};

type Props = {
  equipped: Record<Slot, string>;
  jumping?: boolean;
  className?: string;
  name?: string;
  gender?: 'boy' | 'girl';
  /** Populated by the component so a parent button can trigger an export. */
  exporterRef?: React.MutableRefObject<CharacterExporter | null>;
};

const SKIN = '#ffe1c6';
const HAIR = '#5b3a1f';
const HAIR_GIRL = '#6b3f1c';
const BOW = '#ec4899';
const EYE_WHITE = '#ffffff';
const EYE_DARK = '#1f2937';
const CHEEK = '#fca5a5';
const MOUTH = '#ef4444';

// Cute 6-year-old: head ~35% of total height, short stubby limbs, round body
const HEAD_SIZE = 0.9;
const HEAD_Y = 1.5;

const TORSO_W = 0.75;
const TORSO_H = 0.75;
const TORSO_D = 0.42;
const TORSO_Y = 0.7;

const ARM_W = 0.22;
const ARM_H = 0.55;
const ARM_X = 0.5;
const ARM_Y = 0.78;

const LEG_W = 0.27;
const LEG_H = 0.6;
const LEG_X = 0.18;
const LEG_Y = 0.0;

const FACE_Z = HEAD_SIZE / 2 + 0.001;

export function Character3D({ equipped, jumping = false, className, name, gender = 'boy', exporterRef }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const charRef = useRef<THREE.Group | null>(null);
  const slotGroupsRef = useRef<Record<Slot, THREE.Group>>({} as any);
  const limbPivotsRef = useRef<{ arms: [THREE.Group, THREE.Group]; legs: [THREE.Group, THREE.Group] } | null>(null);
  const faceFeaturesRef = useRef<THREE.Object3D[]>([]);
  const hairGroupRef = useRef<THREE.Group | null>(null);
  const maskOnRef = useRef(false);
  // Some back items (e.g. ariel_wave, rapunzel_hair) draw their own long
  // hair down the body, so the base hair must hide too even with no mask.
  const backHidesHairRef = useRef(false);
  const jumpRef = useRef(false);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    const el = mountRef.current!;
    // aspect-square wrappers can momentarily report 0 on first mount before
    // layout settles. Floor to a positive size so we never feed 0 into the
    // renderer (which on iPad WebKit produces a half-broken context).
    const w = Math.max(el.clientWidth, 1);
    const h = Math.max(el.clientHeight, 1);

    let renderer: THREE.WebGLRenderer;
    try {
      // Tuned for iPad iOS 17 WebKit: lower-power preference + skip the
      // performance-caveat veto so a battery-throttled device still gives us
      // a real WebGL2 context. antialias off to widen device support.
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: 'low-power',
        failIfMajorPerformanceCaveat: false,
      });
      // Probe the context: on iPad in Low Power Mode, WebGLRenderer can
      // construct successfully but every gl.createShader returns null,
      // which then throws inside Three.js material compilation later. Catch
      // that here so we hit the 2D fallback cleanly instead of blowing up
      // the whole app.
      const gl = renderer.getContext();
      const probe = gl.createShader(gl.VERTEX_SHADER);
      if (!probe) {
        throw new Error('GL context unusable (createShader returned null) — likely Low Power Mode / very low battery on iPad.');
      }
      gl.deleteShader(probe);
    } catch (err) {
      const e = err as Error;
      console.error('WebGL init failed:', err);
      const head = `${e?.name ?? 'Error'}: ${e?.message ?? String(err)}`;
      const stackTop = (e?.stack ?? '').split('\n').slice(0, 3).join('\n');
      setFailed(stackTop ? `${head}\n${stackTop}` : head);
      return;
    }

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 100);
    camera.position.set(0, 1.1, 5.6);
    camera.lookAt(0, 0.9, 0);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    el.appendChild(renderer.domElement);

    // Pronounced directional shading: ambient + hemisphere intentionally
    // low so a face's lit-vs-shaded contrast is obvious, and the front
    // directional is the dominant key light. Emissive on the ironman
    // materials below was also pulled down so the contrast actually reads.
    scene.add(new THREE.AmbientLight(0xffffff, 0.22));
    scene.add(new THREE.HemisphereLight(0xfff5e8, 0x8896a8, 0.25));
    const dirFront = new THREE.DirectionalLight(0xffffff, 1.4);
    dirFront.position.set(2, 4, 3);
    scene.add(dirFront);
    const dirBack = new THREE.DirectionalLight(0xfff0ff, 0.2);
    dirBack.position.set(-3, 2, -3);
    scene.add(dirBack);
    const dirSide = new THREE.DirectionalLight(0xffffff, 0.25);
    dirSide.position.set(-4, 1, 2);
    scene.add(dirSide);

    const char = new THREE.Group();
    charRef.current = char;
    scene.add(char);

    // ---- 3D-print export -------------------------------------------------
    // Walks every visible mesh under `char`, bakes the material's flat color
    // into a per-vertex `color` attribute, freezes the world transform into
    // the geometry, and emits a single binary PLY. PLY is the most common
    // single-file, full-colour format slicers (Bambu Studio, PrusaSlicer,
    // Cura, ChiTuBox) accept for AMS / multicolor printing. STL has no
    // colour, OBJ needs a sidecar MTL file, 3MF has no first-party
    // three.js exporter — PLY hits the sweet spot.
    const exportPLY = (filename = 'character.ply') => {
      const geometries: THREE.BufferGeometry[] = [];
      char.updateMatrixWorld(true);
      char.traverse((obj) => {
        if (!(obj as THREE.Mesh).isMesh) return;
        const m = obj as THREE.Mesh;
        if (!m.visible) return;
        // Walk up to find any hidden ancestor (e.g. mask-hidden face features).
        let cur: THREE.Object3D | null = m;
        while (cur) {
          if (!cur.visible) return;
          cur = cur.parent;
        }
        const srcGeo = m.geometry as THREE.BufferGeometry;
        if (!srcGeo.attributes.position) return;
        const geo = srcGeo.clone();
        geo.applyMatrix4(m.matrixWorld);
        if (!geo.attributes.normal) geo.computeVertexNormals();

        // Bake material colour as per-vertex colour. Works for the diffuse
        // colour on every Standard / Lambert / Phong material we use.
        const mat = m.material as THREE.Material & { color?: THREE.Color };
        const col = mat?.color ? mat.color.clone() : new THREE.Color(0xffffff);
        const count = geo.attributes.position.count;
        const colors = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          colors[i * 3] = col.r;
          colors[i * 3 + 1] = col.g;
          colors[i * 3 + 2] = col.b;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        // PLYExporter only writes position / normal / color / uv. Drop
        // anything else so the file stays clean.
        for (const k of Object.keys(geo.attributes)) {
          if (k !== 'position' && k !== 'normal' && k !== 'color') geo.deleteAttribute(k);
        }
        geometries.push(geo);
      });
      if (!geometries.length) return;
      const group = new THREE.Group();
      geometries.forEach((g) => {
        const mesh = new THREE.Mesh(
          g,
          new THREE.MeshBasicMaterial({ vertexColors: true })
        );
        group.add(mesh);
      });
      const exporter = new PLYExporter();
      exporter.parse(
        group,
        (result) => {
          const blob =
            result instanceof ArrayBuffer
              ? new Blob([result], { type: 'application/octet-stream' })
              : new Blob([result as string], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
        { binary: true }
      );
    };
    if (exporterRef) {
      exporterRef.current = { exportPLY };
    }

    // ---- Head (big chibi cube with rounded look via slight bevel) ----
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(HEAD_SIZE, HEAD_SIZE, HEAD_SIZE, 1, 1, 1),
      new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.8 })
    );
    head.position.set(0, HEAD_Y, 0);
    char.add(head);

    // Hair: container group — gender-specific meshes are built in a
    // separate effect so switching gender doesn't need a full WebGL reinit.
    const hairGroup = new THREE.Group();
    hairGroupRef.current = hairGroup;
    char.add(hairGroup);

    // ---- Eyes: BIG round eyes (kid-like) ----
    // Every face feature is collected so the mask slot can hide them all
    // at once when an ironman / faceplate mask is equipped.
    const faceFeatures: THREE.Object3D[] = [];
    const eyeOffsetX = 0.24;
    const eyeOffsetY = HEAD_Y + 0.02;
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: EYE_WHITE, roughness: 0.4 });
    const pupilMat = new THREE.MeshStandardMaterial({ color: EYE_DARK, roughness: 0.4 });
    const highlightMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: '#ffffff',
      emissiveIntensity: 0.7,
    });

    [-1, 1].forEach((sx) => {
      // Slightly squashed sphere for kid-shaped eye
      const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 24), eyeWhiteMat);
      eyeWhite.scale.set(1, 1.05, 0.7);
      eyeWhite.position.set(sx * eyeOffsetX, eyeOffsetY, FACE_Z);
      char.add(eyeWhite);
      faceFeatures.push(eyeWhite);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.1, 18, 18), pupilMat);
      pupil.scale.set(1, 1.05, 0.6);
      pupil.position.set(sx * eyeOffsetX, eyeOffsetY, FACE_Z + 0.06);
      char.add(pupil);
      faceFeatures.push(pupil);
      // Two highlights for that twinkle look
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), highlightMat);
      hl.position.set(sx * eyeOffsetX - 0.035, eyeOffsetY + 0.045, FACE_Z + 0.13);
      char.add(hl);
      faceFeatures.push(hl);
      const hl2 = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), highlightMat);
      hl2.position.set(sx * eyeOffsetX + 0.025, eyeOffsetY - 0.04, FACE_Z + 0.13);
      char.add(hl2);
      faceFeatures.push(hl2);
    });

    // ---- Glasses (signature, sized to fit big eyes) ----
    const glassMat = new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.4, roughness: 0.4 });
    [-1, 1].forEach((sx) => {
      const lens = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.022, 12, 28), glassMat);
      lens.position.set(sx * eyeOffsetX, eyeOffsetY, FACE_Z + 0.1);
      char.add(lens);
      faceFeatures.push(lens);
    });
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.022, 0.022), glassMat);
    bridge.position.set(0, eyeOffsetY, FACE_Z + 0.1);
    char.add(bridge);
    faceFeatures.push(bridge);

    // ---- Cheeks: bigger rosy circles ----
    [-1, 1].forEach((sx) => {
      const cheek = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 18, 18, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({
          color: CHEEK,
          transparent: true,
          opacity: 0.85,
          roughness: 0.9,
        })
      );
      cheek.rotation.x = Math.PI / 2;
      cheek.position.set(sx * 0.34, HEAD_Y - 0.2, FACE_Z);
      cheek.scale.set(1, 1, 0.25);
      char.add(cheek);
      faceFeatures.push(cheek);
    });

    // ---- Mouth: bigger smile ----
    const mouth = new THREE.Mesh(
      new THREE.TorusGeometry(0.085, 0.025, 8, 18, Math.PI),
      new THREE.MeshStandardMaterial({ color: MOUTH })
    );
    mouth.rotation.z = Math.PI;
    mouth.position.set(0, HEAD_Y - 0.3, FACE_Z);
    char.add(mouth);
    faceFeatures.push(mouth);
    // Tiny tongue inside smile (peeking)
    const tongue = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: '#fb7185' })
    );
    tongue.rotation.x = Math.PI / 2;
    tongue.position.set(0, HEAD_Y - 0.32, FACE_Z + 0.02);
    tongue.scale.set(1.2, 0.6, 0.4);
    char.add(tongue);
    faceFeatures.push(tongue);

    faceFeaturesRef.current = faceFeatures;

    // ---- Body (skin base, replaced by top item) ----
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(TORSO_W, TORSO_H, TORSO_D),
      new THREE.MeshStandardMaterial({ color: SKIN })
    );
    torso.position.set(0, TORSO_Y, 0);
    char.add(torso);

    // ---- Limb pivots ----
    // Arms and legs (with their hands/feet AND any per-limb item armor
    // attached later) hang under a Group whose origin is the shoulder/hip
    // joint. Rotating these groups around X swings the whole limb, so the
    // animation is visible even when full-coverage armor (ironman) is on.
    const ARM_PIVOT_Y = ARM_Y + ARM_H / 2;
    const LEG_PIVOT_Y = LEG_Y + LEG_H / 2;
    const armPivots: [THREE.Group, THREE.Group] = [new THREE.Group(), new THREE.Group()];
    const legPivots: [THREE.Group, THREE.Group] = [new THREE.Group(), new THREE.Group()];
    armPivots[0].position.set(-ARM_X, ARM_PIVOT_Y, 0);
    armPivots[1].position.set(ARM_X, ARM_PIVOT_Y, 0);
    legPivots[0].position.set(-LEG_X, LEG_PIVOT_Y, 0);
    legPivots[1].position.set(LEG_X, LEG_PIVOT_Y, 0);
    char.add(armPivots[0], armPivots[1], legPivots[0], legPivots[1]);
    limbPivotsRef.current = { arms: armPivots, legs: legPivots };

    const tagPermanent = (m: THREE.Object3D) => {
      m.userData.permanent = true;
    };

    // ---- Arms (inside the pivot groups, with local Y < 0) ----
    const armMat = new THREE.MeshStandardMaterial({ color: SKIN });
    [0, 1].forEach((i) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(ARM_W, ARM_H, ARM_W), armMat.clone());
      arm.position.set(0, -ARM_H / 2, 0);
      armPivots[i].add(arm);
      tagPermanent(arm);
      // Hand cube at the end of the arm
      const hand = new THREE.Mesh(
        new THREE.BoxGeometry(ARM_W * 1.1, ARM_W * 1.1, ARM_W * 1.1),
        armMat.clone()
      );
      hand.position.set(0, -ARM_H - 0.02, 0);
      armPivots[i].add(hand);
      tagPermanent(hand);
    });

    // ---- Legs (inside the pivot groups) ----
    const legMat = new THREE.MeshStandardMaterial({ color: SKIN });
    [0, 1].forEach((i) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(LEG_W, LEG_H, LEG_W), legMat.clone());
      leg.position.set(0, -LEG_H / 2, 0);
      legPivots[i].add(leg);
      tagPermanent(leg);
      const foot = new THREE.Mesh(
        new THREE.BoxGeometry(LEG_W + 0.04, 0.13, 0.34),
        legMat.clone()
      );
      foot.position.set(0, -LEG_H - 0.05, 0.07);
      legPivots[i].add(foot);
      tagPermanent(foot);
    });

    // ---- Slot groups (each item type clears+adds into its group) ----
    const slotGroups: Record<Slot, THREE.Group> = {
      top: new THREE.Group(),
      bottom: new THREE.Group(),
      hat: new THREE.Group(),
      mask: new THREE.Group(),
      back: new THREE.Group(),
      shoes: new THREE.Group(),
      charm: new THREE.Group(),
      misc: new THREE.Group(),
    };
    Object.values(slotGroups).forEach((g) => char.add(g));
    slotGroupsRef.current = slotGroups;

    // ---- Drag-to-rotate ----
    let userRotation: number | null = null;
    let userRotX = 0;
    let dragStart: { x: number; y: number; rotY: number; rotX: number; pid: number } | null = null;

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      renderer.domElement.setPointerCapture(e.pointerId);
      dragStart = {
        x: e.clientX,
        y: e.clientY,
        rotY: userRotation ?? char.rotation.y,
        rotX: userRotX,
        pid: e.pointerId,
      };
      renderer.domElement.style.cursor = 'grabbing';
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragStart || dragStart.pid !== e.pointerId) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      userRotation = dragStart.rotY + dx * 0.012;
      userRotX = Math.max(-0.5, Math.min(0.5, dragStart.rotX + dy * 0.008));
      char.rotation.y = userRotation;
      char.rotation.x = userRotX;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (dragStart && dragStart.pid === e.pointerId) {
        dragStart = null;
        renderer.domElement.style.cursor = 'grab';
      }
    };
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);

    // ---- Animation loop ----
    let raf = 0;
    const start = performance.now();
    let jumpStart = 0;
    const animate = () => {
      const t = (performance.now() - start) / 1000;
      if (userRotation === null) {
        char.rotation.y = Math.sin(t * 1.3) * 0.3;
      }

      // Idle limb motion: swing each whole limb (with everything attached
      // to it through the redistribute pass) around the shoulder/hip. Arms
      // and legs move in opposite phase so it reads as a relaxed gait.
      // Faster + larger swings so the character reads as visibly active.
      const idle = Math.sin(t * 3.4);
      const armSwing = idle * 0.38;
      const legSwing = idle * 0.32;
      armPivots[0].rotation.x = armSwing;
      armPivots[1].rotation.x = -armSwing;
      legPivots[0].rotation.x = -legSwing;
      legPivots[1].rotation.x = legSwing;
      // Small vertical bob so the character bounces on their feet
      const idleBobY = Math.abs(Math.sin(t * 3.4)) * 0.05;

      if (jumpRef.current && jumpStart === 0) jumpStart = performance.now();
      let jumpY = 0;
      if (jumpStart > 0) {
        const dt = (performance.now() - jumpStart) / 1000;
        if (dt > 0.4) {
          jumpStart = 0;
          jumpRef.current = false;
        } else {
          jumpY = Math.sin((dt / 0.4) * Math.PI) * 0.55;
        }
      }
      char.position.y = jumpY + (jumpStart > 0 ? 0 : idleBobY);

      // Companion (misc slot) — hop and sway so it doesn't just stand there.
      // The misc group holds the whole companion mesh; translating/rotating
      // the group animates every child (body, head, wings, tail) as one.
      const miscGroup = slotGroups.misc;
      if (miscGroup && miscGroup.children.length > 0) {
        // Continuous small hop
        miscGroup.position.y = Math.abs(Math.sin(t * 5.5)) * 0.14;
        // Playful side-to-side sway
        miscGroup.rotation.z = Math.sin(t * 3.2) * 0.09;
        // Slight nod/tilt
        miscGroup.rotation.x = Math.sin(t * 2.4) * 0.06;
        // Extra bounce when the main character jumps (reacts to correct answer)
        if (jumpStart > 0) {
          const dt = (performance.now() - jumpStart) / 1000;
          if (dt < 0.4) {
            miscGroup.position.y += Math.sin((dt / 0.4) * Math.PI) * 0.35;
          }
        }
      }
      try {
        renderer.render(scene, camera);
      } catch (err) {
        // First render compiles shaders — on iPad WebKit in Low Power Mode
        // that compile can throw (createShader returns null → shaderSource
        // gets null). Treat as a renderer failure: stop the loop, dispose,
        // and flip to the 2D fallback.
        const e = err as Error;
        console.error('WebGL render failed:', err);
        cancelAnimationFrame(raf);
        try { renderer.dispose(); } catch { /* noop */ }
        try { el.removeChild(renderer.domElement); } catch { /* noop */ }
        const head = `${e?.name ?? 'Error'}: ${e?.message ?? String(err)}`;
        const stackTop = (e?.stack ?? '').split('\n').slice(0, 3).join('\n');
        setFailed(stackTop ? `${head}\n${stackTop}` : head);
        return;
      }
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const nw = el.clientWidth;
      const nh = el.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      renderer.dispose();
      el.removeChild(renderer.domElement);
      if (exporterRef) exporterRef.current = null;
    };
  }, []);

  // ---- Apply equipped items ----
  useEffect(() => {
    const groups = slotGroupsRef.current;
    if (!groups.top) return;
    const pivots = limbPivotsRef.current;

    const ARM_PIVOT_Y_LOC = ARM_Y + ARM_H / 2;
    const LEG_PIVOT_Y_LOC = LEG_Y + LEG_H / 2;
    const ARM_LEG_SPLIT_Y = ARM_Y - ARM_H; // below this is leg region

    const clear = (g: THREE.Group) => {
      while (g.children.length) {
        const c = g.children.pop()!;
        (c as any).geometry?.dispose?.();
        (c as any).material?.dispose?.();
      }
    };

    // Drop any item meshes we previously redistributed onto the limb pivots
    // (they're tagged with userData.sourceSlot). Base body parts are tagged
    // userData.permanent and are kept.
    const clearLimbsForSlot = (slot: Slot) => {
      if (!pivots) return;
      const drop = (g: THREE.Group) => {
        g.children.slice().forEach((c) => {
          if (c.userData?.sourceSlot === slot) {
            g.remove(c);
            (c as any).geometry?.dispose?.();
            (c as any).material?.dispose?.();
          }
        });
      };
      pivots.arms.forEach(drop);
      pivots.legs.forEach(drop);
    };

    (Object.keys(groups) as Slot[]).forEach((s) => {
      clear(groups[s]);
      clearLimbsForSlot(s);
    });

    // After equipItem populates a slot group, move any per-arm or per-leg
    // children onto the matching limb pivot so they swing with the limb.
    // Center-of-body meshes (chest, belt, etc.) stay in the slot group.
    const redistribute = (slot: Slot) => {
      if (!pivots) return;
      const slotGroup = groups[slot];
      // Per-slot rule for what counts as "per-limb":
      //   top    → above leg cutoff, |x| > 0.45 → arm side (true arm/hand
      //            meshes at ±ARM_X=0.5). Shoulder caps and other near-
      //            torso pieces at |x|≈0.42 stay in the slot group so they
      //            don't visibly oscillate with the arm swing.
      //   bottom → below arm cutoff,  |x| > 0.05 → leg side
      //   shoes  → always per-foot by x sign
      // Other slots (hat, mask, back, charm) stay center-attached.
      const wantArm = slot === 'top';
      const wantLeg = slot === 'bottom' || slot === 'shoes';
      if (!wantArm && !wantLeg) return;
      slotGroup.children.slice().forEach((c) => {
        const wx = c.position.x;
        const wy = c.position.y;
        const inArmRegion = wantArm && Math.abs(wx) > 0.45 && wy > ARM_LEG_SPLIT_Y;
        const inLegRegion =
          wantLeg &&
          (slot === 'shoes'
            ? Math.abs(wx) > 0.05
            : Math.abs(wx) > 0.05 && wy <= ARM_LEG_SPLIT_Y);
        if (!inArmRegion && !inLegRegion) return;
        const isRight = wx > 0;
        const pivot = inArmRegion
          ? pivots.arms[isRight ? 1 : 0]
          : pivots.legs[isRight ? 1 : 0];
        const pivotY = inArmRegion ? ARM_PIVOT_Y_LOC : LEG_PIVOT_Y_LOC;
        const pivotX = inArmRegion ? (isRight ? ARM_X : -ARM_X) : (isRight ? LEG_X : -LEG_X);
        // Re-express world position as pivot-local.
        c.position.set(wx - pivotX, wy - pivotY, c.position.z);
        c.userData.sourceSlot = slot;
        pivot.add(c); // also detaches from slotGroup
      });
    };

    const equipItem = (slot: Slot, id: string) => {
      const item = getItem(id);
      if (!item) return;
      const g = groups[slot];
      const color = new THREE.Color(item.color);
      const accent = item.accent ? new THREE.Color(item.accent) : null;

      switch (slot) {
        case 'top': {
          const kind = item.kind ?? 'tee';

          if (kind === 'elsa_top') {
            // Icy fitted bodice with a snowflake emblem on the chest and
            // shimmering puffy cap sleeves.
            const fabricMat = new THREE.MeshStandardMaterial({
              color,
              roughness: 0.45,
              metalness: 0.15,
            });
            const trimColor = accent ?? new THREE.Color('#ffffff');
            const trimMat = new THREE.MeshStandardMaterial({
              color: trimColor,
              emissive: trimColor,
              emissiveIntensity: 0.25,
              metalness: 0.4,
              roughness: 0.2,
            });
            const bodice = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + 0.04, TORSO_H + 0.04, TORSO_D + 0.04),
              fabricMat
            );
            bodice.position.set(0, TORSO_Y, 0);
            g.add(bodice);
            // Snowflake on chest (3 crossed lines + gem)
            const frontZE = (TORSO_D + 0.04) / 2;
            for (let i = 0; i < 3; i++) {
              const line = new THREE.Mesh(
                new THREE.BoxGeometry(0.18, 0.018, 0.02),
                trimMat.clone()
              );
              line.rotation.z = (i * Math.PI) / 3;
              line.position.set(0, TORSO_Y + 0.04, frontZE + 0.005);
              g.add(line);
            }
            const gemSnow = new THREE.Mesh(
              new THREE.OctahedronGeometry(0.04),
              trimMat.clone()
            );
            gemSnow.position.set(0, TORSO_Y + 0.04, frontZE + 0.025);
            g.add(gemSnow);
            // Sweetheart neckline trim + waist trim
            const neckE = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + 0.06, 0.04, TORSO_D + 0.05),
              trimMat.clone()
            );
            neckE.position.set(0, TORSO_Y + TORSO_H / 2 - 0.02, 0);
            g.add(neckE);
            const waistE = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + 0.06, 0.05, TORSO_D + 0.05),
              trimMat.clone()
            );
            waistE.position.set(0, TORSO_Y - TORSO_H / 2 + 0.04, 0);
            g.add(waistE);
            // Puffy sleeves
            [-1, 1].forEach((sx) => {
              const puff = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 18, 14),
                fabricMat.clone()
              );
              puff.scale.set(1, 0.75, 1);
              puff.position.set(sx * ARM_X, ARM_Y + ARM_H / 2 - 0.04, 0);
              g.add(puff);
            });
            break;
          }

          if (kind === 'ariel_top') {
            // Two purple seashell cups on the bare chest — no torso cover.
            const shellMat = new THREE.MeshStandardMaterial({
              color,
              roughness: 0.4,
              metalness: 0.2,
            });
            const ridgeMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#fbcfe8'),
            });
            [-1, 1].forEach((sx) => {
              const shell = new THREE.Mesh(
                new THREE.SphereGeometry(
                  0.14, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2
                ),
                shellMat.clone()
              );
              shell.scale.set(1, 0.75, 1);
              shell.position.set(sx * 0.16, TORSO_Y + 0.16, TORSO_D / 2 + 0.04);
              shell.rotation.x = -Math.PI / 3;
              g.add(shell);
              for (let i = -2; i <= 2; i++) {
                const ang = i * 0.25;
                const ridge = new THREE.Mesh(
                  new THREE.BoxGeometry(0.008, 0.13, 0.008),
                  ridgeMat.clone()
                );
                ridge.rotation.z = ang;
                ridge.position.set(
                  sx * 0.16 + Math.sin(ang) * 0.04,
                  TORSO_Y + 0.18,
                  TORSO_D / 2 + 0.08
                );
                g.add(ridge);
              }
            });
            break;
          }

          if (kind === 'rapunzel_top') {
            // Purple corset bodice with white blouse panel and criss-cross
            // lacing on the chest, puffy white shoulders.
            const fabricMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
            const trimColor = accent ?? new THREE.Color('#f9a8d4');
            const trimMat = new THREE.MeshStandardMaterial({ color: trimColor });
            const laceMat = new THREE.MeshStandardMaterial({ color: '#ffffff' });
            const bodice = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + 0.04, TORSO_H + 0.04, TORSO_D + 0.04),
              fabricMat
            );
            bodice.position.set(0, TORSO_Y, 0);
            g.add(bodice);
            const frontZR = (TORSO_D + 0.04) / 2;
            // White blouse panel under the corset front
            const blouse = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W * 0.55, TORSO_H * 0.45, 0.03),
              laceMat
            );
            blouse.position.set(0, TORSO_Y + 0.1, frontZR + 0.005);
            g.add(blouse);
            // Criss-cross lacing
            for (let i = 0; i < 4; i++) {
              const y = TORSO_Y + 0.18 - i * 0.08;
              const l1 = new THREE.Mesh(
                new THREE.BoxGeometry(0.16, 0.015, 0.02),
                trimMat.clone()
              );
              l1.rotation.z = 0.4;
              l1.position.set(0, y, frontZR + 0.025);
              g.add(l1);
              const l2 = new THREE.Mesh(
                new THREE.BoxGeometry(0.16, 0.015, 0.02),
                trimMat.clone()
              );
              l2.rotation.z = -0.4;
              l2.position.set(0, y, frontZR + 0.025);
              g.add(l2);
            }
            // Puffy white shoulders
            [-1, 1].forEach((sx) => {
              const puff = new THREE.Mesh(
                new THREE.SphereGeometry(0.16, 14, 10),
                laceMat.clone()
              );
              puff.scale.set(1, 0.55, 1);
              puff.position.set(sx * ARM_X, ARM_Y + ARM_H / 2 - 0.02, 0);
              g.add(puff);
            });
            break;
          }

          if (kind === 'princess_dress') {
            // Fitted gown bodice with metallic trim along neckline and
            // waist, plus puffy short cap sleeves at each shoulder.
            const fabricMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
            const trimColor = accent ?? new THREE.Color('#fde68a');
            const trimMat = new THREE.MeshStandardMaterial({
              color: trimColor,
              metalness: 0.5,
              roughness: 0.3,
            });

            const bodice = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + 0.04, TORSO_H + 0.04, TORSO_D + 0.04),
              fabricMat
            );
            bodice.position.set(0, TORSO_Y, 0);
            g.add(bodice);

            // Sweetheart neckline trim
            const neckTrim = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + 0.06, 0.05, TORSO_D + 0.05),
              trimMat.clone()
            );
            neckTrim.position.set(0, TORSO_Y + TORSO_H / 2 - 0.02, 0);
            g.add(neckTrim);
            // Waist sash trim
            const waistTrim = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + 0.06, 0.06, TORSO_D + 0.05),
              trimMat.clone()
            );
            waistTrim.position.set(0, TORSO_Y - TORSO_H / 2 + 0.04, 0);
            g.add(waistTrim);

            // Front V-decoration on bodice
            const vDecor = new THREE.Mesh(
              new THREE.ConeGeometry(0.07, 0.18, 3),
              trimMat.clone()
            );
            vDecor.rotation.x = Math.PI;
            vDecor.rotation.y = Math.PI / 6;
            vDecor.position.set(0, TORSO_Y, (TORSO_D + 0.04) / 2 + 0.025);
            g.add(vDecor);

            // Puffy cap sleeves at each shoulder
            [-1, 1].forEach((sx) => {
              const puff = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 18, 14),
                fabricMat.clone()
              );
              puff.scale.set(1, 0.75, 1);
              puff.position.set(sx * ARM_X, ARM_Y + ARM_H / 2 - 0.04, 0);
              g.add(puff);
            });

            break;
          }

          const isPuffy =
            kind === 'spacesuit' ||
            kind === 'sweater' ||
            kind === 'raincoat' ||
            kind === 'ironman' ||
            kind === 'hulk' ||
            kind === 'thor' ||
            kind === 'war_machine' ||
            kind === 'venom' ||
            kind === 'snorlax_suit';
          const fullSleeve =
            kind === 'hoodie' ||
            kind === 'sweater' ||
            kind === 'raincoat' ||
            kind === 'spacesuit' ||
            kind === 'ironman' ||
            kind === 'spiderman' ||
            kind === 'hulk' ||
            kind === 'batman' ||
            kind === 'captain_america' ||
            kind === 'thor' ||
            kind === 'superman' ||
            kind === 'flash' ||
            kind === 'panther' ||
            kind === 'slp' ||
            kind === 'slp_girl' ||
            kind === 'wolverine' ||
            kind === 'dr_strange' ||
            kind === 'starlord' ||
            kind === 'antman' ||
            kind === 'war_machine' ||
            kind === 'vision' ||
            kind === 'daredevil' ||
            kind === 'hawkeye' ||
            kind === 'falcon' ||
            kind === 'venom' ||
            kind === 'ghost_rider' ||
            kind === 'silver_surfer' ||
            kind === 'snorlax_suit' ||
            kind === 'gengar_suit';
          const padW = isPuffy ? 0.12 : 0.06;
          const padH = isPuffy ? 0.08 : 0.05;
          const padD = isPuffy ? 0.10 : 0.05;

          const torsoMesh = new THREE.Mesh(
            new THREE.BoxGeometry(TORSO_W + padW, TORSO_H + padH, TORSO_D + padD),
            new THREE.MeshStandardMaterial({ color })
          );
          torsoMesh.position.set(0, TORSO_Y, 0);
          g.add(torsoMesh);

          const sleeveLen = fullSleeve ? ARM_H + 0.04 : ARM_H * 0.5;
          const sleeveY = fullSleeve ? ARM_Y - 0.02 : ARM_Y + ARM_H * 0.25;
          const sleeveExtra = isPuffy ? 0.08 : 0.04;
          [-1, 1].forEach((sx) => {
            const sleeve = new THREE.Mesh(
              new THREE.BoxGeometry(ARM_W + sleeveExtra, sleeveLen, ARM_W + sleeveExtra),
              new THREE.MeshStandardMaterial({ color })
            );
            sleeve.position.set(sx * ARM_X, sleeveY, 0);
            g.add(sleeve);
          });

          const frontZ = (TORSO_D + padD) / 2;
          const backZ = -(TORSO_D + padD) / 2;
          const topY = TORSO_Y + (TORSO_H + padH) / 2;

          if (kind === 'hoodie') {
            const hood = new THREE.Mesh(
              new THREE.BoxGeometry(HEAD_SIZE + 0.22, HEAD_SIZE * 0.78, HEAD_SIZE * 0.55),
              new THREE.MeshStandardMaterial({ color })
            );
            hood.position.set(0, topY + HEAD_SIZE * 0.35, backZ + HEAD_SIZE * 0.2);
            g.add(hood);
            if (accent) {
              const pocket = new THREE.Mesh(
                new THREE.BoxGeometry(TORSO_W * 0.7, 0.22, 0.05),
                new THREE.MeshStandardMaterial({ color: accent })
              );
              pocket.position.set(0, TORSO_Y - 0.12, frontZ + 0.025);
              g.add(pocket);
            }
            const stringMat = new THREE.MeshStandardMaterial({ color: '#ffffff' });
            [-1, 1].forEach((sx) => {
              const ds = new THREE.Mesh(
                new THREE.CylinderGeometry(0.014, 0.014, 0.24, 6),
                stringMat.clone()
              );
              ds.position.set(sx * 0.07, topY - 0.08, frontZ + 0.04);
              g.add(ds);
            });
          } else if (kind === 'raincoat') {
            const coatMat = new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.05 });
            torsoMesh.material = coatMat;
            const hood = new THREE.Mesh(
              new THREE.BoxGeometry(HEAD_SIZE + 0.26, HEAD_SIZE * 0.85, HEAD_SIZE * 0.6),
              coatMat.clone()
            );
            hood.position.set(0, topY + HEAD_SIZE * 0.38, backZ + HEAD_SIZE * 0.2);
            g.add(hood);
            const skirt = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + padW + 0.08, 0.42, TORSO_D + padD + 0.08),
              coatMat.clone()
            );
            skirt.position.set(0, TORSO_Y - TORSO_H / 2 - 0.12, 0);
            g.add(skirt);
            if (accent) {
              const btnMat = new THREE.MeshStandardMaterial({ color: accent });
              for (let i = 0; i < 3; i++) {
                const b = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), btnMat.clone());
                b.position.set(0, TORSO_Y + 0.2 - i * 0.2, frontZ + 0.04);
                g.add(b);
              }
            }
          } else if (kind === 'spacesuit') {
            const ringMat = new THREE.MeshStandardMaterial({
              color: '#f1f5f9',
              metalness: 0.7,
              roughness: 0.25,
            });
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 12, 24), ringMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.set(0, topY + 0.04, 0);
            g.add(ring);
            const panel = new THREE.Mesh(
              new THREE.BoxGeometry(0.36, 0.24, 0.05),
              new THREE.MeshStandardMaterial({ color: '#1f2937' })
            );
            panel.position.set(0, TORSO_Y + 0.04, frontZ + 0.03);
            g.add(panel);
            const lights: [string, number][] = [
              ['#22c55e', -0.1],
              ['#ef4444', 0],
              [accent ? `#${new THREE.Color(accent).getHexString()}` : '#3b82f6', 0.1],
            ];
            lights.forEach(([c, x]) => {
              const lmat = new THREE.MeshStandardMaterial({
                color: c,
                emissive: c,
                emissiveIntensity: 0.9,
              });
              const l = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), lmat);
              l.position.set(x, TORSO_Y + 0.06, frontZ + 0.06);
              g.add(l);
            });
            [-1, 1].forEach((sx) => {
              const pad = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2),
                new THREE.MeshStandardMaterial({ color: '#f1f5f9' })
              );
              pad.position.set(sx * (TORSO_W / 2 + 0.04), topY - 0.06, 0);
              g.add(pad);
            });
            const hose = new THREE.Mesh(
              new THREE.CylinderGeometry(0.025, 0.025, 0.32, 8),
              new THREE.MeshStandardMaterial({ color: '#475569' })
            );
            hose.rotation.x = 0.3;
            hose.position.set(0.18, TORSO_Y + 0.22, frontZ + 0.02);
            g.add(hose);
          } else if (kind === 'striped') {
            const stripeColor = accent ? new THREE.Color(accent) : new THREE.Color('#ffffff');
            [-0.2, -0.02, 0.16].forEach((y) => {
              const s = new THREE.Mesh(
                new THREE.BoxGeometry(TORSO_W + padW + 0.02, 0.07, TORSO_D + padD + 0.02),
                new THREE.MeshStandardMaterial({ color: stripeColor })
              );
              s.position.set(0, TORSO_Y + y, 0);
              g.add(s);
            });
          } else if (kind === 'dino') {
            const spikeColor = accent ? new THREE.Color(accent) : color;
            const spikeMat = new THREE.MeshStandardMaterial({ color: spikeColor });
            for (let i = 0; i < 4; i++) {
              const sp = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), spikeMat.clone());
              sp.rotation.x = -Math.PI / 2;
              sp.position.set(0, TORSO_Y + 0.22 - i * 0.15, backZ - 0.12);
              g.add(sp);
            }
            const bellyMat = new THREE.MeshStandardMaterial({ color: spikeColor });
            const belly = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W * 0.55, TORSO_H * 0.55, 0.04),
              bellyMat
            );
            belly.position.set(0, TORSO_Y - 0.04, frontZ + 0.02);
            g.add(belly);
          } else if (kind === 'sweater') {
            const collar = new THREE.Mesh(
              new THREE.CylinderGeometry(0.26, 0.26, 0.24, 18),
              new THREE.MeshStandardMaterial({ color })
            );
            collar.position.set(0, topY + 0.08, 0);
            g.add(collar);
            if (accent) {
              const knitMat = new THREE.MeshStandardMaterial({ color: accent });
              for (let i = -2; i <= 2; i++) {
                const v = new THREE.Mesh(
                  new THREE.BoxGeometry(0.025, TORSO_H * 0.7, 0.02),
                  knitMat.clone()
                );
                v.position.set(i * 0.13, TORSO_Y, frontZ + 0.02);
                g.add(v);
              }
              [-1, 1].forEach((sx) => {
                const cuff = new THREE.Mesh(
                  new THREE.BoxGeometry(ARM_W + 0.1, 0.09, ARM_W + 0.1),
                  knitMat.clone()
                );
                cuff.position.set(sx * ARM_X, ARM_Y - ARM_H + 0.04, 0);
                g.add(cuff);
              });
              const hem = new THREE.Mesh(
                new THREE.BoxGeometry(TORSO_W + padW + 0.02, 0.09, TORSO_D + padD + 0.02),
                new THREE.MeshStandardMaterial({ color: accent })
              );
              hem.position.set(0, TORSO_Y - TORSO_H / 2, 0);
              g.add(hem);
            }
          } else if (kind === 'star') {
            const starColor = accent ? new THREE.Color(accent) : new THREE.Color('#fde047');
            const starMat = new THREE.MeshStandardMaterial({
              color: starColor,
              emissive: starColor,
              emissiveIntensity: 0.35,
            });
            const shape = new THREE.Shape();
            const outer = 0.18;
            const inner = 0.075;
            for (let i = 0; i < 10; i++) {
              const r = i % 2 === 0 ? outer : inner;
              const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
              const px = Math.cos(a) * r;
              const py = Math.sin(a) * r;
              if (i === 0) shape.moveTo(px, py);
              else shape.lineTo(px, py);
            }
            shape.closePath();
            const star = new THREE.Mesh(
              new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false }),
              starMat
            );
            star.position.set(0, TORSO_Y + 0.05, frontZ + 0.005);
            g.add(star);
          } else if (kind === 'ironman') {
            // Pure diffuse (metalness 0) so the surface stays full-color
            // from every angle. A small self-emissive lifts the deepest
            // shaded side off black; roughness 0.55 keeps a hint of
            // natural highlight without the metallic darkness.
            const armorMat = new THREE.MeshStandardMaterial({
              color,
              metalness: 0,
              roughness: 0.55,
              emissive: new THREE.Color(color.getHex()).multiplyScalar(0.02),
            });
            (torsoMesh as THREE.Mesh).material = armorMat;
            const goldColor = accent ?? new THREE.Color('#fbbf24');
            const goldMat = new THREE.MeshStandardMaterial({
              color: goldColor,
              metalness: 0,
              roughness: 0.5,
              emissive: new THREE.Color(goldColor.getHex()).multiplyScalar(0.025),
            });
            // Override the default red sleeves with armored sections:
            // upper arm red, gold forearm, red glove. The base sleeve loop
            // above already added red boxes at the arm positions; we layer
            // gold forearm + red glove on top.
            [-1, 1].forEach((sx) => {
              // Gold forearm (lower half) overlays the bottom of the sleeve
              const forearm = new THREE.Mesh(
                new THREE.BoxGeometry(ARM_W + 0.09, ARM_H * 0.45, ARM_W + 0.09),
                goldMat.clone()
              );
              forearm.position.set(sx * ARM_X, ARM_Y - ARM_H * 0.25, 0);
              g.add(forearm);
              // Red armored glove
              const glove = new THREE.Mesh(
                new THREE.BoxGeometry(ARM_W * 1.25, ARM_W * 1.2, ARM_W * 1.25),
                armorMat.clone()
              );
              glove.position.set(sx * ARM_X, ARM_Y - ARM_H / 2 - 0.04, 0);
              g.add(glove);
              // Tiny palm repulsor glow
              const palmGlow = new THREE.Mesh(
                new THREE.CircleGeometry(0.04, 16),
                new THREE.MeshStandardMaterial({
                  color: '#a5f3fc',
                  emissive: '#22d3ee',
                  emissiveIntensity: 1.2,
                })
              );
              palmGlow.rotation.y = sx * Math.PI / 2;
              palmGlow.position.set(
                sx * (ARM_X + ARM_W * 0.62),
                ARM_Y - ARM_H / 2 - 0.04,
                0
              );
              g.add(palmGlow);
              // Gold shoulder cap
              const cap = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2),
                goldMat.clone()
              );
              cap.position.set(sx * (TORSO_W / 2 + 0.04), topY - 0.02, 0);
              g.add(cap);
            });
            // Gold abdominal plate (visible mid-section like Mark III)
            const abs = new THREE.Mesh(
              new THREE.BoxGeometry(0.28, 0.22, 0.05),
              goldMat.clone()
            );
            abs.position.set(0, TORSO_Y - 0.18, frontZ + 0.03);
            g.add(abs);
            // Subtle muscle lines on the gold abs (3 ridges)
            const ridgeMat = new THREE.MeshStandardMaterial({
              color: '#92400e',
              metalness: 0,
              roughness: 0.7,
            });
            for (let i = 0; i < 2; i++) {
              const ridge = new THREE.Mesh(
                new THREE.BoxGeometry(0.28, 0.012, 0.01),
                ridgeMat.clone()
              );
              ridge.position.set(0, TORSO_Y - 0.12 - i * 0.07, frontZ + 0.06);
              g.add(ridge);
            }
            // Gold neck collar
            const collar = new THREE.Mesh(
              new THREE.CylinderGeometry(0.22, 0.26, 0.1, 18, 1, true),
              goldMat.clone()
            );
            collar.position.set(0, topY + 0.04, 0);
            g.add(collar);
            // Larger Mark III arc reactor with white-hot core
            const reactorOuter = new THREE.Mesh(
              new THREE.TorusGeometry(0.15, 0.035, 14, 32),
              goldMat.clone()
            );
            reactorOuter.position.set(0, TORSO_Y + 0.04, frontZ + 0.04);
            g.add(reactorOuter);
            const reactorRing = new THREE.Mesh(
              new THREE.TorusGeometry(0.11, 0.018, 12, 24),
              new THREE.MeshStandardMaterial({
                color: '#ffffff',
                emissive: '#a5f3fc',
                emissiveIntensity: 0.8,
                metalness: 0.4,
                roughness: 0.2,
              })
            );
            reactorRing.position.set(0, TORSO_Y + 0.04, frontZ + 0.055);
            g.add(reactorRing);
            const reactorCore = new THREE.Mesh(
              new THREE.CircleGeometry(0.095, 28),
              new THREE.MeshStandardMaterial({
                color: '#ffffff',
                emissive: '#bae6fd',
                emissiveIntensity: 1.8,
              })
            );
            reactorCore.position.set(0, TORSO_Y + 0.04, frontZ + 0.06);
            g.add(reactorCore);
            // Soft cyan rim light point source so the reactor self-glows
            // even when the camera is behind the character's shoulder.
            const reactorLight = new THREE.PointLight('#22d3ee', 0.8, 1.0);
            reactorLight.position.set(0, TORSO_Y + 0.04, frontZ + 0.12);
            g.add(reactorLight);
            // Gold belt
            const belt = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + padW + 0.04, 0.07, TORSO_D + padD + 0.04),
              goldMat.clone()
            );
            belt.position.set(0, TORSO_Y - TORSO_H / 2 + 0.04, 0);
            g.add(belt);
          } else if (kind === 'robot') {
            // Chrome chassis: replace the cloth torso material with metallic.
            const chromeMat = new THREE.MeshStandardMaterial({
              color,
              metalness: 0.75,
              roughness: 0.25,
            });
            torsoMesh.material = chromeMat;
            // Black chest LED panel
            const panel = new THREE.Mesh(
              new THREE.BoxGeometry(0.42, 0.26, 0.04),
              new THREE.MeshStandardMaterial({ color: '#0f172a' })
            );
            panel.position.set(0, TORSO_Y + 0.05, frontZ + 0.025);
            g.add(panel);
            // Three blinking-style LEDs across the panel
            const ledColors = [
              accent ? `#${new THREE.Color(accent).getHexString()}` : '#22d3ee',
              '#fde047',
              '#ef4444',
            ];
            ledColors.forEach((cc, i) => {
              const lmat = new THREE.MeshStandardMaterial({
                color: cc,
                emissive: cc,
                emissiveIntensity: 0.95,
              });
              const l = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 10), lmat);
              l.position.set(-0.12 + i * 0.12, TORSO_Y + 0.05, frontZ + 0.06);
              g.add(l);
            });
            // Shoulder bolts
            [-1, 1].forEach((sx) => {
              const bolt = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 0.05, 12),
                new THREE.MeshStandardMaterial({
                  color: '#475569',
                  metalness: 0.85,
                  roughness: 0.2,
                })
              );
              bolt.rotation.z = Math.PI / 2;
              bolt.position.set(sx * (TORSO_W / 2 + padW / 2 + 0.01), topY - 0.08, 0);
              g.add(bolt);
            });
            // Vent grille along the waist
            const ventMat = new THREE.MeshStandardMaterial({ color: '#1e293b' });
            for (let i = 0; i < 3; i++) {
              const v = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.025, 0.02), ventMat.clone());
              v.position.set(0, TORSO_Y - 0.2 - i * 0.06, frontZ + 0.025);
              g.add(v);
            }
          } else if (kind === 'spiderman') {
            // Red suit torso (base color) + black spider emblem + web lines
            // + a blue waist band. Sleeves stay red from the base loop.
            const webMat = new THREE.MeshStandardMaterial({ color: '#10101e' });
            // Spider body on chest
            const body = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), webMat);
            body.scale.set(1, 1.5, 0.5);
            body.position.set(0, TORSO_Y + 0.08, frontZ + 0.02);
            g.add(body);
            // 8 spider legs (4 per side, thin angled boxes)
            [-1, 1].forEach((sx) => {
              [0.06, -0.02, -0.1, -0.18].forEach((dy, i) => {
                const legSp = new THREE.Mesh(
                  new THREE.BoxGeometry(0.13, 0.012, 0.012),
                  webMat.clone()
                );
                legSp.position.set(sx * 0.08, TORSO_Y + 0.08 + dy, frontZ + 0.02);
                legSp.rotation.z = sx * (0.5 - i * 0.18);
                g.add(legSp);
              });
            });
            // Vertical web lines on the torso
            [-0.22, -0.075, 0.075, 0.22].forEach((x) => {
              const line = new THREE.Mesh(
                new THREE.BoxGeometry(0.01, TORSO_H + padH - 0.04, 0.01),
                webMat.clone()
              );
              line.position.set(x, TORSO_Y, frontZ + 0.005);
              g.add(line);
            });
            // Horizontal web lines
            [0.2, 0.06, -0.08, -0.22].forEach((y) => {
              const line = new THREE.Mesh(
                new THREE.BoxGeometry(TORSO_W + padW - 0.04, 0.01, 0.01),
                webMat.clone()
              );
              line.position.set(0, TORSO_Y + y, frontZ + 0.005);
              g.add(line);
            });
            // Blue waist band
            const blueMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#1e3a8a'),
            });
            const band = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + padW + 0.01, 0.12, TORSO_D + padD + 0.01),
              blueMat
            );
            band.position.set(0, TORSO_Y - TORSO_H / 2 + 0.02, 0);
            g.add(band);
          } else if (kind === 'hulk') {
            // Bare muscular green chest: recolor the torso green and add
            // pecs, ab lines and bicep bulges. Sleeves are green from the
            // base loop; big fists cap the arms.
            const skinMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
            torsoMesh.material = skinMat;
            const shadeMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#3f6212'),
            });
            // Pecs
            [-1, 1].forEach((sx) => {
              const pec = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 14, 12),
                skinMat.clone()
              );
              pec.scale.set(1, 0.65, 0.5);
              pec.position.set(sx * 0.16, TORSO_Y + 0.16, frontZ - 0.02);
              g.add(pec);
            });
            // Center chest/ab line
            const midLine = new THREE.Mesh(
              new THREE.BoxGeometry(0.02, TORSO_H * 0.7, 0.02),
              shadeMat.clone()
            );
            midLine.position.set(0, TORSO_Y - 0.02, frontZ + 0.005);
            g.add(midLine);
            // Ab cross lines
            [-0.05, -0.16].forEach((y) => {
              const ab = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.02, 0.02),
                shadeMat.clone()
              );
              ab.position.set(0, TORSO_Y + y, frontZ + 0.005);
              g.add(ab);
            });
            // Bicep bulges + fists on each arm
            [-1, 1].forEach((sx) => {
              const bicep = new THREE.Mesh(
                new THREE.SphereGeometry(0.17, 12, 10),
                skinMat.clone()
              );
              bicep.scale.set(1, 1.1, 1);
              bicep.position.set(sx * ARM_X, ARM_Y + 0.06, 0);
              g.add(bicep);
              const fist = new THREE.Mesh(
                new THREE.BoxGeometry(ARM_W * 1.5, ARM_W * 1.5, ARM_W * 1.5),
                skinMat.clone()
              );
              fist.position.set(sx * ARM_X, ARM_Y - ARM_H / 2 - 0.05, 0);
              g.add(fist);
            });
          } else if (kind === 'batman') {
            // Big yellow oval bat emblem on the chest
            const yellowMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#fbbf24'),
              metalness: 0.2,
              roughness: 0.45,
            });
            const oval = new THREE.Mesh(
              new THREE.CylinderGeometry(0.18, 0.18, 0.03, 24),
              yellowMat
            );
            oval.rotation.x = Math.PI / 2;
            oval.scale.set(1, 1, 0.65);
            oval.position.set(0, TORSO_Y + 0.06, frontZ + 0.015);
            g.add(oval);
            // Black bat silhouette (body + 4 wing segments)
            const batMat = new THREE.MeshStandardMaterial({ color: '#0a0a0a' });
            const batBody = new THREE.Mesh(
              new THREE.BoxGeometry(0.05, 0.1, 0.02),
              batMat.clone()
            );
            batBody.position.set(0, TORSO_Y + 0.06, frontZ + 0.04);
            g.add(batBody);
            [-1, 1].forEach((sx) => {
              [0.03, -0.03].forEach((dy, i) => {
                const w = new THREE.Mesh(
                  new THREE.BoxGeometry(0.12 - i * 0.04, 0.04, 0.02),
                  batMat.clone()
                );
                w.position.set(sx * (0.06 + i * 0.04), TORSO_Y + 0.06 + dy, frontZ + 0.04);
                w.rotation.z = sx * (0.15 - i * 0.3);
                g.add(w);
              });
            });
          } else if (kind === 'captain_america') {
            // White star on the chest + red/white horizontal belly stripes
            const whiteMat = new THREE.MeshStandardMaterial({ color: '#f8fafc' });
            const redMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#dc2626'),
            });
            const starShape = new THREE.Shape();
            const oR = 0.13;
            const iR = 0.055;
            for (let i = 0; i < 10; i++) {
              const r = i % 2 === 0 ? oR : iR;
              const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
              const px = Math.cos(a) * r;
              const py = Math.sin(a) * r;
              if (i === 0) starShape.moveTo(px, py);
              else starShape.lineTo(px, py);
            }
            starShape.closePath();
            const star = new THREE.Mesh(
              new THREE.ExtrudeGeometry(starShape, { depth: 0.03, bevelEnabled: false }),
              whiteMat
            );
            star.position.set(0, TORSO_Y + 0.1, frontZ + 0.005);
            g.add(star);
            // Red/white horizontal stripes on lower torso
            const stripeH = 0.04;
            const stripeColors = [redMat, whiteMat, redMat, whiteMat, redMat];
            stripeColors.forEach((m, i) => {
              const stripe = new THREE.Mesh(
                new THREE.BoxGeometry(TORSO_W + padW + 0.01, stripeH, TORSO_D + padD + 0.01),
                m.clone()
              );
              stripe.position.set(0, TORSO_Y - 0.08 - i * (stripeH + 0.005), 0);
              g.add(stripe);
            });
            // Brown belt
            const beltC = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + padW + 0.04, 0.06, TORSO_D + padD + 0.04),
              new THREE.MeshStandardMaterial({ color: '#7c2d12' })
            );
            beltC.position.set(0, TORSO_Y - TORSO_H / 2 + 0.02, 0);
            g.add(beltC);
          } else if (kind === 'thor') {
            // Layered chestplate with 6 metal discs + leather strap
            const armorMat = new THREE.MeshStandardMaterial({
              color,
              metalness: 0.5,
              roughness: 0.4,
            });
            torsoMesh.material = armorMat;
            const discMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#cbd5e1'),
              metalness: 0.7,
              roughness: 0.25,
            });
            const positions = [
              [-0.18, 0.16], [0.18, 0.16],
              [-0.18, 0.0], [0.18, 0.0],
              [-0.18, -0.16], [0.18, -0.16],
            ];
            positions.forEach(([dx, dy]) => {
              const disc = new THREE.Mesh(
                new THREE.CylinderGeometry(0.07, 0.07, 0.025, 16),
                discMat.clone()
              );
              disc.rotation.x = Math.PI / 2;
              disc.position.set(dx, TORSO_Y + dy, frontZ + 0.015);
              g.add(disc);
            });
            // Diagonal leather strap across chest
            const strap = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W * 1.3, 0.08, 0.03),
              new THREE.MeshStandardMaterial({ color: '#3f3f1a' })
            );
            strap.rotation.z = 0.45;
            strap.position.set(0, TORSO_Y + 0.08, frontZ + 0.04);
            g.add(strap);
          } else if (kind === 'superman') {
            // Diamond yellow shield with red 'S' on the chest
            const yellowMat = new THREE.MeshStandardMaterial({
              color: '#fde047',
              metalness: 0.15,
              roughness: 0.5,
            });
            const redMat2 = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#dc2626'),
            });
            const diamond = new THREE.Shape();
            diamond.moveTo(0, 0.2);
            diamond.lineTo(0.18, 0);
            diamond.lineTo(0, -0.2);
            diamond.lineTo(-0.18, 0);
            diamond.closePath();
            const shield = new THREE.Mesh(
              new THREE.ExtrudeGeometry(diamond, { depth: 0.03, bevelEnabled: false }),
              yellowMat
            );
            shield.position.set(0, TORSO_Y + 0.05, frontZ + 0.005);
            g.add(shield);
            // Red S (approximated by two curved boxes)
            const sTop = new THREE.Mesh(
              new THREE.BoxGeometry(0.12, 0.04, 0.04),
              redMat2.clone()
            );
            sTop.position.set(-0.01, TORSO_Y + 0.12, frontZ + 0.04);
            sTop.rotation.z = 0.15;
            g.add(sTop);
            const sMid = new THREE.Mesh(
              new THREE.BoxGeometry(0.1, 0.04, 0.04),
              redMat2.clone()
            );
            sMid.position.set(0, TORSO_Y + 0.05, frontZ + 0.04);
            g.add(sMid);
            const sBot = new THREE.Mesh(
              new THREE.BoxGeometry(0.12, 0.04, 0.04),
              redMat2.clone()
            );
            sBot.position.set(0.01, TORSO_Y - 0.02, frontZ + 0.04);
            sBot.rotation.z = 0.15;
            g.add(sBot);
            const sLeft = new THREE.Mesh(
              new THREE.BoxGeometry(0.04, 0.1, 0.04),
              redMat2.clone()
            );
            sLeft.position.set(-0.05, TORSO_Y + 0.09, frontZ + 0.04);
            g.add(sLeft);
            const sRight = new THREE.Mesh(
              new THREE.BoxGeometry(0.04, 0.1, 0.04),
              redMat2.clone()
            );
            sRight.position.set(0.05, TORSO_Y + 0.01, frontZ + 0.04);
            g.add(sRight);
            // Yellow belt
            const belt2 = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + padW + 0.04, 0.06, TORSO_D + padD + 0.04),
              yellowMat.clone()
            );
            belt2.position.set(0, TORSO_Y - TORSO_H / 2 + 0.02, 0);
            g.add(belt2);
          } else if (kind === 'flash') {
            // White chest disc with a gold lightning bolt
            const whiteCircle = new THREE.Mesh(
              new THREE.CylinderGeometry(0.16, 0.16, 0.025, 24),
              new THREE.MeshStandardMaterial({ color: '#f8fafc' })
            );
            whiteCircle.rotation.x = Math.PI / 2;
            whiteCircle.position.set(0, TORSO_Y + 0.08, frontZ + 0.012);
            g.add(whiteCircle);
            // Lightning bolt (two angled gold boxes)
            const boltMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#fde047'),
              emissive: accent ?? new THREE.Color('#fde047'),
              emissiveIntensity: 0.4,
            });
            const b1 = new THREE.Mesh(
              new THREE.BoxGeometry(0.05, 0.16, 0.03),
              boltMat.clone()
            );
            b1.rotation.z = -0.6;
            b1.position.set(-0.02, TORSO_Y + 0.13, frontZ + 0.04);
            g.add(b1);
            const b2 = new THREE.Mesh(
              new THREE.BoxGeometry(0.05, 0.16, 0.03),
              boltMat.clone()
            );
            b2.rotation.z = 0.6;
            b2.position.set(0.02, TORSO_Y + 0.03, frontZ + 0.04);
            g.add(b2);
          } else if (kind === 'panther') {
            // Geometric silver vibranium pattern + necklace of fangs
            const lineMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#cbd5e1'),
              metalness: 0.6,
              roughness: 0.3,
            });
            // Diagonal vibranium lines on torso
            [-0.18, -0.06, 0.06, 0.18].forEach((dx, i) => {
              const line = new THREE.Mesh(
                new THREE.BoxGeometry(0.012, TORSO_H * 0.6, 0.01),
                lineMat.clone()
              );
              line.rotation.z = (i % 2 === 0 ? 0.18 : -0.18);
              line.position.set(dx, TORSO_Y - 0.04, frontZ + 0.005);
              g.add(line);
            });
            // Necklace ring around the collar
            const necklace = new THREE.Mesh(
              new THREE.TorusGeometry(0.16, 0.018, 10, 24),
              lineMat.clone()
            );
            necklace.rotation.x = Math.PI / 2;
            necklace.position.set(0, topY - 0.02, 0);
            g.add(necklace);
            // 5 small fangs on the necklace
            for (let i = 0; i < 5; i++) {
              const a = -Math.PI / 2 + (i / 4 - 0.5) * 0.9;
              const fang = new THREE.Mesh(
                new THREE.ConeGeometry(0.022, 0.08, 4),
                lineMat.clone()
              );
              fang.rotation.x = Math.PI;
              fang.position.set(
                Math.cos(a) * 0.16,
                topY - 0.06,
                Math.sin(a + Math.PI / 2) * 0.16 + frontZ - 0.05
              );
              g.add(fang);
            }
          } else if (kind === 'slp') {
            // Gray school blazer (base torso) + white dress shirt strip
            // + red striped tie + gold buttons.
            const whiteMat = new THREE.MeshStandardMaterial({ color: '#f8fafc' });
            const tieMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#dc2626'),
              roughness: 0.5,
            });
            const navyMat = new THREE.MeshStandardMaterial({ color: '#1e3a8a' });
            const buttonMat = new THREE.MeshStandardMaterial({
              color: '#fbbf24',
              metalness: 0.6,
              roughness: 0.3,
            });

            // White shirt panel down the chest
            const shirt = new THREE.Mesh(
              new THREE.BoxGeometry(0.2, TORSO_H * 0.72, 0.04),
              whiteMat
            );
            shirt.position.set(0, TORSO_Y - 0.02, frontZ + 0.005);
            g.add(shirt);
            // Collar — angled wings at the top of the shirt
            [-1, 1].forEach((sx) => {
              const wing = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.08, 0.04),
                whiteMat.clone()
              );
              wing.rotation.z = sx * 0.4;
              wing.position.set(sx * 0.06, TORSO_Y + 0.3, frontZ + 0.012);
              g.add(wing);
            });

            // Tie knot
            const tieKnot = new THREE.Mesh(
              new THREE.BoxGeometry(0.085, 0.07, 0.04),
              tieMat
            );
            tieKnot.position.set(0, TORSO_Y + 0.25, frontZ + 0.025);
            g.add(tieKnot);
            // Tie body
            const tieBody = new THREE.Mesh(
              new THREE.BoxGeometry(0.09, 0.32, 0.035),
              tieMat.clone()
            );
            tieBody.position.set(0, TORSO_Y + 0.06, frontZ + 0.025);
            g.add(tieBody);
            // Pointed tie tip
            const tieTip = new THREE.Mesh(
              new THREE.ConeGeometry(0.06, 0.1, 4),
              tieMat.clone()
            );
            tieTip.rotation.x = Math.PI;
            tieTip.rotation.y = Math.PI / 4;
            tieTip.position.set(0, TORSO_Y - 0.14, frontZ + 0.025);
            g.add(tieTip);
            // Diagonal navy stripes on tie
            for (let i = 0; i < 4; i++) {
              const stripe = new THREE.Mesh(
                new THREE.BoxGeometry(0.115, 0.015, 0.015),
                navyMat.clone()
              );
              stripe.rotation.z = 0.5;
              stripe.position.set(0, TORSO_Y + 0.16 - i * 0.08, frontZ + 0.04);
              g.add(stripe);
            }

            // Two gold buttons on the right side of the jacket
            [-0.08, -0.18].forEach((y) => {
              const btn = new THREE.Mesh(
                new THREE.CylinderGeometry(0.025, 0.025, 0.022, 14),
                buttonMat.clone()
              );
              btn.rotation.x = Math.PI / 2;
              btn.position.set(0.14, TORSO_Y + y, frontZ + 0.005);
              g.add(btn);
            });
          } else if (kind === 'joon_cardigan') {
            // Cream knit cardigan over a bright yellow undershirt, with
            // marine patches (yellow starfish, red starfish, blue palm,
            // blue shell) on the chest, plus a brown rope belt.
            const knitMat = new THREE.MeshStandardMaterial({
              color,
              roughness: 0.95,
            });
            const yellowMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#fde047'),
              roughness: 0.6,
            });

            // Yellow undershirt strip down the chest center
            const undershirt = new THREE.Mesh(
              new THREE.BoxGeometry(0.28, TORSO_H + 0.02, 0.03),
              yellowMat
            );
            undershirt.position.set(0, TORSO_Y, frontZ + 0.005);
            g.add(undershirt);

            // Two cardigan front halves slightly opened to reveal the
            // yellow shirt down the middle.
            [-1, 1].forEach((sx) => {
              const half = new THREE.Mesh(
                new THREE.BoxGeometry(
                  (TORSO_W + 0.04) / 2,
                  TORSO_H + 0.04,
                  0.05
                ),
                knitMat.clone()
              );
              half.position.set(sx * 0.13, TORSO_Y, frontZ + 0.02);
              g.add(half);
              // Three small wooden buttons down each half (offset toward center)
              for (let i = 0; i < 3; i++) {
                const btn = new THREE.Mesh(
                  new THREE.CylinderGeometry(0.018, 0.018, 0.018, 10),
                  new THREE.MeshStandardMaterial({
                    color: '#8b5a2b',
                    roughness: 0.6,
                  })
                );
                btn.rotation.x = Math.PI / 2;
                btn.position.set(
                  sx * 0.075,
                  TORSO_Y + 0.18 - i * 0.16,
                  frontZ + 0.045
                );
                g.add(btn);
              }
            });

            // Marine motif patches on the front of the cardigan.
            const starMat = (col: string) =>
              new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 });
            // Yellow starfish (upper-left chest)
            const star1Shape = new THREE.Shape();
            for (let i = 0; i < 10; i++) {
              const r = i % 2 === 0 ? 0.06 : 0.025;
              const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
              const px = Math.cos(a) * r;
              const py = Math.sin(a) * r;
              if (i === 0) star1Shape.moveTo(px, py);
              else star1Shape.lineTo(px, py);
            }
            star1Shape.closePath();
            const star1 = new THREE.Mesh(
              new THREE.ExtrudeGeometry(star1Shape, { depth: 0.012, bevelEnabled: false }),
              starMat('#fbbf24')
            );
            star1.position.set(-0.18, TORSO_Y + 0.12, frontZ + 0.06);
            g.add(star1);

            // Red starfish (lower-left)
            const star2 = new THREE.Mesh(
              new THREE.ExtrudeGeometry(star1Shape, { depth: 0.012, bevelEnabled: false }),
              starMat('#dc2626')
            );
            star2.position.set(-0.18, TORSO_Y - 0.12, frontZ + 0.06);
            g.add(star2);

            // Blue palm leaf (right chest) — teardrop with central vein
            const palmMat = starMat('#1d4ed8');
            const palm = new THREE.Mesh(
              new THREE.SphereGeometry(0.06, 14, 10),
              palmMat
            );
            palm.scale.set(0.7, 1.4, 0.2);
            palm.rotation.z = 0.35;
            palm.position.set(0.18, TORSO_Y + 0.12, frontZ + 0.06);
            g.add(palm);
            const palmVein = new THREE.Mesh(
              new THREE.BoxGeometry(0.012, 0.13, 0.015),
              starMat('#1e3a8a')
            );
            palmVein.rotation.z = 0.35;
            palmVein.position.set(0.18, TORSO_Y + 0.12, frontZ + 0.075);
            g.add(palmVein);

            // Blue shell (lower-right) — half-sphere with radial ridges
            const shell = new THREE.Mesh(
              new THREE.SphereGeometry(0.07, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
              palmMat.clone()
            );
            shell.scale.set(1, 0.6, 0.3);
            shell.rotation.x = -Math.PI / 3;
            shell.position.set(0.18, TORSO_Y - 0.12, frontZ + 0.06);
            g.add(shell);
            for (let i = -2; i <= 2; i++) {
              const ridge = new THREE.Mesh(
                new THREE.BoxGeometry(0.005, 0.065, 0.005),
                starMat('#1e3a8a')
              );
              ridge.rotation.z = i * 0.22;
              ridge.position.set(0.18, TORSO_Y - 0.11, frontZ + 0.075);
              g.add(ridge);
            }

            // Sleeve overlays in cream knit (short sleeves capping arms)
            [-1, 1].forEach((sx) => {
              const sleeve = new THREE.Mesh(
                new THREE.BoxGeometry(ARM_W + 0.08, ARM_H * 0.55, ARM_W + 0.08),
                knitMat.clone()
              );
              sleeve.position.set(sx * ARM_X, ARM_Y + ARM_H * 0.2, 0);
              g.add(sleeve);
            });
          } else if (kind === 'slp_girl') {
            // Same gray blazer + white shirt as the boy version, but with a
            // red bow ribbon at the collar instead of a striped tie.
            const whiteMatG = new THREE.MeshStandardMaterial({ color: '#f8fafc' });
            const ribbonMatG = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#dc2626'),
              roughness: 0.5,
            });
            const buttonMatG = new THREE.MeshStandardMaterial({
              color: '#fbbf24',
              metalness: 0.6,
              roughness: 0.3,
            });
            // White shirt panel
            const shirtG = new THREE.Mesh(
              new THREE.BoxGeometry(0.2, TORSO_H * 0.72, 0.04),
              whiteMatG
            );
            shirtG.position.set(0, TORSO_Y - 0.02, frontZ + 0.005);
            g.add(shirtG);
            // Collar wings
            [-1, 1].forEach((sx) => {
              const wing = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.08, 0.04),
                whiteMatG.clone()
              );
              wing.rotation.z = sx * 0.4;
              wing.position.set(sx * 0.06, TORSO_Y + 0.3, frontZ + 0.012);
              g.add(wing);
            });
            // Red bow ribbon at the collar (center knot + 2 side loops +
            // 2 dangling tails)
            const bowCenter = new THREE.Mesh(
              new THREE.BoxGeometry(0.06, 0.06, 0.04),
              ribbonMatG
            );
            bowCenter.position.set(0, TORSO_Y + 0.24, frontZ + 0.03);
            g.add(bowCenter);
            [-1, 1].forEach((sx) => {
              const loop = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.08, 0.04),
                ribbonMatG.clone()
              );
              loop.position.set(sx * 0.08, TORSO_Y + 0.24, frontZ + 0.03);
              g.add(loop);
              const tail = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.14, 0.03),
                ribbonMatG.clone()
              );
              tail.rotation.z = sx * 0.3;
              tail.position.set(sx * 0.04, TORSO_Y + 0.12, frontZ + 0.025);
              g.add(tail);
            });
            // Two gold buttons (same as boy version)
            [-0.08, -0.18].forEach((y) => {
              const btn = new THREE.Mesh(
                new THREE.CylinderGeometry(0.025, 0.025, 0.022, 14),
                buttonMatG.clone()
              );
              btn.rotation.x = Math.PI / 2;
              btn.position.set(0.14, TORSO_Y + y, frontZ + 0.005);
              g.add(btn);
            });
          } else if (kind === 'wolverine') {
            // Yellow torso + blue V chest panel + brown belt
            const blueMat = new THREE.MeshStandardMaterial({ color: accent ?? new THREE.Color('#1e3a8a') });
            const vChest = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W * 0.6, TORSO_H * 0.5, 0.04),
              blueMat
            );
            vChest.position.set(0, TORSO_Y + 0.08, frontZ + 0.005);
            g.add(vChest);
            // Brown belt
            const belt = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + padW + 0.04, 0.08, TORSO_D + padD + 0.04),
              new THREE.MeshStandardMaterial({ color: '#7c2d12' })
            );
            belt.position.set(0, TORSO_Y - TORSO_H / 2 + 0.06, 0);
            g.add(belt);
            // Gold belt buckle 'X'
            const buckle = new THREE.Mesh(
              new THREE.BoxGeometry(0.12, 0.08, 0.04),
              new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.6 })
            );
            buckle.position.set(0, TORSO_Y - TORSO_H / 2 + 0.06, frontZ + 0.02);
            g.add(buckle);
            // Silver claws from each fist (3 per hand)
            const clawMat = new THREE.MeshStandardMaterial({
              color: '#e2e8f0', metalness: 0.85, roughness: 0.15,
            });
            [-1, 1].forEach((sx) => {
              [-0.06, 0, 0.06].forEach((dx) => {
                const claw = new THREE.Mesh(
                  new THREE.ConeGeometry(0.02, 0.32, 4),
                  clawMat.clone()
                );
                claw.position.set(sx * ARM_X + dx, ARM_Y - ARM_H / 2 - 0.22, 0.15);
                g.add(claw);
              });
            });
          } else if (kind === 'dr_strange') {
            // Blue robe with gold trim + Eye of Agamotto pendant
            const goldMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#fbbf24'),
              metalness: 0.5, roughness: 0.3,
            });
            // High collar
            const collar = new THREE.Mesh(
              new THREE.CylinderGeometry(0.26, 0.26, 0.18, 18),
              new THREE.MeshStandardMaterial({ color })
            );
            collar.position.set(0, topY + 0.06, 0);
            g.add(collar);
            // Gold sash V across chest
            const sashL = new THREE.Mesh(
              new THREE.BoxGeometry(0.34, 0.06, 0.04),
              goldMat.clone()
            );
            sashL.rotation.z = 0.45;
            sashL.position.set(-0.12, TORSO_Y + 0.08, frontZ + 0.015);
            g.add(sashL);
            const sashR = new THREE.Mesh(
              new THREE.BoxGeometry(0.34, 0.06, 0.04),
              goldMat.clone()
            );
            sashR.rotation.z = -0.45;
            sashR.position.set(0.12, TORSO_Y + 0.08, frontZ + 0.015);
            g.add(sashR);
            // Gold belt
            const drBelt = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + padW + 0.04, 0.06, TORSO_D + padD + 0.04),
              goldMat.clone()
            );
            drBelt.position.set(0, TORSO_Y - TORSO_H / 2 + 0.04, 0);
            g.add(drBelt);
            // Eye of Agamotto pendant
            const eyeCircle = new THREE.Mesh(
              new THREE.CylinderGeometry(0.07, 0.07, 0.025, 20),
              goldMat.clone()
            );
            eyeCircle.rotation.x = Math.PI / 2;
            eyeCircle.position.set(0, TORSO_Y - 0.1, frontZ + 0.025);
            g.add(eyeCircle);
            const eyeCore = new THREE.Mesh(
              new THREE.CylinderGeometry(0.04, 0.04, 0.026, 16),
              new THREE.MeshStandardMaterial({
                color: '#16a34a',
                emissive: '#22c55e',
                emissiveIntensity: 1.0,
              })
            );
            eyeCore.rotation.x = Math.PI / 2;
            eyeCore.position.set(0, TORSO_Y - 0.1, frontZ + 0.04);
            g.add(eyeCore);
          } else if (kind === 'starlord') {
            // Red leather jacket + central zipper + Guardians badge
            const trimMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#fbbf24'),
              metalness: 0.5,
            });
            // Central zipper line
            const zipper = new THREE.Mesh(
              new THREE.BoxGeometry(0.02, TORSO_H + 0.02, 0.03),
              trimMat.clone()
            );
            zipper.position.set(0, TORSO_Y, frontZ + 0.02);
            g.add(zipper);
            // Two side jacket flaps with stitching
            [-1, 1].forEach((sx) => {
              const stitch = new THREE.Mesh(
                new THREE.BoxGeometry(0.01, TORSO_H, 0.02),
                trimMat.clone()
              );
              stitch.position.set(sx * 0.18, TORSO_Y, frontZ + 0.015);
              g.add(stitch);
            });
            // Round Guardians badge
            const badge = new THREE.Mesh(
              new THREE.CylinderGeometry(0.06, 0.06, 0.025, 16),
              trimMat.clone()
            );
            badge.rotation.x = Math.PI / 2;
            badge.position.set(-0.18, TORSO_Y + 0.1, frontZ + 0.02);
            g.add(badge);
            // Brown shoulder pads
            [-1, 1].forEach((sx) => {
              const pad = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.1, 0.16),
                new THREE.MeshStandardMaterial({ color: '#3f3f1a' })
              );
              pad.position.set(sx * ARM_X, ARM_Y + ARM_H / 2 - 0.04, 0);
              g.add(pad);
            });
          } else if (kind === 'antman') {
            // Red/black segmented suit (horizontal bands)
            const blackMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#0a0a0a'),
            });
            // 3 horizontal black bands across torso
            [0.16, 0, -0.16].forEach((y) => {
              const band = new THREE.Mesh(
                new THREE.BoxGeometry(TORSO_W + padW + 0.02, 0.06, TORSO_D + padD + 0.02),
                blackMat.clone()
              );
              band.position.set(0, TORSO_Y + y, 0);
              g.add(band);
            });
            // Center silver Ant emblem dot
            const emblem = new THREE.Mesh(
              new THREE.SphereGeometry(0.05, 12, 10),
              new THREE.MeshStandardMaterial({
                color: '#cbd5e1', metalness: 0.7, roughness: 0.2,
              })
            );
            emblem.position.set(0, TORSO_Y + 0.08, frontZ + 0.03);
            g.add(emblem);
            // Black shoulder caps
            [-1, 1].forEach((sx) => {
              const cap = new THREE.Mesh(
                new THREE.SphereGeometry(0.13, 14, 10),
                blackMat.clone()
              );
              cap.scale.set(1, 0.7, 1);
              cap.position.set(sx * ARM_X, ARM_Y + ARM_H / 2 - 0.04, 0);
              g.add(cap);
            });
          } else if (kind === 'war_machine') {
            // Gray heavy armor + chest LED + shoulder armor
            const armorMat = new THREE.MeshStandardMaterial({
              color, metalness: 0.7, roughness: 0.3,
            });
            torsoMesh.material = armorMat;
            const darkMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#1e293b'),
              metalness: 0.8, roughness: 0.25,
            });
            // Chest panel
            const chestPanel = new THREE.Mesh(
              new THREE.BoxGeometry(0.38, 0.22, 0.04),
              darkMat.clone()
            );
            chestPanel.position.set(0, TORSO_Y + 0.06, frontZ + 0.015);
            g.add(chestPanel);
            // Red LED arc reactor center
            const led = new THREE.Mesh(
              new THREE.CircleGeometry(0.06, 18),
              new THREE.MeshStandardMaterial({
                color: '#fde047', emissive: '#facc15', emissiveIntensity: 1.5,
              })
            );
            led.position.set(0, TORSO_Y + 0.06, frontZ + 0.04);
            g.add(led);
            // Bulky shoulder plates
            [-1, 1].forEach((sx) => {
              const shoulder = new THREE.Mesh(
                new THREE.BoxGeometry(0.26, 0.16, 0.22),
                armorMat.clone()
              );
              shoulder.position.set(sx * ARM_X, ARM_Y + ARM_H / 2 - 0.02, 0);
              g.add(shoulder);
            });
            // Gunmetal belt
            const wmBelt = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + padW + 0.04, 0.07, TORSO_D + padD + 0.04),
              darkMat.clone()
            );
            wmBelt.position.set(0, TORSO_Y - TORSO_H / 2 + 0.04, 0);
            g.add(wmBelt);
          } else if (kind === 'vision') {
            // Green torso + yellow V harness + yellow Mind Stone center
            const yellowMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#fde047'),
              metalness: 0.4, roughness: 0.3,
              emissive: new THREE.Color('#facc15').multiplyScalar(0.15),
            });
            // Yellow V harness across chest
            const harnessL = new THREE.Mesh(
              new THREE.BoxGeometry(0.32, 0.06, 0.04),
              yellowMat.clone()
            );
            harnessL.rotation.z = 0.5;
            harnessL.position.set(-0.12, TORSO_Y + 0.12, frontZ + 0.015);
            g.add(harnessL);
            const harnessR = new THREE.Mesh(
              new THREE.BoxGeometry(0.32, 0.06, 0.04),
              yellowMat.clone()
            );
            harnessR.rotation.z = -0.5;
            harnessR.position.set(0.12, TORSO_Y + 0.12, frontZ + 0.015);
            g.add(harnessR);
            // Yellow ovaal collar
            const vCollar = new THREE.Mesh(
              new THREE.CylinderGeometry(0.22, 0.22, 0.06, 18),
              yellowMat.clone()
            );
            vCollar.position.set(0, topY + 0.02, 0);
            g.add(vCollar);
            // Yellow belt
            const vBelt = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + padW + 0.04, 0.06, TORSO_D + padD + 0.04),
              yellowMat.clone()
            );
            vBelt.position.set(0, TORSO_Y - TORSO_H / 2 + 0.04, 0);
            g.add(vBelt);
          } else if (kind === 'daredevil') {
            // Red suit + double-D emblem + black shoulder pads
            const darkMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#0a0a0a'),
            });
            // "DD" emblem — 2 round D shapes
            [-0.06, 0.06].forEach((dx) => {
              const d = new THREE.Mesh(
                new THREE.TorusGeometry(0.05, 0.018, 8, 16, Math.PI),
                darkMat.clone()
              );
              d.rotation.z = dx < 0 ? Math.PI : 0;
              d.position.set(dx, TORSO_Y + 0.1, frontZ + 0.025);
              g.add(d);
            });
            // Black shoulder pads
            [-1, 1].forEach((sx) => {
              const pad = new THREE.Mesh(
                new THREE.BoxGeometry(0.22, 0.12, 0.18),
                darkMat.clone()
              );
              pad.position.set(sx * ARM_X, ARM_Y + ARM_H / 2 - 0.02, 0);
              g.add(pad);
            });
            // Black utility belt
            const ddBelt = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + padW + 0.04, 0.07, TORSO_D + padD + 0.04),
              darkMat.clone()
            );
            ddBelt.position.set(0, TORSO_Y - TORSO_H / 2 + 0.04, 0);
            g.add(ddBelt);
          } else if (kind === 'hawkeye') {
            // Purple/dark vest + brown leather harness
            const harnessMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#1f2937'),
            });
            // Dark vest sides
            [-1, 1].forEach((sx) => {
              const panel = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, TORSO_H, 0.04),
                harnessMat.clone()
              );
              panel.position.set(sx * 0.2, TORSO_Y, frontZ + 0.01);
              g.add(panel);
            });
            // Diagonal leather strap (for quiver)
            const strap = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W * 1.3, 0.06, 0.04),
              new THREE.MeshStandardMaterial({ color: '#7c2d12' })
            );
            strap.rotation.z = -0.5;
            strap.position.set(0, TORSO_Y + 0.06, frontZ + 0.025);
            g.add(strap);
            // Arrow emblem on chest
            const arrowMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.6 });
            const arrowShaft = new THREE.Mesh(
              new THREE.BoxGeometry(0.025, 0.16, 0.025),
              arrowMat
            );
            arrowShaft.position.set(0, TORSO_Y + 0.04, frontZ + 0.025);
            g.add(arrowShaft);
            const arrowHead = new THREE.Mesh(
              new THREE.ConeGeometry(0.04, 0.08, 4),
              arrowMat.clone()
            );
            arrowHead.position.set(0, TORSO_Y + 0.16, frontZ + 0.025);
            g.add(arrowHead);
          } else if (kind === 'falcon') {
            // Red tactical suit + tech harness + Falcon emblem
            const techMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#fbbf24'),
              metalness: 0.5,
            });
            // Horizontal tactical band across chest
            const tac = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + padW + 0.02, 0.08, TORSO_D + padD + 0.02),
              new THREE.MeshStandardMaterial({ color: '#1f2937' })
            );
            tac.position.set(0, TORSO_Y + 0.1, 0);
            g.add(tac);
            // Falcon emblem (bird outline)
            const birdL = new THREE.Mesh(
              new THREE.BoxGeometry(0.12, 0.03, 0.03),
              techMat.clone()
            );
            birdL.rotation.z = 0.6;
            birdL.position.set(-0.06, TORSO_Y - 0.04, frontZ + 0.02);
            g.add(birdL);
            const birdR = new THREE.Mesh(
              new THREE.BoxGeometry(0.12, 0.03, 0.03),
              techMat.clone()
            );
            birdR.rotation.z = -0.6;
            birdR.position.set(0.06, TORSO_Y - 0.04, frontZ + 0.02);
            g.add(birdR);
            // Tactical belt
            const fBelt = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + padW + 0.04, 0.06, TORSO_D + padD + 0.04),
              new THREE.MeshStandardMaterial({ color: '#1f2937' })
            );
            fBelt.position.set(0, TORSO_Y - TORSO_H / 2 + 0.04, 0);
            g.add(fBelt);
          } else if (kind === 'venom') {
            // Black symbiote + white spider symbol (inverted Spider-Man)
            const whiteMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#f8fafc'),
              emissive: '#e2e8f0', emissiveIntensity: 0.15,
            });
            // Big white spider body on chest
            const vBody = new THREE.Mesh(
              new THREE.SphereGeometry(0.07, 12, 10),
              whiteMat.clone()
            );
            vBody.scale.set(1, 1.5, 0.5);
            vBody.position.set(0, TORSO_Y + 0.04, frontZ + 0.02);
            g.add(vBody);
            // 8 spider legs spreading down to belly
            [-1, 1].forEach((sx) => {
              [0.06, -0.04, -0.14, -0.24].forEach((dy, i) => {
                const sLeg = new THREE.Mesh(
                  new THREE.BoxGeometry(0.18, 0.014, 0.014),
                  whiteMat.clone()
                );
                sLeg.position.set(sx * 0.1, TORSO_Y + 0.04 + dy, frontZ + 0.02);
                sLeg.rotation.z = sx * (0.45 - i * 0.18);
                g.add(sLeg);
              });
            });
            // Slime tendril ridges on shoulders
            [-1, 1].forEach((sx) => {
              const ridge = new THREE.Mesh(
                new THREE.BoxGeometry(0.16, 0.04, 0.16),
                new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.4 })
              );
              ridge.position.set(sx * ARM_X, ARM_Y + ARM_H / 2 - 0.02, 0);
              g.add(ridge);
            });
          } else if (kind === 'ghost_rider') {
            // Black leather jacket + silver chains
            const chainMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#cbd5e1'),
              metalness: 0.8, roughness: 0.2,
            });
            // Chest chain (X cross)
            const ch1 = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W * 1.1, 0.03, 0.04),
              chainMat.clone()
            );
            ch1.rotation.z = 0.5;
            ch1.position.set(0, TORSO_Y, frontZ + 0.02);
            g.add(ch1);
            const ch2 = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W * 1.1, 0.03, 0.04),
              chainMat.clone()
            );
            ch2.rotation.z = -0.5;
            ch2.position.set(0, TORSO_Y, frontZ + 0.02);
            g.add(ch2);
            // Leather collar
            const grCollar = new THREE.Mesh(
              new THREE.CylinderGeometry(0.24, 0.24, 0.1, 18),
              new THREE.MeshStandardMaterial({ color })
            );
            grCollar.position.set(0, topY + 0.04, 0);
            g.add(grCollar);
            // Small skull buckle on belt
            const skull = new THREE.Mesh(
              new THREE.SphereGeometry(0.05, 12, 10),
              new THREE.MeshStandardMaterial({ color: '#f8fafc' })
            );
            skull.scale.set(1, 0.85, 0.7);
            skull.position.set(0, TORSO_Y - TORSO_H / 2 + 0.04, frontZ + 0.03);
            g.add(skull);
          } else if (kind === 'silver_surfer') {
            // Smooth chrome body — recolor torso to silver
            const chromeMat = new THREE.MeshStandardMaterial({
              color, metalness: 0.95, roughness: 0.08,
              emissive: new THREE.Color('#475569').multiplyScalar(0.1),
            });
            torsoMesh.material = chromeMat;
            // Subtle abdomen lines
            const abMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#94a3b8'),
              metalness: 0.7,
            });
            [-0.1, -0.18].forEach((y) => {
              const ab = new THREE.Mesh(
                new THREE.BoxGeometry(0.22, 0.012, 0.02),
                abMat.clone()
              );
              ab.position.set(0, TORSO_Y + y, frontZ + 0.005);
              g.add(ab);
            });
          } else if (kind === 'solmoe') {
            // Solmoe soccer jersey: dark green base + white diagonal
            // stripes + yellow chest band + "SOLMOE" text panel.
            const whiteMat = new THREE.MeshStandardMaterial({ color: '#ffffff' });
            const accMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#facc15'),
            });
            // Three white diagonal stripes across the front
            for (let i = 0; i < 3; i++) {
              const stripe = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, TORSO_H * 1.1, 0.02),
                whiteMat.clone()
              );
              stripe.rotation.z = -0.6;
              stripe.position.set(-0.12 + i * 0.16, TORSO_Y, frontZ + 0.01);
              g.add(stripe);
            }
            // Yellow chest band across the upper torso
            const band = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + padW + 0.005, 0.07, 0.02),
              accMat.clone()
            );
            band.position.set(0, TORSO_Y + TORSO_H / 2 - 0.12, frontZ + 0.015);
            g.add(band);
            // Yellow V-neck collar
            [-1, 1].forEach((sx) => {
              const collar = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.04, 0.02),
                accMat.clone()
              );
              collar.rotation.z = sx * 0.6;
              collar.position.set(sx * 0.06, topY - 0.07, frontZ + 0.012);
              g.add(collar);
            });
            // Number patch on the back
            const numPanel = new THREE.Mesh(
              new THREE.BoxGeometry(0.18, 0.22, 0.012),
              whiteMat.clone()
            );
            numPanel.position.set(0, TORSO_Y, backZ - 0.012);
            g.add(numPanel);
          } else if (kind === 'snorlax_suit') {
            // Cream/tan Snorlax onesie — puffy body already handled by
            // isPuffy=true. Add a dark-blue tummy patch on the chest that
            // reads as Snorlax's classic belly.
            const bellyMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#0f172a'),
              roughness: 0.6,
            });
            const belly = new THREE.Mesh(
              new THREE.SphereGeometry(0.24, 18, 14),
              bellyMat
            );
            belly.scale.set(1.4, 1.1, 0.4);
            belly.position.set(0, TORSO_Y - 0.02, frontZ + 0.04);
            g.add(belly);
            // Small round shoulder pads (Snorlax has round shoulders)
            [-1, 1].forEach((sx) => {
              const shoulder = new THREE.Mesh(
                new THREE.SphereGeometry(0.18, 16, 12),
                new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
              );
              shoulder.scale.set(1, 0.85, 1);
              shoulder.position.set(sx * ARM_X, ARM_Y + ARM_H / 2 - 0.04, 0);
              g.add(shoulder);
            });
            // Hood collar (Snorlax has a round chubby collar area)
            const collar = new THREE.Mesh(
              new THREE.CylinderGeometry(0.28, 0.28, 0.14, 18),
              new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
            );
            collar.position.set(0, topY + 0.06, 0);
            g.add(collar);
          } else if (kind === 'gengar_suit') {
            // Purple Gengar body suit — dark purple + big scary red-mouth
            // grin on the belly + rounded shoulder spikes (Gengar has
            // small spike tufts on his back).
            const purpleMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.55,
              emissive: new THREE.Color(color.getHex()).multiplyScalar(0.05),
            });
            const redMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#dc2626'),
              emissive: '#7f1d1d', emissiveIntensity: 0.4,
            });
            const whiteMat = new THREE.MeshStandardMaterial({ color: '#f8fafc' });
            (torsoMesh as THREE.Mesh).material = purpleMat;
            // Big red grin across the belly
            const grin = new THREE.Mesh(
              new THREE.TorusGeometry(0.16, 0.04, 10, 20, Math.PI),
              redMat
            );
            grin.rotation.z = Math.PI;
            grin.position.set(0, TORSO_Y + 0.02, frontZ + 0.02);
            g.add(grin);
            // Teeth (5 small white triangles across the grin)
            for (let i = -2; i <= 2; i++) {
              const tooth = new THREE.Mesh(
                new THREE.ConeGeometry(0.022, 0.05, 3),
                whiteMat.clone()
              );
              tooth.position.set(i * 0.05, TORSO_Y - 0.06, frontZ + 0.045);
              g.add(tooth);
            }
            // Spike tufts on the shoulders/back (small purple cones)
            [-1, 1].forEach((sx) => {
              const spike = new THREE.Mesh(
                new THREE.ConeGeometry(0.05, 0.14, 4),
                purpleMat.clone()
              );
              spike.rotation.z = sx * -0.4;
              spike.position.set(sx * 0.22, TORSO_Y + 0.32, -TORSO_D / 2 - 0.03);
              g.add(spike);
            });
            const centerSpike = new THREE.Mesh(
              new THREE.ConeGeometry(0.06, 0.16, 4),
              purpleMat.clone()
            );
            centerSpike.position.set(0, TORSO_Y + 0.35, -TORSO_D / 2 - 0.03);
            g.add(centerSpike);
          } else if (kind === 'pikachu_top') {
            // Yellow body + brown stripe pattern down the back + collar
            const yellowMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.5,
            });
            const brownMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#78350f'),
              roughness: 0.55,
            });
            (torsoMesh as THREE.Mesh).material = yellowMat;
            // Two brown zigzag stripes down the back
            [-1, 1].forEach((sx) => {
              [0.2, 0.0, -0.2].forEach((dy, i) => {
                const stripe = new THREE.Mesh(
                  new THREE.BoxGeometry(0.18, 0.06, 0.02),
                  brownMat.clone()
                );
                stripe.rotation.z = sx * (i % 2 === 0 ? 0.4 : -0.4);
                stripe.position.set(sx * 0.14, TORSO_Y + dy, backZ - 0.005);
                g.add(stripe);
              });
            });
          } else if (kind === 'charmander_top') {
            // Orange body with a big cream belly patch
            const orangeMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.5,
            });
            const creamMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#fef3c7'),
              roughness: 0.6,
            });
            (torsoMesh as THREE.Mesh).material = orangeMat;
            const belly = new THREE.Mesh(
              new THREE.SphereGeometry(0.32, 20, 16),
              creamMat.clone()
            );
            belly.scale.set(1.0, 1.15, 0.4);
            belly.position.set(0, TORSO_Y - 0.02, frontZ - 0.02);
            g.add(belly);
          } else if (kind === 'squirtle_top') {
            // Sky-blue body + brown turtle shell strapped to the back +
            // cream belly plastron on the front.
            const blueMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.5,
            });
            const shellMat = new THREE.MeshStandardMaterial({
              color: '#a16207', roughness: 0.5,
            });
            const creamMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#fef3c7'),
              roughness: 0.6,
            });
            (torsoMesh as THREE.Mesh).material = blueMat;
            // Shell on the back (dome)
            const shell = new THREE.Mesh(
              new THREE.SphereGeometry(
                0.45, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2
              ),
              shellMat
            );
            shell.rotation.x = Math.PI / 2;
            shell.scale.set(0.9, 1.0, 0.6);
            shell.position.set(0, TORSO_Y + 0.02, backZ - 0.04);
            g.add(shell);
            // Cream belly plastron
            const belly = new THREE.Mesh(
              new THREE.SphereGeometry(0.28, 18, 14),
              creamMat.clone()
            );
            belly.scale.set(1.0, 1.15, 0.35);
            belly.position.set(0, TORSO_Y - 0.02, frontZ - 0.01);
            g.add(belly);
            // Horizontal stripe line on belly (plastron segments)
            const line = new THREE.Mesh(
              new THREE.BoxGeometry(0.4, 0.015, 0.01),
              new THREE.MeshStandardMaterial({ color: '#a16207' })
            );
            line.position.set(0, TORSO_Y, frontZ + 0.01);
            g.add(line);
          } else if (kind === 'bulbasaur_top') {
            // Turquoise body with dark green splotches + green bulb on back
            const greenMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.5,
            });
            const darkMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#166534'),
              roughness: 0.55,
            });
            const bulbMat = new THREE.MeshStandardMaterial({
              color: '#65a30d', roughness: 0.5,
            });
            (torsoMesh as THREE.Mesh).material = greenMat;
            // Bulb attached to back
            const bulb = new THREE.Mesh(
              new THREE.SphereGeometry(0.24, 20, 16),
              bulbMat
            );
            bulb.position.set(0, TORSO_Y + 0.1, backZ - 0.08);
            g.add(bulb);
            // Bulb leaflets
            [-0.5, 0, 0.5].forEach((angle) => {
              const leaf = new THREE.Mesh(
                new THREE.ConeGeometry(0.05, 0.14, 4),
                bulbMat.clone()
              );
              leaf.rotation.z = angle;
              leaf.position.set(
                Math.sin(angle) * 0.08, TORSO_Y + 0.32, backZ - 0.08
              );
              g.add(leaf);
            });
            // Dark green splotches on the body
            [-1, 1].forEach((sx) => {
              const spot = new THREE.Mesh(
                new THREE.SphereGeometry(0.09, 12, 10),
                darkMat.clone()
              );
              spot.scale.set(1.2, 0.8, 0.3);
              spot.position.set(sx * 0.22, TORSO_Y + 0.08, frontZ - 0.01);
              g.add(spot);
            });
          } else if (kind === 'eevee_top') {
            // Light brown body + huge cream fluff collar (Eevee's ruff)
            const brownMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.75,
            });
            const fluffMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#fef3c7'),
              roughness: 0.9,
            });
            (torsoMesh as THREE.Mesh).material = brownMat;
            // Fluffy ruff around neck (ring of puffs)
            for (let i = 0; i < 10; i++) {
              const a = (i / 10) * Math.PI * 2;
              const puff = new THREE.Mesh(
                new THREE.SphereGeometry(0.11, 12, 10),
                fluffMat.clone()
              );
              puff.position.set(
                Math.cos(a) * 0.34,
                TORSO_Y + TORSO_H / 2 - 0.02,
                Math.sin(a) * 0.34
              );
              g.add(puff);
            }
          } else if (kind === 'jigglypuff_top') {
            // Round pink balloon body — replace torso with a sphere
            const pinkMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.5,
            });
            (torsoMesh as THREE.Mesh).material = pinkMat;
            // Big round overlay on the torso
            const round = new THREE.Mesh(
              new THREE.SphereGeometry(0.46, 22, 18),
              pinkMat.clone()
            );
            round.position.set(0, TORSO_Y, 0);
            g.add(round);
          } else if (kind === 'psyduck_top') {
            // Pale-yellow body with cream chest fluff and orange collar
            const yellowMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.5,
            });
            const creamMat = new THREE.MeshStandardMaterial({
              color: '#fef3c7', roughness: 0.7,
            });
            const orangeMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#f97316'),
              roughness: 0.5,
            });
            (torsoMesh as THREE.Mesh).material = yellowMat;
            // Cream chest fluff
            const fluff = new THREE.Mesh(
              new THREE.SphereGeometry(0.24, 18, 14),
              creamMat.clone()
            );
            fluff.scale.set(1.0, 1.15, 0.4);
            fluff.position.set(0, TORSO_Y, frontZ - 0.01);
            g.add(fluff);
            // Orange collar
            const collar = new THREE.Mesh(
              new THREE.TorusGeometry(0.3, 0.03, 8, 20),
              orangeMat.clone()
            );
            collar.rotation.x = Math.PI / 2;
            collar.position.set(0, topY - 0.02, 0);
            g.add(collar);
          } else if (kind === 'mew_top') {
            // Soft pink body with subtle darker pink cheeks + slight cream chest
            const pinkMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.5,
              emissive: new THREE.Color(color.getHex()).multiplyScalar(0.06),
            });
            const darkPinkMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#f472b6'),
              roughness: 0.55,
            });
            (torsoMesh as THREE.Mesh).material = pinkMat;
            // Belly patch
            const belly = new THREE.Mesh(
              new THREE.SphereGeometry(0.24, 18, 14),
              darkPinkMat.clone()
            );
            belly.scale.set(1.0, 1.15, 0.35);
            belly.position.set(0, TORSO_Y - 0.02, frontZ - 0.01);
            g.add(belly);
          } else if (kind === 'charizard_top') {
            // Orange muscular body with cream belly + small folded wing hints
            const orangeMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.5,
            });
            const creamMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#fef3c7'),
              roughness: 0.6,
            });
            (torsoMesh as THREE.Mesh).material = orangeMat;
            // Cream belly with segment lines (Charizard's ridged underside)
            const belly = new THREE.Mesh(
              new THREE.SphereGeometry(0.3, 20, 16),
              creamMat.clone()
            );
            belly.scale.set(1.0, 1.15, 0.4);
            belly.position.set(0, TORSO_Y - 0.02, frontZ - 0.02);
            g.add(belly);
            [0.1, 0.0, -0.1, -0.2].forEach((dy) => {
              const seam = new THREE.Mesh(
                new THREE.BoxGeometry(0.4, 0.012, 0.01),
                new THREE.MeshStandardMaterial({ color: '#7c2d12' })
              );
              seam.position.set(0, TORSO_Y + dy, frontZ + 0.02);
              g.add(seam);
            });
          } else if (kind === 'lugia_top') {
            // Lugia — white body with pale-blue belly overlay, long white
            // neck rising up from the shoulders, small navy shoulder plates.
            const whiteMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.5,
            });
            const bellyMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#bfdbfe'),
              roughness: 0.55,
            });
            const navyMat = new THREE.MeshStandardMaterial({
              color: '#1e3a8a', roughness: 0.5,
            });
            (torsoMesh as THREE.Mesh).material = whiteMat;
            // Big pale-blue belly patch across the front
            const belly = new THREE.Mesh(
              new THREE.SphereGeometry(0.34, 20, 16),
              bellyMat
            );
            belly.scale.set(1.1, 1.3, 0.5);
            belly.position.set(0, TORSO_Y - 0.02, frontZ - 0.02);
            g.add(belly);
            // Long white neck rising to head
            const neck = new THREE.Mesh(
              new THREE.CylinderGeometry(0.18, 0.24, 0.5, 18),
              whiteMat.clone()
            );
            neck.position.set(0, TORSO_Y + TORSO_H / 2 + 0.2, -0.02);
            g.add(neck);
            // Small navy shoulder plate row (2 plates on each shoulder)
            [-1, 1].forEach((sx) => {
              [0, 1].forEach((i) => {
                const plate = new THREE.Mesh(
                  new THREE.ConeGeometry(0.05, 0.12, 4),
                  navyMat.clone()
                );
                plate.rotation.z = sx * -Math.PI / 2 + sx * 0.2;
                plate.position.set(sx * (0.3 + i * 0.05), TORSO_Y + 0.28 - i * 0.06, -TORSO_D / 2 + 0.02);
                g.add(plate);
              });
            });
          } else if (accent) {
            // plain tee with accent hem
            const stripe = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + padW + 0.01, 0.08, TORSO_D + padD + 0.01),
              new THREE.MeshStandardMaterial({ color: accent })
            );
            stripe.position.set(0, TORSO_Y - TORSO_H / 2 + 0.05, 0);
            g.add(stripe);
          }
          break;
        }
        case 'bottom': {
          const kind = item.kind ?? 'pants';
          const matB = new THREE.MeshStandardMaterial({ color });

          if (
            kind === 'batman' ||
            kind === 'captain_america' ||
            kind === 'thor' ||
            kind === 'superman' ||
            kind === 'flash' ||
            kind === 'panther'
          ) {
            const accMatHero = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#fbbf24'),
              metalness: kind === 'thor' || kind === 'panther' ? 0.5 : 0.25,
              roughness: 0.4,
            });
            // Base coloured legs
            [-1, 1].forEach((sx) => {
              const leg = new THREE.Mesh(
                new THREE.BoxGeometry(
                  LEG_W + (kind === 'thor' ? 0.1 : 0.05),
                  LEG_H + 0.02,
                  LEG_W + (kind === 'thor' ? 0.1 : 0.05)
                ),
                matB.clone()
              );
              leg.position.set(sx * LEG_X, LEG_Y, 0);
              g.add(leg);
            });
            if (kind === 'batman') {
              // Yellow utility belt with small pouches
              const belt = new THREE.Mesh(
                new THREE.BoxGeometry(TORSO_W + 0.08, 0.1, TORSO_D + 0.08),
                accMatHero.clone()
              );
              belt.position.set(0, LEG_Y + LEG_H / 2 + 0.04, 0);
              g.add(belt);
              for (let i = -2; i <= 2; i++) {
                const pouch = new THREE.Mesh(
                  new THREE.BoxGeometry(0.07, 0.07, 0.03),
                  accMatHero.clone()
                );
                pouch.position.set(i * 0.13, LEG_Y + LEG_H / 2 + 0.04, TORSO_D / 2 + 0.05);
                g.add(pouch);
              }
            } else if (kind === 'captain_america') {
              const beltCap = new THREE.Mesh(
                new THREE.BoxGeometry(TORSO_W + 0.08, 0.08, TORSO_D + 0.08),
                new THREE.MeshStandardMaterial({ color: '#7c2d12' })
              );
              beltCap.position.set(0, LEG_Y + LEG_H / 2 + 0.02, 0);
              g.add(beltCap);
            } else if (kind === 'thor') {
              // Silver knee plates
              [-1, 1].forEach((sx) => {
                const knee = new THREE.Mesh(
                  new THREE.BoxGeometry(LEG_W + 0.12, 0.1, LEG_W + 0.08),
                  accMatHero.clone()
                );
                knee.position.set(sx * LEG_X, LEG_Y - 0.04, 0.02);
                g.add(knee);
              });
            } else if (kind === 'superman') {
              // Red trunks (boxy briefs over the blue legs)
              const trunks = new THREE.Mesh(
                new THREE.BoxGeometry(TORSO_W + 0.1, 0.28, TORSO_D + 0.1),
                accMatHero.clone()
              );
              trunks.position.set(0, LEG_Y + LEG_H / 2 - 0.02, 0);
              g.add(trunks);
              // Yellow belt over the trunks
              const yBelt = new THREE.Mesh(
                new THREE.BoxGeometry(TORSO_W + 0.12, 0.06, TORSO_D + 0.12),
                new THREE.MeshStandardMaterial({ color: '#fde047' })
              );
              yBelt.position.set(0, LEG_Y + LEG_H / 2 + 0.1, 0);
              g.add(yBelt);
            } else if (kind === 'flash') {
              // Gold lightning ring around each thigh
              [-1, 1].forEach((sx) => {
                const ring = new THREE.Mesh(
                  new THREE.TorusGeometry(0.18, 0.025, 8, 18),
                  accMatHero.clone()
                );
                ring.rotation.x = Math.PI / 2;
                ring.position.set(sx * LEG_X, LEG_Y + LEG_H / 4, 0);
                g.add(ring);
              });
            } else if (kind === 'panther') {
              // Silver vibranium stripe down each leg
              [-1, 1].forEach((sx) => {
                const stripe = new THREE.Mesh(
                  new THREE.BoxGeometry(0.025, LEG_H, 0.025),
                  accMatHero.clone()
                );
                stripe.position.set(
                  sx * (LEG_X + LEG_W / 2 + 0.02),
                  LEG_Y,
                  0
                );
                g.add(stripe);
              });
            }
            break;
          }

          if (kind === 'slp_skirt') {
            // Navy pleated school skirt with a darker waistband and
            // visible vertical pleat lines around the cone.
            const pleatMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#0c1a47'),
            });
            const skirt = new THREE.Mesh(
              new THREE.CylinderGeometry(0.42, 0.6, 0.55, 24),
              matB.clone()
            );
            skirt.position.set(0, LEG_Y + LEG_H / 2 - 0.05, 0);
            g.add(skirt);
            // Vertical pleat lines around the skirt
            for (let i = 0; i < 16; i++) {
              const a = (i / 16) * Math.PI * 2;
              const r = 0.5;
              const pleat = new THREE.Mesh(
                new THREE.BoxGeometry(0.012, 0.55, 0.012),
                pleatMat.clone()
              );
              pleat.position.set(
                Math.cos(a) * r,
                LEG_Y + LEG_H / 2 - 0.05,
                Math.sin(a) * r
              );
              g.add(pleat);
            }
            // Waistband at the top of the skirt
            const band = new THREE.Mesh(
              new THREE.CylinderGeometry(0.43, 0.43, 0.06, 24),
              pleatMat.clone()
            );
            band.position.set(0, LEG_Y + LEG_H / 2 + 0.2, 0);
            g.add(band);
            // Skin-coloured legs below the skirt hem
            [-1, 1].forEach((sx) => {
              const leg = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W, LEG_H * 0.5, LEG_W),
                new THREE.MeshStandardMaterial({ color: SKIN })
              );
              leg.position.set(sx * LEG_X, LEG_Y - LEG_H * 0.25, 0);
              g.add(leg);
            });
            break;
          }

          if (
            kind === 'wolverine' ||
            kind === 'dr_strange' ||
            kind === 'starlord' ||
            kind === 'antman' ||
            kind === 'war_machine' ||
            kind === 'vision' ||
            kind === 'daredevil' ||
            kind === 'hawkeye' ||
            kind === 'falcon' ||
            kind === 'venom' ||
            kind === 'ghost_rider' ||
            kind === 'silver_surfer'
          ) {
            const trimMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#fbbf24'),
              metalness: kind === 'war_machine' || kind === 'silver_surfer' ? 0.6 : 0.3,
            });
            const baseW = kind === 'war_machine' ? 0.1 : 0.05;
            // Base color legs
            [-1, 1].forEach((sx) => {
              const leg = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + baseW, LEG_H + 0.02, LEG_W + baseW),
                matB.clone()
              );
              leg.position.set(sx * LEG_X, LEG_Y, 0);
              g.add(leg);
            });
            if (kind === 'wolverine') {
              // Yellow side stripes
              [-1, 1].forEach((sx) => {
                const stripe = new THREE.Mesh(
                  new THREE.BoxGeometry(0.04, LEG_H, LEG_W + 0.06),
                  trimMat.clone()
                );
                stripe.position.set(sx * (LEG_X + LEG_W / 2 + 0.01), LEG_Y, 0);
                g.add(stripe);
              });
            } else if (kind === 'dr_strange') {
              // Gold trim along the bottom (long robe hem)
              const hem = new THREE.Mesh(
                new THREE.BoxGeometry(TORSO_W + 0.16, 0.05, TORSO_D + 0.16),
                trimMat.clone()
              );
              hem.position.set(0, LEG_Y - LEG_H / 2 - 0.02, 0);
              g.add(hem);
            } else if (kind === 'starlord') {
              // Brown belt + side gun holsters
              const beltSL = new THREE.Mesh(
                new THREE.BoxGeometry(TORSO_W + 0.08, 0.08, TORSO_D + 0.08),
                new THREE.MeshStandardMaterial({ color: '#7c2d12' })
              );
              beltSL.position.set(0, LEG_Y + LEG_H / 2 + 0.04, 0);
              g.add(beltSL);
              [-1, 1].forEach((sx) => {
                const holster = new THREE.Mesh(
                  new THREE.BoxGeometry(0.1, 0.16, 0.08),
                  trimMat.clone()
                );
                holster.position.set(sx * (LEG_X + 0.12), LEG_Y + LEG_H * 0.3, 0.08);
                g.add(holster);
              });
            } else if (kind === 'antman') {
              // Black horizontal segments
              [0.14, 0, -0.14].forEach((y) => {
                [-1, 1].forEach((sx) => {
                  const seg = new THREE.Mesh(
                    new THREE.BoxGeometry(LEG_W + 0.07, 0.04, LEG_W + 0.07),
                    trimMat.clone()
                  );
                  seg.position.set(sx * LEG_X, LEG_Y + y, 0);
                  g.add(seg);
                });
              });
            } else if (kind === 'war_machine') {
              // Dark gunmetal knee plates
              [-1, 1].forEach((sx) => {
                const knee = new THREE.Mesh(
                  new THREE.BoxGeometry(LEG_W + 0.12, 0.1, LEG_W + 0.1),
                  trimMat.clone()
                );
                knee.position.set(sx * LEG_X, LEG_Y - 0.02, 0.01);
                g.add(knee);
              });
            } else if (kind === 'vision') {
              // Yellow knee rings
              [-1, 1].forEach((sx) => {
                const ring = new THREE.Mesh(
                  new THREE.TorusGeometry(0.18, 0.025, 8, 16),
                  trimMat.clone()
                );
                ring.rotation.x = Math.PI / 2;
                ring.position.set(sx * LEG_X, LEG_Y - 0.02, 0);
                g.add(ring);
              });
            } else if (kind === 'daredevil') {
              // Black knee pads
              [-1, 1].forEach((sx) => {
                const pad = new THREE.Mesh(
                  new THREE.BoxGeometry(LEG_W + 0.08, 0.08, LEG_W + 0.04),
                  trimMat.clone()
                );
                pad.position.set(sx * LEG_X, LEG_Y - 0.02, 0.02);
                g.add(pad);
              });
            } else if (kind === 'hawkeye') {
              // Purple stripe down each side
              [-1, 1].forEach((sx) => {
                const stripe = new THREE.Mesh(
                  new THREE.BoxGeometry(0.04, LEG_H, LEG_W + 0.06),
                  trimMat.clone()
                );
                stripe.position.set(sx * (LEG_X + LEG_W / 2 + 0.01), LEG_Y, 0);
                g.add(stripe);
              });
            } else if (kind === 'falcon') {
              // Tactical pouches
              [-1, 1].forEach((sx) => {
                const pouch = new THREE.Mesh(
                  new THREE.BoxGeometry(0.1, 0.12, 0.06),
                  trimMat.clone()
                );
                pouch.position.set(sx * LEG_X, LEG_Y + LEG_H * 0.25, LEG_W / 2 + 0.05);
                g.add(pouch);
              });
            } else if (kind === 'venom') {
              // White slime tendril marks down each leg
              [-1, 1].forEach((sx) => {
                const tendril = new THREE.Mesh(
                  new THREE.BoxGeometry(0.02, LEG_H, 0.02),
                  trimMat.clone()
                );
                tendril.position.set(sx * LEG_X, LEG_Y, LEG_W / 2 + 0.03);
                g.add(tendril);
              });
            } else if (kind === 'ghost_rider') {
              // Chains wrapped around each thigh
              [-1, 1].forEach((sx) => {
                const chain = new THREE.Mesh(
                  new THREE.TorusGeometry(0.18, 0.022, 8, 16),
                  trimMat.clone()
                );
                chain.rotation.x = Math.PI / 2;
                chain.position.set(sx * LEG_X, LEG_Y + 0.12, 0);
                g.add(chain);
              });
            } else if (kind === 'silver_surfer') {
              // Slightly darker ankle line
              [-1, 1].forEach((sx) => {
                const ank = new THREE.Mesh(
                  new THREE.BoxGeometry(LEG_W + 0.07, 0.02, LEG_W + 0.07),
                  trimMat.clone()
                );
                ank.position.set(sx * LEG_X, LEG_Y - LEG_H / 2 + 0.02, 0);
                g.add(ank);
              });
            }
            break;
          }

          if (kind === 'slp') {
            // Navy dress pants with a center crease + cuffed hem.
            const creaseMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#0c1a47'),
            });
            [-1, 1].forEach((sx) => {
              const leg = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.06, LEG_H + 0.02, LEG_W + 0.06),
                matB.clone()
              );
              leg.position.set(sx * LEG_X, LEG_Y, 0);
              g.add(leg);
              const crease = new THREE.Mesh(
                new THREE.BoxGeometry(0.012, LEG_H, 0.012),
                creaseMat.clone()
              );
              crease.position.set(sx * LEG_X, LEG_Y, LEG_W / 2 + 0.035);
              g.add(crease);
              const cuff = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.08, 0.05, LEG_W + 0.08),
                matB.clone()
              );
              cuff.position.set(sx * LEG_X, LEG_Y - LEG_H / 2 + 0.02, 0);
              g.add(cuff);
            });
            break;
          }

          if (kind === 'spiderman') {
            // Blue legs with web lines + a red hip belt.
            const webMat = new THREE.MeshStandardMaterial({ color: '#10101e' });
            [-1, 1].forEach((sx) => {
              const leg = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.05, LEG_H + 0.02, LEG_W + 0.05),
                matB.clone()
              );
              leg.position.set(sx * LEG_X, LEG_Y, 0);
              g.add(leg);
              // 2 vertical web lines per leg (front + side)
              const lineF = new THREE.Mesh(
                new THREE.BoxGeometry(0.01, LEG_H, 0.01),
                webMat.clone()
              );
              lineF.position.set(sx * LEG_X, LEG_Y, LEG_W / 2 + 0.03);
              g.add(lineF);
              const lineS = new THREE.Mesh(
                new THREE.BoxGeometry(0.01, LEG_H, 0.01),
                webMat.clone()
              );
              lineS.position.set(sx * (LEG_X + LEG_W / 2 + 0.02), LEG_Y, 0);
              g.add(lineS);
              // horizontal web rings
              [0.16, 0, -0.16].forEach((y) => {
                const ring = new THREE.Mesh(
                  new THREE.BoxGeometry(LEG_W + 0.07, 0.01, LEG_W + 0.07),
                  webMat.clone()
                );
                ring.position.set(sx * LEG_X, LEG_Y + y, 0);
                g.add(ring);
              });
            });
            const redMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#c81e1e'),
            });
            const hip = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + 0.08, 0.16, TORSO_D + 0.08),
              redMat
            );
            hip.position.set(0, LEG_Y + LEG_H / 2 + 0.02, 0);
            g.add(hip);
            break;
          }

          if (kind === 'hulk') {
            // Torn gray pants over the thighs with ragged hem, green shins
            // showing below.
            const greenMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#73b339'),
              roughness: 0.7,
            });
            [-1, 1].forEach((sx) => {
              // Green lower leg (full leg base in green)
              const shin = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.06, LEG_H + 0.02, LEG_W + 0.06),
                greenMat.clone()
              );
              shin.position.set(sx * LEG_X, LEG_Y, 0);
              g.add(shin);
              // Gray pants covering the upper ~60%
              const pant = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.14, LEG_H * 0.62, LEG_W + 0.14),
                matB.clone()
              );
              pant.position.set(sx * LEG_X, LEG_Y + LEG_H * 0.2, 0);
              g.add(pant);
              // Ragged torn hem (downward cones) around the pant bottom
              [-0.09, -0.03, 0.03, 0.09].forEach((dx) => {
                const tear = new THREE.Mesh(
                  new THREE.ConeGeometry(0.045, 0.12, 4),
                  matB.clone()
                );
                tear.rotation.x = Math.PI;
                tear.position.set(sx * LEG_X + dx, LEG_Y - 0.04, LEG_W / 2 + 0.06);
                g.add(tear);
              });
            });
            // Waistband
            const band = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + 0.12, 0.16, TORSO_D + 0.12),
              matB.clone()
            );
            band.position.set(0, LEG_Y + LEG_H / 2 + 0.02, 0);
            g.add(band);
            break;
          }

          if (kind === 'elsa_skirt') {
            // Long icy gown with sparkles and a metallic waist sash.
            const gownMat = new THREE.MeshStandardMaterial({
              color,
              roughness: 0.4,
              metalness: 0.15,
              emissive: new THREE.Color(color.getHex()).multiplyScalar(0.08),
            });
            const gown = new THREE.Mesh(
              new THREE.CylinderGeometry(0.42, 0.85, 1.0, 28),
              gownMat
            );
            gown.position.set(0, -0.15, 0);
            g.add(gown);
            const sparkleMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#ffffff'),
              emissive: accent ?? new THREE.Color('#ffffff'),
              emissiveIntensity: 0.9,
            });
            for (let i = 0; i < 14; i++) {
              const col = i % 4 - 1.5;
              const row = Math.floor(i / 4);
              const sp = new THREE.Mesh(
                new THREE.SphereGeometry(0.025, 8, 8),
                sparkleMat.clone()
              );
              sp.position.set(col * 0.22, 0.1 - row * 0.22, 0.42 + col * col * 0.04);
              g.add(sp);
            }
            const sash = new THREE.Mesh(
              new THREE.CylinderGeometry(0.44, 0.44, 0.08, 24),
              sparkleMat.clone()
            );
            sash.position.set(0, 0.3, 0);
            g.add(sash);
            break;
          }

          if (kind === 'ariel_tail') {
            // Green mermaid tail — solid cone covering both legs + ringed
            // scale rows + a wide fluke fin at the bottom.
            const scaleMat = new THREE.MeshStandardMaterial({
              color,
              roughness: 0.4,
              metalness: 0.3,
              emissive: new THREE.Color(color.getHex()).multiplyScalar(0.06),
            });
            const finMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#15803d'),
              roughness: 0.5,
            });
            const tail = new THREE.Mesh(
              new THREE.CylinderGeometry(0.32, 0.18, 1.0, 24),
              scaleMat
            );
            tail.position.set(0, -0.15, 0);
            g.add(tail);
            // Scale rings
            for (let i = 0; i < 6; i++) {
              const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.28 - i * 0.02, 0.015, 8, 24),
                finMat.clone()
              );
              ring.rotation.x = Math.PI / 2;
              ring.position.set(0, 0.2 - i * 0.16, 0);
              g.add(ring);
            }
            // Fluke fin — built inside a Group whose origin sits at x=0 so
            // the per-leg `redistribute` doesn't split it onto one leg
            // pivot (only direct slot-group children get redistributed).
            const flukeGroup = new THREE.Group();
            flukeGroup.position.set(0, -0.7, 0);
            [-1, 1].forEach((sx) => {
              const fluke = new THREE.Mesh(
                new THREE.BoxGeometry(0.34, 0.06, 0.2),
                finMat.clone()
              );
              fluke.rotation.z = sx * 0.45;
              fluke.position.set(sx * 0.16, 0, 0);
              flukeGroup.add(fluke);
            });
            g.add(flukeGroup);
            break;
          }

          if (kind === 'rapunzel_skirt') {
            // Lavender knee-length skirt with a white apron front and a
            // pink waist sash. Base legs/feet stay visible beneath.
            const fabricMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
            const apronMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#ffffff'),
            });
            const skirt = new THREE.Mesh(
              new THREE.CylinderGeometry(0.42, 0.7, 0.7, 24),
              fabricMat
            );
            skirt.position.set(0, 0, 0);
            g.add(skirt);
            const apron = new THREE.Mesh(
              new THREE.BoxGeometry(0.45, 0.55, 0.04),
              apronMat
            );
            apron.position.set(0, 0, 0.34);
            g.add(apron);
            const sashR = new THREE.Mesh(
              new THREE.CylinderGeometry(0.44, 0.44, 0.07, 24),
              new THREE.MeshStandardMaterial({ color: '#f9a8d4' })
            );
            sashR.position.set(0, 0.33, 0);
            g.add(sashR);
            break;
          }

          if (kind === 'princess_skirt') {
            // Long flowing ball-gown cone covering legs from waist to floor.
            const gown = new THREE.Mesh(
              new THREE.CylinderGeometry(0.42, 0.85, 1.0, 28),
              new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
            );
            gown.position.set(0, -0.15, 0);
            g.add(gown);
            // Lighter inner petticoat peeking out at the hem.
            const innerColor = accent ?? new THREE.Color('#ffffff');
            const petticoat = new THREE.Mesh(
              new THREE.CylinderGeometry(0.72, 0.92, 0.16, 28),
              new THREE.MeshStandardMaterial({ color: innerColor, roughness: 0.7 })
            );
            petticoat.position.set(0, -0.58, 0);
            g.add(petticoat);
            // Gold-ish sash at the waist
            const sash = new THREE.Mesh(
              new THREE.CylinderGeometry(0.44, 0.44, 0.08, 24),
              new THREE.MeshStandardMaterial({
                color: '#fde68a',
                metalness: 0.5,
                roughness: 0.3,
              })
            );
            sash.position.set(0, 0.3, 0);
            g.add(sash);
            // Front center rose decoration
            const rose = new THREE.Mesh(
              new THREE.SphereGeometry(0.06, 14, 12),
              new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.4 })
            );
            rose.position.set(0, 0.3, 0.45);
            g.add(rose);
            break;
          }

          if (kind === 'tutu') {
            // 3 thin stacked tulle disks for a fluffy short ballet tutu.
            // Legs stay visible underneath since the tutu sits high.
            for (let i = 0; i < 3; i++) {
              const layer = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5 + i * 0.04, 0.34, 0.07, 24),
                new THREE.MeshStandardMaterial({
                  color,
                  transparent: true,
                  opacity: 0.88,
                  roughness: 0.8,
                })
              );
              layer.position.set(0, 0.28 - i * 0.04, 0);
              g.add(layer);
            }
            // Pink ribbon tied at the waist
            const waist = new THREE.Mesh(
              new THREE.TorusGeometry(0.36, 0.025, 8, 24),
              new THREE.MeshStandardMaterial({ color: '#ec4899' })
            );
            waist.rotation.x = Math.PI / 2;
            waist.position.set(0, 0.32, 0);
            g.add(waist);
            // Skin-toned legs below (so they don't read as covered by anything)
            [-1, 1].forEach((sx) => {
              const leg = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W, LEG_H * 0.55, LEG_W),
                new THREE.MeshStandardMaterial({ color: SKIN })
              );
              leg.position.set(sx * LEG_X, LEG_Y - LEG_H * 0.225, 0);
              g.add(leg);
            });
            break;
          }

          if (kind === 'skirt') {
            const skirt = new THREE.Mesh(
              new THREE.CylinderGeometry(0.5, 0.32, 0.55, 18),
              matB
            );
            skirt.position.set(0, LEG_Y + LEG_H / 2 - 0.05, 0);
            g.add(skirt);
            // bare-ish legs below skirt (use color of skin so they read as legs)
            [-1, 1].forEach((sx) => {
              const leg = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W, LEG_H * 0.5, LEG_W),
                new THREE.MeshStandardMaterial({ color: SKIN })
              );
              leg.position.set(sx * LEG_X, LEG_Y - LEG_H * 0.25, 0);
              g.add(leg);
            });
          } else if (kind === 'shorts') {
            [-1, 1].forEach((sx) => {
              const leg = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.05, LEG_H * 0.55, LEG_W + 0.05),
                matB.clone()
              );
              leg.position.set(sx * LEG_X, LEG_Y + LEG_H * 0.22, 0);
              g.add(leg);
            });
          } else if (kind === 'solmoe') {
            // Bright yellow soccer shorts (above-knee) with a dark green
            // waistband and a side stripe down each leg.
            const trimMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#0f3d2e'),
            });
            [-1, 1].forEach((sx) => {
              const leg = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.07, LEG_H * 0.55, LEG_W + 0.07),
                matB.clone()
              );
              leg.position.set(sx * LEG_X, LEG_Y + LEG_H * 0.22, 0);
              g.add(leg);
              // Side stripe
              const stripe = new THREE.Mesh(
                new THREE.BoxGeometry(0.025, LEG_H * 0.55, LEG_W + 0.09),
                trimMat.clone()
              );
              stripe.position.set(sx * (LEG_X + LEG_W / 2 + 0.025), LEG_Y + LEG_H * 0.22, 0);
              g.add(stripe);
            });
            // Dark green waistband across the hips
            const band = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + 0.1, 0.07, TORSO_D + 0.1),
              trimMat.clone()
            );
            band.position.set(0, LEG_Y + LEG_H * 0.5, 0);
            g.add(band);
          } else if (kind === 'spacepants') {
            const accMat = accent ? new THREE.MeshStandardMaterial({ color: accent }) : null;
            [-1, 1].forEach((sx) => {
              const leg = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.12, LEG_H + 0.04, LEG_W + 0.12),
                matB.clone()
              );
              leg.position.set(sx * LEG_X, LEG_Y, 0);
              g.add(leg);
              if (accMat) {
                const ring = new THREE.Mesh(
                  new THREE.TorusGeometry(0.18, 0.03, 8, 16),
                  accMat.clone()
                );
                ring.rotation.x = Math.PI / 2;
                ring.position.set(sx * LEG_X, LEG_Y - LEG_H / 2 + 0.04, 0);
                g.add(ring);
                const stripe = new THREE.Mesh(
                  new THREE.BoxGeometry(0.04, LEG_H, LEG_W + 0.14),
                  accMat.clone()
                );
                stripe.position.set(sx * (LEG_X + LEG_W / 2 + 0.04), LEG_Y, 0);
                g.add(stripe);
              }
            });
          } else if (kind === 'track') {
            const accMat = accent ? new THREE.MeshStandardMaterial({ color: accent }) : null;
            [-1, 1].forEach((sx) => {
              const leg = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.05, LEG_H + 0.02, LEG_W + 0.05),
                matB.clone()
              );
              leg.position.set(sx * LEG_X, LEG_Y, 0);
              g.add(leg);
              if (accMat) {
                const stripe = new THREE.Mesh(
                  new THREE.BoxGeometry(0.05, LEG_H + 0.04, LEG_W + 0.07),
                  accMat.clone()
                );
                stripe.position.set(sx * (LEG_X + LEG_W / 2 + 0.02), LEG_Y, 0);
                g.add(stripe);
              }
            });
          } else if (kind === 'sweat') {
            [-1, 1].forEach((sx) => {
              const leg = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.08, LEG_H + 0.02, LEG_W + 0.08),
                matB.clone()
              );
              leg.position.set(sx * LEG_X, LEG_Y, 0);
              g.add(leg);
              const cuff = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.12, 0.08, LEG_W + 0.12),
                matB.clone()
              );
              cuff.position.set(sx * LEG_X, LEG_Y - LEG_H / 2 + 0.04, 0);
              g.add(cuff);
            });
          } else if (kind === 'plaid') {
            [-1, 1].forEach((sx) => {
              const leg = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.05, LEG_H + 0.02, LEG_W + 0.05),
                matB.clone()
              );
              leg.position.set(sx * LEG_X, LEG_Y, 0);
              g.add(leg);
            });
            if (accent) {
              const accMat = new THREE.MeshStandardMaterial({ color: accent });
              [-0.22, -0.04, 0.14].forEach((y) => {
                [-1, 1].forEach((sx) => {
                  const h = new THREE.Mesh(
                    new THREE.BoxGeometry(LEG_W + 0.07, 0.04, LEG_W + 0.07),
                    accMat.clone()
                  );
                  h.position.set(sx * LEG_X, LEG_Y + y, 0);
                  g.add(h);
                });
              });
              [-1, 1].forEach((sx) => {
                const v = new THREE.Mesh(
                  new THREE.BoxGeometry(0.04, LEG_H + 0.04, LEG_W + 0.07),
                  accMat.clone()
                );
                v.position.set(sx * LEG_X, LEG_Y, 0);
                g.add(v);
              });
            }
          } else if (kind === 'jeans') {
            [-1, 1].forEach((sx) => {
              const leg = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.05, LEG_H + 0.02, LEG_W + 0.05),
                matB.clone()
              );
              leg.position.set(sx * LEG_X, LEG_Y, 0);
              g.add(leg);
            });
            const belt = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + 0.08, 0.08, TORSO_D + 0.06),
              new THREE.MeshStandardMaterial({ color: '#1f2937' })
            );
            belt.position.set(0, LEG_Y + LEG_H / 2 + 0.03, 0);
            g.add(belt);
            const buckle = new THREE.Mesh(
              new THREE.BoxGeometry(0.08, 0.06, 0.04),
              new THREE.MeshStandardMaterial({
                color: accent ?? '#fbbf24',
                metalness: 0.6,
                roughness: 0.3,
              })
            );
            buckle.position.set(0, LEG_Y + LEG_H / 2 + 0.03, TORSO_D / 2 + 0.04);
            g.add(buckle);
            // Pocket lines on the back
            const pocketMat = new THREE.MeshStandardMaterial({ color: '#1e3a8a' });
            [-1, 1].forEach((sx) => {
              const pocket = new THREE.Mesh(
                new THREE.BoxGeometry(0.13, 0.13, 0.03),
                pocketMat.clone()
              );
              pocket.position.set(sx * 0.13, LEG_Y + LEG_H / 2 - 0.16, -LEG_W / 2 - 0.03);
              g.add(pocket);
            });
          } else if (kind === 'ironman') {
            const armorMat = new THREE.MeshStandardMaterial({
              color,
              metalness: 0,
              roughness: 0.55,
              emissive: new THREE.Color(color.getHex()).multiplyScalar(0.02),
            });
            const goldColor = accent ?? new THREE.Color('#fbbf24');
            const goldMat = new THREE.MeshStandardMaterial({
              color: goldColor,
              metalness: 0,
              roughness: 0.5,
              emissive: new THREE.Color(goldColor.getHex()).multiplyScalar(0.025),
            });
            [-1, 1].forEach((sx) => {
              // Crimson thigh
              const thigh = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.06, LEG_H * 0.5, LEG_W + 0.06),
                armorMat.clone()
              );
              thigh.position.set(sx * LEG_X, LEG_Y + LEG_H * 0.2, 0);
              g.add(thigh);
              // Crimson shin
              const shin = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.05, LEG_H * 0.46, LEG_W + 0.05),
                armorMat.clone()
              );
              shin.position.set(sx * LEG_X, LEG_Y - LEG_H * 0.24, 0);
              g.add(shin);
              // Gold knee plate
              const knee = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.08, 0.08, LEG_W + 0.04),
                goldMat.clone()
              );
              knee.position.set(sx * LEG_X, LEG_Y - 0.03, 0.02);
              g.add(knee);
              // Gold thigh band near the belt
              const band = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.08, 0.05, LEG_W + 0.08),
                goldMat.clone()
              );
              band.position.set(sx * LEG_X, LEG_Y + LEG_H * 0.42, 0);
              g.add(band);
            });
          } else if (kind === 'robot') {
            const chromeMat = new THREE.MeshStandardMaterial({
              color,
              metalness: 0.75,
              roughness: 0.25,
            });
            const jointMat = new THREE.MeshStandardMaterial({
              color: '#334155',
              metalness: 0.8,
              roughness: 0.2,
            });
            const ledColor = accent ? new THREE.Color(accent) : new THREE.Color('#22d3ee');
            const ledMat = new THREE.MeshStandardMaterial({
              color: ledColor,
              emissive: ledColor,
              emissiveIntensity: 0.9,
            });
            [-1, 1].forEach((sx) => {
              // Thigh segment
              const thigh = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.05, LEG_H * 0.45, LEG_W + 0.05),
                chromeMat.clone()
              );
              thigh.position.set(sx * LEG_X, LEG_Y + LEG_H * 0.2, 0);
              g.add(thigh);
              // Knee joint ring
              const knee = new THREE.Mesh(
                new THREE.CylinderGeometry(0.14, 0.14, 0.1, 18),
                jointMat.clone()
              );
              knee.rotation.z = Math.PI / 2;
              knee.position.set(sx * LEG_X, LEG_Y - 0.04, 0);
              g.add(knee);
              // Knee LED
              const led = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), ledMat.clone());
              led.position.set(sx * LEG_X, LEG_Y - 0.04, LEG_W / 2 + 0.04);
              g.add(led);
              // Shin segment
              const shin = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.04, LEG_H * 0.45, LEG_W + 0.04),
                chromeMat.clone()
              );
              shin.position.set(sx * LEG_X, LEG_Y - LEG_H * 0.25, 0);
              g.add(shin);
            });
          } else if (
            kind === 'pikachu_legs' ||
            kind === 'charmander_legs' ||
            kind === 'squirtle_legs' ||
            kind === 'bulbasaur_legs' ||
            kind === 'eevee_legs' ||
            kind === 'jigglypuff_legs' ||
            kind === 'psyduck_legs' ||
            kind === 'snorlax_legs' ||
            kind === 'gengar_legs' ||
            kind === 'charizard_legs' ||
            kind === 'mew_legs'
          ) {
            // Pokemon legs — species-shaped bipedal legs (chubby/round rather
            // than boxy), with per-species accents so the character reads as
            // that Pokemon from the waist down too.
            const bodyMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.55,
            });
            const accMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#fef3c7'),
              roughness: 0.6,
            });
            // Base bipedal legs — rounded pill shape
            [-1, 1].forEach((sx) => {
              const leg = new THREE.Mesh(
                new THREE.CylinderGeometry(LEG_W * 0.75, LEG_W * 0.9, LEG_H + 0.02, 14),
                bodyMat.clone()
              );
              leg.position.set(sx * LEG_X, LEG_Y, 0);
              g.add(leg);
            });
            // Species-specific accents
            if (kind === 'pikachu_legs') {
              // Brown zigzag stripes on the back of each thigh
              [-1, 1].forEach((sx) => {
                [0.15, -0.05].forEach((dy, i) => {
                  const stripe = new THREE.Mesh(
                    new THREE.BoxGeometry(0.16, 0.05, 0.02),
                    new THREE.MeshStandardMaterial({ color: '#78350f' })
                  );
                  stripe.rotation.z = i % 2 === 0 ? 0.4 : -0.4;
                  stripe.position.set(sx * LEG_X, LEG_Y + dy, -LEG_W * 0.5 - 0.005);
                  g.add(stripe);
                });
              });
            } else if (kind === 'charmander_legs' || kind === 'charizard_legs') {
              // Cream belly cover on upper thighs
              const cover = new THREE.Mesh(
                new THREE.SphereGeometry(0.34, 20, 14),
                accMat.clone()
              );
              cover.scale.set(1.05, 0.55, 0.5);
              cover.position.set(0, LEG_Y + LEG_H / 2 - 0.02, 0.14);
              g.add(cover);
            } else if (kind === 'squirtle_legs') {
              // Cream plastron on the front of thighs
              const cover = new THREE.Mesh(
                new THREE.SphereGeometry(0.3, 18, 14),
                accMat.clone()
              );
              cover.scale.set(1.0, 0.6, 0.4);
              cover.position.set(0, LEG_Y + LEG_H / 2 - 0.02, 0.16);
              g.add(cover);
            } else if (kind === 'bulbasaur_legs') {
              // Dark green spots on the thighs
              const darkMat = new THREE.MeshStandardMaterial({
                color: accent ?? new THREE.Color('#166534'),
              });
              [-1, 1].forEach((sx) => {
                [0.18, 0].forEach((dy) => {
                  const spot = new THREE.Mesh(
                    new THREE.SphereGeometry(0.06, 12, 10),
                    darkMat.clone()
                  );
                  spot.scale.set(1.2, 0.8, 0.3);
                  spot.position.set(sx * LEG_X, LEG_Y + dy, 0.16);
                  g.add(spot);
                });
              });
            } else if (kind === 'eevee_legs') {
              // Fluffy cream ruff sitting just above the legs
              for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                const puff = new THREE.Mesh(
                  new THREE.SphereGeometry(0.08, 12, 10), accMat.clone());
                puff.position.set(
                  Math.cos(a) * 0.28,
                  LEG_Y + LEG_H / 2 - 0.04,
                  Math.sin(a) * 0.24
                );
                g.add(puff);
              }
            } else if (kind === 'jigglypuff_legs') {
              // Just short round leg nubs (Jigglypuff has tiny legs) —
              // shrink the base cylinders by adding an overlay sphere seat
              const seat = new THREE.Mesh(
                new THREE.SphereGeometry(0.38, 20, 14),
                bodyMat.clone()
              );
              seat.scale.set(1.1, 0.6, 1.05);
              seat.position.set(0, LEG_Y + LEG_H / 2, 0);
              g.add(seat);
            } else if (kind === 'psyduck_legs') {
              // Cream belly + orange feet-hint (webbed feet ankle bands)
              const cream = new THREE.Mesh(
                new THREE.SphereGeometry(0.3, 18, 14),
                new THREE.MeshStandardMaterial({ color: '#fef3c7' })
              );
              cream.scale.set(1.0, 0.6, 0.4);
              cream.position.set(0, LEG_Y + LEG_H / 2 - 0.04, 0.14);
              g.add(cream);
              [-1, 1].forEach((sx) => {
                const cuff = new THREE.Mesh(
                  new THREE.TorusGeometry(LEG_W * 0.85, 0.03, 8, 16),
                  accMat.clone()
                );
                cuff.rotation.x = Math.PI / 2;
                cuff.position.set(sx * LEG_X, LEG_Y - LEG_H / 2 + 0.02, 0);
                g.add(cuff);
              });
            } else if (kind === 'snorlax_legs') {
              // Dark navy belly patch on top (Snorlax's back/thigh top)
              const dark = new THREE.Mesh(
                new THREE.SphereGeometry(0.36, 20, 14),
                accMat.clone()
              );
              dark.scale.set(1.2, 0.55, 0.6);
              dark.position.set(0, LEG_Y + LEG_H / 2, -0.02);
              g.add(dark);
            } else if (kind === 'gengar_legs') {
              // Very short stubby dark-purple leg nubs — overlay round seat
              const seat = new THREE.Mesh(
                new THREE.SphereGeometry(0.36, 20, 14),
                bodyMat.clone()
              );
              seat.scale.set(1.15, 0.65, 1.0);
              seat.position.set(0, LEG_Y + LEG_H / 2 - 0.02, 0);
              g.add(seat);
              // Purple back-spike tufts sticking out
              [-0.2, 0.2].forEach((dx) => {
                const spike = new THREE.Mesh(
                  new THREE.ConeGeometry(0.05, 0.14, 4),
                  bodyMat.clone()
                );
                spike.rotation.x = -Math.PI / 2;
                spike.position.set(dx, LEG_Y + 0.1, -0.24);
                g.add(spike);
              });
            } else if (kind === 'mew_legs') {
              // Small curled legs — soft pink hint of cream belly
              const belly = new THREE.Mesh(
                new THREE.SphereGeometry(0.24, 18, 14),
                accMat.clone()
              );
              belly.scale.set(1.0, 0.5, 0.4);
              belly.position.set(0, LEG_Y + LEG_H / 2 - 0.04, 0.14);
              g.add(belly);
            }
          } else if (kind === 'lugia_legs') {
            // Lugia — white legs with pale-blue upper thighs and navy claw
            // marks at the ankles. Wider stance and slightly curved (bird
            // dinosaur legs).
            const whiteMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.5,
            });
            const bellyMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#bfdbfe'),
              roughness: 0.55,
            });
            const navyMat = new THREE.MeshStandardMaterial({
              color: '#1e3a8a', roughness: 0.5,
            });
            [-1, 1].forEach((sx) => {
              const thigh = new THREE.Mesh(
                new THREE.CylinderGeometry(LEG_W * 0.7, LEG_W * 0.85, LEG_H * 0.5, 14),
                bellyMat.clone()
              );
              thigh.position.set(sx * LEG_X, LEG_Y + LEG_H * 0.2, 0);
              g.add(thigh);
              const shin = new THREE.Mesh(
                new THREE.CylinderGeometry(LEG_W * 0.6, LEG_W * 0.75, LEG_H * 0.55, 14),
                whiteMat.clone()
              );
              shin.position.set(sx * LEG_X, LEG_Y - LEG_H * 0.2, 0);
              g.add(shin);
              // Navy ankle ring
              const ring = new THREE.Mesh(
                new THREE.TorusGeometry(LEG_W * 0.6, 0.025, 8, 16),
                navyMat.clone()
              );
              ring.rotation.x = Math.PI / 2;
              ring.position.set(sx * LEG_X, LEG_Y - LEG_H * 0.5, 0);
              g.add(ring);
            });
          } else {
            [-1, 1].forEach((sx) => {
              const leg = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.05, LEG_H + 0.02, LEG_W + 0.05),
                matB.clone()
              );
              leg.position.set(sx * LEG_X, LEG_Y, 0);
              g.add(leg);
            });
          }
          break;
        }
        case 'hat': {
          const kind =
            item.kind ?? (item.shape === 'crown' ? 'crown' : 'cap');
          const hatBaseY = HEAD_Y + HEAD_SIZE / 2;

          if (kind === 'tiara') {
            // Thin gold band around the forehead with 3 small spires/gems
            // along the front arc.
            const goldMat = new THREE.MeshStandardMaterial({
              color,
              metalness: 0.7,
              roughness: 0.2,
            });
            const band = new THREE.Mesh(
              new THREE.TorusGeometry(0.34, 0.025, 12, 32),
              goldMat
            );
            band.rotation.x = Math.PI / 2;
            band.position.set(0, hatBaseY + 0.04, 0);
            g.add(band);
            const gemColor = accent ?? new THREE.Color('#ec4899');
            const gemMat = new THREE.MeshStandardMaterial({
              color: gemColor,
              emissive: gemColor,
              emissiveIntensity: 0.4,
              metalness: 0.4,
              roughness: 0.3,
            });
            [-0.13, 0, 0.13].forEach((dx, i) => {
              const h = i === 1 ? 0.14 : 0.1;
              const spire = new THREE.Mesh(
                new THREE.ConeGeometry(0.04, h, 6),
                goldMat.clone()
              );
              spire.position.set(dx, hatBaseY + 0.04 + h / 2, 0.31);
              g.add(spire);
              const gem = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.045),
                gemMat.clone()
              );
              gem.position.set(dx, hatBaseY + 0.04 + h + 0.03, 0.31);
              g.add(gem);
            });
            break;
          }

          if (kind === 'flower_crown') {
            // Green vine wreath ringed with alternating small flowers.
            const vineMat = new THREE.MeshStandardMaterial({ color: '#16a34a' });
            const vine = new THREE.Mesh(
              new THREE.TorusGeometry(0.36, 0.028, 12, 28),
              vineMat
            );
            vine.rotation.x = Math.PI / 2;
            vine.position.set(0, hatBaseY + 0.02, 0);
            g.add(vine);
            const palette = [
              color,
              accent ?? new THREE.Color('#ffffff'),
              new THREE.Color('#fde047'),
            ];
            const N = 8;
            for (let i = 0; i < N; i++) {
              const a = (i / N) * Math.PI * 2;
              const px = Math.cos(a) * 0.36;
              const pz = Math.sin(a) * 0.36;
              const pc = palette[i % palette.length];
              const flower = new THREE.Mesh(
                new THREE.SphereGeometry(0.07, 12, 10),
                new THREE.MeshStandardMaterial({ color: pc, roughness: 0.7 })
              );
              flower.scale.set(1, 0.55, 1);
              flower.position.set(px, hatBaseY + 0.06, pz);
              g.add(flower);
              const center = new THREE.Mesh(
                new THREE.SphereGeometry(0.025, 8, 8),
                new THREE.MeshStandardMaterial({ color: '#fde047' })
              );
              center.position.set(px, hatBaseY + 0.1, pz);
              g.add(center);
            }
            break;
          }

          if (kind === 'princess_crown') {
            // Tall jeweled gold crown with 5 spires arched across the front
            // of the head — center spire tallest for a fairy-tale silhouette.
            const goldMat = new THREE.MeshStandardMaterial({
              color,
              metalness: 0.6,
              roughness: 0.3,
            });
            const band = new THREE.Mesh(
              new THREE.CylinderGeometry(0.36, 0.38, 0.16, 24, 1, true),
              goldMat
            );
            band.position.set(0, hatBaseY + 0.09, 0);
            g.add(band);
            // Decorative gem strip on band front
            const gemColor = accent ?? new THREE.Color('#ec4899');
            const gemMat = new THREE.MeshStandardMaterial({
              color: gemColor,
              emissive: gemColor,
              emissiveIntensity: 0.45,
              metalness: 0.4,
              roughness: 0.3,
            });
            const bandGem = new THREE.Mesh(
              new THREE.OctahedronGeometry(0.05),
              gemMat.clone()
            );
            bandGem.position.set(0, hatBaseY + 0.09, 0.37);
            g.add(bandGem);
            // Spires arched along the front 180° of the band
            const N = 5;
            for (let i = 0; i < N; i++) {
              const t = i / (N - 1) - 0.5;
              const a = Math.PI / 2 + t * (Math.PI * 0.9);
              const px = Math.cos(a) * 0.37;
              const pz = Math.sin(a) * 0.37;
              const h = i === Math.floor(N / 2) ? 0.32 : 0.22;
              const spire = new THREE.Mesh(
                new THREE.ConeGeometry(0.05, h, 5),
                goldMat.clone()
              );
              spire.position.set(px, hatBaseY + 0.17 + h / 2, pz);
              g.add(spire);
              const tipGem = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.045),
                gemMat.clone()
              );
              tipGem.position.set(px, hatBaseY + 0.17 + h + 0.02, pz);
              g.add(tipGem);
            }
            break;
          }

          if (kind === 'elsa_crown') {
            // Angular icy crystal spires + cyan gems on a thin band.
            const iceMat = new THREE.MeshStandardMaterial({
              color,
              metalness: 0.5,
              roughness: 0.2,
              emissive: new THREE.Color(color.getHex()).multiplyScalar(0.15),
            });
            const gemMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#38bdf8'),
              emissive: accent ?? new THREE.Color('#0ea5e9'),
              emissiveIntensity: 0.5,
              metalness: 0.6,
              roughness: 0.15,
            });
            const band = new THREE.Mesh(
              new THREE.TorusGeometry(0.36, 0.02, 12, 32),
              iceMat
            );
            band.rotation.x = Math.PI / 2;
            band.position.set(0, hatBaseY + 0.04, 0);
            g.add(band);
            const N = 5;
            for (let i = 0; i < N; i++) {
              const t = i / (N - 1) - 0.5;
              const a = Math.PI / 2 + t * (Math.PI * 0.85);
              const px = Math.cos(a) * 0.36;
              const pz = Math.sin(a) * 0.36;
              const h = i === Math.floor(N / 2) ? 0.3 : 0.2;
              const spire = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.05),
                iceMat.clone()
              );
              spire.scale.set(0.6, h * 4, 0.6);
              spire.position.set(px, hatBaseY + 0.04 + h / 2, pz);
              g.add(spire);
              const gem = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.04),
                gemMat.clone()
              );
              gem.position.set(px, hatBaseY + 0.04 + h + 0.04, pz);
              g.add(gem);
            }
            break;
          }

          if (kind === 'belle_bow') {
            // Layered red rose with green leaves pinned to the side of head.
            const roseMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
            const leafMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#16a34a'),
            });
            const side = 1;
            const baseX = side * (HEAD_SIZE / 2 + 0.02);
            const baseY = hatBaseY - 0.05;
            const baseZ = 0.08;
            [0.1, 0.075, 0.05].forEach((r, i) => {
              const petal = new THREE.Mesh(
                new THREE.SphereGeometry(r, 12, 10),
                roseMat.clone()
              );
              petal.scale.set(1, 0.7, 1);
              petal.position.set(baseX + i * 0.01, baseY + i * 0.025, baseZ + i * 0.01);
              g.add(petal);
            });
            [-1, 1].forEach((dy) => {
              const leaf = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.04, 0.02),
                leafMat.clone()
              );
              leaf.rotation.z = dy * 0.5;
              leaf.position.set(baseX - 0.08, baseY + dy * 0.05, baseZ);
              g.add(leaf);
            });
            break;
          }

          if (kind === 'ariel_shell') {
            // Small pink seashell hair clip on top of the head.
            const shellMat = new THREE.MeshStandardMaterial({
              color,
              roughness: 0.4,
              metalness: 0.2,
            });
            const ridgeMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#f472b6'),
            });
            const shell = new THREE.Mesh(
              new THREE.SphereGeometry(0.13, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
              shellMat
            );
            shell.scale.set(1, 0.7, 1);
            shell.position.set(0, hatBaseY + 0.08, 0.22);
            shell.rotation.x = -Math.PI / 3;
            g.add(shell);
            for (let i = -2; i <= 2; i++) {
              const ang = i * 0.25;
              const ridge = new THREE.Mesh(
                new THREE.BoxGeometry(0.01, 0.13, 0.01),
                ridgeMat.clone()
              );
              ridge.rotation.z = ang;
              ridge.position.set(Math.sin(ang) * 0.05, hatBaseY + 0.1, 0.25);
              g.add(ridge);
            }
            break;
          }

          if (kind === 'crown') {
            const mat = new THREE.MeshStandardMaterial({
              color,
              metalness: 0.5,
              roughness: 0.35,
            });
            const band = new THREE.Mesh(
              new THREE.BoxGeometry(HEAD_SIZE + 0.12, 0.18, HEAD_SIZE + 0.12),
              mat
            );
            band.position.set(0, hatBaseY + 0.1, 0);
            g.add(band);
            for (let i = 0; i < 5; i++) {
              const angle = (i / 5) * Math.PI * 2;
              const spike = new THREE.Mesh(
                new THREE.ConeGeometry(0.08, 0.24, 4),
                mat.clone()
              );
              spike.position.set(
                Math.cos(angle) * (HEAD_SIZE / 2),
                hatBaseY + 0.32,
                Math.sin(angle) * (HEAD_SIZE / 2)
              );
              g.add(spike);
            }
            const gem = new THREE.Mesh(
              new THREE.OctahedronGeometry(0.07),
              new THREE.MeshStandardMaterial({
                color: '#ef4444',
                emissive: '#ef4444',
                emissiveIntensity: 0.4,
              })
            );
            gem.position.set(0, hatBaseY + 0.1, HEAD_SIZE / 2 + 0.05);
            g.add(gem);
          } else if (kind === 'cap') {
            const mat = new THREE.MeshStandardMaterial({ color });
            const dome = new THREE.Mesh(
              new THREE.SphereGeometry(
                HEAD_SIZE / 2 + 0.06,
                18,
                12,
                0,
                Math.PI * 2,
                0,
                Math.PI / 2
              ),
              mat
            );
            dome.position.set(0, hatBaseY - 0.04, 0);
            g.add(dome);
            const brim = new THREE.Mesh(
              new THREE.BoxGeometry(HEAD_SIZE * 0.95, 0.05, 0.42),
              mat.clone()
            );
            brim.position.set(0, hatBaseY - 0.06, FACE_Z + 0.04);
            g.add(brim);
            // Tiny button on top
            const btn = new THREE.Mesh(
              new THREE.SphereGeometry(0.04, 10, 10),
              new THREE.MeshStandardMaterial({ color: '#ffffff' })
            );
            btn.position.set(0, hatBaseY + 0.42, 0);
            g.add(btn);
          } else if (kind === 'beanie') {
            const mat = new THREE.MeshStandardMaterial({ color });
            const beanie = new THREE.Mesh(
              new THREE.SphereGeometry(
                HEAD_SIZE / 2 + 0.08,
                18,
                14,
                0,
                Math.PI * 2,
                0,
                Math.PI * 0.6
              ),
              mat
            );
            beanie.position.set(0, hatBaseY - 0.18, 0);
            g.add(beanie);
            // cuff/band at base
            const band = new THREE.Mesh(
              new THREE.CylinderGeometry(
                HEAD_SIZE / 2 + 0.09,
                HEAD_SIZE / 2 + 0.09,
                0.1,
                20
              ),
              mat.clone()
            );
            band.position.set(0, hatBaseY - 0.16, 0);
            g.add(band);
            // pom-pom
            const pom = new THREE.Mesh(
              new THREE.SphereGeometry(0.11, 14, 14),
              new THREE.MeshStandardMaterial({ color: '#ffffff' })
            );
            pom.position.set(0, hatBaseY + 0.32, 0);
            g.add(pom);
          } else if (kind === 'tophat') {
            const mat = new THREE.MeshStandardMaterial({ color });
            const cyl = new THREE.Mesh(
              new THREE.CylinderGeometry(0.36, 0.36, 0.55, 24),
              mat
            );
            cyl.position.set(0, hatBaseY + 0.32, 0);
            g.add(cyl);
            const brim = new THREE.Mesh(
              new THREE.CylinderGeometry(0.55, 0.55, 0.05, 24),
              mat.clone()
            );
            brim.position.set(0, hatBaseY + 0.04, 0);
            g.add(brim);
            const ribbon = new THREE.Mesh(
              new THREE.CylinderGeometry(0.37, 0.37, 0.08, 24),
              new THREE.MeshStandardMaterial({ color: '#dc2626' })
            );
            ribbon.position.set(0, hatBaseY + 0.1, 0);
            g.add(ribbon);
          } else if (kind === 'wizard' || kind === 'witch') {
            const mat = new THREE.MeshStandardMaterial({ color });
            const brimR = kind === 'witch' ? 0.7 : 0.42;
            const cone = new THREE.Mesh(
              new THREE.ConeGeometry(0.34, 1.0, 24),
              mat
            );
            cone.position.set(0, hatBaseY + 0.55, 0);
            // tilt slightly forward for whimsy
            cone.rotation.x = -0.1;
            g.add(cone);
            const brim = new THREE.Mesh(
              new THREE.CylinderGeometry(brimR, brimR, 0.04, 28),
              mat.clone()
            );
            brim.position.set(0, hatBaseY + 0.04, 0);
            g.add(brim);
            if (kind === 'wizard') {
              for (let i = 0; i < 7; i++) {
                const a = (i / 7) * Math.PI * 2;
                const t = i / 7;
                const star = new THREE.Mesh(
                  new THREE.IcosahedronGeometry(0.04),
                  new THREE.MeshStandardMaterial({
                    color: '#fde047',
                    emissive: '#fde047',
                    emissiveIntensity: 0.8,
                  })
                );
                const r = 0.32 - t * 0.22;
                star.position.set(
                  Math.cos(a) * r,
                  hatBaseY + 0.25 + t * 0.7,
                  Math.sin(a) * r
                );
                g.add(star);
              }
            } else {
              const buckle = new THREE.Mesh(
                new THREE.BoxGeometry(0.18, 0.12, 0.04),
                new THREE.MeshStandardMaterial({
                  color: '#fbbf24',
                  metalness: 0.6,
                  roughness: 0.3,
                })
              );
              buckle.position.set(0, hatBaseY + 0.18, brimR - 0.02);
              g.add(buckle);
            }
          } else if (kind === 'cowboy') {
            const mat = new THREE.MeshStandardMaterial({ color });
            const crown = new THREE.Mesh(
              new THREE.CylinderGeometry(0.32, 0.36, 0.42, 18),
              mat
            );
            crown.position.set(0, hatBaseY + 0.24, 0);
            g.add(crown);
            // pinched top crease
            const crease = new THREE.Mesh(
              new THREE.BoxGeometry(0.06, 0.16, 0.5),
              mat.clone()
            );
            crease.position.set(0, hatBaseY + 0.42, 0);
            g.add(crease);
            const brim = new THREE.Mesh(
              new THREE.CylinderGeometry(0.62, 0.62, 0.04, 28),
              mat.clone()
            );
            brim.position.set(0, hatBaseY + 0.05, 0);
            brim.scale.set(1, 1, 0.85);
            g.add(brim);
            const band = new THREE.Mesh(
              new THREE.CylinderGeometry(0.34, 0.34, 0.06, 18),
              new THREE.MeshStandardMaterial({ color: '#7c2d12' })
            );
            band.position.set(0, hatBaseY + 0.1, 0);
            g.add(band);
          } else if (kind === 'sunhat') {
            const mat = new THREE.MeshStandardMaterial({ color });
            const crown = new THREE.Mesh(
              new THREE.CylinderGeometry(0.3, 0.32, 0.22, 24),
              mat
            );
            crown.position.set(0, hatBaseY + 0.14, 0);
            g.add(crown);
            const brim = new THREE.Mesh(
              new THREE.CylinderGeometry(0.72, 0.72, 0.03, 32),
              mat.clone()
            );
            brim.position.set(0, hatBaseY + 0.04, 0);
            g.add(brim);
            const ribbon = new THREE.Mesh(
              new THREE.CylinderGeometry(0.32, 0.32, 0.06, 24),
              new THREE.MeshStandardMaterial({ color: '#ffffff' })
            );
            ribbon.position.set(0, hatBaseY + 0.06, 0);
            g.add(ribbon);
            // bow
            const bow = new THREE.Mesh(
              new THREE.SphereGeometry(0.06, 12, 12),
              new THREE.MeshStandardMaterial({ color: '#ffffff' })
            );
            bow.scale.set(1.6, 0.7, 0.7);
            bow.position.set(0, hatBaseY + 0.06, 0.32);
            g.add(bow);
          } else if (kind === 'pumpkin') {
            const pumpMat = new THREE.MeshStandardMaterial({
              color,
              roughness: 0.55,
            });
            const dome = new THREE.Mesh(
              new THREE.SphereGeometry(
                HEAD_SIZE / 2 + 0.16,
                22,
                16,
                0,
                Math.PI * 2,
                0,
                Math.PI * 0.7
              ),
              pumpMat
            );
            dome.position.set(0, hatBaseY - 0.18, 0);
            g.add(dome);
            const ridgeMat = new THREE.MeshStandardMaterial({
              color: '#c2410c',
            });
            for (let i = 0; i < 6; i++) {
              const angle = (i / 6) * Math.PI * 2;
              const ridge = new THREE.Mesh(
                new THREE.BoxGeometry(0.05, 0.55, 0.05),
                ridgeMat.clone()
              );
              ridge.position.set(
                Math.cos(angle) * (HEAD_SIZE / 2 + 0.16),
                hatBaseY + 0.06,
                Math.sin(angle) * (HEAD_SIZE / 2 + 0.16)
              );
              g.add(ridge);
            }
            // stem
            const stem = new THREE.Mesh(
              new THREE.CylinderGeometry(0.06, 0.09, 0.2, 8),
              new THREE.MeshStandardMaterial({ color: '#15803d' })
            );
            stem.position.set(0, hatBaseY + 0.4, 0);
            stem.rotation.z = 0.15;
            g.add(stem);
            // leaf
            const leaf = new THREE.Mesh(
              new THREE.BoxGeometry(0.22, 0.04, 0.12),
              new THREE.MeshStandardMaterial({ color: '#16a34a' })
            );
            leaf.rotation.z = 0.4;
            leaf.position.set(0.1, hatBaseY + 0.42, 0.04);
            g.add(leaf);
          } else if (kind === 'robot') {
            // Boxy helmet
            const helmetMat = new THREE.MeshStandardMaterial({
              color,
              metalness: 0.8,
              roughness: 0.25,
            });
            const helmet = new THREE.Mesh(
              new THREE.BoxGeometry(HEAD_SIZE + 0.12, HEAD_SIZE * 0.55, HEAD_SIZE + 0.12),
              helmetMat
            );
            helmet.position.set(0, hatBaseY + 0.18, 0);
            g.add(helmet);
            // Visor strip (dark glass)
            const visor = new THREE.Mesh(
              new THREE.BoxGeometry(HEAD_SIZE + 0.08, HEAD_SIZE * 0.18, 0.03),
              new THREE.MeshStandardMaterial({ color: '#0f172a' })
            );
            visor.position.set(0, hatBaseY + 0.16, HEAD_SIZE / 2 + 0.07);
            g.add(visor);
            // Cyan visor glow
            const glowMat = new THREE.MeshStandardMaterial({
              color: '#22d3ee',
              emissive: '#22d3ee',
              emissiveIntensity: 0.8,
            });
            const glow = new THREE.Mesh(
              new THREE.BoxGeometry(HEAD_SIZE - 0.06, 0.03, 0.02),
              glowMat
            );
            glow.position.set(0, hatBaseY + 0.16, HEAD_SIZE / 2 + 0.09);
            g.add(glow);
            // Side bolts
            [-1, 1].forEach((sx) => {
              const bolt = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 0.08, 12),
                new THREE.MeshStandardMaterial({
                  color: '#475569',
                  metalness: 0.9,
                  roughness: 0.15,
                })
              );
              bolt.rotation.z = Math.PI / 2;
              bolt.position.set(sx * (HEAD_SIZE / 2 + 0.07), hatBaseY + 0.05, 0);
              g.add(bolt);
            });
            // Antenna with red blinker
            const antennaMat = new THREE.MeshStandardMaterial({
              color: '#1e293b',
              metalness: 0.7,
              roughness: 0.3,
            });
            const antenna = new THREE.Mesh(
              new THREE.CylinderGeometry(0.025, 0.025, 0.32, 8),
              antennaMat
            );
            antenna.position.set(0, hatBaseY + 0.62, 0);
            g.add(antenna);
            const blinkerColor = accent ? new THREE.Color(accent) : new THREE.Color('#ef4444');
            const blinker = new THREE.Mesh(
              new THREE.SphereGeometry(0.06, 14, 14),
              new THREE.MeshStandardMaterial({
                color: blinkerColor,
                emissive: blinkerColor,
                emissiveIntensity: 1.0,
              })
            );
            blinker.position.set(0, hatBaseY + 0.82, 0);
            g.add(blinker);
          }
          break;
        }
        case 'mask': {
          const kind = item.kind ?? 'ironman';
          if (kind === 'ironman') {
            const armorMat = new THREE.MeshStandardMaterial({
              color,
              metalness: 0,
              roughness: 0.55,
              emissive: new THREE.Color(color.getHex()).multiplyScalar(0.02),
            });
            const goldColor = accent ?? new THREE.Color('#fbbf24');
            const goldMat = new THREE.MeshStandardMaterial({
              color: goldColor,
              metalness: 0,
              roughness: 0.5,
              emissive: new THREE.Color(goldColor.getHex()).multiplyScalar(0.025),
            });
            // Faceplate covering the whole front of the head
            const facePlate = new THREE.Mesh(
              new THREE.BoxGeometry(HEAD_SIZE + 0.04, HEAD_SIZE * 0.95, 0.08),
              armorMat
            );
            facePlate.position.set(0, HEAD_Y, FACE_Z + 0.04);
            g.add(facePlate);
            // Pointed chin block (jaw)
            const jaw = new THREE.Mesh(
              new THREE.BoxGeometry(HEAD_SIZE * 0.55, 0.18, 0.1),
              armorMat.clone()
            );
            jaw.position.set(0, HEAD_Y - HEAD_SIZE * 0.42, FACE_Z + 0.08);
            g.add(jaw);
            // Forehead V triangle — large gold piece spanning the whole
            // upper face, matching the Mark III helmet's signature shape.
            const vShape = new THREE.Shape();
            vShape.moveTo(-0.34, 0.14);
            vShape.lineTo(-0.28, 0.04);
            vShape.lineTo(0, -0.18);
            vShape.lineTo(0.28, 0.04);
            vShape.lineTo(0.34, 0.14);
            vShape.lineTo(0.18, 0.16);
            vShape.lineTo(0, 0.04);
            vShape.lineTo(-0.18, 0.16);
            vShape.lineTo(-0.34, 0.14);
            const vTri = new THREE.Mesh(
              new THREE.ExtrudeGeometry(vShape, { depth: 0.05, bevelEnabled: false }),
              goldMat.clone()
            );
            vTri.position.set(0, HEAD_Y + HEAD_SIZE * 0.22, FACE_Z + 0.1);
            g.add(vTri);
            // Two glowing eye slits
            const eyeMat = new THREE.MeshStandardMaterial({
              color: '#fef9c3',
              emissive: '#facc15',
              emissiveIntensity: 1.5,
            });
            [-1, 1].forEach((sx) => {
              const eye = new THREE.Mesh(
                new THREE.BoxGeometry(0.17, 0.05, 0.02),
                eyeMat.clone()
              );
              eye.position.set(sx * 0.16, HEAD_Y + 0.03, FACE_Z + 0.11);
              g.add(eye);
            });
            // Vertical mouth slats (helmet vents)
            const ventMat = new THREE.MeshStandardMaterial({ color: '#1e1b1b' });
            for (let i = -2; i <= 2; i++) {
              const slat = new THREE.Mesh(
                new THREE.BoxGeometry(0.02, 0.08, 0.02),
                ventMat.clone()
              );
              slat.position.set(i * 0.05, HEAD_Y - HEAD_SIZE * 0.3, FACE_Z + 0.11);
              g.add(slat);
            }
            // Side gold cheek strips
            [-1, 1].forEach((sx) => {
              const cheek = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.32, 0.04),
                goldMat.clone()
              );
              cheek.position.set(sx * (HEAD_SIZE / 2 + 0.02), HEAD_Y - 0.04, FACE_Z + 0.09);
              g.add(cheek);
            });
          } else if (
            kind === 'batman' ||
            kind === 'captain_america' ||
            kind === 'thor' ||
            kind === 'flash' ||
            kind === 'panther' ||
            kind === 'wolverine' ||
            kind === 'starlord' ||
            kind === 'antman' ||
            kind === 'war_machine' ||
            kind === 'vision' ||
            kind === 'daredevil' ||
            kind === 'falcon' ||
            kind === 'venom' ||
            kind === 'ghost_rider'
          ) {
            const baseMat = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
            const trimMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#f8fafc'),
              metalness: kind === 'thor' ? 0.5 : 0.2,
              roughness: 0.35,
            });
            const cover = new THREE.Mesh(
              new THREE.BoxGeometry(HEAD_SIZE + 0.05, HEAD_SIZE + 0.05, HEAD_SIZE + 0.05),
              baseMat
            );
            cover.position.set(0, HEAD_Y, 0);
            g.add(cover);

            if (kind === 'batman') {
              // Pointy bat ears on top
              [-1, 1].forEach((sx) => {
                const ear = new THREE.Mesh(
                  new THREE.ConeGeometry(0.07, 0.28, 4),
                  baseMat.clone()
                );
                ear.position.set(sx * 0.18, HEAD_Y + HEAD_SIZE / 2 + 0.14, 0);
                g.add(ear);
              });
              // White slit eyes
              [-1, 1].forEach((sx) => {
                const slit = new THREE.Mesh(
                  new THREE.BoxGeometry(0.18, 0.05, 0.02),
                  new THREE.MeshStandardMaterial({
                    color: '#f8fafc',
                    emissive: '#cbd5e1',
                    emissiveIntensity: 0.5,
                  })
                );
                slit.position.set(sx * 0.18, HEAD_Y + 0.08, FACE_Z + 0.05);
                slit.rotation.z = sx * -0.15;
                g.add(slit);
              });
              // Lower jaw exposed (skin)
              const jaw = new THREE.Mesh(
                new THREE.BoxGeometry(HEAD_SIZE * 0.7, 0.2, 0.04),
                new THREE.MeshStandardMaterial({ color: SKIN })
              );
              jaw.position.set(0, HEAD_Y - HEAD_SIZE * 0.32, FACE_Z + 0.05);
              g.add(jaw);
              // Frowning mouth on jaw
              const mouth = new THREE.Mesh(
                new THREE.BoxGeometry(0.18, 0.02, 0.02),
                new THREE.MeshStandardMaterial({ color: '#1f2937' })
              );
              mouth.position.set(0, HEAD_Y - HEAD_SIZE * 0.36, FACE_Z + 0.07);
              g.add(mouth);
            } else if (kind === 'captain_america') {
              // White A on forehead
              const aShape = new THREE.Shape();
              aShape.moveTo(-0.1, -0.1);
              aShape.lineTo(0, 0.1);
              aShape.lineTo(0.1, -0.1);
              aShape.lineTo(0.06, -0.1);
              aShape.lineTo(0.04, -0.04);
              aShape.lineTo(-0.04, -0.04);
              aShape.lineTo(-0.06, -0.1);
              aShape.closePath();
              const aMesh = new THREE.Mesh(
                new THREE.ExtrudeGeometry(aShape, { depth: 0.025, bevelEnabled: false }),
                trimMat.clone()
              );
              aMesh.position.set(0, HEAD_Y + 0.16, FACE_Z + 0.03);
              g.add(aMesh);
              // White side wings
              [-1, 1].forEach((sx) => {
                const wing = new THREE.Mesh(
                  new THREE.BoxGeometry(0.14, 0.18, 0.04),
                  trimMat.clone()
                );
                wing.position.set(sx * (HEAD_SIZE / 2 + 0.04), HEAD_Y + 0.12, FACE_Z - 0.05);
                wing.rotation.z = sx * -0.35;
                g.add(wing);
              });
              // Eye holes (skin showing through)
              [-1, 1].forEach((sx) => {
                const hole = new THREE.Mesh(
                  new THREE.BoxGeometry(0.13, 0.08, 0.02),
                  new THREE.MeshStandardMaterial({ color: SKIN })
                );
                hole.position.set(sx * 0.18, HEAD_Y + 0.02, FACE_Z + 0.04);
                g.add(hole);
                const pupil = new THREE.Mesh(
                  new THREE.SphereGeometry(0.03, 10, 10),
                  new THREE.MeshStandardMaterial({ color: EYE_DARK })
                );
                pupil.position.set(sx * 0.18, HEAD_Y + 0.02, FACE_Z + 0.06);
                g.add(pupil);
              });
              // Lower face exposed
              const jaw2 = new THREE.Mesh(
                new THREE.BoxGeometry(HEAD_SIZE * 0.7, 0.22, 0.04),
                new THREE.MeshStandardMaterial({ color: SKIN })
              );
              jaw2.position.set(0, HEAD_Y - HEAD_SIZE * 0.3, FACE_Z + 0.05);
              g.add(jaw2);
              const smile = new THREE.Mesh(
                new THREE.TorusGeometry(0.06, 0.018, 6, 14, Math.PI),
                new THREE.MeshStandardMaterial({ color: MOUTH })
              );
              smile.rotation.z = Math.PI;
              smile.position.set(0, HEAD_Y - HEAD_SIZE * 0.32, FACE_Z + 0.07);
              g.add(smile);
            } else if (kind === 'thor') {
              // Metallic helmet with side wings and a forehead gem
              const helmMat = new THREE.MeshStandardMaterial({
                color,
                metalness: 0.6,
                roughness: 0.3,
              });
              cover.material = helmMat;
              // Top crest ridge
              const crest = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, 0.16, HEAD_SIZE + 0.08),
                helmMat.clone()
              );
              crest.position.set(0, HEAD_Y + HEAD_SIZE / 2 + 0.04, 0);
              g.add(crest);
              // Side wings
              [-1, 1].forEach((sx) => {
                const wing = new THREE.Mesh(
                  new THREE.BoxGeometry(0.22, 0.18, 0.04),
                  helmMat.clone()
                );
                wing.position.set(sx * (HEAD_SIZE / 2 + 0.08), HEAD_Y + 0.18, 0);
                wing.rotation.z = sx * -0.5;
                g.add(wing);
                const wingTip = new THREE.Mesh(
                  new THREE.ConeGeometry(0.05, 0.16, 4),
                  helmMat.clone()
                );
                wingTip.position.set(sx * (HEAD_SIZE / 2 + 0.22), HEAD_Y + 0.3, 0);
                wingTip.rotation.z = sx * -0.9;
                g.add(wingTip);
              });
              // Forehead gem
              const gem = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.05),
                trimMat.clone()
              );
              gem.position.set(0, HEAD_Y + 0.18, FACE_Z + 0.04);
              g.add(gem);
              // Eye holes
              [-1, 1].forEach((sx) => {
                const hole = new THREE.Mesh(
                  new THREE.BoxGeometry(0.12, 0.08, 0.02),
                  new THREE.MeshStandardMaterial({ color: SKIN })
                );
                hole.position.set(sx * 0.18, HEAD_Y + 0.02, FACE_Z + 0.03);
                g.add(hole);
                const pupil = new THREE.Mesh(
                  new THREE.SphereGeometry(0.03, 10, 10),
                  new THREE.MeshStandardMaterial({ color: EYE_DARK })
                );
                pupil.position.set(sx * 0.18, HEAD_Y + 0.02, FACE_Z + 0.05);
                g.add(pupil);
              });
              // Lower face skin
              const jaw3 = new THREE.Mesh(
                new THREE.BoxGeometry(HEAD_SIZE * 0.7, 0.2, 0.04),
                new THREE.MeshStandardMaterial({ color: SKIN })
              );
              jaw3.position.set(0, HEAD_Y - HEAD_SIZE * 0.3, FACE_Z + 0.05);
              g.add(jaw3);
              // Blonde beard hint
              const beard = new THREE.Mesh(
                new THREE.BoxGeometry(0.4, 0.08, 0.04),
                new THREE.MeshStandardMaterial({ color: '#facc15' })
              );
              beard.position.set(0, HEAD_Y - HEAD_SIZE * 0.4, FACE_Z + 0.06);
              g.add(beard);
            } else if (kind === 'flash') {
              // White eye lenses
              [-1, 1].forEach((sx) => {
                const lens = new THREE.Mesh(
                  new THREE.BoxGeometry(0.16, 0.1, 0.02),
                  new THREE.MeshStandardMaterial({
                    color: '#f8fafc',
                    emissive: '#cbd5e1',
                    emissiveIntensity: 0.5,
                  })
                );
                lens.position.set(sx * 0.19, HEAD_Y + 0.06, FACE_Z + 0.04);
                g.add(lens);
              });
              // Gold lightning bolt ear pieces
              [-1, 1].forEach((sx) => {
                const earBolt1 = new THREE.Mesh(
                  new THREE.BoxGeometry(0.05, 0.1, 0.04),
                  trimMat.clone()
                );
                earBolt1.rotation.z = sx * -0.5;
                earBolt1.position.set(
                  sx * (HEAD_SIZE / 2 + 0.05),
                  HEAD_Y + 0.05,
                  0
                );
                g.add(earBolt1);
                const earBolt2 = new THREE.Mesh(
                  new THREE.BoxGeometry(0.05, 0.1, 0.04),
                  trimMat.clone()
                );
                earBolt2.rotation.z = sx * 0.5;
                earBolt2.position.set(
                  sx * (HEAD_SIZE / 2 + 0.08),
                  HEAD_Y - 0.05,
                  0
                );
                g.add(earBolt2);
              });
              // Lower face skin
              const jaw4 = new THREE.Mesh(
                new THREE.BoxGeometry(HEAD_SIZE * 0.7, 0.22, 0.04),
                new THREE.MeshStandardMaterial({ color: SKIN })
              );
              jaw4.position.set(0, HEAD_Y - HEAD_SIZE * 0.3, FACE_Z + 0.05);
              g.add(jaw4);
              const smile2 = new THREE.Mesh(
                new THREE.TorusGeometry(0.06, 0.018, 6, 14, Math.PI),
                new THREE.MeshStandardMaterial({ color: MOUTH })
              );
              smile2.rotation.z = Math.PI;
              smile2.position.set(0, HEAD_Y - HEAD_SIZE * 0.32, FACE_Z + 0.07);
              g.add(smile2);
            } else if (kind === 'panther') {
              // Pointy cat ears
              [-1, 1].forEach((sx) => {
                const ear = new THREE.Mesh(
                  new THREE.ConeGeometry(0.08, 0.18, 4),
                  baseMat.clone()
                );
                ear.position.set(sx * 0.18, HEAD_Y + HEAD_SIZE / 2 + 0.1, 0);
                g.add(ear);
              });
              // Silver fierce eyes
              [-1, 1].forEach((sx) => {
                const eye = new THREE.Mesh(
                  new THREE.BoxGeometry(0.14, 0.06, 0.02),
                  new THREE.MeshStandardMaterial({
                    color: '#f8fafc',
                    emissive: '#cbd5e1',
                    emissiveIntensity: 0.6,
                  })
                );
                eye.position.set(sx * 0.18, HEAD_Y + 0.06, FACE_Z + 0.04);
                eye.rotation.z = sx * -0.25;
                g.add(eye);
              });
              // Silver claw marks on cheeks
              [-1, 1].forEach((sx) => {
                [-0.04, 0, 0.04].forEach((dy) => {
                  const claw = new THREE.Mesh(
                    new THREE.BoxGeometry(0.06, 0.012, 0.015),
                    trimMat.clone()
                  );
                  claw.position.set(sx * 0.25, HEAD_Y - 0.1 + dy, FACE_Z + 0.04);
                  claw.rotation.z = sx * 0.25;
                  g.add(claw);
                });
              });
              // Mouth slit
              const mouthP = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.02, 0.02),
                trimMat.clone()
              );
              mouthP.position.set(0, HEAD_Y - 0.25, FACE_Z + 0.04);
              g.add(mouthP);
            } else if (kind === 'wolverine') {
              // Yellow cowl + 2 tall pointy black "ears" (Wolverine mask)
              [-1, 1].forEach((sx) => {
                const ear = new THREE.Mesh(
                  new THREE.ConeGeometry(0.1, 0.35, 4),
                  new THREE.MeshStandardMaterial({ color: accent ?? '#0a0a0a' })
                );
                ear.rotation.z = sx * 0.4;
                ear.position.set(sx * 0.28, HEAD_Y + HEAD_SIZE / 2 + 0.16, 0);
                g.add(ear);
              });
              // Black eye mask shape around eye area
              const mask = new THREE.Mesh(
                new THREE.BoxGeometry(HEAD_SIZE + 0.04, 0.18, 0.04),
                new THREE.MeshStandardMaterial({ color: accent ?? '#0a0a0a' })
              );
              mask.position.set(0, HEAD_Y + 0.06, FACE_Z + 0.03);
              g.add(mask);
              [-1, 1].forEach((sx) => {
                const eye = new THREE.Mesh(
                  new THREE.BoxGeometry(0.14, 0.07, 0.02),
                  new THREE.MeshStandardMaterial({ color: '#f8fafc' })
                );
                eye.position.set(sx * 0.18, HEAD_Y + 0.06, FACE_Z + 0.06);
                eye.rotation.z = sx * -0.2;
                g.add(eye);
              });
              // Skin lower face
              const jaw = new THREE.Mesh(
                new THREE.BoxGeometry(HEAD_SIZE * 0.75, 0.24, 0.04),
                new THREE.MeshStandardMaterial({ color: SKIN })
              );
              jaw.position.set(0, HEAD_Y - HEAD_SIZE * 0.28, FACE_Z + 0.05);
              g.add(jaw);
            } else if (kind === 'starlord') {
              // Red metallic helmet + glowing red horizontal eye slits + mouthplate
              const goldMat = new THREE.MeshStandardMaterial({
                color: accent ?? '#fbbf24', metalness: 0.6, roughness: 0.3,
              });
              cover.material = new THREE.MeshStandardMaterial({
                color, metalness: 0.7, roughness: 0.25,
              });
              // Glowing eye slits
              [-1, 1].forEach((sx) => {
                const eye = new THREE.Mesh(
                  new THREE.BoxGeometry(0.18, 0.05, 0.02),
                  new THREE.MeshStandardMaterial({
                    color: '#fee2e2', emissive: '#dc2626', emissiveIntensity: 1.4,
                  })
                );
                eye.position.set(sx * 0.18, HEAD_Y + 0.06, FACE_Z + 0.05);
                g.add(eye);
              });
              // Mouth plate (gold)
              const mouthPlate = new THREE.Mesh(
                new THREE.BoxGeometry(HEAD_SIZE * 0.7, 0.18, 0.04),
                goldMat
              );
              mouthPlate.position.set(0, HEAD_Y - HEAD_SIZE * 0.3, FACE_Z + 0.04);
              g.add(mouthPlate);
              // Horizontal mouth slits
              for (let i = -2; i <= 2; i++) {
                const slat = new THREE.Mesh(
                  new THREE.BoxGeometry(HEAD_SIZE * 0.6, 0.012, 0.02),
                  new THREE.MeshStandardMaterial({ color: '#1f2937' })
                );
                slat.position.set(0, HEAD_Y - HEAD_SIZE * 0.3 + i * 0.025, FACE_Z + 0.06);
                g.add(slat);
              }
            } else if (kind === 'antman') {
              // Red helmet + 2 antennae sticking up
              const antMat = new THREE.MeshStandardMaterial({ color: accent ?? '#0a0a0a' });
              // Two curved antennae
              [-1, 1].forEach((sx) => {
                const ant = new THREE.Mesh(
                  new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8),
                  antMat.clone()
                );
                ant.rotation.z = sx * -0.3;
                ant.position.set(sx * 0.16, HEAD_Y + HEAD_SIZE / 2 + 0.15, 0);
                g.add(ant);
                // Tiny bead at the tip
                const bead = new THREE.Mesh(
                  new THREE.SphereGeometry(0.025, 10, 8),
                  new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 })
                );
                bead.position.set(sx * 0.22, HEAD_Y + HEAD_SIZE / 2 + 0.3, 0);
                g.add(bead);
              });
              // Black eye lenses
              [-1, 1].forEach((sx) => {
                const eye = new THREE.Mesh(
                  new THREE.BoxGeometry(0.16, 0.1, 0.02),
                  antMat.clone()
                );
                eye.position.set(sx * 0.18, HEAD_Y + 0.05, FACE_Z + 0.04);
                g.add(eye);
              });
              // Bottom mouth slit
              const mouth = new THREE.Mesh(
                new THREE.BoxGeometry(0.36, 0.05, 0.04),
                antMat.clone()
              );
              mouth.position.set(0, HEAD_Y - HEAD_SIZE * 0.3, FACE_Z + 0.04);
              g.add(mouth);
            } else if (kind === 'war_machine') {
              // Gray faceplate + red eye slits + side details
              cover.material = new THREE.MeshStandardMaterial({
                color, metalness: 0.7, roughness: 0.25,
              });
              const darkMat = new THREE.MeshStandardMaterial({
                color: '#1e293b', metalness: 0.85,
              });
              // Red glowing eye slits
              [-1, 1].forEach((sx) => {
                const eye = new THREE.Mesh(
                  new THREE.BoxGeometry(0.17, 0.05, 0.02),
                  new THREE.MeshStandardMaterial({
                    color: '#fee2e2', emissive: accent ?? '#dc2626', emissiveIntensity: 1.4,
                  })
                );
                eye.position.set(sx * 0.18, HEAD_Y + 0.04, FACE_Z + 0.05);
                g.add(eye);
              });
              // Mouth grille
              for (let i = -2; i <= 2; i++) {
                const slat = new THREE.Mesh(
                  new THREE.BoxGeometry(0.02, 0.1, 0.02),
                  darkMat.clone()
                );
                slat.position.set(i * 0.05, HEAD_Y - HEAD_SIZE * 0.3, FACE_Z + 0.05);
                g.add(slat);
              }
              // Top crest
              const crest = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, 0.16, HEAD_SIZE * 0.6),
                cover.material
              );
              crest.position.set(0, HEAD_Y + HEAD_SIZE / 2 + 0.05, 0);
              g.add(crest);
            } else if (kind === 'vision') {
              // Red face + yellow Mind Stone on forehead
              cover.material = new THREE.MeshStandardMaterial({
                color, metalness: 0.5, roughness: 0.4,
                emissive: new THREE.Color(color.getHex()).multiplyScalar(0.08),
              });
              // Yellow Mind Stone
              const stone = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.08),
                new THREE.MeshStandardMaterial({
                  color: accent ?? '#fde047',
                  emissive: accent ?? '#facc15', emissiveIntensity: 1.2,
                  metalness: 0.4, roughness: 0.15,
                })
              );
              stone.position.set(0, HEAD_Y + 0.22, FACE_Z + 0.05);
              g.add(stone);
              // Yellow eyes
              [-1, 1].forEach((sx) => {
                const eye = new THREE.Mesh(
                  new THREE.BoxGeometry(0.12, 0.06, 0.02),
                  new THREE.MeshStandardMaterial({
                    color: '#fef3c7', emissive: '#fde047', emissiveIntensity: 0.6,
                  })
                );
                eye.position.set(sx * 0.18, HEAD_Y + 0.04, FACE_Z + 0.04);
                g.add(eye);
              });
              // Subtle mouth line
              const mouthV = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.02, 0.02),
                new THREE.MeshStandardMaterial({ color: '#7f1d1d' })
              );
              mouthV.position.set(0, HEAD_Y - HEAD_SIZE * 0.28, FACE_Z + 0.04);
              g.add(mouthV);
            } else if (kind === 'daredevil') {
              // Red cowl + 2 SHORT HORNS on top
              const darkMat = new THREE.MeshStandardMaterial({ color: accent ?? '#0a0a0a' });
              // Horns
              [-1, 1].forEach((sx) => {
                const horn = new THREE.Mesh(
                  new THREE.ConeGeometry(0.06, 0.18, 4),
                  new THREE.MeshStandardMaterial({ color })
                );
                horn.position.set(sx * 0.16, HEAD_Y + HEAD_SIZE / 2 + 0.1, 0);
                g.add(horn);
              });
              // Dark eye area (mask)
              const eyeMask = new THREE.Mesh(
                new THREE.BoxGeometry(HEAD_SIZE + 0.04, 0.16, 0.04),
                darkMat.clone()
              );
              eyeMask.position.set(0, HEAD_Y + 0.06, FACE_Z + 0.03);
              g.add(eyeMask);
              // Red glowing eye slits in the dark mask
              [-1, 1].forEach((sx) => {
                const eye = new THREE.Mesh(
                  new THREE.BoxGeometry(0.14, 0.04, 0.02),
                  new THREE.MeshStandardMaterial({
                    color: '#fee2e2', emissive: color, emissiveIntensity: 1.0,
                  })
                );
                eye.position.set(sx * 0.18, HEAD_Y + 0.06, FACE_Z + 0.06);
                g.add(eye);
              });
              // Frowning mouth
              const dMouth = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.02, 0.02),
                darkMat.clone()
              );
              dMouth.position.set(0, HEAD_Y - 0.22, FACE_Z + 0.04);
              g.add(dMouth);
            } else if (kind === 'falcon') {
              // Red tactical helmet + large dark goggles
              const goggleMat = new THREE.MeshStandardMaterial({
                color: '#1f2937', metalness: 0.6, roughness: 0.2,
              });
              const goldMat = new THREE.MeshStandardMaterial({
                color: accent ?? '#fbbf24', metalness: 0.6,
              });
              // Large goggle band across eyes
              const goggle = new THREE.Mesh(
                new THREE.BoxGeometry(HEAD_SIZE + 0.06, 0.18, 0.06),
                goggleMat
              );
              goggle.position.set(0, HEAD_Y + 0.06, FACE_Z + 0.04);
              g.add(goggle);
              // Gold accent line
              const goldLine = new THREE.Mesh(
                new THREE.BoxGeometry(HEAD_SIZE + 0.04, 0.02, 0.04),
                goldMat
              );
              goldLine.position.set(0, HEAD_Y + 0.12, FACE_Z + 0.07);
              g.add(goldLine);
              // Reflective eyes inside goggles
              [-1, 1].forEach((sx) => {
                const eye = new THREE.Mesh(
                  new THREE.BoxGeometry(0.12, 0.05, 0.02),
                  new THREE.MeshStandardMaterial({
                    color: '#f8fafc', emissive: '#cbd5e1', emissiveIntensity: 0.6,
                  })
                );
                eye.position.set(sx * 0.18, HEAD_Y + 0.06, FACE_Z + 0.08);
                g.add(eye);
              });
              // Lower face skin
              const jawF = new THREE.Mesh(
                new THREE.BoxGeometry(HEAD_SIZE * 0.7, 0.22, 0.04),
                new THREE.MeshStandardMaterial({ color: SKIN })
              );
              jawF.position.set(0, HEAD_Y - HEAD_SIZE * 0.3, FACE_Z + 0.05);
              g.add(jawF);
            } else if (kind === 'venom') {
              // Black symbiote head + huge white slit eyes + WHITE TEETH grin
              const whiteMat = new THREE.MeshStandardMaterial({
                color: accent ?? '#f8fafc',
                emissive: '#e2e8f0', emissiveIntensity: 0.15,
              });
              // Big tilted white slit eyes
              [-1, 1].forEach((sx) => {
                const eye = new THREE.Mesh(
                  new THREE.BoxGeometry(0.3, 0.16, 0.03),
                  whiteMat.clone()
                );
                eye.position.set(sx * 0.18, HEAD_Y + 0.1, FACE_Z + 0.05);
                eye.rotation.z = sx * -0.32;
                g.add(eye);
              });
              // White teeth row (gritted grin)
              const mouthV = new THREE.Mesh(
                new THREE.BoxGeometry(HEAD_SIZE + 0.02, 0.2, 0.04),
                whiteMat.clone()
              );
              mouthV.position.set(0, HEAD_Y - 0.18, FACE_Z + 0.04);
              g.add(mouthV);
              // Teeth dividers (vertical black lines)
              for (let i = -4; i <= 4; i++) {
                const div = new THREE.Mesh(
                  new THREE.BoxGeometry(0.018, 0.18, 0.02),
                  new THREE.MeshStandardMaterial({ color })
                );
                div.position.set(i * 0.05, HEAD_Y - 0.18, FACE_Z + 0.06);
                g.add(div);
              }
              // Tongue hint
              const tongue = new THREE.Mesh(
                new THREE.BoxGeometry(0.16, 0.04, 0.04),
                new THREE.MeshStandardMaterial({ color: '#dc2626' })
              );
              tongue.position.set(0, HEAD_Y - 0.27, FACE_Z + 0.05);
              g.add(tongue);
            } else if (kind === 'ghost_rider') {
              // White flaming skull + hollow eye sockets + flames
              const skullMat = new THREE.MeshStandardMaterial({
                color, metalness: 0.05, roughness: 0.7,
                emissive: new THREE.Color('#f8fafc').multiplyScalar(0.05),
              });
              cover.material = skullMat;
              // Hollow black eye sockets
              [-1, 1].forEach((sx) => {
                const socket = new THREE.Mesh(
                  new THREE.SphereGeometry(0.08, 12, 10),
                  new THREE.MeshStandardMaterial({ color: '#0a0a0a' })
                );
                socket.scale.set(1, 1, 0.4);
                socket.position.set(sx * 0.16, HEAD_Y + 0.06, FACE_Z + 0.02);
                g.add(socket);
              });
              // Toothy grin
              const teeth = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.06, 0.04),
                skullMat.clone()
              );
              teeth.position.set(0, HEAD_Y - 0.16, FACE_Z + 0.03);
              g.add(teeth);
              for (let i = -3; i <= 3; i++) {
                const div = new THREE.Mesh(
                  new THREE.BoxGeometry(0.014, 0.06, 0.02),
                  new THREE.MeshStandardMaterial({ color: '#0a0a0a' })
                );
                div.position.set(i * 0.046, HEAD_Y - 0.16, FACE_Z + 0.05);
                g.add(div);
              }
              // Orange flames around skull (cones around the top/sides)
              const flameMat = new THREE.MeshStandardMaterial({
                color: accent ?? '#fb923c',
                emissive: '#f97316', emissiveIntensity: 1.0,
              });
              [-0.3, -0.15, 0, 0.15, 0.3].forEach((dx, i) => {
                const h = 0.18 + (i % 2) * 0.1;
                const flame = new THREE.Mesh(
                  new THREE.ConeGeometry(0.07, h, 5),
                  flameMat.clone()
                );
                flame.position.set(dx, HEAD_Y + HEAD_SIZE / 2 + h / 2, 0);
                g.add(flame);
              });
            }
          } else if (kind === 'charmander_face') {
            // Charmander — reddish-orange rounded head with a forward-jutting
            // muzzle, teal eyes (Charmander's signature), tiny nostrils, and a
            // small side-fang smile. No head bumps (Charmander is smooth-headed).
            const orangeMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.55,
            });
            const creamMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#fef3c7'),
              roughness: 0.7,
            });
            // Rounded head, slightly wider than tall (not boxy)
            const cover = new THREE.Mesh(
              new THREE.SphereGeometry(HEAD_SIZE * 0.6, 24, 20),
              orangeMat.clone()
            );
            cover.scale.set(1.15, 1.0, 1.05);
            cover.position.set(0, HEAD_Y, 0);
            g.add(cover);
            // Forward-jutting rounded muzzle (Charmander's snout wraps around)
            const snout = new THREE.Mesh(
              new THREE.SphereGeometry(0.16, 16, 12),
              orangeMat.clone()
            );
            snout.scale.set(1.1, 0.75, 1.0);
            snout.position.set(0, HEAD_Y - 0.1, FACE_Z + 0.03);
            g.add(snout);
            // Cream lower jaw
            const jaw = new THREE.Mesh(
              new THREE.SphereGeometry(0.12, 14, 10),
              creamMat.clone()
            );
            jaw.scale.set(1.1, 0.55, 0.8);
            jaw.position.set(0, HEAD_Y - 0.17, FACE_Z + 0.02);
            g.add(jaw);
            // Teal iris eyes (Charmander's real eye color) with black pupil
            // and white catchlight
            const tealMat = new THREE.MeshStandardMaterial({
              color: '#14b8a6', emissive: '#0d9488', emissiveIntensity: 0.25,
            });
            [-1, 1].forEach((sx) => {
              const white = new THREE.Mesh(
                new THREE.SphereGeometry(0.062, 14, 10),
                new THREE.MeshStandardMaterial({ color: '#f8fafc' })
              );
              white.scale.set(1, 1.2, 0.6);
              white.position.set(sx * 0.14, HEAD_Y + 0.08, FACE_Z + 0.04);
              g.add(white);
              const iris = new THREE.Mesh(
                new THREE.SphereGeometry(0.04, 12, 10),
                tealMat.clone()
              );
              iris.scale.set(1, 1.15, 0.5);
              iris.position.set(sx * 0.14, HEAD_Y + 0.08, FACE_Z + 0.08);
              g.add(iris);
              const pupil = new THREE.Mesh(
                new THREE.SphereGeometry(0.018, 8, 8),
                new THREE.MeshStandardMaterial({ color: '#0a0a0a' })
              );
              pupil.position.set(sx * 0.14, HEAD_Y + 0.08, FACE_Z + 0.11);
              g.add(pupil);
              const hl = new THREE.Mesh(
                new THREE.SphereGeometry(0.012, 8, 6),
                new THREE.MeshStandardMaterial({
                  color: '#f8fafc', emissive: '#f8fafc', emissiveIntensity: 0.8,
                })
              );
              hl.position.set(sx * 0.14 + 0.015, HEAD_Y + 0.1, FACE_Z + 0.13);
              g.add(hl);
            });
            // Tiny nostrils on the snout
            [-1, 1].forEach((sx) => {
              const nostril = new THREE.Mesh(
                new THREE.SphereGeometry(0.008, 6, 6),
                new THREE.MeshStandardMaterial({ color: '#0a0a0a' })
              );
              nostril.position.set(sx * 0.025, HEAD_Y - 0.08, FACE_Z + 0.19);
              g.add(nostril);
            });
            // Small side-fang mouth (one visible fang on the corner)
            const mouth = new THREE.Mesh(
              new THREE.TorusGeometry(0.045, 0.012, 6, 12, Math.PI * 0.7),
              new THREE.MeshStandardMaterial({ color: '#7f1d1d' })
            );
            mouth.rotation.z = Math.PI;
            mouth.position.set(0.015, HEAD_Y - 0.13, FACE_Z + 0.19);
            g.add(mouth);
            const fang = new THREE.Mesh(
              new THREE.ConeGeometry(0.012, 0.03, 3),
              new THREE.MeshStandardMaterial({ color: '#f8fafc' })
            );
            fang.position.set(0.04, HEAD_Y - 0.135, FACE_Z + 0.2);
            g.add(fang);
          } else if (kind === 'squirtle_face') {
            // Squirtle — sky-blue round head with side-fin "ears", cream
            // ridge above the brow (unique to Squirtle), warm brown eyes,
            // and the signature curled (^_^) smile with a small beak.
            const skyMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.5,
            });
            const creamMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#fef3c7'),
              roughness: 0.65,
            });
            const cover = new THREE.Mesh(
              new THREE.SphereGeometry(HEAD_SIZE * 0.62, 24, 20),
              skyMat.clone()
            );
            cover.scale.set(1.08, 1.0, 1.02);
            cover.position.set(0, HEAD_Y, 0);
            g.add(cover);
            // Side-fin "ears" — flat blue triangular fins sticking out to the sides
            [-1, 1].forEach((sx) => {
              const fin = new THREE.Mesh(
                new THREE.ConeGeometry(0.09, 0.16, 3),
                skyMat.clone()
              );
              fin.rotation.z = sx * Math.PI / 2;
              fin.rotation.y = sx * -0.3;
              fin.scale.set(1, 1, 0.4);
              fin.position.set(sx * 0.34, HEAD_Y + 0.05, -0.02);
              g.add(fin);
            });
            // Cream brow ridge (Squirtle has a light band across the forehead)
            const brow = new THREE.Mesh(
              new THREE.TorusGeometry(0.19, 0.03, 8, 20, Math.PI * 0.9),
              creamMat.clone()
            );
            brow.rotation.z = Math.PI;
            brow.rotation.x = 0.2;
            brow.position.set(0, HEAD_Y + 0.05, FACE_Z + 0.02);
            g.add(brow);
            // Warm brown eyes (Squirtle's real eye color) with white highlight
            const brownEyeMat = new THREE.MeshStandardMaterial({
              color: '#78350f', emissive: '#78350f', emissiveIntensity: 0.15,
            });
            [-1, 1].forEach((sx) => {
              const white = new THREE.Mesh(
                new THREE.SphereGeometry(0.075, 14, 10),
                new THREE.MeshStandardMaterial({ color: '#f8fafc' })
              );
              white.scale.set(1, 1.2, 0.5);
              white.position.set(sx * 0.14, HEAD_Y + 0.07, FACE_Z + 0.04);
              g.add(white);
              const iris = new THREE.Mesh(
                new THREE.SphereGeometry(0.048, 12, 10),
                brownEyeMat.clone()
              );
              iris.scale.set(1, 1.15, 0.5);
              iris.position.set(sx * 0.14, HEAD_Y + 0.07, FACE_Z + 0.07);
              g.add(iris);
              const pupil = new THREE.Mesh(
                new THREE.SphereGeometry(0.02, 8, 8),
                new THREE.MeshStandardMaterial({ color: '#0a0a0a' })
              );
              pupil.position.set(sx * 0.14, HEAD_Y + 0.07, FACE_Z + 0.1);
              g.add(pupil);
              const hl = new THREE.Mesh(
                new THREE.SphereGeometry(0.014, 8, 6),
                new THREE.MeshStandardMaterial({
                  color: '#f8fafc', emissive: '#f8fafc', emissiveIntensity: 0.9,
                })
              );
              hl.position.set(sx * 0.14 + 0.018, HEAD_Y + 0.095, FACE_Z + 0.12);
              g.add(hl);
            });
            // Small pointed beak
            const beak = new THREE.Mesh(
              new THREE.ConeGeometry(0.05, 0.06, 3),
              creamMat.clone()
            );
            beak.rotation.x = Math.PI / 2;
            beak.position.set(0, HEAD_Y - 0.09, FACE_Z + 0.16);
            g.add(beak);
            // Curled (^_^) mouth — two arcs turning up at corners
            [-1, 1].forEach((sx) => {
              const smilePart = new THREE.Mesh(
                new THREE.TorusGeometry(0.04, 0.014, 6, 12, Math.PI * 0.7),
                new THREE.MeshStandardMaterial({ color: '#0a0a0a' })
              );
              smilePart.rotation.z = sx * -0.6;
              smilePart.position.set(sx * 0.05, HEAD_Y - 0.14, FACE_Z + 0.14);
              g.add(smilePart);
            });
          } else if (kind === 'bulbasaur_face') {
            // Bulbasaur — turquoise-green head with dark-green splotches, pointy
            // ears, red eyes with VERTICAL SLIT pupils (Bulbasaur's signature),
            // wide open grin with fangs, and the bulb + leaflets on top.
            const greenMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.55,
            });
            const darkGreen = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#166534'),
              roughness: 0.6,
            });
            const bulbMat = new THREE.MeshStandardMaterial({
              color: '#65a30d', roughness: 0.5,
            });
            const cover = new THREE.Mesh(
              new THREE.SphereGeometry(HEAD_SIZE * 0.6, 24, 20),
              greenMat.clone()
            );
            cover.scale.set(1.15, 0.95, 1.05);
            cover.position.set(0, HEAD_Y, 0);
            g.add(cover);
            // Small pointed ears (green, tipped forward)
            [-1, 1].forEach((sx) => {
              const ear = new THREE.Mesh(
                new THREE.ConeGeometry(0.06, 0.14, 4),
                greenMat.clone()
              );
              ear.rotation.z = sx * -0.5;
              ear.rotation.x = -0.2;
              ear.position.set(sx * 0.24, HEAD_Y + HEAD_SIZE / 2 - 0.04, 0.02);
              g.add(ear);
            });
            // Dark-green splotches on the cheeks/side of the head
            [-1, 1].forEach((sx) => {
              const spot = new THREE.Mesh(
                new THREE.SphereGeometry(0.06, 12, 10),
                darkGreen.clone()
              );
              spot.scale.set(1.2, 0.9, 0.3);
              spot.position.set(sx * 0.28, HEAD_Y + 0.02, 0.14);
              g.add(spot);
              const spot2 = new THREE.Mesh(
                new THREE.SphereGeometry(0.045, 10, 8),
                darkGreen.clone()
              );
              spot2.scale.set(1, 1, 0.3);
              spot2.position.set(sx * 0.22, HEAD_Y - 0.08, 0.18);
              g.add(spot2);
            });
            // Red eyes with vertical SLIT pupils (Bulbasaur's iconic look)
            [-1, 1].forEach((sx) => {
              const eye = new THREE.Mesh(
                new THREE.SphereGeometry(0.07, 14, 12),
                new THREE.MeshStandardMaterial({
                  color: '#ef4444', emissive: '#dc2626', emissiveIntensity: 0.4,
                })
              );
              eye.scale.set(1, 1.35, 0.7);
              eye.position.set(sx * 0.14, HEAD_Y + 0.07, FACE_Z + 0.03);
              g.add(eye);
              // Vertical slit pupil — tall, thin box
              const pupil = new THREE.Mesh(
                new THREE.BoxGeometry(0.012, 0.07, 0.01),
                new THREE.MeshStandardMaterial({ color: '#0a0a0a' })
              );
              pupil.position.set(sx * 0.14, HEAD_Y + 0.07, FACE_Z + 0.09);
              g.add(pupil);
              // Tiny white highlight
              const hl = new THREE.Mesh(
                new THREE.SphereGeometry(0.01, 6, 6),
                new THREE.MeshStandardMaterial({
                  color: '#f8fafc', emissive: '#f8fafc', emissiveIntensity: 0.9,
                })
              );
              hl.position.set(sx * 0.14 + 0.02, HEAD_Y + 0.09, FACE_Z + 0.1);
              g.add(hl);
            });
            // Wide open grin
            const mouth = new THREE.Mesh(
              new THREE.SphereGeometry(0.11, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
              new THREE.MeshStandardMaterial({ color: '#7f1d1d' })
            );
            mouth.rotation.x = Math.PI / 2;
            mouth.scale.set(1.3, 0.35, 0.7);
            mouth.position.set(0, HEAD_Y - 0.11, FACE_Z + 0.05);
            g.add(mouth);
            // Tiny fangs at mouth corners (Bulbasaur has visible small fangs)
            [-1, 1].forEach((sx) => {
              const fang = new THREE.Mesh(
                new THREE.ConeGeometry(0.012, 0.03, 3),
                new THREE.MeshStandardMaterial({ color: '#f8fafc' })
              );
              fang.position.set(sx * 0.09, HEAD_Y - 0.13, FACE_Z + 0.08);
              g.add(fang);
            });
            // Green bulb on top of the head (turquoise-tinted like the real one)
            const bulb = new THREE.Mesh(
              new THREE.SphereGeometry(0.14, 16, 14),
              bulbMat
            );
            bulb.position.set(0, HEAD_Y + HEAD_SIZE / 2 + 0.04, -0.06);
            g.add(bulb);
            // Bulb has ridges/segments (small darker rings around it)
            const bulbRing = new THREE.Mesh(
              new THREE.TorusGeometry(0.13, 0.015, 8, 20),
              darkGreen.clone()
            );
            bulbRing.rotation.x = 0.4;
            bulbRing.position.set(0, HEAD_Y + HEAD_SIZE / 2 + 0.04, -0.06);
            g.add(bulbRing);
            // 3 leaflets fanning out from the bulb
            [-0.5, 0, 0.5].forEach((angle) => {
              const leaf = new THREE.Mesh(
                new THREE.ConeGeometry(0.045, 0.12, 4),
                bulbMat.clone()
              );
              leaf.rotation.z = angle;
              leaf.position.set(
                Math.sin(angle) * 0.08,
                HEAD_Y + HEAD_SIZE / 2 + 0.19,
                -0.06
              );
              g.add(leaf);
            });
          } else if (kind === 'eevee_face') {
            // Eevee — light brown fluffy head with a slight foxy muzzle, tall
            // pointed ears with dark-brown insides, WARM BROWN eyes (not black,
            // Eevee's real irises), tiny pink nose, and a big fluffy cream ruff.
            const brownMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.75,
            });
            const darkBrownMat = new THREE.MeshStandardMaterial({
              color: '#78350f', roughness: 0.75,
            });
            const ruffMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#fef3c7'),
              roughness: 0.9,
            });
            const cover = new THREE.Mesh(
              new THREE.SphereGeometry(HEAD_SIZE * 0.58, 24, 20),
              brownMat.clone()
            );
            cover.scale.set(1.08, 0.95, 1.05);
            cover.position.set(0, HEAD_Y, 0);
            g.add(cover);
            // Slight foxy muzzle (pointed forward)
            const muzzle = new THREE.Mesh(
              new THREE.SphereGeometry(0.13, 16, 12),
              brownMat.clone()
            );
            muzzle.scale.set(1.0, 0.7, 0.8);
            muzzle.position.set(0, HEAD_Y - 0.08, FACE_Z + 0.04);
            g.add(muzzle);
            // Tall pointy ears — brown outside, DARK brown inside (not cream)
            [-1, 1].forEach((sx) => {
              const ear = new THREE.Mesh(
                new THREE.ConeGeometry(0.12, 0.42, 5),
                brownMat.clone()
              );
              ear.rotation.z = sx * 0.28;
              ear.position.set(sx * 0.23, HEAD_Y + HEAD_SIZE / 2 + 0.12, 0);
              g.add(ear);
              // Dark brown inside (Eevee's inner ear is darker brown, not cream)
              const innerEar = new THREE.Mesh(
                new THREE.ConeGeometry(0.07, 0.3, 4),
                darkBrownMat.clone()
              );
              innerEar.rotation.z = sx * 0.28;
              innerEar.position.set(sx * 0.25, HEAD_Y + HEAD_SIZE / 2 + 0.14, 0.04);
              g.add(innerEar);
            });
            // Warm brown eyes with black pupils + shiny highlight
            const eyeMat = new THREE.MeshStandardMaterial({
              color: '#78350f', emissive: '#451a03', emissiveIntensity: 0.2,
            });
            [-1, 1].forEach((sx) => {
              const white = new THREE.Mesh(
                new THREE.SphereGeometry(0.075, 14, 10),
                new THREE.MeshStandardMaterial({ color: '#fef3c7' })
              );
              white.scale.set(1, 1.2, 0.5);
              white.position.set(sx * 0.15, HEAD_Y + 0.06, FACE_Z + 0.03);
              g.add(white);
              const iris = new THREE.Mesh(
                new THREE.SphereGeometry(0.055, 14, 10),
                eyeMat.clone()
              );
              iris.scale.set(1, 1.2, 0.5);
              iris.position.set(sx * 0.15, HEAD_Y + 0.06, FACE_Z + 0.06);
              g.add(iris);
              const pupil = new THREE.Mesh(
                new THREE.SphereGeometry(0.022, 8, 8),
                new THREE.MeshStandardMaterial({ color: '#0a0a0a' })
              );
              pupil.position.set(sx * 0.15, HEAD_Y + 0.06, FACE_Z + 0.09);
              g.add(pupil);
              const hl = new THREE.Mesh(
                new THREE.SphereGeometry(0.016, 8, 6),
                new THREE.MeshStandardMaterial({
                  color: '#f8fafc', emissive: '#f8fafc', emissiveIntensity: 0.9,
                })
              );
              hl.position.set(sx * 0.15 + 0.02, HEAD_Y + 0.09, FACE_Z + 0.11);
              g.add(hl);
            });
            // Small pink triangular nose (Eevee's nose is pink/dark, not black)
            const nose = new THREE.Mesh(
              new THREE.ConeGeometry(0.028, 0.04, 3),
              new THREE.MeshStandardMaterial({ color: '#78350f' })
            );
            nose.rotation.x = Math.PI;
            nose.position.set(0, HEAD_Y - 0.08, FACE_Z + 0.17);
            g.add(nose);
            // Small "W" mouth (Eevee's characteristic mouth shape)
            [-1, 1].forEach((sx) => {
              const m = new THREE.Mesh(
                new THREE.TorusGeometry(0.03, 0.011, 6, 12, Math.PI * 0.75),
                new THREE.MeshStandardMaterial({ color: '#0a0a0a' })
              );
              m.rotation.z = Math.PI + sx * 0.3;
              m.position.set(sx * 0.03, HEAD_Y - 0.14, FACE_Z + 0.15);
              g.add(m);
            });
            // Fluffy cream ruff around the neck
            for (let i = 0; i < 10; i++) {
              const angle = (i / 10) * Math.PI * 2;
              const puff = new THREE.Mesh(
                new THREE.SphereGeometry(0.09, 12, 10),
                ruffMat.clone()
              );
              puff.position.set(
                Math.cos(angle) * 0.3,
                HEAD_Y - HEAD_SIZE / 2 - 0.02,
                Math.sin(angle) * 0.3
              );
              g.add(puff);
            }
          } else if (kind === 'pikachu_face') {
            // Pikachu — bright-yellow rounded head, tall black-tipped ears
            // (with brown ear-bases, one of Pikachu's real details), round
            // red cheek pouches, big shiny eyes, and open smile with pink tongue.
            const yellowMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
            const blackMat = new THREE.MeshStandardMaterial({ color: '#0a0a0a' });
            const redMat = new THREE.MeshStandardMaterial({ color: accent ?? '#dc2626' });
            const brownMat = new THREE.MeshStandardMaterial({ color: '#78350f' });
            const pinkMat = new THREE.MeshStandardMaterial({ color: '#fb7185', roughness: 0.6 });
            const whiteMat = new THREE.MeshStandardMaterial({
              color: '#f8fafc', emissive: '#f8fafc', emissiveIntensity: 0.7,
            });
            const cover = new THREE.Mesh(new THREE.SphereGeometry(HEAD_SIZE * 0.58, 24, 20), yellowMat.clone());
            cover.scale.set(1.15, 0.95, 1.0);
            cover.position.set(0, HEAD_Y, 0);
            g.add(cover);
            // Ears: yellow cone with brown base ring + black tip
            [-1, 1].forEach((sx) => {
              const ear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.48, 6), yellowMat.clone());
              ear.rotation.z = sx * 0.32;
              ear.position.set(sx * 0.22, HEAD_Y + HEAD_SIZE / 2 + 0.18, 0);
              g.add(ear);
              // Brown ring at the ear base (real Pikachu has darker fur at ear roots)
              const earBase = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), brownMat.clone());
              earBase.scale.set(1, 0.35, 1);
              earBase.position.set(sx * 0.18, HEAD_Y + HEAD_SIZE / 2 + 0.04, 0);
              g.add(earBase);
              // Black tip (top ~35% of ear)
              const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 6), blackMat.clone());
              tip.rotation.z = sx * 0.32;
              tip.position.set(sx * 0.29, HEAD_Y + HEAD_SIZE / 2 + 0.35, 0);
              g.add(tip);
              // Red cheek pouch — perfectly round
              const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.078, 14, 12), redMat.clone());
              cheek.scale.set(1, 1, 0.35);
              cheek.position.set(sx * 0.28, HEAD_Y - 0.04, FACE_Z + 0.02);
              g.add(cheek);
              // Eye — solid black oval with shine
              const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), blackMat.clone());
              eye.scale.set(1, 1.2, 0.7);
              eye.position.set(sx * 0.14, HEAD_Y + 0.08, FACE_Z + 0.03);
              g.add(eye);
              const hl = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), whiteMat.clone());
              hl.position.set(sx * 0.14 + 0.02, HEAD_Y + 0.11, FACE_Z + 0.08);
              g.add(hl);
            });
            // Open smile — small "3" shape mouth (Pikachu's iconic mouth)
            [-1, 1].forEach((sx) => {
              const half = new THREE.Mesh(
                new THREE.TorusGeometry(0.028, 0.011, 6, 12, Math.PI * 0.8),
                blackMat.clone()
              );
              half.rotation.z = sx * -Math.PI / 2 + Math.PI / 2;
              half.position.set(sx * 0.028, HEAD_Y - 0.13, FACE_Z + 0.05);
              g.add(half);
            });
            // Pink tongue inside
            const tongue = new THREE.Mesh(
              new THREE.SphereGeometry(0.028, 12, 10),
              pinkMat.clone()
            );
            tongue.scale.set(1, 0.5, 0.6);
            tongue.position.set(0, HEAD_Y - 0.145, FACE_Z + 0.06);
            g.add(tongue);
          } else if (kind === 'jigglypuff_face') {
            // Jigglypuff — very round pink balloon head with the signature
            // side-swept curl (like a hair-curl on the forehead), tiny cat
            // ears, and MASSIVE blue-iris eyes with light-blue inner ring and
            // white sparkles (Jigglypuff's eyes are extremely large).
            const pinkMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
            const darkPinkMat = new THREE.MeshStandardMaterial({ color: '#f472b6', roughness: 0.6 });
            const darkBlue = new THREE.MeshStandardMaterial({
              color: accent ?? '#1e3a8a', emissive: '#1e40af', emissiveIntensity: 0.3,
            });
            const lightBlue = new THREE.MeshStandardMaterial({
              color: '#93c5fd', emissive: '#60a5fa', emissiveIntensity: 0.4,
            });
            const whiteMat = new THREE.MeshStandardMaterial({
              color: '#f8fafc', emissive: '#f8fafc', emissiveIntensity: 0.8,
            });
            const cover = new THREE.Mesh(new THREE.SphereGeometry(HEAD_SIZE * 0.68, 24, 20), pinkMat.clone());
            cover.position.set(0, HEAD_Y, 0);
            g.add(cover);
            // Iconic side-swept curl on the forehead (like a comma)
            const curl = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), pinkMat.clone());
            curl.scale.set(1.4, 1.8, 1.0);
            curl.rotation.z = 0.4;
            curl.position.set(-0.16, HEAD_Y + HEAD_SIZE / 2 + 0.02, 0.12);
            g.add(curl);
            const curlTip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), pinkMat.clone());
            curlTip.position.set(-0.24, HEAD_Y + HEAD_SIZE / 2 + 0.14, 0.14);
            g.add(curlTip);
            // Tiny pointed cat-like ears (small nubs on top)
            [-1, 1].forEach((sx) => {
              const ear = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 4), pinkMat.clone());
              ear.rotation.z = sx * 0.15;
              ear.position.set(sx * 0.16, HEAD_Y + HEAD_SIZE / 2 + 0.06, 0);
              g.add(ear);
            });
            // HUGE eyes — dark blue outer, light blue center, white sparkle
            [-1, 1].forEach((sx) => {
              // Outer dark blue (large — takes up most of the face)
              const outer = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 14), darkBlue.clone());
              outer.scale.set(1, 1.25, 0.6);
              outer.position.set(sx * 0.16, HEAD_Y + 0.03, FACE_Z + 0.02);
              g.add(outer);
              // Inner light-blue crescent (bottom of iris)
              const inner = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 12), lightBlue.clone());
              inner.scale.set(1, 0.7, 0.4);
              inner.position.set(sx * 0.16, HEAD_Y - 0.03, FACE_Z + 0.06);
              g.add(inner);
              // Two big white sparkles per eye (Jigglypuff's signature)
              const spark1 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), whiteMat.clone());
              spark1.position.set(sx * 0.16 - sx * 0.03, HEAD_Y + 0.09, FACE_Z + 0.08);
              g.add(spark1);
              const spark2 = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), whiteMat.clone());
              spark2.position.set(sx * 0.16 + sx * 0.05, HEAD_Y - 0.02, FACE_Z + 0.08);
              g.add(spark2);
            });
            // Small closed smile
            const smile = new THREE.Mesh(
              new THREE.TorusGeometry(0.03, 0.012, 6, 12, Math.PI),
              darkPinkMat.clone()
            );
            smile.rotation.z = Math.PI;
            smile.position.set(0, HEAD_Y - 0.2, FACE_Z + 0.04);
            g.add(smile);
          } else if (kind === 'psyduck_face') {
            // Psyduck — pale-yellow rounded head, WIDE flat orange bill wrapping
            // across the whole lower face, blank vacant white eyes with tiny
            // dot pupils, and 3 black feathery hair tufts fanning up on top.
            const yellowMat = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
            const billMat = new THREE.MeshStandardMaterial({
              color: accent ?? '#f97316', roughness: 0.45,
            });
            const whiteMat = new THREE.MeshStandardMaterial({ color: '#f8fafc' });
            const blackMat = new THREE.MeshStandardMaterial({ color: '#0a0a0a' });
            const cover = new THREE.Mesh(new THREE.SphereGeometry(HEAD_SIZE * 0.6, 24, 20), yellowMat.clone());
            cover.scale.set(1.15, 0.95, 1.0);
            cover.position.set(0, HEAD_Y, 0);
            g.add(cover);
            // Wide flat bill — much wider than tall, wraps around lower face
            const bill = new THREE.Mesh(
              new THREE.SphereGeometry(0.2, 18, 12),
              billMat.clone()
            );
            bill.scale.set(1.7, 0.35, 0.9);
            bill.position.set(0, HEAD_Y - 0.13, FACE_Z + 0.02);
            g.add(bill);
            // Nostrils on the bill
            [-1, 1].forEach((sx) => {
              const nostril = new THREE.Mesh(
                new THREE.SphereGeometry(0.014, 8, 6),
                blackMat.clone()
              );
              nostril.position.set(sx * 0.05, HEAD_Y - 0.09, FACE_Z + 0.19);
              g.add(nostril);
            });
            // Vacant white eyes — larger, wider apart (Psyduck's blank stare)
            [-1, 1].forEach((sx) => {
              const white = new THREE.Mesh(
                new THREE.SphereGeometry(0.09, 16, 12),
                whiteMat.clone()
              );
              white.scale.set(1, 1.0, 0.5);
              white.position.set(sx * 0.16, HEAD_Y + 0.06, FACE_Z + 0.03);
              g.add(white);
              // Tiny pinprick pupil
              const pupil = new THREE.Mesh(
                new THREE.SphereGeometry(0.014, 8, 8),
                blackMat.clone()
              );
              pupil.position.set(sx * 0.16 - sx * 0.015, HEAD_Y + 0.06, FACE_Z + 0.11);
              g.add(pupil);
            });
            // 3 spiky black feather hair tufts fanning up
            [-0.09, 0, 0.09].forEach((dx, i) => {
              const h = i === 1 ? 0.14 : 0.11;
              const feather = new THREE.Mesh(
                new THREE.ConeGeometry(0.022, h, 4),
                blackMat.clone()
              );
              feather.rotation.z = dx * 2.5;
              feather.position.set(dx, HEAD_Y + HEAD_SIZE / 2 + h / 2 - 0.02, 0);
              g.add(feather);
            });
          } else if (kind === 'snorlax_face') {
            // Snorlax — big cream-colored round face with heavy jowls,
            // permanently closed sleepy eye slits (Snorlax is always asleep),
            // wide open snoring mouth with visible teeth ridge, and small
            // pointed ears on the sides of the head.
            const creamMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
            const darkMat = new THREE.MeshStandardMaterial({
              color: accent ?? '#0f172a', roughness: 0.5,
            });
            const cover = new THREE.Mesh(new THREE.SphereGeometry(HEAD_SIZE * 0.64, 24, 20), creamMat.clone());
            cover.scale.set(1.2, 1.0, 1.05);
            cover.position.set(0, HEAD_Y, 0);
            g.add(cover);
            // Heavy jowls at the bottom (Snorlax's chubby cheeks)
            [-1, 1].forEach((sx) => {
              const jowl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 12), creamMat.clone());
              jowl.scale.set(0.9, 0.7, 0.7);
              jowl.position.set(sx * 0.22, HEAD_Y - 0.12, FACE_Z - 0.02);
              g.add(jowl);
            });
            // Closed sleepy eye arcs — a bit thicker, slightly wider apart
            [-1, 1].forEach((sx) => {
              const eye = new THREE.Mesh(
                new THREE.TorusGeometry(0.055, 0.018, 6, 16, Math.PI),
                darkMat.clone()
              );
              eye.rotation.z = Math.PI;
              eye.position.set(sx * 0.18, HEAD_Y + 0.08, FACE_Z + 0.03);
              g.add(eye);
              // Small lash tick under the arc
              const lash = new THREE.Mesh(
                new THREE.BoxGeometry(0.03, 0.008, 0.01),
                darkMat.clone()
              );
              lash.position.set(sx * 0.18, HEAD_Y + 0.055, FACE_Z + 0.05);
              g.add(lash);
            });
            // Wide open snoring mouth — dark cavern with a small pink tongue
            const mouth = new THREE.Mesh(
              new THREE.SphereGeometry(0.13, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
              darkMat.clone()
            );
            mouth.rotation.x = Math.PI / 2;
            mouth.scale.set(1.5, 0.45, 0.7);
            mouth.position.set(0, HEAD_Y - 0.13, FACE_Z + 0.03);
            g.add(mouth);
            const tongue = new THREE.Mesh(
              new THREE.SphereGeometry(0.06, 12, 10),
              new THREE.MeshStandardMaterial({ color: '#fb7185' })
            );
            tongue.scale.set(1.4, 0.3, 0.5);
            tongue.position.set(0, HEAD_Y - 0.16, FACE_Z + 0.06);
            g.add(tongue);
            // Two visible bottom fangs at the mouth corners (Snorlax detail)
            [-1, 1].forEach((sx) => {
              const fang = new THREE.Mesh(
                new THREE.ConeGeometry(0.015, 0.035, 3),
                new THREE.MeshStandardMaterial({ color: '#f8fafc' })
              );
              fang.rotation.x = Math.PI;
              fang.position.set(sx * 0.11, HEAD_Y - 0.13, FACE_Z + 0.09);
              g.add(fang);
            });
            // Small pointed ears (rounded triangles on the sides of the head)
            [-1, 1].forEach((sx) => {
              const ear = new THREE.Mesh(
                new THREE.ConeGeometry(0.07, 0.14, 4),
                creamMat.clone()
              );
              ear.rotation.z = sx * -Math.PI / 2 - sx * 0.3;
              ear.position.set(sx * 0.34, HEAD_Y + 0.14, -0.02);
              g.add(ear);
            });
          } else if (kind === 'gengar_face') {
            // Gengar — dark-purple head with a jagged crown of small spikes
            // (Gengar's silhouette has multiple sharp ears/tufts, not just 2),
            // glowing red eyes with tiny white pupils, and a HUGE evil grin
            // showing lots of white teeth (mouth interior is dark, teeth
            // white — real Gengar's grin is white teeth on black gums).
            const purpleMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.5,
              emissive: new THREE.Color(color.getHex()).multiplyScalar(0.08),
            });
            const darkPurpleMat = new THREE.MeshStandardMaterial({
              color: '#4c1d95', roughness: 0.55,
            });
            const redMat = new THREE.MeshStandardMaterial({
              color: accent ?? '#dc2626',
              emissive: '#ef4444', emissiveIntensity: 0.8,
            });
            const whiteMat = new THREE.MeshStandardMaterial({ color: '#f8fafc' });
            const blackMat = new THREE.MeshStandardMaterial({ color: '#0a0a0a' });
            const cover = new THREE.Mesh(new THREE.SphereGeometry(HEAD_SIZE * 0.62, 24, 20), purpleMat.clone());
            cover.scale.set(1.15, 0.98, 1.0);
            cover.position.set(0, HEAD_Y, 0);
            g.add(cover);
            // Jagged crown of spikes on top and sides (Gengar has 4+ ear-spikes)
            const spikeCoords: [number, number, number, number][] = [
              // [x, y-offset, rotationZ, scale]
              [-0.26, 0.02, -0.35, 1.0],
              [-0.14, 0.14, -0.15, 1.1],
              [0.14, 0.14, 0.15, 1.1],
              [0.26, 0.02, 0.35, 1.0],
              [0, 0.18, 0, 1.15],
            ];
            spikeCoords.forEach(([sx, dy, rz, scl]) => {
              const spike = new THREE.Mesh(
                new THREE.ConeGeometry(0.06 * scl, 0.2 * scl, 4),
                purpleMat.clone()
              );
              spike.rotation.z = rz;
              spike.position.set(sx, HEAD_Y + HEAD_SIZE / 2 + dy, 0);
              g.add(spike);
            });
            // Glowing red eyes with tiny WHITE pupils (Gengar's malevolent gaze)
            [-1, 1].forEach((sx) => {
              const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 12), redMat.clone());
              eye.scale.set(1, 1.1, 0.7);
              eye.position.set(sx * 0.15, HEAD_Y + 0.09, FACE_Z + 0.03);
              g.add(eye);
              // Tiny white pupil (not black — Gengar's pupils are white specks)
              const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), whiteMat.clone());
              pupil.position.set(sx * 0.15, HEAD_Y + 0.09, FACE_Z + 0.09);
              g.add(pupil);
            });
            // HUGE evil grin — outer mouth shape (dark)
            const mouthBase = new THREE.Mesh(
              new THREE.SphereGeometry(0.18, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2),
              blackMat.clone()
            );
            mouthBase.rotation.x = Math.PI / 2;
            mouthBase.scale.set(1.3, 0.6, 0.5);
            mouthBase.position.set(0, HEAD_Y - 0.09, FACE_Z + 0.02);
            g.add(mouthBase);
            // Dark purple gum line
            const gum = new THREE.Mesh(
              new THREE.TorusGeometry(0.17, 0.022, 8, 20, Math.PI),
              darkPurpleMat.clone()
            );
            gum.rotation.z = Math.PI;
            gum.position.set(0, HEAD_Y - 0.08, FACE_Z + 0.05);
            g.add(gum);
            // Row of sharp white teeth — top row
            for (let i = -3; i <= 3; i++) {
              const tooth = new THREE.Mesh(
                new THREE.ConeGeometry(0.022, 0.06, 4),
                whiteMat.clone()
              );
              tooth.rotation.x = Math.PI;
              tooth.position.set(i * 0.045, HEAD_Y - 0.09, FACE_Z + 0.09);
              g.add(tooth);
            }
            // Bottom row of teeth
            for (let i = -2; i <= 2; i++) {
              const tooth = new THREE.Mesh(
                new THREE.ConeGeometry(0.018, 0.045, 4),
                whiteMat.clone()
              );
              tooth.position.set(i * 0.05, HEAD_Y - 0.16, FACE_Z + 0.08);
              g.add(tooth);
            }
          } else if (kind === 'charizard_face') {
            // Charizard — orange dragon head with an ELONGATED forward snout,
            // cream muzzle underneath, TWO backward-pointing horns from the
            // back of the skull (not up), teal-blue eyes (Charizard's real
            // eye color), small nostrils, and a hint of visible dragon fangs.
            const orangeMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
            const creamMat = new THREE.MeshStandardMaterial({
              color: accent ?? '#fef3c7', roughness: 0.6,
            });
            // Rounded skull (not boxy)
            const cover = new THREE.Mesh(
              new THREE.SphereGeometry(HEAD_SIZE * 0.55, 22, 18),
              orangeMat.clone()
            );
            cover.scale.set(1.05, 0.95, 1.0);
            cover.position.set(0, HEAD_Y + 0.02, -0.02);
            g.add(cover);
            // Elongated snout jutting forward (Charizard's dragon muzzle)
            const snout = new THREE.Mesh(
              new THREE.SphereGeometry(0.16, 16, 12),
              orangeMat.clone()
            );
            snout.scale.set(1.0, 0.75, 1.4);
            snout.position.set(0, HEAD_Y - 0.06, FACE_Z + 0.12);
            g.add(snout);
            // Cream underside of muzzle (lower jaw)
            const jaw = new THREE.Mesh(
              new THREE.SphereGeometry(0.14, 14, 10),
              creamMat.clone()
            );
            jaw.scale.set(0.9, 0.5, 1.3);
            jaw.position.set(0, HEAD_Y - 0.15, FACE_Z + 0.1);
            g.add(jaw);
            // Two horns pointing STRAIGHT BACK from the top-back of the skull
            [-1, 1].forEach((sx) => {
              const horn = new THREE.Mesh(
                new THREE.ConeGeometry(0.05, 0.36, 5),
                creamMat.clone()
              );
              // Tilt so tip points backward (rotation.x = π/2 = horizontal-back)
              horn.rotation.x = Math.PI / 2 + 0.2;
              horn.rotation.z = sx * -0.15;
              horn.position.set(sx * 0.13, HEAD_Y + 0.14, -0.24);
              g.add(horn);
            });
            // Teal-blue eyes with black slit pupils (dragon eyes)
            const tealMat = new THREE.MeshStandardMaterial({
              color: '#38bdf8', emissive: '#0284c7', emissiveIntensity: 0.3,
            });
            [-1, 1].forEach((sx) => {
              const white = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 12, 10),
                new THREE.MeshStandardMaterial({ color: '#f8fafc' })
              );
              white.scale.set(1, 1.3, 0.5);
              white.position.set(sx * 0.14, HEAD_Y + 0.1, FACE_Z + 0.04);
              g.add(white);
              const iris = new THREE.Mesh(
                new THREE.SphereGeometry(0.036, 10, 8),
                tealMat.clone()
              );
              iris.scale.set(1, 1.3, 0.5);
              iris.position.set(sx * 0.14, HEAD_Y + 0.1, FACE_Z + 0.07);
              g.add(iris);
              // Vertical slit pupil (dragon)
              const pupil = new THREE.Mesh(
                new THREE.BoxGeometry(0.008, 0.045, 0.008),
                new THREE.MeshStandardMaterial({ color: '#0a0a0a' })
              );
              pupil.position.set(sx * 0.14, HEAD_Y + 0.1, FACE_Z + 0.09);
              g.add(pupil);
              // Brow ridge above the eye
              const brow = new THREE.Mesh(
                new THREE.BoxGeometry(0.09, 0.02, 0.05),
                orangeMat.clone()
              );
              brow.rotation.z = sx * 0.2;
              brow.position.set(sx * 0.14, HEAD_Y + 0.17, FACE_Z + 0.03);
              g.add(brow);
            });
            // Nostrils on top of snout
            [-1, 1].forEach((sx) => {
              const nostril = new THREE.Mesh(
                new THREE.SphereGeometry(0.014, 8, 8),
                new THREE.MeshStandardMaterial({ color: '#0f172a' })
              );
              nostril.position.set(sx * 0.045, HEAD_Y - 0.02, FACE_Z + 0.24);
              g.add(nostril);
            });
            // Two visible upper fangs (dragon teeth)
            [-1, 1].forEach((sx) => {
              const fang = new THREE.Mesh(
                new THREE.ConeGeometry(0.014, 0.045, 3),
                creamMat.clone()
              );
              fang.rotation.x = Math.PI;
              fang.position.set(sx * 0.06, HEAD_Y - 0.11, FACE_Z + 0.22);
              g.add(fang);
            });
          } else if (kind === 'mew_face') {
            // Mew — soft pink kitten face with an ELONGATED slightly triangular
            // head (Mew's head is more oval-pointed than round), HUGE round
            // bright-blue eyes with light-blue centers and sparkles (Mew's
            // signature big shiny eyes), tiny triangular ears, tiny nose,
            // and a small cat mouth with pink cheeks.
            const pinkMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.5,
              emissive: new THREE.Color(color.getHex()).multiplyScalar(0.08),
            });
            const darkPinkMat = new THREE.MeshStandardMaterial({
              color: '#f472b6', roughness: 0.55,
            });
            const blueMat = new THREE.MeshStandardMaterial({
              color: accent ?? '#3b82f6', emissive: '#2563eb', emissiveIntensity: 0.4,
            });
            const lightBlueMat = new THREE.MeshStandardMaterial({
              color: '#93c5fd', emissive: '#7dd3fc', emissiveIntensity: 0.5,
            });
            const whiteMat = new THREE.MeshStandardMaterial({
              color: '#f8fafc', emissive: '#f8fafc', emissiveIntensity: 0.9,
            });
            // Elongated oval-pointed head (Mew's head narrows toward the chin)
            const cover = new THREE.Mesh(
              new THREE.SphereGeometry(HEAD_SIZE * 0.6, 24, 20),
              pinkMat.clone()
            );
            cover.scale.set(1.02, 1.08, 1.0);
            cover.position.set(0, HEAD_Y + 0.02, 0);
            g.add(cover);
            // Tiny triangular ears (small, close to head)
            [-1, 1].forEach((sx) => {
              const ear = new THREE.Mesh(
                new THREE.ConeGeometry(0.06, 0.13, 4),
                pinkMat.clone()
              );
              ear.rotation.z = sx * 0.35;
              ear.position.set(sx * 0.16, HEAD_Y + HEAD_SIZE / 2 + 0.04, -0.03);
              g.add(ear);
              const inner = new THREE.Mesh(
                new THREE.ConeGeometry(0.032, 0.08, 3),
                darkPinkMat.clone()
              );
              inner.rotation.z = sx * 0.35;
              inner.position.set(sx * 0.17, HEAD_Y + HEAD_SIZE / 2 + 0.06, -0.01);
              g.add(inner);
            });
            // Huge shiny blue eyes — outer blue disc, light-blue center, sparkles
            [-1, 1].forEach((sx) => {
              const outer = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 16, 14),
                blueMat.clone()
              );
              outer.scale.set(1, 1.15, 0.55);
              outer.position.set(sx * 0.16, HEAD_Y + 0.05, FACE_Z + 0.02);
              g.add(outer);
              // Light-blue bottom crescent (iris shimmer)
              const inner = new THREE.Mesh(
                new THREE.SphereGeometry(0.06, 14, 12),
                lightBlueMat.clone()
              );
              inner.scale.set(1, 0.65, 0.4);
              inner.position.set(sx * 0.16, HEAD_Y - 0.005, FACE_Z + 0.07);
              g.add(inner);
              // Big white sparkle (top)
              const spark = new THREE.Mesh(
                new THREE.SphereGeometry(0.03, 10, 8),
                whiteMat.clone()
              );
              spark.position.set(sx * 0.16 - sx * 0.025, HEAD_Y + 0.1, FACE_Z + 0.08);
              g.add(spark);
              // Tiny white sparkle (bottom)
              const spark2 = new THREE.Mesh(
                new THREE.SphereGeometry(0.015, 8, 6),
                whiteMat.clone()
              );
              spark2.position.set(sx * 0.16 + sx * 0.03, HEAD_Y + 0.0, FACE_Z + 0.09);
              g.add(spark2);
            });
            // Pink cheek dots (small darker circles)
            [-1, 1].forEach((sx) => {
              const cheek = new THREE.Mesh(
                new THREE.SphereGeometry(0.03, 10, 8),
                darkPinkMat.clone()
              );
              cheek.scale.set(1, 1, 0.3);
              cheek.position.set(sx * 0.24, HEAD_Y - 0.07, FACE_Z + 0.06);
              g.add(cheek);
            });
            // Tiny mouth (Mew's characteristic small "3" mouth)
            [-1, 1].forEach((sx) => {
              const half = new THREE.Mesh(
                new THREE.TorusGeometry(0.02, 0.008, 6, 12, Math.PI * 0.7),
                new THREE.MeshStandardMaterial({ color: '#9f1239' })
              );
              half.rotation.z = sx * -Math.PI / 2 + Math.PI / 2;
              half.position.set(sx * 0.02, HEAD_Y - 0.12, FACE_Z + 0.14);
              g.add(half);
            });
          } else if (kind === 'lugia_face') {
            // Lugia — elongated white bird-dragon head, pointed navy back-crest,
            // dark navy blue jagged eye "mask" wrapping across both eyes,
            // small open beak-mouth pointing forward.
            const whiteMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.5,
            });
            const navyMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#1e3a8a'),
              roughness: 0.5,
            });
            // Elongated head
            const cover = new THREE.Mesh(
              new THREE.SphereGeometry(HEAD_SIZE * 0.6, 24, 20),
              whiteMat.clone()
            );
            cover.scale.set(1.0, 1.05, 1.15);
            cover.position.set(0, HEAD_Y, 0.02);
            g.add(cover);
            // Forward-pointing beak/snout
            const snout = new THREE.Mesh(
              new THREE.SphereGeometry(0.14, 16, 12),
              whiteMat.clone()
            );
            snout.scale.set(0.9, 0.7, 1.4);
            snout.position.set(0, HEAD_Y - 0.06, FACE_Z + 0.14);
            g.add(snout);
            // Open mouth interior (dark red)
            const mouth = new THREE.Mesh(
              new THREE.SphereGeometry(0.06, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2),
              new THREE.MeshStandardMaterial({ color: '#7f1d1d' })
            );
            mouth.rotation.x = Math.PI / 2;
            mouth.scale.set(1.4, 0.4, 0.8);
            mouth.position.set(0, HEAD_Y - 0.1, FACE_Z + 0.24);
            g.add(mouth);
            // Pointed navy back-crest on the top-back of the head
            const crest = new THREE.Mesh(
              new THREE.ConeGeometry(0.08, 0.3, 4),
              navyMat.clone()
            );
            crest.rotation.x = Math.PI / 2 + 0.3;
            crest.position.set(0, HEAD_Y + 0.16, -0.24);
            g.add(crest);
            // Navy jagged eye "mask" — 4 spike points around each eye
            [-1, 1].forEach((sx) => {
              // Central eye triangle
              const maskCenter = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.06, 0.03),
                navyMat.clone()
              );
              maskCenter.rotation.z = sx * -0.15;
              maskCenter.position.set(sx * 0.18, HEAD_Y + 0.06, FACE_Z + 0.04);
              g.add(maskCenter);
              // Outer spike
              const outer = new THREE.Mesh(
                new THREE.ConeGeometry(0.04, 0.14, 3),
                navyMat.clone()
              );
              outer.rotation.z = sx * -Math.PI / 2 - sx * 0.3;
              outer.position.set(sx * 0.3, HEAD_Y + 0.09, FACE_Z + 0.03);
              g.add(outer);
              // Upper spike
              const upper = new THREE.Mesh(
                new THREE.ConeGeometry(0.03, 0.1, 3),
                navyMat.clone()
              );
              upper.position.set(sx * 0.16, HEAD_Y + 0.16, FACE_Z + 0.02);
              g.add(upper);
              // Small white glowing eye slit
              const eye = new THREE.Mesh(
                new THREE.SphereGeometry(0.022, 10, 8),
                new THREE.MeshStandardMaterial({
                  color: '#f8fafc', emissive: '#f8fafc', emissiveIntensity: 0.9,
                })
              );
              eye.scale.set(1.4, 0.7, 0.6);
              eye.position.set(sx * 0.18, HEAD_Y + 0.06, FACE_Z + 0.06);
              g.add(eye);
            });
          } else if (kind === 'spiderman') {
            // Full red head cover + big white tilted eyes + black web grid.
            const redMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
            const webMat = new THREE.MeshStandardMaterial({ color: '#10101e' });
            const cover = new THREE.Mesh(
              new THREE.BoxGeometry(HEAD_SIZE + 0.05, HEAD_SIZE + 0.05, HEAD_SIZE + 0.05),
              redMat
            );
            cover.position.set(0, HEAD_Y, 0);
            g.add(cover);
            // Web grid lines on the front face
            [-0.3, -0.15, 0, 0.15, 0.3].forEach((x) => {
              const v = new THREE.Mesh(
                new THREE.BoxGeometry(0.01, HEAD_SIZE + 0.04, 0.01),
                webMat.clone()
              );
              v.position.set(x, HEAD_Y, FACE_Z + 0.03);
              g.add(v);
            });
            [-0.3, -0.15, 0, 0.15, 0.3].forEach((y) => {
              const h = new THREE.Mesh(
                new THREE.BoxGeometry(HEAD_SIZE + 0.04, 0.01, 0.01),
                webMat.clone()
              );
              h.position.set(0, HEAD_Y + y, FACE_Z + 0.03);
              g.add(h);
            });
            // Big white eyes (tilted almonds) with thin black rim, on top
            [-1, 1].forEach((sx) => {
              const rim = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.2, 0.03),
                webMat.clone()
              );
              rim.position.set(sx * 0.19, HEAD_Y + 0.07, FACE_Z + 0.05);
              rim.rotation.z = sx * -0.32;
              g.add(rim);
              const white = new THREE.Mesh(
                new THREE.BoxGeometry(0.24, 0.14, 0.03),
                new THREE.MeshStandardMaterial({
                  color: '#f8fafc',
                  emissive: '#cbd5e1',
                  emissiveIntensity: 0.4,
                })
              );
              white.position.set(sx * 0.19, HEAD_Y + 0.07, FACE_Z + 0.07);
              white.rotation.z = sx * -0.32;
              g.add(white);
            });
          } else if (kind === 'hulk') {
            // Green head + angry brows/eyes/teeth + messy dark hair.
            const skinMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
            const darkMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#1f2937'),
            });
            const whiteMat = new THREE.MeshStandardMaterial({ color: '#f8fafc' });
            const cover = new THREE.Mesh(
              new THREE.BoxGeometry(HEAD_SIZE + 0.06, HEAD_SIZE + 0.04, HEAD_SIZE + 0.06),
              skinMat
            );
            cover.position.set(0, HEAD_Y, 0);
            g.add(cover);
            // Messy dark hair cap + clumps
            const hairCap = new THREE.Mesh(
              new THREE.BoxGeometry(HEAD_SIZE + 0.1, 0.26, HEAD_SIZE + 0.1),
              darkMat.clone()
            );
            hairCap.position.set(0, HEAD_Y + HEAD_SIZE / 2 - 0.02, 0);
            g.add(hairCap);
            [-0.3, -0.1, 0.1, 0.3].forEach((x) => {
              const clump = new THREE.Mesh(
                new THREE.ConeGeometry(0.08, 0.2, 5),
                darkMat.clone()
              );
              clump.position.set(x, HEAD_Y + HEAD_SIZE / 2 + 0.12, 0.1);
              g.add(clump);
            });
            // Angry eyebrows (inner ends down)
            [-1, 1].forEach((sx) => {
              const brow = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.05, 0.03),
                darkMat.clone()
              );
              brow.position.set(sx * 0.18, HEAD_Y + 0.18, FACE_Z + 0.04);
              brow.rotation.z = sx * 0.4;
              g.add(brow);
            });
            // Narrow white eyes + dark pupils
            [-1, 1].forEach((sx) => {
              const eye = new THREE.Mesh(
                new THREE.BoxGeometry(0.14, 0.08, 0.02),
                whiteMat.clone()
              );
              eye.position.set(sx * 0.18, HEAD_Y + 0.08, FACE_Z + 0.04);
              g.add(eye);
              const pupil = new THREE.Mesh(
                new THREE.BoxGeometry(0.05, 0.07, 0.02),
                darkMat.clone()
              );
              pupil.position.set(sx * 0.15, HEAD_Y + 0.08, FACE_Z + 0.05);
              g.add(pupil);
            });
            // Gritted-teeth mouth
            const mouth = new THREE.Mesh(
              new THREE.BoxGeometry(0.36, 0.12, 0.02),
              darkMat.clone()
            );
            mouth.position.set(0, HEAD_Y - 0.24, FACE_Z + 0.04);
            g.add(mouth);
            const teeth = new THREE.Mesh(
              new THREE.BoxGeometry(0.32, 0.06, 0.02),
              whiteMat.clone()
            );
            teeth.position.set(0, HEAD_Y - 0.22, FACE_Z + 0.05);
            g.add(teeth);
            for (let i = -2; i <= 2; i++) {
              const gap = new THREE.Mesh(
                new THREE.BoxGeometry(0.015, 0.06, 0.02),
                darkMat.clone()
              );
              gap.position.set(i * 0.07, HEAD_Y - 0.22, FACE_Z + 0.06);
              g.add(gap);
            }
          }
          break;
        }
        case 'back': {
          const kind =
            item.kind ?? (item.shape === 'wing' ? 'wing_feather' : 'pack');

          // Pokemon back features (tails/wings/shell/bulb/etc.)
          if (kind === 'pikachu_tail') {
            const yellowMat = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
            const brownMat = new THREE.MeshStandardMaterial({ color: accent ?? '#78350f' });
            // Big lightning bolt tail
            const base = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.1), brownMat.clone());
            base.position.set(0, TORSO_Y - 0.1, -TORSO_D / 2 - 0.05);
            g.add(base);
            const zig1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.1), yellowMat.clone());
            zig1.rotation.z = 0.6;
            zig1.position.set(-0.14, TORSO_Y + 0.02, -TORSO_D / 2 - 0.05);
            g.add(zig1);
            const zig2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.11), yellowMat.clone());
            zig2.rotation.z = -0.55;
            zig2.position.set(-0.32, TORSO_Y + 0.22, -TORSO_D / 2 - 0.05);
            g.add(zig2);
            const zig3 = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 4), yellowMat.clone());
            zig3.rotation.z = 0.4;
            zig3.position.set(-0.55, TORSO_Y + 0.5, -TORSO_D / 2 - 0.05);
            g.add(zig3);
            break;
          }
          if (kind === 'charmander_tail') {
            const orangeMat = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
            const flameMat = new THREE.MeshStandardMaterial({
              color: accent ?? '#fbbf24', emissive: '#f97316', emissiveIntensity: 1.2,
            });
            const flameInner = new THREE.MeshStandardMaterial({
              color: '#fde047', emissive: '#facc15', emissiveIntensity: 1.5,
            });
            const flameLight = new THREE.PointLight('#fb923c', 0.8, 1.5);
            flameLight.position.set(-0.4, TORSO_Y - 0.05, -TORSO_D / 2 - 0.05);
            g.add(flameLight);
            // Orange curved tail
            const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.32, 10), orangeMat.clone());
            t1.rotation.z = -0.7;
            t1.position.set(-0.15, TORSO_Y - 0.2, -TORSO_D / 2 - 0.05);
            g.add(t1);
            const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.22, 8), orangeMat.clone());
            t2.rotation.z = -1.0;
            t2.position.set(-0.32, TORSO_Y - 0.06, -TORSO_D / 2 - 0.05);
            g.add(t2);
            // Flame tip
            const flame = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 6), flameMat);
            flame.position.set(-0.44, TORSO_Y + 0.1, -TORSO_D / 2 - 0.05);
            g.add(flame);
            const flameCore = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 5), flameInner);
            flameCore.position.set(-0.44, TORSO_Y + 0.05, -TORSO_D / 2 - 0.05);
            g.add(flameCore);
            break;
          }
          if (kind === 'squirtle_shell') {
            // Round brown shell with rim + cream underside pattern
            const shellMat = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
            const rimMat = new THREE.MeshStandardMaterial({ color: accent ?? '#fbbf24' });
            const shell = new THREE.Mesh(
              new THREE.SphereGeometry(0.4, 22, 16, 0, Math.PI * 2, 0, Math.PI / 2),
              shellMat
            );
            shell.rotation.x = Math.PI / 2;
            shell.position.set(0, TORSO_Y - 0.05, -TORSO_D / 2 - 0.1);
            g.add(shell);
            // Hex plate pattern
            const patternMat = new THREE.MeshStandardMaterial({ color: '#7c2d12' });
            [[-0.15, 0.1], [0.15, 0.1], [-0.15, -0.15], [0.15, -0.15], [0, 0]].forEach(([px, py]) => {
              const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 6), patternMat.clone());
              plate.rotation.x = Math.PI / 2;
              plate.position.set(px, TORSO_Y + py, -TORSO_D / 2 - 0.3);
              g.add(plate);
            });
            // Cream rim around
            const rim = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 10, 20), rimMat);
            rim.rotation.x = Math.PI / 2;
            rim.position.set(0, TORSO_Y - 0.05, -TORSO_D / 2 - 0.08);
            g.add(rim);
            break;
          }
          if (kind === 'bulbasaur_bulb') {
            // Big green bulb on the back with dark spots
            const bulbMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
            const darkMat = new THREE.MeshStandardMaterial({ color: accent ?? '#166534' });
            const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 16), bulbMat);
            bulb.position.set(0, TORSO_Y + 0.15, -TORSO_D / 2 - 0.24);
            g.add(bulb);
            // Dark spots on bulb
            [[-1, 0.1], [1, 0.1], [0, 0.25]].forEach(([sx, dy]) => {
              const spot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), darkMat.clone());
              spot.scale.set(1, 1, 0.3);
              spot.position.set(sx * 0.16, TORSO_Y + 0.15 + dy, -TORSO_D / 2 - 0.5);
              g.add(spot);
            });
            // 3 leaflets on top
            [-0.4, 0, 0.4].forEach((angle) => {
              const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 4), bulbMat.clone());
              leaf.rotation.z = angle;
              leaf.position.set(Math.sin(angle) * 0.1, TORSO_Y + 0.5, -TORSO_D / 2 - 0.24);
              g.add(leaf);
            });
            break;
          }
          if (kind === 'eevee_tail') {
            // Fluffy brown tail with cream tip
            const brownMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
            const creamMat = new THREE.MeshStandardMaterial({ color: accent ?? '#fef3c7', roughness: 0.85 });
            const tail = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), brownMat);
            tail.scale.set(1, 1.5, 1);
            tail.rotation.z = -0.5;
            tail.position.set(-0.14, TORSO_Y - 0.1, -TORSO_D / 2 - 0.14);
            g.add(tail);
            // Cream fluff tip
            const tip = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), creamMat);
            tip.position.set(-0.28, TORSO_Y + 0.15, -TORSO_D / 2 - 0.14);
            g.add(tip);
            // Fluff around neck
            for (let i = 0; i < 6; i++) {
              const angle = -0.5 + (i / 6) * Math.PI;
              const puff = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), creamMat.clone());
              puff.position.set(Math.cos(angle) * 0.22, TORSO_Y + 0.32, Math.sin(angle) * 0.22 - TORSO_D / 2 - 0.05);
              g.add(puff);
            }
            break;
          }
          if (kind === 'jigglypuff_tail') {
            // Tiny curl tail
            const pinkMat = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
            const tail = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), pinkMat);
            tail.scale.set(1.2, 1.6, 1.2);
            tail.rotation.z = 0.5;
            tail.position.set(-0.2, TORSO_Y - 0.1, -TORSO_D / 2 - 0.08);
            g.add(tail);
            const curl = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 8, 14, Math.PI * 1.5), pinkMat.clone());
            curl.rotation.y = Math.PI / 2;
            curl.position.set(-0.28, TORSO_Y - 0.02, -TORSO_D / 2 - 0.06);
            g.add(curl);
            break;
          }
          if (kind === 'psyduck_tail') {
            // Small orange nub tail
            const orangeMat = new THREE.MeshStandardMaterial({ color: accent ?? '#f97316', roughness: 0.55 });
            const tail = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), orangeMat);
            tail.scale.set(1, 1.4, 1);
            tail.position.set(0, TORSO_Y - 0.16, -TORSO_D / 2 - 0.08);
            g.add(tail);
            const tail2 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 4), orangeMat.clone());
            tail2.rotation.z = 0.5;
            tail2.position.set(-0.06, TORSO_Y - 0.04, -TORSO_D / 2 - 0.08);
            g.add(tail2);
            break;
          }
          if (kind === 'snorlax_back') {
            // Round chubby back with dark blue accent stripes
            const creamMat = new THREE.MeshStandardMaterial({ color: accent ?? '#fde68a', roughness: 0.6 });
            const back = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color, roughness: 0.6 }));
            back.rotation.x = Math.PI / 2;
            back.scale.set(1.2, 1.1, 0.6);
            back.position.set(0, TORSO_Y - 0.05, -TORSO_D / 2 - 0.14);
            g.add(back);
            // Cream side stripes
            for (let i = 0; i < 3; i++) {
              const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.08), creamMat.clone());
              stripe.position.set(0, TORSO_Y + 0.15 - i * 0.16, -TORSO_D / 2 - 0.35);
              g.add(stripe);
            }
            break;
          }
          if (kind === 'gengar_shadow') {
            // Dark purple shadow ridges (Gengar's back spikes)
            const purpleMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.55,
              emissive: new THREE.Color(color.getHex()).multiplyScalar(0.06),
            });
            // Row of spikes going down the spine
            [0.35, 0.2, 0.05, -0.1, -0.25].forEach((dy) => {
              const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.24, 4), purpleMat.clone());
              spike.rotation.x = -Math.PI / 2;
              spike.position.set(0, TORSO_Y + dy, -TORSO_D / 2 - 0.14);
              g.add(spike);
            });
            // Side spikes
            [-1, 1].forEach((sx) => {
              [0.2, -0.05].forEach((dy) => {
                const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 4), purpleMat.clone());
                spike.rotation.x = -Math.PI / 2;
                spike.rotation.z = sx * 0.4;
                spike.position.set(sx * 0.2, TORSO_Y + dy, -TORSO_D / 2 - 0.14);
                g.add(spike);
              });
            });
            break;
          }
          if (kind === 'charizard_wings') {
            // Huge sky-blue dragon wings on the back
            const wingMat = new THREE.MeshStandardMaterial({
              color, side: THREE.DoubleSide, roughness: 0.5,
            });
            const membrMat = new THREE.MeshStandardMaterial({
              color: accent ?? '#166534', side: THREE.DoubleSide, roughness: 0.5,
            });
            [-1, 1].forEach((sx) => {
              // Main upper wing
              const wing = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.04), wingMat.clone());
              wing.rotation.z = sx * -0.35;
              wing.position.set(sx * 0.5, TORSO_Y + 0.25, -TORSO_D / 2 - 0.06);
              g.add(wing);
              // Wing tip
              const tip = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 4), wingMat.clone());
              tip.rotation.z = sx * -Math.PI / 2;
              tip.position.set(sx * 0.95, TORSO_Y + 0.42, -TORSO_D / 2 - 0.06);
              g.add(tip);
              // Green membrane fingers
              [0, 1, 2].forEach((i) => {
                const finger = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.03), membrMat.clone());
                finger.rotation.z = sx * (-0.5 + i * 0.2);
                finger.position.set(sx * 0.5, TORSO_Y + 0.05 + i * 0.1, -TORSO_D / 2 - 0.08);
                g.add(finger);
              });
            });
            break;
          }
          if (kind === 'lugia_wings') {
            // Lugia — enormous white wings with finger-like tips folding out,
            // pale-blue underside, and a row of navy back-plate spikes down
            // the spine. Also add a small long tail with a navy fin.
            const wingMat = new THREE.MeshStandardMaterial({
              color, side: THREE.DoubleSide, roughness: 0.5,
            });
            const undersideMat = new THREE.MeshStandardMaterial({
              color: '#bfdbfe', side: THREE.DoubleSide, roughness: 0.55,
            });
            const navyMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#1e3a8a'),
              roughness: 0.5,
            });
            [-1, 1].forEach((sx) => {
              // Main upper wing (broad, going out and slightly forward)
              const wing = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 0.05), wingMat.clone());
              wing.rotation.z = sx * -0.2;
              wing.position.set(sx * 0.55, TORSO_Y + 0.28, -TORSO_D / 2 - 0.08);
              g.add(wing);
              // Underside patch (pale blue)
              const under = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.4, 0.02), undersideMat.clone());
              under.rotation.z = sx * -0.2;
              under.position.set(sx * 0.5, TORSO_Y + 0.24, -TORSO_D / 2 - 0.06);
              g.add(under);
              // Finger-like tips at the wing end (3 rectangular fingers)
              [-0.16, 0, 0.16].forEach((dy) => {
                const finger = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.11, 0.05), wingMat.clone());
                finger.rotation.z = sx * -0.2;
                finger.position.set(sx * 1.0, TORSO_Y + 0.28 + dy, -TORSO_D / 2 - 0.08);
                g.add(finger);
              });
            });
            // Row of navy back-plate spikes down the spine (5 plates)
            [0.28, 0.12, -0.04, -0.2, -0.36].forEach((dy) => {
              const plate = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 4), navyMat.clone());
              plate.rotation.x = -Math.PI / 2 - 0.4;
              plate.position.set(0, TORSO_Y + dy, -TORSO_D / 2 - 0.16);
              g.add(plate);
            });
            // Long tail with navy fin tip
            const tail = new THREE.Mesh(
              new THREE.CylinderGeometry(0.05, 0.09, 0.7, 12), wingMat.clone());
            tail.rotation.z = -0.4;
            tail.position.set(-0.25, TORSO_Y - 0.5, -TORSO_D / 2 - 0.14);
            g.add(tail);
            const tailFin = new THREE.Mesh(
              new THREE.ConeGeometry(0.12, 0.24, 4), navyMat.clone());
            tailFin.rotation.z = 1.4;
            tailFin.position.set(-0.5, TORSO_Y - 0.72, -TORSO_D / 2 - 0.14);
            g.add(tailFin);
            break;
          }
          if (kind === 'mew_tail') {
            // Mew's iconic long thin tail with rounded pink tip, curling
            // out and slightly up behind the character.
            const pinkMat = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
            // Curved thin cylinder tail
            const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8), pinkMat.clone());
            seg1.rotation.z = 0.6;
            seg1.position.set(-0.14, TORSO_Y - 0.1, -TORSO_D / 2 - 0.08);
            g.add(seg1);
            const seg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8), pinkMat.clone());
            seg2.rotation.z = -0.3;
            seg2.position.set(-0.32, TORSO_Y + 0.14, -TORSO_D / 2 - 0.08);
            g.add(seg2);
            const seg3 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), pinkMat.clone());
            seg3.rotation.z = 0.6;
            seg3.position.set(-0.44, TORSO_Y + 0.35, -TORSO_D / 2 - 0.08);
            g.add(seg3);
            // Rounded tip (Mew's signature)
            const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), pinkMat.clone());
            tip.position.set(-0.5, TORSO_Y + 0.5, -TORSO_D / 2 - 0.08);
            g.add(tip);
            break;
          }

          if (
            kind === 'batman_cape' ||
            kind === 'thor_cape' ||
            kind === 'superman_cape' ||
            kind === 'panther_cape'
          ) {
            // Long flowing cape, slightly different drape per kind.
            const capeMat = new THREE.MeshStandardMaterial({
              color,
              side: THREE.DoubleSide,
              roughness: 0.6,
            });
            const cape = new THREE.Mesh(
              new THREE.CylinderGeometry(
                0.46,
                0.7,
                kind === 'panther_cape' ? 0.95 : 1.45,
                18,
                1,
                true,
                Math.PI * 0.4,
                Math.PI * 1.2
              ),
              capeMat
            );
            cape.position.set(
              0,
              TORSO_Y - (kind === 'panther_cape' ? 0.05 : 0.4),
              -TORSO_D / 2 - 0.04
            );
            g.add(cape);

            if (kind === 'batman_cape') {
              // Scalloped (bat-wing) bottom edge approximated by V cones
              const trimMat = new THREE.MeshStandardMaterial({
                color: accent ?? new THREE.Color('#1e293b'),
              });
              for (let i = -3; i <= 3; i++) {
                const v = new THREE.Mesh(
                  new THREE.ConeGeometry(0.06, 0.16, 4),
                  trimMat.clone()
                );
                v.rotation.x = Math.PI;
                v.position.set(i * 0.13, TORSO_Y - 1.1, -TORSO_D / 2 - 0.1);
                g.add(v);
              }
            } else if (kind === 'superman_cape') {
              // Yellow trim along the inner cape edge
              const trimMat = new THREE.MeshStandardMaterial({
                color: accent ?? new THREE.Color('#fde047'),
              });
              const collar = new THREE.Mesh(
                new THREE.TorusGeometry(0.32, 0.04, 10, 18, Math.PI),
                trimMat
              );
              collar.rotation.x = Math.PI / 2;
              collar.rotation.z = Math.PI;
              collar.position.set(0, TORSO_Y + 0.32, -TORSO_D / 2 - 0.04);
              g.add(collar);
            } else if (kind === 'thor_cape') {
              // Gold clasp + shoulder cords
              const goldMat = new THREE.MeshStandardMaterial({
                color: accent ?? new THREE.Color('#fbbf24'),
                metalness: 0.6,
                roughness: 0.3,
              });
              [-1, 1].forEach((sx) => {
                const disc = new THREE.Mesh(
                  new THREE.CylinderGeometry(0.05, 0.05, 0.03, 16),
                  goldMat.clone()
                );
                disc.rotation.x = Math.PI / 2;
                disc.position.set(
                  sx * (TORSO_W / 2 + 0.08),
                  TORSO_Y + 0.32,
                  -TORSO_D / 2 + 0.04
                );
                g.add(disc);
              });
            } else if (kind === 'panther_cape') {
              // Silver shoulder accents
              const silverMat = new THREE.MeshStandardMaterial({
                color: accent ?? new THREE.Color('#cbd5e1'),
                metalness: 0.6,
                roughness: 0.3,
              });
              [-1, 1].forEach((sx) => {
                const epaulet = new THREE.Mesh(
                  new THREE.BoxGeometry(0.18, 0.06, 0.1),
                  silverMat.clone()
                );
                epaulet.position.set(sx * 0.22, TORSO_Y + 0.34, -TORSO_D / 2 - 0.02);
                g.add(epaulet);
              });
            }
            break;
          }

          if (kind === 'cap_shield') {
            // Round shield with concentric circles and a white star center.
            const ringMat = (c: string) =>
              new THREE.MeshStandardMaterial({ color: c, metalness: 0.3, roughness: 0.4 });
            const radii: [number, string][] = [
              [0.42, '#1e40af'],
              [0.34, '#f8fafc'],
              [0.26, '#dc2626'],
              [0.18, '#f8fafc'],
              [0.12, '#1e40af'],
            ];
            radii.forEach(([r, c], i) => {
              const disc = new THREE.Mesh(
                new THREE.CylinderGeometry(r, r, 0.03, 28),
                ringMat(c)
              );
              disc.rotation.x = Math.PI / 2;
              disc.position.set(0, TORSO_Y, -TORSO_D / 2 - 0.06 - i * 0.005);
              g.add(disc);
            });
            // White star center
            const starShape = new THREE.Shape();
            const oR = 0.1;
            const iR = 0.045;
            for (let i = 0; i < 10; i++) {
              const r = i % 2 === 0 ? oR : iR;
              const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
              const px = Math.cos(a) * r;
              const py = Math.sin(a) * r;
              if (i === 0) starShape.moveTo(px, py);
              else starShape.lineTo(px, py);
            }
            starShape.closePath();
            const star = new THREE.Mesh(
              new THREE.ExtrudeGeometry(starShape, { depth: 0.025, bevelEnabled: false }),
              new THREE.MeshStandardMaterial({ color: '#f8fafc' })
            );
            star.position.set(0, TORSO_Y, -TORSO_D / 2 - 0.1);
            star.rotation.x = Math.PI;
            g.add(star);
            break;
          }

          if (kind === 'flash_bolt') {
            // Large gold lightning bolt mounted on the back.
            const boltMat = new THREE.MeshStandardMaterial({
              color,
              emissive: color,
              emissiveIntensity: 0.4,
              metalness: 0.2,
              roughness: 0.4,
            });
            const b1 = new THREE.Mesh(
              new THREE.BoxGeometry(0.1, 0.36, 0.05),
              boltMat.clone()
            );
            b1.rotation.z = -0.55;
            b1.position.set(-0.05, TORSO_Y + 0.12, -TORSO_D / 2 - 0.04);
            g.add(b1);
            const b2 = new THREE.Mesh(
              new THREE.BoxGeometry(0.1, 0.36, 0.05),
              boltMat.clone()
            );
            b2.rotation.z = 0.55;
            b2.position.set(0.05, TORSO_Y - 0.12, -TORSO_D / 2 - 0.04);
            g.add(b2);
            // Red disc behind for contrast
            const disc = new THREE.Mesh(
              new THREE.CylinderGeometry(0.24, 0.24, 0.02, 24),
              new THREE.MeshStandardMaterial({
                color: accent ?? new THREE.Color('#dc2626'),
              })
            );
            disc.rotation.x = Math.PI / 2;
            disc.position.set(0, TORSO_Y, -TORSO_D / 2 - 0.06);
            g.add(disc);
            break;
          }

          if (kind === 'elsa_cape') {
            // Translucent shimmering icy cape sprinkled with snowflake dots.
            const capeMat = new THREE.MeshStandardMaterial({
              color,
              side: THREE.DoubleSide,
              roughness: 0.35,
              metalness: 0.25,
              transparent: true,
              opacity: 0.85,
              emissive: new THREE.Color(color.getHex()).multiplyScalar(0.08),
            });
            const cape = new THREE.Mesh(
              new THREE.CylinderGeometry(
                0.5, 0.85, 1.5, 22, 1, true,
                Math.PI * 0.35, Math.PI * 1.3
              ),
              capeMat
            );
            cape.position.set(0, TORSO_Y - 0.4, -TORSO_D / 2 - 0.04);
            g.add(cape);
            const sparkleMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#ffffff'),
              emissive: accent ?? new THREE.Color('#ffffff'),
              emissiveIntensity: 1.0,
            });
            for (let i = 0; i < 12; i++) {
              const col = (i % 4) - 1.5;
              const row = Math.floor(i / 4);
              const sp = new THREE.Mesh(
                new THREE.SphereGeometry(0.025, 8, 8),
                sparkleMat.clone()
              );
              sp.position.set(col * 0.22, TORSO_Y - 0.1 - row * 0.35, -TORSO_D / 2 - 0.08);
              g.add(sp);
            }
            break;
          }

          if (kind === 'ariel_wave') {
            // Iconic flowing red hair: long back panel + curls + two front
            // strands flowing over the shoulders.
            const hairMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
            const tipMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#7f1d1d'),
            });
            // Top hair cap covering the head
            const topHairA = new THREE.Mesh(
              new THREE.BoxGeometry(HEAD_SIZE + 0.08, 0.3, HEAD_SIZE + 0.06),
              hairMat.clone()
            );
            topHairA.position.set(0, HEAD_Y + HEAD_SIZE / 2 - 0.02, 0);
            g.add(topHairA);
            // Side hair tufts (replacing the boy's brown tufts)
            [-1, 1].forEach((sx) => {
              const tuft = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.35, HEAD_SIZE * 0.85),
                hairMat.clone()
              );
              tuft.position.set(sx * (HEAD_SIZE / 2 + 0.04), HEAD_Y + 0.04, 0);
              g.add(tuft);
            });
            // Long flowing back panel
            const back = new THREE.Mesh(
              new THREE.BoxGeometry(HEAD_SIZE + 0.12, 1.2, 0.14),
              hairMat.clone()
            );
            back.position.set(0, TORSO_Y - 0.1, -TORSO_D / 2 - 0.08);
            g.add(back);
            // Curl tips at the bottom
            [-0.24, -0.08, 0.08, 0.24].forEach((dx) => {
              const curl = new THREE.Mesh(
                new THREE.SphereGeometry(0.09, 12, 10),
                tipMat.clone()
              );
              curl.scale.set(1, 1.3, 1);
              curl.position.set(dx, TORSO_Y - 0.85, -TORSO_D / 2 - 0.1);
              g.add(curl);
            });
            // Front strands over the shoulders
            [-1, 1].forEach((sx) => {
              const strand = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.5, 0.06),
                hairMat.clone()
              );
              strand.position.set(sx * 0.32, TORSO_Y + 0.1, TORSO_D / 2 + 0.05);
              g.add(strand);
            });
            break;
          }

          if (kind === 'rapunzel_hair') {
            // Extremely long golden hair: top wrap + heavy braid down the
            // back past the body, with little pink flowers tucked in.
            const hairMat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
            const flowerMat = new THREE.MeshStandardMaterial({
              color: '#f472b6',
            });
            // Top hair covering the head
            const topHairR = new THREE.Mesh(
              new THREE.BoxGeometry(HEAD_SIZE + 0.1, 0.3, HEAD_SIZE + 0.08),
              hairMat.clone()
            );
            topHairR.position.set(0, HEAD_Y + HEAD_SIZE / 2 - 0.02, 0);
            g.add(topHairR);
            // Side tufts
            [-1, 1].forEach((sx) => {
              const tuft = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.32, HEAD_SIZE * 0.85),
                hairMat.clone()
              );
              tuft.position.set(sx * (HEAD_SIZE / 2 + 0.04), HEAD_Y + 0.04, 0);
              g.add(tuft);
            });
            // Long braid sections (5 stacked rounded boxes)
            for (let i = 0; i < 6; i++) {
              const section = new THREE.Mesh(
                new THREE.SphereGeometry(0.16 - i * 0.01, 14, 10),
                hairMat.clone()
              );
              section.scale.set(1, 0.55, 0.6);
              section.position.set(0, TORSO_Y - 0.05 - i * 0.28, -TORSO_D / 2 - 0.1);
              g.add(section);
            }
            // Pink flowers tucked along the braid
            [-0.25, 0.05, 0.35].forEach((y, i) => {
              const flower = new THREE.Mesh(
                new THREE.SphereGeometry(0.045, 12, 10),
                flowerMat.clone()
              );
              flower.scale.set(1.2, 1.2, 0.5);
              flower.position.set(
                (i % 2 === 0 ? -1 : 1) * 0.12,
                TORSO_Y + y,
                -TORSO_D / 2 - 0.06
              );
              g.add(flower);
              const center = new THREE.Mesh(
                new THREE.SphereGeometry(0.018, 8, 8),
                new THREE.MeshStandardMaterial({ color: '#fde047' })
              );
              center.position.set(
                (i % 2 === 0 ? -1 : 1) * 0.12,
                TORSO_Y + y,
                -TORSO_D / 2 - 0.03
              );
              g.add(center);
            });
            // Front strands
            [-1, 1].forEach((sx) => {
              const strand = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, 0.45, 0.06),
                hairMat.clone()
              );
              strand.position.set(sx * 0.3, TORSO_Y + 0.1, TORSO_D / 2 + 0.05);
              g.add(strand);
            });
            break;
          }

          if (kind === 'wolverine_claws') {
            // Yellow backplate + 3 silver claws sticking out either side
            const plateMat = new THREE.MeshStandardMaterial({ color });
            const clawMat = new THREE.MeshStandardMaterial({
              color: accent ?? '#cbd5e1', metalness: 0.85, roughness: 0.15,
            });
            const plate = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W * 0.7, TORSO_H * 0.7, 0.08),
              plateMat
            );
            plate.position.set(0, TORSO_Y, -TORSO_D / 2 - 0.08);
            g.add(plate);
            [-1, 1].forEach((sx) => {
              [-0.12, 0, 0.12].forEach((dy) => {
                const claw = new THREE.Mesh(
                  new THREE.ConeGeometry(0.025, 0.22, 4),
                  clawMat.clone()
                );
                claw.rotation.z = sx * Math.PI / 2;
                claw.position.set(sx * 0.32, TORSO_Y + dy, -TORSO_D / 2 - 0.06);
                g.add(claw);
              });
            });
            break;
          }
          if (kind === 'dr_strange_cape') {
            // Iconic red Cloak of Levitation with gold trim
            const capeMat = new THREE.MeshStandardMaterial({
              color, side: THREE.DoubleSide, roughness: 0.6,
            });
            const cape = new THREE.Mesh(
              new THREE.CylinderGeometry(0.5, 0.95, 1.55, 22, 1, true, Math.PI * 0.35, Math.PI * 1.3),
              capeMat
            );
            cape.position.set(0, TORSO_Y - 0.4, -TORSO_D / 2 - 0.04);
            g.add(cape);
            // Gold trim along the top collar
            const goldMat = new THREE.MeshStandardMaterial({
              color: accent ?? '#fbbf24', metalness: 0.55, roughness: 0.3,
            });
            const collar = new THREE.Mesh(
              new THREE.TorusGeometry(0.34, 0.06, 12, 24, Math.PI),
              goldMat
            );
            collar.rotation.x = Math.PI / 2;
            collar.rotation.z = Math.PI;
            collar.position.set(0, TORSO_Y + 0.32, -TORSO_D / 2 - 0.04);
            g.add(collar);
            // Tall collar wings flaring up
            [-1, 1].forEach((sx) => {
              const wing = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.3, 0.05),
                capeMat.clone()
              );
              wing.rotation.z = sx * 0.5;
              wing.position.set(sx * 0.24, TORSO_Y + 0.5, -TORSO_D / 2 - 0.02);
              g.add(wing);
            });
            break;
          }
          if (kind === 'starlord_pack') {
            // Twin red rocket pods on the back
            const padMat = new THREE.MeshStandardMaterial({
              color, metalness: 0.5, roughness: 0.3,
            });
            const goldMat = new THREE.MeshStandardMaterial({
              color: accent ?? '#fbbf24', metalness: 0.6,
            });
            [-1, 1].forEach((sx) => {
              const pod = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.1, 0.5, 14),
                padMat.clone()
              );
              pod.position.set(sx * 0.18, TORSO_Y - 0.08, -TORSO_D / 2 - 0.12);
              g.add(pod);
              const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.1, 0.018, 8, 16),
                goldMat.clone()
              );
              ring.rotation.x = Math.PI / 2;
              ring.position.set(sx * 0.18, TORSO_Y - 0.32, -TORSO_D / 2 - 0.12);
              g.add(ring);
              // Thruster glow
              const glow = new THREE.Mesh(
                new THREE.CircleGeometry(0.08, 16),
                new THREE.MeshStandardMaterial({
                  color: '#fef3c7', emissive: '#facc15', emissiveIntensity: 1.0,
                })
              );
              glow.rotation.x = -Math.PI / 2;
              glow.position.set(sx * 0.18, TORSO_Y - 0.34, -TORSO_D / 2 - 0.12);
              g.add(glow);
            });
            break;
          }
          if (kind === 'antman_pack') {
            // Slim red backpack with central yellow ant emblem
            const packMat = new THREE.MeshStandardMaterial({ color });
            const pack = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W * 0.7, TORSO_H * 0.7, 0.12),
              packMat
            );
            pack.position.set(0, TORSO_Y, -TORSO_D / 2 - 0.1);
            g.add(pack);
            // Black accent panel
            const panel = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W * 0.55, 0.1, 0.04),
              new THREE.MeshStandardMaterial({ color: accent ?? '#0a0a0a' })
            );
            panel.position.set(0, TORSO_Y, -TORSO_D / 2 - 0.17);
            g.add(panel);
            break;
          }
          if (kind === 'war_machine_back') {
            // Shoulder-mounted gatling gun on the back
            const armorMat = new THREE.MeshStandardMaterial({
              color, metalness: 0.7, roughness: 0.3,
            });
            const darkMat = new THREE.MeshStandardMaterial({
              color: accent ?? '#1e293b', metalness: 0.85,
            });
            // Backplate
            const plate = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W * 0.9, TORSO_H * 0.8, 0.1),
              armorMat
            );
            plate.position.set(0, TORSO_Y, -TORSO_D / 2 - 0.08);
            g.add(plate);
            // Gatling gun mounted on the right shoulder
            const barrel = new THREE.Mesh(
              new THREE.CylinderGeometry(0.06, 0.06, 0.36, 14),
              darkMat
            );
            barrel.rotation.x = Math.PI / 2;
            barrel.rotation.y = -0.3;
            barrel.position.set(0.32, TORSO_Y + 0.22, -TORSO_D / 2 - 0.05);
            g.add(barrel);
            // Ammo box
            const ammo = new THREE.Mesh(
              new THREE.BoxGeometry(0.12, 0.14, 0.16),
              darkMat.clone()
            );
            ammo.position.set(0.24, TORSO_Y + 0.32, -TORSO_D / 2 - 0.12);
            g.add(ammo);
            // Mini missile on left shoulder
            const missile = new THREE.Mesh(
              new THREE.ConeGeometry(0.05, 0.18, 6),
              darkMat.clone()
            );
            missile.rotation.x = Math.PI / 2;
            missile.position.set(-0.26, TORSO_Y + 0.28, -TORSO_D / 2 - 0.04);
            g.add(missile);
            break;
          }
          if (kind === 'vision_cape') {
            // Bright yellow cape (Vision's signature yellow cloak)
            const capeMat = new THREE.MeshStandardMaterial({
              color, side: THREE.DoubleSide, roughness: 0.5,
              emissive: new THREE.Color(color.getHex()).multiplyScalar(0.05),
            });
            const cape = new THREE.Mesh(
              new THREE.CylinderGeometry(0.46, 0.78, 1.4, 20, 1, true, Math.PI * 0.4, Math.PI * 1.2),
              capeMat
            );
            cape.position.set(0, TORSO_Y - 0.36, -TORSO_D / 2 - 0.04);
            g.add(cape);
            // Red trim along edges
            const trim = new THREE.Mesh(
              new THREE.TorusGeometry(0.34, 0.04, 10, 18, Math.PI),
              new THREE.MeshStandardMaterial({
                color: accent ?? '#dc2626', metalness: 0.4,
              })
            );
            trim.rotation.x = Math.PI / 2;
            trim.rotation.z = Math.PI;
            trim.position.set(0, TORSO_Y + 0.32, -TORSO_D / 2 - 0.04);
            g.add(trim);
            break;
          }
          if (kind === 'daredevil_back') {
            // Two batons strapped to the back in an X
            const batMat = new THREE.MeshStandardMaterial({
              color, metalness: 0.5, roughness: 0.3,
            });
            [-1, 1].forEach((sx) => {
              const baton = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 0.6, 10),
                batMat.clone()
              );
              baton.rotation.z = sx * 0.5;
              baton.position.set(0, TORSO_Y, -TORSO_D / 2 - 0.06);
              g.add(baton);
              const grip = new THREE.Mesh(
                new THREE.CylinderGeometry(0.035, 0.035, 0.16, 10),
                new THREE.MeshStandardMaterial({ color: accent ?? '#7f1d1d' })
              );
              grip.rotation.z = sx * 0.5;
              grip.position.set(sx * 0.12, TORSO_Y + 0.22, -TORSO_D / 2 - 0.06);
              g.add(grip);
            });
            break;
          }
          if (kind === 'hawkeye_quiver') {
            // Cylindrical quiver + 5 arrows with colored feathers
            const quiverMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
            const quiver = new THREE.Mesh(
              new THREE.CylinderGeometry(0.1, 0.1, 0.7, 14),
              quiverMat
            );
            quiver.position.set(0.16, TORSO_Y, -TORSO_D / 2 - 0.1);
            g.add(quiver);
            // Arrow shafts + feathers sticking up
            const shaftMat = new THREE.MeshStandardMaterial({ color: '#a16207' });
            const featherMat = new THREE.MeshStandardMaterial({
              color: accent ?? '#7c2d12',
            });
            [-0.04, 0, 0.04].forEach((dx) => {
              const shaft = new THREE.Mesh(
                new THREE.CylinderGeometry(0.012, 0.012, 0.4, 8),
                shaftMat.clone()
              );
              shaft.position.set(0.16 + dx, TORSO_Y + 0.45, -TORSO_D / 2 - 0.1);
              g.add(shaft);
              const feather = new THREE.Mesh(
                new THREE.ConeGeometry(0.025, 0.08, 4),
                featherMat.clone()
              );
              feather.position.set(0.16 + dx, TORSO_Y + 0.65, -TORSO_D / 2 - 0.1);
              g.add(feather);
            });
            // Strap across the chest (visible from front)
            const strap = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W * 1.3, 0.06, 0.04),
              new THREE.MeshStandardMaterial({ color: '#7c2d12' })
            );
            strap.rotation.z = -0.5;
            strap.position.set(0, TORSO_Y + 0.06, TORSO_D / 2 + 0.02);
            g.add(strap);
            break;
          }
          if (kind === 'falcon_wings') {
            // Large silver mechanical wings extending wide
            const wingMat = new THREE.MeshStandardMaterial({
              color, metalness: 0.65, roughness: 0.25,
            });
            const accMat = new THREE.MeshStandardMaterial({
              color: accent ?? '#7f1d1d',
            });
            [-1, 1].forEach((sx) => {
              // Main wing (trapezoid box)
              const wing = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.4, 0.04),
                wingMat.clone()
              );
              wing.rotation.z = sx * -0.18;
              wing.position.set(sx * 0.42, TORSO_Y + 0.1, -TORSO_D / 2 - 0.06);
              g.add(wing);
              // Wing slat details (feathers as thin boxes)
              [0, 0.08, 0.16, 0.24].forEach((dy) => {
                const slat = new THREE.Mesh(
                  new THREE.BoxGeometry(0.55, 0.02, 0.05),
                  accMat.clone()
                );
                slat.rotation.z = sx * -0.18;
                slat.position.set(sx * 0.42, TORSO_Y + 0.1 - dy, -TORSO_D / 2 - 0.08);
                g.add(slat);
              });
            });
            break;
          }
          if (kind === 'venom_back') {
            // Black tendrils/spikes splaying from the upper back
            const tMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.4, metalness: 0.3,
            });
            const whiteMat = new THREE.MeshStandardMaterial({ color: accent ?? '#f8fafc' });
            [-1, -0.5, 0, 0.5, 1].forEach((s) => {
              const len = 0.5 - Math.abs(s) * 0.15;
              const tendril = new THREE.Mesh(
                new THREE.ConeGeometry(0.04, len, 5),
                tMat.clone()
              );
              tendril.rotation.z = -s * 0.5;
              tendril.rotation.x = -0.3;
              tendril.position.set(s * 0.18, TORSO_Y + 0.3 + len / 2, -TORSO_D / 2 - 0.06);
              g.add(tendril);
            });
            // White spider symbol back-emblem
            const sym = new THREE.Mesh(
              new THREE.SphereGeometry(0.05, 12, 10),
              whiteMat.clone()
            );
            sym.scale.set(1, 1.4, 0.5);
            sym.position.set(0, TORSO_Y + 0.05, -TORSO_D / 2 - 0.04);
            g.add(sym);
            break;
          }
          if (kind === 'ghost_rider_back') {
            // Silver chain coiled across the back
            const chainMat = new THREE.MeshStandardMaterial({
              color, metalness: 0.8, roughness: 0.2,
            });
            // 5 chain rings forming a vertical column
            [0.3, 0.15, 0, -0.15, -0.3].forEach((dy, i) => {
              const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.07, 0.018, 8, 14),
                chainMat.clone()
              );
              ring.rotation.x = Math.PI / 2;
              ring.rotation.y = i % 2 === 0 ? 0 : Math.PI / 2;
              ring.position.set(0, TORSO_Y + dy, -TORSO_D / 2 - 0.05);
              g.add(ring);
            });
            // Orange flame outlines around the chain (small glowing spikes)
            const flameMat = new THREE.MeshStandardMaterial({
              color: accent ?? '#fb923c',
              emissive: '#f97316', emissiveIntensity: 0.9,
            });
            [-1, 1].forEach((sx) => {
              [0.25, 0, -0.25].forEach((dy) => {
                const flame = new THREE.Mesh(
                  new THREE.ConeGeometry(0.025, 0.12, 4),
                  flameMat.clone()
                );
                flame.rotation.z = sx * 0.5;
                flame.position.set(sx * 0.16, TORSO_Y + dy, -TORSO_D / 2 - 0.08);
                g.add(flame);
              });
            });
            break;
          }
          if (kind === 'silver_surfer_board') {
            // Long silver surfboard mounted vertically on the back
            const boardMat = new THREE.MeshStandardMaterial({
              color, metalness: 0.95, roughness: 0.08,
              emissive: new THREE.Color('#94a3b8').multiplyScalar(0.1),
            });
            const board = new THREE.Mesh(
              new THREE.BoxGeometry(0.3, 1.4, 0.04),
              boardMat
            );
            board.position.set(0, TORSO_Y - 0.1, -TORSO_D / 2 - 0.06);
            g.add(board);
            // Tapered nose top
            const noseTop = new THREE.Mesh(
              new THREE.ConeGeometry(0.15, 0.18, 6),
              boardMat.clone()
            );
            noseTop.position.set(0, TORSO_Y + 0.69, -TORSO_D / 2 - 0.06);
            g.add(noseTop);
            // Tapered tail
            const tail = new THREE.Mesh(
              new THREE.ConeGeometry(0.15, 0.18, 6),
              boardMat.clone()
            );
            tail.rotation.z = Math.PI;
            tail.position.set(0, TORSO_Y - 0.89, -TORSO_D / 2 - 0.06);
            g.add(tail);
            // Center stripe
            const stripe = new THREE.Mesh(
              new THREE.BoxGeometry(0.04, 1.4, 0.05),
              new THREE.MeshStandardMaterial({
                color: accent ?? '#94a3b8', metalness: 0.85,
              })
            );
            stripe.position.set(0, TORSO_Y - 0.1, -TORSO_D / 2 - 0.05);
            g.add(stripe);
            break;
          }
          if (kind === 'slp_backpack') {
            // Two-tone SLP kid backpack matching the real one: mustard
            // yellow upper body + navy lower body + small red SLP patch
            // with white letters + shoulder straps + top loop handle.
            const yellowMat = new THREE.MeshStandardMaterial({
              color,
              roughness: 0.7,
            });
            const navyMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#1e3a8a'),
              roughness: 0.7,
            });
            const patchMat = new THREE.MeshStandardMaterial({
              color: '#dc2626',
              roughness: 0.5,
            });
            const whiteMat = new THREE.MeshStandardMaterial({ color: '#f8fafc' });

            // Yellow upper body (~upper 60%)
            const upper = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W * 0.95, TORSO_H * 0.55, 0.2),
              yellowMat
            );
            upper.position.set(0, TORSO_Y + 0.08, -TORSO_D / 2 - 0.16);
            g.add(upper);
            // Navy lower body
            const lower = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W * 0.95, TORSO_H * 0.38, 0.2),
              navyMat
            );
            lower.position.set(0, TORSO_Y - 0.22, -TORSO_D / 2 - 0.16);
            g.add(lower);
            // Front pocket on the navy section
            const pocket = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W * 0.75, 0.2, 0.04),
              navyMat.clone()
            );
            pocket.position.set(0, TORSO_Y - 0.22, -TORSO_D / 2 - 0.26);
            g.add(pocket);
            // Stitched seam between yellow and navy halves
            const seam = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W * 0.96, 0.025, 0.21),
              new THREE.MeshStandardMaterial({ color: '#a16207' })
            );
            seam.position.set(0, TORSO_Y - 0.07, -TORSO_D / 2 - 0.16);
            g.add(seam);
            // Red SLP patch on the upper-right of the yellow panel
            const patch = new THREE.Mesh(
              new THREE.BoxGeometry(0.16, 0.1, 0.025),
              patchMat
            );
            patch.position.set(0.18, TORSO_Y + 0.12, -TORSO_D / 2 - 0.265);
            g.add(patch);
            // Tiny white "SLP" letter ticks on the patch
            for (let i = -1; i <= 1; i++) {
              const tick = new THREE.Mesh(
                new THREE.BoxGeometry(0.022, 0.05, 0.008),
                whiteMat.clone()
              );
              tick.position.set(0.18 + i * 0.045, TORSO_Y + 0.12, -TORSO_D / 2 - 0.28);
              g.add(tick);
            }
            // Shoulder straps in yellow over the front
            [-1, 1].forEach((sx) => {
              const strap = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, TORSO_H * 0.95, 0.05),
                yellowMat.clone()
              );
              strap.position.set(sx * 0.22, TORSO_Y, -TORSO_D / 2 + 0.02);
              g.add(strap);
            });
            // Top loop handle
            const handle = new THREE.Mesh(
              new THREE.TorusGeometry(0.06, 0.018, 6, 14, Math.PI),
              yellowMat.clone()
            );
            handle.position.set(0, TORSO_Y + 0.38, -TORSO_D / 2 - 0.16);
            g.add(handle);
            break;
          }

          if (kind === 'spiderman') {
            // Red backplate with a black spider symbol between the shoulders.
            const spiderMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#10101e'),
            });
            const body = new THREE.Mesh(
              new THREE.SphereGeometry(0.05, 12, 10),
              spiderMat
            );
            body.scale.set(1, 1.5, 0.5);
            body.position.set(0, TORSO_Y + 0.05, -TORSO_D / 2 - 0.04);
            g.add(body);
            [-1, 1].forEach((sx) => {
              [0.05, -0.02, -0.09, -0.16].forEach((dy, i) => {
                const legSp = new THREE.Mesh(
                  new THREE.BoxGeometry(0.12, 0.012, 0.012),
                  spiderMat.clone()
                );
                legSp.position.set(sx * 0.07, TORSO_Y + 0.05 + dy, -TORSO_D / 2 - 0.04);
                legSp.rotation.z = sx * (0.5 - i * 0.18);
                g.add(legSp);
              });
            });
            break;
          }

          if (kind === 'hulk') {
            // Tattered purple shirt remnants clinging to the back/shoulders.
            const shirtMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
            const panel = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W * 0.7, TORSO_H * 0.5, 0.05),
              shirtMat
            );
            panel.position.set(0, TORSO_Y + 0.05, -TORSO_D / 2 - 0.03);
            g.add(panel);
            [-1, 1].forEach((sx) => {
              const strap = new THREE.Mesh(
                new THREE.BoxGeometry(0.16, 0.3, 0.05),
                shirtMat.clone()
              );
              strap.position.set(sx * 0.24, TORSO_Y + 0.14, -TORSO_D / 2 - 0.03);
              strap.rotation.z = sx * 0.25;
              g.add(strap);
            });
            // Ragged torn bottom hem
            [-0.18, -0.06, 0.06, 0.18].forEach((x) => {
              const tear = new THREE.Mesh(
                new THREE.ConeGeometry(0.05, 0.13, 4),
                shirtMat.clone()
              );
              tear.rotation.x = Math.PI;
              tear.position.set(x, TORSO_Y - 0.18, -TORSO_D / 2 - 0.03);
              g.add(tear);
            });
            break;
          }

          if (kind === 'fairy_wings') {
            // 4 translucent oval petals — large upper, smaller lower —
            // ringed by small sparkle dots so they read as pixie-style.
            const wingMat = new THREE.MeshStandardMaterial({
              color,
              transparent: true,
              opacity: 0.65,
              side: THREE.DoubleSide,
              roughness: 0.4,
              metalness: 0.1,
            });
            [-1, 1].forEach((sx) => {
              const upper = new THREE.Mesh(
                new THREE.SphereGeometry(0.34, 18, 14),
                wingMat.clone()
              );
              upper.scale.set(0.6, 1.05, 0.08);
              upper.position.set(sx * 0.32, TORSO_Y + 0.18, -TORSO_D / 2 - 0.06);
              upper.rotation.z = sx * -0.4;
              g.add(upper);
              const lower = new THREE.Mesh(
                new THREE.SphereGeometry(0.24, 18, 14),
                wingMat.clone()
              );
              lower.scale.set(0.55, 1.0, 0.08);
              lower.position.set(sx * 0.28, TORSO_Y - 0.18, -TORSO_D / 2 - 0.06);
              lower.rotation.z = sx * -0.25;
              g.add(lower);
            });
            const sparkleMat = new THREE.MeshStandardMaterial({
              color: '#ffffff',
              emissive: '#ffffff',
              emissiveIntensity: 0.95,
            });
            for (let i = 0; i < 8; i++) {
              const a = (i / 8) * Math.PI * 2;
              const s = new THREE.Mesh(
                new THREE.SphereGeometry(0.022, 8, 8),
                sparkleMat.clone()
              );
              s.position.set(
                Math.cos(a) * 0.38,
                TORSO_Y + Math.sin(a) * 0.32,
                -TORSO_D / 2 - 0.09
              );
              g.add(s);
            }
            break;
          }

          if (kind === 'butterfly') {
            // Two rounded upper wings and two teardrop lower wings, each
            // with a contrast spot for the butterfly pattern.
            const wingMat = new THREE.MeshStandardMaterial({
              color,
              side: THREE.DoubleSide,
              roughness: 0.5,
            });
            const spotMat = accent
              ? new THREE.MeshStandardMaterial({ color: accent })
              : null;
            [-1, 1].forEach((sx) => {
              const upper = new THREE.Mesh(
                new THREE.SphereGeometry(0.32, 18, 14),
                wingMat.clone()
              );
              upper.scale.set(0.65, 0.95, 0.08);
              upper.position.set(sx * 0.3, TORSO_Y + 0.2, -TORSO_D / 2 - 0.05);
              upper.rotation.z = sx * -0.2;
              g.add(upper);
              const lower = new THREE.Mesh(
                new THREE.SphereGeometry(0.24, 18, 14),
                wingMat.clone()
              );
              lower.scale.set(0.6, 1.15, 0.08);
              lower.position.set(sx * 0.26, TORSO_Y - 0.2, -TORSO_D / 2 - 0.05);
              lower.rotation.z = sx * 0.1;
              g.add(lower);
              if (spotMat) {
                const s1 = new THREE.Mesh(
                  new THREE.SphereGeometry(0.055, 10, 8),
                  spotMat.clone()
                );
                s1.scale.set(1, 1, 0.1);
                s1.position.set(sx * 0.3, TORSO_Y + 0.2, -TORSO_D / 2 - 0.08);
                g.add(s1);
                const s2 = new THREE.Mesh(
                  new THREE.SphereGeometry(0.035, 10, 8),
                  spotMat.clone()
                );
                s2.scale.set(1, 1, 0.1);
                s2.position.set(sx * 0.24, TORSO_Y - 0.24, -TORSO_D / 2 - 0.08);
                g.add(s2);
              }
            });
            break;
          }

          if (kind === 'princess_cape') {
            // Long flowing cape from shoulders to past the knees, with a
            // white fur collar at the top.
            const capeMat = new THREE.MeshStandardMaterial({
              color,
              side: THREE.DoubleSide,
              roughness: 0.6,
            });
            const cape = new THREE.Mesh(
              new THREE.CylinderGeometry(
                0.5,
                0.85,
                1.5,
                20,
                1,
                true,
                Math.PI * 0.35,
                Math.PI * 1.3
              ),
              capeMat
            );
            cape.position.set(0, TORSO_Y - 0.4, -TORSO_D / 2 - 0.04);
            g.add(cape);
            const furColor = accent ?? new THREE.Color('#ffffff');
            const furMat = new THREE.MeshStandardMaterial({
              color: furColor,
              roughness: 0.95,
            });
            const fur = new THREE.Mesh(
              new THREE.TorusGeometry(0.34, 0.08, 14, 24, Math.PI),
              furMat
            );
            fur.rotation.x = Math.PI / 2;
            fur.rotation.z = Math.PI;
            fur.position.set(0, TORSO_Y + 0.35, -TORSO_D / 2 - 0.04);
            g.add(fur);
            // Gold clasp at the collar front
            const clasp = new THREE.Mesh(
              new THREE.SphereGeometry(0.05, 12, 10),
              new THREE.MeshStandardMaterial({
                color: '#fbbf24',
                metalness: 0.6,
                roughness: 0.3,
              })
            );
            clasp.position.set(0, TORSO_Y + 0.32, TORSO_D / 2 + 0.06);
            g.add(clasp);
            break;
          }

          const isWing =
            kind === 'wing_feather' ||
            kind === 'wing_angel' ||
            kind === 'wing_bat' ||
            kind === 'wing_star';

          if (isWing) {
            const matW = new THREE.MeshStandardMaterial({
              color,
              transparent: true,
              opacity: 0.95,
            });
            [-1, 1].forEach((sx) => {
              if (kind === 'wing_bat') {
                // scalloped silhouette: main + 3 cone scallops
                const wing = new THREE.Mesh(
                  new THREE.BoxGeometry(0.7, 0.7, 0.05),
                  matW.clone()
                );
                wing.position.set(sx * 0.55, TORSO_Y + 0.18, -0.32);
                wing.rotation.z = sx * 0.4;
                g.add(wing);
                const accCol = accent ?? '#7c3aed';
                const sMat = new THREE.MeshStandardMaterial({ color: accCol });
                for (let i = 0; i < 3; i++) {
                  const sc = new THREE.Mesh(
                    new THREE.ConeGeometry(0.13, 0.22, 4),
                    sMat.clone()
                  );
                  sc.rotation.x = Math.PI;
                  sc.rotation.z = sx * 0.4;
                  sc.position.set(
                    sx * (0.32 + i * 0.18),
                    TORSO_Y - 0.15 - i * 0.08,
                    -0.32
                  );
                  g.add(sc);
                }
              } else {
                // feather wings: stacked rounded panels
                const wing = new THREE.Mesh(
                  new THREE.BoxGeometry(0.7, 0.85, 0.05),
                  matW.clone()
                );
                wing.position.set(sx * 0.6, TORSO_Y + 0.15, -0.32);
                wing.rotation.z = sx * 0.4;
                g.add(wing);
                const featherCol = accent ?? color;
                const fMat = new THREE.MeshStandardMaterial({ color: featherCol });
                for (let i = 0; i < 3; i++) {
                  const f = new THREE.Mesh(
                    new THREE.BoxGeometry(0.18, 0.24, 0.05),
                    fMat.clone()
                  );
                  f.position.set(
                    sx * (0.7 + i * 0.04),
                    TORSO_Y + 0.05 - i * 0.2,
                    -0.32
                  );
                  f.rotation.z = sx * 0.6;
                  g.add(f);
                }
                if (kind === 'wing_star') {
                  const starCol = accent ?? '#f97316';
                  const stMat = new THREE.MeshStandardMaterial({
                    color: starCol,
                    emissive: starCol,
                    emissiveIntensity: 0.5,
                  });
                  for (let i = 0; i < 3; i++) {
                    const st = new THREE.Mesh(
                      new THREE.IcosahedronGeometry(0.07),
                      stMat.clone()
                    );
                    st.position.set(
                      sx * (0.45 + i * 0.12),
                      TORSO_Y + 0.32 - i * 0.28,
                      -0.3
                    );
                    g.add(st);
                  }
                }
              }
            });
            if (kind === 'wing_angel') {
              const haloCol = accent ?? '#fde68a';
              const halo = new THREE.Mesh(
                new THREE.TorusGeometry(0.3, 0.028, 12, 28),
                new THREE.MeshStandardMaterial({
                  color: haloCol,
                  emissive: haloCol,
                  emissiveIntensity: 0.7,
                })
              );
              halo.rotation.x = Math.PI / 2;
              halo.position.set(0, HEAD_Y + HEAD_SIZE / 2 + 0.5, 0);
              g.add(halo);
            }
          } else if (kind === 'cape') {
            const capeMat = new THREE.MeshStandardMaterial({
              color,
              side: THREE.DoubleSide,
            });
            const cape = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + 0.22, TORSO_H + 0.55, 0.04),
              capeMat
            );
            cape.position.set(0, TORSO_Y - 0.18, -TORSO_D / 2 - 0.06);
            g.add(cape);
            // collar
            const collarMat = new THREE.MeshStandardMaterial({
              color: accent ?? '#fbbf24',
            });
            const collar = new THREE.Mesh(
              new THREE.BoxGeometry(0.46, 0.12, 0.12),
              collarMat
            );
            collar.position.set(0, TORSO_Y + TORSO_H / 2 + 0.08, -TORSO_D / 2);
            g.add(collar);
            // tie/clasp on chest
            const tie = new THREE.Mesh(
              new THREE.SphereGeometry(0.05, 12, 12),
              collarMat.clone()
            );
            tie.position.set(0, TORSO_Y + TORSO_H / 2 + 0.06, TORSO_D / 2 + 0.04);
            g.add(tie);
          } else if (kind === 'ironman') {
            const armorMat = new THREE.MeshStandardMaterial({
              color,
              metalness: 0,
              roughness: 0.55,
              emissive: new THREE.Color(color.getHex()).multiplyScalar(0.02),
            });
            const goldColor = accent ?? new THREE.Color('#fbbf24');
            const goldMat = new THREE.MeshStandardMaterial({
              color: goldColor,
              metalness: 0,
              roughness: 0.5,
              emissive: new THREE.Color(goldColor.getHex()).multiplyScalar(0.025),
            });
            // Twin red triangular wing-thrusters that sweep up behind the back
            [-1, 1].forEach((sx) => {
              const wingShape = new THREE.Shape();
              wingShape.moveTo(0, 0);
              wingShape.lineTo(0.06, 0.42);
              wingShape.lineTo(0.34, 0.34);
              wingShape.lineTo(0.18, 0.04);
              wingShape.lineTo(0, 0);
              const wing = new THREE.Mesh(
                new THREE.ExtrudeGeometry(wingShape, {
                  depth: 0.05,
                  bevelEnabled: false,
                }),
                armorMat.clone()
              );
              wing.position.set(sx * 0.1, TORSO_Y - 0.05, -TORSO_D / 2 - 0.08);
              wing.scale.x = sx;
              g.add(wing);
              // Gold trim along the leading edge
              const trim = new THREE.Mesh(
                new THREE.BoxGeometry(0.02, 0.36, 0.06),
                goldMat.clone()
              );
              trim.position.set(sx * 0.12, TORSO_Y + 0.13, -TORSO_D / 2 - 0.06);
              trim.rotation.z = sx * -0.18;
              g.add(trim);
              // Boost thruster glow at the wing base
              const boost = new THREE.Mesh(
                new THREE.ConeGeometry(0.07, 0.2, 14),
                new THREE.MeshStandardMaterial({
                  color: '#a5f3fc',
                  emissive: '#22d3ee',
                  emissiveIntensity: 1.2,
                })
              );
              boost.rotation.x = Math.PI;
              boost.position.set(sx * 0.18, TORSO_Y - 0.35, -TORSO_D / 2 - 0.08);
              g.add(boost);
            });
            // Center backplate
            const plate = new THREE.Mesh(
              new THREE.BoxGeometry(0.42, 0.5, 0.06),
              armorMat.clone()
            );
            plate.position.set(0, TORSO_Y, -TORSO_D / 2 - 0.06);
            g.add(plate);
          } else if (kind === 'robot') {
            const chassisMat = new THREE.MeshStandardMaterial({
              color,
              metalness: 0.8,
              roughness: 0.25,
            });
            [-1, 1].forEach((sx) => {
              // Rectangular thruster
              const thruster = new THREE.Mesh(
                new THREE.BoxGeometry(0.22, 0.62, 0.2),
                chassisMat.clone()
              );
              thruster.position.set(sx * 0.18, TORSO_Y, -TORSO_D / 2 - 0.18);
              g.add(thruster);
              // Yellow + black warning band
              const yellow = new THREE.Mesh(
                new THREE.BoxGeometry(0.22, 0.04, 0.01),
                new THREE.MeshStandardMaterial({ color: '#fde047' })
              );
              yellow.position.set(sx * 0.18, TORSO_Y + 0.14, -TORSO_D / 2 - 0.08);
              g.add(yellow);
              const black = new THREE.Mesh(
                new THREE.BoxGeometry(0.22, 0.04, 0.01),
                new THREE.MeshStandardMaterial({ color: '#0f172a' })
              );
              black.position.set(sx * 0.18, TORSO_Y + 0.08, -TORSO_D / 2 - 0.08);
              g.add(black);
              // Flame jet
              const flameCol = accent ?? '#f97316';
              const flame = new THREE.Mesh(
                new THREE.ConeGeometry(0.1, 0.24, 12),
                new THREE.MeshStandardMaterial({
                  color: flameCol,
                  emissive: flameCol,
                  emissiveIntensity: 0.95,
                })
              );
              flame.rotation.x = Math.PI;
              flame.position.set(sx * 0.18, TORSO_Y - 0.44, -TORSO_D / 2 - 0.18);
              g.add(flame);
            });
            // Center spine plate
            const plate = new THREE.Mesh(
              new THREE.BoxGeometry(0.46, 0.5, 0.06),
              new THREE.MeshStandardMaterial({
                color: '#334155',
                metalness: 0.7,
                roughness: 0.3,
              })
            );
            plate.position.set(0, TORSO_Y, -TORSO_D / 2 - 0.06);
            g.add(plate);
          } else if (kind === 'jetpack') {
            const tankMat = new THREE.MeshStandardMaterial({
              color,
              metalness: 0.4,
              roughness: 0.4,
            });
            [-1, 1].forEach((sx) => {
              const tank = new THREE.Mesh(
                new THREE.CylinderGeometry(0.13, 0.13, 0.62, 18),
                tankMat.clone()
              );
              tank.position.set(sx * 0.18, TORSO_Y, -TORSO_D / 2 - 0.2);
              g.add(tank);
              // top cap
              const cap = new THREE.Mesh(
                new THREE.SphereGeometry(0.13, 16, 12),
                tankMat.clone()
              );
              cap.position.set(sx * 0.18, TORSO_Y + 0.32, -TORSO_D / 2 - 0.2);
              g.add(cap);
              // flame
              const flameCol = accent ?? '#f97316';
              const flame = new THREE.Mesh(
                new THREE.ConeGeometry(0.11, 0.26, 14),
                new THREE.MeshStandardMaterial({
                  color: flameCol,
                  emissive: flameCol,
                  emissiveIntensity: 0.9,
                })
              );
              flame.rotation.x = Math.PI;
              flame.position.set(sx * 0.18, TORSO_Y - 0.46, -TORSO_D / 2 - 0.2);
              g.add(flame);
            });
            // connecting back panel
            const panel = new THREE.Mesh(
              new THREE.BoxGeometry(0.5, 0.5, 0.06),
              new THREE.MeshStandardMaterial({ color: '#475569' })
            );
            panel.position.set(0, TORSO_Y, -TORSO_D / 2 - 0.08);
            g.add(panel);
          } else if (kind === 'shell') {
            const shellMat = new THREE.MeshStandardMaterial({
              color,
              roughness: 0.5,
            });
            const shell = new THREE.Mesh(
              new THREE.SphereGeometry(
                0.5,
                20,
                14,
                0,
                Math.PI * 2,
                0,
                Math.PI / 2
              ),
              shellMat
            );
            shell.rotation.x = Math.PI / 2;
            shell.position.set(0, TORSO_Y - 0.05, -TORSO_D / 2 - 0.1);
            g.add(shell);
            // hex pattern
            const hexCol = accent ?? '#854d0e';
            const hexMat = new THREE.MeshStandardMaterial({ color: hexCol });
            const hexPos: [number, number, number][] = [
              [0, 0.1, 0],
              [-0.22, 0, 0.05],
              [0.22, 0, 0.05],
              [0, -0.18, 0],
              [-0.18, -0.28, 0.1],
              [0.18, -0.28, 0.1],
            ];
            hexPos.forEach(([dx, dy, dzExtra]) => {
              const hex = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.08, 0.04, 6),
                hexMat.clone()
              );
              hex.rotation.x = Math.PI / 2;
              hex.position.set(dx, TORSO_Y + dy, -TORSO_D / 2 - 0.5 + dzExtra);
              g.add(hex);
            });
          } else if (kind === 'kinder') {
            const bagMat = new THREE.MeshStandardMaterial({ color });
            const bag = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W * 0.78, TORSO_H * 0.7, 0.24),
              bagMat
            );
            bag.position.set(0, TORSO_Y - 0.04, -TORSO_D / 2 - 0.14);
            g.add(bag);
            // rounded top flap
            const flap = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W * 0.8, 0.18, 0.26),
              bagMat.clone()
            );
            flap.position.set(0, TORSO_Y + TORSO_H * 0.32, -TORSO_D / 2 - 0.14);
            g.add(flap);
            if (accent) {
              const pocket = new THREE.Mesh(
                new THREE.BoxGeometry(TORSO_W * 0.5, TORSO_H * 0.3, 0.04),
                new THREE.MeshStandardMaterial({ color: accent })
              );
              pocket.position.set(0, TORSO_Y - 0.12, -TORSO_D / 2 - 0.27);
              g.add(pocket);
            }
            // straps over shoulders
            const strapMat = new THREE.MeshStandardMaterial({ color: '#ffffff' });
            [-1, 1].forEach((sx) => {
              const strap = new THREE.Mesh(
                new THREE.BoxGeometry(0.06, TORSO_H * 0.7, 0.05),
                strapMat.clone()
              );
              strap.position.set(
                sx * (TORSO_W / 2 - 0.05),
                TORSO_Y + 0.05,
                -TORSO_D / 2 + 0.02
              );
              g.add(strap);
            });
          } else {
            // pack
            const mat = new THREE.MeshStandardMaterial({ color });
            const pack = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W * 0.85, TORSO_H * 0.85, 0.28),
              mat
            );
            pack.position.set(0, TORSO_Y, -TORSO_D / 2 - 0.16);
            g.add(pack);
            // front pocket
            const pocketCol = accent ?? '#0f172a';
            const pocket = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W * 0.55, TORSO_H * 0.3, 0.04),
              new THREE.MeshStandardMaterial({ color: pocketCol })
            );
            pocket.position.set(0, TORSO_Y - 0.16, -TORSO_D / 2 - 0.32);
            g.add(pocket);
            // top handle
            const handle = new THREE.Mesh(
              new THREE.TorusGeometry(0.06, 0.018, 6, 14),
              new THREE.MeshStandardMaterial({ color: pocketCol })
            );
            handle.position.set(
              0,
              TORSO_Y + TORSO_H * 0.45,
              -TORSO_D / 2 - 0.16
            );
            g.add(handle);
            // straps
            const strapMat = new THREE.MeshStandardMaterial({ color: pocketCol });
            [-1, 1].forEach((sx) => {
              const strap = new THREE.Mesh(
                new THREE.BoxGeometry(0.06, TORSO_H * 0.85, 0.04),
                strapMat.clone()
              );
              strap.position.set(
                sx * (TORSO_W / 2 - 0.06),
                TORSO_Y,
                -TORSO_D / 2 + 0.02
              );
              g.add(strap);
            });
          }
          break;
        }
        case 'shoes': {
          const kind = item.kind ?? 'sneakers';
          const mat = new THREE.MeshStandardMaterial({ color });
          const accMat = accent
            ? new THREE.MeshStandardMaterial({ color: accent })
            : null;
          const footY = LEG_Y - LEG_H / 2 - 0.02;

          if (kind === 'lugia_feet') {
            // Lugia — white bird-feet with pale-blue upper band + 3 huge
            // navy claws pointing forward.
            const whiteMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.5,
            });
            const bandMat = new THREE.MeshStandardMaterial({
              color: '#bfdbfe', roughness: 0.55,
            });
            const navyMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#1e3a8a'),
              roughness: 0.5,
            });
            [-1, 1].forEach((sx) => {
              const foot = new THREE.Mesh(
                new THREE.SphereGeometry(0.17, 16, 12),
                whiteMat.clone()
              );
              foot.scale.set(1.0, 0.55, 1.5);
              foot.position.set(sx * LEG_X, footY + 0.02, 0.1);
              g.add(foot);
              // Pale-blue ankle band
              const band = new THREE.Mesh(
                new THREE.TorusGeometry(0.14, 0.028, 8, 16),
                bandMat.clone()
              );
              band.rotation.x = Math.PI / 2;
              band.position.set(sx * LEG_X, footY + 0.1, 0.06);
              g.add(band);
              // 3 huge navy claws pointing forward
              [-0.09, 0, 0.09].forEach((dx) => {
                const claw = new THREE.Mesh(
                  new THREE.ConeGeometry(0.035, 0.16, 4),
                  navyMat.clone()
                );
                claw.rotation.x = -Math.PI / 2;
                claw.position.set(sx * LEG_X + dx, footY - 0.02, 0.32);
                g.add(claw);
              });
            });
            break;
          }
          if (kind === 'charizard_boots') {
            // Orange Charizard feet: chunky orange claws + cream sole +
            // 3 sharp cream/white claws at the toe.
            const orangeMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.55,
            });
            const clawMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#fef3c7'),
              roughness: 0.4,
            });
            [-1, 1].forEach((sx) => {
              const foot = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.08, 0.16, 0.4),
                orangeMat.clone()
              );
              foot.position.set(sx * LEG_X, footY, 0.08);
              g.add(foot);
              // Cream sole
              const sole = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.1, 0.06, 0.42),
                clawMat.clone()
              );
              sole.position.set(sx * LEG_X, footY - 0.09, 0.08);
              g.add(sole);
              // 3 sharp claws at the toe
              [-0.1, 0, 0.1].forEach((dx) => {
                const claw = new THREE.Mesh(
                  new THREE.ConeGeometry(0.03, 0.11, 4),
                  clawMat.clone()
                );
                claw.rotation.x = -Math.PI / 2;
                claw.position.set(sx * LEG_X + dx, footY - 0.03, 0.32);
                g.add(claw);
              });
              // Ankle scale ring (orange darker)
              const ankle = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.09, 0.05, 0.15),
                orangeMat.clone()
              );
              ankle.position.set(sx * LEG_X, footY + 0.12, 0.06);
              g.add(ankle);
            });
            break;
          }

          if (
            kind === 'batman' ||
            kind === 'captain_america' ||
            kind === 'thor' ||
            kind === 'superman' ||
            kind === 'flash' ||
            kind === 'panther'
          ) {
            const trimMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#0a0a0a'),
              metalness: kind === 'thor' || kind === 'panther' ? 0.55 : 0.2,
              roughness: 0.3,
            });
            [-1, 1].forEach((sx) => {
              const boot = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.07, 0.26, 0.38),
                mat.clone()
              );
              boot.position.set(sx * LEG_X, footY + 0.06, 0.06);
              g.add(boot);
              const sole = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.09, 0.06, 0.42),
                trimMat.clone()
              );
              sole.position.set(sx * LEG_X, footY - 0.08, 0.06);
              g.add(sole);
              if (kind === 'thor' || kind === 'captain_america') {
                // Metallic strap across the top of the boot
                const strapBoot = new THREE.Mesh(
                  new THREE.BoxGeometry(LEG_W + 0.1, 0.05, 0.06),
                  trimMat.clone()
                );
                strapBoot.position.set(sx * LEG_X, footY + 0.12, 0.16);
                g.add(strapBoot);
              } else if (kind === 'flash') {
                // Lightning bolt wing at the ankle
                const wingBoot = new THREE.Mesh(
                  new THREE.BoxGeometry(0.06, 0.16, 0.04),
                  trimMat.clone()
                );
                wingBoot.rotation.z = sx * -0.6;
                wingBoot.position.set(
                  sx * (LEG_X + LEG_W / 2 + 0.05),
                  footY + 0.18,
                  0.04
                );
                g.add(wingBoot);
              } else if (kind === 'panther') {
                // Silver claw at the toe
                [-0.06, 0, 0.06].forEach((dx) => {
                  const claw = new THREE.Mesh(
                    new THREE.ConeGeometry(0.025, 0.08, 4),
                    trimMat.clone()
                  );
                  claw.rotation.x = -Math.PI / 2;
                  claw.position.set(sx * LEG_X + dx, footY - 0.04, 0.28);
                  g.add(claw);
                });
              } else if (kind === 'batman') {
                // Knee fin
                const fin = new THREE.Mesh(
                  new THREE.BoxGeometry(0.04, 0.12, 0.06),
                  trimMat.clone()
                );
                fin.position.set(
                  sx * (LEG_X + LEG_W / 2 + 0.03),
                  footY + 0.18,
                  0
                );
                g.add(fin);
              } else if (kind === 'superman') {
                // Yellow trim at the top of the boot
                const trimY = new THREE.Mesh(
                  new THREE.BoxGeometry(LEG_W + 0.09, 0.03, 0.4),
                  new THREE.MeshStandardMaterial({ color: '#fde047' })
                );
                trimY.position.set(sx * LEG_X, footY + 0.2, 0.06);
                g.add(trimY);
              }
            });
            break;
          }

          if (
            kind === 'wolverine' ||
            kind === 'dr_strange' ||
            kind === 'starlord' ||
            kind === 'antman' ||
            kind === 'war_machine' ||
            kind === 'vision' ||
            kind === 'daredevil' ||
            kind === 'hawkeye' ||
            kind === 'falcon' ||
            kind === 'venom' ||
            kind === 'ghost_rider' ||
            kind === 'silver_surfer'
          ) {
            const trimMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#1f2937'),
              metalness: kind === 'war_machine' || kind === 'silver_surfer' ? 0.6 : 0.2,
            });
            [-1, 1].forEach((sx) => {
              const boot = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.07, 0.26, 0.38),
                mat.clone()
              );
              boot.position.set(sx * LEG_X, footY + 0.06, 0.06);
              g.add(boot);
              const sole = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.09, 0.06, 0.42),
                trimMat.clone()
              );
              sole.position.set(sx * LEG_X, footY - 0.08, 0.06);
              g.add(sole);
              if (kind === 'wolverine') {
                // Yellow boot stripe
                const stripe = new THREE.Mesh(
                  new THREE.BoxGeometry(LEG_W + 0.09, 0.04, 0.4),
                  trimMat.clone()
                );
                stripe.position.set(sx * LEG_X, footY + 0.18, 0.06);
                g.add(stripe);
              } else if (kind === 'starlord' || kind === 'hawkeye') {
                // Strap across the boot top
                const strap = new THREE.Mesh(
                  new THREE.BoxGeometry(LEG_W + 0.1, 0.05, 0.06),
                  trimMat.clone()
                );
                strap.position.set(sx * LEG_X, footY + 0.12, 0.16);
                g.add(strap);
              } else if (kind === 'war_machine') {
                // Heavy armor plate
                const plate = new THREE.Mesh(
                  new THREE.BoxGeometry(LEG_W + 0.13, 0.12, 0.4),
                  trimMat.clone()
                );
                plate.position.set(sx * LEG_X, footY + 0.04, 0.06);
                g.add(plate);
              } else if (kind === 'vision') {
                // Yellow ankle ring
                const ring = new THREE.Mesh(
                  new THREE.TorusGeometry(0.14, 0.022, 8, 16),
                  trimMat.clone()
                );
                ring.rotation.x = Math.PI / 2;
                ring.position.set(sx * LEG_X, footY + 0.16, 0);
                g.add(ring);
              } else if (kind === 'falcon') {
                // Gold strap + small fin on the back
                const strap = new THREE.Mesh(
                  new THREE.BoxGeometry(LEG_W + 0.1, 0.05, 0.06),
                  trimMat.clone()
                );
                strap.position.set(sx * LEG_X, footY + 0.12, 0.12);
                g.add(strap);
                const fin = new THREE.Mesh(
                  new THREE.BoxGeometry(0.04, 0.1, 0.06),
                  trimMat.clone()
                );
                fin.position.set(sx * LEG_X, footY + 0.18, -0.16);
                g.add(fin);
              } else if (kind === 'venom') {
                // Sharp white claws at the toe
                [-0.08, 0, 0.08].forEach((dx) => {
                  const claw = new THREE.Mesh(
                    new THREE.ConeGeometry(0.025, 0.08, 4),
                    trimMat.clone()
                  );
                  claw.rotation.x = -Math.PI / 2;
                  claw.position.set(sx * LEG_X + dx, footY - 0.04, 0.26);
                  g.add(claw);
                });
              } else if (kind === 'ghost_rider') {
                // Chain wrapped around ankle
                const chain = new THREE.Mesh(
                  new THREE.TorusGeometry(0.14, 0.018, 8, 16),
                  trimMat.clone()
                );
                chain.rotation.x = Math.PI / 2;
                chain.position.set(sx * LEG_X, footY + 0.14, 0);
                g.add(chain);
              } else if (kind === 'silver_surfer') {
                // Smooth metallic ankle band
                const ank = new THREE.Mesh(
                  new THREE.BoxGeometry(LEG_W + 0.08, 0.04, 0.4),
                  trimMat.clone()
                );
                ank.position.set(sx * LEG_X, footY + 0.18, 0.06);
                g.add(ank);
              } else if (kind === 'antman') {
                // Red knee band on top of black boot
                const band = new THREE.Mesh(
                  new THREE.BoxGeometry(LEG_W + 0.08, 0.04, 0.4),
                  trimMat.clone()
                );
                band.position.set(sx * LEG_X, footY + 0.18, 0.06);
                g.add(band);
              } else if (kind === 'daredevil' || kind === 'dr_strange') {
                // Black/brown sole trim already done; add knee fin
                const fin = new THREE.Mesh(
                  new THREE.BoxGeometry(0.04, 0.12, 0.06),
                  trimMat.clone()
                );
                fin.position.set(sx * (LEG_X + LEG_W / 2 + 0.03), footY + 0.18, 0);
                g.add(fin);
              }
            });
            break;
          }

          if (kind === 'slp_girl') {
            // Black Mary Janes: rounded flat shoes + an ankle strap with
            // a small gold buckle.
            const shoeMat = new THREE.MeshStandardMaterial({
              color,
              metalness: 0.3,
              roughness: 0.25,
            });
            const soleMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#475569'),
              roughness: 0.6,
            });
            const buckleMat = new THREE.MeshStandardMaterial({
              color: '#fbbf24',
              metalness: 0.6,
              roughness: 0.3,
            });
            [-1, 1].forEach((sx) => {
              const shoe = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.06, 0.11, 0.36),
                shoeMat.clone()
              );
              shoe.position.set(sx * LEG_X, footY, 0.06);
              g.add(shoe);
              const sole = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.08, 0.04, 0.4),
                soleMat.clone()
              );
              sole.position.set(sx * LEG_X, footY - 0.07, 0.06);
              g.add(sole);
              // Ankle strap across the top of the foot
              const strap = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.07, 0.035, 0.06),
                shoeMat.clone()
              );
              strap.position.set(sx * LEG_X, footY + 0.08, 0.14);
              g.add(strap);
              // Tiny gold buckle on the strap
              const buckle = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.03, 0.035),
                buckleMat.clone()
              );
              buckle.position.set(sx * LEG_X, footY + 0.08, 0.18);
              g.add(buckle);
            });
            break;
          }

          if (kind === 'slp') {
            // Polished black school dress shoes with a contrasting sole.
            const shoeMat = new THREE.MeshStandardMaterial({
              color,
              metalness: 0.4,
              roughness: 0.2,
            });
            const soleMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#475569'),
              roughness: 0.6,
            });
            [-1, 1].forEach((sx) => {
              const shoe = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.07, 0.13, 0.42),
                shoeMat.clone()
              );
              shoe.position.set(sx * LEG_X, footY, 0.08);
              g.add(shoe);
              const sole = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.09, 0.04, 0.44),
                soleMat.clone()
              );
              sole.position.set(sx * LEG_X, footY - 0.08, 0.08);
              g.add(sole);
              // Toe cap (glossy raised band at the toe)
              const toeCap = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.07, 0.13, 0.1),
                new THREE.MeshStandardMaterial({
                  color,
                  metalness: 0.55,
                  roughness: 0.12,
                })
              );
              toeCap.position.set(sx * LEG_X, footY, 0.24);
              g.add(toeCap);
            });
            break;
          }

          if (kind === 'spiderman') {
            // Red boots with a black sole and a web line up the front.
            const soleMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#10101e'),
            });
            [-1, 1].forEach((sx) => {
              const boot = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.06, 0.24, 0.36),
                mat.clone()
              );
              boot.position.set(sx * LEG_X, footY + 0.05, 0.06);
              g.add(boot);
              const sole = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.08, 0.05, 0.4),
                soleMat.clone()
              );
              sole.position.set(sx * LEG_X, footY - 0.08, 0.06);
              g.add(sole);
              const web = new THREE.Mesh(
                new THREE.BoxGeometry(0.012, 0.22, 0.3),
                soleMat.clone()
              );
              web.position.set(sx * LEG_X, footY + 0.05, 0.06);
              g.add(web);
            });
            break;
          }

          if (kind === 'hulk') {
            // Bare green feet with chunky toes (no shoes).
            const shadeMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#3f6212'),
            });
            [-1, 1].forEach((sx) => {
              const foot = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.07, 0.15, 0.42),
                mat.clone()
              );
              foot.position.set(sx * LEG_X, footY, 0.08);
              g.add(foot);
              const heel = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.07, 0.15, 0.16),
                mat.clone()
              );
              heel.position.set(sx * LEG_X, footY, -0.12);
              g.add(heel);
              [-0.1, -0.035, 0.035, 0.1].forEach((dx) => {
                const toe = new THREE.Mesh(
                  new THREE.SphereGeometry(0.04, 8, 8),
                  mat.clone()
                );
                toe.position.set(sx * LEG_X + dx, footY - 0.02, 0.3);
                g.add(toe);
              });
              // toe-crease shading
              const crease = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.05, 0.01, 0.02),
                shadeMat.clone()
              );
              crease.position.set(sx * LEG_X, footY + 0.04, 0.26);
              g.add(crease);
            });
            break;
          }

          if (kind === 'glass_slipper') {
            // Translucent shiny heels with a tiny sparkle on each toe.
            const glassMat = new THREE.MeshStandardMaterial({
              color,
              transparent: true,
              opacity: 0.55,
              metalness: 0.6,
              roughness: 0.05,
            });
            const sparkleMat = new THREE.MeshStandardMaterial({
              color: '#ffffff',
              emissive: '#ffffff',
              emissiveIntensity: 1.0,
            });
            [-1, 1].forEach((sx) => {
              const sole = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.06, 0.07, 0.36),
                glassMat.clone()
              );
              sole.position.set(sx * LEG_X, footY - 0.04, 0.06);
              g.add(sole);
              const heel = new THREE.Mesh(
                new THREE.BoxGeometry(0.07, 0.13, 0.07),
                glassMat.clone()
              );
              heel.position.set(sx * LEG_X, footY - 0.13, -0.07);
              g.add(heel);
              const sparkle = new THREE.Mesh(
                new THREE.SphereGeometry(0.02, 10, 10),
                sparkleMat.clone()
              );
              sparkle.position.set(sx * LEG_X + 0.03, footY - 0.01, 0.18);
              g.add(sparkle);
            });
            break;
          }

          if (kind === 'ballet') {
            // Soft pink flats with crossed ribbons up the ankle and a bow.
            const ribbonMat = accent
              ? new THREE.MeshStandardMaterial({ color: accent })
              : new THREE.MeshStandardMaterial({ color });
            [-1, 1].forEach((sx) => {
              const sole = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.06, 0.09, 0.34),
                mat.clone()
              );
              sole.position.set(sx * LEG_X, footY - 0.02, 0.06);
              g.add(sole);
              const r1 = new THREE.Mesh(
                new THREE.BoxGeometry(0.022, 0.2, 0.022),
                ribbonMat.clone()
              );
              r1.rotation.z = sx * 0.45;
              r1.position.set(sx * LEG_X, footY + 0.08, 0.08);
              g.add(r1);
              const r2 = new THREE.Mesh(
                new THREE.BoxGeometry(0.022, 0.2, 0.022),
                ribbonMat.clone()
              );
              r2.rotation.z = -sx * 0.45;
              r2.position.set(sx * LEG_X, footY + 0.08, 0.08);
              g.add(r2);
              const bowCenter = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.04, 0.04),
                ribbonMat.clone()
              );
              bowCenter.position.set(sx * LEG_X, footY + 0.18, 0.08);
              g.add(bowCenter);
              [-1, 1].forEach((sy) => {
                const petal = new THREE.Mesh(
                  new THREE.BoxGeometry(0.07, 0.05, 0.025),
                  ribbonMat.clone()
                );
                petal.position.set(sx * LEG_X + sy * 0.05, footY + 0.18, 0.08);
                g.add(petal);
              });
            });
            break;
          }

          if (kind === 'ribbon_heel') {
            // Small heels with a contrasting bow on the toe.
            const bowMat = accent
              ? new THREE.MeshStandardMaterial({ color: accent })
              : new THREE.MeshStandardMaterial({ color });
            [-1, 1].forEach((sx) => {
              const sole = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.06, 0.06, 0.34),
                mat.clone()
              );
              sole.position.set(sx * LEG_X, footY - 0.03, 0.06);
              g.add(sole);
              const heel = new THREE.Mesh(
                new THREE.BoxGeometry(0.06, 0.1, 0.08),
                mat.clone()
              );
              heel.position.set(sx * LEG_X, footY - 0.11, -0.06);
              g.add(heel);
              const bowCenter = new THREE.Mesh(
                new THREE.BoxGeometry(0.045, 0.045, 0.045),
                bowMat.clone()
              );
              bowCenter.position.set(sx * LEG_X, footY + 0.04, 0.18);
              g.add(bowCenter);
              [-1, 1].forEach((sy) => {
                const petal = new THREE.Mesh(
                  new THREE.BoxGeometry(0.08, 0.06, 0.03),
                  bowMat.clone()
                );
                petal.position.set(sx * LEG_X + sy * 0.06, footY + 0.04, 0.18);
                g.add(petal);
              });
            });
            break;
          }

          [-1, 1].forEach((sx) => {
            if (
              kind === 'boots' ||
              kind === 'rainboots' ||
              kind === 'snowboots'
            ) {
              const shaft = new THREE.Mesh(
                new THREE.CylinderGeometry(
                  LEG_W * 0.55,
                  LEG_W * 0.55,
                  0.34,
                  16
                ),
                mat.clone()
              );
              shaft.position.set(sx * LEG_X, footY + 0.18, 0);
              g.add(shaft);
              const toe = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.06, 0.16, 0.34),
                mat.clone()
              );
              toe.position.set(sx * LEG_X, footY - 0.06, 0.1);
              g.add(toe);
              if (kind === 'snowboots' && accMat) {
                const fur = new THREE.Mesh(
                  new THREE.CylinderGeometry(
                    LEG_W * 0.65,
                    LEG_W * 0.65,
                    0.1,
                    20
                  ),
                  accMat.clone()
                );
                fur.position.set(sx * LEG_X, footY + 0.34, 0);
                g.add(fur);
              }
              if (kind === 'rainboots' && accMat) {
                const sole = new THREE.Mesh(
                  new THREE.BoxGeometry(LEG_W + 0.07, 0.05, 0.36),
                  accMat.clone()
                );
                sole.position.set(sx * LEG_X, footY - 0.14, 0.08);
                g.add(sole);
              }
              if (kind === 'boots' && accMat) {
                // buckle on side
                const buckle = new THREE.Mesh(
                  new THREE.BoxGeometry(0.06, 0.04, 0.04),
                  accMat.clone()
                );
                buckle.position.set(
                  sx * (LEG_X + LEG_W * 0.55 + 0.02),
                  footY + 0.12,
                  0
                );
                g.add(buckle);
              }
            } else if (kind === 'sandals') {
              const sole = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.08, 0.06, 0.38),
                mat.clone()
              );
              sole.position.set(sx * LEG_X, footY - 0.04, 0.06);
              g.add(sole);
              if (accMat) {
                // T-strap
                const strap1 = new THREE.Mesh(
                  new THREE.BoxGeometry(LEG_W + 0.04, 0.03, 0.06),
                  accMat.clone()
                );
                strap1.position.set(sx * LEG_X, footY, 0.1);
                g.add(strap1);
                const strap2 = new THREE.Mesh(
                  new THREE.BoxGeometry(0.04, 0.03, 0.18),
                  accMat.clone()
                );
                strap2.position.set(sx * LEG_X, footY, 0.16);
                g.add(strap2);
              }
            } else if (kind === 'flat') {
              const shoe = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.06, 0.12, 0.36),
                mat.clone()
              );
              shoe.position.set(sx * LEG_X, footY - 0.02, 0.06);
              g.add(shoe);
              if (accMat) {
                // bow
                const bow = new THREE.Mesh(
                  new THREE.SphereGeometry(0.06, 14, 14),
                  accMat.clone()
                );
                bow.scale.set(1.6, 0.7, 0.7);
                bow.position.set(sx * LEG_X, footY + 0.04, 0.18);
                g.add(bow);
                const knot = new THREE.Mesh(
                  new THREE.SphereGeometry(0.025, 10, 10),
                  accMat.clone()
                );
                knot.position.set(sx * LEG_X, footY + 0.04, 0.18);
                g.add(knot);
              }
            } else if (kind === 'skates') {
              const shoe = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.06, 0.16, 0.42),
                mat.clone()
              );
              shoe.position.set(sx * LEG_X, footY, 0.06);
              g.add(shoe);
              const wheelMat = accMat
                ? accMat.clone()
                : new THREE.MeshStandardMaterial({ color: '#0f172a' });
              const wheelPositions: [number, number][] = [
                [0, -0.14],
                [0, 0],
                [0, 0.14],
                [0, 0.28],
              ];
              wheelPositions.forEach(([_, dz]) => {
                const w = new THREE.Mesh(
                  new THREE.CylinderGeometry(0.07, 0.07, 0.07, 14),
                  wheelMat.clone()
                );
                w.rotation.z = Math.PI / 2;
                w.position.set(sx * LEG_X, footY - 0.13, dz);
                g.add(w);
              });
            } else if (kind === 'ironman') {
              const bootMat = new THREE.MeshStandardMaterial({
                color,
                metalness: 0,
                roughness: 0.5,
                emissive: new THREE.Color(color.getHex()).multiplyScalar(0.025),
              });
              const accentColor = accent ?? new THREE.Color('#b91c1c');
              const accentMat = new THREE.MeshStandardMaterial({
                color: accentColor,
                metalness: 0,
                roughness: 0.55,
                emissive: new THREE.Color(accentColor.getHex()).multiplyScalar(0.02),
              });
              // Gold shin guard
              const shin = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.06, 0.2, 0.22),
                bootMat.clone()
              );
              shin.position.set(sx * LEG_X, footY + 0.1, 0);
              g.add(shin);
              // Gold boot box
              const boot = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.1, 0.16, 0.46),
                bootMat.clone()
              );
              boot.position.set(sx * LEG_X, footY, 0.08);
              g.add(boot);
              // Red toe cap
              const toe = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.11, 0.14, 0.16),
                accentMat.clone()
              );
              toe.position.set(sx * LEG_X, footY, 0.24);
              g.add(toe);
              // Repulsor thruster glow on the sole
              const repulsor = new THREE.Mesh(
                new THREE.CircleGeometry(0.06, 18),
                new THREE.MeshStandardMaterial({
                  color: '#a5f3fc',
                  emissive: '#22d3ee',
                  emissiveIntensity: 1.4,
                })
              );
              repulsor.rotation.x = -Math.PI / 2;
              repulsor.position.set(sx * LEG_X, footY - 0.085, 0.06);
              g.add(repulsor);
            } else if (kind === 'robot') {
              const chromeMat = new THREE.MeshStandardMaterial({
                color,
                metalness: 0.85,
                roughness: 0.2,
              });
              // Chunky armored block above the foot
              const ankle = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.08, 0.18, 0.22),
                chromeMat.clone()
              );
              ankle.position.set(sx * LEG_X, footY + 0.06, 0.0);
              g.add(ankle);
              // Toe plate
              const toe = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.1, 0.16, 0.42),
                chromeMat.clone()
              );
              toe.position.set(sx * LEG_X, footY, 0.08);
              g.add(toe);
              // Tread sole
              const soleCol = accent ?? '#1e293b';
              const sole = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.12, 0.06, 0.46),
                new THREE.MeshStandardMaterial({ color: soleCol })
              );
              sole.position.set(sx * LEG_X, footY - 0.09, 0.06);
              g.add(sole);
              // Ankle bolt
              const bolt = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 0.06, 10),
                new THREE.MeshStandardMaterial({
                  color: '#22d3ee',
                  emissive: '#22d3ee',
                  emissiveIntensity: 0.6,
                })
              );
              bolt.rotation.z = Math.PI / 2;
              bolt.position.set(sx * LEG_X, footY + 0.1, 0.12);
              g.add(bolt);
            } else if (kind === 'lightup') {
              const shoe = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.06, 0.16, 0.42),
                mat.clone()
              );
              shoe.position.set(sx * LEG_X, footY, 0.06);
              g.add(shoe);
              const glowCol = accent ?? '#fde047';
              const glow = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.08, 0.05, 0.44),
                new THREE.MeshStandardMaterial({
                  color: glowCol,
                  emissive: glowCol,
                  emissiveIntensity: 1.0,
                })
              );
              glow.position.set(sx * LEG_X, footY - 0.08, 0.06);
              g.add(glow);
            } else if (kind === 'solmoe') {
              // Orange soccer cleat with a dark green swoosh stripe and a
              // studded sole.
              const cleat = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.07, 0.14, 0.46),
                mat.clone()
              );
              cleat.position.set(sx * LEG_X, footY, 0.08);
              g.add(cleat);
              if (accMat) {
                // Dark green swoosh band across the side
                const swoosh = new THREE.Mesh(
                  new THREE.BoxGeometry(LEG_W + 0.09, 0.04, 0.3),
                  accMat.clone()
                );
                swoosh.rotation.z = 0.15;
                swoosh.position.set(sx * LEG_X, footY + 0.02, 0.08);
                g.add(swoosh);
              }
              // Studded sole
              const sole = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.09, 0.04, 0.48),
                new THREE.MeshStandardMaterial({ color: '#0a0a0a' })
              );
              sole.position.set(sx * LEG_X, footY - 0.07, 0.08);
              g.add(sole);
              // Studs underneath
              const studMat = new THREE.MeshStandardMaterial({ color: '#0a0a0a' });
              for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                  if (i === 0 && j === 0) continue;
                  const stud = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.018, 0.018, 0.025, 8),
                    studMat.clone()
                  );
                  stud.position.set(
                    sx * LEG_X + i * 0.04,
                    footY - 0.1,
                    0.08 + j * 0.16
                  );
                  g.add(stud);
                }
              }
            } else {
              // sneakers / sport
              const shoe = new THREE.Mesh(
                new THREE.BoxGeometry(LEG_W + 0.06, 0.16, 0.42),
                mat.clone()
              );
              shoe.position.set(sx * LEG_X, footY, 0.06);
              g.add(shoe);
              if (accMat) {
                const sole = new THREE.Mesh(
                  new THREE.BoxGeometry(LEG_W + 0.07, 0.05, 0.44),
                  accMat.clone()
                );
                sole.position.set(sx * LEG_X, footY - 0.08, 0.06);
                g.add(sole);
                if (kind === 'sport') {
                  const stripe = new THREE.Mesh(
                    new THREE.BoxGeometry(LEG_W + 0.08, 0.04, 0.22),
                    accMat.clone()
                  );
                  stripe.position.set(sx * LEG_X, footY, 0.06);
                  g.add(stripe);
                } else {
                  // laces (small accent crosshatch on top)
                  for (let i = 0; i < 3; i++) {
                    const lace = new THREE.Mesh(
                      new THREE.BoxGeometry(LEG_W * 0.6, 0.02, 0.04),
                      accMat.clone()
                    );
                    lace.position.set(sx * LEG_X, footY + 0.08, 0.18 - i * 0.07);
                    g.add(lace);
                  }
                }
              }
            }
          });
          break;
        }
        case 'charm': {
          const kind =
            item.kind ??
            (item.shape === 'diamond'
              ? 'diamond'
              : item.shape === 'box'
                ? 'cube'
                : 'star');
          // Hang the charm off the bag/strap on the right side.
          const cx = TORSO_W / 2 + 0.08;
          const cy = TORSO_Y - 0.05;
          const cz = -TORSO_D / 2 - 0.04;

          const string = new THREE.Mesh(
            new THREE.CylinderGeometry(0.008, 0.008, 0.18, 6),
            new THREE.MeshStandardMaterial({ color: '#94a3b8' })
          );
          string.position.set(cx, cy + 0.16, cz);
          g.add(string);
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.025, 0.008, 8, 12),
            new THREE.MeshStandardMaterial({
              color: '#cbd5e1',
              metalness: 0.7,
              roughness: 0.3,
            })
          );
          ring.position.set(cx, cy + 0.13, cz);
          g.add(ring);

          const shinyMat = new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.3,
            metalness: 0.4,
            roughness: 0.4,
          });

          if (kind === 'diamond') {
            const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.13), shinyMat);
            c.position.set(cx, cy, cz);
            g.add(c);
          } else if (kind === 'cube') {
            const c = new THREE.Mesh(
              new THREE.BoxGeometry(0.18, 0.18, 0.18),
              shinyMat
            );
            c.position.set(cx, cy, cz);
            c.rotation.set(0.4, 0.4, 0);
            g.add(c);
          } else if (kind === 'coin') {
            const c = new THREE.Mesh(
              new THREE.CylinderGeometry(0.13, 0.13, 0.04, 24),
              shinyMat
            );
            c.rotation.x = Math.PI / 2;
            c.position.set(cx, cy, cz);
            g.add(c);
            const w = new THREE.Mesh(
              new THREE.BoxGeometry(0.05, 0.07, 0.005),
              new THREE.MeshStandardMaterial({ color: '#7c2d12' })
            );
            w.position.set(cx, cy, cz + 0.025);
            g.add(w);
          } else if (kind === 'bell') {
            const body = new THREE.Mesh(
              new THREE.ConeGeometry(0.13, 0.22, 18),
              shinyMat
            );
            body.position.set(cx, cy + 0.02, cz);
            g.add(body);
            const rim = new THREE.Mesh(
              new THREE.TorusGeometry(0.13, 0.018, 8, 18),
              shinyMat.clone()
            );
            rim.rotation.x = Math.PI / 2;
            rim.position.set(cx, cy - 0.08, cz);
            g.add(rim);
            const clap = new THREE.Mesh(
              new THREE.SphereGeometry(0.04, 12, 12),
              new THREE.MeshStandardMaterial({ color: '#7c2d12' })
            );
            clap.position.set(cx, cy - 0.12, cz);
            g.add(clap);
          } else if (kind === 'moon') {
            const moon = new THREE.Mesh(
              new THREE.TorusGeometry(0.1, 0.05, 14, 28, Math.PI),
              shinyMat
            );
            moon.rotation.z = Math.PI / 2;
            moon.position.set(cx, cy, cz);
            g.add(moon);
            const cap1 = new THREE.Mesh(
              new THREE.SphereGeometry(0.05, 14, 14),
              shinyMat.clone()
            );
            cap1.position.set(cx - 0.1, cy, cz);
            g.add(cap1);
            const cap2 = new THREE.Mesh(
              new THREE.SphereGeometry(0.05, 14, 14),
              shinyMat.clone()
            );
            cap2.position.set(cx + 0.1, cy, cz);
            g.add(cap2);
          } else if (kind === 'sun') {
            const disk = new THREE.Mesh(
              new THREE.SphereGeometry(0.1, 18, 14),
              shinyMat
            );
            disk.position.set(cx, cy, cz);
            g.add(disk);
            for (let i = 0; i < 8; i++) {
              const a = (i / 8) * Math.PI * 2;
              const ray = new THREE.Mesh(
                new THREE.ConeGeometry(0.025, 0.09, 8),
                shinyMat.clone()
              );
              ray.position.set(
                cx + Math.cos(a) * 0.17,
                cy + Math.sin(a) * 0.17,
                cz
              );
              ray.rotation.z = a - Math.PI / 2;
              g.add(ray);
            }
          } else if (kind === 'cherry') {
            const c1 = new THREE.Mesh(
              new THREE.SphereGeometry(0.08, 16, 14),
              shinyMat
            );
            c1.position.set(cx - 0.06, cy - 0.04, cz);
            g.add(c1);
            const c2 = new THREE.Mesh(
              new THREE.SphereGeometry(0.08, 16, 14),
              shinyMat.clone()
            );
            c2.position.set(cx + 0.06, cy - 0.04, cz);
            g.add(c2);
            // little white shine on each cherry
            const shineMat = new THREE.MeshStandardMaterial({
              color: '#ffffff',
              emissive: '#ffffff',
              emissiveIntensity: 0.8,
            });
            const sh1 = new THREE.Mesh(
              new THREE.SphereGeometry(0.018, 8, 8),
              shineMat.clone()
            );
            sh1.position.set(cx - 0.08, cy + 0.0, cz + 0.06);
            g.add(sh1);
            const sh2 = new THREE.Mesh(
              new THREE.SphereGeometry(0.018, 8, 8),
              shineMat.clone()
            );
            sh2.position.set(cx + 0.04, cy + 0.0, cz + 0.06);
            g.add(sh2);
            const stem = new THREE.Mesh(
              new THREE.CylinderGeometry(0.012, 0.012, 0.14, 6),
              new THREE.MeshStandardMaterial({ color: '#15803d' })
            );
            stem.rotation.z = 0.25;
            stem.position.set(cx, cy + 0.08, cz);
            g.add(stem);
            const leaf = new THREE.Mesh(
              new THREE.BoxGeometry(0.1, 0.025, 0.04),
              new THREE.MeshStandardMaterial({ color: '#22c55e' })
            );
            leaf.rotation.z = 0.5;
            leaf.position.set(cx + 0.06, cy + 0.12, cz);
            g.add(leaf);
          } else if (kind === 'lightning') {
            const boltMat = new THREE.MeshStandardMaterial({
              color,
              emissive: color,
              emissiveIntensity: 0.85,
            });
            const b1 = new THREE.Mesh(
              new THREE.BoxGeometry(0.06, 0.18, 0.04),
              boltMat
            );
            b1.rotation.z = -0.5;
            b1.position.set(cx - 0.025, cy + 0.07, cz);
            g.add(b1);
            const b2 = new THREE.Mesh(
              new THREE.BoxGeometry(0.06, 0.18, 0.04),
              boltMat.clone()
            );
            b2.rotation.z = 0.5;
            b2.position.set(cx + 0.025, cy - 0.07, cz);
            g.add(b2);
          } else if (kind === 'ironman') {
            // Glowing arc reactor pendant
            const ringColor = accent ?? new THREE.Color('#fbbf24');
            const ringMat = new THREE.MeshStandardMaterial({
              color: ringColor,
              metalness: 0,
              roughness: 0.45,
              emissive: new THREE.Color(ringColor.getHex()).multiplyScalar(0.15),
            });
            const reactorRing = new THREE.Mesh(
              new THREE.TorusGeometry(0.085, 0.02, 12, 24),
              ringMat
            );
            reactorRing.position.set(cx, cy, cz);
            g.add(reactorRing);
            const reactorCore = new THREE.Mesh(
              new THREE.CircleGeometry(0.075, 24),
              new THREE.MeshStandardMaterial({
                color: '#a5f3fc',
                emissive: color,
                emissiveIntensity: 1.4,
              })
            );
            reactorCore.position.set(cx, cy, cz + 0.012);
            g.add(reactorCore);
          } else if (kind === 'robot') {
            // Tiny robot head pendant
            const headMat = new THREE.MeshStandardMaterial({
              color,
              metalness: 0.7,
              roughness: 0.3,
            });
            const head = new THREE.Mesh(
              new THREE.BoxGeometry(0.18, 0.16, 0.16),
              headMat
            );
            head.position.set(cx, cy, cz);
            g.add(head);
            // Cyan visor strip
            const visor = new THREE.Mesh(
              new THREE.BoxGeometry(0.16, 0.04, 0.02),
              new THREE.MeshStandardMaterial({
                color: '#22d3ee',
                emissive: '#22d3ee',
                emissiveIntensity: 0.9,
              })
            );
            visor.position.set(cx, cy + 0.015, cz + 0.085);
            g.add(visor);
            // Tiny antenna with red blinker
            const ant = new THREE.Mesh(
              new THREE.CylinderGeometry(0.008, 0.008, 0.07, 6),
              new THREE.MeshStandardMaterial({ color: '#1e293b' })
            );
            ant.position.set(cx, cy + 0.12, cz);
            g.add(ant);
            const blink = new THREE.Mesh(
              new THREE.SphereGeometry(0.022, 10, 10),
              new THREE.MeshStandardMaterial({
                color: '#ef4444',
                emissive: '#ef4444',
                emissiveIntensity: 1.0,
              })
            );
            blink.position.set(cx, cy + 0.165, cz);
            g.add(blink);
          } else if (kind === 'heart') {
            const lobe1 = new THREE.Mesh(
              new THREE.SphereGeometry(0.075, 16, 14),
              shinyMat
            );
            lobe1.position.set(cx - 0.05, cy + 0.03, cz);
            g.add(lobe1);
            const lobe2 = new THREE.Mesh(
              new THREE.SphereGeometry(0.075, 16, 14),
              shinyMat.clone()
            );
            lobe2.position.set(cx + 0.05, cy + 0.03, cz);
            g.add(lobe2);
            const point = new THREE.Mesh(
              new THREE.ConeGeometry(0.1, 0.18, 4),
              shinyMat.clone()
            );
            point.rotation.x = Math.PI;
            point.rotation.y = Math.PI / 4;
            point.position.set(cx, cy - 0.1, cz);
            g.add(point);
          } else if (kind === 'wand') {
            // Gold handle with a glowing star tip — a fairy magic wand.
            const handleMat = new THREE.MeshStandardMaterial({
              color: '#fde68a',
              metalness: 0.5,
              roughness: 0.3,
            });
            const handle = new THREE.Mesh(
              new THREE.CylinderGeometry(0.015, 0.015, 0.24, 8),
              handleMat
            );
            handle.position.set(cx, cy - 0.06, cz);
            g.add(handle);
            const wandShape = new THREE.Shape();
            const outerR = 0.085;
            const innerR = 0.036;
            for (let i = 0; i < 10; i++) {
              const r = i % 2 === 0 ? outerR : innerR;
              const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
              const px = Math.cos(a) * r;
              const py = Math.sin(a) * r;
              if (i === 0) wandShape.moveTo(px, py);
              else wandShape.lineTo(px, py);
            }
            wandShape.closePath();
            const wandGeo = new THREE.ExtrudeGeometry(wandShape, {
              depth: 0.025,
              bevelEnabled: false,
            });
            const tip = new THREE.Mesh(wandGeo, shinyMat);
            tip.position.set(cx, cy + 0.1, cz);
            g.add(tip);
          } else if (kind === 'ribbon_bow') {
            // Classic ribbon bow: center knot, two side loops, two tails.
            const center = new THREE.Mesh(
              new THREE.BoxGeometry(0.06, 0.06, 0.05),
              shinyMat
            );
            center.position.set(cx, cy + 0.02, cz);
            g.add(center);
            [-1, 1].forEach((sx) => {
              const loop = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.08, 0.04),
                shinyMat.clone()
              );
              loop.position.set(cx + sx * 0.08, cy + 0.02, cz);
              g.add(loop);
              const tail = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.13, 0.03),
                shinyMat.clone()
              );
              tail.rotation.z = sx * 0.3;
              tail.position.set(cx + sx * 0.04, cy - 0.1, cz);
              g.add(tail);
            });
          } else if (kind === 'snowflake') {
            // 6-arm snowflake from 3 crossed bars + a center gem.
            const iceMat = new THREE.MeshStandardMaterial({
              color,
              emissive: color,
              emissiveIntensity: 0.55,
              metalness: 0.5,
              roughness: 0.2,
            });
            for (let i = 0; i < 3; i++) {
              const line = new THREE.Mesh(
                new THREE.BoxGeometry(0.16, 0.02, 0.02),
                iceMat.clone()
              );
              line.rotation.z = (i * Math.PI) / 3;
              line.position.set(cx, cy, cz);
              g.add(line);
            }
            const center = new THREE.Mesh(
              new THREE.OctahedronGeometry(0.04),
              new THREE.MeshStandardMaterial({
                color: accent ?? new THREE.Color('#0ea5e9'),
                emissive: accent ?? new THREE.Color('#0ea5e9'),
                emissiveIntensity: 0.6,
              })
            );
            center.position.set(cx, cy, cz + 0.01);
            g.add(center);
          } else if (kind === 'pumpkin_carriage') {
            // Ridged orange pumpkin body + golden wheels + green stem.
            const pumpMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
            const wheelMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#fde047'),
              metalness: 0.6,
              roughness: 0.3,
            });
            const body = new THREE.Mesh(
              new THREE.SphereGeometry(0.1, 14, 12),
              pumpMat
            );
            body.scale.set(1, 0.85, 1);
            body.position.set(cx, cy, cz);
            g.add(body);
            for (let i = 0; i < 3; i++) {
              const ridge = new THREE.Mesh(
                new THREE.TorusGeometry(0.1, 0.012, 6, 16, Math.PI),
                pumpMat.clone()
              );
              ridge.rotation.x = Math.PI / 2;
              ridge.rotation.z = (i - 1) * 0.5;
              ridge.position.set(cx, cy, cz + 0.015);
              g.add(ridge);
            }
            [-1, 1].forEach((sx) => {
              const wheel = new THREE.Mesh(
                new THREE.TorusGeometry(0.04, 0.012, 6, 12),
                wheelMat.clone()
              );
              wheel.rotation.y = Math.PI / 2;
              wheel.position.set(cx + sx * 0.08, cy - 0.09, cz);
              g.add(wheel);
            });
            const stem = new THREE.Mesh(
              new THREE.CylinderGeometry(0.014, 0.014, 0.05, 6),
              new THREE.MeshStandardMaterial({ color: '#15803d' })
            );
            stem.position.set(cx, cy + 0.1, cz);
            g.add(stem);
          } else if (kind === 'seashell') {
            // Small pink half-dome shell with radial ridge lines.
            const shellMat = new THREE.MeshStandardMaterial({
              color,
              roughness: 0.4,
              metalness: 0.2,
            });
            const ridgeMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#f472b6'),
            });
            const shell = new THREE.Mesh(
              new THREE.SphereGeometry(0.11, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
              shellMat
            );
            shell.scale.set(1, 0.7, 1);
            shell.position.set(cx, cy, cz);
            shell.rotation.x = -Math.PI / 4;
            g.add(shell);
            for (let i = -2; i <= 2; i++) {
              const ang = i * 0.25;
              const ridge = new THREE.Mesh(
                new THREE.BoxGeometry(0.008, 0.1, 0.008),
                ridgeMat.clone()
              );
              ridge.rotation.z = ang;
              ridge.position.set(cx + Math.sin(ang) * 0.04, cy + 0.02, cz + 0.04);
              g.add(ridge);
            }
          } else if (kind === 'jigglypuff_charm') {
            // Pink round Jigglypuff head — round pink body + small tuft +
            // big blue eyes + tiny mouth.
            const pinkMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.55,
            });
            const blueMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#3b82f6'),
            });
            // Big round pink body
            const body = new THREE.Mesh(
              new THREE.SphereGeometry(0.1, 16, 12),
              pinkMat
            );
            body.position.set(cx, cy, cz);
            g.add(body);
            // Tuft on top (curl)
            const tuft = new THREE.Mesh(
              new THREE.SphereGeometry(0.035, 10, 8),
              pinkMat.clone()
            );
            tuft.scale.set(1, 1.4, 1);
            tuft.position.set(cx - 0.03, cy + 0.11, cz);
            g.add(tuft);
            // Small pointed ears (Jigglypuff has small cat ears)
            [-1, 1].forEach((sx) => {
              const ear = new THREE.Mesh(
                new THREE.ConeGeometry(0.02, 0.05, 4),
                pinkMat.clone()
              );
              ear.position.set(cx + sx * 0.06, cy + 0.1, cz);
              g.add(ear);
            });
            // Big blue eyes with white highlight
            [-1, 1].forEach((sx) => {
              const eye = new THREE.Mesh(
                new THREE.SphereGeometry(0.024, 12, 10),
                blueMat.clone()
              );
              eye.position.set(cx + sx * 0.04, cy + 0.02, cz + 0.08);
              g.add(eye);
              const hl = new THREE.Mesh(
                new THREE.SphereGeometry(0.008, 6, 6),
                new THREE.MeshStandardMaterial({
                  color: '#f8fafc', emissive: '#f8fafc', emissiveIntensity: 0.4,
                })
              );
              hl.position.set(cx + sx * 0.04 + 0.008, cy + 0.028, cz + 0.088);
              g.add(hl);
            });
            // Small round mouth
            const mouth = new THREE.Mesh(
              new THREE.TorusGeometry(0.015, 0.005, 6, 12, Math.PI),
              new THREE.MeshStandardMaterial({ color: '#0a0a0a' })
            );
            mouth.rotation.z = Math.PI;
            mouth.position.set(cx, cy - 0.04, cz + 0.08);
            g.add(mouth);
          } else if (kind === 'mew_charm') {
            // Pink Mew — small round pink head + big blue eyes + tiny nose
            // + long thin tail curling out.
            const pinkMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.55,
            });
            const blueMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#7dd3fc'),
            });
            // Round pink head
            const head = new THREE.Mesh(
              new THREE.SphereGeometry(0.085, 16, 12),
              pinkMat.clone()
            );
            head.scale.set(1.05, 0.95, 0.95);
            head.position.set(cx, cy, cz);
            g.add(head);
            // Small kitten ears
            [-1, 1].forEach((sx) => {
              const ear = new THREE.Mesh(
                new THREE.ConeGeometry(0.024, 0.05, 4),
                pinkMat.clone()
              );
              ear.rotation.z = sx * 0.3;
              ear.position.set(cx + sx * 0.05, cy + 0.1, cz);
              g.add(ear);
            });
            // Big cyan/blue eyes with sparkle
            [-1, 1].forEach((sx) => {
              const eye = new THREE.Mesh(
                new THREE.SphereGeometry(0.022, 12, 10),
                blueMat.clone()
              );
              eye.position.set(cx + sx * 0.032, cy + 0.015, cz + 0.075);
              g.add(eye);
              const hl = new THREE.Mesh(
                new THREE.SphereGeometry(0.008, 6, 6),
                new THREE.MeshStandardMaterial({
                  color: '#f8fafc', emissive: '#f8fafc', emissiveIntensity: 0.6,
                })
              );
              hl.position.set(cx + sx * 0.032 + 0.006, cy + 0.024, cz + 0.083);
              g.add(hl);
            });
            // Tiny nose + mouth
            const nose = new THREE.Mesh(
              new THREE.SphereGeometry(0.008, 8, 6),
              new THREE.MeshStandardMaterial({ color: '#dc2626' })
            );
            nose.position.set(cx, cy - 0.015, cz + 0.088);
            g.add(nose);
            // Curling tail
            const tailBase = new THREE.Mesh(
              new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6),
              pinkMat.clone()
            );
            tailBase.rotation.z = 0.6;
            tailBase.position.set(cx - 0.08, cy - 0.08, cz);
            g.add(tailBase);
            const tailTip = new THREE.Mesh(
              new THREE.SphereGeometry(0.02, 10, 8),
              pinkMat.clone()
            );
            tailTip.position.set(cx - 0.14, cy - 0.14, cz);
            g.add(tailTip);
          } else if (kind === 'psyduck_charm') {
            // Yellow Psyduck head — round yellow head + orange bill +
            // vacant blue eyes with tiny black pupils + 3 black feather
            // tufts on the crown.
            const yellowMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.55,
            });
            const billMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#f97316'),
              roughness: 0.5,
            });
            const blackMat = new THREE.MeshStandardMaterial({ color: '#0a0a0a' });
            const whiteMat = new THREE.MeshStandardMaterial({ color: '#f8fafc' });
            // Round yellow head
            const head = new THREE.Mesh(
              new THREE.SphereGeometry(0.09, 16, 12),
              yellowMat.clone()
            );
            head.scale.set(1.1, 0.95, 0.95);
            head.position.set(cx, cy, cz);
            g.add(head);
            // Big orange bill
            const bill = new THREE.Mesh(
              new THREE.BoxGeometry(0.11, 0.045, 0.06),
              billMat
            );
            bill.position.set(cx, cy - 0.04, cz + 0.09);
            g.add(bill);
            // White eyes with tiny black pupils (vacant Psyduck stare)
            [-1, 1].forEach((sx) => {
              const white = new THREE.Mesh(
                new THREE.SphereGeometry(0.025, 12, 10),
                whiteMat.clone()
              );
              white.position.set(cx + sx * 0.035, cy + 0.02, cz + 0.075);
              g.add(white);
              const pupil = new THREE.Mesh(
                new THREE.SphereGeometry(0.008, 8, 6),
                blackMat.clone()
              );
              pupil.position.set(cx + sx * 0.035, cy + 0.02, cz + 0.09);
              g.add(pupil);
            });
            // Three little black feather tufts on the crown
            [-0.03, 0, 0.03].forEach((dx, i) => {
              const feather = new THREE.Mesh(
                new THREE.ConeGeometry(0.012, 0.04 + i * 0.005, 4),
                blackMat.clone()
              );
              feather.position.set(cx + dx, cy + 0.11, cz);
              g.add(feather);
            });
          } else if (kind === 'charmander_charm') {
            const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
            const creamMat = new THREE.MeshStandardMaterial({ color: accent ?? '#fef3c7' });
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 12), mat);
            head.position.set(cx, cy, cz);
            g.add(head);
            const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.03), creamMat);
            muzzle.position.set(cx, cy - 0.03, cz + 0.07);
            g.add(muzzle);
            [-1, 1].forEach((sx) => {
              const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), new THREE.MeshStandardMaterial({ color: '#0a0a0a' }));
              eye.position.set(cx + sx * 0.035, cy + 0.02, cz + 0.075);
              g.add(eye);
            });
            const flame = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.08, 5), new THREE.MeshStandardMaterial({ color: '#fbbf24', emissive: '#f97316', emissiveIntensity: 1.0 }));
            flame.position.set(cx, cy + 0.14, cz);
            g.add(flame);
          } else if (kind === 'squirtle_charm') {
            const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
            const creamMat = new THREE.MeshStandardMaterial({ color: accent ?? '#fef3c7' });
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 12), mat);
            head.position.set(cx, cy, cz);
            g.add(head);
            [-1, 1].forEach((sx) => {
              const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), creamMat.clone());
              cheek.scale.set(1, 1, 0.4);
              cheek.position.set(cx + sx * 0.06, cy - 0.02, cz + 0.06);
              g.add(cheek);
              const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), new THREE.MeshStandardMaterial({ color: '#0a0a0a' }));
              eye.position.set(cx + sx * 0.03, cy + 0.02, cz + 0.075);
              g.add(eye);
            });
            const beak = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.018, 0.02), creamMat.clone());
            beak.position.set(cx, cy - 0.03, cz + 0.075);
            g.add(beak);
          } else if (kind === 'bulbasaur_charm') {
            const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
            const darkMat = new THREE.MeshStandardMaterial({ color: accent ?? '#166534' });
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 12), mat);
            head.position.set(cx, cy, cz);
            g.add(head);
            [-1, 1].forEach((sx) => {
              const spot = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), darkMat.clone());
              spot.scale.set(1, 1, 0.4);
              spot.position.set(cx + sx * 0.06, cy + 0.03, cz + 0.06);
              g.add(spot);
              const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), new THREE.MeshStandardMaterial({ color: '#dc2626' }));
              eye.position.set(cx + sx * 0.03, cy + 0.015, cz + 0.075);
              g.add(eye);
            });
            const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), new THREE.MeshStandardMaterial({ color: '#4d7c0f' }));
            bulb.position.set(cx, cy + 0.11, cz - 0.02);
            g.add(bulb);
          } else if (kind === 'eevee_charm') {
            const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
            const creamMat = new THREE.MeshStandardMaterial({ color: accent ?? '#fef3c7', roughness: 0.85 });
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 12), mat);
            head.position.set(cx, cy, cz);
            g.add(head);
            [-1, 1].forEach((sx) => {
              const ear = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 4), mat.clone());
              ear.rotation.z = sx * 0.3;
              ear.position.set(cx + sx * 0.055, cy + 0.11, cz);
              g.add(ear);
              const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), new THREE.MeshStandardMaterial({ color: '#0a0a0a' }));
              eye.position.set(cx + sx * 0.03, cy + 0.02, cz + 0.075);
              g.add(eye);
            });
            // Cream ruff
            for (let i = 0; i < 5; i++) {
              const puff = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), creamMat.clone());
              const a = -Math.PI / 2 + (i / 4) * Math.PI;
              puff.position.set(cx + Math.cos(a) * 0.09, cy - 0.06, cz + Math.sin(a) * 0.05);
              g.add(puff);
            }
          } else if (kind === 'snorlax_charm') {
            const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
            const darkMat = new THREE.MeshStandardMaterial({ color: accent ?? '#0f172a' });
            const body = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 12), mat);
            body.scale.set(1.2, 1.1, 1);
            body.position.set(cx, cy, cz);
            g.add(body);
            [-1, 1].forEach((sx) => {
              const eye = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.006, 6, 12, Math.PI), darkMat.clone());
              eye.rotation.z = Math.PI;
              eye.position.set(cx + sx * 0.035, cy + 0.02, cz + 0.075);
              g.add(eye);
            });
            const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), darkMat.clone());
            mouth.rotation.x = Math.PI / 2;
            mouth.scale.set(1.5, 0.5, 0.6);
            mouth.position.set(cx, cy - 0.04, cz + 0.075);
            g.add(mouth);
          } else if (kind === 'gengar_charm') {
            const mat = new THREE.MeshStandardMaterial({
              color, roughness: 0.55,
              emissive: new THREE.Color(color.getHex()).multiplyScalar(0.08),
            });
            const redMat = new THREE.MeshStandardMaterial({
              color: accent ?? '#dc2626', emissive: '#7f1d1d', emissiveIntensity: 0.6,
            });
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 12), mat);
            head.position.set(cx, cy, cz);
            g.add(head);
            [-1, 1].forEach((sx) => {
              const spike = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.06, 4), mat.clone());
              spike.rotation.z = sx * -0.3;
              spike.position.set(cx + sx * 0.06, cy + 0.11, cz);
              g.add(spike);
              const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), redMat.clone());
              eye.position.set(cx + sx * 0.035, cy + 0.02, cz + 0.075);
              g.add(eye);
            });
            const grin = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 14, Math.PI), redMat.clone());
            grin.rotation.z = Math.PI;
            grin.position.set(cx, cy - 0.04, cz + 0.075);
            g.add(grin);
          } else if (kind === 'charizard_charm') {
            const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
            const creamMat = new THREE.MeshStandardMaterial({ color: accent ?? '#fef3c7' });
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.11, 0.11), mat);
            head.position.set(cx, cy, cz);
            g.add(head);
            const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.02), creamMat.clone());
            muzzle.position.set(cx, cy - 0.03, cz + 0.06);
            g.add(muzzle);
            [-1, 1].forEach((sx) => {
              const horn = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.09, 4), creamMat.clone());
              horn.rotation.x = 0.5;
              horn.rotation.z = sx * -0.3;
              horn.position.set(cx + sx * 0.04, cy + 0.09, cz - 0.02);
              g.add(horn);
              const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), new THREE.MeshStandardMaterial({ color: '#0f172a' }));
              eye.position.set(cx + sx * 0.035, cy + 0.02, cz + 0.06);
              g.add(eye);
            });
          } else if (kind === 'lugia_charm') {
            // Mini Lugia head charm — white elongated head + navy eye-mask
            // spikes + small back-crest + tiny beak.
            const whiteMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
            const navyMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#1e3a8a'),
              roughness: 0.5,
            });
            const head = new THREE.Mesh(
              new THREE.SphereGeometry(0.09, 16, 12),
              whiteMat.clone()
            );
            head.scale.set(0.95, 1.05, 1.2);
            head.position.set(cx, cy, cz);
            g.add(head);
            // Small pointed back-crest
            const crest = new THREE.Mesh(
              new THREE.ConeGeometry(0.028, 0.09, 4),
              navyMat.clone()
            );
            crest.rotation.x = Math.PI / 2 + 0.3;
            crest.position.set(cx, cy + 0.04, cz - 0.09);
            g.add(crest);
            // Beak jut
            const beak = new THREE.Mesh(
              new THREE.SphereGeometry(0.03, 12, 10),
              whiteMat.clone()
            );
            beak.scale.set(0.9, 0.7, 1.4);
            beak.position.set(cx, cy - 0.03, cz + 0.08);
            g.add(beak);
            // Navy eye mask spikes
            [-1, 1].forEach((sx) => {
              const spike = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.02, 0.015),
                navyMat.clone()
              );
              spike.rotation.z = sx * -0.15;
              spike.position.set(cx + sx * 0.03, cy + 0.015, cz + 0.05);
              g.add(spike);
              const outer = new THREE.Mesh(
                new THREE.ConeGeometry(0.015, 0.04, 3),
                navyMat.clone()
              );
              outer.rotation.z = sx * -Math.PI / 2 - sx * 0.3;
              outer.position.set(cx + sx * 0.07, cy + 0.025, cz + 0.04);
              g.add(outer);
              // White eye slit
              const eye = new THREE.Mesh(
                new THREE.SphereGeometry(0.007, 8, 6),
                new THREE.MeshStandardMaterial({
                  color: '#f8fafc', emissive: '#f8fafc', emissiveIntensity: 0.9,
                })
              );
              eye.position.set(cx + sx * 0.03, cy + 0.015, cz + 0.06);
              g.add(eye);
            });
          } else if (kind === 'pikachu_charm') {
            // Mini Pikachu head charm hanging from the bag strap:
            // yellow rounded head + tall pointy ears (black tips) +
            // shiny black eyes with white highlight + red cheeks.
            const yellowMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.55,
              emissive: new THREE.Color(color.getHex()).multiplyScalar(0.05),
            });
            const blackMat = new THREE.MeshStandardMaterial({ color: '#0a0a0a' });
            const redMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#dc2626'),
            });
            const whiteMat = new THREE.MeshStandardMaterial({
              color: '#f8fafc',
              emissive: '#f8fafc', emissiveIntensity: 0.5,
            });
            // Head
            const head = new THREE.Mesh(
              new THREE.SphereGeometry(0.09, 16, 12),
              yellowMat.clone()
            );
            head.scale.set(1.05, 0.95, 0.9);
            head.position.set(cx, cy, cz);
            g.add(head);
            // Ears
            [-1, 1].forEach((sx) => {
              const ear = new THREE.Mesh(
                new THREE.ConeGeometry(0.028, 0.13, 5),
                yellowMat.clone()
              );
              ear.rotation.z = sx * 0.35;
              ear.position.set(cx + sx * 0.055, cy + 0.13, cz);
              g.add(ear);
              const tip = new THREE.Mesh(
                new THREE.ConeGeometry(0.022, 0.05, 5),
                blackMat.clone()
              );
              tip.rotation.z = sx * 0.35;
              tip.position.set(cx + sx * 0.075, cy + 0.185, cz);
              g.add(tip);
            });
            // Eyes
            [-1, 1].forEach((sx) => {
              const eye = new THREE.Mesh(
                new THREE.SphereGeometry(0.018, 12, 10),
                blackMat.clone()
              );
              eye.scale.set(1, 1.15, 0.7);
              eye.position.set(cx + sx * 0.035, cy + 0.015, cz + 0.075);
              g.add(eye);
              const hl = new THREE.Mesh(
                new THREE.SphereGeometry(0.007, 8, 6),
                whiteMat.clone()
              );
              hl.position.set(cx + sx * 0.035 + 0.008, cy + 0.025, cz + 0.083);
              g.add(hl);
            });
            // Red cheeks
            [-1, 1].forEach((sx) => {
              const cheek = new THREE.Mesh(
                new THREE.SphereGeometry(0.024, 10, 8),
                redMat.clone()
              );
              cheek.scale.set(1, 1, 0.4);
              cheek.position.set(cx + sx * 0.07, cy - 0.02, cz + 0.055);
              g.add(cheek);
            });
            // Tiny smile
            const smile = new THREE.Mesh(
              new THREE.TorusGeometry(0.018, 0.006, 6, 12, Math.PI),
              blackMat.clone()
            );
            smile.rotation.z = Math.PI;
            smile.position.set(cx, cy - 0.035, cz + 0.076);
            g.add(smile);
          } else if (kind === 'joon_band') {
            // Yellow wristband — a thin silicone-style ring with a small
            // tag bead, hanging from the bag strap.
            const bandMat = new THREE.MeshStandardMaterial({
              color,
              roughness: 0.6,
              metalness: 0.05,
              emissive: new THREE.Color(color.getHex()).multiplyScalar(0.06),
            });
            const ring = new THREE.Mesh(
              new THREE.TorusGeometry(0.08, 0.022, 12, 24),
              bandMat
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.set(cx, cy, cz);
            g.add(ring);
            // Small darker tag bead on the ring (front side)
            const tag = new THREE.Mesh(
              new THREE.BoxGeometry(0.04, 0.03, 0.02),
              new THREE.MeshStandardMaterial({
                color: accent ?? new THREE.Color('#ca8a04'),
                metalness: 0.4,
                roughness: 0.3,
              })
            );
            tag.position.set(cx, cy - 0.085, cz);
            g.add(tag);
          } else if (kind === 'slp_badge') {
            // White rectangular school name tag with a navy header strip
            // and faint "SLP" letter ticks.
            const badgeMat = new THREE.MeshStandardMaterial({ color });
            const inkMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#1e3a8a'),
            });
            const badge = new THREE.Mesh(
              new THREE.BoxGeometry(0.17, 0.13, 0.025),
              badgeMat
            );
            badge.position.set(cx, cy, cz);
            g.add(badge);
            // Navy header band
            const header = new THREE.Mesh(
              new THREE.BoxGeometry(0.17, 0.045, 0.028),
              inkMat
            );
            header.position.set(cx, cy + 0.04, cz);
            g.add(header);
            // White "SLP" ticks on the header
            for (let i = -1; i <= 1; i++) {
              const tick = new THREE.Mesh(
                new THREE.BoxGeometry(0.025, 0.025, 0.006),
                badgeMat.clone()
              );
              tick.position.set(cx + i * 0.045, cy + 0.04, cz + 0.018);
              g.add(tick);
            }
            // 2 faint name lines underneath
            [-0.02, -0.05].forEach((dy) => {
              const line = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.008, 0.006),
                inkMat.clone()
              );
              line.position.set(cx, cy + dy, cz + 0.016);
              g.add(line);
            });
          } else if (kind === 'rose') {
            // Layered rose: 3 stacked half-spheres + a green leaf below.
            const petalMat = new THREE.MeshStandardMaterial({
              color,
              roughness: 0.5,
            });
            [0.1, 0.075, 0.05].forEach((r, i) => {
              const petal = new THREE.Mesh(
                new THREE.SphereGeometry(r, 14, 12),
                petalMat.clone()
              );
              petal.scale.set(1, 0.7, 1);
              petal.position.set(cx, cy + i * 0.028, cz + i * 0.012);
              g.add(petal);
            });
            const leaf = new THREE.Mesh(
              new THREE.BoxGeometry(0.09, 0.04, 0.02),
              new THREE.MeshStandardMaterial({ color: '#22c55e' })
            );
            leaf.rotation.z = 0.5;
            leaf.position.set(cx - 0.07, cy - 0.06, cz);
            g.add(leaf);
          } else {
            // star
            const shape = new THREE.Shape();
            const outer = 0.14;
            const inner = 0.065;
            for (let i = 0; i < 10; i++) {
              const r = i % 2 === 0 ? outer : inner;
              const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
              const px = Math.cos(a) * r;
              const py = Math.sin(a) * r;
              if (i === 0) shape.moveTo(px, py);
              else shape.lineTo(px, py);
            }
            shape.closePath();
            const geo = new THREE.ExtrudeGeometry(shape, {
              depth: 0.04,
              bevelEnabled: false,
            });
            const star = new THREE.Mesh(geo, shinyMat);
            star.position.set(cx, cy, cz);
            g.add(star);
          }
          break;
        }
        case 'misc': {
          const kind = item.kind ?? 'motorcycle';
          if (kind === 'soccer_ball') {
            // Soccer ball placed at the character's right foot.
            const BALL_R = 0.18;
            const BALL_X = 0.55;
            const BALL_Y = -0.42 + BALL_R;
            const BALL_Z = 0.05;
            const whiteMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.6,
            });
            const blackMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#0f172a'),
              roughness: 0.6,
            });
            const ball = new THREE.Mesh(
              new THREE.SphereGeometry(BALL_R, 24, 18),
              whiteMat
            );
            ball.position.set(BALL_X, BALL_Y, BALL_Z);
            ball.castShadow = true;
            g.add(ball);
            // Black pentagon patches via small flat ovals on the surface
            const PATCHES = 12;
            for (let i = 0; i < PATCHES; i++) {
              const phi = Math.acos(1 - 2 * (i + 0.5) / PATCHES);
              const theta = Math.PI * (1 + Math.sqrt(5)) * i;
              const px = BALL_X + BALL_R * Math.sin(phi) * Math.cos(theta);
              const py = BALL_Y + BALL_R * Math.cos(phi);
              const pz = BALL_Z + BALL_R * Math.sin(phi) * Math.sin(theta);
              const patch = new THREE.Mesh(
                new THREE.SphereGeometry(0.045, 8, 6),
                blackMat.clone()
              );
              patch.scale.set(1, 1, 0.25);
              const dx = px - BALL_X, dy = py - BALL_Y, dz = pz - BALL_Z;
              const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
              const ox = BALL_X + (dx / len) * (BALL_R - 0.005);
              const oy = BALL_Y + (dy / len) * (BALL_R - 0.005);
              const oz = BALL_Z + (dz / len) * (BALL_R - 0.005);
              patch.position.set(ox, oy, oz);
              patch.lookAt(BALL_X, BALL_Y, BALL_Z);
              g.add(patch);
            }
            break;
          }
          if (kind === 'motorcycle') {
            // Full-size Hellfire motorcycle parked to the right of the
            // character: chrome cruiser frame + two spoked wheels in
            // hellfire flame rings + skull-embossed fuel tank + exhaust
            // trail of orange/yellow fire.
            const BIKE_X = 1.15;
            const WHEEL_R = 0.3;
            const WHEEL_THK = 0.09;
            const WHEEL_Y = -0.42 + WHEEL_R;
            const wheelOffset = 0.46;

            const chromeMat = new THREE.MeshStandardMaterial({
              color, metalness: 0.85, roughness: 0.18,
            });
            const tireMat = new THREE.MeshStandardMaterial({
              color: '#0a0a0a', roughness: 0.85,
            });
            const flameOuter = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#fb923c'),
              emissive: '#f97316', emissiveIntensity: 1.2,
            });
            const flameInner = new THREE.MeshStandardMaterial({
              color: '#fde047', emissive: '#facc15', emissiveIntensity: 1.5,
            });
            const flameLight = new THREE.PointLight('#fb923c', 1.0, 2.0);
            flameLight.position.set(BIKE_X - 0.9, WHEEL_Y + 0.2, 0.1);
            g.add(flameLight);

            // Wheels + spokes + flame rings
            [-1, 1].forEach((sx) => {
              const cx0 = BIKE_X + sx * wheelOffset;
              const tire = new THREE.Mesh(
                new THREE.TorusGeometry(WHEEL_R, WHEEL_THK, 12, 28),
                tireMat.clone()
              );
              tire.rotation.y = Math.PI / 2;
              tire.position.set(cx0, WHEEL_Y, 0);
              g.add(tire);
              const hub = new THREE.Mesh(
                new THREE.CylinderGeometry(0.16, 0.16, WHEEL_THK * 1.05, 18),
                chromeMat.clone()
              );
              hub.rotation.z = Math.PI / 2;
              hub.position.set(cx0, WHEEL_Y, 0);
              g.add(hub);
              // 6 chrome spokes across the wheel
              for (let i = 0; i < 6; i++) {
                const ang = (i / 6) * Math.PI;
                const spoke = new THREE.Mesh(
                  new THREE.BoxGeometry(0.025, WHEEL_R * 1.7, 0.025),
                  chromeMat.clone()
                );
                spoke.rotation.x = ang;
                spoke.position.set(cx0, WHEEL_Y, 0);
                g.add(spoke);
              }
              // Hellfire flame ring around each wheel
              for (let i = 0; i < 10; i++) {
                const a = (i / 10) * Math.PI * 2;
                const flame = new THREE.Mesh(
                  new THREE.ConeGeometry(0.055, 0.2, 5),
                  flameOuter.clone()
                );
                const r = WHEEL_R + 0.1;
                flame.position.set(
                  cx0 + Math.cos(a) * r,
                  WHEEL_Y + Math.sin(a) * r,
                  0
                );
                // Point flame outward from wheel center
                flame.rotation.z = a - Math.PI / 2;
                g.add(flame);
                const flameTip = new THREE.Mesh(
                  new THREE.ConeGeometry(0.025, 0.1, 4),
                  flameInner.clone()
                );
                flameTip.position.set(
                  cx0 + Math.cos(a) * (r + 0.06),
                  WHEEL_Y + Math.sin(a) * (r + 0.06),
                  0
                );
                flameTip.rotation.z = a - Math.PI / 2;
                g.add(flameTip);
              }
            });

            // Main horizontal frame between wheels
            const frame = new THREE.Mesh(
              new THREE.BoxGeometry(0.95, 0.09, 0.12),
              chromeMat.clone()
            );
            frame.position.set(BIKE_X, WHEEL_Y + 0.05, 0);
            g.add(frame);
            // Diagonal frame brace
            const brace = new THREE.Mesh(
              new THREE.BoxGeometry(0.7, 0.05, 0.08),
              chromeMat.clone()
            );
            brace.rotation.z = 0.35;
            brace.position.set(BIKE_X - 0.05, WHEEL_Y + 0.2, 0);
            g.add(brace);

            // Teardrop fuel tank
            const tank = new THREE.Mesh(
              new THREE.SphereGeometry(0.18, 18, 12),
              chromeMat.clone()
            );
            tank.scale.set(1.5, 0.7, 0.85);
            tank.position.set(BIKE_X + 0.05, WHEEL_Y + 0.28, 0);
            g.add(tank);

            // Skull emblem on the tank side
            const skull = new THREE.Mesh(
              new THREE.SphereGeometry(0.07, 14, 10),
              new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.6 })
            );
            skull.scale.set(1, 0.95, 0.55);
            skull.position.set(BIKE_X + 0.05, WHEEL_Y + 0.3, 0.2);
            g.add(skull);
            [-1, 1].forEach((sx) => {
              const eye = new THREE.Mesh(
                new THREE.SphereGeometry(0.018, 8, 8),
                new THREE.MeshStandardMaterial({
                  color: '#fb923c',
                  emissive: '#f97316', emissiveIntensity: 1.5,
                })
              );
              eye.position.set(BIKE_X + 0.05 + sx * 0.025, WHEEL_Y + 0.31, 0.24);
              g.add(eye);
            });
            const teeth = new THREE.Mesh(
              new THREE.BoxGeometry(0.06, 0.012, 0.02),
              new THREE.MeshStandardMaterial({ color: '#0a0a0a' })
            );
            teeth.position.set(BIKE_X + 0.05, WHEEL_Y + 0.27, 0.24);
            g.add(teeth);

            // Black leather seat behind tank
            const seat = new THREE.Mesh(
              new THREE.BoxGeometry(0.32, 0.07, 0.18),
              tireMat.clone()
            );
            seat.position.set(BIKE_X - 0.22, WHEEL_Y + 0.32, 0);
            g.add(seat);
            // Sissy bar (vertical chrome rod behind seat)
            const sissyBar = new THREE.Mesh(
              new THREE.BoxGeometry(0.04, 0.4, 0.04),
              chromeMat.clone()
            );
            sissyBar.position.set(BIKE_X - 0.4, WHEEL_Y + 0.55, 0);
            g.add(sissyBar);

            // Front fork (slanted chrome rods from front wheel to handlebar)
            [-1, 1].forEach((sz) => {
              const fork = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.55, 0.04),
                chromeMat.clone()
              );
              fork.rotation.z = -0.32;
              fork.position.set(BIKE_X + 0.51, WHEEL_Y + 0.32, sz * 0.06);
              g.add(fork);
            });

            // T-shaped handlebar
            const handlebarStem = new THREE.Mesh(
              new THREE.BoxGeometry(0.06, 0.18, 0.06),
              chromeMat.clone()
            );
            handlebarStem.position.set(BIKE_X + 0.65, WHEEL_Y + 0.62, 0);
            g.add(handlebarStem);
            const handlebar = new THREE.Mesh(
              new THREE.BoxGeometry(0.1, 0.04, 0.55),
              chromeMat.clone()
            );
            handlebar.position.set(BIKE_X + 0.65, WHEEL_Y + 0.7, 0);
            g.add(handlebar);
            // Black grips at each end of the handlebar
            [-1, 1].forEach((sz) => {
              const grip = new THREE.Mesh(
                new THREE.CylinderGeometry(0.035, 0.035, 0.08, 10),
                tireMat.clone()
              );
              grip.rotation.x = Math.PI / 2;
              grip.position.set(BIKE_X + 0.65, WHEEL_Y + 0.7, sz * 0.3);
              g.add(grip);
            });

            // Glowing yellow headlight on the front
            const headlight = new THREE.Mesh(
              new THREE.CylinderGeometry(0.1, 0.1, 0.08, 18),
              new THREE.MeshStandardMaterial({
                color: '#fef3c7',
                emissive: '#fde047', emissiveIntensity: 1.4,
              })
            );
            headlight.rotation.z = Math.PI / 2;
            headlight.position.set(BIKE_X + 0.72, WHEEL_Y + 0.36, 0);
            g.add(headlight);

            // Twin exhaust pipes running along the right side
            [-0.07, 0.07].forEach((dz) => {
              const exhaust = new THREE.Mesh(
                new THREE.CylinderGeometry(0.045, 0.045, 0.7, 14),
                chromeMat.clone()
              );
              exhaust.rotation.z = Math.PI / 2;
              exhaust.position.set(BIKE_X - 0.25, WHEEL_Y + 0.1, 0.18 + dz);
              g.add(exhaust);
            });
            // Hellfire trail blasting out the back
            const trailOuter = new THREE.Mesh(
              new THREE.ConeGeometry(0.14, 0.6, 6),
              flameOuter.clone()
            );
            trailOuter.rotation.z = Math.PI / 2;
            trailOuter.position.set(BIKE_X - 0.9, WHEEL_Y + 0.1, 0.18);
            g.add(trailOuter);
            const trailInner = new THREE.Mesh(
              new THREE.ConeGeometry(0.08, 0.36, 5),
              flameInner.clone()
            );
            trailInner.rotation.z = Math.PI / 2;
            trailInner.position.set(BIKE_X - 0.78, WHEEL_Y + 0.1, 0.18);
            g.add(trailInner);
          } else if (kind === 'pikachu') {
            // Full-size chibi Pikachu standing next to the character on
            // the opposite side from the motorcycle: chubby yellow body +
            // rounded head + tall pointed ears with black tips + red
            // cheeks + tiny black eyes with white highlights + open pink
            // smile + short arms/feet + lightning-bolt tail (zigzag).
            const PIKA_X = -1.15;
            const yellowMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.55,
              emissive: new THREE.Color(color.getHex()).multiplyScalar(0.05),
            });
            const blackMat = new THREE.MeshStandardMaterial({
              color: '#0a0a0a', roughness: 0.55,
            });
            const redMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#dc2626'),
              roughness: 0.6,
            });
            const whiteMat = new THREE.MeshStandardMaterial({
              color: '#f8fafc',
              emissive: '#f8fafc', emissiveIntensity: 0.5,
            });
            const pinkMat = new THREE.MeshStandardMaterial({
              color: '#fb7185', roughness: 0.6,
            });
            const brownMat = new THREE.MeshStandardMaterial({
              color: '#78350f', roughness: 0.7,
            });

            // Chubby body
            const body = new THREE.Mesh(
              new THREE.SphereGeometry(0.38, 22, 16),
              yellowMat.clone()
            );
            body.scale.set(1, 1.15, 0.9);
            body.position.set(PIKA_X, -0.05, 0);
            g.add(body);

            // Head — slightly wider than body
            const head = new THREE.Mesh(
              new THREE.SphereGeometry(0.34, 22, 16),
              yellowMat.clone()
            );
            head.scale.set(1.1, 0.95, 0.95);
            head.position.set(PIKA_X, 0.52, 0);
            g.add(head);

            // Two tall pointy ears (yellow) with black tips
            [-1, 1].forEach((sx) => {
              const earShape = new THREE.Mesh(
                new THREE.ConeGeometry(0.11, 0.55, 6),
                yellowMat.clone()
              );
              earShape.rotation.z = sx * 0.35;
              earShape.position.set(PIKA_X + sx * 0.22, 0.95, 0);
              g.add(earShape);
              // Black tip (~upper 35%)
              const earTip = new THREE.Mesh(
                new THREE.ConeGeometry(0.08, 0.22, 6),
                blackMat.clone()
              );
              earTip.rotation.z = sx * 0.35;
              earTip.position.set(PIKA_X + sx * 0.3, 1.16, 0);
              g.add(earTip);
            });

            // Big shiny black eyes with white highlight
            [-1, 1].forEach((sx) => {
              const eye = new THREE.Mesh(
                new THREE.SphereGeometry(0.055, 16, 12),
                blackMat.clone()
              );
              eye.scale.set(1, 1.15, 0.7);
              eye.position.set(PIKA_X + sx * 0.13, 0.56, 0.29);
              g.add(eye);
              const hl = new THREE.Mesh(
                new THREE.SphereGeometry(0.022, 10, 8),
                whiteMat.clone()
              );
              hl.position.set(PIKA_X + sx * 0.13 + 0.02, 0.58, 0.33);
              g.add(hl);
            });

            // Round red cheeks
            [-1, 1].forEach((sx) => {
              const cheek = new THREE.Mesh(
                new THREE.SphereGeometry(0.075, 14, 10),
                redMat.clone()
              );
              cheek.scale.set(1, 1, 0.35);
              cheek.position.set(PIKA_X + sx * 0.27, 0.44, 0.22);
              g.add(cheek);
            });

            // Small open mouth (dark) + pink tongue
            const mouth = new THREE.Mesh(
              new THREE.SphereGeometry(0.05, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
              blackMat.clone()
            );
            mouth.rotation.x = Math.PI / 2;
            mouth.position.set(PIKA_X, 0.42, 0.3);
            mouth.scale.set(1, 0.4, 1);
            g.add(mouth);
            const tongue = new THREE.Mesh(
              new THREE.SphereGeometry(0.032, 12, 10),
              pinkMat.clone()
            );
            tongue.scale.set(1, 0.5, 0.6);
            tongue.position.set(PIKA_X, 0.39, 0.33);
            g.add(tongue);

            // Small arm nubs on each side
            [-1, 1].forEach((sx) => {
              const arm = new THREE.Mesh(
                new THREE.SphereGeometry(0.11, 14, 10),
                yellowMat.clone()
              );
              arm.scale.set(0.8, 1.3, 0.8);
              arm.rotation.z = sx * 0.5;
              arm.position.set(PIKA_X + sx * 0.38, 0.05, 0.08);
              g.add(arm);
            });

            // Feet
            [-1, 1].forEach((sx) => {
              const foot = new THREE.Mesh(
                new THREE.SphereGeometry(0.13, 14, 10),
                yellowMat.clone()
              );
              foot.scale.set(1, 0.7, 1.2);
              foot.position.set(PIKA_X + sx * 0.16, -0.38, 0.08);
              g.add(foot);
            });

            // Lightning bolt tail — zigzag on the back-left, brown base
            const tailBase = new THREE.Mesh(
              new THREE.BoxGeometry(0.1, 0.12, 0.08),
              brownMat.clone()
            );
            tailBase.position.set(PIKA_X - 0.36, -0.02, -0.1);
            g.add(tailBase);

            // First zig (going up-back)
            const zig1 = new THREE.Mesh(
              new THREE.BoxGeometry(0.2, 0.11, 0.09),
              yellowMat.clone()
            );
            zig1.rotation.z = 0.6;
            zig1.position.set(PIKA_X - 0.46, 0.11, -0.05);
            g.add(zig1);

            // Second zig (going down-back)
            const zig2 = new THREE.Mesh(
              new THREE.BoxGeometry(0.24, 0.13, 0.1),
              yellowMat.clone()
            );
            zig2.rotation.z = -0.55;
            zig2.position.set(PIKA_X - 0.6, 0.28, 0);
            g.add(zig2);

            // Big lightning tip at top (fat zigzag)
            const tip1 = new THREE.Mesh(
              new THREE.BoxGeometry(0.34, 0.18, 0.12),
              yellowMat.clone()
            );
            tip1.rotation.z = 0.5;
            tip1.position.set(PIKA_X - 0.75, 0.5, 0);
            g.add(tip1);

            const tip2 = new THREE.Mesh(
              new THREE.ConeGeometry(0.14, 0.24, 4),
              yellowMat.clone()
            );
            tip2.rotation.z = 0.5;
            tip2.position.set(PIKA_X - 0.9, 0.68, 0);
            g.add(tip2);
          } else if (
            kind === 'charmander' ||
            kind === 'squirtle' ||
            kind === 'bulbasaur' ||
            kind === 'eevee' ||
            kind === 'jigglypuff' ||
            kind === 'psyduck' ||
            kind === 'snorlax' ||
            kind === 'gengar' ||
            kind === 'charizard' ||
            kind === 'mew' ||
            kind === 'lugia'
          ) {
            // Full-body Pokemon companion standing (or floating) at
            // X=-1.15 — mirror of the motorcycle side.
            const CX = -1.15;
            const bodyMat = new THREE.MeshStandardMaterial({
              color, roughness: 0.55,
              emissive: new THREE.Color(color.getHex()).multiplyScalar(0.04),
            });
            const accMat = new THREE.MeshStandardMaterial({
              color: accent ?? new THREE.Color('#f8fafc'),
            });
            const darkMat = new THREE.MeshStandardMaterial({ color: '#0a0a0a' });
            const whiteMat = new THREE.MeshStandardMaterial({
              color: '#f8fafc', emissive: '#f8fafc', emissiveIntensity: 0.5,
            });

            if (kind === 'charmander') {
              // Chubby orange body with cream belly
              const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 22, 18), bodyMat.clone());
              body.scale.set(1.0, 1.15, 0.9);
              body.position.set(CX, 0, 0);
              g.add(body);
              const belly = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 14), accMat.clone());
              belly.scale.set(1, 1.15, 0.4);
              belly.position.set(CX, -0.03, 0.24);
              g.add(belly);
              // Rounded head with jutting snout
              const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 22, 18), bodyMat.clone());
              head.scale.set(1.1, 0.98, 1.0);
              head.position.set(CX, 0.44, 0);
              g.add(head);
              const snout = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), bodyMat.clone());
              snout.scale.set(1.1, 0.75, 1.0);
              snout.position.set(CX, 0.35, 0.22);
              g.add(snout);
              const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), accMat.clone());
              jaw.scale.set(1.1, 0.55, 0.8);
              jaw.position.set(CX, 0.29, 0.2);
              g.add(jaw);
              // Teal eyes with black pupil + highlight
              const tealMat = new THREE.MeshStandardMaterial({
                color: '#14b8a6', emissive: '#0d9488', emissiveIntensity: 0.25,
              });
              [-1, 1].forEach((sx) => {
                const white = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 10),
                  new THREE.MeshStandardMaterial({ color: '#f8fafc' }));
                white.scale.set(1, 1.2, 0.6);
                white.position.set(CX + sx * 0.11, 0.5, 0.24);
                g.add(white);
                const iris = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), tealMat.clone());
                iris.scale.set(1, 1.15, 0.5);
                iris.position.set(CX + sx * 0.11, 0.5, 0.27);
                g.add(iris);
                const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), darkMat.clone());
                pupil.position.set(CX + sx * 0.11, 0.5, 0.29);
                g.add(pupil);
                const hl = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 6), whiteMat.clone());
                hl.position.set(CX + sx * 0.11 + 0.012, 0.52, 0.3);
                g.add(hl);
              });
              // Tiny nostrils
              [-1, 1].forEach((sx) => {
                const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.007, 6, 6), darkMat.clone());
                nostril.position.set(CX + sx * 0.02, 0.36, 0.34);
                g.add(nostril);
              });
              // Small arm nubs
              [-1, 1].forEach((sx) => {
                const arm = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), bodyMat.clone());
                arm.scale.set(0.85, 1.3, 0.8);
                arm.rotation.z = sx * 0.5;
                arm.position.set(CX + sx * 0.36, 0.05, 0.06);
                g.add(arm);
              });
              // Feet
              [-1, 1].forEach((sx) => {
                const foot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), bodyMat.clone());
                foot.scale.set(1, 0.7, 1.3);
                foot.position.set(CX + sx * 0.15, -0.36, 0.08);
                g.add(foot);
                // Small toe claws
                [-0.04, 0, 0.04].forEach((tx) => {
                  const claw = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.025, 3),
                    new THREE.MeshStandardMaterial({ color: '#f8fafc' }));
                  claw.rotation.x = -Math.PI / 2;
                  claw.position.set(CX + sx * 0.15 + tx, -0.4, 0.22);
                  g.add(claw);
                });
              });
              // Curved orange tail with flame
              const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.5, 12), bodyMat.clone());
              tail.rotation.z = -0.8;
              tail.position.set(CX - 0.32, 0.05, -0.1);
              g.add(tail);
              const flameOuter = new THREE.MeshStandardMaterial({
                color: '#fb923c', emissive: '#f97316', emissiveIntensity: 1.3,
              });
              const flame = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 8), flameOuter);
              flame.position.set(CX - 0.5, 0.26, -0.1);
              g.add(flame);
              const flameInner = new THREE.MeshStandardMaterial({
                color: '#fde047', emissive: '#facc15', emissiveIntensity: 1.5,
              });
              const flameCore = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.18, 6), flameInner);
              flameCore.position.set(CX - 0.5, 0.22, -0.08);
              g.add(flameCore);
              const flameLight = new THREE.PointLight('#fb923c', 0.7, 1.5);
              flameLight.position.set(CX - 0.5, 0.26, -0.1);
              g.add(flameLight);
            } else if (kind === 'squirtle') {
              // Round sky-blue body
              const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 22, 18), bodyMat.clone());
              body.scale.set(1.1, 1.0, 0.9);
              body.position.set(CX, 0, 0);
              g.add(body);
              // Brown shell top (rim + top dome)
              const shellMat = new THREE.MeshStandardMaterial({
                color: '#a16207', roughness: 0.55,
              });
              const shellRimMat = new THREE.MeshStandardMaterial({
                color: '#f59e0b', roughness: 0.6,
              });
              const shellTop = new THREE.Mesh(
                new THREE.SphereGeometry(0.36, 22, 16, 0, Math.PI * 2, 0, Math.PI / 2),
                shellMat
              );
              shellTop.position.set(CX, 0.02, -0.02);
              g.add(shellTop);
              // Yellow rim of the shell
              const shellRim = new THREE.Mesh(
                new THREE.TorusGeometry(0.36, 0.028, 10, 24),
                shellRimMat
              );
              shellRim.rotation.x = Math.PI / 2;
              shellRim.position.set(CX, 0.0, -0.02);
              g.add(shellRim);
              // Shell hexagonal pattern (small dark spots)
              [[-0.15, 0.12], [0.15, 0.12], [0, 0.22], [-0.15, -0.05], [0.15, -0.05]]
                .forEach(([dx, dy]) => {
                  const spot = new THREE.Mesh(
                    new THREE.SphereGeometry(0.05, 10, 8),
                    new THREE.MeshStandardMaterial({ color: '#78350f' })
                  );
                  spot.scale.set(1, 0.4, 1);
                  spot.position.set(CX + dx, 0.22 + dy * 0.2, -0.14);
                  g.add(spot);
                });
              // Cream belly plastron
              const belly = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 14), accMat.clone());
              belly.scale.set(1, 1.1, 0.4);
              belly.position.set(CX, -0.04, 0.28);
              g.add(belly);
              // Head
              const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 22, 18), bodyMat.clone());
              head.scale.set(1.05, 1.0, 1.02);
              head.position.set(CX, 0.44, 0.05);
              g.add(head);
              // Side fin "ears"
              [-1, 1].forEach((sx) => {
                const fin = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 3), bodyMat.clone());
                fin.rotation.z = sx * Math.PI / 2;
                fin.rotation.y = sx * -0.3;
                fin.scale.set(1, 1, 0.4);
                fin.position.set(CX + sx * 0.3, 0.48, -0.02);
                g.add(fin);
              });
              // Cream brow ridge
              const brow = new THREE.Mesh(
                new THREE.TorusGeometry(0.16, 0.024, 8, 18, Math.PI * 0.85),
                accMat.clone()
              );
              brow.rotation.z = Math.PI;
              brow.rotation.x = 0.2;
              brow.position.set(CX, 0.48, 0.24);
              g.add(brow);
              // Brown eyes
              const brownEye = new THREE.MeshStandardMaterial({
                color: '#78350f', emissive: '#451a03', emissiveIntensity: 0.2,
              });
              [-1, 1].forEach((sx) => {
                const white = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10),
                  new THREE.MeshStandardMaterial({ color: '#f8fafc' }));
                white.scale.set(1, 1.15, 0.5);
                white.position.set(CX + sx * 0.11, 0.42, 0.24);
                g.add(white);
                const iris = new THREE.Mesh(new THREE.SphereGeometry(0.033, 10, 8), brownEye.clone());
                iris.scale.set(1, 1.15, 0.5);
                iris.position.set(CX + sx * 0.11, 0.42, 0.27);
                g.add(iris);
                const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), darkMat.clone());
                pupil.position.set(CX + sx * 0.11, 0.42, 0.29);
                g.add(pupil);
                const hl = new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 6), whiteMat.clone());
                hl.position.set(CX + sx * 0.11 + 0.014, 0.44, 0.3);
                g.add(hl);
              });
              // Small beak
              const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.06, 3), accMat.clone());
              beak.rotation.x = Math.PI / 2;
              beak.position.set(CX, 0.32, 0.32);
              g.add(beak);
              // Curled smile (^_^)
              [-1, 1].forEach((sx) => {
                const smilePart = new THREE.Mesh(
                  new THREE.TorusGeometry(0.03, 0.011, 6, 12, Math.PI * 0.7),
                  darkMat.clone()
                );
                smilePart.rotation.z = sx * -0.6;
                smilePart.position.set(CX + sx * 0.04, 0.26, 0.3);
                g.add(smilePart);
              });
              // Feet
              [-1, 1].forEach((sx) => {
                const foot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), bodyMat.clone());
                foot.scale.set(1, 0.7, 1.3);
                foot.position.set(CX + sx * 0.16, -0.32, 0.06);
                g.add(foot);
              });
              // Small curly tail
              const tail = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 6, 12, Math.PI * 1.5),
                bodyMat.clone());
              tail.rotation.y = Math.PI / 2;
              tail.position.set(CX, 0.02, -0.24);
              g.add(tail);
            } else if (kind === 'bulbasaur') {
              // Turquoise-green quadruped, big head, bulb on back
              const body = new THREE.Mesh(new THREE.SphereGeometry(0.36, 22, 18), bodyMat.clone());
              body.scale.set(1.3, 0.95, 1.05);
              body.position.set(CX, -0.05, 0);
              g.add(body);
              // Head
              const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 22, 18), bodyMat.clone());
              head.scale.set(1.1, 1.0, 1.05);
              head.position.set(CX + 0.36, 0.08, 0.06);
              g.add(head);
              // Small pointed ears on head
              [-1, 1].forEach((sx) => {
                const ear = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.13, 4), bodyMat.clone());
                ear.rotation.z = sx * -0.5;
                ear.rotation.x = -0.2;
                ear.position.set(CX + 0.36 + sx * 0.14, 0.28, 0.02);
                g.add(ear);
              });
              // Bulb on back — turquoise-green ridged
              const bulbMat = new THREE.MeshStandardMaterial({
                color: '#65a30d', roughness: 0.5,
              });
              const darkGreen = new THREE.MeshStandardMaterial({
                color: '#166534', roughness: 0.55,
              });
              const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), bulbMat);
              bulb.position.set(CX - 0.2, 0.28, -0.02);
              g.add(bulb);
              // Ring around bulb
              const bulbRing = new THREE.Mesh(
                new THREE.TorusGeometry(0.29, 0.018, 8, 22),
                darkGreen.clone()
              );
              bulbRing.rotation.x = 0.4;
              bulbRing.position.set(CX - 0.2, 0.28, -0.02);
              g.add(bulbRing);
              // 3 leaflets fanning up from bulb
              [-0.5, 0, 0.5].forEach((angle) => {
                const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), bulbMat.clone());
                leaf.rotation.z = angle;
                leaf.position.set(CX - 0.2 + Math.sin(angle) * 0.1, 0.52, -0.02);
                g.add(leaf);
              });
              // Dark-green splotches on body sides
              [-1, 1].forEach((sx) => {
                const spot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), darkGreen.clone());
                spot.scale.set(1.2, 0.9, 0.3);
                spot.position.set(CX + sx * 0.12, 0.08, 0.36);
                g.add(spot);
                const spot2 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), darkGreen.clone());
                spot2.scale.set(1, 1, 0.3);
                spot2.position.set(CX + sx * 0.24, -0.05, 0.28);
                g.add(spot2);
              });
              // Red eyes with SLIT pupils on head
              [-1, 1].forEach((sx) => {
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 12),
                  new THREE.MeshStandardMaterial({
                    color: '#ef4444', emissive: '#dc2626', emissiveIntensity: 0.4,
                  }));
                eye.scale.set(1, 1.35, 0.7);
                eye.position.set(CX + 0.37 + sx * 0.1, 0.16, 0.24);
                g.add(eye);
                const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.055, 0.008), darkMat.clone());
                pupil.position.set(CX + 0.37 + sx * 0.1, 0.16, 0.29);
                g.add(pupil);
              });
              // Wide grinning mouth with fangs
              const mouth = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
                new THREE.MeshStandardMaterial({ color: '#7f1d1d' })
              );
              mouth.rotation.x = Math.PI / 2;
              mouth.scale.set(1.4, 0.35, 0.7);
              mouth.position.set(CX + 0.42, -0.02, 0.24);
              g.add(mouth);
              [-1, 1].forEach((sx) => {
                const fang = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.025, 3),
                  new THREE.MeshStandardMaterial({ color: '#f8fafc' }));
                fang.position.set(CX + 0.42 + sx * 0.07, -0.04, 0.26);
                g.add(fang);
              });
              // 4 short legs
              [-0.24, 0.24].forEach((dx) => {
                [-0.15, 0.15].forEach((dz) => {
                  const leg = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.08, 0.09, 0.2, 10), bodyMat.clone());
                  leg.position.set(CX + dx, -0.3, dz);
                  g.add(leg);
                  const claws = new THREE.Mesh(
                    new THREE.SphereGeometry(0.09, 10, 8),
                    new THREE.MeshStandardMaterial({ color: '#f8fafc' })
                  );
                  claws.scale.set(1, 0.3, 1);
                  claws.position.set(CX + dx, -0.4, dz + 0.01);
                  g.add(claws);
                });
              });
            } else if (kind === 'eevee') {
              // Light-brown fluffy quadruped
              const darkBrownMat = new THREE.MeshStandardMaterial({
                color: '#78350f', roughness: 0.75,
              });
              const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 22, 18), bodyMat.clone());
              body.scale.set(1.3, 0.95, 0.95);
              body.position.set(CX - 0.05, -0.08, 0);
              g.add(body);
              // Head with slight foxy muzzle
              const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 22, 18), bodyMat.clone());
              head.scale.set(1.08, 0.95, 1.05);
              head.position.set(CX + 0.3, 0.16, 0);
              g.add(head);
              const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), bodyMat.clone());
              muzzle.scale.set(1, 0.7, 0.8);
              muzzle.position.set(CX + 0.42, 0.08, 0.14);
              g.add(muzzle);
              // Tall ears — brown outside, DARK brown inside
              [-1, 1].forEach((sx) => {
                const ear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.38, 5), bodyMat.clone());
                ear.rotation.z = sx * 0.28;
                ear.position.set(CX + 0.32 + sx * 0.02, 0.5, sx * 0.06);
                g.add(ear);
                const inner = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 4), darkBrownMat.clone());
                inner.rotation.z = sx * 0.28;
                inner.position.set(CX + 0.34 + sx * 0.02, 0.52, sx * 0.06 + 0.03);
                g.add(inner);
              });
              // Warm brown eyes with sparkle
              const eyeMat = new THREE.MeshStandardMaterial({
                color: '#78350f', emissive: '#451a03', emissiveIntensity: 0.2,
              });
              [-1, 1].forEach((sx) => {
                const white = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10),
                  new THREE.MeshStandardMaterial({ color: '#fef3c7' }));
                white.scale.set(1, 1.2, 0.5);
                white.position.set(CX + 0.3 + sx * 0.09, 0.2, 0.24);
                g.add(white);
                const iris = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), eyeMat.clone());
                iris.scale.set(1, 1.2, 0.5);
                iris.position.set(CX + 0.3 + sx * 0.09, 0.2, 0.27);
                g.add(iris);
                const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), darkMat.clone());
                pupil.position.set(CX + 0.3 + sx * 0.09, 0.2, 0.29);
                g.add(pupil);
                const hl = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), whiteMat.clone());
                hl.position.set(CX + 0.3 + sx * 0.09 + 0.015, 0.22, 0.3);
                g.add(hl);
              });
              // Small pinky-brown nose
              const nose = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.04, 3),
                new THREE.MeshStandardMaterial({ color: '#78350f' }));
              nose.rotation.x = Math.PI / 2;
              nose.position.set(CX + 0.46, 0.08, 0.22);
              g.add(nose);
              // Fluffy cream ruff around neck
              for (let i = 0; i < 10; i++) {
                const a = (i / 10) * Math.PI * 2;
                const puff = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), accMat.clone());
                puff.position.set(CX + 0.15 + Math.cos(a) * 0.19, -0.03, Math.sin(a) * 0.22);
                g.add(puff);
              }
              // Big brown fluffy tail with cream tip
              const tail = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), bodyMat.clone());
              tail.scale.set(1, 1.5, 1);
              tail.rotation.z = -0.5;
              tail.position.set(CX - 0.36, 0.08, 0);
              g.add(tail);
              const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), accMat.clone());
              tailTip.scale.set(1, 1.2, 1);
              tailTip.position.set(CX - 0.5, 0.28, 0);
              g.add(tailTip);
              // 4 legs
              [-0.24, 0.2].forEach((dx) => {
                [-0.14, 0.14].forEach((dz) => {
                  const leg = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.07, 0.08, 0.22, 8), bodyMat.clone());
                  leg.position.set(CX + dx, -0.28, dz);
                  g.add(leg);
                });
              });
            } else if (kind === 'jigglypuff') {
              // Round pink balloon body — Jigglypuff is a single sphere
              const body = new THREE.Mesh(new THREE.SphereGeometry(0.46, 24, 20), bodyMat.clone());
              body.position.set(CX, 0.05, 0);
              g.add(body);
              // Iconic side-swept curl (comma-shaped)
              const curl = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 12), bodyMat.clone());
              curl.scale.set(1.4, 1.8, 1.0);
              curl.rotation.z = 0.4;
              curl.position.set(CX - 0.2, 0.48, 0.18);
              g.add(curl);
              const curlTip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), bodyMat.clone());
              curlTip.position.set(CX - 0.3, 0.6, 0.2);
              g.add(curlTip);
              // Tiny cat ears
              [-1, 1].forEach((sx) => {
                const ear = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.14, 4), bodyMat.clone());
                ear.rotation.z = sx * 0.15;
                ear.position.set(CX + sx * 0.17, 0.46, 0);
                g.add(ear);
              });
              // HUGE eyes — dark blue outer, light-blue center, sparkles
              const darkBlue = new THREE.MeshStandardMaterial({
                color: accent ?? '#1e3a8a', emissive: '#1e40af', emissiveIntensity: 0.3,
              });
              const lightBlue = new THREE.MeshStandardMaterial({
                color: '#93c5fd', emissive: '#60a5fa', emissiveIntensity: 0.4,
              });
              [-1, 1].forEach((sx) => {
                const outer = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 14), darkBlue.clone());
                outer.scale.set(1, 1.25, 0.55);
                outer.position.set(CX + sx * 0.17, 0.12, 0.36);
                g.add(outer);
                const inner = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 12), lightBlue.clone());
                inner.scale.set(1, 0.7, 0.4);
                inner.position.set(CX + sx * 0.17, 0.04, 0.42);
                g.add(inner);
                const spark1 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), whiteMat.clone());
                spark1.position.set(CX + sx * 0.17 - sx * 0.03, 0.2, 0.44);
                g.add(spark1);
                const spark2 = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), whiteMat.clone());
                spark2.position.set(CX + sx * 0.17 + sx * 0.05, 0.05, 0.44);
                g.add(spark2);
              });
              // Small pink smile
              const smile = new THREE.Mesh(
                new THREE.TorusGeometry(0.04, 0.013, 6, 14, Math.PI),
                new THREE.MeshStandardMaterial({ color: '#9f1239' })
              );
              smile.rotation.z = Math.PI;
              smile.position.set(CX, -0.14, 0.44);
              g.add(smile);
              // Tiny arm nubs
              [-1, 1].forEach((sx) => {
                const arm = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), bodyMat.clone());
                arm.scale.set(0.85, 1.2, 0.85);
                arm.rotation.z = sx * 0.5;
                arm.position.set(CX + sx * 0.42, 0.02, 0.08);
                g.add(arm);
              });
              // Tiny feet nubs
              [-1, 1].forEach((sx) => {
                const foot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), bodyMat.clone());
                foot.scale.set(1.1, 0.7, 1.3);
                foot.position.set(CX + sx * 0.14, -0.34, 0.1);
                g.add(foot);
              });
            } else if (kind === 'psyduck') {
              // Pale-yellow duck-like biped
              const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), bodyMat.clone());
              body.scale.set(1, 1.25, 0.9);
              body.position.set(CX, 0, 0);
              g.add(body);
              // Rounder head
              const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 22, 18), bodyMat.clone());
              head.scale.set(1.15, 0.95, 1.0);
              head.position.set(CX, 0.42, 0);
              g.add(head);
              // Wide flat orange bill
              const bill = new THREE.Mesh(new THREE.SphereGeometry(0.19, 18, 12), accMat.clone());
              bill.scale.set(1.7, 0.35, 0.9);
              bill.position.set(CX, 0.28, 0.22);
              g.add(bill);
              // Nostrils
              [-1, 1].forEach((sx) => {
                const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), darkMat.clone());
                nostril.position.set(CX + sx * 0.05, 0.32, 0.38);
                g.add(nostril);
              });
              // Vacant white eyes with tiny pinprick pupils
              [-1, 1].forEach((sx) => {
                const w = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 12), whiteMat.clone());
                w.scale.set(1, 1.0, 0.5);
                w.position.set(CX + sx * 0.14, 0.48, 0.22);
                g.add(w);
                const p = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), darkMat.clone());
                p.position.set(CX + sx * 0.14 - sx * 0.02, 0.48, 0.3);
                g.add(p);
              });
              // 3 black feather tufts fanning up
              [-0.09, 0, 0.09].forEach((dx, i) => {
                const h = i === 1 ? 0.16 : 0.12;
                const feather = new THREE.Mesh(new THREE.ConeGeometry(0.024, h, 4), darkMat.clone());
                feather.rotation.z = dx * 2.5;
                feather.position.set(CX + dx, 0.72 + h / 2 - 0.05, 0);
                g.add(feather);
              });
              // Hands on head (iconic Psyduck pose)
              [-1, 1].forEach((sx) => {
                const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.28, 8), bodyMat.clone());
                arm.rotation.z = sx * -0.9;
                arm.position.set(CX + sx * 0.24, 0.36, 0.05);
                g.add(arm);
                const hand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), bodyMat.clone());
                hand.position.set(CX + sx * 0.32, 0.54, 0.06);
                g.add(hand);
              });
              // Orange webbed feet
              [-1, 1].forEach((sx) => {
                const foot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), accMat.clone());
                foot.scale.set(1.3, 0.35, 1.6);
                foot.position.set(CX + sx * 0.14, -0.36, 0.08);
                g.add(foot);
              });
              // Small yellow tail
              const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 4), bodyMat.clone());
              tail.rotation.x = -Math.PI / 2;
              tail.position.set(CX, 0.05, -0.24);
              g.add(tail);
            } else if (kind === 'snorlax') {
              // HUGE round cream body — Snorlax is massive
              const body = new THREE.Mesh(new THREE.SphereGeometry(0.54, 24, 20), bodyMat.clone());
              body.scale.set(1.25, 1.1, 1.15);
              body.position.set(CX, 0.05, 0);
              g.add(body);
              // Dark blue-green back/top (Snorlax has dark blue-green skin
              // on his back and head)
              const darkBlue = new THREE.MeshStandardMaterial({
                color: accent ?? '#0f172a', roughness: 0.55,
              });
              const backTop = new THREE.Mesh(
                new THREE.SphereGeometry(0.54, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
                darkBlue
              );
              backTop.rotation.x = 0.15;
              backTop.scale.set(1.25, 1.1, 1.15);
              backTop.position.set(CX, 0.05, -0.06);
              g.add(backTop);
              // Head — dark on top, cream on face
              const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 22, 18), bodyMat.clone());
              head.scale.set(1.15, 0.98, 1.05);
              head.position.set(CX, 0.66, 0.12);
              g.add(head);
              // Dark blue-green top of head
              const headTop = new THREE.Mesh(
                new THREE.SphereGeometry(0.34, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2),
                darkBlue.clone()
              );
              headTop.scale.set(1.15, 0.98, 1.05);
              headTop.position.set(CX, 0.66, 0.08);
              g.add(headTop);
              // Heavy jowl cheeks
              [-1, 1].forEach((sx) => {
                const jowl = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), bodyMat.clone());
                jowl.scale.set(0.9, 0.7, 0.7);
                jowl.position.set(CX + sx * 0.24, 0.5, 0.15);
                g.add(jowl);
              });
              // Closed sleepy eye arcs
              [-1, 1].forEach((sx) => {
                const eye = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.017, 6, 14, Math.PI),
                  darkMat.clone());
                eye.rotation.z = Math.PI;
                eye.position.set(CX + sx * 0.14, 0.71, 0.34);
                g.add(eye);
              });
              // Wide open snoring mouth with fangs and tongue
              const mouth = new THREE.Mesh(
                new THREE.SphereGeometry(0.14, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
                darkMat.clone()
              );
              mouth.rotation.x = Math.PI / 2;
              mouth.scale.set(1.4, 0.45, 0.7);
              mouth.position.set(CX, 0.52, 0.35);
              g.add(mouth);
              const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10),
                new THREE.MeshStandardMaterial({ color: '#fb7185' }));
              tongue.scale.set(1.4, 0.3, 0.5);
              tongue.position.set(CX, 0.48, 0.38);
              g.add(tongue);
              // Two visible bottom fangs
              [-1, 1].forEach((sx) => {
                const fang = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.04, 3),
                  new THREE.MeshStandardMaterial({ color: '#f8fafc' }));
                fang.rotation.x = Math.PI;
                fang.position.set(CX + sx * 0.11, 0.52, 0.4);
                g.add(fang);
              });
              // Small pointed ears on the sides
              [-1, 1].forEach((sx) => {
                const ear = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.16, 4), darkBlue.clone());
                ear.rotation.z = sx * -Math.PI / 2 - sx * 0.3;
                ear.position.set(CX + sx * 0.36, 0.76, 0.04);
                g.add(ear);
              });
              // Big cream feet with claws
              [-1, 1].forEach((sx) => {
                const foot = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), bodyMat.clone());
                foot.scale.set(1, 0.6, 1.4);
                foot.position.set(CX + sx * 0.22, -0.42, 0.1);
                g.add(foot);
                [-0.06, 0, 0.06].forEach((tx) => {
                  const claw = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.04, 3),
                    new THREE.MeshStandardMaterial({ color: '#f8fafc' }));
                  claw.rotation.x = -Math.PI / 2;
                  claw.position.set(CX + sx * 0.22 + tx, -0.46, 0.32);
                  g.add(claw);
                });
              });
              // Small stubby arms
              [-1, 1].forEach((sx) => {
                const arm = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), bodyMat.clone());
                arm.scale.set(0.8, 1.2, 0.9);
                arm.position.set(CX + sx * 0.55, -0.02, 0.08);
                g.add(arm);
              });
            } else if (kind === 'gengar') {
              // Dark-purple round body, spiky silhouette, evil grin
              const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 22, 18), bodyMat.clone());
              body.scale.set(1.15, 1.05, 1);
              body.position.set(CX, 0.05, 0);
              g.add(body);
              const darkPurpleMat = new THREE.MeshStandardMaterial({
                color: '#4c1d95', roughness: 0.55,
              });
              // Jagged crown of spikes on top of head
              const crownSpikes: [number, number, number, number][] = [
                [-0.26, 0.02, -0.35, 1.0],
                [-0.14, 0.16, -0.15, 1.1],
                [0.14, 0.16, 0.15, 1.1],
                [0.26, 0.02, 0.35, 1.0],
                [0, 0.2, 0, 1.2],
              ];
              crownSpikes.forEach(([sx, dy, rz, scl]) => {
                const spike = new THREE.Mesh(
                  new THREE.ConeGeometry(0.07 * scl, 0.22 * scl, 4),
                  bodyMat.clone()
                );
                spike.rotation.z = rz;
                spike.position.set(CX + sx, 0.42 + dy, 0);
                g.add(spike);
              });
              // Back spikes (row along the spine)
              [-0.24, -0.08, 0.08, 0.24].forEach((dx) => {
                const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 4), bodyMat.clone());
                spike.rotation.x = -Math.PI / 2;
                spike.position.set(CX + dx, 0.26, -0.28);
                g.add(spike);
              });
              // Glowing red eyes with WHITE pupils
              const redMat = new THREE.MeshStandardMaterial({
                color: accent ?? '#dc2626', emissive: '#ef4444', emissiveIntensity: 0.9,
              });
              [-1, 1].forEach((sx) => {
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 12), redMat.clone());
                eye.scale.set(1, 1.1, 0.7);
                eye.position.set(CX + sx * 0.15, 0.18, 0.32);
                g.add(eye);
                // White pupil (Gengar's iconic evil look)
                const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), whiteMat.clone());
                pupil.position.set(CX + sx * 0.15, 0.18, 0.38);
                g.add(pupil);
              });
              // Huge evil mouth — dark cavern with rows of white teeth
              const mouthBase = new THREE.Mesh(
                new THREE.SphereGeometry(0.19, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2),
                darkMat.clone()
              );
              mouthBase.rotation.x = Math.PI / 2;
              mouthBase.scale.set(1.3, 0.65, 0.55);
              mouthBase.position.set(CX, -0.02, 0.32);
              g.add(mouthBase);
              const gum = new THREE.Mesh(
                new THREE.TorusGeometry(0.18, 0.023, 8, 20, Math.PI),
                darkPurpleMat.clone()
              );
              gum.rotation.z = Math.PI;
              gum.position.set(CX, 0.0, 0.36);
              g.add(gum);
              // Top row of sharp teeth
              for (let i = -3; i <= 3; i++) {
                const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.06, 4), whiteMat.clone());
                tooth.rotation.x = Math.PI;
                tooth.position.set(CX + i * 0.048, -0.03, 0.4);
                g.add(tooth);
              }
              // Bottom row
              for (let i = -2; i <= 2; i++) {
                const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.045, 4), whiteMat.clone());
                tooth.position.set(CX + i * 0.052, -0.12, 0.39);
                g.add(tooth);
              }
              // Stubby arms with claw fingers
              [-1, 1].forEach((sx) => {
                const arm = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), bodyMat.clone());
                arm.scale.set(0.85, 1.2, 0.85);
                arm.rotation.z = sx * 0.5;
                arm.position.set(CX + sx * 0.42, -0.05, 0.1);
                g.add(arm);
                [-0.04, 0, 0.04].forEach((tx) => {
                  const claw = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.035, 3),
                    new THREE.MeshStandardMaterial({ color: '#f8fafc' }));
                  claw.position.set(CX + sx * 0.48 + tx, -0.16, 0.15);
                  g.add(claw);
                });
              });
              // Short chubby feet
              [-1, 1].forEach((sx) => {
                const foot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), bodyMat.clone());
                foot.scale.set(1, 0.75, 1.3);
                foot.position.set(CX + sx * 0.18, -0.34, 0.1);
                g.add(foot);
                [-0.04, 0, 0.04].forEach((tx) => {
                  const claw = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.03, 3),
                    new THREE.MeshStandardMaterial({ color: '#f8fafc' }));
                  claw.rotation.x = -Math.PI / 2;
                  claw.position.set(CX + sx * 0.18 + tx, -0.38, 0.24);
                  g.add(claw);
                });
              });
              // Purple point-light glow (spooky aura)
              const glow = new THREE.PointLight('#a855f7', 0.4, 1.5);
              glow.position.set(CX, 0.1, 0.5);
              g.add(glow);
            } else if (kind === 'charizard') {
              // Orange bipedal dragon
              const body = new THREE.Mesh(new THREE.SphereGeometry(0.36, 22, 18), bodyMat.clone());
              body.scale.set(1.0, 1.35, 0.9);
              body.position.set(CX, 0.1, 0);
              g.add(body);
              // Cream belly with segments
              const belly = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 14), accMat.clone());
              belly.scale.set(1, 1.4, 0.4);
              belly.position.set(CX, 0.05, 0.25);
              g.add(belly);
              // Rounded (not boxy) head
              const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 22, 18), bodyMat.clone());
              head.scale.set(1.05, 0.95, 1.0);
              head.position.set(CX, 0.66, 0);
              g.add(head);
              // Elongated snout jutting forward
              const snout = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), bodyMat.clone());
              snout.scale.set(1.0, 0.75, 1.4);
              snout.position.set(CX, 0.58, 0.2);
              g.add(snout);
              // Cream jaw underside
              const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), accMat.clone());
              jaw.scale.set(0.9, 0.5, 1.3);
              jaw.position.set(CX, 0.5, 0.18);
              g.add(jaw);
              // Horns pointing BACK from top of skull
              [-1, 1].forEach((sx) => {
                const horn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.34, 5), accMat.clone());
                horn.rotation.x = Math.PI / 2 + 0.2;
                horn.rotation.z = sx * -0.15;
                horn.position.set(CX + sx * 0.11, 0.78, -0.22);
                g.add(horn);
              });
              // Teal-blue eyes with slit pupils
              const tealMat = new THREE.MeshStandardMaterial({
                color: '#38bdf8', emissive: '#0284c7', emissiveIntensity: 0.3,
              });
              [-1, 1].forEach((sx) => {
                const white = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 8),
                  new THREE.MeshStandardMaterial({ color: '#f8fafc' }));
                white.scale.set(1, 1.3, 0.5);
                white.position.set(CX + sx * 0.1, 0.7, 0.2);
                g.add(white);
                const iris = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), tealMat.clone());
                iris.scale.set(1, 1.3, 0.5);
                iris.position.set(CX + sx * 0.1, 0.7, 0.22);
                g.add(iris);
                const pupil = new THREE.Mesh(
                  new THREE.BoxGeometry(0.006, 0.035, 0.006), darkMat.clone());
                pupil.position.set(CX + sx * 0.1, 0.7, 0.24);
                g.add(pupil);
              });
              // Nostrils on snout
              [-1, 1].forEach((sx) => {
                const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), darkMat.clone());
                nostril.position.set(CX + sx * 0.035, 0.62, 0.34);
                g.add(nostril);
              });
              // Visible upper fangs
              [-1, 1].forEach((sx) => {
                const fang = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.04, 3), accMat.clone());
                fang.rotation.x = Math.PI;
                fang.position.set(CX + sx * 0.05, 0.53, 0.32);
                g.add(fang);
              });
              // Big dragon wings (blue-green underside, orange outer)
              const wingOuter = new THREE.MeshStandardMaterial({
                color, side: THREE.DoubleSide, roughness: 0.5,
              });
              const wingInner = new THREE.MeshStandardMaterial({
                color: '#0d9488', side: THREE.DoubleSide, roughness: 0.5,
              });
              [-1, 1].forEach((sx) => {
                // Wing arm bone
                const armBone = new THREE.Mesh(
                  new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), wingOuter.clone());
                armBone.rotation.z = sx * -Math.PI / 2 + sx * 0.3;
                armBone.position.set(CX + sx * 0.32, 0.4, -0.16);
                g.add(armBone);
                // Wing membrane (using scaled sphere-slice for a bat-wing shape)
                const wing = new THREE.Mesh(
                  new THREE.SphereGeometry(0.35, 18, 12, 0, Math.PI),
                  wingInner.clone()
                );
                wing.rotation.z = sx * -Math.PI / 2;
                wing.rotation.y = sx * 0.3;
                wing.scale.set(1.4, 0.9, 0.1);
                wing.position.set(CX + sx * 0.5, 0.42, -0.2);
                g.add(wing);
                // Wing claw tips (3 small spikes at the top edge)
                [0, 1, 2].forEach((i) => {
                  const claw = new THREE.Mesh(
                    new THREE.ConeGeometry(0.03, 0.1, 3), wingOuter.clone());
                  claw.rotation.z = sx * (Math.PI / 2 - 0.3 + i * 0.2);
                  claw.position.set(CX + sx * (0.68 - i * 0.08), 0.72 - i * 0.06, -0.2);
                  g.add(claw);
                });
              });
              // Legs
              [-1, 1].forEach((sx) => {
                const leg = new THREE.Mesh(
                  new THREE.CylinderGeometry(0.08, 0.1, 0.22, 10), bodyMat.clone());
                leg.position.set(CX + sx * 0.16, -0.24, 0.06);
                g.add(leg);
                const foot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), bodyMat.clone());
                foot.scale.set(1, 0.6, 1.4);
                foot.position.set(CX + sx * 0.16, -0.36, 0.14);
                g.add(foot);
                [-0.05, 0, 0.05].forEach((tx) => {
                  const claw = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.035, 3), accMat.clone());
                  claw.rotation.x = -Math.PI / 2;
                  claw.position.set(CX + sx * 0.16 + tx, -0.4, 0.3);
                  g.add(claw);
                });
              });
              // Long thick tail with flame tip
              const tail = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.09, 0.6, 12), bodyMat.clone());
              tail.rotation.z = -0.7;
              tail.rotation.x = 0.2;
              tail.position.set(CX - 0.32, 0.12, -0.12);
              g.add(tail);
              const flameOuter = new THREE.MeshStandardMaterial({
                color: '#fb923c', emissive: '#f97316', emissiveIntensity: 1.3,
              });
              const flame = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.34, 8), flameOuter);
              flame.position.set(CX - 0.55, 0.38, -0.14);
              g.add(flame);
              const flameInner = new THREE.MeshStandardMaterial({
                color: '#fde047', emissive: '#facc15', emissiveIntensity: 1.5,
              });
              const flameCore = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.2, 6), flameInner);
              flameCore.position.set(CX - 0.55, 0.34, -0.12);
              g.add(flameCore);
              const flameLight = new THREE.PointLight('#fb923c', 0.8, 1.6);
              flameLight.position.set(CX - 0.55, 0.38, -0.14);
              g.add(flameLight);
            } else if (kind === 'mew') {
              // Small pink floating psychic kitten with an oval-pointed head
              // and HUGE bright blue eyes (Mew's signature).
              const FLOAT_Y = 0.15;
              const darkPinkMat = new THREE.MeshStandardMaterial({
                color: '#f472b6', roughness: 0.55,
              });
              const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), bodyMat.clone());
              body.scale.set(1.05, 1.15, 1);
              body.position.set(CX, FLOAT_Y, 0);
              g.add(body);
              // Head — elongated oval-pointed
              const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 22, 18), bodyMat.clone());
              head.scale.set(1.0, 1.08, 1.0);
              head.position.set(CX, FLOAT_Y + 0.34, 0);
              g.add(head);
              // Small triangular ears with inner darker pink
              [-1, 1].forEach((sx) => {
                const ear = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.12, 4), bodyMat.clone());
                ear.rotation.z = sx * 0.35;
                ear.position.set(CX + sx * 0.13, FLOAT_Y + 0.5, -0.03);
                g.add(ear);
                const inner = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.07, 3), darkPinkMat.clone());
                inner.rotation.z = sx * 0.35;
                inner.position.set(CX + sx * 0.14, FLOAT_Y + 0.51, -0.01);
                g.add(inner);
              });
              // HUGE shiny blue eyes with sparkles
              const blueMat = new THREE.MeshStandardMaterial({
                color: accent ?? '#3b82f6', emissive: '#2563eb', emissiveIntensity: 0.4,
              });
              const lightBlueMat = new THREE.MeshStandardMaterial({
                color: '#93c5fd', emissive: '#7dd3fc', emissiveIntensity: 0.5,
              });
              [-1, 1].forEach((sx) => {
                const outer = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 12), blueMat.clone());
                outer.scale.set(1, 1.2, 0.55);
                outer.position.set(CX + sx * 0.11, FLOAT_Y + 0.34, 0.18);
                g.add(outer);
                const inner = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), lightBlueMat.clone());
                inner.scale.set(1, 0.65, 0.4);
                inner.position.set(CX + sx * 0.11, FLOAT_Y + 0.28, 0.22);
                g.add(inner);
                const spark = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), whiteMat.clone());
                spark.position.set(CX + sx * 0.11 - sx * 0.02, FLOAT_Y + 0.38, 0.24);
                g.add(spark);
                const spark2 = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), whiteMat.clone());
                spark2.position.set(CX + sx * 0.11 + sx * 0.025, FLOAT_Y + 0.3, 0.25);
                g.add(spark2);
              });
              // Tiny mouth (2-arc "3" shape)
              [-1, 1].forEach((sx) => {
                const half = new THREE.Mesh(
                  new THREE.TorusGeometry(0.014, 0.006, 6, 12, Math.PI * 0.7),
                  new THREE.MeshStandardMaterial({ color: '#9f1239' })
                );
                half.rotation.z = sx * -Math.PI / 2 + Math.PI / 2;
                half.position.set(CX + sx * 0.014, FLOAT_Y + 0.22, 0.24);
                g.add(half);
              });
              // Pink cheek dots
              [-1, 1].forEach((sx) => {
                const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), darkPinkMat.clone());
                cheek.scale.set(1, 1, 0.3);
                cheek.position.set(CX + sx * 0.18, FLOAT_Y + 0.24, 0.19);
                g.add(cheek);
              });
              // Small arm nubs
              [-1, 1].forEach((sx) => {
                const arm = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), bodyMat.clone());
                arm.scale.set(0.8, 1.2, 0.8);
                arm.rotation.z = sx * 0.5;
                arm.position.set(CX + sx * 0.24, FLOAT_Y + 0.1, 0.08);
                g.add(arm);
              });
              // Tiny curled hind feet (Mew has small back legs)
              [-1, 1].forEach((sx) => {
                const leg = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), bodyMat.clone());
                leg.scale.set(1, 1.2, 1);
                leg.position.set(CX + sx * 0.12, FLOAT_Y - 0.16, 0.08);
                g.add(leg);
                const foot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), bodyMat.clone());
                foot.scale.set(1, 0.5, 1.2);
                foot.position.set(CX + sx * 0.12, FLOAT_Y - 0.23, 0.14);
                g.add(foot);
              });
              // Long thin curling tail with rounded ovoid tip
              [0, 1, 2, 3].forEach((i) => {
                const seg = new THREE.Mesh(
                  new THREE.CylinderGeometry(0.022, 0.02, 0.22, 8), bodyMat.clone());
                seg.rotation.z = i % 2 === 0 ? 0.7 : -0.5;
                seg.position.set(CX - 0.24 - i * 0.12, FLOAT_Y + 0.02 + i * 0.16, -0.08);
                g.add(seg);
              });
              const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 12), bodyMat.clone());
              tailTip.scale.set(0.9, 1.3, 0.9);
              tailTip.position.set(CX - 0.64, FLOAT_Y + 0.72, -0.08);
              g.add(tailTip);
              // Sparkles around Mew (psychic aura)
              const sparkMat = new THREE.MeshStandardMaterial({
                color: '#fbcfe8', emissive: '#fbcfe8', emissiveIntensity: 1.0,
              });
              for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                const r = 0.42 + (i % 2) * 0.05;
                const sp = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), sparkMat.clone());
                sp.position.set(CX + Math.cos(a) * r, FLOAT_Y + 0.1 + Math.sin(a) * r, 0);
                g.add(sp);
              }
              // Soft pink light glow around Mew
              const auraLight = new THREE.PointLight('#f9a8d4', 0.5, 1.6);
              auraLight.position.set(CX, FLOAT_Y + 0.2, 0.2);
              g.add(auraLight);
            } else if (kind === 'lugia') {
              // Lugia — large white legendary bird-dragon standing beside the
              // character. Long white neck, elongated pointed head with navy
              // eye-mask, huge folded wings with finger-tips, pale-blue belly,
              // navy back-plate spikes, and a long tail with a navy fin.
              const whiteMat = new THREE.MeshStandardMaterial({
                color, roughness: 0.5,
                emissive: new THREE.Color(color.getHex()).multiplyScalar(0.04),
              });
              const bellyMat = new THREE.MeshStandardMaterial({
                color: '#bfdbfe', roughness: 0.55,
              });
              const navyMat = new THREE.MeshStandardMaterial({
                color: accent ?? new THREE.Color('#1e3a8a'),
                roughness: 0.5,
              });
              // Big oval body
              const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 20), whiteMat.clone());
              body.scale.set(1.0, 1.2, 1.0);
              body.position.set(CX, 0.05, 0);
              g.add(body);
              // Pale-blue belly patch
              const belly = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), bellyMat.clone());
              belly.scale.set(1.05, 1.15, 0.5);
              belly.position.set(CX, 0.0, 0.24);
              g.add(belly);
              // Long neck curving up
              [0, 1, 2].forEach((i) => {
                const seg = new THREE.Mesh(
                  new THREE.CylinderGeometry(0.13 - i * 0.015, 0.16 - i * 0.015, 0.24, 14),
                  whiteMat.clone()
                );
                seg.rotation.x = -0.2 + i * 0.05;
                seg.position.set(CX, 0.5 + i * 0.22, -i * 0.04);
                g.add(seg);
              });
              // Elongated head
              const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 22, 18), whiteMat.clone());
              head.scale.set(0.95, 1.0, 1.3);
              head.position.set(CX, 1.14, -0.02);
              g.add(head);
              // Forward-pointing beak/snout
              const snout = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), whiteMat.clone());
              snout.scale.set(0.9, 0.7, 1.5);
              snout.position.set(CX, 1.08, 0.18);
              g.add(snout);
              // Open mouth interior
              const mouth = new THREE.Mesh(
                new THREE.SphereGeometry(0.06, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2),
                new THREE.MeshStandardMaterial({ color: '#7f1d1d' })
              );
              mouth.rotation.x = Math.PI / 2;
              mouth.scale.set(1.4, 0.35, 0.8);
              mouth.position.set(CX, 1.04, 0.28);
              g.add(mouth);
              // Pointed navy back-crest
              const crest = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 4), navyMat.clone());
              crest.rotation.x = Math.PI / 2 + 0.3;
              crest.position.set(CX, 1.28, -0.22);
              g.add(crest);
              // Navy eye mask + white glowing eyes
              [-1, 1].forEach((sx) => {
                const maskC = new THREE.Mesh(
                  new THREE.BoxGeometry(0.11, 0.05, 0.03), navyMat.clone());
                maskC.rotation.z = sx * -0.15;
                maskC.position.set(CX + sx * 0.11, 1.2, 0.14);
                g.add(maskC);
                const outer = new THREE.Mesh(
                  new THREE.ConeGeometry(0.035, 0.12, 3), navyMat.clone());
                outer.rotation.z = sx * -Math.PI / 2 - sx * 0.3;
                outer.position.set(CX + sx * 0.2, 1.22, 0.12);
                g.add(outer);
                const upper = new THREE.Mesh(
                  new THREE.ConeGeometry(0.028, 0.09, 3), navyMat.clone());
                upper.position.set(CX + sx * 0.1, 1.28, 0.12);
                g.add(upper);
                const eye = new THREE.Mesh(
                  new THREE.SphereGeometry(0.018, 10, 8),
                  new THREE.MeshStandardMaterial({
                    color: '#f8fafc', emissive: '#f8fafc', emissiveIntensity: 0.9,
                  })
                );
                eye.scale.set(1.4, 0.7, 0.6);
                eye.position.set(CX + sx * 0.11, 1.2, 0.16);
                g.add(eye);
              });
              // Huge folded wings (open pose to look impressive)
              [-1, 1].forEach((sx) => {
                const wing = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.36, 0.04), whiteMat.clone());
                wing.rotation.z = sx * -0.25;
                wing.position.set(CX + sx * 0.5, 0.35, -0.1);
                g.add(wing);
                // Finger tips at wing end
                [-0.12, 0, 0.12].forEach((dy) => {
                  const finger = new THREE.Mesh(
                    new THREE.BoxGeometry(0.28, 0.09, 0.045), whiteMat.clone());
                  finger.rotation.z = sx * -0.25;
                  finger.position.set(CX + sx * 0.9, 0.35 + dy, -0.1);
                  g.add(finger);
                });
              });
              // Row of navy back plates
              [0.28, 0.14, 0.0, -0.14].forEach((dy) => {
                const plate = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 4), navyMat.clone());
                plate.rotation.x = -Math.PI / 2 - 0.35;
                plate.position.set(CX, dy, -0.34);
                g.add(plate);
              });
              // Feet with big navy claws
              [-1, 1].forEach((sx) => {
                const foot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), whiteMat.clone());
                foot.scale.set(1.0, 0.55, 1.6);
                foot.position.set(CX + sx * 0.16, -0.32, 0.12);
                g.add(foot);
                [-0.06, 0, 0.06].forEach((dx) => {
                  const claw = new THREE.Mesh(
                    new THREE.ConeGeometry(0.03, 0.12, 4), navyMat.clone());
                  claw.rotation.x = -Math.PI / 2;
                  claw.position.set(CX + sx * 0.16 + dx, -0.36, 0.32);
                  g.add(claw);
                });
              });
              // Long tail with navy fin tip
              const tailBase = new THREE.Mesh(
                new THREE.CylinderGeometry(0.06, 0.1, 0.5, 12), whiteMat.clone());
              tailBase.rotation.z = -0.6;
              tailBase.position.set(CX - 0.3, -0.05, -0.24);
              g.add(tailBase);
              const tailFin = new THREE.Mesh(
                new THREE.ConeGeometry(0.14, 0.3, 4), navyMat.clone());
              tailFin.rotation.z = 1.4;
              tailFin.position.set(CX - 0.58, 0.14, -0.24);
              g.add(tailFin);
              // Soft blue psychic glow (Lugia is a legendary psychic-flying)
              const auraLight = new THREE.PointLight('#93c5fd', 0.6, 2.0);
              auraLight.position.set(CX, 0.5, 0.3);
              g.add(auraLight);
            }
          }
          break;
        }
      }
    };

    (Object.keys(equipped) as Slot[]).forEach((slot) => {
      const id = equipped[slot];
      if (!id) return;
      // Charms hang from the bag — skip if no bag is equipped.
      if (slot === 'charm' && !equipped.back) return;
      equipItem(slot, id);
      redistribute(slot);
    });

    // Hide the base face features (eyes, glasses, cheeks, mouth, tongue)
    // and the hair only when a full-head *cover* mask is equipped (Iron Man,
    // Spider-Man, Hulk, etc.) — otherwise the kid's face would poke through
    // the head cover. Pokemon masks are treated as accessories: the kid's
    // eyes/nose/mouth stay visible so the character still feels like *them*.
    const maskKind = equipped.mask ? getItem(equipped.mask)?.kind : undefined;
    const isPokemonMask = typeof maskKind === 'string' && maskKind.endsWith('_face');
    const maskOn = !!equipped.mask;
    const maskHidesFace = maskOn && !isPokemonMask;
    maskOnRef.current = maskHidesFace;
    const backKind = equipped.back ? getItem(equipped.back)?.kind : undefined;
    const backHidesHair =
      backKind === 'ariel_wave' || backKind === 'rapunzel_hair';
    backHidesHairRef.current = backHidesHair;
    faceFeaturesRef.current.forEach((m) => {
      m.visible = !maskHidesFace;
    });
    if (hairGroupRef.current)
      hairGroupRef.current.visible = !maskHidesFace && !backHidesHair;

    // Undershirt (런닝) when nothing in 'top' slot
    if (!equipped.top) {
      const g = groups.top;
      const undershirtMat = new THREE.MeshStandardMaterial({ color: '#ffffff' });
      const tank = new THREE.Mesh(
        new THREE.BoxGeometry(TORSO_W + 0.02, TORSO_H + 0.02, TORSO_D + 0.02),
        undershirtMat
      );
      tank.position.set(0, TORSO_Y, 0);
      g.add(tank);
      // Carve sleeveless armhole look with skin-colored shoulder caps
      const skinMat = new THREE.MeshStandardMaterial({ color: SKIN });
      [-1, 1].forEach((sx) => {
        const shoulder = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.18, TORSO_D + 0.04),
          skinMat.clone()
        );
        shoulder.position.set(sx * (TORSO_W / 2 - 0.02), TORSO_Y + TORSO_H / 2 - 0.09, 0);
        g.add(shoulder);
      });
    }

    // Underwear (팬티) when nothing in 'bottom' slot
    if (!equipped.bottom) {
      const g = groups.bottom;
      const briefMat = new THREE.MeshStandardMaterial({ color: '#ffffff' });
      // Waistband across both legs/hip
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(TORSO_W + 0.04, 0.16, TORSO_D + 0.06),
        briefMat
      );
      band.position.set(0, TORSO_Y - TORSO_H / 2 + 0.02, 0);
      g.add(band);
      // Brief covering top of each leg
      [-1, 1].forEach((sx) => {
        const brief = new THREE.Mesh(
          new THREE.BoxGeometry(LEG_W + 0.05, 0.22, LEG_W + 0.05),
          briefMat.clone()
        );
        brief.position.set(sx * LEG_X, LEG_Y + LEG_H / 2 - 0.08, 0);
        g.add(brief);
      });
    }
  }, [equipped]);

  useEffect(() => {
    const hairGroup = hairGroupRef.current;
    if (!hairGroup) return;
    while (hairGroup.children.length) {
      const c = hairGroup.children.pop()!;
      (c as any).geometry?.dispose?.();
      (c as any).material?.dispose?.();
    }

    const hairColor = gender === 'girl' ? HAIR_GIRL : HAIR;
    const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.95 });

    const hairTop = new THREE.Mesh(
      new THREE.BoxGeometry(HEAD_SIZE + 0.06, 0.28, HEAD_SIZE + 0.06),
      hairMat
    );
    hairTop.position.set(0, HEAD_Y + HEAD_SIZE / 2 - 0.04, 0);
    hairGroup.add(hairTop);

    const bangs = new THREE.Mesh(
      new THREE.BoxGeometry(HEAD_SIZE + 0.07, 0.18, 0.12),
      hairMat.clone()
    );
    bangs.position.set(0, HEAD_Y + HEAD_SIZE / 2 - 0.18, FACE_Z + 0.04);
    hairGroup.add(bangs);

    if (gender === 'girl') {
      // Long hair down the back of the head + twin pigtails on the sides,
      // tied with a pink bow on top to read clearly as a girl character.
      const backHair = new THREE.Mesh(
        new THREE.BoxGeometry(HEAD_SIZE + 0.08, HEAD_SIZE * 0.95, 0.16),
        hairMat.clone()
      );
      backHair.position.set(0, HEAD_Y - 0.12, -HEAD_SIZE / 2 - 0.04);
      hairGroup.add(backHair);

      [-1, 1].forEach((sx) => {
        const sideStrand = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, HEAD_SIZE * 1.05, HEAD_SIZE * 0.85),
          hairMat.clone()
        );
        sideStrand.position.set(sx * (HEAD_SIZE / 2 + 0.05), HEAD_Y - 0.18, 0);
        hairGroup.add(sideStrand);

        const pigtail = new THREE.Mesh(
          new THREE.SphereGeometry(0.13, 16, 16),
          hairMat.clone()
        );
        pigtail.position.set(sx * (HEAD_SIZE / 2 + 0.22), HEAD_Y - 0.42, 0);
        pigtail.scale.set(1, 1.6, 1);
        hairGroup.add(pigtail);

        const tie = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.06, 0.16),
          new THREE.MeshStandardMaterial({ color: BOW })
        );
        tie.position.set(sx * (HEAD_SIZE / 2 + 0.18), HEAD_Y - 0.22, 0);
        hairGroup.add(tie);
      });

      const bowMat = new THREE.MeshStandardMaterial({ color: BOW });
      const bowCenter = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.08),
        bowMat
      );
      bowCenter.position.set(0, HEAD_Y + HEAD_SIZE / 2 + 0.14, 0.04);
      hairGroup.add(bowCenter);
      [-1, 1].forEach((sx) => {
        const petal = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.12, 0.06),
          bowMat.clone()
        );
        petal.position.set(sx * 0.12, HEAD_Y + HEAD_SIZE / 2 + 0.14, 0.04);
        hairGroup.add(petal);
      });
    } else {
      // Boy: short side tufts on each side of the head (original look).
      [-1, 1].forEach((sx) => {
        const tuft = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.32, HEAD_SIZE * 0.85),
          hairMat.clone()
        );
        tuft.position.set(sx * (HEAD_SIZE / 2 + 0.02), HEAD_Y + 0.05, 0);
        hairGroup.add(tuft);
      });
    }

    // A full-head mask (Iron Man / Spider-Man / Hulk) hides the hair.
    hairGroup.visible = !maskOnRef.current && !backHidesHairRef.current;
  }, [gender]);

  useEffect(() => {
    if (jumping) jumpRef.current = true;
  }, [jumping]);

  if (failed) {
    // iOS Chrome (UA contains "CriOS") routes WebGL through a WKWebView
    // configuration that exposes WebGL2 unreliably on many iPads, even when
    // Safari on the same device works fine. There's no client-side fix —
    // tell the user to open the page in Safari instead.
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isIOSChrome = /CriOS\//.test(ua);
    return (
      <div
        className={className}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: 16,
          color: '#92400e',
          textAlign: 'center',
          padding: 16,
          gap: 8,
        }}
      >
        <div style={{ fontSize: 56 }}>🧒</div>
        {name && name.trim() !== '' && (
          <div style={{ fontWeight: 800, fontSize: 16 }}>{name}</div>
        )}
        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85 }}>
          Can't show the 3D character right now
        </div>
        <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.75, lineHeight: 1.4, maxWidth: 280 }}>
          {isIOSChrome
            ? "Chrome on iPad can't display 3D properly. Open the same address in Safari and it should work."
            : 'This can happen if your iPad is in Low Power Mode or low on battery. Try charging and reopening.'}
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 500,
            opacity: 0.6,
            background: 'rgba(120,53,15,0.08)',
            border: '1px solid rgba(120,53,15,0.2)',
            borderRadius: 6,
            padding: '6px 8px',
            maxWidth: '100%',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            fontFamily: 'ui-monospace, Menlo, monospace',
          }}
        >
          {failed}
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      {name && name.trim() !== '' && (
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/70 text-white text-xs font-bold shadow"
          style={{ whiteSpace: 'nowrap', top: 2 }}
        >
          {name}
        </div>
      )}
    </div>
  );
}
