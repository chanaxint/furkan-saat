"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { type Group, type PerspectiveCamera, Vector3 } from "three";
import type { ModelAsset } from "@/lib/assets";
import type { ProgressChannel } from "@/lib/scene/progress";
import { createPose, type SequenceSampler } from "@/lib/scene/sequence";
import { createSpring, type Spring } from "@/lib/scene/spring";

export type SequenceDefinition = {
  sample: SequenceSampler;
  advance: (spring: Spring, target: number, dt: number) => number;
  fov: number;
  /** Portrait screens: multiply camera distance by 1 + portrait × this. */
  portraitPull?: number;
  /**
   * Landscape screens: shift the subject right by this fraction of the frame
   * width (lens shift, no perspective change) to leave room for copy on the left.
   */
  frameShift?: number;
  /** Portrait screens: lift the subject by this fraction of the frame height. */
  portraitLift?: number;
};

type Props = {
  asset: ModelAsset & { src: string };
  channel: ProgressChannel;
  sequence: SequenceDefinition;
  onReady?: () => void;
};

/**
 * Drives the watch, the camera *and* the DOM kinetic type from one springed
 * progress value, so everything always agrees:
 *
 *   scroll → channel.target → critically-damped spring → pose → scene + DOM
 *
 * No clock-based motion: when scroll stops, the spring settles, the loop stops
 * requesting frames and the image is perfectly still.
 */
export function SequenceRig({ asset, channel, sequence, onReady }: Props) {
  const gltf = useGLTF(asset.src);
  // Clone per canvas: one Object3D cannot live in two scenes. Geometry and
  // materials are shared, so this is cheap.
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const turntable = useRef<Group>(null);

  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const aspect = size.width / size.height;
  const invalidate = useThree((s) => s.invalidate);

  const spring = useMemo(() => createSpring(channel.target), [channel]);
  const pose = useMemo(createPose, []);
  const tmp = useMemo(() => ({ target: new Vector3() }), []);

  useLayoutEffect(() => {
    onReady?.();
    invalidate();
  }, [scene, onReady, invalidate]);

  // Scroll wakes the on-demand canvas.
  useEffect(() => {
    channel.wake = () => invalidate();
    return () => {
      channel.wake = undefined;
    };
  }, [channel, invalidate]);

  useFrame((_, delta) => {
    // Offscreen → snap, so the pose is already right when the section appears.
    // (`window.__showcaseSnap = true` does the same for visual QA / capture.)
    if (!channel.active || (window as Window & { __showcaseSnap?: boolean }).__showcaseSnap) {
      spring.value = channel.target;
      spring.velocity = 0;
    }
    const p = sequence.advance(spring, channel.target, Math.min(delta, 1 / 20));
    channel.current = p;
    sequence.sample(p, pose);
    channel.onFrame?.(p);

    const g = turntable.current;
    if (g) {
      g.position.set(pose.position[0], pose.position[1], pose.position[2]);
      g.rotation.set(pose.rotation[0], pose.rotation[1], pose.rotation[2]);
    }

    // Camera on a sphere around the look-at point. Portrait screens step back
    // and keep wide poses (the bracelet loop) inside the frame.
    const portrait = aspect < 1 ? 1 - aspect : 0;
    const { azimuth, elevation, distance, target } = pose.camera;
    const r = distance * (1 + portrait * (sequence.portraitPull ?? 1.45));
    tmp.target.set(target[0], target[1], target[2]);
    camera.position.set(
      target[0] + r * Math.cos(elevation) * Math.sin(azimuth),
      target[1] + r * Math.sin(elevation),
      target[2] + r * Math.cos(elevation) * Math.cos(azimuth),
    );
    camera.lookAt(tmp.target);
    const shiftX = aspect > 1 ? (sequence.frameShift ?? 0) : 0;
    const shiftY = aspect < 1 ? (sequence.portraitLift ?? 0) : 0;
    if (shiftX !== 0 || shiftY !== 0) {
      const ox = -size.width * shiftX;
      const oy = size.height * shiftY;
      const v = camera.view;
      if (!v?.enabled || v.offsetX !== ox || v.offsetY !== oy || v.fullWidth !== size.width || camera.fov !== sequence.fov) {
        camera.fov = sequence.fov;
        camera.setViewOffset(size.width, size.height, ox, oy, size.width, size.height);
      }
    } else if (camera.view?.enabled) {
      camera.clearViewOffset();
    }
    if (Math.abs(camera.fov - sequence.fov) > 0.01) {
      camera.fov = sequence.fov;
      camera.updateProjectionMatrix();
    }

    // Keep drawing only while something is still moving.
    if (spring.velocity !== 0 || spring.value !== channel.target) invalidate();
  });

  const pivot = asset.pivot ?? [0, 0, 0];
  return (
    <group ref={turntable}>
      {/* Offset so the pivot (watch head) sits at the turntable origin. */}
      <primitive
        object={scene}
        position={[-pivot[0], -pivot[1], -pivot[2]]}
        scale={asset.scale ?? 1}
        rotation={asset.rotation ?? [0, 0, 0]}
      />
    </group>
  );
}
