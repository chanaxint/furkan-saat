"use client";

import { ContactShadows, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  ACESFilmicToneMapping,
  Group,
  type Mesh,
  type MeshStandardMaterial,
  type Object3D,
  type PerspectiveCamera,
  SRGBColorSpace,
  Vector3,
} from "three";
import { useInView } from "@/hooks/useInView";
import { ASSETS, type BoxAsset, type ModelAsset } from "@/lib/assets";
import { INTRO_FOV, type IntroState } from "@/lib/scene/intro";
import { progress } from "@/lib/scene/progress";
import { ShowcaseLighting } from "../showcase/ShowcaseLighting";

type Props = {
  state: IntroState;
  className?: string;
  onReady?: () => void;
};

/**
 * BoxIntroScene — the box + watch set for the opening sequence.
 * It renders on demand: the GSAP timeline wakes it on every update, so the
 * GPU is idle whenever the scrubbed timeline is at rest.
 */
export default function BoxIntroScene({ state, className, onReady }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const inView = useInView(wrap, "25% 0px");

  return (
    <div ref={wrap} className={className} style={{ position: "absolute", inset: 0 }}>
      <Canvas
        frameloop={inView ? "demand" : "never"}
        dpr={[1, 1.5]}
        camera={{ position: [0, 13.5, 0.2], fov: INTRO_FOV, near: 0.05, far: 60 }}
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
          <IntroSet state={state} onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  );
}

function IntroSet({ state, onReady }: { state: IntroState; onReady?: () => void }) {
  const box = ASSETS.intro.box;
  const watch = ASSETS.showcase.watch as ModelAsset & { src: string };

  const boxGltf = useGLTF(box.src);
  const watchGltf = useGLTF(watch.src);
  const boxScene = useMemo(() => boxGltf.scene.clone(true), [boxGltf.scene]);
  const watchScene = useMemo(() => watchGltf.scene.clone(true), [watchGltf.scene]);

  const lidPivot = useRef<Group | null>(null);
  const shadow = useRef<Group>(null);
  const boxMaterials = useMemo(() => {
    // Own the materials, so fading the box never touches the shared GLB cache.
    const mats: MeshStandardMaterial[] = [];
    boxScene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      const own = (m.material as MeshStandardMaterial).clone();
      m.material = own;
      mats.push(own);
    });
    return mats;
  }, [boxScene]);
  const lastBox = useRef(1);
  const watchRef = useRef<Group>(null);

  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const look = useMemo(() => new Vector3(), []);

  // Rebuild the hinge: attach the lid to a pivot placed on the hinge axis.
  useLayoutEffect(() => {
    lidPivot.current = attachHinge(boxScene, box);
    onReady?.();
    invalidate();
  }, [boxScene, box, onReady, invalidate]);

  useEffect(() => {
    progress.intro.wake = () => invalidate();
    return () => {
      progress.intro.wake = undefined;
    };
  }, [invalidate]);

  useFrame(() => {
    // Lid: timeline holds the absolute angle; pivot applies the delta from the file.
    if (lidPivot.current) lidPivot.current.rotation.x = state.lid - box.modelledLidAngle;

    if (state.box !== lastBox.current) {
      lastBox.current = state.box;
      const fading = state.box < 0.999;
      boxMaterials.forEach((m) => {
        m.transparent = fading;
        m.depthWrite = !fading;
        m.opacity = state.box;
      });
      boxScene.visible = state.box > 0.001;
      if (shadow.current) shadow.current.visible = boxScene.visible;
    }

    const w = state.watch;
    if (watchRef.current) {
      watchRef.current.position.set(w.x, w.y, w.z);
      watchRef.current.rotation.set(w.rx, w.ry, w.rz);
    }

    // Camera on an orbit around the look-at point; portrait screens step back.
    const c = state.cam;
    const aspect = size.width / size.height;
    const r = c.distance * (aspect < 1 ? 1 + (1 - aspect) * 1.45 : 1);
    camera.position.set(
      c.tx + r * Math.cos(c.elevation) * Math.sin(c.azimuth),
      c.ty + r * Math.sin(c.elevation),
      c.tz + r * Math.cos(c.elevation) * Math.cos(c.azimuth),
    );
    look.set(c.tx + (w.x - c.tx) * c.follow, c.ty + (w.y - c.ty) * c.follow, c.tz + (w.z - c.tz) * c.follow);
    camera.lookAt(look);
    if (camera.fov !== INTRO_FOV) {
      camera.fov = INTRO_FOV;
      camera.updateProjectionMatrix();
    }
  });

  const s = box.scale ?? 1;
  const pivot = watch.pivot ?? [0, 0, 0];
  const tableY = -0.911 * s;

  return (
    <>
      <primitive object={boxScene} scale={s} />
      {/* The watch: group origin = watch head (pivot), so it turns on itself. */}
      <group ref={watchRef}>
        <primitive object={watchScene} position={[-pivot[0], -pivot[1], -pivot[2]]} />
      </group>
      {/* Invisible table: only a soft contact shadow under the box. */}
      <ContactShadows ref={shadow} position={[0, tableY + 0.005, 0.1]} scale={9} blur={2.8} far={2.5} opacity={0.55} frames={1} resolution={512} />
    </>
  );
}

/**
 * Wrap the lid in a pivot group sitting on the hinge axis, preserving its
 * current world transform. Works whether or not the export re-baked the
 * node transforms (as meshopt quantisation does).
 */
function attachHinge(root: Object3D, box: BoxAsset) {
  let lid: Object3D | undefined;
  for (const name of box.lidNodes) {
    lid = root.getObjectByName(name);
    if (lid) break;
  }
  if (!lid) return null;
  root.updateMatrixWorld(true);
  const group = new Group();
  group.name = "LidHinge";
  group.position.set(box.hinge[0], box.hinge[1], box.hinge[2]);
  lid.parent?.add(group);
  group.updateMatrixWorld(true);
  group.attach(lid);
  return group;
}
