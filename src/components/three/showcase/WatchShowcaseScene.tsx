"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { useInView } from "@/hooks/useInView";
import { ASSETS } from "@/lib/assets";
import { progress } from "@/lib/scene/progress";
import { SHOWCASE_ENTRY_POSE, SHOWCASE_FOV } from "@/lib/scene/showcase";
import { ShowcaseLighting } from "./ShowcaseLighting";
import { ShowcaseRig } from "./ShowcaseRig";

type Props = {
  className?: string;
  /** Called once the GLB is parsed and on stage. */
  onReady?: () => void;
};

/**
 * WatchShowcaseScene — self-contained WebGL stage for the showcase sequence.
 *
 * Performance budget (the model is ~534k triangles, kept at full detail):
 * - ONE render pass per frame: no post-processing, no contact-shadow pass.
 *   Falloff/vignette is a CSS layer in the section instead.
 * - On-demand rendering: frames are drawn only while the watch is moving
 *   (scroll wakes the canvas, the spring keeps it awake until it settles).
 *   When scrolling stops, the GPU goes idle.
 * - Capped pixel ratio; the canvas is unmounted from the loop offscreen.
 */
export default function WatchShowcaseScene({ className, onReady }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const inView = useInView(wrap, "25% 0px");
  const asset = ASSETS.showcase.watch;
  const { distance } = SHOWCASE_ENTRY_POSE.camera;

  if (!asset.src) return null;

  return (
    <div ref={wrap} className={className} style={{ position: "absolute", inset: 0 }}>
      <Canvas
        frameloop={inView ? "demand" : "never"}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, distance], fov: SHOWCASE_FOV, near: 0.1, far: 40 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          outputColorSpace: SRGBColorSpace,
          toneMapping: ACESFilmicToneMapping,
        }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.05;
        }}
      >
        <ShowcaseLighting />
        <Suspense fallback={null}>
          <ShowcaseRig asset={asset as typeof asset & { src: string }} channel={progress.showcase} onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  );
}
