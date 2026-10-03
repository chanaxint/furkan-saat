"use client";

import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { ACESFilmicToneMapping, Euler, type Group, type Mesh, type PerspectiveCamera, Quaternion, SRGBColorSpace, Vector3 } from "three";
import { SHOWCASE_FOV, SPIN_AXIS_A, SPIN_AXIS_B, type ShowcaseState } from "@/lib/scene/showcase";

type Props = {
  state: ShowcaseState;
  /** .glb path (meshopt-compressed is fine). */
  model: string;
  /** Centre of the watch head in model units — what the watch turns about. */
  pivot: [number, number, number];
  /** Whether to render at all (off while the section is far off screen). */
  active: boolean;
  /** Receives a function that renders one new frame (called on every timeline update). */
  onWake: (wake: () => void) => void;
  onReady?: () => void;
};

/**
 * The WebGL layer of a brand showcase: one watch, lit for gold on a light
 * ground. Renders on demand — the scrubbed timeline wakes it on each update.
 */
export default function ShowcaseWatchScene({ state, model, pivot, active, onWake, onReady }: Props) {
  return (
    <Canvas
      frameloop={active ? "demand" : "never"}
      dpr={[1, 1.6]}
      camera={{ position: [0, 0, 0], fov: SHOWCASE_FOV, near: 0.05, far: 60 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        outputColorSpace: SRGBColorSpace,
        toneMapping: ACESFilmicToneMapping,
      }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1;
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <GoldLighting />
      <Suspense fallback={null}>
        <Rig state={state} model={model} pivot={pivot} onWake={onWake} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}

/**
 * Studio light for polished gold. Gold only reads as metal when it also
 * reflects darkness, so the surround is a deep warm brown and the light comes
 * from a few defined softboxes and strips (long clean highlights on the case
 * and links), with a low warm bounce from below.
 */
function GoldLighting() {
  return (
    <>
      <ambientLight intensity={0.05} color="#fff3e0" />
      <directionalLight position={[3, 4, 5]} intensity={0.9} color="#fff0d6" />
      <directionalLight position={[-4, 2, -2]} intensity={0.3} color="#f2e6d2" />
      <Environment resolution={512} frames={1} environmentIntensity={1}>
        <color attach="background" args={["#2c241a"]} />
        {/* Overhead softbox */}
        <Lightformer form="rect" intensity={2.4} color="#fff6e6" position={[0, 5, 0.5]} rotation-x={Math.PI / 2} scale={[6, 3, 1]} />
        {/* Key strip, right — draws the case edge and the bezel stones */}
        <Lightformer form="rect" intensity={3.4} color="#fff2dc" position={[4.2, 0.6, 2.6]} rotation-y={-Math.PI / 3} scale={[1.1, 7, 1]} />
        {/* Fill strip, left */}
        <Lightformer form="rect" intensity={1.6} color="#fffaf2" position={[-4.4, 0.2, 2]} rotation-y={Math.PI / 3} scale={[0.9, 7, 1]} />
        {/* Small front card for the dial */}
        <Lightformer form="rect" intensity={0.9} color="#fff8ec" position={[0.8, 1.6, 6]} scale={[2.6, 1.4, 1]} />
        {/* Rim panels behind */}
        <Lightformer form="rect" intensity={1.2} color="#f6e7cc" position={[5, 1, -3]} rotation-y={-Math.PI / 1.6} scale={[2.5, 6, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#f6e7cc" position={[-5, 1, -3]} rotation-y={Math.PI / 1.6} scale={[2.5, 6, 1]} />
        {/* Warm bounce from below */}
        <Lightformer form="rect" intensity={0.35} color="#8a6a3c" position={[0, -5, 0]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
      </Environment>
    </>
  );
}

const AXIS_A = new Vector3(...SPIN_AXIS_A).normalize();
const AXIS_B = new Vector3(...SPIN_AXIS_B).normalize();

function Rig({
  state,
  model,
  pivot,
  onWake,
  onReady,
}: Pick<Props, "state" | "model" | "pivot" | "onWake" | "onReady">) {
  const gltf = useGLTF(model);
  const watch = useRef<Group>(null);
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const invalidate = useThree((s) => s.invalidate);
  const tmp = useMemo(() => ({ e: new Euler(), q: new Quaternion(), spin: new Quaternion() }), []);

  // One clone per scene, with crisp texture sampling at grazing angles.
  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      const mat = m.material as { map?: { anisotropy: number }; envMapIntensity?: number };
      if (mat.map) mat.map.anisotropy = 8;
      mat.envMapIntensity = 1.1;
    });
    return clone;
  }, [gltf.scene]);

  useEffect(() => {
    onWake(() => invalidate());
    onReady?.();
    invalidate();
  }, [onWake, onReady, invalidate]);

  useFrame(() => {
    if (camera.fov !== SHOWCASE_FOV) {
      camera.fov = SHOWCASE_FOV;
      camera.updateProjectionMatrix();
    }
    const w = watch.current;
    if (!w) return;
    // Portrait screens: no sideways shift (the line sits below).
    const aspect = size.width / size.height;
    const portrait = aspect < 1 ? 1 - aspect : 0;
    const xFactor = Math.max(0, 1 - portrait * 2);
    // The line takes the lower part of a phone screen, so the watch sits higher and further back.
    w.position.set(state.x * xFactor, state.y + portrait * 0.55, state.z * (1 + portrait * 1.7));
    tmp.e.set(-state.pitch, state.yaw, state.roll, "YXZ");
    tmp.q.setFromEuler(tmp.e);
    tmp.spin.setFromAxisAngle(AXIS_B, state.spinB);
    tmp.q.premultiply(tmp.spin);
    tmp.spin.setFromAxisAngle(AXIS_A, state.spinA);
    tmp.q.premultiply(tmp.spin);
    w.quaternion.copy(tmp.q);
    w.scale.setScalar(state.scale);
  });

  return (
    <group ref={watch}>
      <primitive object={scene} position={[-pivot[0], -pivot[1], -pivot[2]]} />
    </group>
  );
}
