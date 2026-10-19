import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap, prefersReducedMotion } from '../motion/gsap';

/**
 * Fond three.js reprenant la composition du logo Genies :
 * huit symboles mathématiques répartis sur un cercle ouvert côté droit.
 * Les positions sont celles du logo (centre du cercle, rayon = 1).
 */
const SYMBOLS: Array<{ file: string; x: number; y: number; w: number; h: number }> = [
  { file: 'gamma', x: 0.21, y: 1.0, w: 0.3, h: 0.3 },
  { file: 'hhat', x: 0.78, y: 0.82, w: 0.2, h: 0.4 },
  { file: 'f', x: 0.79, y: -0.82, w: 0.4, h: 0.32 },
  { file: 'inf', x: 0.2, y: -0.99, w: 0.44, h: 0.26 },
  { file: 'lambda', x: -0.4, y: -0.79, w: 0.38, h: 0.36 },
  { file: 'h', x: -0.78, y: -0.29, w: 0.36, h: 0.34 },
  { file: 'g', x: -0.78, y: 0.31, w: 0.28, h: 0.41 },
  { file: 'n', x: -0.4, y: 0.81, w: 0.39, h: 0.32 }
];

const rgbVar = (name: string): THREE.Color => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim().split(/\s+/).map(Number);
  return new THREE.Color(v[0] / 255, v[1] / 255, v[2] / 255);
};

interface LogoRingProps {
  /** position horizontale du centre du cercle, de 0 (gauche) à 1 (droite) */
  anchor?: number;
  /** position verticale du centre du cercle, de 0 (haut) à 1 (bas) */
  anchorY?: number;
  /** part de la hauteur occupée par le cercle */
  fit?: number;
  className?: string;
}

export const LogoRing: React.FC<LogoRingProps> = ({ anchor = 0.7, anchorY = 0.5, fit = 0.8, className }) => {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // WebGL indisponible : le contenu reste lisible sans fond animé
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const reduced = prefersReducedMotion();
    // Le fond apparaît en fondu dès que three.js est prêt.
    const fade = reduced ? null : gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power2.out' });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.z = 8;

    const group = new THREE.Group();
    scene.add(group);

    const loader = new THREE.TextureLoader();
    const sprites: THREE.Sprite[] = [];
    const textures: THREE.Texture[] = [];
    SYMBOLS.forEach((s, i) => {
      const tex = loader.load(`/symbols/${s.file}.png`, () => renderOnce());
      textures.push(tex);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.75, depthWrite: false });
      const sprite = new THREE.Sprite(mat);
      const z = Math.sin(i * 1.7) * 0.35;
      sprite.position.set(s.x, s.y, z);
      sprite.scale.set(s.w * 0.72, s.h * 0.72, 1);
      sprite.userData.base = new THREE.Vector3(s.x, s.y, z);
      sprite.userData.phase = i * 0.8;
      group.add(sprite);
      sprites.push(sprite);
    });

    // Cercle fin, ouvert côté droit comme dans le logo
    const arcPts: THREE.Vector3[] = [];
    const gap = (50 * Math.PI) / 180;
    for (let a = gap; a <= Math.PI * 2 - gap; a += 0.03) arcPts.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0));
    const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPts);
    const arcMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.22 });
    group.add(new THREE.Line(arcGeo, arcMat));

    // Poussière : points répartis en couronne autour du cercle
    const N = 260;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.7 + Math.random() * 1.1;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.sin(a) * r;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dustMat = new THREE.PointsMaterial({ size: 0.022, transparent: true, opacity: 0.55, depthWrite: false });
    const dust = new THREE.Points(dustGeo, dustMat);
    group.add(dust);

    const applyColors = () => {
      const ink = rgbVar('--ink');
      const smoke = rgbVar('--smoke');
      sprites.forEach((s) => ((s.material as THREE.SpriteMaterial).color = ink));
      arcMat.color = smoke;
      dustMat.color = smoke;
    };
    applyColors();
    const themeObserver = new MutationObserver(() => {
      applyColors();
      renderOnce();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const pointer = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const visH = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
      const visW = visH * camera.aspect;
      const narrow = w < 768;
      const radius = narrow ? Math.min(visW * 0.2, visH * 0.2) : visH * fit * 0.5;
      group.scale.setScalar(radius);
      sprites.forEach((sp) => ((sp.material as THREE.SpriteMaterial).opacity = narrow ? 0.5 : 0.9));
      arcMat.opacity = narrow ? 0.18 : 0.3;
      group.position.x = ((narrow ? 0.8 : anchor) - 0.5) * visW;
      group.position.y = (0.5 - (narrow ? 0.1 : anchorY)) * visH;
      renderOnce();
    };

    function renderOnce() {
      renderer.render(scene, camera);
    }

    let raf = 0;
    let running = false;
    let t0 = performance.now();
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      eased.x += (pointer.x - eased.x) * 0.04;
      eased.y += (pointer.y - eased.y) * 0.04;
      group.rotation.y = Math.sin(t * 0.25) * 0.28 + eased.x * 0.22;
      group.rotation.x = eased.y * 0.12;
      sprites.forEach((s) => {
        const b = s.userData.base as THREE.Vector3;
        s.position.y = b.y + Math.sin(t * 0.6 + s.userData.phase) * 0.025;
      });
      dust.rotation.z = t * 0.015;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (reduced || running) return;
      running = true;
      t0 = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    io.observe(el);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    if (!reduced) window.addEventListener('pointermove', onPointer, { passive: true });
    resize();

    return () => {
      fade?.kill();
      stop();
      io.disconnect();
      ro.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onPointer);
      textures.forEach((t) => t.dispose());
      sprites.forEach((s) => (s.material as THREE.Material).dispose());
      arcGeo.dispose();
      arcMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [anchor, anchorY, fit]);

  return <div ref={host} data-motion="ring" aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className || ''}`} />;
};
