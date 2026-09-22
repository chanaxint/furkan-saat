"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { DirectionalLight, Group, Mesh, MeshStandardMaterial } from "three";
import { ASSETS } from "@/lib/assets";
import { sampleScalar, sampleVec3, type Vec3 } from "@/lib/scene/keyframes";
import { progress } from "@/lib/scene/progress";
import { CAMERA, HAND, LIGHT, WATCH } from "@/lib/scene/story";
import { CameraRig } from "./CameraRig";
import { EnvironmentLighting } from "./EnvironmentLighting";
import { ModelSlot } from "./ModelSlot";
import { HandProxy } from "./placeholders/HandProxy";
import { SurfaceProxy } from "./placeholders/SurfaceProxy";
import { WatchProxy } from "./placeholders/WatchProxy";
import { SceneCanvas } from "./SceneCanvas";

/**
 * WatchScene — the sticky stage shared by 01 Opening, 02 Reveal, 03 Features.
 * All motion is authored in lib/scene/story.ts; this file only wires it up.
 */
export default function WatchScene({ className }: { className?: string }) {
  return (
    <SceneCanvas className={className} camera={{ position: CAMERA.position[0].value, fov: CAMERA.fov[0].value }}>
      <StoryStage />
    </SceneCanvas>
  );
}

function StoryStage() {
  const keyLight = useRef<DirectionalLight>(null);
  const surface = useRef<Group>(null);

  useFrame(() => {
    const p = progress.story.current;
    if (keyLight.current) keyLight.current.intensity = sampleScalar(LIGHT.key, p);
    if (surface.current) {
      const o = sampleScalar(LIGHT.surfaceOpacity, p);
      surface.current.visible = o > 0.01;
      surface.current.traverse((c) => {
        const m = (c as Mesh).material as MeshStandardMaterial | undefined;
        if (!m || !("opacity" in m)) return;
        m.userData.baseOpacity ??= m.opacity;
        m.transparent = true;
        m.opacity = m.userData.baseOpacity * o;
      });
    }
  });

  return (
    <>
      <fog attach="fog" args={["#071a16", 11, 26]} />
      <EnvironmentLighting ref={keyLight} />
      <CameraRig channel={progress.story} {...CAMERA} />
      <StoryRig />
      <ModelSlot asset={ASSETS.story.surface} fallback={<SurfaceProxy ref={surface} />} />
    </>
  );
}

/** Hand + watch choreography. The watch rides the hand until `detachAt`. */
function StoryRig() {
  const hand = useRef<Group>(null);
  const watch = useRef<Group>(null);
  const tmp = useMemo(() => ({ pos: [0, 0, 0] as Vec3, rot: [0, 0, 0] as Vec3, hp: [0, 0, 0] as Vec3, hr: [0, 0, 0] as Vec3 }), []);

  useFrame(({ clock, pointer }) => {
    const p = progress.story.current;
    const t = clock.elapsedTime;

    sampleVec3(HAND.position, p, tmp.hp);
    sampleVec3(HAND.rotation, p, tmp.hr);
    if (hand.current) {
      hand.current.position.set(...tmp.hp);
      hand.current.rotation.set(...tmp.hr);
    }

    if (!watch.current) return;
    const attached = p <= WATCH.detachAt;
    if (attached) {
      tmp.pos[0] = tmp.hp[0];
      tmp.pos[1] = tmp.hp[1];
      tmp.pos[2] = tmp.hp[2];
      tmp.rot[0] = tmp.hr[0];
      tmp.rot[1] = tmp.hr[1];
      tmp.rot[2] = tmp.hr[2];
    } else {
      tmp.pos[0] = tmp.pos[1] = tmp.pos[2] = 0;
      sampleVec3(WATCH.rotation, p, tmp.rot);
    }

    // Idle breathing + a whisper of pointer response once the watch is alone.
    const alone = attached ? 0 : 1;
    const a = WATCH.idleAmplitude;
    watch.current.position.set(tmp.pos[0], tmp.pos[1] + Math.sin(t * 0.6) * 0.02 * alone, tmp.pos[2]);
    watch.current.rotation.set(
      tmp.rot[0] + Math.sin(t * 0.5) * a * alone - pointer.y * 0.06 * alone,
      tmp.rot[1] + Math.cos(t * 0.37) * a * alone + pointer.x * 0.1 * alone,
      tmp.rot[2],
    );
    watch.current.scale.setScalar(sampleScalar(WATCH.scale, p));
  });

  return (
    <>
      <group ref={hand}>
        <ModelSlot asset={ASSETS.story.hand} fallback={<HandProxy />} />
      </group>
      <group ref={watch}>
        <ModelSlot asset={ASSETS.story.watch} fallback={<WatchProxy />} />
      </group>
    </>
  );
}
