"use client";

import { ContactShadows } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { DepthOfField, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Suspense, useRef } from "react";
import { NoToneMapping, SRGBColorSpace } from "three";
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
  /** Subtle depth of field. Disabled on small screens for performance. */
  depthOfField?: boolean;
};

/**
 * WatchShowcaseScene — self-contained WebGL stage for the showcase sequence.
 * Opaque set in the house green, filmic tone mapping, a vignette for falloff,
 * restrained depth of field focused on the watch head.
 */
export default function WatchShowcaseScene({ className, onReady, depthOfField = true }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const inView = useInView(wrap, "25% 0px");
  const asset = ASSETS.showcase.watch;
  const { distance } = SHOWCASE_ENTRY_POSE.camera;

  if (!asset.src) return null;

  return (
    <div ref={wrap} className={className} style={{ position: "absolute", inset: 0 }}>
      <Canvas
        frameloop={inView ? "always" : "never"}
        dpr={[1, 2]}
        camera={{ position: [0, 0, distance], fov: SHOWCASE_FOV, near: 0.1, far: 40 }}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance", outputColorSpace: SRGBColorSpace, toneMapping: NoToneMapping }}
      >
        {/* Opaque set colour (post-processing needs an opaque buffer); the
            vignette turns it into the same pool-of-light as the page backdrop. */}
        <color attach="background" args={["#0d2822"]} />
        <ShowcaseLighting />
        <Suspense fallback={null}>
          <ShowcaseRig asset={asset as typeof asset & { src: string }} channel={progress.showcase} onReady={onReady} />
        </Suspense>
        {/* A barely-there shadow keeps the floating watch grounded in space. */}
        <ContactShadows position={[0, -1.35, 0]} opacity={0.35} scale={5} blur={3} far={2.2} resolution={512} color="#000000" />

        <EffectComposer multisampling={depthOfField ? 4 : 2} enableNormalPass={false}>
          {depthOfField ? (
            <DepthOfField target={[0, 0, 0]} worldFocusRange={1.6} bokehScale={1.6} resolutionScale={0.75} />
          ) : (
            <></>
          )}
          <Vignette offset={0.18} darkness={0.72} eskil={false} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
