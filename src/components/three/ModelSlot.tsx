"use client";

import { useGLTF } from "@react-three/drei";
import { Suspense, useMemo, type ReactNode } from "react";
import type { Object3D } from "three";
import type { ModelAsset } from "@/lib/assets";

type Props = {
  asset: ModelAsset;
  /** Rendered while no asset exists (or while it loads). */
  fallback: ReactNode;
  /** Receives the loaded scene graph, e.g. to look up named nodes. */
  onLoad?: (scene: Object3D) => void;
};

/**
 * Drop-in slot for .glb / .gltf assets. With `asset.src === null` the
 * placeholder is rendered; once a path is set in lib/assets.ts the real model
 * replaces it with no other code change.
 */
export function ModelSlot({ asset, fallback, onLoad }: Props) {
  if (!asset.src) return <>{fallback}</>;
  return (
    <Suspense fallback={fallback}>
      <GLTFModel asset={asset as ModelAsset & { src: string }} onLoad={onLoad} />
    </Suspense>
  );
}

function GLTFModel({ asset, onLoad }: { asset: ModelAsset & { src: string }; onLoad?: (s: Object3D) => void }) {
  const gltf = useGLTF(asset.src, asset.draco ? "/draco/" : false);
  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((o) => {
      // Soft, cinematic shadowing for every mesh in the asset.
      (o as Object3D & { castShadow?: boolean }).castShadow = true;
    });
    onLoad?.(clone);
    return clone;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gltf.scene]);

  return (
    <primitive
      object={scene}
      scale={asset.scale ?? 1}
      position={asset.position ?? [0, 0, 0]}
      rotation={asset.rotation ?? [0, 0, 0]}
    />
  );
}
