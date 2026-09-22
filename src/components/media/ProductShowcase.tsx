"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import type { ImageAsset, ModelAsset, VideoAsset } from "@/lib/assets";
import type { Tone } from "@/lib/data/types";
import { MediaSlot } from "./MediaSlot";

const ProductModelStage = dynamic(() => import("@/components/three/ProductModelStage"), { ssr: false });

type Props = {
  model?: ModelAsset;
  film?: VideoAsset;
  still?: ImageAsset;
  tone?: Tone;
  ratio?: string;
  hint?: string;
  className?: string;
  children?: ReactNode;
};

/**
 * ProductShowcase — one hero product, whichever medium exists.
 * Priority: 3D model → film → photograph → empty studio placeholder.
 */
export function ProductShowcase({ model, film, still, tone = "deep", ratio, hint, className, children }: Props) {
  if (model?.src) {
    return (
      <MediaSlot tone={tone} ratio={ratio} className={className} motif="stage">
        <ProductModelStage asset={model} />
        {children}
      </MediaSlot>
    );
  }
  return (
    <MediaSlot
      tone={tone}
      ratio={ratio}
      className={className}
      video={film && (film.webm || film.mp4) ? film : null}
      image={still?.src ?? null}
      alt={still?.alt}
      motif="stage"
      hint={hint}
    >
      {children}
    </MediaSlot>
  );
}
