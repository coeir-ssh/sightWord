import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { getItem, type Slot } from '../data/items';

type Props = {
  equipped: Record<Slot, string>;
  jumping?: boolean;
  className?: string;
};

const SKIN = '#f5d3b3';
const HAIR = '#3b2a1a';

export function Character3D({ equipped, jumping = false, className }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const charRef = useRef<THREE.Group | null>(null);
  const slotGroupsRef = useRef<Record<Slot, THREE.Group>>({} as any);
  const jumpRef = useRef(false);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const el = mountRef.current!;
    const w = el.clientWidth;
    const h = el.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
    camera.position.set(0, 1.4, 5.2);
    camera.lookAt(0, 1.0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const amb = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(3, 5, 4);
    scene.add(dir);

    // Build character
    const char = new THREE.Group();
    charRef.current = char;
    scene.add(char);

    // Body parts (Minecraft-ish proportions, scaled)
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.8, 0.8),
      new THREE.MeshStandardMaterial({ color: SKIN })
    );
    head.position.set(0, 1.85, 0);
    char.add(head);

    // Hair cap
    const hair = new THREE.Mesh(
      new THREE.BoxGeometry(0.84, 0.25, 0.84),
      new THREE.MeshStandardMaterial({ color: HAIR })
    );
    hair.position.set(0, 2.15, 0);
    char.add(hair);

    // Face: eyes + glasses (always on)
    const eyeMat = new THREE.MeshStandardMaterial({ color: '#1f2937' });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.05), eyeMat);
    eyeL.position.set(-0.18, 1.92, 0.41);
    char.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.18;
    char.add(eyeR);

    // Glasses (round-ish via tori) — fixed feature
    const glassMat = new THREE.MeshStandardMaterial({ color: '#0f172a' });
    const lensL = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 12, 24), glassMat);
    lensL.position.set(-0.18, 1.92, 0.42);
    char.add(lensL);
    const lensR = lensL.clone();
    lensR.position.x = 0.18;
    char.add(lensR);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.025, 0.025), glassMat);
    bridge.position.set(0, 1.92, 0.42);
    char.add(bridge);

    // Mouth
    const mouth = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.04, 0.04),
      new THREE.MeshStandardMaterial({ color: '#7f1d1d' })
    );
    mouth.position.set(0, 1.72, 0.41);
    char.add(mouth);

    // Torso (bare base — top item will overlay or replace look)
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.1, 0.45),
      new THREE.MeshStandardMaterial({ color: SKIN })
    );
    torso.position.set(0, 0.95, 0);
    char.add(torso);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.28, 1.0, 0.28);
    const armMat = new THREE.MeshStandardMaterial({ color: SKIN });
    const armL = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-0.6, 0.95, 0);
    char.add(armL);
    const armR = new THREE.Mesh(armGeo, armMat.clone());
    armR.position.set(0.6, 0.95, 0);
    char.add(armR);

    // Legs (bare; bottom item overlays)
    const legGeo = new THREE.BoxGeometry(0.32, 1.0, 0.32);
    const legMat = new THREE.MeshStandardMaterial({ color: SKIN });
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.22, -0.1, 0);
    char.add(legL);
    const legR = new THREE.Mesh(legGeo, legMat.clone());
    legR.position.set(0.22, -0.1, 0);
    char.add(legR);

    // Slot groups
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

    // Drag-to-rotate
    let userRotation: number | null = null;
    let dragStart: { x: number; y: number; rotY: number; rotX: number; pointerId: number } | null = null;
    let userRotX = 0;

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      renderer.domElement.setPointerCapture(e.pointerId);
      dragStart = {
        x: e.clientX,
        y: e.clientY,
        rotY: userRotation ?? char.rotation.y,
        rotX: userRotX,
        pointerId: e.pointerId,
      };
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragStart || dragStart.pointerId !== e.pointerId) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      userRotation = dragStart.rotY + dx * 0.012;
      userRotX = Math.max(-0.6, Math.min(0.6, dragStart.rotX + dy * 0.008));
      char.rotation.y = userRotation;
      char.rotation.x = userRotX;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (dragStart && dragStart.pointerId === e.pointerId) dragStart = null;
    };
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);

    // Animation
    let raf = 0;
    const start = performance.now();
    let jumpStart = 0;
    const animate = () => {
      const t = (performance.now() - start) / 1000;
      // Auto-sway only until user takes control
      if (userRotation === null) {
        char.rotation.y = Math.sin(t * 0.6) * 0.25;
      }

      if (jumpRef.current && jumpStart === 0) {
        jumpStart = performance.now();
      }
      if (jumpStart > 0) {
        const dt = (performance.now() - jumpStart) / 1000;
        if (dt > 0.6) {
          jumpStart = 0;
          jumpRef.current = false;
          char.position.y = 0;
        } else {
          char.position.y = Math.sin((dt / 0.6) * Math.PI) * 0.5;
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

  // Apply equipped items
  useEffect(() => {
    const groups = slotGroupsRef.current;
    if (!groups.top) return;

    const clearGroup = (g: THREE.Group) => {
      while (g.children.length) {
        const c = g.children.pop()!;
        (c as any).geometry?.dispose?.();
        (c as any).material?.dispose?.();
      }
    };

    (Object.keys(groups) as Slot[]).forEach((slot) => clearGroup(groups[slot]));

    const equipItem = (slot: Slot, id: string) => {
      const item = getItem(id);
      if (!item) return;
      const g = groups[slot];
      const color = new THREE.Color(item.color);
      const accent = item.accent ? new THREE.Color(item.accent) : null;

      switch (slot) {
        case 'top': {
          const m = new THREE.Mesh(
            new THREE.BoxGeometry(0.95, 1.15, 0.5),
            new THREE.MeshStandardMaterial({ color })
          );
          m.position.set(0, 0.95, 0);
          g.add(m);
          // sleeves
          const sleeveGeo = new THREE.BoxGeometry(0.32, 0.55, 0.32);
          const sleeveMat = new THREE.MeshStandardMaterial({ color });
          const sl = new THREE.Mesh(sleeveGeo, sleeveMat);
          sl.position.set(-0.6, 1.2, 0);
          g.add(sl);
          const sr = new THREE.Mesh(sleeveGeo, sleeveMat.clone());
          sr.position.set(0.6, 1.2, 0);
          g.add(sr);
          if (accent) {
            const stripe = new THREE.Mesh(
              new THREE.BoxGeometry(0.96, 0.1, 0.51),
              new THREE.MeshStandardMaterial({ color: accent })
            );
            stripe.position.set(0, 0.6, 0);
            g.add(stripe);
          }
          break;
        }
        case 'bottom': {
          const matB = new THREE.MeshStandardMaterial({ color });
          const lL = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.05, 0.36), matB);
          lL.position.set(-0.22, -0.08, 0);
          g.add(lL);
          const lR = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.05, 0.36), matB.clone());
          lR.position.set(0.22, -0.08, 0);
          g.add(lR);
          break;
        }
        case 'hat': {
          if (item.shape === 'crown') {
            const mat = new THREE.MeshStandardMaterial({ color });
            const band = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.9), mat);
            band.position.set(0, 2.32, 0);
            g.add(band);
            for (let i = 0; i < 5; i++) {
              const angle = (i / 5) * Math.PI * 2;
              const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 4), mat);
              spike.position.set(Math.cos(angle) * 0.32, 2.5, Math.sin(angle) * 0.32);
              g.add(spike);
            }
          } else {
            const mat = new THREE.MeshStandardMaterial({ color });
            const cap = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.9), mat);
            cap.position.set(0, 2.42, 0);
            g.add(cap);
            const brim = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.4), mat);
            brim.position.set(0, 2.3, 0.55);
            g.add(brim);
          }
          break;
        }
        case 'back': {
          if (item.shape === 'wing') {
            const matW = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.9 });
            const wL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.05), matW);
            wL.position.set(-0.7, 1.2, -0.3);
            wL.rotation.z = 0.4;
            g.add(wL);
            const wR = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.05), matW.clone());
            wR.position.set(0.7, 1.2, -0.3);
            wR.rotation.z = -0.4;
            g.add(wR);
          } else {
            const mat = new THREE.MeshStandardMaterial({ color });
            const pack = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.3), mat);
            pack.position.set(0, 1.0, -0.32);
            g.add(pack);
          }
          break;
        }
        case 'shoes': {
          const mat = new THREE.MeshStandardMaterial({ color });
          const sole = new THREE.MeshStandardMaterial({ color: accent ?? color });
          const sL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.5), mat);
          sL.position.set(-0.22, -0.7, 0.05);
          g.add(sL);
          const sR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.5), mat.clone());
          sR.position.set(0.22, -0.7, 0.05);
          g.add(sR);
          if (accent) {
            const tL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.5), sole);
            tL.position.set(-0.22, -0.78, 0.05);
            g.add(tL);
            const tR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.5), sole.clone());
            tR.position.set(0.22, -0.78, 0.05);
            g.add(tR);
          }
          break;
        }
        case 'charm': {
          const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.2 });
          let geo: THREE.BufferGeometry;
          if (item.shape === 'diamond') {
            geo = new THREE.OctahedronGeometry(0.13);
          } else {
            geo = new THREE.IcosahedronGeometry(0.12);
          }
          const charm = new THREE.Mesh(geo, mat);
          charm.position.set(0.45, 0.4, 0.28);
          g.add(charm);
          const string = new THREE.Mesh(
            new THREE.CylinderGeometry(0.01, 0.01, 0.18, 6),
            new THREE.MeshStandardMaterial({ color: '#94a3b8' })
          );
          string.position.set(0.45, 0.55, 0.28);
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
