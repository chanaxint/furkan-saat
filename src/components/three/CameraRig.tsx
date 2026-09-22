"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import { sampleScalar, sampleVec3, type Keyframe, type Vec3 } from "@/lib/scene/keyframes";
import type { ProgressChannel } from "@/lib/scene/progress";

type Props = {
  channel: ProgressChannel;
  position: Keyframe<Vec3>[];
  target: Keyframe<Vec3>[];
  fov?: Keyframe<number>[];
  /** Damping (higher = snappier). Keep low for a heavy, cinematic camera. */
  damping?: number;
  /** Subtle pointer-driven drift in scene units. 0 disables. */
  drift?: number;
};

/**
 * Scroll-keyframed camera. Reads the shared progress channel every frame,
 * damps it (so wheel steps never feel mechanical) and places the camera on
 * the authored path. This is the only place that moves the camera.
 */
export function CameraRig({ channel, position, target, fov, damping = 3.2, drift = 0.08 }: Props) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const pointer = useThree((s) => s.pointer);
  const aspect = useThree((s) => s.size.width / s.size.height);
  const tmp = useMemo(
    () => ({ pos: [0, 0, 0] as Vec3, look: [0, 0, 0] as Vec3, v: new Vector3(), lookV: new Vector3() }),
    [],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    channel.current = MathUtils.damp(channel.current, channel.target, damping, dt);
    const p = channel.current;

    sampleVec3(position, p, tmp.pos);
    sampleVec3(target, p, tmp.look);

    // Portrait screens: pull the camera back so the subject keeps its margins.
    const pull = aspect < 1 ? 1 + (1 - aspect) * 1.3 : 1;
    tmp.v.set(
      tmp.look[0] + (tmp.pos[0] - tmp.look[0]) * pull + pointer.x * drift,
      tmp.look[1] + (tmp.pos[1] - tmp.look[1]) * pull + pointer.y * drift * 0.6,
      tmp.look[2] + (tmp.pos[2] - tmp.look[2]) * pull,
    );
    camera.position.lerp(tmp.v, 1 - Math.exp(-6 * dt));
    tmp.lookV.set(...tmp.look);
    camera.lookAt(tmp.lookV);

    if (fov) {
      const f = sampleScalar(fov, p);
      if (Math.abs(camera.fov - f) > 0.01) {
        camera.fov = f;
        camera.updateProjectionMatrix();
      }
    }
  });

  return null;
}
