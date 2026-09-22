"use client";

import { useMemo } from "react";
import { Color } from "three";

/**
 * PLACEHOLDER — not a watch model.
 * A restrained, abstract disc object that stands in for the hero timepiece
 * so lighting, framing and camera choreography can be art-directed before the
 * real GLB exists. Faces +Z. Diameter ≈ 2 scene units (same as the target
 * export scale for the real asset — see ASSETS.story.watch.scale).
 */
export function WatchProxy() {
  const mats = useMemo(
    () => ({
      metal: { color: new Color("#c8b99a"), metalness: 1, roughness: 0.26, envMapIntensity: 1.25 },
      satin: { color: new Color("#b8aa8c"), metalness: 1, roughness: 0.48, envMapIntensity: 1 },
      face: {
        color: new Color("#1a4a3f"),
        metalness: 0.35,
        roughness: 0.38,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.6,
        sheen: 0.4,
        sheenColor: new Color("#c8b99a"),
      },
    }),
    [],
  );

  return (
    <group>
      {/* Body */}
      <mesh rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[1, 1, 0.26, 128, 1]} />
        <meshStandardMaterial {...mats.satin} />
      </mesh>
      {/* Polished rim */}
      <mesh position-z={0.13}>
        <torusGeometry args={[0.95, 0.055, 32, 160]} />
        <meshStandardMaterial {...mats.metal} />
      </mesh>
      {/* Lacquered face */}
      <mesh position-z={0.132}>
        <circleGeometry args={[0.9, 128]} />
        <meshPhysicalMaterial {...mats.face} />
      </mesh>
      {/* Single hairline inner ring — kept deliberately abstract */}
      <mesh position-z={0.136}>
        <ringGeometry args={[0.74, 0.745, 160]} />
        <meshStandardMaterial {...mats.metal} />
      </mesh>
      {/* Centre pin */}
      <mesh position-z={0.15} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.035, 0.035, 0.04, 32]} />
        <meshStandardMaterial {...mats.metal} />
      </mesh>
      {/* Side crown stub (gives rotation a readable orientation) */}
      <mesh position={[1.04, 0, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.08, 0.08, 0.12, 32]} />
        <meshStandardMaterial {...mats.satin} />
      </mesh>
    </group>
  );
}
