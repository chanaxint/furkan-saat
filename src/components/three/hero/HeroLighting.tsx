"use client";

import { Environment, Lightformer } from "@react-three/drei";

/**
 * Lighting for the hero film. The footage is lit by warm tungsten on a walnut
 * table, so the steel must reflect *that* world: amber softboxes, a dark
 * warm-brown surround and a wood-toned floor bounce. It stays flattering once
 * the footage dissolves into the house green (champagne warmth on steel).
 */
export function HeroLighting() {
  return (
    <>
      <ambientLight intensity={0.06} color="#f3ece2" />
      <directionalLight position={[3, 4, 4]} intensity={0.8} color="#fff4e6" />
      <directionalLight position={[-4, 1, -3]} intensity={0.35} color="#cfd8d3" />

      <Environment resolution={512} frames={1} environmentIntensity={1.05}>
        <color attach="background" args={["#1b1f1d"]} />
        {/* Overhead tungsten softbox */}
        <Lightformer form="rect" intensity={2.2} color="#fff3e4" position={[0, 5, 1]} rotation-x={Math.PI / 2} scale={[9, 5, 1]} />
        {/* Soft front fill — warm, dimmer than a studio */}
        <Lightformer form="rect" intensity={0.8} color="#f4efe8" position={[0, 0.5, 6]} scale={[8, 4, 1]} />
        {/* Key strip, right */}
        <Lightformer form="rect" intensity={2.6} color="#fff1df" position={[4.5, 0.5, 2.5]} rotation-y={-Math.PI / 3} scale={[1.6, 8, 1]} />
        {/* Fill strip, left */}
        <Lightformer form="rect" intensity={1.3} color="#eef0ec" position={[-4.5, 0.5, 2]} rotation-y={Math.PI / 3} scale={[1.3, 8, 1]} />
        {/* Side panels so profiles never fall into black */}
        <Lightformer form="rect" intensity={1.0} color="#e8ebe7" position={[6, 0, -1]} rotation-y={-Math.PI / 2} scale={[4, 6, 1]} />
        <Lightformer form="rect" intensity={0.7} color="#e8ebe7" position={[-6, 0, -1]} rotation-y={Math.PI / 2} scale={[4, 6, 1]} />
        {/* Walnut table bounce */}
        <Lightformer form="rect" intensity={0.45} color="#4a3a2c" position={[0, -5, 0]} rotation-x={-Math.PI / 2} scale={[12, 12, 1]} />
      </Environment>
    </>
  );
}
