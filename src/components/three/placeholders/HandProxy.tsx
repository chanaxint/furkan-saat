"use client";

/**
 * PLACEHOLDER — intentionally empty.
 * The realistic hand + wrist is a future GLB (ASSETS.story.hand). We do not
 * fake a human hand. The HandRig still animates an (empty) transform so the
 * choreography — back of hand to camera → wrist turn → exit — is already in
 * place, and the watch placeholder follows that rig exactly as it will once
 * mounted on the real wrist.
 *
 * Expected asset conventions:
 *   • +Z faces the camera when the dial is visible
 *   • An empty named "WatchMount" at the wrist, where the dial centre sits
 *   • Scale: dial diameter ≈ 2 units
 */
export function HandProxy() {
  return null;
}
