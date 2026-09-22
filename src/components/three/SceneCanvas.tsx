"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useRef, type ReactNode } from "react";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { useInView } from "@/hooks/useInView";

type Props = {
  children: ReactNode;
  className?: string;
  /** Initial camera. The CameraRig takes over from the first frame. */
  camera?: { position: [number, number, number]; fov: number };
};

/**
 * Shared Canvas shell: capped DPR, filmic tone mapping, transparent
 * background (sections own their colour) and a render loop that stops
 * whenever the canvas is offscreen.
 */
export function SceneCanvas({ children, className, camera = { position: [0, 0, 5], fov: 30 } }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const inView = useInView(wrap, "10% 0px");

  return (
    <div ref={wrap} className={className} style={{ position: "absolute", inset: 0 }}>
      <Canvas
        frameloop={inView ? "always" : "never"}
        dpr={[1, 1.75]}
        camera={{ position: camera.position, fov: camera.fov, near: 0.1, far: 60 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: ACESFilmicToneMapping,
          outputColorSpace: SRGBColorSpace,
        }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.05;
        }}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  );
}
