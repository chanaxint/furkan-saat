"use client";

import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { ACESFilmicToneMapping, CanvasTexture, Euler, FrontSide, type Group, type Mesh, MeshStandardMaterial, type PerspectiveCamera, Quaternion, SRGBColorSpace, Vector3 } from "three";
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
  /** A steel case back over the model's back plate (see BrandStageDef.caseback). */
  caseback?: { z: number; radius: number };
  /** Metal the light is tuned for: polished gold, or steel. */
  tone?: "gold" | "steel";
  /**
   * Phones (portrait): how much higher the watch sits, how much further back
   * it goes, and whether sideways shifts are kept (otherwise dropped).
   */
  portrait?: Portrait;
};

/** `mix` (0–1, read every frame) lets a caller ease the phone placement off. */
type Portrait = { lift: number; pull: number; keepX?: boolean; mix?: number };

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
  caseback,
}: Props) {
  return (
    <Canvas
      frameloop={active ? "demand" : "never"}
      dpr={[1, 1.5]}
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
        <Rig state={state} model={model} pivot={pivot} onWake={onWake} onReady={onReady} portrait={portrait} caseback={caseback} />
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
  caseback,
}: Pick<Props, "state" | "model" | "pivot" | "onWake" | "onReady" | "caseback"> & { portrait: Portrait }) {
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
      const mat = m.material as { map?: { anisotropy: number }; envMapIntensity?: number; side: number };
      if (mat.map) mat.map.anisotropy = 8;
      mat.envMapIntensity = 1.1;
      // The model is closed: its back faces never show, so skip drawing them.
      mat.side = FrontSide;
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
    const portrait = (aspect < 1 ? 1 - aspect : 0) * (lift.mix ?? 1);
    const xFactor = lift.keepX ? 1 : Math.max(0, 1 - portrait * 2);
    w.position.set(state.x * xFactor, state.y + portrait * lift.lift, state.z * (1 + portrait * lift.pull));
    // A quaternion, when the state carries one (brand stages), else angles + diagonal spins.
    const q = (state as ShowcaseState & { q?: [number, number, number, number] }).q;
    if (q) {
      tmp.q.fromArray(q);
    } else {
      tmp.e.set(-state.pitch, state.yaw, state.roll, "YXZ");
      tmp.q.setFromEuler(tmp.e);
      tmp.spin.setFromAxisAngle(AXIS_B, state.spinB);
      tmp.q.premultiply(tmp.spin);
      tmp.spin.setFromAxisAngle(AXIS_A, state.spinA);
      tmp.q.premultiply(tmp.spin);
    }
    w.quaternion.copy(tmp.q);
    w.scale.setScalar(state.scale);
  });

  return (
    <group ref={watch}>
      <primitive object={scene} position={[-pivot[0], -pivot[1], -pivot[2]]} />
      {caseback && <CaseBack z={caseback.z - pivot[2]} radius={caseback.radius} />}
    </group>
  );
}

/**
 * A screwed-down steel case back: a brushed outer ring, a slightly raised
 * centre plate with fine concentric turning, and a groove between them. Faces
 * away from the dial (-z) and sits just behind the model's own back plate.
 */
function CaseBack({ z, radius }: { z: number; radius: number }) {
  const brushed = useMemo(() => {
    // Fine concentric lines (a turned finish) as a roughness/colour map.
    const size = 512;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d")!;
    g.fillStyle = "#d6d9dc";
    g.fillRect(0, 0, size, size);
    for (let r = 2; r < size / 2; r += 1.5) {
      const v = 200 + Math.round((Math.sin(r * 0.9) + Math.sin(r * 2.7) * 0.5) * 12);
      g.strokeStyle = `rgb(${v},${v + 3},${v + 6})`;
      g.lineWidth = 0.8;
      g.beginPath();
      g.arc(size / 2, size / 2, r, 0, Math.PI * 2);
      g.stroke();
    }
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);

  // Satin steel: metallic, but rough enough to read as grey, not as a mirror of the dark studio.
  const ring = useMemo(() => new MeshStandardMaterial({ color: "#ffffff", metalness: 0.92, roughness: 0.3, map: brushed, envMapIntensity: 2.2 }), [brushed]);
  const plate = useMemo(() => new MeshStandardMaterial({ color: "#ffffff", metalness: 0.92, roughness: 0.22, map: brushed, envMapIntensity: 2.4 }), [brushed]);
  const groove = useMemo(() => new MeshStandardMaterial({ color: "#55595d", metalness: 0.9, roughness: 0.55 }), []);
  const depth = radius * 0.035;

  return (
    // Rotated so the cylinders' +y runs along -z (away from the dial).
    <group position={[0, 0, z]} rotation-x={-Math.PI / 2}>
      {/* Outer ring: the back's full disc, just behind the model's plate. */}
      <mesh position={[0, depth / 2, 0]} material={ring}>
        <cylinderGeometry args={[radius, radius * 0.97, depth, 96]} />
      </mesh>
      {/* Groove. */}
      <mesh position={[0, depth + 0.0015, 0]} material={groove} rotation-x={Math.PI / 2}>
        <torusGeometry args={[radius * 0.72, radius * 0.012, 8, 96]} />
      </mesh>
      {/* Raised centre plate. */}
      <mesh position={[0, depth + depth * 0.35, 0]} material={plate}>
        <cylinderGeometry args={[radius * 0.7, radius * 0.7, depth * 0.7, 96]} />
      </mesh>
    </group>
  );
}
