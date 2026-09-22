"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { type Group, type PerspectiveCamera, Vector3 } from "three";
import type { ModelAsset } from "@/lib/assets";
import type { ProgressChannel } from "@/lib/scene/progress";
import { createPose, sampleShowcasePose, SHOWCASE_FOV } from "@/lib/scene/showcase";
import { createSpring, stepSpring } from "@/lib/scene/spring";

type Props = {
  asset: ModelAsset & { src: string };
  channel: ProgressChannel;
  onReady?: () => void;
};

/**
 * Drives the watch *and* the camera from one springed progress value, so
 * object and lens always agree — no independent easing that could drift.
 *
 *   scroll → channel.target → critically-damped spring → pose sample → scene
 *
 * No clock-based motion: when scroll stops, the spring settles and the frame
 * is perfectly still.
 */
export function ShowcaseRig({ asset, channel, onReady }: Props) {
  const { scene } = useGLTF(asset.src);
  const model = useMemo(() => scene.clone(true), [scene]);
  const turntable = useRef<Group>(null);

  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const aspect = useThree((s) => s.size.width / s.size.height);

  const spring = useMemo(() => createSpring(channel.target), [channel]);
  const pose = useMemo(createPose, []);
  const tmp = useMemo(() => ({ target: new Vector3(), pos: new Vector3() }), []);

  useLayoutEffect(() => {
    // Leave materials exactly as authored — only enable shadow casting.
    model.traverse((o) => {
      o.castShadow = true;
    });
    onReady?.();
  }, [model, onReady]);

  useFrame((_, delta) => {
    // Offscreen → snap, so the pose is already right when the section appears.
    if (!channel.active) {
      spring.value = channel.target;
      spring.velocity = 0;
    }
    const p = stepSpring(spring, channel.target, Math.min(delta, 0.1));
    channel.current = p;
    sampleShowcasePose(p, pose);

    if (turntable.current) turntable.current.rotation.set(pose.rotation[0], pose.rotation[1], pose.rotation[2]);

    // Camera on a sphere around the watch head. Portrait screens step back
    // and re-centre the profile (the bracelet loop is wider than the frame).
    const portrait = aspect < 1 ? 1 - aspect : 0;
    const pull = 1 + portrait * 1.45;
    const { azimuth, elevation, distance, target } = pose.camera;
    const r = distance * pull;
    target[0] *= 1 + portrait * 1.6;
    tmp.target.set(target[0], target[1], target[2]);
    tmp.pos.set(
      target[0] + r * Math.cos(elevation) * Math.sin(azimuth),
      target[1] + r * Math.sin(elevation),
      target[2] + r * Math.cos(elevation) * Math.cos(azimuth),
    );
    camera.position.copy(tmp.pos);
    camera.lookAt(tmp.target);
    if (Math.abs(camera.fov - SHOWCASE_FOV) > 0.01) {
      camera.fov = SHOWCASE_FOV;
      camera.updateProjectionMatrix();
    }
  });

  const pivot = asset.pivot ?? [0, 0, 0];
  return (
    <group ref={turntable}>
      {/* Offset so the pivot (watch head) sits at the turntable origin. */}
      <primitive
        object={model}
        position={[-pivot[0], -pivot[1], -pivot[2]]}
        scale={asset.scale ?? 1}
        rotation={asset.rotation ?? [0, 0, 0]}
      />
    </group>
  );
}

