import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { getItem, type Slot } from '../data/items';

type Props = {
  equipped: Record<Slot, string>;
  jumping?: boolean;
  className?: string;
  name?: string;
};

const SKIN = '#ffe1c6';
const HAIR = '#5b3a1f';
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

export function Character3D({ equipped, jumping = false, className, name }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const charRef = useRef<THREE.Group | null>(null);
  const slotGroupsRef = useRef<Record<Slot, THREE.Group>>({} as any);
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

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(2, 4, 3);
    scene.add(dir);
    const rim = new THREE.DirectionalLight(0xffe9ff, 0.3);
    rim.position.set(-3, 2, -2);
    scene.add(rim);

    const char = new THREE.Group();
    charRef.current = char;
    scene.add(char);

    // ---- Head (big chibi cube with rounded look via slight bevel) ----
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(HEAD_SIZE, HEAD_SIZE, HEAD_SIZE, 1, 1, 1),
      new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.8 })
    );
    head.position.set(0, HEAD_Y, 0);
    char.add(head);

    // Hair: rounded cap + bangs that hang lower over forehead
    const hairMat = new THREE.MeshStandardMaterial({ color: HAIR, roughness: 0.95 });
    const hairTop = new THREE.Mesh(
      new THREE.BoxGeometry(HEAD_SIZE + 0.06, 0.28, HEAD_SIZE + 0.06),
      hairMat
    );
    hairTop.position.set(0, HEAD_Y + HEAD_SIZE / 2 - 0.04, 0);
    char.add(hairTop);
    const bangs = new THREE.Mesh(
      new THREE.BoxGeometry(HEAD_SIZE + 0.07, 0.18, 0.12),
      hairMat
    );
    bangs.position.set(0, HEAD_Y + HEAD_SIZE / 2 - 0.18, FACE_Z + 0.04);
    char.add(bangs);
    // Side hair tufts on each side of the head
    [-1, 1].forEach((sx) => {
      const tuft = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.32, HEAD_SIZE * 0.85),
        hairMat
      );
      tuft.position.set(sx * (HEAD_SIZE / 2 + 0.02), HEAD_Y + 0.05, 0);
      char.add(tuft);
    });

    // ---- Eyes: BIG round eyes (kid-like) ----
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
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.1, 18, 18), pupilMat);
      pupil.scale.set(1, 1.05, 0.6);
      pupil.position.set(sx * eyeOffsetX, eyeOffsetY, FACE_Z + 0.06);
      char.add(pupil);
      // Two highlights for that twinkle look
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), highlightMat);
      hl.position.set(sx * eyeOffsetX - 0.035, eyeOffsetY + 0.045, FACE_Z + 0.13);
      char.add(hl);
      const hl2 = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), highlightMat);
      hl2.position.set(sx * eyeOffsetX + 0.025, eyeOffsetY - 0.04, FACE_Z + 0.13);
      char.add(hl2);
    });

    // ---- Glasses (signature, sized to fit big eyes) ----
    const glassMat = new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.4, roughness: 0.4 });
    [-1, 1].forEach((sx) => {
      const lens = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.022, 12, 28), glassMat);
      lens.position.set(sx * eyeOffsetX, eyeOffsetY, FACE_Z + 0.1);
      char.add(lens);
    });
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.022, 0.022), glassMat);
    bridge.position.set(0, eyeOffsetY, FACE_Z + 0.1);
    char.add(bridge);

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
    });

    // ---- Mouth: bigger smile ----
    const mouth = new THREE.Mesh(
      new THREE.TorusGeometry(0.085, 0.025, 8, 18, Math.PI),
      new THREE.MeshStandardMaterial({ color: MOUTH })
    );
    mouth.rotation.z = Math.PI;
    mouth.position.set(0, HEAD_Y - 0.3, FACE_Z);
    char.add(mouth);
    // Tiny tongue inside smile (peeking)
    const tongue = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: '#fb7185' })
    );
    tongue.rotation.x = Math.PI / 2;
    tongue.position.set(0, HEAD_Y - 0.32, FACE_Z + 0.02);
    tongue.scale.set(1.2, 0.6, 0.4);
    char.add(tongue);

    // ---- Body (skin base, replaced by top item) ----
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(TORSO_W, TORSO_H, TORSO_D),
      new THREE.MeshStandardMaterial({ color: SKIN })
    );
    torso.position.set(0, TORSO_Y, 0);
    char.add(torso);

    // ---- Arms ----
    const armMat = new THREE.MeshStandardMaterial({ color: SKIN });
    [-1, 1].forEach((sx) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(ARM_W, ARM_H, ARM_W), armMat.clone());
      arm.position.set(sx * ARM_X, ARM_Y, 0);
      char.add(arm);
      // Hand cube at the end
      const hand = new THREE.Mesh(
        new THREE.BoxGeometry(ARM_W * 1.1, ARM_W * 1.1, ARM_W * 1.1),
        armMat.clone()
      );
      hand.position.set(sx * ARM_X, ARM_Y - ARM_H / 2 - 0.02, 0);
      char.add(hand);
    });

    // ---- Legs ----
    const legMat = new THREE.MeshStandardMaterial({ color: SKIN });
    [-1, 1].forEach((sx) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(LEG_W, LEG_H, LEG_W), legMat.clone());
      leg.position.set(sx * LEG_X, LEG_Y, 0);
      char.add(leg);
    });

    // ---- Feet (bare; shoes slot will overlay these when equipped) ----
    const footMat = new THREE.MeshStandardMaterial({ color: SKIN });
    [-1, 1].forEach((sx) => {
      const foot = new THREE.Mesh(
        new THREE.BoxGeometry(LEG_W + 0.04, 0.13, 0.34),
        footMat.clone()
      );
      foot.position.set(sx * LEG_X, LEG_Y - LEG_H / 2 - 0.05, 0.07);
      char.add(foot);
    });

    // ---- Slot groups (each item type clears+adds into its group) ----
    const slotGroups: Record<Slot, THREE.Group> = {
      top: new THREE.Group(),
      bottom: new THREE.Group(),
      hat: new THREE.Group(),
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
    };
  }, []);

  // ---- Apply equipped items ----
  useEffect(() => {
    const groups = slotGroupsRef.current;
    if (!groups.top) return;

    const clear = (g: THREE.Group) => {
      while (g.children.length) {
        const c = g.children.pop()!;
        (c as any).geometry?.dispose?.();
        (c as any).material?.dispose?.();
      }
    };
    (Object.keys(groups) as Slot[]).forEach((s) => clear(groups[s]));

    const equipItem = (slot: Slot, id: string) => {
      const item = getItem(id);
      if (!item) return;
      const g = groups[slot];
      const color = new THREE.Color(item.color);
      const accent = item.accent ? new THREE.Color(item.accent) : null;

      switch (slot) {
        case 'top': {
          const kind = item.kind ?? 'tee';
          const isPuffy = kind === 'spacesuit' || kind === 'sweater' || kind === 'raincoat';
          const fullSleeve = kind === 'hoodie' || kind === 'sweater' || kind === 'raincoat' || kind === 'spacesuit';
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
            brim.position.set(0, hatBaseY - 0.06, FACE_Z + 0.18);
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
          }
          break;
        }
        case 'back': {
          const kind =
            item.kind ?? (item.shape === 'wing' ? 'wing_feather' : 'pack');
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
    });

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
          지금은 3D 캐릭터를 표시할 수 없어요
        </div>
        <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.75, lineHeight: 1.4, maxWidth: 280 }}>
          {isIOSChrome
            ? 'iPad의 Chrome 앱은 3D를 제대로 표시하지 못해요. 같은 주소를 Safari로 열면 정상으로 나와요.'
            : 'iPad가 저전력 모드이거나 배터리가 부족하면 발생할 수 있어요. 충전 후 다시 열어 보세요.'}
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
          style={{ whiteSpace: 'nowrap', top: '8%' }}
        >
          {name}
        </div>
      )}
    </div>
  );
}
