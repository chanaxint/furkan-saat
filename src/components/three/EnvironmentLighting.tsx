"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { forwardRef } from "react";
import type { DirectionalLight } from "three";

type Props = {
  /** Overall exposure of the studio. */
  intensity?: number;
  /** Warm (champagne) vs neutral key. */
  warmth?: number;
};

/**
 * Studio lighting built procedurally from Lightformers — no HDR download.
 * Long softboxes give metal a clean, editorial reflection; a narrow rim strip
 * defines silhouettes against the dark green set.
 *
 * The forwarded ref points at the key light so scenes can animate it.
 */
export const EnvironmentLighting = forwardRef<DirectionalLight, Props>(function EnvironmentLighting(
  { intensity = 1, warmth = 0.6 },
  keyRef,
) {
  const warm = `rgb(255, ${Math.round(246 - warmth * 18)}, ${Math.round(232 - warmth * 40)})`;
  return (
    <>
      <ambientLight intensity={0.08 * intensity} color="#c8b99a" />
      <directionalLight ref={keyRef} position={[3.5, 4, 5]} intensity={2 * intensity} color={warm} />
      <directionalLight position={[-5, 1.5, -3]} intensity={0.9 * intensity} color="#9fb8ad" />
      <spotLight position={[0, 6, 1]} angle={0.4} penumbra={1} intensity={8 * intensity} color="#f2ede3" />

      <Environment resolution={256} frames={1}>
        <color attach="background" args={["#030b09"]} />
        {/* Overhead softbox */}
        <Lightformer form="rect" intensity={2.2} color={warm} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[8, 2, 1]} />
        {/* Key strip, right */}
        <Lightformer form="rect" intensity={3} color={warm} position={[5, 1, 2]} rotation-y={-Math.PI / 2.5} scale={[1.2, 6, 1]} />
        {/* Rim strip, left-back */}
        <Lightformer form="rect" intensity={1.4} color="#cfe0d8" position={[-5, 0.5, -2]} rotation-y={Math.PI / 2.6} scale={[0.6, 6, 1]} />
        {/* Faint floor bounce, tinted by the green set */}
        <Lightformer form="rect" intensity={0.35} color="#1d463d" position={[0, -4, 0]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
      </Environment>
    </>
  );
});
