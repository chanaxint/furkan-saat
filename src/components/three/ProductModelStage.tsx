"use client";

import { Float, PresentationControls } from "@react-three/drei";
import type { ModelAsset } from "@/lib/assets";
import { EnvironmentLighting } from "./EnvironmentLighting";
import { ModelSlot } from "./ModelSlot";
import { SceneCanvas } from "./SceneCanvas";

/**
 * Minimal turntable stage for a single product GLB (used by ProductShowcase).
 * Only mounted when a model asset exists — never renders a fake watch.
 */
export default function ProductModelStage({ asset }: { asset: ModelAsset }) {
  return (
    <SceneCanvas camera={{ position: [0, 0, 5.2], fov: 26 }}>
      <EnvironmentLighting intensity={1.05} />
      <PresentationControls global={false} polar={[-0.2, 0.2]} azimuth={[-0.6, 0.6]} snap>
        <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.2}>
          <ModelSlot asset={asset} fallback={null} />
        </Float>
      </PresentationControls>
    </SceneCanvas>
  );
}
