"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import type { Group, Object3D } from "three";
import { ASSETS } from "@/lib/assets";
import { EXPLODED_CAMERA, EXPLODED_PARTS, partProgress } from "@/lib/scene/exploded";
import { progress } from "@/lib/scene/progress";
import { CameraRig } from "./CameraRig";
import { EnvironmentLighting } from "./EnvironmentLighting";
import { ModelSlot } from "./ModelSlot";
import { ExplodedPartProxy } from "./placeholders/ExplodedPartProxy";
import { SceneCanvas } from "./SceneCanvas";

/**
 * WatchExplodedView — 04.
 * Parts travel along the watch's own axis (local Z), one after another, in a
 * slow technical sequence. With a real GLB, nodes named in EXPLODED_PARTS are
 * driven by exactly the same offsets as the placeholders below.
 */
export default function WatchExplodedView({ className, labels = true }: { className?: string; labels?: boolean }) {
  return (
    <SceneCanvas className={className} camera={{ position: EXPLODED_CAMERA.position[0].value, fov: 30 }}>
      <EnvironmentLighting intensity={0.95} />
      <CameraRig channel={progress.exploded} {...EXPLODED_CAMERA} drift={0.05} damping={2.6} />
      <Assembly labels={labels} />
    </SceneCanvas>
  );
}

function Assembly({ labels }: { labels: boolean }) {
  const root = useRef<Group>(null);
  const parts = useRef<(Group | null)[]>([]);
  const gltfNodes = useRef<Map<string, { node: Object3D; baseZ: number }>>(new Map());
  const [labelOpacity] = useState(() => EXPLODED_PARTS.map(() => ({ v: 0 })));
  const labelEls = useRef<(HTMLDivElement | null)[]>([]);
  const labelGroups = useRef<(Group | null)[]>([]);

  const onModelLoad = (scene: Object3D) => {
    gltfNodes.current.clear();
    EXPLODED_PARTS.forEach((part) => {
      const node = scene.getObjectByName(part.node);
      if (node) gltfNodes.current.set(part.id, { node, baseZ: node.position.z });
    });
  };

  useFrame(({ clock }) => {
    const p = progress.exploded.current;
    if (root.current) {
      // Presentation pose: tilted towards camera, slow quarter turn over the section.
      root.current.rotation.set(-1.3 + p * 0.12, -0.2 + p * 0.4, 0.06);
      root.current.position.y = 0.3 + Math.sin(clock.elapsedTime * 0.5) * 0.015;
    }
    EXPLODED_PARTS.forEach((part, i) => {
      const local = partProgress(part.order, p);
      const z = part.offset * local;
      const g = parts.current[i];
      if (g) g.position.z = z;
      const lg = labelGroups.current[i];
      if (lg) lg.position.z = z;
      const n = gltfNodes.current.get(part.id);
      if (n) n.node.position.z = n.baseZ + z;
      const el = labelEls.current[i];
      if (el) {
        const o = Math.min(1, local * 1.4) * (part.offset === 0 ? Math.min(1, p * 6) : 1);
        if (Math.abs(labelOpacity[i].v - o) > 0.005) {
          labelOpacity[i].v = o;
          el.style.opacity = o.toFixed(3);
          el.style.transform = `translate3d(0, ${(1 - o) * 8}px, 0)`;
        }
      }
    });
  });

  return (
    <group ref={root} scale={0.9}>
      <ModelSlot
        asset={ASSETS.exploded.watch}
        onLoad={onModelLoad}
        fallback={EXPLODED_PARTS.map((part, i) => (
          <group key={part.id} ref={(el) => void (parts.current[i] = el)}>
            <ExplodedPartProxy id={part.id} />
          </group>
        ))}
      />
      {labels &&
        EXPLODED_PARTS.map((part, i) => (
          <group key={`label-${part.id}`} ref={(el) => void (labelGroups.current[i] = el)}>
            <Html position={[part.id === "strap" ? 0.5 : 1.12, part.id === "strap" ? -1.9 : 0, 0]} zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
              <div ref={(el) => void (labelEls.current[i] = el)} className="exploded-label" style={{ opacity: 0 }}>
                <span className="exploded-label__rule" />
                <span className="exploded-label__index">{String(i + 1).padStart(2, "0")}</span>
                <span className="exploded-label__name">{part.label}</span>
              </div>
            </Html>
          </group>
        ))}
    </group>
  );
}
