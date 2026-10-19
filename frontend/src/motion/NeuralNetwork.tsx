import React, { useMemo, useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from './gsap';
import { ease, FULL_MOTION } from './tokens';

/**
 * Réseau de neurones profond dessiné en SVG et animé avec GSAP.
 * Décoratif uniquement (aria-hidden) : il ne porte aucune donnée.
 * - À l'apparition : les liaisons se tracent, puis les neurones s'allument.
 * - Ensuite : toutes les quelques secondes, une impulsion traverse le réseau couche après couche.
 * - Pause hors écran et onglet masqué ; sans animation si l'utilisateur la réduit (le réseau reste dessiné).
 */
const LAYERS = [3, 5, 6, 5, 3];
const W = 400;
const H = 280;

interface Node {
  x: number;
  y: number;
  layer: number;
}

export const NeuralNetwork: React.FC<{ className?: string }> = ({ className }) => {
  const root = useRef<SVGSVGElement>(null);

  const { nodes, edges, gaps } = useMemo(() => {
    const nodes: Node[] = [];
    LAYERS.forEach((count, layer) => {
      const x = 28 + (layer * (W - 56)) / (LAYERS.length - 1);
      for (let i = 0; i < count; i++) {
        const y = count === 1 ? H / 2 : 28 + (i * (H - 56)) / (count - 1);
        // léger décalage déterministe pour un aspect moins rigide
        const jitter = Math.sin((layer + 1) * (i + 2) * 12.9898) * 6;
        nodes.push({ x: x + jitter * 0.6, y: y + jitter, layer });
      }
    });
    const edges: Array<{ a: number; b: number; gap: number }> = [];
    nodes.forEach((a, ai) =>
      nodes.forEach((b, bi) => {
        if (b.layer === a.layer + 1) edges.push({ a: ai, b: bi, gap: a.layer });
      })
    );
    return { nodes, edges, gaps: LAYERS.length - 1 };
  }, []);

  useGSAP(
    () => {
      const svg = root.current;
      if (!svg) return;
      const mm = gsap.matchMedia();

      mm.add(FULL_MOTION, () => {
        const q = gsap.utils.selector(svg);
        const lines = q('[data-edge]');
        const dots = q('[data-dot]');
        const glows = q('[data-glow]');
        const nodeEls = q('[data-node]');
        let alive = true;
        let visible = false;
        let running = false;
        let pending: gsap.core.Tween | null = null;
        let pass: gsap.core.Timeline | null = null;

        gsap.set(lines, { strokeDashoffset: 1 });
        gsap.set(nodeEls, { scale: 0 });

        const forwardPass = () => {
          running = true;
          const tl = gsap.timeline({
            onComplete: () => {
              running = false;
              schedule(2.6);
            }
          });
          let dotIndex = 0;
          for (let g = 0; g < gaps; g++) {
            const gapEdges = edges.map((e, i) => ({ ...e, i })).filter((e) => e.gap === g);
            const picks = gsap.utils.shuffle([...gapEdges]).slice(0, 2);
            picks.forEach((e) => {
              const dot = dots[dotIndex++];
              const from = nodes[e.a];
              const to = nodes[e.b];
              const t = g * 0.55;
              tl.set(dot, { attr: { cx: from.x, cy: from.y }, opacity: 1 }, t)
                .to(dot, { attr: { cx: to.x, cy: to.y }, duration: 0.55, ease: 'power1.inOut' }, t)
                .to(dot, { opacity: 0, duration: 0.15 }, t + 0.5)
                .fromTo(glows[e.b], { opacity: 0.85, scale: 0.6 }, { opacity: 0, scale: 1.6, duration: 0.7, ease: 'power2.out' }, t + 0.5);
            });
          }
          pass = tl;
        };

        const schedule = (delay: number) => {
          pending?.kill();
          pending = gsap.delayedCall(delay, () => {
            if (!alive) return;
            if (visible && !document.hidden && !running) forwardPass();
            else schedule(1);
          });
        };

        const intro = gsap
          .timeline({ scrollTrigger: { trigger: svg, start: 'top 92%', once: true } })
          .to(lines, { strokeDashoffset: 0, duration: 1.4, ease: ease.inOut, stagger: { each: 0.012, from: 'random' } })
          .to(nodeEls, { scale: 1, duration: 0.5, ease: 'back.out(2.2)', stagger: { each: 0.03, from: 'start' } }, 0.3)
          .add(() => schedule(0.6));

        const io = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
        });
        io.observe(svg);

        return () => {
          alive = false;
          io.disconnect();
          pending?.kill();
          pass?.kill();
          intro.kill();
          ScrollTrigger.getAll().forEach((st) => st.trigger === svg && st.kill());
        };
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <svg
      ref={root}
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      aria-hidden="true"
      focusable="false"
      fill="none"
    >
      <g stroke="currentColor" strokeOpacity="0.28" strokeWidth="1">
        {edges.map((e, i) => (
          <path
            key={i}
            data-edge
            d={`M${nodes[e.a].x} ${nodes[e.a].y} L${nodes[e.b].x} ${nodes[e.b].y}`}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={0}
          />
        ))}
      </g>
      {nodes.map((n, i) => (
        <g key={i}>
          <circle data-glow cx={n.x} cy={n.y} r="9" fill="#FFB703" opacity="0" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
          <circle data-node cx={n.x} cy={n.y} r="4.5" fill="currentColor" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
        </g>
      ))}
      {Array.from({ length: gaps * 2 }).map((_, i) => (
        <circle key={i} data-dot r="3" fill="#FFB703" opacity="0" />
      ))}
    </svg>
  );
};
