import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { getItem, type Slot } from '../data/items';

type Props = {
  equipped: Record<Slot, string>;
  jumping?: boolean;
  className?: string;
};

const SKIN = '#ffe1c6';
const HAIR = '#5b3a1f';
const EYE_WHITE = '#ffffff';
const EYE_DARK = '#1f2937';
const CHEEK = '#fca5a5';
const MOUTH = '#ef4444';

// Cute 6-year-old: head ~35% of total height, short stubby limbs, round body
const HEAD_SIZE = 1.0;
const HEAD_Y = 1.55;

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

export function Character3D({ equipped, jumping = false, className }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const charRef = useRef<THREE.Group | null>(null);
  const slotGroupsRef = useRef<Record<Slot, THREE.Group>>({} as any);
  const jumpRef = useRef(false);

  useEffect(() => {
    const el = mountRef.current!;
    const w = el.clientWidth;
    const h = el.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 100);
    camera.position.set(0, 1.1, 5.6);
    camera.lookAt(0, 0.9, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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
      renderer.render(scene, camera);
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
          const m = new THREE.Mesh(
            new THREE.BoxGeometry(TORSO_W + 0.06, TORSO_H + 0.05, TORSO_D + 0.05),
            new THREE.MeshStandardMaterial({ color })
          );
          m.position.set(0, TORSO_Y, 0);
          g.add(m);
          // sleeves on the upper arms
          const sleeveMat = new THREE.MeshStandardMaterial({ color });
          [-1, 1].forEach((sx) => {
            const sleeve = new THREE.Mesh(
              new THREE.BoxGeometry(ARM_W + 0.04, ARM_H * 0.5, ARM_W + 0.04),
              sleeveMat.clone()
            );
            sleeve.position.set(sx * ARM_X, ARM_Y + ARM_H * 0.25, 0);
            g.add(sleeve);
          });
          if (accent) {
            const stripe = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W + 0.07, 0.08, TORSO_D + 0.06),
              new THREE.MeshStandardMaterial({ color: accent })
            );
            stripe.position.set(0, TORSO_Y - TORSO_H / 2 + 0.05, 0);
            g.add(stripe);
          }
          break;
        }
        case 'bottom': {
          const matB = new THREE.MeshStandardMaterial({ color });
          [-1, 1].forEach((sx) => {
            const leg = new THREE.Mesh(
              new THREE.BoxGeometry(LEG_W + 0.03, LEG_H + 0.02, LEG_W + 0.03),
              matB.clone()
            );
            leg.position.set(sx * LEG_X, LEG_Y, 0);
            g.add(leg);
          });
          break;
        }
        case 'hat': {
          if (item.shape === 'crown') {
            const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.4 });
            const band = new THREE.Mesh(new THREE.BoxGeometry(HEAD_SIZE + 0.1, 0.16, HEAD_SIZE + 0.1), mat);
            band.position.set(0, HEAD_Y + HEAD_SIZE / 2 + 0.18, 0);
            g.add(band);
            for (let i = 0; i < 5; i++) {
              const angle = (i / 5) * Math.PI * 2;
              const spike = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 4), mat);
              spike.position.set(
                Math.cos(angle) * (HEAD_SIZE / 2),
                HEAD_Y + HEAD_SIZE / 2 + 0.4,
                Math.sin(angle) * (HEAD_SIZE / 2)
              );
              g.add(spike);
            }
          } else {
            const mat = new THREE.MeshStandardMaterial({ color });
            const cap = new THREE.Mesh(
              new THREE.BoxGeometry(HEAD_SIZE + 0.12, 0.28, HEAD_SIZE + 0.12),
              mat
            );
            cap.position.set(0, HEAD_Y + HEAD_SIZE / 2 + 0.16, 0);
            g.add(cap);
            const brim = new THREE.Mesh(
              new THREE.BoxGeometry(HEAD_SIZE + 0.12, 0.06, 0.45),
              mat
            );
            brim.position.set(0, HEAD_Y + HEAD_SIZE / 2 + 0.04, 0.55);
            g.add(brim);
          }
          break;
        }
        case 'back': {
          if (item.shape === 'wing') {
            const matW = new THREE.MeshStandardMaterial({
              color,
              transparent: true,
              opacity: 0.95,
            });
            [-1, 1].forEach((sx) => {
              const wing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.05), matW.clone());
              wing.position.set(sx * 0.6, TORSO_Y + 0.15, -0.32);
              wing.rotation.z = sx * 0.4;
              g.add(wing);
            });
          } else {
            const mat = new THREE.MeshStandardMaterial({ color });
            const pack = new THREE.Mesh(
              new THREE.BoxGeometry(TORSO_W * 0.85, TORSO_H * 0.8, 0.28),
              mat
            );
            pack.position.set(0, TORSO_Y, -TORSO_D / 2 - 0.16);
            g.add(pack);
          }
          break;
        }
        case 'shoes': {
          const mat = new THREE.MeshStandardMaterial({ color });
          const soleMat = new THREE.MeshStandardMaterial({ color: accent ?? color });
          [-1, 1].forEach((sx) => {
            const shoe = new THREE.Mesh(new THREE.BoxGeometry(LEG_W + 0.06, 0.16, 0.4), mat.clone());
            shoe.position.set(sx * LEG_X, LEG_Y - LEG_H / 2 - 0.02, 0.06);
            g.add(shoe);
            if (accent) {
              const sole = new THREE.Mesh(new THREE.BoxGeometry(LEG_W + 0.06, 0.05, 0.4), soleMat.clone());
              sole.position.set(sx * LEG_X, LEG_Y - LEG_H / 2 - 0.13, 0.06);
              g.add(sole);
            }
          });
          break;
        }
        case 'charm': {
          const mat = new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.25,
            metalness: 0.3,
            roughness: 0.4,
          });
          const geo =
            item.shape === 'diamond'
              ? new THREE.OctahedronGeometry(0.13)
              : new THREE.IcosahedronGeometry(0.12);
          const charm = new THREE.Mesh(geo, mat);
          charm.position.set(TORSO_W / 2 + 0.08, TORSO_Y - TORSO_H / 2 + 0.05, TORSO_D / 2);
          g.add(charm);
          const string = new THREE.Mesh(
            new THREE.CylinderGeometry(0.008, 0.008, 0.18, 6),
            new THREE.MeshStandardMaterial({ color: '#94a3b8' })
          );
          string.position.set(TORSO_W / 2 + 0.08, TORSO_Y - TORSO_H / 2 + 0.18, TORSO_D / 2);
          g.add(string);
          break;
        }
      }
    };

    (Object.keys(equipped) as Slot[]).forEach((slot) => {
      const id = equipped[slot];
      if (id) equipItem(slot, id);
    });
  }, [equipped]);

  useEffect(() => {
    if (jumping) jumpRef.current = true;
  }, [jumping]);

  return <div ref={mountRef} className={className} style={{ width: '100%', height: '100%' }} />;
}
