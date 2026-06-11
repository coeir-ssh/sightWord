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
        char.rotation.y = Math.sin(t * 0.6) * 0.25;
      }

      // Idle limb motion: swing each whole limb (with everything attached
      // to it through the redistribute pass) around the shoulder/hip. Arms
      // and legs move in opposite phase so it reads as a relaxed gait.
      const idle = Math.sin(t * 1.6);
      const armSwing = idle * 0.22;
      const legSwing = idle * 0.18;
      armPivots[0].rotation.x = armSwing;
      armPivots[1].rotation.x = -armSwing;
      legPivots[0].rotation.x = -legSwing;
      legPivots[1].rotation.x = legSwing;

      if (jumpRef.current && jumpStart === 0) jumpStart = performance.now();
      if (jumpStart > 0) {
        const dt = (performance.now() - jumpStart) / 1000;
        if (dt > 0.6) {
          jumpStart = 0;
          jumpRef.current = false;
          char.position.y = 0;
        } else {
          char.position.y = Math.sin((dt / 0.6) * Math.PI) * 0.45;
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
            kind === 'thor';
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
            kind === 'slp_girl';
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
            kind === 'panther'
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
            }
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
                -Math.PI * 0.6,
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
                -Math.PI * 0.65, Math.PI * 1.3
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
                -Math.PI * 0.65,
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
    // and the hair when a full-head mask is equipped — otherwise the kid's
    // glasses, smile and hair would poke through the Iron Man / Spider-Man /
    // Hulk head cover.
    const maskOn = !!equipped.mask;
    maskOnRef.current = maskOn;
    const backKind = equipped.back ? getItem(equipped.back)?.kind : undefined;
    const backHidesHair =
      backKind === 'ariel_wave' || backKind === 'rapunzel_hair';
    backHidesHairRef.current = backHidesHair;
    faceFeaturesRef.current.forEach((m) => {
      m.visible = !maskOn;
    });
    if (hairGroupRef.current)
      hairGroupRef.current.visible = !maskOn && !backHidesHair;

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
