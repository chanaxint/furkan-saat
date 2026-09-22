"use client";

import { Environment, Lightformer } from "@react-three/drei";

/**
 * Product-photography lighting for polished steel and ceramic.
 * - Two tall strip softboxes give the case and bracelet long, clean highlights.
 * - A broad overhead box lifts the dial without flattening it.
 * - The surround is the site's deep green, so reflections belong to the page.
 * Everything is procedural (no HDR download) and static: highlights travel
 * across the metal only because the watch itself turns — as on a real set.
 */
export function ShowcaseLighting() {
  return (
    <>
      <ambientLight intensity={0.05} color="#c8b99a" />
      <directionalLight position={[3, 4, 5]} intensity={1.1} color="#fff4e2" />
      <directionalLight position={[-4, 1, -3]} intensity={0.5} color="#b9d0c6" />

      <Environment resolution={512} frames={1} environmentIntensity={1.15}>
        <color attach="background" args={["#2a3a35"]} />
        {/* Overhead softbox */}
        <Lightformer form="rect" intensity={2.4} color="#fff6ea" position={[0, 5, 1]} rotation-x={Math.PI / 2} scale={[9, 5, 1]} />
        {/* Front diffusion — steel needs something bright to reflect head-on */}
        <Lightformer form="rect" intensity={1.1} color="#f4efe6" position={[0, 0.5, 6]} scale={[8, 4, 1]} />
        {/* Key strip — right */}
        <Lightformer form="rect" intensity={3.2} color="#fff3e0" position={[4.5, 0.5, 2.5]} rotation-y={-Math.PI / 3} scale={[1.6, 8, 1]} />
        {/* Fill strip — left */}
        <Lightformer form="rect" intensity={1.8} color="#eef3ef" position={[-4.5, 0.5, 2]} rotation-y={Math.PI / 3} scale={[1.3, 8, 1]} />
        {/* Side panels — keep the profile view from falling into black */}
        <Lightformer form="rect" intensity={1.4} color="#e9efe9" position={[6, 0, -1]} rotation-y={-Math.PI / 2} scale={[4, 6, 1]} />
        <Lightformer form="rect" intensity={0.9} color="#e9efe9" position={[-6, 0, -1]} rotation-y={Math.PI / 2} scale={[4, 6, 1]} />
        {/* Rim — behind, cool */}
        <Lightformer form="rect" intensity={1.3} color="#d6e6df" position={[0, 1, -5]} scale={[6, 1.6, 1]} />
        {/* Warm champagne kicker, low — gives the bezel edge a line of light */}
        <Lightformer form="ring" intensity={0.7} color="#c8b99a" position={[2.5, -2.5, 2]} scale={1.5} />
        {/* Floor bounce tinted by the set */}
        <Lightformer form="rect" intensity={0.25} color="#1d463d" position={[0, -5, 0]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
      </Environment>
    </>
  );
}
