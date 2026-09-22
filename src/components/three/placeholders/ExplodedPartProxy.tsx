"use client";

/**
 * PLACEHOLDER — schematic layers for the exploded view.
 * Each part is a simple, abstract primitive with the correct *role* in the
 * stack (thickness, radius, material family), so spacing and choreography can
 * be designed before the real named-node GLB exists. Faces +Z.
 */

const metal = { color: "#c8b99a", metalness: 1, roughness: 0.28, envMapIntensity: 1.2 } as const;
const satin = { color: "#b3a587", metalness: 1, roughness: 0.5 } as const;
const dark = { color: "#0b2620", metalness: 0.25, roughness: 0.35 } as const;

export function ExplodedPartProxy({ id }: { id: string }) {
  switch (id) {
    case "crystal":
      return (
        <mesh rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.9, 0.9, 0.035, 96]} />
          <meshPhysicalMaterial color="#e8efe9" roughness={0.02} metalness={0} transparent opacity={0.22} clearcoat={1} />
        </mesh>
      );
    case "bezel":
      return (
        <mesh>
          <torusGeometry args={[0.95, 0.06, 32, 160]} />
          <meshStandardMaterial {...metal} />
        </mesh>
      );
    case "hands":
      return (
        <group>
          <mesh position={[0, 0.28, 0]}>
            <boxGeometry args={[0.035, 0.56, 0.01]} />
            <meshStandardMaterial {...metal} />
          </mesh>
          <mesh position={[0.2, -0.06, 0.012]} rotation-z={-1.2}>
            <boxGeometry args={[0.035, 0.42, 0.01]} />
            <meshStandardMaterial {...metal} />
          </mesh>
          <mesh rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.04, 0.04, 0.03, 24]} />
            <meshStandardMaterial {...metal} />
          </mesh>
        </group>
      );
    case "dial":
      return (
        <mesh>
          <circleGeometry args={[0.88, 128]} />
          <meshPhysicalMaterial {...dark} clearcoat={1} clearcoatRoughness={0.1} side={2} />
        </mesh>
      );
    case "case":
      return (
        <mesh rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[1, 1, 0.24, 128, 1, true]} />
          <meshStandardMaterial {...satin} side={2} />
        </mesh>
      );
    case "movement":
      return (
        <group>
          <mesh rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.78, 0.78, 0.1, 96]} />
            <meshStandardMaterial color="#8f866f" metalness={1} roughness={0.42} />
          </mesh>
          <mesh position-z={0.06}>
            <ringGeometry args={[0.35, 0.62, 96, 1, 0, Math.PI * 1.35]} />
            <meshStandardMaterial {...metal} side={2} />
          </mesh>
        </group>
      );
    case "caseback":
      return (
        <group>
          <mesh>
            <ringGeometry args={[0.62, 0.96, 128]} />
            <meshStandardMaterial {...satin} side={2} />
          </mesh>
          <mesh>
            <circleGeometry args={[0.62, 96]} />
            <meshPhysicalMaterial color="#dfe8e4" roughness={0.05} transparent opacity={0.18} side={2} />
          </mesh>
        </group>
      );
    case "strap":
      return (
        <group>
          {[1, -1].map((dir) => (
            <mesh key={dir} position={[0, dir * 1.45, 0]}>
              <boxGeometry args={[0.82, 1.05, 0.04]} />
              <meshStandardMaterial color="#3b2d22" roughness={0.8} metalness={0} transparent opacity={0.85} />
            </mesh>
          ))}
        </group>
      );
    default:
      return null;
  }
}
