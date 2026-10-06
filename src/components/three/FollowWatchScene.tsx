"use client";

import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { ACESFilmicToneMapping, Box3, type Group, MathUtils, SRGBColorSpace, Vector3 } from "three";

/** Where the pointer is, -1…1 on both axes (shared by the scene's frame loop). */
const pointer = { x: 0, y: 0, moved: false };

/**
 * One watch, head-on, turning gently towards the pointer — as if it looks at
 * you. On touch screens (no pointer) it sways slowly by itself.
 */
export default function FollowWatchScene({
  model,
  active,
  facing = [0, 0, 0],
  onReady,
}: {
  model: string;
  active: boolean;
  /** Rotation (radians) that turns the model's dial to face the camera. */
  facing?: [number, number, number];
  onReady?: () => void;
}) {
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      pointer.moved = true;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 7], fov: 30, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", outputColorSpace: SRGBColorSpace, toneMapping: ACESFilmicToneMapping }}
      style={{ position: "absolute", inset: 0 }}
    >
      <ambientLight intensity={0.08} />
      <directionalLight position={[3, 4, 6]} intensity={1.1} color="#ffffff" />
      <directionalLight position={[-4, 2, -2]} intensity={0.35} color="#f3efe6" />
      {/* A studio for steel and gold: dark surround, long soft highlights. */}
      <Environment resolution={512} frames={1}>
        <color attach="background" args={["#2a2b2d"]} />
        <Lightformer form="rect" intensity={2.6} color="#ffffff" position={[0, 5, 0.5]} rotation-x={Math.PI / 2} scale={[7, 3, 1]} />
        <Lightformer form="rect" intensity={3.2} color="#fff8ee" position={[4.2, 0.6, 2.6]} rotation-y={-Math.PI / 3} scale={[1.2, 7, 1]} />
        <Lightformer form="rect" intensity={1.8} color="#ffffff" position={[-4.4, 0.2, 2]} rotation-y={Math.PI / 3} scale={[1, 7, 1]} />
        <Lightformer form="rect" intensity={1.1} color="#ffffff" position={[0.8, 1.6, 6]} scale={[3, 1.5, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#efe9df" position={[5, 1, -3]} rotation-y={-Math.PI / 1.6} scale={[2.5, 6, 1]} />
        <Lightformer form="rect" intensity={0.9} color="#efe9df" position={[-5, 1, -3]} rotation-y={Math.PI / 1.6} scale={[2.5, 6, 1]} />
        <Lightformer form="rect" intensity={0.45} color="#9c958a" position={[0, -5, 0]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
      </Environment>
      <Suspense fallback={null}>
        <Watch model={model} facing={facing} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}

function Watch({ model, facing, onReady }: { model: string; facing: [number, number, number]; onReady?: () => void }) {
  const gltf = useGLTF(model);
  const turn = useRef<Group>(null);

  // Centred on its own bounds and scaled so its height fills most of the frame.
  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.rotation.set(...facing);
    clone.updateMatrixWorld(true);
    const box = new Box3().setFromObject(clone);
    const size = box.getSize(new Vector3());
    const centre = box.getCenter(new Vector3());
    const scale = 2.55 / Math.max(size.x, size.y);
    clone.position.sub(centre).multiplyScalar(scale);
    clone.scale.setScalar(scale);
    return clone;
  }, [gltf, facing]);

  useEffect(() => onReady?.(), [onReady]);

  useFrame((state, dt) => {
    const g = turn.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    // With a pointer: look towards it. Without one: a slow, small sway.
    const tx = pointer.moved ? pointer.x * 0.5 : Math.sin(t * 0.5) * 0.18;
    const ty = pointer.moved ? pointer.y * 0.32 : Math.sin(t * 0.37) * 0.08;
    const k = 1 - Math.exp(-dt * 4);
    g.rotation.y = MathUtils.lerp(g.rotation.y, tx, k);
    g.rotation.x = MathUtils.lerp(g.rotation.x, ty, k);
    g.position.y = Math.sin(t * 0.8) * 0.03;
  });

  return (
    <group ref={turn}>
      <primitive object={scene} />
    </group>
  );
}
