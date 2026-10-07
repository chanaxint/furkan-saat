"use client";

import { useState } from "react";

/**
 * A product card's frame that remembers which picture is showing. The second
 * photograph comes in when the mouse is over the card's link (photo or
 * text) and stays while it moves on to "Sepete ekle" or the heart; it goes
 * back only when the mouse leaves the card. Coming straight onto the button
 * from outside leaves the first photograph as it is. Styled with
 * `[data-hover-photo]`.
 */
export function HoverCard({ className, children, ...rest }: React.HTMLAttributes<HTMLElement>) {
  const [on, setOn] = useState(false);
  return (
    <article
      {...rest}
      className={className}
      data-hover-photo={on ? "" : undefined}
      onPointerOver={(e) => {
        if (e.pointerType === "mouse" && !on && (e.target as Element).closest("a")) setOn(true);
      }}
      onPointerLeave={() => setOn(false)}
    >
      {children}
    </article>
  );
}
