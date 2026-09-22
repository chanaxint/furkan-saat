"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { useInView } from "@/hooks/useInView";
import type { ModelAsset } from "@/lib/assets";
import type { ProgressChannel } from "@/lib/scene/progress";
import { ShowcaseLighting } from "./ShowcaseLighting";
import { SequenceRig, type SequenceDefinition } from "./SequenceRig";

type Props = {
  asset: ModelAsset;
  channel: ProgressChannel;
  sequence: SequenceDefinition;
  className?: string;
  /** Called once the GLB is parsed and on stage. */
  onReady?: () => void;
};

/**
 * ModelSequenceScene — self-contained WebGL stage for a scroll-driven model
 * sequence (the showcase, the detail close-ups, …).
 *
 * Performance budget (the model is ~534k triangles, kept at full detail):
 * - ONE render pass per frame: no post-processing, no contact-shadow pass.
 *   Falloff/vignette is a CSS layer in the section instead.
 * - On-demand rendering: frames are drawn only while the watch is moving
 *   (scroll wakes the canvas, the spring keeps it awake until it settles).
 *   When scrolling stops, the GPU goes idle.
 * - Capped pixel ratio; the canvas is unmounted from the loop offscreen.
 */
export default function ModelSequenceScene({ asset, channel, sequence, className, onReady }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const inView = useInView(wrap, "25% 0px");

  if (!asset.src) return null;

  return (
    <div ref={wrap} className={className} style={{ position: "absolute", inset: 0 }}>
      <Canvas
        frameloop={inView ? "demand" : "never"}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6.6], fov: sequence.fov, near: 0.05, far: 40 }}
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
          <SequenceRig
            asset={asset as ModelAsset & { src: string }}
            channel={channel}
            sequence={sequence}
            onReady={onReady}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
