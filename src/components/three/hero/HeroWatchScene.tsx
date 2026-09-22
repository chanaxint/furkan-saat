"use client";

import { RoundedBox, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  ACESFilmicToneMapping,
  Box3,
  Color,
  type DirectionalLight,
  Euler,
  type Group,
  type Material,
  type Mesh,
  type Object3D,
  type PerspectiveCamera,
  Quaternion,
  SRGBColorSpace,
  Vector3,
} from "three";
import { useInView } from "@/hooks/useInView";
import { ASSETS, type ModelAsset } from "@/lib/assets";
import {
  CUSHION_DEPTH,
  CUSHION_WIDTH,
  FOOTAGE_ELEVATION,
  HERO_FOV,
  type HeroState,
  SPIN_AXIS_A,
  SPIN_AXIS_B,
} from "@/lib/scene/hero";
import { CUSHION_TRACK, HERO_VIDEO } from "@/lib/scene/heroTrack";
import { progress } from "@/lib/scene/progress";
import { HeroLighting } from "./HeroLighting";

type Props = { state: HeroState; className?: string; onReady?: () => void };

/**
 * HeroWatchScene — the WebGL layer composited over the footage.
 * Renders on demand: the scrubbed timeline wakes it on every update.
 */
export default function HeroWatchScene({ state, className, onReady }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const inView = useInView(wrap, "25% 0px");
  return (
    <div ref={wrap} className={className} style={{ position: "absolute", inset: 0 }}>
      <Canvas
        frameloop={inView ? "demand" : "never"}
        dpr={[1, 1.5]}
        shadows
        camera={{ position: [0, 0, 0], fov: HERO_FOV, near: 0.05, far: 60 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          outputColorSpace: SRGBColorSpace,
          toneMapping: ACESFilmicToneMapping,
        }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.02;
          gl.shadowMap.autoUpdate = false;
        }}
      >
        <HeroLighting />
        <Suspense fallback={null}>
          <HeroRig state={state} onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  );
}

/* --------------------------------------------------------------- helpers */

/** Cushion-well geometry (table frame, cushion top centre at the origin). */
const INSERT_TOP = -0.38;
const WELL_FLOOR = -1.02;
// The cushion's base meets the insert at its front edge: the bracelet drapes
// down the front face and tucks in at the insert line.
const WELL = { front: CUSHION_DEPTH / 2 - 0.12, back: -CUSHION_DEPTH / 2 - 0.2, half: CUSHION_WIDTH / 2 + 0.04 };
const wallH = INSERT_TOP - WELL_FLOOR;
const wallY = (INSERT_TOP + WELL_FLOOR) / 2;
const INSERT_BLOCKS: { size: [number, number, number]; position: [number, number, number] }[] = [
  { size: [4, wallH, 1.6], position: [0, wallY, WELL.front + 0.8] },
  { size: [4, wallH, 1.6], position: [0, wallY, WELL.back - 0.8] },
  { size: [1.4, wallH, WELL.front - WELL.back], position: [WELL.half + 0.7, wallY, (WELL.front + WELL.back) / 2] },
  { size: [1.4, wallH, WELL.front - WELL.back], position: [-(WELL.half + 0.7), wallY, (WELL.front + WELL.back) / 2] },
];

const X = new Vector3(1, 0, 0);
const Y = new Vector3(0, 1, 0);
const Z = new Vector3(0, 0, 1);
const AXIS_A = new Vector3(...SPIN_AXIS_A).normalize();
const AXIS_B = new Vector3(...SPIN_AXIS_B).normalize();
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Clone a model with its own materials, so opacity can be faded per model. */
function useOwnedClone(root: Object3D) {
  return useMemo(() => {
    const clone = root.clone(true);
    const mats: Material[] = [];
    clone.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      const own = (m.material as Material).clone();
      m.material = own;
      mats.push(own);
    });
    return { clone, mats };
  }, [root]);
}

function setOpacity(mats: Material[], o: number) {
  const fading = o < 0.999;
  for (const m of mats) {
    if (m.transparent !== fading) {
      m.transparent = fading;
      m.needsUpdate = true;
    }
    m.opacity = o;
    m.depthWrite = !fading || o > 0.5;
  }
}

/* ------------------------------------------------------------------- rig */

function HeroRig({ state, onReady }: { state: HeroState; onReady?: () => void }) {
  const rolexAsset = ASSETS.showcase.watch as ModelAsset & { src: string };
  const jacobAsset = ASSETS.hero.jacob;

  const rolexGltf = useGLTF(rolexAsset.src);
  // Until the Jacob & Co. file exists, the handover spins back into the Rolex.
  const jacobGltf = useGLTF(jacobAsset.src ?? rolexAsset.src);
  const rolex = useOwnedClone(rolexGltf.scene);
  const jacob = useOwnedClone(jacobGltf.scene);

  const watch = useRef<Group>(null);
  const rolexRef = useRef<Group>(null);
  const jacobRef = useRef<Group>(null);
  const seatRig = useRef<Group>(null);
  const shadowLight = useRef<DirectionalLight>(null);
  const warmKey = useRef<DirectionalLight>(null);
  const shadowTarget = useRef<Group>(null);

  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const invalidate = useThree((s) => s.invalidate);

  // Normalise the Jacob & Co. model to the Rolex: centre it and match size.
  const jacobFit = useMemo(() => {
    if (!jacobAsset.src) {
      const p = rolexAsset.pivot ?? [0, 0, 0];
      return { position: new Vector3(-p[0], -p[1], -p[2]), scale: 1 };
    }
    const box = new Box3().setFromObject(jacob.clone);
    const dims = box.getSize(new Vector3());
    const centre = box.getCenter(new Vector3());
    const scale = 1.9 / Math.max(dims.x, dims.y, dims.z);
    return { position: centre.multiplyScalar(-scale), scale };
  }, [jacob.clone, jacobAsset.src, rolexAsset.pivot]);

  const tmp = useMemo(
    () => ({
      anchor: new Vector3(),
      up: new Vector3(),
      seatPos: new Vector3(),
      freePos: new Vector3(),
      seatQuat: new Quaternion(),
      boxQuat: new Quaternion(),
      free: new Quaternion(),
      q: new Quaternion(),
      e: new Euler(),
      warm: new Color("#ffcf96"),
      neutral: new Color("#fff4e2"),
    }),
    [],
  );

  useLayoutEffect(() => {
    // Aim the shadow light at the cushion (the target rides with the seat rig).
    if (shadowLight.current && shadowTarget.current) shadowLight.current.target = shadowTarget.current;
    onReady?.();
    invalidate();
  }, [onReady, invalidate]);

  useEffect(() => {
    progress.intro.wake = () => invalidate();
    return () => {
      progress.intro.wake = undefined;
    };
  }, [invalidate]);

  useFrame(() => {
    const W = size.width;
    const H = size.height;
    const aspect = W / H;
    const tanHalf = Math.tan((HERO_FOV * Math.PI) / 360);
    if (camera.fov !== HERO_FOV) {
      camera.fov = HERO_FOV;
      camera.updateProjectionMatrix();
    }

    /* 1 — cushion anchor from the footage track (cover-fit, like the frames) */
    const f = Math.min(HERO_VIDEO.frames - 1, Math.max(0, state.frame));
    const i0 = Math.floor(f);
    const i1 = Math.min(HERO_VIDEO.frames - 1, i0 + 1);
    const t = f - i0;
    const cx = CUSHION_TRACK.cx[i0] + (CUSHION_TRACK.cx[i1] - CUSHION_TRACK.cx[i0]) * t;
    const cy = CUSHION_TRACK.cy[i0] + (CUSHION_TRACK.cy[i1] - CUSHION_TRACK.cy[i0]) * t;
    const cw = CUSHION_TRACK.w[i0] + (CUSHION_TRACK.w[i1] - CUSHION_TRACK.w[i0]) * t;
    const cover = Math.max(W / HERO_VIDEO.width, H / HERO_VIDEO.height);
    const sx = (cx - HERO_VIDEO.width / 2) * cover + W / 2;
    const sy = (cy - HERO_VIDEO.height / 2) * cover + H / 2;
    const depth = (CUSHION_WIDTH * (H / 2)) / (cw * cover * tanHalf);
    const ndcX = (sx / W) * 2 - 1;
    const ndcY = 1 - (sy / H) * 2;
    tmp.anchor.set(ndcX * depth * tanHalf * aspect, ndcY * depth * tanHalf, -depth);

    // Table frame as seen by the footage camera.
    tmp.boxQuat.setFromAxisAngle(X, FOOTAGE_ELEVATION);
    tmp.up.set(0, Math.cos(FOOTAGE_ELEVATION), Math.sin(FOOTAGE_ELEVATION));
    // Seated: dial up, 12 o'clock toward the lid; head resting on the cushion.
    tmp.seatQuat.setFromAxisAngle(X, FOOTAGE_ELEVATION - Math.PI / 2);
    tmp.seatPos.copy(tmp.anchor).addScaledVector(tmp.up, 0.14 + state.lift);

    if (seatRig.current) {
      seatRig.current.visible = state.seat > 0.02 && state.film > 0.02;
      seatRig.current.position.copy(tmp.anchor);
      seatRig.current.quaternion.copy(tmp.boxQuat);
    }

    /* 2 — free pose (camera space) */
    const portrait = aspect < 1 ? 1 - aspect : 0;
    const pull = 1 + portrait * 1.35;
    tmp.freePos.set(state.x * (1 - portrait * 0.6), state.y, state.z * pull);
    tmp.e.set(-state.pitch, state.yaw, state.roll, "YXZ");
    tmp.free.setFromEuler(tmp.e);
    tmp.q.setFromAxisAngle(AXIS_B, state.spinB);
    tmp.free.premultiply(tmp.q);
    tmp.q.setFromAxisAngle(AXIS_A, state.spinA);
    tmp.free.premultiply(tmp.q);

    /* 3 — blend seated ↔ free */
    const k = smooth(Math.min(1, Math.max(0, state.seat)));
    if (watch.current) {
      watch.current.position.lerpVectors(tmp.freePos, tmp.seatPos, k);
      watch.current.quaternion.slerpQuaternions(tmp.free, tmp.seatQuat, k);
      watch.current.scale.setScalar(state.scale);
    }

    /* 4 — Rolex → Jacob & Co. cross-fade */
    const sw = smooth(Math.min(1, Math.max(0, state.swap)));
    if (rolexRef.current) rolexRef.current.visible = sw < 0.999;
    if (jacobRef.current) jacobRef.current.visible = sw > 0.001;
    setOpacity(rolex.mats, 1 - sw);
    setOpacity(jacob.mats, sw);

    /* 5 — light: warm like the footage while on the cushion, studio after */
    if (warmKey.current) {
      warmKey.current.color.lerpColors(tmp.neutral, tmp.warm, state.film);
      warmKey.current.intensity = 0.6 + 1.6 * state.film;
    }

    // Shadows only matter while the watch is on (or just above) the cushion.
    const shadowsOn = state.seat > 0.02 && state.film > 0.02;
    if (shadowLight.current) shadowLight.current.castShadow = shadowsOn;
    if (shadowsOn) gl.shadowMap.needsUpdate = true;
  });

  const rp = rolexAsset.pivot ?? [0, 0, 0];

  return (
    <>
      <directionalLight ref={warmKey} position={[-2.5, 3, 2]} intensity={2} color="#ffcf96" />

      <group ref={watch}>
        <group ref={rolexRef}>
          <primitive object={rolex.clone} position={[-rp[0], -rp[1], -rp[2]]} />
        </group>
        <group ref={jacobRef} visible={false}>
          <group rotation={jacobAsset.rotation ?? [0, 0, 0]}>
            <primitive object={jacob.clone} position={jacobFit.position} scale={jacobFit.scale} />
          </group>
        </group>
      </group>

      {/* The footage's cushion, as invisible geometry: hides the part of the
          bracelet that wraps behind/under it and catches the watch's shadow. */}
      <group ref={seatRig}>
        {/* Occluder sits just inside the bracelet loop so it never pokes through the links. */}
        <RoundedBox args={[CUSHION_WIDTH, 0.95, CUSHION_DEPTH - 0.17]} radius={0.2} smoothness={4} position={[0, -0.475, 0]} renderOrder={-1}>
          <meshBasicMaterial colorWrite={false} />
        </RoundedBox>
        <RoundedBox args={[CUSHION_WIDTH + 0.01, 0.955, CUSHION_DEPTH + 0.01]} radius={0.22} smoothness={4} position={[0, -0.475, 0]} receiveShadow>
          <shadowMaterial transparent opacity={0.55} color="#1f1004" polygonOffset polygonOffsetFactor={-2} />
        </RoundedBox>
        {/* The insert around the cushion well: solid blocks from the insert
            surface down to the well floor, so the bracelet disappears into the
            gap in front of / behind the cushion exactly like a real one. */}
        {INSERT_BLOCKS.map((b, i) => (
          <mesh key={i} position={b.position} renderOrder={-1}>
            <boxGeometry args={b.size} />
            <meshBasicMaterial colorWrite={false} />
          </mesh>
        ))}
        {/* Shadow on the insert surface (visible while the watch lifts). */}
        <mesh position={[0, INSERT_TOP + 0.002, 0]} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[4, 4]} />
          <shadowMaterial transparent opacity={0.4} color="#1f1004" />
        </mesh>
        <group ref={shadowTarget} />
        {/* Floor of the cushion well — nothing shows below it. */}
        <mesh position={[0, WELL_FLOOR, 0]} rotation-x={-Math.PI / 2} renderOrder={-1}>
          <planeGeometry args={[6, 6]} />
          <meshBasicMaterial colorWrite={false} />
        </mesh>
        <directionalLight
          ref={shadowLight}
          position={[-1.2, 3.2, 1.6]}
          intensity={0.001}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0004}
          shadow-radius={6}
          shadow-camera-left={-1.6}
          shadow-camera-right={1.6}
          shadow-camera-top={1.6}
          shadow-camera-bottom={-1.6}
          shadow-camera-near={0.5}
          shadow-camera-far={7}
        />
      </group>
    </>
  );
}

useGLTF.preload("/assets/models/emerald-watch.glb");
