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
  HERO_FOV,
  type HeroState,
  SPIN_AXIS_A,
  SPIN_AXIS_B,
} from "@/lib/scene/hero";
import { CUSHION_TRACK, HERO_VIDEO } from "@/lib/scene/heroTrack";
import { MOVEMENT_FILM } from "@/lib/scene/movement";
import { progress } from "@/lib/scene/progress";
import { SEAT_DEFAULTS, type SeatConfig } from "@/lib/scene/seat";
import { HeroLighting } from "./HeroLighting";

type Props = {
  state: HeroState;
  className?: string;
  onReady?: () => void;
  /** Seat on the cushion (defaults to seat.json; the /kontrol page passes live values). */
  seat?: SeatConfig;
  /** Show the hidden cushion / insert shapes in colour (control page). */
  debug?: boolean;
};

/**
 * HeroWatchScene — the WebGL layer composited over the footage.
 * Renders on demand: the scrubbed timeline wakes it on every update.
 */
export default function HeroWatchScene({ state, className, onReady, seat = SEAT_DEFAULTS, debug = false }: Props) {
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
          <HeroRig state={state} onReady={onReady} seat={seat} debug={debug} />
        </Suspense>
      </Canvas>
    </div>
  );
}

/* --------------------------------------------------------------- helpers */

/** Cushion-well geometry (table frame, cushion top centre at the origin). */
const WELL_FLOOR = -1.02;
type Block = { size: [number, number, number]; position: [number, number, number] };

/**
 * Insert around the cushion well: solid blocks from the insert surface down to
 * the well floor, so the bracelet disappears into the gap in front of / behind
 * the cushion exactly like a real one.
 */
function insertBlocks(seat: SeatConfig): Block[] {
  const wallH = seat.insertTop - WELL_FLOOR;
  const wallY = (seat.insertTop + WELL_FLOOR) / 2;
  const half = seat.cushionWidth / 2 + 0.04;
  const mid = (seat.wellFront + seat.wellBack) / 2;
  const len = seat.wellFront - seat.wellBack;
  return [
    { size: [4, wallH, 1.6], position: [0, wallY, seat.wellFront + 0.8] },
    { size: [4, wallH, 1.6], position: [0, wallY, seat.wellBack - 0.8] },
    { size: [1.4, wallH, len], position: [half + 0.7, wallY, mid] },
    { size: [1.4, wallH, len], position: [-(half + 0.7), wallY, mid] },
  ];
}

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

function HeroRig({
  state,
  onReady,
  seat,
  debug,
}: {
  state: HeroState;
  onReady?: () => void;
  seat: SeatConfig;
  debug: boolean;
}) {
  const blocks = useMemo(() => insertBlocks(seat), [seat]);
  const rolexAsset = ASSETS.showcase.watch as ModelAsset & { src: string };
  const nextAsset = ASSETS.hero.next;

  const rolexGltf = useGLTF(rolexAsset.src);
  // Without a second model file, the handover spins back into the Rolex.
  const nextGltf = useGLTF(nextAsset.src ?? rolexAsset.src);
  const rolex = useOwnedClone(rolexGltf.scene);
  const next = useOwnedClone(nextGltf.scene);

  const watch = useRef<Group>(null);
  const rolexRef = useRef<Group>(null);
  const nextRef = useRef<Group>(null);
  const seatRig = useRef<Group>(null);
  const shadowLight = useRef<DirectionalLight>(null);
  const warmKey = useRef<DirectionalLight>(null);
  const shadowTarget = useRef<Group>(null);

  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const invalidate = useThree((s) => s.invalidate);

  // Place the second model like the Rolex: its pivot (watch-head centre) at the
  // origin. Without a pivot it is centred on its bounding box and sized to match.
  const nextFit = useMemo(() => {
    if (!nextAsset.src) {
      const p = rolexAsset.pivot ?? [0, 0, 0];
      return { position: new Vector3(-p[0], -p[1], -p[2]), scale: 1 };
    }
    const scale = nextAsset.scale ?? 1;
    if (nextAsset.pivot) {
      const [px, py, pz] = nextAsset.pivot;
      return { position: new Vector3(-px * scale, -py * scale, -pz * scale), scale };
    }
    const box = new Box3().setFromObject(next.clone);
    const dims = box.getSize(new Vector3());
    const centre = box.getCenter(new Vector3());
    const fit = 1.9 / Math.max(dims.x, dims.y, dims.z);
    return { position: centre.multiplyScalar(-fit), scale: fit };
  }, [next.clone, nextAsset.src, nextAsset.pivot, nextAsset.scale, rolexAsset.pivot]);

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
      offset: new Vector3(),
      extra: new Quaternion(),
      extraE: new Euler(),
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
    applyFilmLock(camera, W, H, state.lock);

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
    const depth = (seat.cushionWidth * (H / 2)) / (cw * cover * tanHalf);
    const ndcX = (sx / W) * 2 - 1;
    const ndcY = 1 - (sy / H) * 2;
    tmp.anchor.set(ndcX * depth * tanHalf * aspect, ndcY * depth * tanHalf, -depth);

    // Table frame as seen by the footage camera.
    const elevation = (seat.footageElevation * Math.PI) / 180;
    tmp.boxQuat.setFromAxisAngle(X, elevation);
    tmp.up.set(0, Math.cos(elevation), Math.sin(elevation));
    // Seated: dial up, 12 o'clock toward the lid, plus the tuned extra rotation
    // (yaw about the table normal, then tilt, then roll).
    const d2r = Math.PI / 180;
    tmp.extraE.set(-Math.PI / 2 + seat.tilt * d2r, seat.yaw * d2r, seat.roll * d2r, "YXZ");
    tmp.extra.setFromEuler(tmp.extraE);
    tmp.seatQuat.copy(tmp.boxQuat).multiply(tmp.extra);
    // Tuned offset in the table frame; the lift rises along the table normal.
    tmp.offset.set(seat.offsetX, seat.offsetY + state.lift, seat.offsetZ).applyQuaternion(tmp.boxQuat);
    tmp.seatPos.copy(tmp.anchor).add(tmp.offset);

    if (seatRig.current) {
      seatRig.current.visible = (state.seat > 0.02 && state.film > 0.02) || debug;
      seatRig.current.position.copy(tmp.anchor);
      seatRig.current.quaternion.copy(tmp.boxQuat);
    }

    /* 2 — free pose (camera space) */
    const portrait = aspect < 1 ? 1 - aspect : 0;
    // While locked onto the movement film the pose must be exactly the one the
    // film was made from, so the portrait adjustments fade out with the lock.
    const lock = smooth(Math.min(1, Math.max(0, state.lock)));
    const pull = 1 + portrait * 1.35 * (1 - lock);
    // Portrait: the copy sits below the watch, so sideways shifts fade out.
    const xFactor = Math.max(0, 1 - portrait * 2) * (1 - lock) + lock;
    tmp.freePos.set(state.x * xFactor, state.y, state.z * pull);
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
      watch.current.scale.setScalar(state.scale + (seat.scale - state.scale) * k);
    }

    /* 4 — Rolex → Patek Philippe cross-fade */
    const sw = smooth(Math.min(1, Math.max(0, state.swap)));
    if (rolexRef.current) rolexRef.current.visible = sw < 0.999;
    if (nextRef.current) nextRef.current.visible = sw > 0.001;
    setOpacity(rolex.mats, 1 - sw);
    setOpacity(next.mats, sw);

    /* 5 — light: warm like the footage while on the cushion, studio after */
    if (warmKey.current) {
      warmKey.current.color.lerpColors(tmp.neutral, tmp.warm, state.film);
      warmKey.current.intensity = 0.25 + 1.9 * state.film;
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
        <group ref={nextRef} visible={false}>
          <group rotation={nextAsset.rotation ?? [0, 0, 0]}>
            <primitive object={next.clone} position={nextFit.position} scale={nextFit.scale} />
          </group>
        </group>
      </group>

      {/* The footage's cushion, as invisible geometry: hides the part of the
          bracelet that wraps behind/under it and catches the watch's shadow. */}
      <group ref={seatRig}>
        {/* Occluder sits just inside the bracelet loop so it never pokes through the links. */}
        <RoundedBox
          args={[seat.cushionWidth, seat.cushionHeight, Math.max(0.2, seat.cushionDepth - seat.occluderInset)]}
          radius={0.2}
          smoothness={4}
          position={[0, -seat.cushionHeight / 2, 0]}
          renderOrder={-1}
        >
          <HiddenMaterial debug={debug} color="#ff3b30" />
        </RoundedBox>
        <RoundedBox
          args={[seat.cushionWidth + 0.01, seat.cushionHeight + 0.005, seat.cushionDepth + 0.01]}
          radius={0.22}
          smoothness={4}
          position={[0, -seat.cushionHeight / 2, 0]}
          receiveShadow
        >
          <shadowMaterial transparent opacity={seat.shadowOpacity} color="#1f1004" polygonOffset polygonOffsetFactor={-2} />
        </RoundedBox>
        {blocks.map((b, i) => (
          <mesh key={i} position={b.position} renderOrder={-1}>
            <boxGeometry args={b.size} />
            <HiddenMaterial debug={debug} color="#2f7bff" />
          </mesh>
        ))}
        {/* Shadow on the insert surface (visible while the watch lifts). */}
        <mesh position={[0, seat.insertTop + 0.002, 0]} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[4, 4]} />
          <shadowMaterial transparent opacity={seat.shadowOpacity * 0.72} color="#1f1004" />
        </mesh>
        <group ref={shadowTarget} />
        {/* Floor of the cushion well — nothing shows below it. */}
        <mesh position={[0, WELL_FLOOR, 0]} rotation-x={-Math.PI / 2} renderOrder={-1}>
          <planeGeometry args={[6, 6]} />
          <HiddenMaterial debug={debug} color="#34c759" />
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

/**
 * Zoom the render onto the movement film's framing (a pure 2D magnification,
 * done with the camera's view offset, exactly like the film's own crop).
 *
 *   film cover-fit on screen:  screen = c·(A·s + t) + o
 *   our unzoomed render:       r = (H/900)·(s − ref/2) + (W,H)/2
 *   ⇒ screen = k·r + b,  k = c·A·900/H
 *
 * `lock` blends k from 1 and b from 0, so the zoom eases in with the turn.
 */
function applyFilmLock(camera: PerspectiveCamera, W: number, H: number, lockRaw: number) {
  const lock = smooth(Math.min(1, Math.max(0, lockRaw)));
  if (lock < 1e-4) {
    if (camera.view?.enabled) camera.clearViewOffset();
    return;
  }
  const F = MOVEMENT_FILM;
  const c = Math.max(W / F.width, H / F.height);
  const ox = (W - F.width * c) / 2;
  const oy = (H - F.height * c) / 2;
  const kT = (c * F.align.scale * F.ref.height) / H;
  const bx = -kT * (W / 2) + c * F.align.scale * (F.ref.width / 2) + c * F.align.tx + ox;
  const by = -kT * (H / 2) + c * F.align.scale * (F.ref.height / 2) + c * F.align.ty + oy;
  const k = 1 + (kT - 1) * lock;
  camera.setViewOffset(W * k, H * k, -bx * lock, -by * lock, W, H);
}

/** Invisible depth-only material; shown as a translucent colour on the control page. */
function HiddenMaterial({ debug, color }: { debug: boolean; color: string }) {
  // Distinct keys so React builds a fresh material instead of patching the old one.
  return debug ? (
    <meshBasicMaterial key="debug" color={color} colorWrite transparent opacity={0.32} depthWrite={false} />
  ) : (
    <meshBasicMaterial key="hidden" colorWrite={false} />
  );
}

useGLTF.preload("/assets/models/emerald-watch.glb");
useGLTF.preload("/assets/models/patek-celestial.glb");
