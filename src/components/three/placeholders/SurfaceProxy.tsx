"use client";

import { ContactShadows } from "@react-three/drei";
import { forwardRef, useMemo } from "react";
import { CanvasTexture, type Group } from "three";

/** Radial alpha so the set surface dissolves into the dark instead of showing an edge. */
function useRadialAlpha() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.35, "#8a8a8a");
    g.addColorStop(1, "#000000");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new CanvasTexture(c);
  }, []);
}

/**
 * PLACEHOLDER — minimal dark set surface for the opening shot.
 * A matte green-black disc that fades out radially, plus soft contact
 * shadows. Replaced by ASSETS.story.surface when a real set piece exists.
 */
export const SurfaceProxy = forwardRef<Group, { y?: number }>(function SurfaceProxy({ y = -1.25 }, ref) {
  const alpha = useRadialAlpha();
  return (
    <group ref={ref} position-y={y}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[6, 64]} />
        <meshStandardMaterial
          color="#0a211c"
          roughness={0.55}
          metalness={0.1}
          envMapIntensity={0.25}
          transparent
          opacity={0.9}
          alphaMap={alpha ?? undefined}
          depthWrite={false}
        />
      </mesh>
      <ContactShadows position-y={0.01} opacity={0.6} scale={6} blur={2.8} far={2.4} color="#000000" />
    </group>
  );
});
