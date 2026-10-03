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
  /** Metal the light is tuned for: polished gold, or steel. */
  tone?: "gold" | "steel";
  /**
   * Phones (portrait): how much higher the watch sits, how much further back
   * it goes, and whether sideways shifts are kept (otherwise dropped).
   */
  portrait?: Portrait;
};

type Portrait = { lift: number; pull: number; keepX?: boolean };

/**
 * The WebGL layer of a brand showcase: one watch on a light ground, lit for
 * gold or steel. Renders on demand — the scrubbed timeline wakes it on each
 * update.
 */
export default function ShowcaseWatchScene({
  state,
  model,
  pivot,
  active,
  onWake,
  onReady,
  tone = "gold",
  portrait = { lift: 0.55, pull: 1.7 },
}: Props) {
  return (
    <Canvas
      frameloop={active ? "demand" : "never"}
      dpr={[1, 2]}
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
      {tone === "gold" ? <GoldLighting /> : <SteelLighting />}
      <Suspense fallback={null}>
        <Rig state={state} model={model} pivot={pivot} onWake={onWake} onReady={onReady} portrait={portrait} />
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

/**
 * Studio light for polished steel on a pale grey ground: a cool dark surround
 * so the steel has something to reflect, broad white softboxes for long
 * highlights on the case and links, and strips to draw the bezel's edge.
 */
function SteelLighting() {
  return (
    <>
      <ambientLight intensity={0.08} color="#f4f6f8" />
      <directionalLight position={[3, 4, 5]} intensity={1} color="#ffffff" />
      <directionalLight position={[-4, 2, -2]} intensity={0.35} color="#eef2f5" />
      <Environment resolution={512} frames={1} environmentIntensity={1}>
        <color attach="background" args={["#2b2e31"]} />
        <Lightformer form="rect" intensity={2.6} color="#ffffff" position={[0, 5, 0.5]} rotation-x={Math.PI / 2} scale={[7, 3, 1]} />
        <Lightformer form="rect" intensity={3.2} color="#f7f9fb" position={[4.2, 0.6, 2.6]} rotation-y={-Math.PI / 3} scale={[1.2, 7, 1]} />
        <Lightformer form="rect" intensity={1.8} color="#ffffff" position={[-4.4, 0.2, 2]} rotation-y={Math.PI / 3} scale={[1, 7, 1]} />
        <Lightformer form="rect" intensity={1} color="#ffffff" position={[0.8, 1.6, 6]} scale={[3, 1.5, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#e9eef2" position={[5, 1, -3]} rotation-y={-Math.PI / 1.6} scale={[2.5, 6, 1]} />
        <Lightformer form="rect" intensity={0.9} color="#e9eef2" position={[-5, 1, -3]} rotation-y={Math.PI / 1.6} scale={[2.5, 6, 1]} />
        <Lightformer form="rect" intensity={0.5} color="#9aa1a6" position={[0, -5, 0]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
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
  portrait: lift,
}: Pick<Props, "state" | "model" | "pivot" | "onWake" | "onReady"> & { portrait: Portrait }) {
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
    // Portrait screens: the watch sits higher and further back (and, unless kept, without sideways shifts).
    const aspect = size.width / size.height;
    const portrait = aspect < 1 ? 1 - aspect : 0;
    const xFactor = lift.keepX ? 1 : Math.max(0, 1 - portrait * 2);
    w.position.set(state.x * xFactor, state.y + portrait * lift.lift, state.z * (1 + portrait * lift.pull));
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
